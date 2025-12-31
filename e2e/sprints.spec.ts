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
      workspacesPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await workspacesPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await workspacesPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await workspacesPage.expectBoardVisible();

      await workspacesPage.switchToTab("sprints");

      // Verify URL contains sprints
      await expect(page).toHaveURL(/\/sprints/);
    });

    test("sprints tab shows sprint management UI", async ({
      dashboardPage,
      workspacesPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await workspacesPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await workspacesPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await workspacesPage.expectBoardVisible();

      // Navigate to sprints tab
      await workspacesPage.switchToTab("sprints");

      // Verify start sprint button is visible
      await expect(page.getByRole("button", { name: /start sprint/i })).toBeVisible();
    });
  });

  test.describe("Backlog Navigation", () => {
    test("can navigate to backlog tab in project", async ({
      dashboardPage,
      workspacesPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await workspacesPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `PROJ${uniqueId.toString().slice(-4)}`;
      await workspacesPage.createProject(`Backlog Test ${uniqueId}`, projectKey);
      await workspacesPage.expectBoardVisible();

      // Navigate to backlog tab
      // Check for button enabled state as proxy for existence and interactivity
      // Note: This relies on the specific UI implementation of the backlog tab/button
      const backlogTab = page
        .getByRole("tab", { name: "Backlog" })
        .or(page.getByRole("button", { name: "Backlog" }));
      if (await backlogTab.isVisible()) {
        await backlogTab.click();
        await expect(page).toHaveURL(/\/backlog/);
      } else {
        // Fallback or specific logic if backlog is inside another view?
        // Assuming switchToTab handles it if it's a standard method
        await workspacesPage.switchToTab("backlog");
        await expect(page).toHaveURL(/\/backlog/);
      }
    });
  });
});
