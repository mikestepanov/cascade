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
    test("can navigate to workspaces page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects"); // Maps to Workspaces link
      await dashboardPage.expectActiveTab("projects"); // Checks for /workspaces/ URL
    });
  });

  test.describe("Workspace Creation", () => {
    test("can create a new workspace via sidebar button", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("projects"); // Navigates to Workspaces list

      // Wait for page to stabilize
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Click add new workspace button (was project button)
      await projectsPage.addProjectButton.click();

      // Should navigate to new workspace teams list
      // URL pattern: /workspaces/$slug/teams
      await page.waitForURL(/\/workspaces\/[^/]+\/teams/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
    });
  });

  test.describe("Project Board", () => {
    test("displays kanban board with columns", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

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
      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

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
