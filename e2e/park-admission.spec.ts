import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import type { ParkOperationsResponse, BuildingResponse, DinosaurResponse } from '@dino-park/shared';

test.use({ actionTimeout: 15_000 });

const operationsPath = '/api/parks/me/operations';
async function account(request: APIRequestContext, prefix = 'admission') {
  const login = await request.post('/api/auth/toss/login', {
    data: { tossId: `${prefix}-${Date.now()}-${Math.random()}`, nickname: '파크 운영 검증' },
  });
  expect(login.ok()).toBeTruthy();
  return (await login.json()).data;
}
async function operations(page: Page): Promise<ParkOperationsResponse> {
  return page.evaluate(async (url) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`Operations failed ${response.status}`);
    return (await response.json()).data;
  }, operationsPath);
}
async function park(
  page: Page,
): Promise<{ dinosaurs: DinosaurResponse[]; buildings: BuildingResponse[] }> {
  return page.evaluate(
    async () =>
      (
        await (
          await fetch('/api/parks/me', {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          })
        ).json()
      ).data,
  );
}

test('paid admission unlocks a previewed, timed and persisted first viewing platform', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 430, height: 932 });
  const user = await account(request, 'admission-ui');
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
  await page.goto('/park');
  const map = page.getByRole('region', { name: '파크 지도', exact: true });
  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('파크를 준비하고 있어요…', { exact: true })).toBeHidden({
    timeout: 30_000,
  });
  await expect(page.getByRole('button', { name: '공룡 배치하기', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  const initial = await operations(page);
  expect(initial).toMatchObject({
    isOpen: false,
    totalVisitors: 0,
    totalAdmissionGold: 0,
    capacity: 12,
    gold: 10_000,
  });
  expect(initial.entrance?.onBoundary).toBe(true);
  await expect(page.getByRole('button', { name: '파크 개장', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: '공룡 배치하기', exact: true }).click();
  await map.press('Enter');
  await expect(
    page.getByRole('button', { name: '먹이 주기 · 100골드', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '먹이 주기 · 100골드', exact: true }).click();
  await expect(page.getByRole('button', { name: '배불러요', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '관리 패널 닫기', exact: true }).click();
  await expect(page.getByRole('button', { name: '파크 개장', exact: true })).toBeEnabled({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: '파크 개장', exact: true }).click();
  await expect(page.getByRole('button', { name: '파크 휴장', exact: true })).toBeVisible();
  expect((await operations(page)).visitorsPerMinute).toBe(12);
  await page.getByRole('button', { name: '전체 보기', exact: true }).click();

  await expect(page.getByRole('button', { name: '관람대 짓기', exact: true })).toBeEnabled({
    timeout: 75_000,
  });
  const unlocked = await operations(page);
  expect(unlocked.totalVisitors).toBeGreaterThanOrEqual(10);
  expect(unlocked.totalAdmissionGold).toBe(unlocked.totalVisitors * 20);
  expect(unlocked.gold).toBeGreaterThan(9900);
  expect(unlocked.parkLevel).toBe(2);
  expect(unlocked.firstVisitorsGoal.rewarded).toBe(true);
  await page.getByRole('button', { name: '관람대 짓기', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '관람대 건설 · 1,500골드', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  expect((await park(page)).buildings).toHaveLength(2);
  // A preview/cancel has no build debit or new structure.
  expect((await operations(page)).gold).toBeGreaterThanOrEqual(unlocked.gold);
  await page.getByRole('button', { name: '관람대 짓기', exact: true }).click();
  await page.getByRole('button', { name: '관람대 건설 · 1,500골드', exact: true }).click();
  await expect(page.getByRole('heading', { name: /관람대 건설 중/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '완공 확인', exact: true })).toBeDisabled();
  const constructing = await operations(page);
  expect(constructing.capacity).toBe(12);
  expect(constructing.viewingPlatform?.status).toBe('CONSTRUCTING');
  const build = (await park(page)).buildings.find(
    (building) => building.typeId === 'visitor-viewing-platform',
  );
  expect(build).toBeTruthy();
  const early = await page.evaluate(
    async (id) =>
      (
        await (
          await fetch(`/api/buildings/${id}/complete`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          })
        ).json()
      ).data,
    build!.id,
  );
  expect(early.completed).toBe(false);
  await expect
    .poll(async () => (await operations(page)).capacity, { timeout: 40_000, intervals: [2000] })
    .toBe(32);
  await expect(
    page.getByRole('heading', { name: '초원에서 두 번째 친구를 찾아요', exact: true }),
  ).toBeVisible({ timeout: 10_000 });
  const completed = await operations(page);
  expect(completed.visitorsPerMinute).toBeGreaterThan(12);
  expect(completed.viewingPlatform?.status).toBe('ACTIVE');
  await page.getByRole('button', { name: '전체 보기', exact: true }).click();
  await page.screenshot({ path: '.impeccable/review/mobile.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: '전체 보기', exact: true }).click();
  await page.screenshot({ path: '.impeccable/review/desktop.png' });
  await page.context().storageState({ path: 'tmp/preview/park-admission-state.json' });
  await page.screenshot({ path: testInfo.outputPath('park-admission-desktop.png') });
  await page.getByRole('button', { name: '파크 휴장', exact: true }).click();
  const closed = await operations(page);
  expect(closed.visitorsPerMinute).toBe(0);
  await page.reload();
  await expect(map).toBeVisible({ timeout: 30_000 });
  const saved = await operations(page);
  expect(saved.isOpen).toBe(false);
  expect(saved.capacity).toBe(32);
  expect(saved.totalVisitors).toBe(closed.totalVisitors);
  expect(
    (await park(page)).buildings.filter(
      (building) => building.typeId === 'visitor-viewing-platform',
    ),
  ).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('admission rejects invalid opening and preserves existing entrance placement until a free move', async ({
  request,
}) => {
  const user = await account(request, 'entrance');
  const headers = { Authorization: `Bearer ${user.accessToken}` };
  await request.post('/api/parks/me/starter', { headers });
  const before = (await (await request.get(operationsPath, { headers })).json()).data;
  const open = await request.patch('/api/parks/me/open', { headers, data: { isOpen: true } });
  expect(open.status()).toBe(400);
  for (const position of [
    { positionX: -1, positionY: 16 },
    { positionX: 9.5, positionY: 16 },
    { positionX: 8, positionY: 8 },
  ]) {
    expect(
      (await request.patch('/api/parks/me/entrance', { headers, data: position })).status(),
    ).toBe(400);
  }
  const move = await request.patch('/api/parks/me/entrance', {
    headers,
    data: { positionX: 0, positionY: 13 },
  });
  expect(move.ok()).toBeTruthy();
  const moved = (await move.json()).data;
  expect(moved.gold).toBe(before.gold);
  expect(moved.entrance).toMatchObject({ x: 0, y: 13, onBoundary: true });
  const again = (await (await request.get(operationsPath, { headers })).json()).data;
  expect(again.totalAdmissionGold).toBe(0);
  expect(again.totalVisitors).toBe(0);
  const invalidType = await request.post('/api/buildings', {
    headers,
    data: { typeId: 'missing-type', positionX: 0, positionY: 0 },
  });
  expect(invalidType.status()).toBe(400);
  const locked = await request.post('/api/buildings', {
    headers,
    data: { typeId: 'visitor-viewing-platform', positionX: 12, positionY: 10 },
  });
  expect(locked.status()).toBe(400);
});
