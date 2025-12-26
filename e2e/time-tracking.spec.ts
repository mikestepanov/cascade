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
    projectsPage,
    page,
    ensureAuthenticated,
  }) => {
    // Re-authenticate if needed (e.g., after signout test invalidated tokens)
    await ensureAuthenticated();

    // 1. Navigate to Projects
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    // Use direct URL navigation to access projects
    await projectsPage.goto();

    // 2. Create a Project
    const now = Date.now();
    const projectKey = `TT${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    await projectsPage.createProject(`Time Tracking ${now}`, projectKey);
    // Wait for navigation to new project board or other default view
    await page.waitForURL(/\/projects\/[^/]+\/(board|sprints|backlog)/, { timeout: 15000 });
    await projectsPage.expectBoardVisible();

    // 3. Create an Issue
    const uniqueId = Date.now();
    const issueTitle = `Task to Track ${uniqueId}`;
    await projectsPage.createIssue(issueTitle);

    // Wait for the create issue modal to close
    await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

    // 5. Open Issue Detail Modal using page object
    await projectsPage.openIssueDetail(issueTitle);

    // Wait for React to fully hydrate and Convex queries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 6. Start Timer using page object
    await projectsPage.startTimer();

    // Verify timer started (UI feedback handled in startTimer)
    // Optional: Stop timer to clean up
    await projectsPage.stopTimer();
  });
});
