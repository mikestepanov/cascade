import { authenticatedTest, expect, test } from "./fixtures";

/**
 * Error Scenario E2E Tests
 *
 * Tests error handling and edge cases:
 * - Access to non-existent resources
 * - Unauthenticated access to protected routes
 *
 * Note: Traditional 404 pages for random routes don't exist in this app
 * because /$orgSlug is a catch-all dynamic route. Invalid org slugs
 * redirect to landing page instead of showing 404.
 */

test.describe("Unauthenticated Access", () => {
  test("redirects to signin when accessing protected route", async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto("/some-org/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to signin or show landing
    // (Depends on implementation - check for either)
    const isOnSignin = await page
      .getByRole("heading", { name: /welcome back|sign in/i })
      .isVisible()
      .catch(() => false);
    const isOnLanding = await page
      .getByRole("heading", { name: /revolutionize/i })
      .isVisible()
      .catch(() => false);

    expect(isOnSignin || isOnLanding).toBe(true);
  });
});

authenticatedTest.describe("Non-existent Resources", () => {
  authenticatedTest.describe.configure({ mode: "serial" });

  authenticatedTest.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  authenticatedTest(
    "shows not found message for non-existent project",
    async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Navigate to a non-existent project
      const orgSlug = new URL(page.url()).pathname.split("/")[1];
      await page.goto(`/${orgSlug}/projects/NONEXISTENT99999/board`);
      await page.waitForLoadState("domcontentloaded");

      // Should show project not found message
      await expect(
        page
          .getByText(/project not found/i)
          .or(page.getByText(/doesn't exist/i))
          .or(page.getByText(/404/)),
      ).toBeVisible({ timeout: 10000 });
    },
  );

  authenticatedTest(
    "shows not found message for non-existent document",
    async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Navigate to a non-existent document
      const orgSlug = new URL(page.url()).pathname.split("/")[1];
      await page.goto(`/${orgSlug}/documents/jf77777777777777777`);
      await page.waitForLoadState("domcontentloaded");

      // Should show document not found or error
      // Allow some time for Convex to return the not found state
      await expect(
        page
          .getByText(/not found/i)
          .or(page.getByText(/doesn't exist/i))
          .or(page.getByText(/404/))
          .or(page.getByText(/couldn't find/i)),
      ).toBeVisible({ timeout: 15000 });
    },
  );

  authenticatedTest(
    "shows not found message for non-existent issue",
    async ({ page, dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();

      // Navigate to a non-existent issue
      const orgSlug = new URL(page.url()).pathname.split("/")[1];
      await page.goto(`/${orgSlug}/issues/FAKE-99999`);
      await page.waitForLoadState("domcontentloaded");

      // Should show issue not found
      await expect(
        page
          .getByText(/issue not found/i)
          .or(page.getByText(/not found/i))
          .or(page.getByText(/doesn't exist/i))
          .or(page.getByText(/404/)),
      ).toBeVisible({ timeout: 15000 });
    },
  );
});
