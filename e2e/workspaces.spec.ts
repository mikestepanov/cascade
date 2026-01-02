import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Workspaces E2E Tests
 *
 * Tests the Workspace (department) management functionality:
 * - Workspace creation
 * - Navigation to workspaces page
 *
 * NOTE: Project board, issue, and sprint tests are in their dedicated spec files:
 * - issues.spec.ts - Project board and issue management
 * - sprints.spec.ts - Sprint and backlog tab navigation
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Workspaces", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Workspace Navigation", () => {
    test("can navigate to workspaces page", async ({ workspacesPage }) => {
      // Navigate directly to workspaces page
      await workspacesPage.goto();
      await workspacesPage.expectWorkspacesView();
    });
  });

  test.describe("Workspace Creation", () => {
    // SKIPPED: Known backend issue - nuke-workspaces API not deleting E2E workspaces correctly
    // See: The nukeWorkspacesInternal mutation filters by exact name match but workspaces
    // accumulate in the DB, likely due to encoding/whitespace differences or API not being called.
    // TODO: Debug the Convex mutation and fix the cleanup logic.
    test.skip("can create a new workspace via sidebar button", async ({
      dashboardPage,
      workspacesPage,
      page,
      request,
    }) => {
      // 1. Nuclear Cleanup: Delete ALL E2E workspaces to ensure a clean state
      // This is more reliable than targeting by name since we have slug/name mismatches
      const convexUrl = process.env.VITE_CONVEX_URL;
      if (!convexUrl) throw new Error("VITE_CONVEX_URL is not defined");

      const nukeResponse = await request.post(`${convexUrl}/e2e/nuke-workspaces`, {
        headers: {
          Authorization: `Bearer ${process.env.E2E_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {},
      });
      if (!nukeResponse.ok()) {
        console.error(`Nuke workspaces failed: ${await nukeResponse.text()}`);
      }
      expect(nukeResponse.ok(), "Failed to nuke workspaces").toBeTruthy();

      // Define the workspace name for creation
      const workspaceName = "🧪 E2E Testing Workspace";

      // Navigate directly to the workspaces page
      // Avoid intermediate dashboard visit and reload to prevent token invalidation
      await workspacesPage.goto();
      await workspacesPage.expectWorkspacesView();

      // Create a new workspace with the fixed unique name
      await workspacesPage.createWorkspace(workspaceName, "Engineering department");

      // Should navigate to new workspace teams list
      // URL pattern: /workspaces/$slug/teams
      await page.waitForURL(/\/workspaces\/[^/]+\/teams/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
    });
  });
});
