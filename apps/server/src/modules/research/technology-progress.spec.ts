import {
  getResearchFacilityUpgrade,
  getTechnology,
  RESEARCH_LAB_ID,
  TECHNOLOGY_CATALOG,
} from '@dino-park/game-data';
import {
  completedTechnologyLevels,
  isConnectedResearch,
  missingFunds,
  quoteResearchRank,
} from './technology-progress';
import {
  researchFacilityBlock,
  researchFacilityCap,
  researchFacilityLevel,
} from './research-facilities';
import type { PrismaService } from '../../prisma/prisma.service';
import { AT, building, world } from '../park/park-admission.fixtures';
import type { ParkOperationsService } from '../park/park-operations.service';
import type { ResourcesService } from '../resources/resources.service';
import { ResearchService } from './research.service';

const context = {
  parkLevel: 8,
  labLevel: 25,
  firstHero: true,
  completed: new Map<string, number>(),
  activeJobs: 0,
  gold: 20_000_000,
  goldCapacity: 20_000_000,
  capacityPerMaterial: 4500,
  stock: { wood: 4500, stone: 4500, metal: 4500 },
};

const expert = getTechnology('gene-legend-natural')!;
const rank = expert.ranks[2];

it('shows all 69/239 active catalogue entries and enables connected ranks only', () => {
  expect(TECHNOLOGY_CATALOG).toHaveLength(69);
  expect(TECHNOLOGY_CATALOG.reduce((ranks, technology) => ranks + technology.ranks.length, 0)).toBe(
    239,
  );
  expect(isConnectedResearch('gene-legend-natural', 3)).toBe(true);
  expect(isConnectedResearch('gene-epic-natural', 2)).toBe(true);
  expect(isConnectedResearch('ops-land', 1)).toBe(true);
  expect(isConnectedResearch('ops-land', 2)).toBe(false);
  expect(isConnectedResearch('care-glacier')).toBe(false);
  expect(isConnectedResearch('ops-entry', 2)).toBe(true);
  expect(isConnectedResearch('care-adaptation', 3)).toBe(true);
  expect(isConnectedResearch('care-marine', 1)).toBe(true);
  expect(isConnectedResearch('ops-processing', 1)).toBe(false);
});

it('leaves the researcher available when retired projects remain in old saves', async () => {
  const at = new Date(AT);
  jest.useFakeTimers().setSystemTime(at);
  try {
    const oldProjects = ['exp-tank', 'exp-recovery', 'exp-expedition-supply'].map(
      (technologyId) => ({
        technologyId,
        level: 1,
        startedAt: new Date(AT - 1_000),
        completesAt: new Date(AT + 600_000),
      }),
    );
    const park = {
      ...world(),
      id: 'park',
      level: 8,
      buildings: [building('lab', RESEARCH_LAB_ID, 4, 4)],
      firstSynthesis: { claimedAt: at },
      technologyResearch: [...oldProjects],
      resourceInventory: ['wood', 'stone', 'metal'].map((material) => ({ material, amount: 100 })),
    };
    const tx = {
      park: { findUniqueOrThrow: async () => park },
      currency: { findUniqueOrThrow: async () => ({ gold: 10000 }) },
      building: { findMany: async () => park.buildings },
      parkTechnologyResearch: {
        create: jest.fn(async ({ data }: { data: (typeof oldProjects)[number] }) => {
          park.technologyResearch.push(data);
        }),
      },
    };
    const prisma = { $transaction: (run: (context: typeof tx) => unknown) => run(tx) };
    const operations = { settleInTransaction: jest.fn() };
    const resources = { consumeMaterials: jest.fn(), spendGold: jest.fn() };
    const service = new ResearchService(
      prisma as unknown as PrismaService,
      operations as unknown as ParkOperationsService,
      resources as unknown as ResourcesService,
    );

    expect((await service.getState('user')).queue.jobs).toEqual([]);
    const started = await service.start('user', 'ops-entry', 1);
    expect(started.queue.jobs).toEqual([expect.objectContaining({ technologyId: 'ops-entry' })]);
    expect(park.technologyResearch.slice(0, 3)).toEqual(oldProjects);
    expect(tx.parkTechnologyResearch.create).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

it('requires a completed Lv.25 lab and completed prerequisite, retaining the 28 day exact floor', () => {
  const completed = new Map([
    [expert.prerequisites[0].technologyId, expert.prerequisites[0].level],
    ['gene-study-protocol', 5],
  ]);
  expect(
    quoteResearchRank(expert, rank, { ...context, labLevel: 24, completed }).unavailableReason,
  ).toContain('Lv.25');
  expect(quoteResearchRank(expert, rank, context).unavailableReason).toContain(
    '영웅 원종 계통 조사 Lv.2',
  );
  const available = quoteResearchRank(expert, rank, { ...context, completed });
  expect(available.unavailableReason).toBeUndefined();
  expect(available.durationSeconds).toBe(28 * 86400);
  expect(available.costs).toEqual(rank.costs);
});

it('reuses the exact early 60-second stage prices even with later research discounts', () => {
  const technology = getTechnology('exp-field-mapping')!;
  const completed = new Map([
    ['gene-study-protocol', 5],
    ['gene-study-budget', 5],
  ]);
  const quote = quoteResearchRank(technology, technology.ranks[0], { ...context, completed });
  expect(quote).toMatchObject({
    costs: { gold: 400, wood: 5, stone: 5, metal: 0 },
    durationSeconds: 60,
  });
  expect(
    quoteResearchRank(technology, technology.ranks[0], { ...context, parkLevel: 6 })
      .unavailableReason,
  ).toContain('파크 Lv.7');
  expect(
    quoteResearchRank(technology, technology.ranks[0], { ...context, activeJobs: 1 })
      .unavailableReason,
  ).toContain('다른 연구');
});

it('uses only completed ranks and maintains the previous lab level until completion', () => {
  const now = new Date('2026-11-23T00:00:00Z');
  const completed = completedTechnologyLevels(
    [
      { technologyId: 'ops-engineering', level: 2, completesAt: now },
      { technologyId: 'ops-engineering', level: 3, completesAt: new Date(now.getTime() + 1) },
    ],
    now,
  );
  const plan = getResearchFacilityUpgrade(RESEARCH_LAB_ID, 25)!;
  expect(researchFacilityBlock(plan, 8, true, completed)).toContain('시설 고도화 Lv.3');
  expect(researchFacilityCap(completed)).toBe(20);
  completed.set('ops-engineering', 3);
  expect(researchFacilityBlock(plan, 8, true, completed)).toBeUndefined();
  expect(plan).toMatchObject({
    costs: { gold: 2944000, wood: 675, stone: 507, metal: 169 },
    durationSeconds: 14 * 86400,
  });
  expect(researchFacilityLevel({ level: 25, status: 'UPGRADING' })).toBe(24);
});

it('suggests storage upgrades for insufficient funds and preserves a historical above-cap balance', () => {
  const plan = getResearchFacilityUpgrade(RESEARCH_LAB_ID, 25)!;
  expect(missingFunds(plan.costs, 25000, context.stock, 25000, 100)).toContain('금고');
  expect(
    missingFunds(plan.costs, context.gold, { wood: 100, stone: 100, metal: 100 }, 25000, 100),
  ).toContain('창고');
  expect(missingFunds(plan.costs, context.gold, context.stock, 25000, 100)).toBeUndefined();
});
