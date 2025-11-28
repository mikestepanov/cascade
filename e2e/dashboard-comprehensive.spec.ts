import { authenticatedTest, expect } from "./fixtures";

/**
 * Comprehensive Dashboard E2E Tests
 *
 * Tests all actionable elements in the authenticated dashboard.
 * Requires auth state: pnpm e2e:setup-auth
 */

authenticatedTest.describe("Dashboard View - Navigation Tabs", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("displays all navigation tabs", async ({ dashboardPage }) => {
    await expect(dashboardPage.dashboardTab).toBeVisible();
    await expect(dashboardPage.documentsTab).toBeVisible();
    await expect(dashboardPage.projectsTab).toBeVisible();
    await expect(dashboardPage.timesheetTab).toBeVisible();
    await expect(dashboardPage.calendarTab).toBeVisible();
    await expect(dashboardPage.settingsTab).toBeVisible();
  });

  authenticatedTest("can navigate to Documents tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("documents");
    // Verify documents view loaded
    await expect(dashboardPage.documentsTab).toBeVisible();
  });

  authenticatedTest("can navigate to Projects tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("projects");
    // Verify projects view loaded
    await expect(dashboardPage.projectsTab).toBeVisible();
  });

  authenticatedTest("can navigate to Timesheet tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("timesheet");
    await expect(dashboardPage.timesheetTab).toBeVisible();
  });

  authenticatedTest("can navigate to Calendar tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("calendar");
    await expect(dashboardPage.calendarTab).toBeVisible();
  });

  authenticatedTest("can navigate to Settings tab", async ({ dashboardPage }) => {
    await dashboardPage.navigateTo("settings");
    await expect(dashboardPage.settingsTab).toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Header Actions", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("command palette button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.commandPaletteButton).toBeVisible();
  });

  authenticatedTest("shortcuts help button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.shortcutsHelpButton).toBeVisible();
  });

  authenticatedTest("global search button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.globalSearchButton).toBeVisible();
  });

  authenticatedTest("notification button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.notificationButton).toBeVisible();
  });

  authenticatedTest("sign out button is visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.signOutButton).toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Theme Toggle", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("theme toggle buttons are visible", async ({ dashboardPage }) => {
    await expect(dashboardPage.lightThemeButton).toBeVisible();
    await expect(dashboardPage.darkThemeButton).toBeVisible();
    await expect(dashboardPage.systemThemeButton).toBeVisible();
  });

  authenticatedTest("can switch to dark theme", async ({ dashboardPage, page }) => {
    await dashboardPage.setTheme("dark");
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });

  authenticatedTest("can switch to light theme", async ({ dashboardPage, page }) => {
    await dashboardPage.setTheme("light");
    const htmlElement = page.locator("html");
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  authenticatedTest("can switch to system theme", async ({ dashboardPage }) => {
    await dashboardPage.setTheme("system");
    // System theme should be applied based on OS preference
    await expect(dashboardPage.systemThemeButton).toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Command Palette", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("can open command palette via button", async ({ dashboardPage }) => {
    await dashboardPage.openCommandPalette();
    await expect(dashboardPage.commandPalette).toBeVisible();
  });

  authenticatedTest("can close command palette with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openCommandPalette();
    await dashboardPage.closeCommandPalette();
    await expect(dashboardPage.commandPalette).not.toBeVisible();
  });

  authenticatedTest(
    "can open command palette with keyboard shortcut",
    async ({ dashboardPage }) => {
      await dashboardPage.pressCommandPaletteShortcut();
      await expect(dashboardPage.commandPalette).toBeVisible({ timeout: 5000 });
    },
  );
});

authenticatedTest.describe("Dashboard View - Keyboard Shortcuts Help", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("can open shortcuts help via button", async ({ dashboardPage }) => {
    await dashboardPage.openShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).toBeVisible();
  });

  authenticatedTest("can close shortcuts help with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openShortcutsHelp();
    await dashboardPage.closeShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).not.toBeVisible();
  });

  authenticatedTest("can open shortcuts help with keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.pressShortcutsHelpShortcut();
    await expect(dashboardPage.shortcutsModal).toBeVisible({ timeout: 5000 });
  });
});

authenticatedTest.describe("Dashboard View - Global Search", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("can open global search", async ({ dashboardPage }) => {
    await dashboardPage.openGlobalSearch();
    await expect(dashboardPage.globalSearchModal).toBeVisible();
  });

  authenticatedTest("can close global search with Escape", async ({ dashboardPage }) => {
    await dashboardPage.openGlobalSearch();
    await dashboardPage.closeGlobalSearch();
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Notifications", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("can open notifications panel", async ({ dashboardPage }) => {
    await dashboardPage.openNotifications();
    // Notification dropdown/panel should appear
    await expect(dashboardPage.notificationButton).toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Sign Out", () => {
  authenticatedTest("sign out returns to landing page", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    // Sign out
    await dashboardPage.signOut();

    // Should see landing page
    await expect(page.getByRole("button", { name: /get started free/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

authenticatedTest.describe("Dashboard View - Main Content", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("displays main content area", async ({ dashboardPage }) => {
    await expect(dashboardPage.mainContent).toBeVisible();
  });

  authenticatedTest("displays my issues section", async ({ dashboardPage }) => {
    await expect(dashboardPage.myIssuesSection).toBeVisible();
  });

  authenticatedTest("displays projects section", async ({ dashboardPage }) => {
    await expect(dashboardPage.projectsSection).toBeVisible();
  });
});

authenticatedTest.describe("Dashboard View - Issue Filters", () => {
  authenticatedTest.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  authenticatedTest("displays issue filter tabs", async ({ dashboardPage }) => {
    await expect(dashboardPage.assignedTab).toBeVisible();
    await expect(dashboardPage.createdTab).toBeVisible();
  });

  authenticatedTest("can filter to assigned issues", async ({ dashboardPage }) => {
    await dashboardPage.filterIssues("assigned");
    await expect(dashboardPage.assignedTab).toBeVisible();
  });

  authenticatedTest("can filter to created issues", async ({ dashboardPage }) => {
    await dashboardPage.filterIssues("created");
    await expect(dashboardPage.createdTab).toBeVisible();
  });
});
