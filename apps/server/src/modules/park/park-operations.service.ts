import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getBuildingById } from '@dino-park/game-data';
import {
  HAPPINESS_DECAY_PER_HOUR,
  HUNGER_INCREASE_PER_HOUR,
  MAX_OFFLINE_HOURS,
  OFFLINE_REVENUE_RATE,
  PARK_ADMISSION,
  getParkLevelExperience,
  type ParkOperationsResponse,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  admissionResearch,
  admissionSnapshot,
  buildingSize,
  completionTime,
  footprint,
  onBoundary,
  type AdmissionWorld,
} from './park-admission.logic';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ParkOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All demand-changing writes use this park lock before touching animals/currency. */
  async settleInTransaction(tx: Tx, userId: string, heartbeat = false, now?: Date) {
    await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${userId} FOR UPDATE`;
    const park = await tx.park.findUnique({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
    });
    if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');
    await tx.$queryRaw`SELECT id FROM currencies WHERE "userId" = ${userId} FOR UPDATE`;
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const wallTime = now ?? new Date();
    const from = park.economySettledAt?.getTime() ?? wallTime.getTime();
    const end = Math.max(from, wallTime.getTime());
    let visitors = 0,
      gross = 0,
      maintenance = 0;
    let visitorCarry = park.visitorRemainder,
      upkeepCarry = park.maintenanceRemainder;
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
        const fed = dino.lastFedAt.getTime();
        for (const period of [
          3600000 / HAPPINESS_DECAY_PER_HOUR,
          3600000 / HUNGER_INCREASE_PER_HOUR,
        ]) {
          for (
            let p = fed + (Math.floor((from - fed) / period) + 1) * period;
            p < Math.min(end, offlineCap);
            p += period
          ) {
            if (p > from) points.add(p);
          }
        }
      }
      const sorted = [...points].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i],
          b = sorted[i + 1];
        const factor = a < onlineUntil ? 1 : a < offlineCap ? OFFLINE_REVENUE_RATE : 0;
        if (!factor) continue;
        const snapshot = admissionSnapshot(park, a);
        const seconds = (b - a) / 1000;
        visitorCarry += ((snapshot.visitorsPerMinute * seconds) / 60) * factor;
        upkeepCarry += ((snapshot.hourlyMaintenance * seconds) / 3600) * factor;
      }
      visitors = Math.floor(visitorCarry + 1e-9);
      visitorCarry = Math.max(0, visitorCarry - visitors);
      gross = visitors * PARK_ADMISSION.ticketPrice;
      const due = Math.floor(upkeepCarry + 1e-9);
      upkeepCarry = Math.max(0, upkeepCarry - due);
      maintenance = Math.min(currency.gold + gross, due);
    }
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
        visitorRemainder: visitorCarry,
        maintenanceRemainder: upkeepCarry,
        totalVisitors: { increment: visitors },
        totalAdmissionGold: { increment: gross },
        ...(reward ? { firstVisitorsRewarded: true, level, exp } : {}),
      },
    });
    if (gross || maintenance) {
      const updated = await tx.currency.update({
        where: { userId },
        data: { gold: { increment: gross - maintenance } },
      });
      if (gross)
        await tx.transaction.create({
          data: {
            userId,
            type: 'EARN',
            currencyType: 'gold',
            amount: gross,
            reason: '방문객 입장료',
            balanceAfter: updated.gold + maintenance,
          },
        });
      if (maintenance)
        await tx.transaction.create({
          data: {
            userId,
            type: 'SPEND',
            currencyType: 'gold',
            amount: -maintenance,
            reason: '파크 운영 유지비',
            balanceAfter: updated.gold,
          },
        });
    }
    const finished = park.buildings
      .filter((b) => b.status !== 'ACTIVE' && (completionTime(b) ?? Infinity) <= end)
      .map((b) => b.id);
    if (finished.length)
      await tx.building.updateMany({
        where: { id: { in: finished } },
        data: { status: 'ACTIVE', completesAt: null },
      });
    return { visitors, gross, maintenance, elapsedHours: (end - from) / 3600000 };
  }

  async getOperations(userId: string, heartbeat = true): Promise<ParkOperationsResponse> {
    return this.prisma.$transaction(async (tx) => {
      await this.settleInTransaction(tx, userId, heartbeat);
      return this.response(tx, userId);
    });
  }

  private async response(tx: Tx, userId: string): Promise<ParkOperationsResponse> {
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
    });
    const currency = await tx.currency.findUniqueOrThrow({ where: { userId } });
    const snapshot = admissionSnapshot(park, Date.now());
    const entrance = snapshot.entrance;
    const platform = park.buildings.find((b) => b.typeId === PARK_ADMISSION.platformTypeId);
    return {
      isOpen: park.isOpen,
      canOpen: snapshot.canOpen,
      openingRequirements: snapshot.requirements,
      ticketPrice: PARK_ADMISSION.ticketPrice,
      visitorsPerMinute: snapshot.visitorsPerMinute,
      demandPerMinute: snapshot.demand,
      capacity: snapshot.capacity,
      totalVisitors: park.totalVisitors,
      totalAdmissionGold: park.totalAdmissionGold,
      hourlyMaintenance: snapshot.hourlyMaintenance,
      gold: currency.gold,
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
            onBoundary: onBoundary(entrance, park),
          }
        : null,
      suggestedEntrance:
        entrance && !onBoundary(entrance, park) ? this.suggestEntrance(park, entrance.id) : null,
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
      if (this.positionFree(world, entranceId, point.x, point.y)) return point;
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
      return this.response(tx, userId);
    });
  }

  async moveEntrance(userId: string, positionX: number, positionY: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.settleInTransaction(tx, userId, true);
      const park = await tx.park.findUniqueOrThrow({
        where: { userId },
        include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
      });
      const entrance = park.buildings.find((b) => b.typeId === PARK_ADMISSION.entranceTypeId);
      if (!entrance) throw new BadRequestException('입구 게이트가 없습니다.');
      if (
        !this.positionFree(park, entrance.id, positionX, positionY) ||
        !onBoundary({ ...entrance, positionX, positionY }, park)
      )
        throw new BadRequestException('다른 시설·공룡과 겹치지 않는 파크 테두리를 선택해주세요.');
      const next = {
        ...park,
        buildings: park.buildings.map((b) =>
          b.id === entrance.id ? { ...b, positionX, positionY } : b,
        ),
      };
      if (park.isOpen && !admissionSnapshot(next, Date.now()).canOpen)
        throw new BadRequestException('방문객 길이 이어지는 위치로 옮겨주세요.');
      await tx.building.update({ where: { id: entrance.id }, data: { positionX, positionY } });
      return this.response(tx, userId);
    });
  }
}
