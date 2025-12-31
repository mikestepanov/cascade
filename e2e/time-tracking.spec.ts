import { CONVEX_SITE_URL, E2E_API_KEY, TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Time Tracking E2E Tests
 * ...
 */

test.describe("Time Tracking", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  test.beforeEach(async () => {
    // Clean up any running timers for the test user to ensure clean state
    try {
      await fetch(`${CONVEX_SITE_URL}/e2e/nuke-timers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-e2e-api-key": E2E_API_KEY,
        },
        body: JSON.stringify({ email: TEST_USERS.teamLead.email }),
      });
      console.log("Helper: Nuked timers for test user");
    } catch (e) {
      console.error("Helper: Failed to nuke timers", e);
      // Fail the test if cleanup fails - we need a clean slate
      throw new Error(`Failed to nuke timers: ${e}`);
    }
  });

  test("user can track time on an issue", async ({
    dashboardPage,
    workspacesPage,
    page,
    ensureAuthenticated,
  }) => {
    const now = Date.now();
    const projectKey = `TT${now.toString().slice(-4)}`;
    const issueTitle = `Time Track Issue ${now}`;

    // Create project
    await workspacesPage.goto();
    // Default URL is /projects, explicitly wait for load
    // await page.waitForURL(/\/projects/); // projectsPage.goto() handles this

    await workspacesPage.createProject(`Time Tracking ${now}`, projectKey);

    // Verify board
    await workspacesPage.expectBoardVisible();

    // Create Issue
    // Wait for interactivity
    await page.waitForTimeout(1000);
    await workspacesPage.createIssue(issueTitle);

    // Close modal
    await expect(workspacesPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

    // Open detail
    await workspacesPage.openIssueDetail(issueTitle);

    // Start timer
    // Assuming projectsPage has methods for time tracking or we add them
    // For now using the logic from issues.spec.ts that expects startTimerButton
    await workspacesPage.startTimer();

    // Wait a bit
    await page.waitForTimeout(2000);

    // Stop timer
    await workspacesPage.stopTimer();

    // Verify timer started (UI feedback handled in startTimer)
    // Optional: Stop timer to clean up
    await workspacesPage.stopTimer();
  });
});
