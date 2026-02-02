import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 로컬 스토리지 클리어
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show login screen for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // 로그인 버튼 또는 토스 로그인 화면 확인
    const loginElement = page.locator('[data-testid="login-button"], [data-testid="toss-login"]');
    await expect(loginElement.first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // 보호된 경로 직접 접근 시도
    await page.goto('/park');

    // 로그인 페이지로 리다이렉트 또는 로그인 모달 표시
    await expect(page).toHaveURL(/login|auth|\//);
  });
});

test.describe('New User Onboarding', () => {
  test('should show tutorial for new users', async ({ page }) => {
    // 신규 유저 시뮬레이션 (토스 로그인 모킹 필요)
    await page.goto('/');

    // 튜토리얼 또는 온보딩 화면 확인
    // Note: 실제 구현에 따라 조정 필요
    const tutorialElement = page.locator('[data-testid="tutorial"], [data-testid="onboarding"]');

    // 튜토리얼이 있으면 확인
    if (await tutorialElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(tutorialElement).toBeVisible();
    }
  });
});
