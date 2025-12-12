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
 */

test.describe("Time Tracking", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  // TODO: Company context not loading - investigate auth token loading from storage state
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
    // Wait for dashboard to fully load before navigation
    await dashboardPage.expectLoaded();
    await dashboardPage.navigateTo("projects");

    // 2. Create a Project
    const uniqueId = Date.now();
    const projectName = `Time Track Proj ${uniqueId}`;
    await projectsPage.createProject(projectName, `TT${uniqueId.toString().slice(-4)}`);

    // Wait for board to load
    await projectsPage.expectBoardVisible();

    // 3. Create an Issue
    const issueTitle = `Task to Track ${uniqueId}`;
    await projectsPage.createIssue(issueTitle);

    // 4. Open Issue Detail
    // Find the issue card by text and click it
    await page.getByText(issueTitle).click();

    // 5. Start Timer
    // Verify modal is open and Time Tracking section is visible
    // Use .first() because there's a heading and a label both containing "Time Tracking"
    await expect(page.getByRole("heading", { name: "Time Tracking" }).first()).toBeVisible();

    // Click Start Timer
    await page.getByRole("button", { name: "Start Timer" }).click();

    // Verify timer started (button changes to Stop Timer)
    await expect(page.getByRole("button", { name: "Stop Timer" })).toBeVisible();

    // Wait a brief moment to log some duration (mocking time passing not possible easily in E2E without clock manipulation,
    // but we just check functionality)
    await page.waitForTimeout(2000);

    // 6. Stop Timer
    await page.getByRole("button", { name: "Stop Timer" }).click();

    // Verify success toast or state change
    await expect(page.getByText(/Timer stopped/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Timer" })).toBeVisible();

    // 7. Verify Time Entry Logged
    // Click "View Time Entries" if not already expanded (UI logic: "View Time Entries (1)")
    // The text might default to showing if entries exist?
    // In TimeTracker.tsx: `{totalLoggedHours > 0 && <Button>View Time Entries</Button>}`
    // And it defaults to `showEntries` false.
    await page.getByRole("button", { name: /view.*time.*entries/i }).click();

    // Check for list item
    await expect(page.getByText(/0.0h/)).toBeVisible(); // 2s is likely 0.0h rounded, or low.
    // TimeTracker.tsx formats hours `.toFixed(1)`. 2s / 3600 = 0.0005. Rounded 0.0.
    // Correct.
  });
});
