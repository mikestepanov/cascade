import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Sign Out E2E Tests
 *
 * This file runs BEFORE z-onboarding.spec.ts alphabetically.
 * Sign out invalidates tokens server-side, but z-onboarding tests
 * will load fresh auth state from the file saved before this test ran.
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 *
 * Uses DashboardPage and LandingPage page objects for consistent locators.
 */

test.describe("Sign Out", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  // Re-authenticate if tokens were invalidated before this test
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test("sign out returns to landing page", async ({ dashboardPage, landingPage }) => {
    // Navigate to dashboard via proper entry point
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    // Sign out via user menu dropdown
    await dashboardPage.signOutViaUserMenu();

    // Should return to landing page - verify Get Started button is visible
    await expect(landingPage.heroGetStartedButton).toBeVisible({ timeout: 10000 });
  });
});
