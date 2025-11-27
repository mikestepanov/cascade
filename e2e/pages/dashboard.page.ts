import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Dashboard Page Object
 * Handles the main authenticated app interface
 */
export class DashboardPage extends BasePage {
  // ===================
  // Locators - Navigation
  // ===================
  readonly dashboardTab: Locator;
  readonly documentsTab: Locator;
  readonly projectsTab: Locator;
  readonly timesheetTab: Locator;
  readonly calendarTab: Locator;
  readonly settingsTab: Locator;

  // ===================
  // Locators - Header
  // ===================
  readonly commandPaletteButton: Locator;
  readonly shortcutsHelpButton: Locator;
  readonly globalSearchButton: Locator;
  readonly themeToggleButton: Locator;
  readonly notificationButton: Locator;
  readonly signOutButton: Locator;

  // ===================
  // Locators - Content
  // ===================
  readonly mainContent: Locator;
  readonly sidebar: Locator;
  readonly loadingSpinner: Locator;

  // ===================
  // Locators - Modals
  // ===================
  readonly commandPalette: Locator;
  readonly shortcutsModal: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation tabs
    this.dashboardTab = page.getByRole("button", { name: /^dashboard$/i });
    this.documentsTab = page.getByRole("button", { name: /^documents$/i });
    this.projectsTab = page.getByRole("button", { name: /^projects$/i });
    this.timesheetTab = page.getByRole("button", { name: /^timesheet$/i });
    this.calendarTab = page.getByRole("button", { name: /^calendar$/i });
    this.settingsTab = page.getByRole("button", { name: /^settings$/i });

    // Header actions
    this.commandPaletteButton = page.getByRole("button", { name: /commands/i });
    this.shortcutsHelpButton = page.getByRole("button", { name: /keyboard shortcuts/i });
    this.globalSearchButton = page.getByRole("button", { name: /search/i });
    this.themeToggleButton = page.getByRole("button", {
      name: /toggle.*theme|dark.*mode|light.*mode/i,
    });
    this.notificationButton = page.getByRole("button", { name: /notifications/i });
    this.signOutButton = page.getByRole("button", { name: /sign out/i });

    // Content areas
    this.mainContent = page.getByRole("main");
    this.sidebar = page.locator("[data-tour='sidebar']");
    this.loadingSpinner = page.locator(".animate-spin");

    // Modals
    this.commandPalette = page.getByRole("dialog", { name: /command/i });
    this.shortcutsModal = page.getByRole("dialog", { name: /keyboard|shortcuts/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  async navigateTo(
    tab: "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings",
  ) {
    const tabs = {
      dashboard: this.dashboardTab,
      documents: this.documentsTab,
      projects: this.projectsTab,
      timesheet: this.timesheetTab,
      calendar: this.calendarTab,
      settings: this.settingsTab,
    };
    await tabs[tab].click();
    await this.waitForLoad();
  }

  // ===================
  // Actions - Header
  // ===================

  async openCommandPalette() {
    await this.commandPaletteButton.click();
    await expect(this.commandPalette).toBeVisible();
  }

  async closeCommandPalette() {
    await this.page.keyboard.press("Escape");
    await expect(this.commandPalette).not.toBeVisible();
  }

  async openShortcutsHelp() {
    await this.shortcutsHelpButton.click();
    await expect(this.shortcutsModal).toBeVisible();
  }

  async toggleTheme() {
    await this.themeToggleButton.click();
  }

  async openNotifications() {
    await this.notificationButton.click();
  }

  async signOut() {
    await this.signOutButton.click();
  }

  // ===================
  // Actions - Keyboard
  // ===================

  async pressCommandPaletteShortcut() {
    await this.page.keyboard.press("Meta+k");
  }

  async pressShortcutsHelpShortcut() {
    await this.page.keyboard.press("Shift+?");
  }

  // ===================
  // Assertions
  // ===================

  async expectDashboard() {
    await expect(this.dashboardTab).toBeVisible();
    await expect(this.mainContent).toBeVisible();
  }

  async expectActiveTab(
    tab: "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings",
  ) {
    const tabs = {
      dashboard: this.dashboardTab,
      documents: this.documentsTab,
      projects: this.projectsTab,
      timesheet: this.timesheetTab,
      calendar: this.calendarTab,
      settings: this.settingsTab,
    };
    await expect(tabs[tab]).toHaveAttribute("aria-current", "page");
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async expectLoaded() {
    await expect(this.loadingSpinner).not.toBeVisible();
  }
}
