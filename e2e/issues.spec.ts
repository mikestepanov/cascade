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
    test("can create an issue from board view", async ({ dashboardPage, workspacesPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await workspacesPage.goto();

      // Create a project
      await workspacesPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await workspacesPage.expectBoardVisible();

      // Create an issue
      // We need to wait for the board to be fully interactive
      await page.waitForTimeout(1000);
      await workspacesPage.createIssue(issueTitle);

      // Verify modal closes
      await expect(workspacesPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Verify issue appears on board
      const issueCard = workspacesPage.getIssueCard(issueTitle);
      await expect(issueCard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Issue Detail", () => {
    test("can open issue detail dialog", async ({ dashboardPage, workspacesPage, page }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Detail Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await workspacesPage.goto();

      // Create a project
      await workspacesPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await workspacesPage.expectBoardVisible();

      // Create an issue
      await page.waitForTimeout(1000);
      await workspacesPage.createIssue(issueTitle);
      await expect(workspacesPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open detail dialog
      await workspacesPage.openIssueDetail(issueTitle);

      // Verify dialog visible
      await expect(workspacesPage.issueDetailDialog).toBeVisible({ timeout: 5000 });
    });

    test("issue detail shows timer controls", async ({ dashboardPage, workspacesPage, page }) => {
      // Create project first
      const uniqueId = Date.now().toString();
      const projectKey = `PROJ${uniqueId.slice(-4)}`;
      const issueTitle = "Timer Test Issue";

      // Use direct URL navigation to projects page to access Create Project functionality
      await workspacesPage.goto();

      // Create a project
      await workspacesPage.createProject(`Project ${uniqueId}`, projectKey);

      // Verify board loaded
      await workspacesPage.expectBoardVisible();

      // Create an issue
      await page.waitForTimeout(1000);
      await workspacesPage.createIssue(issueTitle);
      await expect(workspacesPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open detail dialog
      await workspacesPage.openIssueDetail(issueTitle);

      // Verify timer controls
      await expect(workspacesPage.startTimerButton).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);

      // Timer start button should be visible
    });
  });
});
