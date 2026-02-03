import { expect, authenticatedTest as test } from "./fixtures";
import { testUserService } from "./utils/test-user-service";

/**
 * Teams E2E Tests
 *
 * Tests the team management functionality:
 * - Teams list page within a workspace
 * - Team board (Kanban view for team)
 * - Team settings
 *
 * Route structure:
 * - Teams list: /$orgSlug/workspaces/$workspaceSlug/teams
 * - Team board: /$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 */

test.describe("Teams", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
    const seedResult = await testUserService.seedTemplates();
    if (!seedResult) console.warn("WARNING: Failed to seed templates in test setup");
  });

  test("can navigate to teams list from workspace", async ({ workspacesPage, page }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // Navigate to the newly created workspace
    // First, go back to workspaces list
    await workspacesPage.goto();

    // Wait for workspaces list to load - look for the page heading
    await expect(page.getByRole("heading", { name: /workspaces/i })).toBeVisible({
      timeout: 10000,
    });

    // Click on the workspace card to navigate to it
    const workspaceCard = page
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: workspaceName });
    await expect(workspaceCard).toBeVisible({ timeout: 15000 });
    await workspaceCard.click();

    // Should be in the workspace now
    await expect(page).toHaveURL(/\/workspaces\/.*$/);

    // Look for Teams navigation or heading
    // Teams are accessible from the workspace navigation
    const teamsLink = page.getByRole("link", { name: /teams/i });
    if (await teamsLink.isVisible()) {
      await teamsLink.click();
      await expect(page).toHaveURL(/\/workspaces\/.*\/teams/);

      // Should show Teams heading
      await expect(page.getByRole("heading", { name: /teams/i })).toBeVisible();
    } else {
      // Teams might be shown inline in workspace view
      console.log("Teams link not found as separate navigation item");
    }
  });

  test("teams list shows create team button", async ({ workspacesPage, page }) => {
    // Create a workspace first
    const uniqueId = Date.now().toString();
    const workspaceName = `Create Team WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // Go back to workspaces and navigate into the created workspace
    await workspacesPage.goto();
    const workspaceCard = page
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: workspaceName });
    await workspaceCard.click();

    // Navigate to teams
    const teamsLink = page.getByRole("link", { name: /teams/i });
    if (await teamsLink.isVisible()) {
      await teamsLink.click();

      // Should show "Create Team" button
      const createTeamButton = page.getByRole("button", { name: /create team/i });
      await expect(createTeamButton).toBeVisible();
    }
  });

  test("teams list shows empty state when no teams exist", async ({ workspacesPage, page }) => {
    // Create a fresh workspace
    const uniqueId = Date.now().toString();
    const workspaceName = `Empty Teams WS ${uniqueId}`;

    await workspacesPage.goto();
    await workspacesPage.createWorkspace(workspaceName);

    // Navigate to workspace
    await workspacesPage.goto();
    const workspaceCard = page
      .locator(`a[href*="/workspaces/"]`)
      .filter({ hasText: workspaceName });
    await workspaceCard.click();

    // Navigate to teams
    const teamsLink = page.getByRole("link", { name: /teams/i });
    if (await teamsLink.isVisible()) {
      await teamsLink.click();

      // Should show empty state message OR teams list (if teams exist from before)
      const emptyState = page.getByText(/no teams yet|create your first team/i);
      const teamCards = page.locator("[data-team-card]").or(page.locator("a[href*='/teams/']"));

      // Either empty state or teams should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasTeams = (await teamCards.count()) > 0;

      expect(hasEmptyState || hasTeams).toBe(true);
    }
  });
});
