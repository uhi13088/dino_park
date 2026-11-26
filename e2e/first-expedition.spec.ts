import { expect, type Page } from '@playwright/test';
import type {
  FirstExpeditionStateResponse,
  LoginResponse,
  ResourcesResponse,
  ScoutExpeditionState,
} from '@dino-park/shared';
import { isIsolatedParkConfigured, isolatedParkSetup, test } from './isolated-park';

test.skip(!isIsolatedParkConfigured, isolatedParkSetup);
test.use({ actionTimeout: 15_000 });
const firstMissionId = 'first-iguanodon-v1';

async function state<T>(page: Page, endpoint: string): Promise<T> {
  return page.evaluate(async (url) => {
    const response = await fetch('/api' + url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`State fetch failed: ${response.status}`);
    return (await response.json()).data;
  }, endpoint);
}

async function authenticatePage(page: Page, user: LoginResponse) {
  await page.addInitScript((account) => {
    localStorage.setItem('accessToken', account.accessToken);
    localStorage.setItem('refreshToken', account.refreshToken);
    localStorage.setItem(
      'dino-park-auth',
      JSON.stringify({
        state: {
          isAuthenticated: true,
          user: account.user,
          currency: account.currency,
          park: account.park,
        },
        version: 0,
      }),
    );
  }, user);
}

async function clickSaved(page: Page, name: string, endpoint: string) {
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api' + endpoint) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name, exact: true }).click();
  expect((await saved).ok()).toBeTruthy();
}

