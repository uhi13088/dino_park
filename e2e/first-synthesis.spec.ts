import { randomUUID } from 'node:crypto';
import { expect, type APIResponse } from '@playwright/test';
import type { DinosaurCodexResponse, FirstSynthesisState, LoginResponse } from '@dino-park/shared';
import { isIsolatedParkConfigured, isolatedParkSetup, test } from './isolated-park';

test.skip(!isIsolatedParkConfigured, isolatedParkSetup);
const api = '/api';

async function data<T>(response: APIResponse): Promise<T> {
  const payload = await response.json();
  expect(response.ok(), JSON.stringify(payload)).toBeTruthy();
  return payload.data;
}

test('first synthesis debits once, keeps parents, and completes story at a valid exhibit', async ({
  request,
  database: prisma,
}) => {
  const tossId = `first-synthesis-test-${randomUUID()}`;
  const visitorId = `${tossId}-other-park`;
  try {
    const owner = await data<LoginResponse>(
      await request.post(api + '/auth/toss/login', {
        data: { tossId, nickname: '합성 검증' },
      }),
    );
    const headers = { Authorization: `Bearer ${owner.accessToken}` };
    const visitor = await data<LoginResponse>(
      await request.post(api + '/auth/toss/login', {
        data: { tossId: visitorId, nickname: '다른 파크 검증' },
      }),
    );
    const visitorHeaders = { Authorization: `Bearer ${visitor.accessToken}` };
    const parkId = owner.park.id;
    const get = (endpoint: string) => request.get(api + endpoint, { headers });
    const post = (endpoint: string, body?: object) =>
      request.post(api + endpoint, { headers, data: body });
    const start = (parentIds: string[]) => post('/milestone-synthesis/start', { parentIds });
    const checkState = async () => data<FirstSynthesisState>(await get('/milestone-synthesis'));
    const place = (id: string, positionX: number, positionY: number) =>
      post(`/dinosaurs/${id}/place`, { positionX, positionY });

    expect((await checkState()).available).toBe(false);
    await data(await post('/parks/me/starter'));
    const starter = await prisma.dinosaur.findFirstOrThrow({
      where: { parkId, speciesId: 'parasaurolophus' },
    });
    await data(await place(starter.id, 9, 9));
    await data(await post(`/dinosaurs/${starter.id}/feed`));

    // The expedition E2E supplies these preconditions. Begin here at two completed parent hatches.
    await prisma.park.update({
      where: { id: parkId },
      data: { level: 4, exp: 611, firstVisitorsRewarded: true },
    });
    await prisma.currency.update({
      where: { userId: owner.user.id },
      data: { gold: 70_000, dna: 200 },
    });
    await prisma.resourceInventory.createMany({
      data: [
        { parkId, material: 'wood', quality: 0, amount: 100 },
        { parkId, material: 'stone', quality: 0, amount: 100 },
        { parkId, material: 'dna', quality: 1, amount: 100 },
      ],
    });
    await prisma.dinosaur.createMany({
      data: ['iguanodon', 'stegosaurus', 'triceratops'].map((speciesId) => ({
        parkId,
        speciesId,
        positionX: 0,
        positionY: 0,
        isInPark: false,
      })),
    });
    const ids = (await checkState()).parents.map((parent) => parent.id);
    expect(ids).toHaveLength(2);
    expect((await post('/milestone-synthesis/safety')).status()).toBe(400);
    expect((await post('/stories/chapters/chapter-2/complete')).status()).toBe(400);
    expect((await post('/stories/chapters/chapter-3/complete')).status()).toBe(400);

    const build = async (
      typeId: string,
      positionX: number,
      positionY: number,
      expectedSeconds: number,
    ) => {
      const result = await data<{ id: string; constructionTime: number }>(
        await post('/buildings', {
          typeId,
          positionX,
          positionY,
        }),
      );
      expect(result.constructionTime).toBe(expectedSeconds);
      // Keep production construction timers. Only age the record owned by this test account.
      await prisma.building.update({
        where: { id: result.id },
        data: { completesAt: new Date(0) },
      });
      await data(await get('/parks/me/operations'));
    };
    await build('visitor-viewing-platform', 12, 10, 30);
    await build('habitat-carnivore', 14, 9, 180);
    await build('operation-security-center', 14, 13, 180);
    expect((await checkState()).safetyRequirements).toEqual([]);
    const safetyResults = await Promise.all([
      post('/milestone-synthesis/safety'),
      post('/milestone-synthesis/safety'),
    ]);
    for (const response of safetyResults)
      expect((await data<FirstSynthesisState>(response)).safetyComplete).toBe(true);
    const safePark = await prisma.park.findUniqueOrThrow({ where: { id: parkId } });
    expect(safePark.level).toBe(5);
    const baselineXP = safePark.exp;
    expect(
      (await data<FirstSynthesisState>(await post('/milestone-synthesis/safety'))).safetyComplete,
    ).toBe(true);
    expect((await prisma.park.findUniqueOrThrow({ where: { id: parkId } })).exp).toBe(baselineXP);

    await build('research-dna-lab', 4, 10, 300);
    expect((await checkState()).labReady).toBe(true);
    expect((await post('/milestone-synthesis/prepare')).status()).toBe(400);
    expect((await start(ids)).status()).toBe(400);
    await prisma.resourceInventory.createMany({
      data: [
        { parkId, material: 'dna', quality: 2, amount: 20 },
        { parkId, material: 'culture', quality: 2, amount: 2 },
        { parkId, material: 'catalyst', quality: 2, amount: 1 },
      ],
    });
    await data(await post('/milestone-synthesis/prepare'));
    const visitingParent = await prisma.dinosaur.create({
      data: {
        parkId: visitor.park.id,
        speciesId: 'triceratops',
        positionX: 0,
        positionY: 0,
        isInPark: false,
      },
    });
    const stego = (await checkState()).parents.find(
      (parent) => parent.speciesId === 'stegosaurus',
    )!;
    expect((await start([stego.id, visitingParent.id])).status()).toBe(400);
    const goldBefore = (await checkState()).gold;
    const starts = await Promise.all([start(ids), start(ids)]);
    for (const response of starts) {
      const state = await data<FirstSynthesisState>(response);
      expect(state.job?.status).toBe('incubating');
      expect(Date.parse(state.job!.readyAt) - Date.parse(state.job!.startedAt)).toBe(30 * 60_000);
      expect(state.gold).toBe(goldBefore - 4000);
      expect(state.ingredients.map((item) => item.available)).toEqual([0, 0, 0]);
      expect(state.builderSlots).toBe(1);
    }
    expect((await request.delete(api + '/dinosaurs/' + ids[0], { headers })).status()).toBe(400);
    expect((await post('/milestone-synthesis/claim')).status()).toBe(400);
    expect((await checkState()).job?.status).toBe('incubating');

    // Advance only this stored fixture's timer to exercise manual receipt without a 30-minute test.
    await prisma.firstSynthesisJob.update({ where: { parkId }, data: { readyAt: new Date(0) } });
    const claims = await Promise.all([
      post('/milestone-synthesis/claim'),
      post('/milestone-synthesis/claim'),
    ]);
    const first = await data<FirstSynthesisState>(claims[0]);
    const second = await data<FirstSynthesisState>(claims[1]);
    const resultId = first.job!.resultDinosaurId!;
    expect(first.builderSlots).toBe(2);
    expect(second.job?.resultDinosaurId).toBe(resultId);
    expect(second.job?.exhibitedAt).toBe(null);
    const visitorProgress = await data<FirstSynthesisState>(
      await request.get(api + '/milestone-synthesis', { headers: visitorHeaders }),
    );
    expect(visitorProgress.job).toBeNull();
    expect(
      (
        await request.post(api + '/milestone-synthesis/claim', { headers: visitorHeaders })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post(api + `/dinosaurs/${resultId}/place`, {
          headers: visitorHeaders,
          data: { positionX: 13, positionY: 5 },
        })
      ).status(),
    ).toBe(403);
    expect(await prisma.dinosaur.count({ where: { parkId, speciesId: 'stegoceratops' } })).toBe(1);
    expect(await prisma.dinosaur.count({ where: { parkId, id: { in: ids } } })).toBe(2);
    expect(
      await prisma.transaction.count({
        where: { userId: owner.user.id, reason: '첫 스테고케라톱스 합성' },
      }),
    ).toBe(1);
    const codex = await data<DinosaurCodexResponse>(await get('/dinosaurs/codex'));
    expect(
      codex.entries.find(({ speciesId }) => speciesId === 'stegoceratops')?.collection,
    ).toMatchObject({
      collected: true,
      ownedCount: 1,
    });
    expect((await place(resultId, 8, 8)).status()).toBe(400);

    await prisma.resourceInventory.updateMany({
      where: { parkId, quality: 0 },
      data: { amount: 100 },
    });
    const habitat = await data<{ id: string }>(
      await post('/buildings', { typeId: 'habitat-hybrid-zone', positionX: 13, positionY: 5 }),
    );
    await data(
      await post('/buildings', { typeId: 'research-hatchery', positionX: 4, positionY: 14 }),
    );
    expect(
      (
        await post('/buildings', { typeId: 'production-lumberyard', positionX: 2, positionY: 3 })
      ).status(),
    ).toBe(400);
    expect((await place(resultId, 13, 5)).status()).toBe(400);
    await prisma.building.update({
      where: { id: habitat.id },
      data: { completesAt: new Date(0) },
    });
    expect((await place(resultId, 13, 5)).status()).toBe(400);
    await data(await request.patch(api + '/parks/me/open', { headers, data: { isOpen: true } }));
    await data(await place(resultId, 13, 5));
    const final = await checkState();
    expect(final.job?.exhibitedAt).toBeTruthy();
    expect(final.job?.resultDinosaurId).toBe(resultId);
    expect(await prisma.dinosaur.findUniqueOrThrow({ where: { id: resultId } })).toMatchObject({
      isInPark: true,
      positionX: 13,
      positionY: 5,
    });
    expect(
      await prisma.storyProgress.findUnique({
        where: { userId_chapterId: { userId: owner.user.id, chapterId: 'chapter-3' } },
      }),
    ).toMatchObject({ completed: true, sceneId: null });
  } finally {
    await prisma.user
      .deleteMany({
        where: { tossId: { in: [tossId, visitorId] } },
      })
      .catch(() => undefined);
  }
});
