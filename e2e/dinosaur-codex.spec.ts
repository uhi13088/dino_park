import { test, expect, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '../apps/server/node_modules/@prisma/client';
import { mkdir } from 'node:fs/promises';
import type { DinosaurCodexResponse, LoginResponse } from '@dino-park/shared';

test.setTimeout(90_000);
const database = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5432/dino_park?schema=public' },
  },
});
const testUsers: string[] = [];

async function account(request: APIRequestContext) {
  const response = await request.post('/api/auth/toss/login', {
    data: { tossId: 'codex-test-' + Date.now() + '-' + Math.random(), nickname: '도감 테스트' },
  });
  expect(response.ok()).toBeTruthy();
  const login = (await response.json()).data as LoginResponse;
  testUsers.push(login.user.id);
  const headers = { Authorization: 'Bearer ' + login.accessToken };
  expect((await request.post('/api/parks/me/starter', { headers })).ok()).toBeTruthy();
  return { login, headers };
}

async function readCodex(request: APIRequestContext, headers: Record<string, string>) {
  const response = await request.get('/api/dinosaurs/codex', { headers });
  expect(response.status()).toBe(200);
  return (await response.json()).data as DinosaurCodexResponse;
}

test.afterAll(async () => {
  if (testUsers.length) await database.user.deleteMany({ where: { id: { in: testUsers } } });
  await database.$disconnect();
});