test('first scout dispatch, real hatch and early production form one saved loop', async ({
  page,
  request,
  database: prisma,
}) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const login = await request.post('/api/auth/toss/login', {
    data: { tossId: `play04-ui-${Date.now()}-${Math.random()}`, nickname: '초원 조사 검증' },
  });
  expect(login.ok()).toBeTruthy();
  const user = (await login.json()).data;
  const headers = { Authorization: `Bearer ${user.accessToken}` };
  try {
    await request.post('/api/parks/me/starter', { headers });
    const park = (await (await request.get('/api/parks/me', { headers })).json()).data;
    const para = park.dinosaurs[0];
    expect(
      (
        await request.post(`/api/dinosaurs/${para.id}/place`, {
          headers,
          data: { positionX: 9, positionY: 9 },
        })
      ).ok(),
    ).toBeTruthy();
    await request.post(`/api/dinosaurs/${para.id}/feed`, { headers });
    await request.patch('/api/parks/me/open', { headers, data: { isOpen: true } });
    // Prepare the already-tested introduction. No existing player's money or coordinates are edited.
    await prisma.park.update({
      where: { id: park.id },
      data: { level: 2, firstVisitorsRewarded: true, totalVisitors: 10, totalAdmissionGold: 200 },
    });
    const platform = await request.post('/api/buildings', {
      headers,
      data: { typeId: 'visitor-viewing-platform', positionX: 12, positionY: 10 },
    });
    expect(platform.ok()).toBeTruthy();
    const platformId = (await platform.json()).data.id;
    await prisma.building.update({
      where: { id: platformId },
      data: { completesAt: new Date(Date.now() - 1) },
    });
    await request.get('/api/parks/me/operations', { headers });
    await authenticatePage(page, user);
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/park');
    await expect(page.getByRole('button', { name: '첫 탐험가 파견', exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('파크를 준비하고 있어요…', { exact: true })).toBeHidden({
      timeout: 30_000,
    });
    // Production facilities are available before the second dinosaur / Park Lv.3.
    await page.getByRole('button', { name: '자원 시설', exact: true }).click();
    await page.getByRole('button', { name: '벌목장 배치 · 1,500골드', exact: true }).click();
    await expect(
      page.getByRole('button', { name: '벌목장 건설 · 1,500골드', exact: true }),
    ).toBeEnabled();
    const lumberSaved = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/buildings') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '벌목장 건설 · 1,500골드', exact: true }).click();
    expect((await lumberSaved).ok()).toBeTruthy();
    const lumber = (
      await prisma.building.findMany({
        where: { parkId: park.id, typeId: 'production-lumberyard' },
      })
    )[0];
    expect(lumber.status).toBe('CONSTRUCTING');
    const lumberStartedAt = Date.now();

    await page.getByRole('button', { name: '첫 탐험가 파견', exact: true }).click();
    await page.goto(`/exploration?tab=drive&mission=${firstMissionId}`);
    await expect(page.getByRole('heading', { name: '파크 뒤 초원', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await clickSaved(page, '탐험가 파견', '/explorations/scouts/dispatch');
    const dispatched = await state<ScoutExpeditionState>(page, '/explorations/scouts');
    const assignment = dispatched.scouts.find((scout) => scout.assignment)?.assignment;
    if (!assignment) throw new Error('The paid scout assignment was not persisted.');
    expect(assignment).toMatchObject({ missionId: firstMissionId, spotId: 'park-meadow' });
    expect(dispatched.fuel).toBe(25);
    await page.reload();
    await expect(page.getByLabel(/귀환까지/)).toBeVisible();
    await page.screenshot({ path: '.impeccable/review/play04-expedition-mobile.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '.impeccable/review/play04-expedition-desktop.png' });
    await page.setViewportSize({ width: 430, height: 932 });
    // Advance only the dispatch clock in the isolated test. The hatch still finishes in real time.
    await prisma.scoutAssignment.update({
      where: { id: assignment.id },
      data: { completesAt: new Date(Date.now() - 1) },
    });
    await page.reload();
    await clickSaved(page, '보고서 수령', `/explorations/scouts/reports/${assignment.id}/claim`);
    const eggState = await state<FirstExpeditionStateResponse>(page, '/explorations/first');
    expect(eggState.stage).toBe('egg');
    expect(eggState.egg?.status).toBe('stored');
    await page.getByRole('button', { name: '부화 시작 · 60초', exact: true }).click();
    const hatchStartedAt = Date.now();
    const hatching = await state<FirstExpeditionStateResponse>(page, '/explorations/first');
    expect(hatching.stage).toBe('hatching');
    expect(hatching.hatchingSlots).toEqual({ used: 1, total: 1 });
    expect(
      await prisma.dinosaur.count({ where: { parkId: park.id, speciesId: 'iguanodon' } }),
    ).toBe(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: /부화 중/ })).toBeVisible();
    await page.getByRole('link', { name: '파크로', exact: true }).click();
    await page.getByRole('button', { name: '자원 시설 보기', exact: true }).click();
    await expect
      .poll(
        async () => (await prisma.building.findUniqueOrThrow({ where: { id: lumber.id } })).status,
        { timeout: 80_000, intervals: [2000] },
      )
      .toBe('ACTIVE');
    expect(Date.now() - lumberStartedAt).toBeGreaterThanOrEqual(59_000);
    await expect(
      page.getByRole('button', { name: '목재 20개 생산 시작', exact: true }),
    ).toBeEnabled();
    await clickSaved(page, '목재 20개 생산 시작', '/resources/production');
    const producing = await state<ResourcesResponse>(page, '/resources');
    const woodJob = producing.facilities.find((f) => f.typeId === 'production-lumberyard')!.job!;
    expect(woodJob.ready).toBe(false);
    await expect(page.getByRole('button', { name: '목재 20개 수령', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '기본 자원 닫기', exact: true }).click();
    await expect(page.getByRole('button', { name: '이구아노돈 만나기', exact: true })).toBeEnabled({
      timeout: 75_000,
    });
    expect(Date.now() - hatchStartedAt).toBeGreaterThanOrEqual(59_000);
    await page.getByRole('button', { name: '이구아노돈 만나기', exact: true }).click();
    await page.getByRole('button', { name: '이구아노돈 배치하기', exact: true }).click();
    const map = page.getByRole('region', { name: '파크 지도', exact: true });
    await expect(page.getByRole('button', { name: '공룡 배치 확정', exact: true })).toBeEnabled();
    await page.screenshot({ path: '.impeccable/review/play04-placement-mobile.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '.impeccable/review/play04-placement-desktop.png' });
    await page.setViewportSize({ width: 430, height: 932 });
    await map.press('Enter');
    await expect
      .poll(
        async () => (await state<FirstExpeditionStateResponse>(page, '/explorations/first')).stage,
      )
      .toBe('complete');
    const baby = await prisma.dinosaur.findFirstOrThrow({
      where: { parkId: park.id, speciesId: 'iguanodon' },
    });
    expect(baby).toMatchObject({ isInPark: true, hunger: 0, happiness: 100 });
    expect([baby.positionX, baby.positionY]).not.toEqual([9, 9]);
    expect(
      await prisma.dinosaurCollection.count({ where: { parkId: park.id, speciesId: 'iguanodon' } }),
    ).toBe(1);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } })).tutorialStep,
    ).toBe(10);
    await page.getByRole('button', { name: '관리 패널 닫기', exact: true }).click();
    await page.getByRole('button', { name: '자원 시설', exact: true }).click();
    await page.getByRole('button', { name: '채석장 배치 · 1,500골드', exact: true }).click();
    const quarrySaved = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/buildings') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '채석장 건설 · 1,500골드', exact: true }).click();
    expect((await quarrySaved).ok()).toBeTruthy();
    const quarry = await prisma.building.findFirstOrThrow({
      where: { parkId: park.id, typeId: 'production-quarry' },
    });
    // The second factory and 5/6-minute jobs use isolated clock fixtures; not real-time duration evidence.
    await prisma.building.update({
      where: { id: quarry.id },
      data: { completesAt: new Date(Date.now() - 1) },
    });
    await request.get('/api/parks/me/operations', { headers });
    await expect(page.getByRole('region', { name: '배치 안내', exact: true })).toBeHidden();
    await page.getByRole('button', { name: '자원 시설', exact: true }).click();
    await expect(page.getByRole('region', { name: '기본 자원', exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: '석재 20개 생산 시작', exact: true }),
    ).toBeEnabled({ timeout: 15_000 });
    await clickSaved(page, '석재 20개 생산 시작', '/resources/production');
    const jobs = await prisma.productionJob.findMany({
      where: { parkId: park.id, claimedAt: null },
    });
    expect(jobs).toHaveLength(2);
    await prisma.productionJob.updateMany({
      where: { id: { in: jobs.map((job) => job.id) }, parkId: park.id },
      data: { readyAt: new Date(Date.now() - 1) },
    });
    await expect(page.getByRole('button', { name: '목재 20개 수령', exact: true })).toBeEnabled({
      timeout: 10_000,
    });
    await clickSaved(page, '목재 20개 수령', `/resources/production/${woodJob.id}/claim`);
    const stoneJob = jobs.find((job) => job.material === 'stone')!;
    await clickSaved(page, '석재 20개 수령', `/resources/production/${stoneJob.id}/claim`);
    const stocked = await state<ResourcesResponse>(page, '/resources');
    expect(stocked.inventory.find((i) => i.material === 'wood')!.amount).toBe(20);
    expect(stocked.inventory.find((i) => i.material === 'stone')!.amount).toBe(20);
    await page.screenshot({ path: '.impeccable/review/play04-resources-mobile.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '.impeccable/review/play04-resources-desktop.png' });
    await clickSaved(page, '관람대 Lv.2로 확장', `/buildings/${platformId}/upgrade`);
    await expect(page.getByRole('heading', { name: /관람대 확장 중/ })).toBeVisible();
    const beforeComplete = await state<{ capacity: number }>(page, '/parks/me/operations');
    expect(beforeComplete.capacity).toBe(32);
    const used = await state<ResourcesResponse>(page, '/resources');
    expect(used.inventory.find((i) => i.material === 'wood')!.amount).toBe(0);
    expect(used.inventory.find((i) => i.material === 'stone')!.amount).toBe(10);
    await prisma.building.update({
      where: { id: platformId },
      data: { completesAt: new Date(Date.now() - 1) },
    });
    await expect
      .poll(async () => (await state<{ capacity: number }>(page, '/parks/me/operations')).capacity)
      .toBe(52);
    await page.getByRole('button', { name: '기본 자원 닫기', exact: true }).click();
    await expect(page.getByText(/관람 정원 52명/)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: '전체 보기', exact: true }).click();
    await page.screenshot({ path: '.impeccable/review/play04-park-desktop.png' });
    await page.setViewportSize({ width: 430, height: 932 });
    await page.getByRole('button', { name: '전체 보기', exact: true }).click();
    await page.screenshot({ path: '.impeccable/review/play04-park-mobile.png' });
    await page.reload();
    await expect(page.getByRole('button', { name: '공룡 2', exact: true })).toBeVisible({
      timeout: 30_000,
    });
    const saved = await state<FirstExpeditionStateResponse>(page, '/explorations/first');
    expect(saved).toMatchObject({ stage: 'complete', tutorialStep: 10 });
    expect(
      await prisma.dinosaur.count({ where: { parkId: park.id, speciesId: 'iguanodon' } }),
    ).toBe(1);
    expect(
      await prisma.exploration.count({
        where: { userId: user.user.id, missionId: firstMissionId },
      }),
    ).toBe(1);
    expect(
      await prisma.transaction.count({
        where: {
          userId: user.user.id,
          reason: { endsWith: ' 준비' },
          amount: -100,
        },
      }),
    ).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    await page.close();
    // Stop UI heartbeats, then use the same park-first lock order as gameplay writes.
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${user.user.id} FOR UPDATE`;
      await tx.user.delete({ where: { id: user.user.id } });
    });
  }
});

test('resource wheel scrolls the panel without moving the map camera', async ({
  page,
  request,
  database: prisma,
}) => {
  test.setTimeout(60_000);
  const login = await request.post('/api/auth/toss/login', {
    data: { tossId: `play04-wheel-${Date.now()}-${Math.random()}`, nickname: '자원 입력 검증' },
  });
  expect(login.ok()).toBeTruthy();
  const user = (await login.json()).data;
  const camera = () =>
    page.evaluate(async () => {
      const source = '/src/game/index.ts';
      const { gameEngine } = await import(source);
      return gameEngine.getCameraState() as { x: number; y: number; zoom: number };
    });
  try {
    await authenticatePage(page, user);
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/park');
    await expect(page.getByText('파크를 준비하고 있어요…', { exact: true })).toBeHidden({
      timeout: 30_000,
    });
    for (const width of [430, 1280]) {
      await page.setViewportSize({ width, height: width === 430 ? 932 : 900 });
      await page.getByRole('button', { name: '전체 보기', exact: true }).click();
      await page.getByRole('button', { name: '자원 시설', exact: true }).click();
      const body = page.locator('.resource-panel__body');
      await expect(body).toBeVisible();
      await body.evaluate((element) => {
        element.scrollTop = 0;
      });
      const before = await camera();
      await body.hover();
      await page.mouse.wheel(0, 320);
      await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect(await camera()).toEqual(before);
      const close = page.getByRole('button', { name: '기본 자원 닫기', exact: true });
      await expect(close).toBeInViewport();
      await close.click();
      await page.locator('canvas').hover({ position: { x: 20, y: 20 } });
      await page.mouse.wheel(0, -160);
      await expect.poll(async () => (await camera()).zoom).toBeGreaterThan(before.zoom);
    }
  } finally {
    await page.close();
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM parks WHERE "userId" = ${user.user.id} FOR UPDATE`;
      await tx.user.delete({ where: { id: user.user.id } });
    });
  }
});
