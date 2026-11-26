import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { SECURITY_CENTER_TYPE_ID, resolveDinosaurSpecies } from '@dino-park/game-data';
import {
  PARK_SAFARI,
  SAFARI_ZONES,
  getSafariExpansionGold,
  getSafariTour,
  inspectSafariLayout,
  isSafariRouteUsable,
  type ParkSafariResponse,
  type SafariBounds,
  type SafariDinosaur,
  type SafariLayout,
  type SafariTile,
} from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import {
  activeAt,
  admissionResearch,
  admissionSnapshot,
  entranceExit,
  footprint,
  safariExhibitSafetyIssue,
} from './park-admission.logic';
import { ParkOperationsService } from './park-operations.service';
import { readSafariLayout, readSafariState, type SafariState } from './park-safari-state';

const safariParkQuery = {
  buildings: true,
  dinosaurs: true,
  technologyResearch: admissionResearch,
} as const;
type SafariPark = Prisma.ParkGetPayload<{ include: typeof safariParkQuery }>;
type Tx = Prisma.TransactionClient;

const key = ({ x, y }: SafariTile) => `${x},${y}`;

function listSafariDinosaurs(park: SafariPark): SafariDinosaur[] {
  return park.dinosaurs.flatMap((dinosaur) => {
    const species = resolveDinosaurSpecies(dinosaur);
    if (!species) return [];
    const zoneKind = PARK_SAFARI.species[species.id as keyof typeof PARK_SAFARI.species];
    if (!zoneKind) return [];
    return {
      id: dinosaur.id,
      speciesId: species.id,
      name: dinosaur.nickname || species.nameKo,
      zoneKind,
      space: species.stats.space,
      isInPark: dinosaur.isInPark,
    };
  });
}

function validateDinosaurs(layout: SafariLayout, available: SafariDinosaur[]) {
  const byId = new Map(available.map((dinosaur) => [dinosaur.id, dinosaur]));
  const assigned = new Set<string>();
  for (const kind of SAFARI_ZONES) {
    const zone = layout.zones[kind];
    let space = 0;
    for (const id of zone.dinosaurIds) {
      const dinosaur = byId.get(id);
      if (!dinosaur || dinosaur.zoneKind !== kind)
        throw new BadRequestException('이 우리에 배치할 수 있는 보유 공룡을 골라주세요.');
      if (assigned.has(id)) throw new BadRequestException('같은 공룡은 한 번만 배치할 수 있어요.');
      assigned.add(id);
      space += dinosaur.space;
    }
    if (space > zone.tiles.length)
      throw new BadRequestException('공룡들이 함께 지낼 수 있도록 우리를 넓혀주세요.');
    if (kind === 'carnivore' && zone.dinosaurIds.length > 1)
      throw new BadRequestException('티라노사우루스는 한 우리에 한 마리씩 배치해주세요.');
  }
  return [...assigned];
}

function blockedTilesForSafari(park: SafariPark, at: number) {
  const admission = admissionSnapshot(park, at);
  const exit = admission.entrance && entranceExit(admission.entrance, park);
  const reserved = [
    ...park.buildings.flatMap(footprint),
    ...park.dinosaurs
      .filter(({ isInPark }) => isInPark)
      .map(({ positionX: x, positionY: y }) => ({ x, y })),
    ...admission.pathTiles,
    ...(exit ? [exit] : []),
  ];
  return [...new Map(reserved.map((tile) => [key(tile), tile])).values()];
}

function withAvailableDinosaurs(layout: SafariLayout, available: SafariDinosaur[]): SafariLayout {
  const byId = new Map(available.map((dinosaur) => [dinosaur.id, dinosaur]));
  const filter = (kind: SafariDinosaur['zoneKind']) => ({
    ...layout.zones[kind],
    dinosaurIds: layout.zones[kind].dinosaurIds.filter((id) => {
      const dinosaur = byId.get(id);
      return dinosaur?.zoneKind === kind && !dinosaur.isInPark;
    }),
  });
  return {
    zones: { herbivore: filter('herbivore'), carnivore: filter('carnivore') },
    stops: layout.stops,
  };
}

function updateSavedRoute(
  saved: SafariState,
  bounds: SafariBounds,
  blocked: readonly SafariTile[],
): SafariState {
  const { layout } = saved;
  const [first, previousStop] = layout.stops;
  const { tiles, water, brush } = layout.zones.carnivore;
  if (!first || !previousStop || isSafariRouteUsable(layout, bounds, blocked, saved.path))
    return saved;

  const props = new Set([...water, ...brush].map(key));
  const distance = ({ x, y }: SafariTile) =>
    Math.abs(x - previousStop.x) + Math.abs(y - previousStop.y);
  const candidates = tiles
    .filter((tile) => !props.has(key(tile)))
    .sort((a, b) => distance(a) - distance(b) || a.y - b.y || a.x - b.x);
  const revision = saved.revision + 1;
  for (const stop of candidates) {
    const migratedLayout = { ...layout, stops: [first, stop] };
    const { issue, path } = inspectSafariLayout(migratedLayout, bounds, blocked, {
      existingCarnivoreTiles: tiles,
    });
    if (!issue) return { ...saved, revision, layout: migratedLayout, path };
  }
  return { ...saved, revision, layout: { ...layout, stops: [] }, path: [] };
}

