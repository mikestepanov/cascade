import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Dashboard E2E Tests
 *
 * Tests for authenticated user experience.
 * Requires auth state to be set up first: pnpm e2e:setup-auth
 */

test.describe("Dashboard Navigation", () => {
  test("authenticated user lands on dashboard after login", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectDashboard();
    await dashboardPage.expectActiveTab("dashboard");
    await dashboardPage.expectLoaded();
  });

  test("can navigate between tabs", async ({ dashboardPage }) => {
    await dashboardPage.goto();

    await dashboardPage.navigateTo("projects");
    await dashboardPage.expectActiveTab("projects");

    await dashboardPage.navigateTo("documents");
    await dashboardPage.expectActiveTab("documents");

    await dashboardPage.navigateTo("dashboard");
    await dashboardPage.expectActiveTab("dashboard");
  });
});

test.describe("Dashboard Content", () => {
  test("displays main dashboard sections", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.mainContent).toBeVisible();
    await expect(dashboardPage.myIssuesSection).toBeVisible();
    await expect(dashboardPage.projectsSection).toBeVisible();
  });

  test("can filter issues", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.assignedTab).toBeVisible();
    await expect(dashboardPage.createdTab).toBeVisible();

    await dashboardPage.filterIssues("created");
    await dashboardPage.filterIssues("assigned");
  });
});

test.describe("Command Palette", () => {
  test("can open and close via button", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openCommandPalette();
    await expect(dashboardPage.commandPalette).toBeVisible();
    await dashboardPage.closeCommandPalette();
    await expect(dashboardPage.commandPalette).not.toBeVisible();
  });

  test("can open via keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.pressCommandPaletteShortcut();
    await expect(dashboardPage.commandPalette).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Theme Toggle", () => {
  test("can switch themes via settings", async ({ settingsPage, page }) => {
    // Navigate to Settings > Preferences
    await settingsPage.goto();
    await settingsPage.switchToTab("preferences");

    const html = page.locator("html");

    // Switch to dark theme (ToggleGroupItem with aria-label)
    await page.getByRole("radio", { name: /dark theme/i }).click();
    await expect(html).toHaveClass(/dark/);

    // Switch to light theme
    await page.getByRole("radio", { name: /light theme/i }).click();
    await expect(html).not.toHaveClass(/dark/);

    // Switch to system theme
    await page.getByRole("radio", { name: /system theme/i }).click();
  });
});

test.describe("Global Search", () => {
  test("can open and close", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openGlobalSearch();
    await expect(dashboardPage.globalSearchModal).toBeVisible();
    await dashboardPage.closeGlobalSearch();
    await expect(dashboardPage.globalSearchModal).not.toBeVisible();
  });
});

test.describe("Keyboard Shortcuts Help", () => {
  test("can open and close via button", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).toBeVisible();
    await dashboardPage.closeShortcutsHelp();
    await expect(dashboardPage.shortcutsModal).not.toBeVisible();
  });

  test("can open via keyboard shortcut", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.pressShortcutsHelpShortcut();
    await expect(dashboardPage.shortcutsModal).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Notifications", () => {
  test("can open notifications panel", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openNotifications();
    await expect(dashboardPage.notificationPanel).toBeVisible({ timeout: 5000 });
  });
});
