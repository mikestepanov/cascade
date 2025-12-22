import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Workspaces E2E Tests
 *
 * Tests the Workspace and Project management functionality:
 * - Workspace/Project creation
 * - Navigation between Workspaces
 * - Project Board views
 * - Tabs navigation
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
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
      await dashboardPage.navigateTo("projects"); // "Projects" tab now navigates to /workspaces
      await dashboardPage.expectActiveTab("projects"); // Verifies /workspaces URL via dashboardPage helper
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
      await page.waitForTimeout(1000);

      // Create a new workspace with a unique name
      const workspaceName = `Engineering ${Date.now()}`;
      await projectsPage.createWorkspace(workspaceName, "Engineering department");

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
      const projectName = `Project-${Date.now()}`;
      const projectKey = `PROJ${Date.now().toString().slice(-4)}`;
      await projectsPage.createProject(projectName, projectKey, "E2E Test Project");

      // Wait for project board to load (Projects still use /projects/board pattern)
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
      const projectName = `ProjectTabs-${Date.now()}`;
      const projectKey = `TABS${Date.now().toString().slice(-4)}`;
      await projectsPage.createProject(projectName, projectKey, "E2E Test Project Tabs");
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
