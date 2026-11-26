import type { Prisma } from '@prisma/client';
import { AT, building, dinosaur, world } from '../park/park-admission.fixtures';
import { MARINE_OBSERVATION_FLAG, storySceneRequirement } from './story-scene-gates';

function setup() {
  const tx = {
    park: { findUnique: jest.fn() },
    storyFlag: { findUnique: jest.fn() },
    scoutAssignment: { findFirst: jest.fn() },
  };
  return {
    tx,
    requirementFor: (scene: string) =>
      storySceneRequirement(
        tx as unknown as Prisma.TransactionClient,
        'player',
        scene,
        new Date(AT),
      ),
  };
}

test('chapter 4 intro needs no new park or exhibition gate', async () => {
  const { requirementFor, tx } = setup();
  await expect(requirementFor('ch4-scene-1')).resolves.toBeUndefined();
  expect(tx.park.findUnique).not.toHaveBeenCalled();
});

test('the marine project needs research, a completed aquarium and paid observation evidence', async () => {
  const { requirementFor, tx } = setup();
  tx.park.findUnique.mockResolvedValueOnce({ technologyResearch: [], buildings: [] });
  await expect(requirementFor('ch4-scene-2')).resolves.toMatchObject({
    kind: 'research',
    technologyId: 'care-marine',
    level: 1,
  });

  const aquarium = building('aquarium', 'habitat-marine-aquarium', 3, 3);
  tx.park.findUnique.mockResolvedValueOnce({
    technologyResearch: [{ level: 1 }],
    buildings: [{ ...aquarium, status: 'CONSTRUCTING', completesAt: new Date(AT + 60_000) }],
  });
  await expect(requirementFor('ch4-scene-2')).resolves.toMatchObject({
    kind: 'facility',
    facilityId: 'habitat-marine-aquarium',
    level: 1,
  });

  tx.park.findUnique.mockResolvedValueOnce({
    technologyResearch: [{ level: 1 }],
    buildings: [aquarium],
  });
  await expect(requirementFor('ch4-scene-2')).resolves.toMatchObject({ kind: 'operations' });

  tx.storyFlag.findUnique.mockResolvedValueOnce({ value: true });
  await expect(requirementFor('ch4-scene-2')).resolves.toBeUndefined();
  expect(tx.storyFlag.findUnique).toHaveBeenLastCalledWith(
    expect.objectContaining({
      where: { userId_flagId: { userId: 'player', flagId: MARINE_OBSERVATION_FLAG } },
    }),
  );
  expect(tx.park.findUnique).toHaveBeenCalledTimes(3);
});

test.each([
  ['ch4-scene-3', 'exp-wetland-crossing', 'mission.primal-swamp.watermark-compare.v1'],
  ['ch6-scene-1', 'exp-crater-reading', 'mission.mutation-crater.thermal-pattern.v1'],
])('requires the claimed report for %s', async (scene, technologyId, missionId) => {
  const { requirementFor, tx } = setup();
  tx.park.findUnique.mockResolvedValueOnce({ id: 'park', technologyResearch: [] });
  await expect(requirementFor(scene)).resolves.toMatchObject({
    kind: 'research',
    technologyId,
    level: 2,
  });

  tx.park.findUnique.mockResolvedValue({ id: 'park', technologyResearch: [{ level: 2 }] });
  await expect(requirementFor(scene)).resolves.toMatchObject({ kind: 'exploration', missionId });
  expect(tx.scoutAssignment.findFirst).toHaveBeenLastCalledWith(
    expect.objectContaining({
      where: { scout: { parkId: 'park' }, missionId, claimedAt: { not: null } },
    }),
  );

  tx.scoutAssignment.findFirst.mockResolvedValue({ id: 'claimed-report' });
  await expect(requirementFor(scene)).resolves.toBeUndefined();
});

test('checks actual circulation and exhibit safety before and after the storm', async () => {
  const { requirementFor, tx } = setup();
  const park = world();
  tx.park.findUnique.mockResolvedValue(park);
  await expect(requirementFor('ch5-scene-1')).resolves.toMatchObject({
    kind: 'facility',
    facilityId: 'operation-security-center',
  });
  park.buildings.push(building('security', 'operation-security-center', 2, 2));
  await expect(requirementFor('ch5-scene-1')).resolves.toMatchObject({ kind: 'operations' });
  park.buildings.push(building('platform', 'visitor-viewing-platform', 4, 4));
  await expect(requirementFor('ch5-scene-1')).resolves.toBeUndefined();
  park.dinosaurs.push(dinosaur('second-at-same-tile'));
  await expect(requirementFor('ch5-scene-3')).resolves.toMatchObject({ kind: 'operations' });
});