function updateSafariState(tx: Tx, parkId: string, state: SafariState) {
  return tx.park.update({
    where: { id: parkId },
    data: { safariLayout: state as unknown as Prisma.InputJsonValue },
  });
}

@Injectable()
export class ParkSafariService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  get(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const { settledAt } = await this.operations.settleInTransaction(tx, userId, true);
      return this.response(tx, userId, settledAt.getTime());
    });
  }

  save(userId: string, revision: number, input: unknown) {
    const layout = readSafariLayout(input);
    if (!layout) throw new BadRequestException('우리, 장식, 정차 지점의 배치를 확인해주세요.');
    return this.prisma.$transaction(async (tx) => {
      const { settledAt } = await this.operations.settleInTransaction(tx, userId, true, undefined, {
        dinosaurIds: SAFARI_ZONES.flatMap((kind) => layout.zones[kind].dinosaurIds),
      });
      const at = settledAt.getTime();
      const park = await tx.park.findUniqueOrThrow({ where: { userId }, include: safariParkQuery });
      if (park.level < PARK_SAFARI.unlockParkLevel)
        throw new BadRequestException(
          `파크 Lv.${PARK_SAFARI.unlockParkLevel}부터 사파리를 꾸밀 수 있어요.`,
        );
      const saved = readSafariState(park.safariLayout);
      if (revision !== saved.revision) {
        if (
          revision + 1 === saved.revision &&
          JSON.stringify(layout) === JSON.stringify(saved.layout)
        )
          return this.response(tx, userId, at, park);
        throw new ConflictException('다른 화면에서 사파리를 바꿨어요. 최신 배치를 불러와주세요.');
      }

      const blocked = blockedTilesForSafari(park, at);
      const bounds = { width: park.gridSizeX, height: park.gridSizeY };
      const review = inspectSafariLayout(layout, bounds, blocked, {
        existingCarnivoreTiles: saved.layout.zones.carnivore.tiles,
      });
      if (review.issue) throw new BadRequestException(review.issue);
      const assigned = validateDinosaurs(layout, listSafariDinosaurs(park));
      const safetyIssue = safariExhibitSafetyIssue(park, layout.zones.carnivore.dinosaurIds, at);
      if (safetyIssue) throw new BadRequestException(safetyIssue);
      const gold = getSafariExpansionGold(layout, saved.purchasedTiles);
      if (gold) await this.resources.spendGold(tx, userId, gold, '사파리 우리 부지 구매');
      if (assigned.length)
        await tx.dinosaur.updateMany({
          where: { parkId: park.id, isInPark: true, id: { in: assigned } },
          data: { isInPark: false },
        });
      const next = {
        revision: saved.revision + 1,
        layout,
        purchasedTiles: {
          herbivore: Math.max(saved.purchasedTiles.herbivore, layout.zones.herbivore.tiles.length),
          carnivore: Math.max(saved.purchasedTiles.carnivore, layout.zones.carnivore.tiles.length),
        },
        path: isSafariRouteUsable(layout, bounds, blocked, saved.path) ? saved.path : review.path,
      };
      await updateSafariState(tx, park.id, next);
      return this.response(tx, userId, at);
    });
  }

  private async response(
    tx: Tx,
    userId: string,
    at: number,
    existing?: SafariPark,
  ): Promise<ParkSafariResponse> {
    const [park, { gold }] = await Promise.all([
      existing ?? tx.park.findUniqueOrThrow({ where: { userId }, include: safariParkQuery }),
      tx.currency.findUniqueOrThrow({ where: { userId }, select: { gold: true } }),
    ]);
    const bounds = { width: park.gridSizeX, height: park.gridSizeY };
    const blocked = blockedTilesForSafari(park, at);
    const original = readSafariState(park.safariLayout);
    const saved = updateSavedRoute(original, bounds, blocked);
    if (saved !== original) await updateSafariState(tx, park.id, saved);
    const dinosaurs = listSafariDinosaurs(park);
    const layout = withAvailableDinosaurs(saved.layout, dinosaurs);
    const carnivoreUnavailableReason = park.buildings.some(
      (building) => building.typeId === SECURITY_CENTER_TYPE_ID && activeAt(building, at),
    )
      ? null
      : '육식 우리에 공룡을 배치하려면 보안센터를 먼저 완공해주세요.';
    return {
      revision: saved.revision,
      parkLevel: park.level,
      gold,
      bounds,
      blockedTiles:
        saved === original
          ? blocked
          : blockedTilesForSafari(
              { ...park, safariLayout: saved as unknown as Prisma.JsonValue },
              at,
            ),
      dinosaurs,
      layout,
      purchasedTiles: saved.purchasedTiles,
      carnivoreUnavailableReason,
      tour: getSafariTour(layout, saved.path),
    };
  }
}
