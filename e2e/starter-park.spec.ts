import { test, expect, type Page } from '@playwright/test';
import type { DinosaurResponse, BuildingResponse, CurrencyResponse } from '@dino-park/shared';

test.setTimeout(120_000);

interface SavedPark {
  dinosaurs: DinosaurResponse[];
  buildings: BuildingResponse[];
}

async function readPark(page: Page): Promise<SavedPark> {
  return page.evaluate(async () => {
    const response = await fetch('/api/parks/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    if (!response.ok) throw new Error(`Park query failed: ${response.status}`);
    return (await response.json()).data;
  });
}

async function readCurrency(page: Page): Promise<CurrencyResponse> {
  return page.evaluate(async () => {
    const response = await fetch('/api/economy/currency', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    return (await response.json()).data;
  });
}

test('starter park supports pointer placement, feeding and persisted keyboard movement', async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('/');
  await page.getByRole('button', { name: '게임 시작', exact: true }).click();
  await expect(page.getByRole('region', { name: '파크 지도', exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('파크를 준비하고 있어요…', { exact: true })).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.getByRole('button', { name: '공룡 배치하기', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: '시설 2', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  const initial = await readPark(page);
  expect(initial.dinosaurs).toHaveLength(1);
  expect(initial.dinosaurs[0]).toMatchObject({ speciesId: 'parasaurolophus', isInPark: false });
  expect(initial.buildings.map((building) => building.typeId).sort()).toEqual([
    'habitat-grassland',
    'operation-entrance-gate',
  ]);

  await page.getByRole('button', { name: '공룡 배치하기', exact: true }).click();
  const confirmPlacement = page.getByRole('button', { name: '공룡 배치 확정', exact: true });
  await expect(confirmPlacement).toBeEnabled();
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The actual park canvas is missing');
  // At placement zoom 1, an adjacent isometric cell is 32px right and 16px down.
  await canvas.click({ position: { x: bounds.width / 2 + 32, y: bounds.height / 2 + 16 } });
  await expect(page.getByRole('region', { name: '배치 안내', exact: true })).toContainText(
    '선택 (10, 9)',
  );
  expect((await readPark(page)).dinosaurs[0]).toMatchObject({
    positionX: initial.dinosaurs[0].positionX,
    positionY: initial.dinosaurs[0].positionY,
    isInPark: false,
  });
  // Returning to the focused tile (9,9) still previews without saving.
  await canvas.click({ position: { x: bounds.width / 2, y: bounds.height / 2 } });
  await expect(page.getByRole('region', { name: '배치 안내', exact: true })).toContainText(
    '선택 (9, 9)',
  );
  expect((await readPark(page)).dinosaurs[0].isInPark).toBe(false);
  await confirmPlacement.click();
  await expect(
    page.getByRole('button', { name: '먹이 주기 · 100골드', exact: true }),
  ).toBeEnabled();
  await expect
    .poll(async () => (await readPark(page)).dinosaurs[0])
    .toMatchObject({ positionX: 9, positionY: 9, isInPark: true });
  const beforeFeed = await readCurrency(page);
  await page.getByRole('button', { name: '먹이 주기 · 100골드', exact: true }).click();
  await expect(page.getByRole('button', { name: '배불러요', exact: true })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: '잘 먹었어요' })).toBeVisible();
  const fed = (await readPark(page)).dinosaurs[0];
  expect(fed).toMatchObject({ hunger: 0, happiness: 95, intimacy: 5 });
  expect((await readCurrency(page)).gold).toBe(beforeFeed.gold - 100);
  await page.screenshot({ path: testInfo.outputPath('feeding-mobile.png') });

  await page.getByRole('button', { name: '위치 옮기기', exact: true }).click();
  const map = page.getByRole('region', { name: '파크 지도', exact: true });
  await expect(map).toBeFocused();
  await map.press('ArrowRight');
  await map.press('Enter');
  await expect.poll(async () => (await readPark(page)).dinosaurs[0].positionX).toBe(10);
  await page.reload();
  await expect(page.getByRole('region', { name: '파크 지도', exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('파크를 준비하고 있어요…', { exact: true })).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: '공룡 1', exact: true })).toBeVisible();
  const saved = await readPark(page);
  expect(saved.dinosaurs).toHaveLength(1);
  expect(saved.buildings).toHaveLength(2);
  expect(saved.dinosaurs[0]).toMatchObject({ positionX: 10, positionY: 9, hunger: 0, intimacy: 5 });
  await page.getByRole('button', { name: '공룡 1', exact: true }).click();
  await page.getByRole('button', { name: '돌보기', exact: true }).click();
  await expect(page.getByRole('button', { name: '배불러요', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('feeding-desktop.png') });
  expect(pageErrors).toEqual([]);
});

test('real API prevents duplicate starter grants, double feeding and invalid or foreign placement', async ({
  request,
}) => {
  const login = await request.post('/api/auth/toss/login', {
    data: { tossId: `play-test-${Date.now()}-${Math.random()}`, nickname: '테스트 사육사' },
  });
  expect(login.ok()).toBeTruthy();
  const { data: account } = await login.json();
  const headers = { Authorization: `Bearer ${account.accessToken}` };
  const grants = await Promise.all(
    [1, 2].map(() => request.post('/api/parks/me/starter', { headers })),
  );
  const results = await Promise.all(grants.map((response) => response.json()));
  expect(results.filter((body) => body.data.granted)).toHaveLength(1);
  const park = (await (await request.get('/api/parks/me', { headers })).json()).data as SavedPark;
  expect(park.dinosaurs).toHaveLength(1);
  expect(park.buildings).toHaveLength(2);
  const dinosaur = park.dinosaurs[0];
  for (const position of [
    { positionX: -1, positionY: 9 },
    { positionX: 9.5, positionY: 9 },
    { positionX: 20, positionY: 9 },
    { positionX: 13, positionY: 17 },
  ]) {
    const invalid = await request.post(`/api/dinosaurs/${dinosaur.id}/place`, {
      headers,
      data: position,
    });
    expect(invalid.status()).toBe(400);
  }
  const place = await request.post(`/api/dinosaurs/${dinosaur.id}/place`, {
    headers,
    data: { positionX: 9, positionY: 9 },
  });
  expect(place.ok()).toBeTruthy();
  const before = (await (await request.get('/api/economy/currency', { headers })).json()).data;
  const feeds = await Promise.all(
    [1, 2].map(() => request.post(`/api/dinosaurs/${dinosaur.id}/feed`, { headers })),
  );
  expect(feeds.map((response) => response.status()).sort()).toEqual([201, 400]);
  const after = (await (await request.get('/api/economy/currency', { headers })).json()).data;
  expect(after.gold).toBe(before.gold - 100);
  const second = await request.post('/api/auth/toss/login', {
    data: { tossId: `other-${Date.now()}-${Math.random()}` },
  });
  const { data: otherAccount } = await second.json();
  const foreign = await request.post(`/api/dinosaurs/${dinosaur.id}/place`, {
    headers: { Authorization: `Bearer ${otherAccount.accessToken}` },
    data: { positionX: 10, positionY: 9 },
  });
  expect(foreign.status()).toBe(403);
});
