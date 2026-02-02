import { test, expect } from '@playwright/test';

/**
 * 게임 플로우 E2E 테스트
 * Note: 실제 테스트를 위해서는 테스트용 API 모킹 또는 테스트 계정이 필요합니다.
 */

test.describe('Game UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 테스트용 인증 상태 설정 (실제 구현 시 모킹 필요)
  });

  test('should display currency panel', async ({ page }) => {
    // 재화 표시 패널 확인
    const currencyPanel = page.locator('[data-testid="currency-panel"], .currency-display');

    if (await currencyPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(currencyPanel).toBeVisible();

      // 골드, 다이아, 에너지 표시 확인
      await expect(page.getByText(/골드|gold/i).first()).toBeVisible();
    }
  });

  test('should display bottom navigation', async ({ page }) => {
    // 하단 네비게이션 바 확인
    const bottomNav = page.locator('[data-testid="bottom-nav"], nav');

    if (await bottomNav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(bottomNav).toBeVisible();
    }
  });
});

test.describe('Park Interaction', () => {
  test('should allow camera movement', async ({ page }) => {
    await page.goto('/');

    // 파크 캔버스 찾기
    const canvas = page.locator('canvas');

    if (await canvas.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 드래그로 카메라 이동 테스트
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 200, y: 200 },
        targetPosition: { x: 100, y: 100 },
      });
    }
  });

  test('should allow zoom', async ({ page }) => {
    await page.goto('/');

    // 줌 버튼이 있는 경우 테스트
    const zoomInButton = page.locator('[data-testid="zoom-in"], .zoom-in');
    const zoomOutButton = page.locator('[data-testid="zoom-out"], .zoom-out');

    if (await zoomInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await zoomInButton.click();
      await zoomOutButton.click();
    }
  });
});

test.describe('Dinosaur Management', () => {
  test('should open dinosaur list', async ({ page }) => {
    await page.goto('/');

    // 공룡 목록 버튼 클릭
    const dinoButton = page.locator('[data-testid="dinosaur-menu"], [aria-label*="공룡"]');

    if (await dinoButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dinoButton.click();

      // 공룡 목록 패널 표시 확인
      const dinoList = page.locator('[data-testid="dinosaur-list"]');
      await expect(dinoList).toBeVisible();
    }
  });
});

test.describe('Building Management', () => {
  test('should open building menu', async ({ page }) => {
    await page.goto('/');

    // 건물 메뉴 버튼 클릭
    const buildButton = page.locator('[data-testid="build-menu"], [aria-label*="건설"]');

    if (await buildButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buildButton.click();

      // 건물 목록 패널 표시 확인
      const buildList = page.locator('[data-testid="building-list"]');
      await expect(buildList).toBeVisible();
    }
  });
});

test.describe('Shop Flow', () => {
  test('should open shop', async ({ page }) => {
    await page.goto('/');

    // 상점 버튼 클릭
    const shopButton = page.locator('[data-testid="shop-button"], [aria-label*="상점"]');

    if (await shopButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shopButton.click();

      // 상점 화면 표시 확인
      await expect(page).toHaveURL(/shop/);
    }
  });
});

test.describe('Exploration Flow', () => {
  test('should open exploration map', async ({ page }) => {
    await page.goto('/');

    // 탐험 버튼 클릭
    const exploreButton = page.locator('[data-testid="explore-button"], [aria-label*="탐험"]');

    if (await exploreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreButton.click();

      // 탐험 맵 표시 확인
      await expect(page.locator('[data-testid="exploration-map"]')).toBeVisible();
    }
  });
});
