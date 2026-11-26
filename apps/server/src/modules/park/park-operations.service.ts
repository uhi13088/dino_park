import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PARK_GROWTH_OPERATIONS_MILESTONES, getBuildingById } from '@dino-park/game-data';
import {
  BuildingCategory,
  MAX_OFFLINE_HOURS,
  OFFLINE_REVENUE_RATE,
  PARK_ADMISSION,
  getParkLevelExperience,
  type ParkEntranceSide,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { getStorageLimits } from '../economy/park-storage-limits';
import {
  MARINE_OBSERVATION_FLAG,
  MARINE_STORY_RESEARCH_ID,
  qualifyingMarineExhibitIds,
} from '../story/story-scene-gates';
import {
  admissionDiagnosis,
  admissionResearch,
  admissionSnapshot,
  buildingSize,
  completionTime,
  contains,
  dinosaurCareBoundaries,
  dinosaurCareCheckpoint,
  entranceExit,
  entranceSides,
  footprint,
  type AdmissionWorld,
} from './park-admission.logic';
import { safariReservedTiles } from './park-safari-state';

type Tx = Prisma.TransactionClient;
type CareChange = { dinosaurIds: readonly string[] } | { buildingId: string };

const settlementResearch = {
  where: { OR: [...admissionResearch.where.OR, { technologyId: MARINE_STORY_RESEARCH_ID }] },
  select: admissionResearch.select,
};

const EVENT_EPSILON = 1e-9;
const DEPARTURE_EPSILON_MS = 0.001;
const operationsMilestones = Object.values(PARK_GROWTH_OPERATIONS_MILESTONES);

function safariBlocksEntranceExit(
  world: AdmissionWorld,
  entrance: AdmissionWorld['buildings'][number],
) {
  const exit = entranceExit(entrance, world);
  return (
    !!exit &&
    safariReservedTiles(world.safariLayout).some(({ x, y }) => x === exit.x && y === exit.y)
  );
}

function hasGoldRoomForTicket(gold: number, capacity: number) {
  return gold + PARK_ADMISSION.ticketPrice <= capacity;
}

function readDepartures(value: Prisma.JsonValue | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((at): at is number => typeof at === 'number' && Number.isFinite(at) && at > 0)
    .sort((a, b) => a - b);
}

export function getParkOccupancy(value: Prisma.JsonValue | undefined, at: number): number {
  return readDepartures(value).filter((departure) => departure > at).length;
}

type AdmissionLedger = {
  gold: number;
  visitors: number;
  maintenance: number;
  visitorCarry: number;
  upkeepCarry: number;
  departures: number[];
  departureHead: number;
};

function clearDepartures(ledger: AdmissionLedger, at: number) {
  while ((ledger.departures[ledger.departureHead] ?? Infinity) <= at + DEPARTURE_EPSILON_MS) {
    ledger.departureHead++;
  }
}

function settleAdmissionInterval(
  ledger: AdmissionLedger,
  start: number,
  end: number,
  visitorsPerSecond: number,
  upkeepPerSecond: number,
  capacity: number,
  goldCapacity: number,
) {
  const duration = (end - start) / 1000;
  let elapsed = 0;
  clearDepartures(ledger, start);
  let peakOccupancy = ledger.departures.length - ledger.departureHead;
  // Event timestamps keep queue, receipts and occupancy independent of polling intervals.
  while (elapsed < duration) {
    const arrivalRate = hasGoldRoomForTicket(ledger.gold, goldCapacity) ? visitorsPerSecond : 0;
    const untilArrival = arrivalRate > 0 ? (1 - ledger.visitorCarry) / arrivalRate : Infinity;
    const untilUpkeep = upkeepPerSecond > 0 ? (1 - ledger.upkeepCarry) / upkeepPerSecond : Infinity;
    const untilDeparture =
      ((ledger.departures[ledger.departureHead] ?? Infinity) - start) / 1000 - elapsed;
    const seconds = Math.min(duration - elapsed, untilArrival, untilUpkeep, untilDeparture);
    ledger.visitorCarry += arrivalRate * seconds;
    ledger.upkeepCarry += upkeepPerSecond * seconds;
    elapsed += seconds;
    const at = start + elapsed * 1000;
    // A visitor departing at the same time frees a seat for the incoming visitor.
    clearDepartures(ledger, at);

    if (ledger.upkeepCarry >= 1 - EVENT_EPSILON) {
      ledger.upkeepCarry = Math.max(0, ledger.upkeepCarry - 1);
      if (ledger.gold > 0) {
        ledger.gold--;
        ledger.maintenance++;
      }
    }
    if (ledger.visitorCarry >= 1 - EVENT_EPSILON) {
      ledger.visitorCarry = Math.max(0, ledger.visitorCarry - 1);
      if (ledger.departures.length - ledger.departureHead < capacity) {
        ledger.gold += PARK_ADMISSION.ticketPrice;
        ledger.visitors++;
        ledger.departures.push(at + PARK_ADMISSION.visitSeconds * 1000);
        peakOccupancy = Math.max(peakOccupancy, ledger.departures.length - ledger.departureHead);
      }
    }
    if (!hasGoldRoomForTicket(ledger.gold, goldCapacity)) ledger.visitorCarry = 0;
  }
  return peakOccupancy;
}

@Injectable()
export class ParkOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All demand-changing writes use this park lock before touching animals/currency. */
  async settleInTransaction(
    tx: Tx,
    userId: string,
    heartbeat = false,
    now?: Date,
    careChange?: CareChange,
  ) {
    await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${userId} FOR UPDATE`;
    const park = await tx.park.findUnique({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: settlementResearch },
    });
    if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
    await tx.$queryRaw`SELECT id FROM currencies WHERE "userId" = ${userId} FOR UPDATE`;
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const wallTime = now ?? new Date();
    const from = park.economySettledAt?.getTime() ?? wallTime.getTime();
    const end = Math.max(from, wallTime.getTime());
    const openingLimits = getStorageLimits(park.buildings, from);
    const ledger: AdmissionLedger = {
      gold: currency.gold,
      visitors: 0,
      maintenance: 0,
      visitorCarry: hasGoldRoomForTicket(currency.gold, openingLimits.goldCapacity)
        ? park.visitorRemainder
        : 0,
      upkeepCarry: park.maintenanceRemainder,
      departures: readDepartures(park.visitorDepartures),
      departureHead: 0,
    };
    const achievedMilestones = new Set<string>();
    if (park.admissionCareCompleted && end > from) {
      const onlineUntil = park.onlineUntil?.getTime() ?? from;
      const offlineCap = onlineUntil + MAX_OFFLINE_HOURS * 3600000;
      const points = new Set([from, end]);
      for (const point of [
        onlineUntil,
        offlineCap,
        ...park.buildings.map(completionTime),
        ...park.buildings.map((b) => b.createdAt.getTime()),
        ...park.dinosaurs.map((d) => d.createdAt.getTime()),
        ...(park.technologyResearch ?? []).map((research) => research.completesAt.getTime()),
      ]) {
        if (point !== null && point > from && point < end) points.add(point);
      }
      // Integrate each state interval exactly, independent of polling partitions.
      for (const dino of park.dinosaurs) {
        for (const point of dinosaurCareBoundaries(dino, park, from, Math.min(end, offlineCap)))
          points.add(point);
      }
      const sorted = [...points].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i],
          b = sorted[i + 1];
        const factor = a < onlineUntil ? 1 : a < offlineCap ? OFFLINE_REVENUE_RATE : 0;
        if (!factor) continue;
        const snapshot = admissionSnapshot(park, a);
        const previouslyPaid = ledger.visitors;
        const peakOccupancy = settleAdmissionInterval(
          ledger,
          a,
          b,
          (snapshot.visitorsPerMinute * factor) / 60,
          (snapshot.hourlyMaintenance * factor) / 3600,
          snapshot.occupancyCapacity,
          getStorageLimits(park.buildings, a).goldCapacity,
        );
        if (snapshot.admittingVisitors) {
          if (
            ledger.visitors > previouslyPaid &&
            !achievedMilestones.has(MARINE_OBSERVATION_FLAG)
          ) {
            const marineExhibits = qualifyingMarineExhibitIds(park, snapshot, a);
            if (
              marineExhibits.size &&
              admissionDiagnosis(snapshot, undefined, a, peakOccupancy).exhibits.some(
                ({ id, visitors }) => (visitors ?? 0) > 0 && marineExhibits.has(id),
              )
            )
              achievedMilestones.add(MARINE_OBSERVATION_FLAG);
          }
          for (const milestone of operationsMilestones) {
            if (snapshot.exhibits.size >= milestone.exhibits && peakOccupancy >= milestone.visitors)
              achievedMilestones.add(milestone.flagId);
          }
        }
      }
    }
    if (achievedMilestones.size) {
      // Keep these achievements independent of the route used to earn the level's XP.
      const recorded = await tx.storyFlag.findMany({
        where: { userId, flagId: { in: [...achievedMilestones] } },
        select: { flagId: true },
      });
      for (const { flagId } of recorded) achievedMilestones.delete(flagId);
      if (achievedMilestones.size) {
        await tx.storyFlag.createMany({
          data: [...achievedMilestones].map((flagId) => ({ userId, flagId, value: true })),
          skipDuplicates: true,
        });
      }
    }
    // Departure times still pass outside a payable operating window.
    clearDepartures(ledger, end);
    const { visitors, maintenance } = ledger;
    const gross = visitors * PARK_ADMISSION.ticketPrice;
    let level = park.level,
      exp = park.exp;
    const reward =
      !park.firstVisitorsRewarded &&
      park.totalVisitors + visitors >= PARK_ADMISSION.firstVisitorsTarget;
    if (reward) {
      exp += PARK_ADMISSION.firstVisitorsXp;
      while (level < 50 && exp >= getParkLevelExperience(level)) {
        exp -= getParkLevelExperience(level);
        level++;
      }
    }
    await tx.park.update({
      where: { id: park.id },
      data: {
        economySettledAt: new Date(end),
        ...(heartbeat
          ? { onlineUntil: new Date(end + PARK_ADMISSION.onlineGraceSeconds * 1000) }
          : {}),
        visitorRemainder: ledger.visitorCarry,
        visitorDepartures: ledger.departures.slice(ledger.departureHead),
        maintenanceRemainder: ledger.upkeepCarry,
        totalVisitors: { increment: visitors },
        totalAdmissionGold: { increment: gross },
        ...(reward ? { firstVisitorsRewarded: true, level, exp } : {}),
      },
    });
    if (gross || maintenance) {
      const grossBalance = currency.gold + gross;
      // Receipts are aggregates. Post upkeep first if it already fits the opening
      // balance and avoids showing a temporary aggregate above the vault limit.
      const upkeepFirst =
        grossBalance > getStorageLimits(park.buildings, end).goldCapacity &&
        maintenance <= currency.gold;
      const admissionReceipt = gross
        ? {
            userId,
            type: 'EARN' as const,
            currencyType: 'gold',
            amount: gross,
            reason: '방문객 입장료',
            balanceAfter: upkeepFirst ? ledger.gold : grossBalance,
          }
        : null;
      const upkeepReceipt = maintenance
        ? {
            userId,
            type: 'SPEND' as const,
            currencyType: 'gold',
            amount: -maintenance,
            reason: '파크 운영 유지비',
            balanceAfter: upkeepFirst ? currency.gold - maintenance : ledger.gold,
          }
        : null;
      await tx.currency.update({
        where: { userId },
        data: { gold: { increment: gross - maintenance } },
      });
      const receipts = upkeepFirst
        ? [upkeepReceipt, admissionReceipt]
        : [admissionReceipt, upkeepReceipt];
      for (const data of receipts) if (data) await tx.transaction.create({ data });
    }
    const finished = park.buildings.filter(
      (b) => b.status !== 'ACTIVE' && (completionTime(b) ?? Infinity) <= end,
    );
    const changedHabitats = [...finished];
    if (careChange && 'buildingId' in careChange) {
      const building = park.buildings.find(({ id }) => id === careChange.buildingId);
      if (building) changedHabitats.push(building);
    }
    const habitats = changedHabitats.filter(
      ({ typeId }) => getBuildingById(typeId)?.category === BuildingCategory.DINOSAUR,
    );
    const dinosaurIds = careChange && 'dinosaurIds' in careChange ? careChange.dinosaurIds : [];
    for (const dinosaur of park.dinosaurs) {
      const inChangedHabitat =
        dinosaur.isInPark &&
        habitats.some((habitat) =>
          contains(habitat, { x: dinosaur.positionX, y: dinosaur.positionY }),
        );
      if (!dinosaurIds.includes(dinosaur.id) && !inChangedHabitat) continue;
      // Natural completion clears completesAt, so retain the exact accrued care phase first.
      const careProgress = dinosaurCareCheckpoint(dinosaur, park, end);
      if (careProgress)
        await tx.dinosaur.update({ where: { id: dinosaur.id }, data: { careProgress } });
    }
    if (finished.length)
      await tx.building.updateMany({
        where: { id: { in: finished.map(({ id }) => id) } },
        data: { status: 'ACTIVE', completesAt: null },
      });
    return {
      visitors,
      gross,
      maintenance,
      elapsedHours: (end - from) / 3600000,
      settledAt: new Date(end),
    };
  }

  async getOperations(userId: string, heartbeat = true): Promise<ParkOperationsResponse> {
    return this.prisma.$transaction(async (tx) => {
      await this.settleInTransaction(tx, userId, heartbeat);
      return this.readOperationsInTransaction(tx, userId);
    });
  }

  async readOperationsInTransaction(tx: Tx, userId: string): Promise<ParkOperationsResponse> {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
    });
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const at = Date.now();
    const snapshot = admissionSnapshot(park, at);
    const occupancy = getParkOccupancy(park.visitorDepartures, at);
    const entrance = snapshot.entrance;
    const platform = park.buildings.find((b) => b.typeId === PARK_ADMISSION.platformTypeId);
    const { goldCapacity } = getStorageLimits(park.buildings, at);
    const admissionPaused = !hasGoldRoomForTicket(currency.gold, goldCapacity);
    return {
      isOpen: park.isOpen,
      canOpen: snapshot.canOpen,
      openingRequirements: snapshot.requirements,
      ticketPrice: PARK_ADMISSION.ticketPrice,
      visitorsPerMinute: snapshot.visitorsPerMinute,
      demandPerMinute: snapshot.demand,
      capacity: snapshot.capacity,
      occupancy: {
        current: occupancy,
        capacity: snapshot.occupancyCapacity,
        visitSeconds: PARK_ADMISSION.visitSeconds,
      },
      admission: admissionDiagnosis(snapshot, platform, at, occupancy),
      shuttle: snapshot.shuttle.state,
      totalVisitors: park.totalVisitors,
      totalAdmissionGold: park.totalAdmissionGold,
      hourlyMaintenance: snapshot.hourlyMaintenance,
      gold: currency.gold,
      goldVault: {
        capacity: goldCapacity,
        admissionPaused,
      },
      parkLevel: park.level,
      firstVisitorsGoal: {
        current: Math.min(park.totalVisitors, PARK_ADMISSION.firstVisitorsTarget),
        target: PARK_ADMISSION.firstVisitorsTarget,
        rewarded: park.firstVisitorsRewarded,
      },
      pathTiles: snapshot.pathTiles,
      entrance: entrance
        ? {
            id: entrance.id,
            x: entrance.positionX,
            y: entrance.positionY,
            ...buildingSize(entrance),
            onBoundary: snapshot.entranceSide !== null,
            side: snapshot.entranceSide,
          }
        : null,
      suggestedEntrance:
        entrance && snapshot.entranceSide === null ? this.suggestEntrance(park, entrance.id) : null,
      viewingPlatform: platform
        ? {
            id: platform.id,
            level: platform.level,
            status: platform.status,
            completesAt: platform.completesAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private suggestEntrance(world: AdmissionWorld, entranceId: string) {
    const entrance = world.buildings.find((b) => b.id === entranceId)!;
    const { width, height } = buildingSize(entrance);
    const candidates = [];
    for (let x = 0; x <= world.gridSizeX - width; x++)
      candidates.push({ x, y: world.gridSizeY - height });
    for (let y = 0; y <= world.gridSizeY - height; y++)
      candidates.push({ x: world.gridSizeX - width, y });
    for (const point of candidates.sort(
      (a, b) =>
        Math.abs(a.x - entrance.positionX) +
        Math.abs(a.y - entrance.positionY) -
        Math.abs(b.x - entrance.positionX) -
        Math.abs(b.y - entrance.positionY),
    )) {
      if (!this.positionFree(world, entranceId, point.x, point.y)) continue;
      const gate = { ...entrance, positionX: point.x, positionY: point.y };
      if (!safariBlocksEntranceExit(world, gate)) return point;
    }
    return null;
  }

  positionFree(
    world: AdmissionWorld,
    excludedId: string | null,
    x: number,
    y: number,
    typeId?: string,
  ) {
    const source = world.buildings.find((b) => b.id === excludedId);
    const size = source
      ? buildingSize(source)
      : (getBuildingById(typeId ?? '')?.size ?? { width: 1, height: 1 });
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x + size.width > world.gridSizeX ||
      y + size.height > world.gridSizeY
    )
      return false;
    const occupied = new Set(
      world.buildings
        .filter((b) => b.id !== excludedId)
        .flatMap(footprint)
        .map((t) => `${t.x},${t.y}`),
    );
    safariReservedTiles(world.safariLayout).forEach(({ x, y }) => occupied.add(`${x},${y}`));
    world.dinosaurs
      .filter((d) => d.isInPark)
      .forEach((d) => occupied.add(`${d.positionX},${d.positionY}`));
    for (let dx = 0; dx < size.width; dx++)
      for (let dy = 0; dy < size.height; dy++)
        if (occupied.has(`${x + dx},${y + dy}`)) return false;
    return true;
  }

  async setOpen(userId: string, isOpen: boolean) {
    return this.prisma.$transaction(async (tx) => {
      await this.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({
        where: { userId },
        include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
      });
      const snapshot = admissionSnapshot(park, Date.now());
      if (isOpen && !snapshot.canOpen)
        throw new BadRequestException(snapshot.requirements.join(' '));
      await tx.park.update({
        where: { id: park.id },
        data: { isOpen, ...(isOpen ? { admissionCareCompleted: true } : {}) },
      });
      return this.readOperationsInTransaction(tx, userId);
    });
  }

  async moveEntrance(
    userId: string,
    positionX: number,
    positionY: number,
    side?: ParkEntranceSide,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({
        where: { userId },
        include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
      });
      const entrance = park.buildings.find((b) => b.typeId === PARK_ADMISSION.entranceTypeId);
      if (!entrance) throw new BadRequestException('입구 게이트가 없습니다.');
      const sides = entranceSides({ ...entrance, positionX, positionY }, park);
      if (!sides.length || !this.positionFree(park, entrance.id, positionX, positionY))
        throw new BadRequestException('다른 시설·공룡과 겹치지 않는 파크 테두리를 선택해주세요.');
      const entranceSide =
        side === undefined
          ? (sides.find((candidate) => candidate === entrance.entranceSide) ?? sides[0])
          : sides.find((candidate) => candidate === side);
      if (!entranceSide) throw new BadRequestException('선택한 방향이 파크 테두리에 닿지 않아요.');
      const position = { positionX, positionY, entranceSide };
      if (safariBlocksEntranceExit(park, { ...entrance, ...position }))
        throw new BadRequestException('입구 안쪽 통로는 사파리 울타리와 지프길을 피해주세요.');
      const next = {
        ...park,
        buildings: park.buildings.map((b) => (b.id === entrance.id ? { ...b, ...position } : b)),
      };
      if (park.isOpen && !admissionSnapshot(next, Date.now()).canOpen)
        throw new BadRequestException('방문객 길이 이어지는 위치로 옮겨주세요.');
      await tx.building.update({ where: { id: entrance.id }, data: position });
      return this.readOperationsInTransaction(tx, userId);
    });
  }
}
