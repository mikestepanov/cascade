import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Sprints E2E Tests
 *
 * Tests the sprint management functionality:
 * - Sprint tab navigation
 * - Sprint view display
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Sprints", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Sprint Navigation", () => {
    test("can navigate to sprints tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `SPR${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await projectsPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/(board|sprints|backlog)/, { timeout: 15000 });

      await projectsPage.switchToTab("sprints");

      // Handle potential slow hydration/loading state
      const loading = page.getByText("Loading...");
      if (await loading.isVisible()) {
        await loading.waitFor({ state: "hidden", timeout: 15000 });
      }

      // Verify the tab content is visible (UI state source of truth)
      await expect(page.getByText(/Sprint Management/i)).toBeVisible({ timeout: 10000 });
    });

    test("sprints tab shows sprint management UI", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `SPR${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await projectsPage.createProject(`Sprint Test ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/(board|sprints|backlog)/, { timeout: 15000 });

      // Navigate to sprints tab
      await projectsPage.switchToTab("sprints");

      // Should show sprints-related content (heading, create button, etc.)
      // This is a smoke test to ensure the page loads without error
      await expect(page.getByText(/sprint/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Backlog Navigation", () => {
    test("can navigate to backlog tab in project", async ({
      dashboardPage,
      projectsPage,
      page,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      // Use direct URL navigation to access projects
      await projectsPage.goto();

      // Create a project first
      const uniqueId = Date.now();
      const projectKey = `SPR${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await projectsPage.createProject(`Backlog Test ${uniqueId}`, projectKey);
      await page.waitForURL(/\/projects\/[^/]+\/(board|sprints|backlog)/, { timeout: 15000 });

      // Navigate to backlog tab
      await projectsPage.switchToTab("backlog");

      // Verify tab is active (URL might not change to /backlog if it's a view state on board)
      const backlogTab = page.getByRole("button", { name: /backlog view/i });
      // Check for button enabled state as proxy for existence and interactivity
      await expect(backlogTab).toBeEnabled();
    });
  });
});
