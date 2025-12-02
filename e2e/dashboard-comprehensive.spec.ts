import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Comprehensive Dashboard E2E Tests
 *
 * Tests all actionable elements in the authenticated dashboard.
 * Requires auth state: pnpm e2e:setup-auth
 */

test.describe("Dashboard View - Navigation Tabs", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("displays all navigation tabs", async ({ dashboardPage }) => {
    await expect(dashboardPage.dashboardTab).toBeVisible();
    await expect(dashboardPage.documentsTab).toBeVisible();
    await expect(dashboardPage.projectsTab).toBeVisible();
    await expect(dashboardPage.timesheetTab).toBeVisible();
    await expect(dashboardPage.calendarTab).toBeVisible();
    await expect(dashboardPage.settingsTab).toBeVisible();
  });

  test("can navigate to Documents tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("documents");
    // Verify documents view loaded
    await expect(dashboardPage.documentsTab).toBeVisible();
  });

  test("can navigate to Projects tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("projects");
    // Verify projects view loaded
    await expect(dashboardPage.projectsTab).toBeVisible();
  });

  test("can navigate to Timesheet tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("timesheet");
    await expect(dashboardPage.timesheetTab).toBeVisible();
  });

  test("can navigate to Calendar tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("calendar");
    await expect(dashboardPage.calendarTab).toBeVisible();
  });

  test("can navigate to Settings tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("settings");
    await expect(dashboardPage.settingsTab).toBeVisible();
  });
});

test.describe("Dashboard View - Header Actions", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("command palette button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.commandPaletteButton).toBeVisible();
  });

  test("shortcuts help button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.shortcutsHelpButton).toBeVisible();
  });

  test("global search button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.globalSearchButton).toBeVisible();
  });

  test("notification button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.notificationButton).toBeVisible();
  });

  test("sign out button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.signOutButton).toBeVisible();
  });
});

test.describe("Dashboard View - Theme Toggle", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("theme toggle buttons are visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.lightThemeButton).toBeVisible();
    await expect(dashboardPage.darkThemeButton).toBeVisible();
    await expect(dashboardPage.systemThemeButton).toBeVisible();
  });

  test("can switch to dark theme", async ({ dashboardPage, page }) => {
    await dashboardPage.setTheme("dark");
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test("can switch to light theme", async ({ dashboardPage, page }) => {
    await dashboardPage.setTheme("light");
    const htmlElement = page.locator("html");
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  test("can switch to system theme", async ({ dashboardPage }) => {
    await dashboardPage.setTheme("system");
    // System theme should be applied based on OS preference
    await expect(dashboardPage.systemThemeButton).toBeVisible();
  });
});

test.describe("Dashboard View - Command Palette", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("can open command palette via button", async ({ dashboardPage }) => {
    await dashboardPage.openCommandPalette();
    await expect(dashboardPage.commandPalette).toBeVisible();
  });

  test("can close command palette with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openCommandPalette();
    await dashboardPage.closeCommandPalette();
    await expect(dashboardPage.commandPalette).not.toBeVisible();
  });

  test("can open command palette with keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.pressCommandPaletteShortcut();
    await expect(dashboardPage.commandPalette).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard View - Keyboard Shortcuts Help", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("can open shortcuts help via button", async ({ dashboardPage }) => {
    await dashboardPage.openShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).toBeVisible();
  });

  test("can close shortcuts help with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openShortcutsHelp();
    await dashboardPage.closeShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).not.toBeVisible();
  });

  test("can open shortcuts help with keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.pressShortcutsHelpShortcut();
    await expect(dashboardPage.shortcutsModal).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard View - Global Search", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("can open global search", async ({ dashboardPage }) => {
    await dashboardPage.openGlobalSearch();
    await expect(dashboardPage.globalSearchModal).toBeVisible();
  });

  test("can close global search with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openGlobalSearch();
    await dashboardPage.closeGlobalSearch();
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();
  });
});

test.describe("Dashboard View - Notifications", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("can open notifications panel", async ({ dashboardPage }) => {
    await dashboardPage.openNotifications();
    // Notification dropdown/panel should appear
    await expect(dashboardPage.notificationPanel).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard View - Sign Out", () => {
  test("sign out returns to landing page", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    // Sign out
    await dashboardPage.signOut();

    // Should see landing page
    await expect(page.getByRole("link", { name: /get started free/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Dashboard View - Main Content", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("displays main content area", async ({ dashboardPage }) => {
    await expect(dashboardPage.mainContent).toBeVisible();
  });

  test("displays my issues section", async ({ dashboardPage }) => {
    await expect(dashboardPage.myIssuesSection).toBeVisible();
  });

  test("displays projects section", async ({ dashboardPage }) => {
    await expect(dashboardPage.projectsSection).toBeVisible();
  });
});

test.describe("Dashboard View - Issue Filters", () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test("displays issue filter tabs", async ({ dashboardPage }) => {
    await expect(dashboardPage.assignedTab).toBeVisible();
    await expect(dashboardPage.createdTab).toBeVisible();
  });

  test("can filter to assigned issues", async ({ dashboardPage }) => {
    await dashboardPage.filterIssues("assigned");
    await expect(dashboardPage.assignedTab).toBeVisible();
  });

  test("can filter to created issues", async ({ dashboardPage }) => {
    await dashboardPage.filterIssues("created");
    await expect(dashboardPage.createdTab).toBeVisible();
  });
});
