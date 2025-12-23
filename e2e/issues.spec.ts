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
      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `KEY${uniqueId}`.slice(0, 5); // Short key
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 15000 });
      await projectsPage.expectBoardVisible();

      // Create an issue
      const issueTitle = `Test Issue ${uniqueId}`;
      await projectsPage.createIssue(issueTitle);

      // Wait for modal to close
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Verify issue card appears on board
      const issueCard = projectsPage.getIssueCard(issueTitle);
      await expect(issueCard).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Issue Detail", () => {
    test("can open issue detail dialog", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `KEY${uniqueId}`.slice(0, 5);
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 15000 });

      // Create an issue
      const issueTitle = `Detail Test Issue ${uniqueId}`;
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open issue detail
      await projectsPage.openIssueDetail(issueTitle);

      // Dialog should be visible
      await expect(projectsPage.issueDetailDialog).toBeVisible({ timeout: 5000 });
    });

    test("issue detail shows timer controls", async ({ dashboardPage, projectsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to projects page to access Create Project functionality
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `KEY${uniqueId}`.slice(0, 5);
      await projectsPage.createProject(`Project ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 15000 });

      // Create an issue
      const issueTitle = `Timer Test Issue ${uniqueId}`;
      await projectsPage.createIssue(issueTitle);
      await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

      // Open issue detail
      await projectsPage.openIssueDetail(issueTitle);

      // Wait for dialog content to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Timer start button should be visible
      await expect(projectsPage.startTimerButton).toBeVisible({ timeout: 5000 });
    });
  });
});
