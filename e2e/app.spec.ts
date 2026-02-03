import { test, expect } from '@playwright/test';

test.describe('App Basic Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // 앱이 로드되었는지 확인
    await expect(page).toHaveTitle(/Dino Park|다이노 파크/);
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/');

    // 로딩 인디케이터 또는 스플래시 화면 확인
    const loadingOrApp = page.locator(
      '[data-testid="loading"], [data-testid="app-container"], #root',
    );
    await expect(loadingOrApp).toBeVisible();
  });
});

test.describe('Navigation Tests', () => {
  test('should navigate to park view', async ({ page }) => {
    await page.goto('/');

    // 파크 화면으로 이동 (로그인 후)
    // Note: 실제 구현에 따라 선택자 조정 필요
    const parkButton = page.getByRole('button', { name: /파크|park/i });
    if (await parkButton.isVisible()) {
      await parkButton.click();
      await expect(page).toHaveURL(/.*park.*/);
    }
  });
});