test('codex shows real collection, rarity/origin filters, Lux detail and current recipes', async ({
  page,
  request,
}) => {
  const { login } = await account(request);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    { accessToken: login.accessToken, refreshToken: login.refreshToken },
  );
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('/dinosaur');
  await expect(page.getByTestId('codex-summary')).toContainText('1/81종', { timeout: 30_000 });
  await expect(page.getByTestId('codex-entry-parasaurolophus')).toHaveAttribute(
    'data-collected',
    'true',
  );
  await expect(page.getByTestId('codex-entry-parasaurolophus')).toHaveAccessibleDescription(
    '일반 자연종 1마리 보유',
  );
  await expect(page.getByRole('link', { name: '도감', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await mkdir('.impeccable/review', { recursive: true });
  await page.screenshot({ path: '.impeccable/review/mobile-list.png' });

  await page.getByRole('combobox', { name: '공룡 등급', exact: true }).selectOption('epic');
  await page.getByRole('button', { name: '변종', exact: true }).click();
  await expect(page.getByTestId('codex-entry-parasaurolophus-lux')).toBeVisible();
  await expect(page.getByTestId('codex-entry-parasaurolophus-lux')).toHaveAccessibleDescription(
    '영웅 변종 미수집',
  );
  await expect(page.getByTestId('codex-entry-parasaurolophus')).toHaveCount(0);
  await page.getByRole('button', { name: '파라사우롤로푸스 룩스 상세 보기', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '파라사우롤로푸스 룩스', exact: true }),
  ).toBeFocused();
  const detail = page.getByRole('complementary');
  await expect(detail.getByText('영웅', { exact: true })).toBeVisible();
  await expect(detail.getByText('변종', { exact: true })).toBeVisible();
  await expect(detail.getByText('1마리 보유', { exact: true })).toBeVisible();
  await expect(detail.getByRole('table')).toContainText('변이세포');
  await expect(detail.getByRole('table')).toContainText('중급');
  await expect(detail.getByText('50%', { exact: true })).toHaveCount(2);
  await expect(detail.getByText(/아직 연구가 개방되지 않았어요/)).toBeAttached();
  await page.screenshot({ path: '.impeccable/review/mobile.png' });
  await detail.getByRole('heading', { name: '합성 레시피', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.impeccable/review/mobile-recipe.png' });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await detail.getByRole('button', { name: /파라사우롤로푸스/ }).click();
  await expect(page.getByRole('heading', { name: '파라사우롤로푸스', exact: true })).toBeFocused();
  await expect(
    page.getByRole('heading', { name: '파라사우롤로푸스', exact: true }),
  ).toBeInViewport();
  await expect.poll(() => detail.evaluate((pane) => pane.scrollTop)).toBe(0);
  await page.getByRole('button', { name: /목록으로/ }).click();
  await expect(
    page.getByRole('button', { name: '파라사우롤로푸스 룩스 상세 보기', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: '파라사우롤로푸스 룩스 상세 보기', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '파라사우롤로푸스 룩스', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByTestId('codex-summary')).toContainText('1/81종');
  await page.screenshot({ path: '.impeccable/review/desktop.png' });
  await page
    .getByRole('complementary')
    .getByRole('heading', { name: '합성 레시피', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.impeccable/review/desktop-recipe.png' });
  await expect
    .poll(() => page.getByRole('complementary').evaluate((pane) => pane.scrollTop))
    .toBeGreaterThan(0);
  await page
    .getByRole('complementary')
    .getByRole('button', { name: /파라사우롤로푸스/ })
    .click();
  await expect(page.getByRole('heading', { name: '파라사우롤로푸스', exact: true })).toBeFocused();
  await expect(
    page.getByRole('heading', { name: '파라사우롤로푸스', exact: true }),
  ).toBeInViewport();
  await expect
    .poll(() => page.getByRole('complementary').evaluate((pane) => pane.scrollTop))
    .toBe(0);

  await page.getByRole('button', { name: '전체', exact: true }).click();
  await page.getByRole('combobox', { name: '공룡 등급', exact: true }).selectOption('legendary');
  await page.getByLabel('공룡 이름 검색').fill('인도미누스 렉스');
  await page.getByRole('button', { name: '인도미누스 렉스 상세 보기', exact: true }).click();
  await expect(page.getByRole('complementary').getByRole('table')).toContainText('상급');
  await expect(page.getByRole('complementary').getByText('30%', { exact: true })).toBeAttached();
  await page.getByLabel('공룡 이름 검색').fill('');
  await page.getByRole('button', { name: '하이브리드', exact: true }).click();
  await page.getByRole('combobox', { name: '공룡 등급', exact: true }).selectOption('epic');
  await expect(page.getByTestId('codex-entry-stegoceratops')).toHaveAccessibleDescription(
    '영웅 하이브리드 미수집',
  );
  await page.getByRole('button', { name: '스테고케라톱스 상세 보기', exact: true }).click();
  await expect(page.getByRole('complementary')).toContainText('첫 지정 합성은 100% 성공해');
  await expect(page.getByRole('complementary')).toContainText('파크당 한 번 적용');
  await expect(page.getByRole('complementary').getByText('50%', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('complementary')).toContainText('최대 5번째');
  await page.getByRole('combobox', { name: '공룡 등급', exact: true }).selectOption('rare');
  await expect(page.getByRole('heading', { name: '조건에 맞는 공룡이 없어요' })).toBeVisible();
  await page.getByRole('button', { name: '변종', exact: true }).click();
  await expect(page.getByRole('heading', { name: '조건에 맞는 공룡이 없어요' })).toBeVisible();
  await page.getByRole('button', { name: '전체 공룡 보기' }).click();
  await page.getByLabel('공룡 이름 검색').fill('없는 공룡');
  await expect(page.getByRole('heading', { name: '조건에 맞는 공룡이 없어요' })).toBeVisible();
  await page.getByRole('button', { name: '전체 공룡 보기' }).click();
  await page.getByRole('combobox', { name: '수집 상태', exact: true }).selectOption('owned');
  await expect(page.getByRole('button', { name: /상세 보기$/ })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('collection persists after release, backfills old ownership once, and stays private', async ({
  request,
}) => {
  const { login, headers } = await account(request);
  const park = await database.park.findUniqueOrThrow({ where: { userId: login.user.id } });
  await database.dinosaur.createMany({
    data: [
      {
        parkId: park.id,
        speciesId: 'triceratops',
        positionX: 1,
        positionY: 1,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        parkId: park.id,
        speciesId: 'triceratops',
        positionX: 2,
        positionY: 1,
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
    ],
  });
  const releasedBeforeRead = await database.dinosaur.create({
    data: { parkId: park.id, speciesId: 'iguanodon', positionX: 3, positionY: 1 },
  });
  expect(
    (await request.delete('/api/dinosaurs/' + releasedBeforeRead.id, { headers })).ok(),
  ).toBeTruthy();
  const reads = await Promise.all([readCodex(request, headers), readCodex(request, headers)]);
  for (const result of reads) {
    expect(result.summary).toMatchObject({
      totalSpecies: 81,
      collectedSpecies: 3,
      ownedSpecies: 2,
      ownedDinosaurs: 3,
    });
    expect(result.entries.find((entry) => entry.speciesId === 'triceratops')?.collection).toEqual({
      collected: true,
      ownedCount: 2,
      firstCollectedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(
      result.entries.find((entry) => entry.speciesId === 'iguanodon')?.collection,
    ).toMatchObject({ collected: true, ownedCount: 0 });
  }
  const triceratops = await database.dinosaur.findMany({
    where: { parkId: park.id, speciesId: 'triceratops' },
  });
  for (const dino of triceratops)
    expect((await request.delete('/api/dinosaurs/' + dino.id, { headers })).ok()).toBeTruthy();
  const afterRelease = await readCodex(request, headers);
  expect(afterRelease.summary).toMatchObject({
    collectedSpecies: 3,
    ownedSpecies: 1,
    ownedDinosaurs: 1,
  });
  expect(
    afterRelease.entries.find((entry) => entry.speciesId === 'triceratops')?.collection,
  ).toMatchObject({ collected: true, ownedCount: 0 });
  expect(await database.dinosaurCollection.count({ where: { parkId: park.id } })).toBe(3);
  const other = await account(request);
  expect((await readCodex(request, other.headers)).summary).toMatchObject({
    collectedSpecies: 1,
    ownedDinosaurs: 1,
  });
  expect((await request.get('/api/dinosaurs/codex')).status()).toBe(401);
});
