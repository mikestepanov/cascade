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
    // SKIPPED: Known backend issue - nuke-workspaces API not deleting E2E workspaces correctly
    // See: The nukeWorkspacesInternal mutation filters by exact name match but workspaces
    // accumulate in the DB, likely due to encoding/whitespace differences or API not being called.
    // TODO: Debug the Convex mutation and fix the cleanup logic.
    test.skip("can create a new workspace via sidebar button", async ({
      dashboardPage,
      workspacesPage,
      page,
      request,
    }) => {
      // 1. Nuclear Cleanup: Delete ALL E2E workspaces to ensure a clean state
      // This is more reliable than targeting by name since we have slug/name mismatches
      const convexUrl = process.env.VITE_CONVEX_URL;
      if (!convexUrl) throw new Error("VITE_CONVEX_URL is not defined");

      const nukeResponse = await request.post(`${convexUrl}/e2e/nuke-workspaces`, {
        headers: {
          Authorization: `Bearer ${process.env.E2E_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {},
      });
      if (!nukeResponse.ok()) {
        console.error(`Nuke workspaces failed: ${await nukeResponse.text()}`);
      }
      expect(nukeResponse.ok(), "Failed to nuke workspaces").toBeTruthy();

      // Define the workspace name for creation
      const workspaceName = "🧪 E2E Testing Workspace";

      // Navigate directly to the workspaces page
      // Avoid intermediate dashboard visit and reload to prevent token invalidation
      await workspacesPage.goto();
      await workspacesPage.expectWorkspacesView();

      // Create a new workspace with the fixed unique name
      await workspacesPage.createWorkspace(workspaceName, "Engineering department");

      // Should navigate to new workspace teams list
      // URL pattern: /workspaces/$slug/teams
      await page.waitForURL(/\/workspaces\/[^/]+\/teams/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
    });
  });

  test.describe("Project Board", () => {
    test("displays kanban board with columns", async ({ dashboardPage, workspacesPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to projects page to access Create Project functionality
      await workspacesPage.goto();

      // Create a new project first
      const projectName = `Project-${Date.now()}`;
      const projectKey = `PROJ${Date.now().toString().slice(-4)}`;
      await workspacesPage.createProject(projectName, projectKey, "E2E Test Project");

      // Wait for project board to load (Projects still use /projects/board pattern)
      await page.waitForURL(/\/workspaces\/[^/]+\/board/, { timeout: 10000 });
      await workspacesPage.expectBoardVisible();

      // Board should have columns
      await expect(workspacesPage.boardColumns.first()).toBeVisible({ timeout: 10000 });
    });

    test("can switch between project tabs", async ({ dashboardPage, workspacesPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to projects page to access Create Project functionality
      await workspacesPage.goto();

      // Create a project to have access to tabs
      const projectName = `ProjectTabs-${Date.now()}`;
      const projectKey = `TABS${Date.now().toString().slice(-4)}`;
      await workspacesPage.createProject(projectName, projectKey, "E2E Test Project Tabs");
      await page.waitForURL(/\/workspaces\/[^/]+\/board/, { timeout: 10000 });

      // Test tab navigation
      await workspacesPage.switchToTab("backlog");
      await expect(page).toHaveURL(/\/backlog/);

      await workspacesPage.switchToTab("sprints");
      await expect(page).toHaveURL(/\/sprints/);

      await workspacesPage.switchToTab("analytics");
      await expect(page).toHaveURL(/\/analytics/);

      await workspacesPage.switchToTab("settings");
      await expect(page).toHaveURL(/\/settings/);

      // Back to board
      await workspacesPage.switchToTab("board");
      await expect(page).toHaveURL(/\/board/);
    });
  });
});
