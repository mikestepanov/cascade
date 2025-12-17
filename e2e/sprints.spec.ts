import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Sprints E2E Tests
 *
 * Tests the sprint management functionality:
 * - Sprint tab navigation
 * - Sprint view display
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Sprints", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Sprint Navigation", () => {
    test("can navigate to sprints tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Create a project first
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await projectsPage.addProjectButton.click();
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });

      // Navigate to sprints tab
      await projectsPage.switchToTab("sprints");
      await expect(page).toHaveURL(/\/sprints/);
    });

    test("sprints tab shows sprint management UI", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Create a project first
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await projectsPage.addProjectButton.click();
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });

      // Navigate to sprints tab
      await projectsPage.switchToTab("sprints");

      // Should show sprints-related content (heading, create button, etc.)
      // This is a smoke test to ensure the page loads without error
      await expect(page.getByText(/sprint/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Backlog Navigation", () => {
    test("can navigate to backlog tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Create a project first
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await projectsPage.addProjectButton.click();
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });

      // Navigate to backlog tab
      await projectsPage.switchToTab("backlog");
      await expect(page).toHaveURL(/\/backlog/);
    });
  });
});
