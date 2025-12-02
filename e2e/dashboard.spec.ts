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

    // Verify dashboard is visible
    await dashboardPage.expectDashboard();

    // Dashboard tab should be active by default
    await dashboardPage.expectActiveTab("dashboard");

    // Main content should be loaded
    await dashboardPage.expectLoaded();
  });

  test("can navigate between tabs", async ({ dashboardPage }) => {
    await dashboardPage.goto();

    // Navigate to projects
    await dashboardPage.navigateTo("projects");
    await dashboardPage.expectActiveTab("projects");

    // Navigate to documents
    await dashboardPage.navigateTo("documents");
    await dashboardPage.expectActiveTab("documents");

    // Navigate back to dashboard
    await dashboardPage.navigateTo("dashboard");
    await dashboardPage.expectActiveTab("dashboard");
  });

  test("sign out returns to landing page", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectDashboard();

    // Sign out
    await dashboardPage.signOut();

    // Should see landing page
    await expect(page.getByRole("button", { name: /get started free/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Header Actions", () => {
  test("can open command palette", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openCommandPalette();
    await dashboardPage.closeCommandPalette();
  });

  test("can switch to dark theme", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    // Switch to dark theme
    await dashboardPage.setTheme("dark");

    // Should have dark class
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test("can switch to light theme", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    // Switch to light theme
    await dashboardPage.setTheme("light");

    // Should not have dark class
    const htmlElement = page.locator("html");
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  test("can open global search", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openGlobalSearch();
    await dashboardPage.closeGlobalSearch();
  });

  test("can open keyboard shortcuts help", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.openShortcutsHelp();
    await dashboardPage.closeShortcutsHelp();
  });
});
