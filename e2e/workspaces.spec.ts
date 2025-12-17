import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Workspaces E2E Tests
 *
 * Tests the project (project) management functionality:
 * - Project creation
 * - Project navigation
 * - Board view
 * - Tabs navigation
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Workspaces", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Project Navigation", () => {
    test("can navigate to projects page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects"); // Note: "projects" in code maps to /projects/ URL
      await dashboardPage.expectActiveTab("projects");
    });
  });

  test.describe("Project Creation", () => {
    test("can create a new project via sidebar button", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Wait for page to stabilize
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Click add new project button in sidebar
      await projectsPage.addProjectButton.click();

      // Should navigate to new project board
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });
      await projectsPage.expectBoardVisible();
    });
  });

  test.describe("Project Board", () => {
    test("displays kanban board with columns", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Create a new project first
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await projectsPage.addProjectButton.click();

      // Wait for board to load
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });
      await projectsPage.expectBoardVisible();

      // Board should have columns
      await expect(projectsPage.boardColumns.first()).toBeVisible({ timeout: 10000 });
    });

    test("can switch between project tabs", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects");

      // Create a project to have access to tabs
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      await projectsPage.addProjectButton.click();
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });

      // Test tab navigation
      await projectsPage.switchToTab("backlog");
      await expect(page).toHaveURL(/\/backlog/);

      await projectsPage.switchToTab("sprints");
      await expect(page).toHaveURL(/\/sprints/);

      await projectsPage.switchToTab("analytics");
      await expect(page).toHaveURL(/\/analytics/);

      await projectsPage.switchToTab("settings");
      await expect(page).toHaveURL(/\/settings/);

      // Back to board
      await projectsPage.switchToTab("board");
      await expect(page).toHaveURL(/\/board/);
    });
  });
});
