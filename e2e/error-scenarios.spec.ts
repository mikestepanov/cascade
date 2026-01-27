import { authenticatedTest, expect, test } from "./fixtures";

/**
 * Error Scenario E2E Tests
 *
 * Tests error handling and edge cases:
 * - 404 pages for non-existent routes
 * - Access to non-existent resources
 * - Unauthenticated access to protected routes
 */

test.describe("404 Error Pages", () => {
  test("shows 404 page for non-existent public route", async ({ page }) => {
    await page.goto("/this-route-definitely-does-not-exist-12345");
    await page.waitForLoadState("domcontentloaded");

    // Should show 404 page
    await expect(page.getByText("404")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/page not found/i)).toBeVisible();

    // Should have link to go home
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });

  test("can navigate home from 404 page", async ({ page }) => {
    await page.goto("/non-existent-page-xyz");
    await page.waitForLoadState("domcontentloaded");

    // Wait for 404 page
    await expect(page.getByText("404")).toBeVisible({ timeout: 10000 });

    // Click go home link
    await page.getByRole("link", { name: /go home/i }).click();
    await page.waitForLoadState("domcontentloaded");

    // Should be on landing page
    await expect(page).toHaveURL("/");
    // Landing page should show hero section
    await expect(page.getByRole("heading", { name: /revolutionize/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

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
