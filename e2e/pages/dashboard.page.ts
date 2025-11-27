import type { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the main dashboard/app
 */
export class DashboardPage {
  readonly page: Page;

  // Navigation
  readonly dashboardTab: Locator;
  readonly documentsTab: Locator;
  readonly projectsTab: Locator;
  readonly timesheetTab: Locator;
  readonly calendarTab: Locator;
  readonly settingsTab: Locator;

  // Header elements
  readonly commandPaletteButton: Locator;
  readonly searchButton: Locator;
  readonly themeToggle: Locator;
  readonly notificationCenter: Locator;
  readonly signOutButton: Locator;

  // Content areas
  readonly mainContent: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation tabs
    this.dashboardTab = page.getByRole("button", { name: /dashboard/i });
    this.documentsTab = page.getByRole("button", { name: /documents/i });
    this.projectsTab = page.getByRole("button", { name: /projects/i });
    this.timesheetTab = page.getByRole("button", { name: /timesheet/i });
    this.calendarTab = page.getByRole("button", { name: /calendar/i });
    this.settingsTab = page.getByRole("button", { name: /settings/i });

    // Header
    this.commandPaletteButton = page.getByRole("button", { name: /commands/i });
    this.searchButton = page.getByRole("button", { name: /search/i });
    this.themeToggle = page.getByRole("button", { name: /toggle.*theme/i });
    this.notificationCenter = page.getByRole("button", { name: /notifications/i });
    this.signOutButton = page.getByRole("button", { name: /sign out/i });

    // Content
    this.mainContent = page.getByRole("main");
    this.sidebar = page.locator("[data-tour='sidebar']");
  }

  async goto() {
    await this.page.goto("/");
  }

  async navigateTo(tab: "dashboard" | "documents" | "projects" | "timesheet" | "calendar" | "settings") {
    const tabs = {
      dashboard: this.dashboardTab,
      documents: this.documentsTab,
      projects: this.projectsTab,
      timesheet: this.timesheetTab,
      calendar: this.calendarTab,
      settings: this.settingsTab,
    };
    await tabs[tab].click();
  }

  async openCommandPalette() {
    await this.commandPaletteButton.click();
  }

  async signOut() {
    await this.signOutButton.click();
  }
}
