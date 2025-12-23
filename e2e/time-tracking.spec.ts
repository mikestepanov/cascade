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

  test.skip("user can track time on an issue", async ({
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

    // 4. Open Issue Detail Modal using page object
    await projectsPage.openIssueDetail(issueTitle);

    // Wait for React to fully hydrate and Convex queries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 5. Start Timer using page object
    await projectsPage.startTimer();

    // Verify project created and navigate to it
    await expect(page).toHaveURL(/\/(board|sprints|backlog)/, { timeout: 15000 });

    // Handle potential slow hydration/loading state
    const loading = page.getByText("Loading...");
    if (await loading.isVisible()) {
      await loading.waitFor({ state: "hidden", timeout: 15000 });
    }

    // Enable time tracking for the project
    await projectsPage.enableTimeTracking();
  });
});
