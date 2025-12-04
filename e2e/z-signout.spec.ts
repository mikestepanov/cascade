import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Sign Out E2E Tests
 *
 * IMPORTANT: This file is named with a 'z-' prefix to ensure it runs LAST.
 * The sign out test invalidates auth tokens server-side, which would cause
 * subsequent authenticated tests to fail.
 */

test.describe("Sign Out", () => {
  test("sign out returns to landing page", async ({ page }) => {
    // Navigate to any authenticated page - may land on dashboard or onboarding
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Wait for either dashboard or onboarding to load
    const dashboard = page.getByRole("heading", { name: /my work/i });
    const onboarding = page.getByRole("heading", { name: /welcome to nixelo/i });

    // Wait for one of them to appear
    await expect(dashboard.or(onboarding)).toBeVisible({ timeout: 15000 });

    // If we're on onboarding, skip it first to get to dashboard
    if (await onboarding.isVisible()) {
      const skipButton = page.getByRole("button", { name: /skip for now/i });
      await skipButton.click();
      await expect(dashboard).toBeVisible({ timeout: 10000 });
    }

    // Now sign out
    const signOutButton = page.getByRole("button", { name: /sign out/i });
    await signOutButton.click();

    // Should return to landing page
    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
