import { Injectable, NotFoundException } from '@nestjs/common';
import type { DinosaurCodexEntry, DinosaurCodexResponse } from '@dino-park/shared';
import {
  DINOSAUR_DATA,
  getCodexAcquisition,
  getCodexHabitatName,
  getCodexImageUrl,
  getDinosaurOrigin,
  getSynthesisRecipe,
  SYNTHESIS_RULES,
} from '@dino-park/game-data';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DinosaurCodexService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string): Promise<DinosaurCodexResponse> {
    return this.prisma.$transaction(async (tx) => {
      const park = await tx.park.findUnique({ where: { userId }, select: { id: true } });
      if (!park) throw new NotFoundException('파크를 찾을 수 없습니다.');

      const dinosaurs = await tx.dinosaur.findMany({
        where: { parkId: park.id },
        select: { speciesId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      const owned = new Map<string, number>();
      const firstDates = new Map<string, Date>();
      for (const dinosaur of dinosaurs) {
        owned.set(dinosaur.speciesId, (owned.get(dinosaur.speciesId) ?? 0) + 1);
        if (!firstDates.has(dinosaur.speciesId))
          firstDates.set(dinosaur.speciesId, dinosaur.createdAt);
      }
      // 기존 저장 개체를 실제 최초 획득 시각으로 반영. 재조회/동시 요청은 등록을 늘리지 않는다.
      if (firstDates.size) {
        await tx.dinosaurCollection.createMany({
          data: [...firstDates].map(([speciesId, firstCollectedAt]) => ({
            parkId: park.id,
            speciesId,
            firstCollectedAt,
          })),
          skipDuplicates: true,
        });
      }
      const registrations = await tx.dinosaurCollection.findMany({ where: { parkId: park.id } });
      const registered = new Map(
        registrations.map((entry) => [entry.speciesId, entry.firstCollectedAt]),
      );
      const entries: DinosaurCodexEntry[] = DINOSAUR_DATA.map((species) => {
        const recipe = getSynthesisRecipe(species.id);
        return {
          speciesId: species.id,
          name: species.name,
          nameKo: species.nameKo,
          rarity: species.rarity,
          category: species.category,
          origin: getDinosaurOrigin(species),
          size: species.size,
          description: species.description,
          habitatNames: species.habitat.map(getCodexHabitatName),
          popularity: species.stats.popularity,
          maintenanceCost: species.stats.maintenanceCost,
          hatchTimeMs: species.hatchTime,
          imageUrl: getCodexImageUrl(species.id),
          acquisition: getCodexAcquisition(species),
          recipe: recipe ? { ...recipe, ...SYNTHESIS_RULES[species.rarity] } : null,
          collection: {
            collected: registered.has(species.id),
            ownedCount: owned.get(species.id) ?? 0,
            firstCollectedAt: registered.get(species.id)?.toISOString() ?? null,
          },
        };
      });
      const listed = new Set(entries.map((entry) => entry.speciesId));
      return {
        entries,
        summary: {
          totalSpecies: entries.length,
          collectedSpecies: entries.filter((entry) => entry.collection.collected).length,
          ownedSpecies: entries.filter((entry) => entry.collection.ownedCount > 0).length,
          ownedDinosaurs: entries.reduce((sum, entry) => sum + entry.collection.ownedCount, 0),
          unlistedOwnedCount: dinosaurs.filter((dinosaur) => !listed.has(dinosaur.speciesId))
            .length,
        },
      };
    });
  }
}
