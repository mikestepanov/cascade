import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Sign Out E2E Tests
 *
 * This file runs BEFORE z-onboarding.spec.ts alphabetically.
 * Sign out invalidates tokens server-side, but z-onboarding tests
 * will load fresh auth state from the file saved before this test ran.
 */

test.describe("Sign Out", () => {
  test.use({ skipAuthSave: true });

  test("sign out returns to landing page", async ({ page }) => {
    // Navigate to any authenticated page - may land on dashboard or onboarding
    // Use domcontentloaded - networkidle never resolves due to Convex WebSockets
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000); // Allow React to hydrate

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

    // Open user menu (click the avatar button in the header)
    const userMenuButton = page.getByRole("button", { name: "User menu" });
    await userMenuButton.click();
    await page.waitForTimeout(300); // Wait for dropdown to open

    // Click sign out in the dropdown menu
    const signOutButton = page.getByRole("menuitem", { name: /sign out/i });
    await signOutButton.click();

    // Should return to landing page
    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
