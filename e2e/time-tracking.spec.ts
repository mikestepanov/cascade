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
    await page.getByRole("button", { name: "Add new project" }).click();

    // Wait for navigation to new project board
    await page.waitForURL(/\/projects\/[^/]+\/board/, { timeout: 10000 });
    await projectsPage.expectBoardVisible();

    // 3. Create an Issue
    const uniqueId = Date.now();
    const issueTitle = `Task to Track ${uniqueId}`;
    await projectsPage.createIssue(issueTitle);

    // Wait for the create issue modal to close
    await expect(projectsPage.createIssueModal).not.toBeVisible({ timeout: 5000 });

    // 4. Open Issue Detail Modal
    // Wait for issue card to appear and click it
    const issueCard = page.getByRole("heading", { name: issueTitle, level: 4 });
    await issueCard.waitFor({ state: "visible", timeout: 5000 });
    await issueCard.click();

    // 5. Wait for dialog modal to open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Wait for React to fully hydrate and Convex queries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 6. Start Timer - find button within dialog (not header)
    const startTimerButton = dialog.getByRole("button", { name: "Start Timer" });
    await expect(startTimerButton).toBeVisible({ timeout: 5000 });
    // Scroll into view and click - ensures button is clickable
    await startTimerButton.scrollIntoViewIfNeeded();
    await startTimerButton.click();

    // Verify timer started (button changes to Stop Timer)
    await expect(dialog.getByRole("button", { name: "Stop Timer" })).toBeVisible({ timeout: 5000 });

    // Wait a brief moment to log some duration
    await page.waitForTimeout(2000);

    // 7. Stop Timer (within dialog)
    const stopTimerButton = dialog.getByRole("button", { name: "Stop Timer" });
    await stopTimerButton.scrollIntoViewIfNeeded();
    await stopTimerButton.click();

    // Verify success toast
    await expect(page.getByText(/Timer stopped/i)).toBeVisible({ timeout: 5000 });

    // Verify Start Timer button is back (within dialog)
    await expect(dialog.getByRole("button", { name: "Start Timer" })).toBeVisible({
      timeout: 5000,
    });
  });
});
