import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Issues E2E Tests
 *
 * Tests the issue management functionality:
 * - Issue creation
 * - Issue detail view
 * - Issue updates
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Issues", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Issue Creation", () => {
    test("can create an issue from board view", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a unique workspace for this test run to avoid dependency on global state
      // which might be cleared by other tests (e.g., cleanup-workspaces)
      await projectsPage.createWorkspace(`WS ${uniqueId}`);

      // Go back to projects page as createWorkspace navigates away
      await projectsPage.goto();

      // Create a project
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await projectsPage.expectBoardVisible();

      // Create an issue
      // We need to wait for the board to be fully interactive
      await page.waitForTimeout(1000);
      await projectsPage.createIssue(issueTitle);

      // Verify modal closes
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // For Scrum projects (default template), new issues go to Backlog
      // Switch to Backlog tab to verify
      await projectsPage.switchToTab("backlog");

      // Wait for backlog board to fully render
      await page.waitForTimeout(2000);

      // Verify issue appears in backlog
      const issueCard = projectsPage.getIssueCard(issueTitle);
      await expect(issueCard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Issue Detail", () => {
    test("can open issue detail dialog", async ({ projectsPage, page }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Detail Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a project
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await projectsPage.expectBoardVisible();

      // Create an issue
      await page.waitForTimeout(1000);
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open detail dialog
      await projectsPage.openIssueDetail(issueTitle);

      // Verify dialog visible
      await expect(projectsPage.issueDetailDialog).toBeVisible({ timeout: 5000 });
    });

    test("issue detail shows timer controls", async ({ projectsPage, page }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Timer Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a project
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await projectsPage.expectBoardVisible();

      // Create an issue
      await page.waitForTimeout(1000);
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open detail dialog
      await projectsPage.openIssueDetail(issueTitle);

      // Verify timer controls
      await expect(projectsPage.startTimerButton).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);

      // Timer start button should be visible
    });
  });
});
