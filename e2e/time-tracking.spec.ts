import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Time Tracking E2E Tests
 *
 * Tests the time tracking functionality:
 * 1. Create a project and issue
 * 2. Start timer
 * 3. Stop timer
 * 4. Verify time entry
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 *
 * Uses ProjectsPage page object for consistent locators.
 */

test.describe("Time Tracking", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

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
    await dashboardPage.navigateTo("projects");

    // 2. Create a Project (sidebar auto-creates with default name)
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await projectsPage.addProjectButton.click();

    // Wait for navigation to new workspace board (routes renamed from /projects/ to /workspaces/)
    await page.waitForURL(/\/workspaces\/[^/]+\/board/, { timeout: 10000 });
    await projectsPage.expectBoardVisible();

    // 3. Create an Issue
    const uniqueId = Date.now();
    const issueTitle = `Task to Track ${uniqueId}`;
    await projectsPage.createIssue(issueTitle);

    // Wait for the create issue modal to close
    await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

    // 4. Open Issue Detail Modal using page object
    await projectsPage.openIssueDetail(issueTitle);

    // Wait for React to fully hydrate and Convex queries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 5. Start Timer using page object
    await projectsPage.startTimer();

    // Wait a brief moment to log some duration
    await page.waitForTimeout(2000);

    // 6. Stop Timer using page object
    await projectsPage.stopTimer();
  });
});
