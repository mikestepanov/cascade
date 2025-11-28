import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Dashboard Page Object
 * Handles the main authenticated app interface
 */
export class DashboardPage extends BasePage {
  // ===================
  // Locators - Navigation Tabs
  // ===================
  readonly dashboardTab: Locator;
  readonly documentsTab: Locator;
  readonly projectsTab: Locator;
  readonly timesheetTab: Locator;
  readonly calendarTab: Locator;
  readonly settingsTab: Locator;

  // ===================
  // Locators - Header Actions
  // ===================
  readonly mobileMenuButton: Locator;
  readonly commandPaletteButton: Locator;
  readonly shortcutsHelpButton: Locator;
  readonly globalSearchButton: Locator;
  readonly notificationButton: Locator;
  readonly signOutButton: Locator;

  // ===================
  // Locators - Theme Toggle
  // ===================
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly systemThemeButton: Locator;

  // ===================
  // Locators - Content
  // ===================
  readonly mainContent: Locator;
  readonly sidebar: Locator;
  readonly loadingSpinner: Locator;

  // ===================
  // Locators - Dashboard Content
  // ===================
  readonly myIssuesSection: Locator;
  readonly projectsSection: Locator;
  readonly recentActivitySection: Locator;
  readonly quickStatsSection: Locator;
  readonly assignedTab: Locator;
  readonly createdTab: Locator;

  // ===================
  // Locators - Modals
  // ===================
  readonly commandPalette: Locator;
  readonly commandPaletteInput: Locator;
  readonly shortcutsModal: Locator;
  readonly globalSearchModal: Locator;
  readonly globalSearchInput: Locator;

  // ===================
  // Locators - Notifications
  // ===================
  readonly notificationPanel: Locator;
  readonly markAllReadButton: Locator;
  readonly notificationItems: Locator;

  // ===================
  // Locators - Documents Sidebar
  // ===================
  readonly documentSearchInput: Locator;
  readonly newDocumentButton: Locator;
  readonly templateButton: Locator;
  readonly documentList: Locator;

  // ===================
  // Locators - Projects Sidebar
  // ===================
  readonly newProjectButton: Locator;
  readonly projectList: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation tabs - using data-tour attributes when available
    this.dashboardTab = page.locator("[data-tour='nav-dashboard']").or(
      page.getByRole("button", { name: /my work|dashboard/i }),
    );
    this.documentsTab = page.locator("[data-tour='nav-documents']").or(
      page.getByRole("button", { name: /documents/i }),
    );
    this.projectsTab = page.locator("[data-tour='nav-projects']").or(
      page.getByRole("button", { name: /projects/i }),
    );
    this.timesheetTab = page.locator("[data-tour='nav-timesheet']").or(
      page.getByRole("button", { name: /timesheet/i }),
    );
    this.calendarTab = page.locator("[data-tour='nav-calendar']").or(
      page.getByRole("button", { name: /calendar/i }),
    );
    this.settingsTab = page.locator("[data-tour='nav-settings']").or(
      page.getByRole("button", { name: /settings/i }),
    );

    // Header actions
    this.mobileMenuButton = page.getByRole("button", { name: /menu|toggle.*sidebar/i });
    this.commandPaletteButton = page.getByRole("button", { name: /command|⌘k/i });
    this.shortcutsHelpButton = page.getByRole("button", { name: /keyboard|shortcuts|\?/i });
    this.globalSearchButton = page.getByRole("button", { name: /search/i });
    this.notificationButton = page.locator("[data-tour='notifications']").or(
      page.getByRole("button", { name: /notification/i }),
    );
    this.signOutButton = page.getByRole("button", { name: /sign out|logout/i });

    // Theme toggle buttons
    this.lightThemeButton = page.getByRole("button", { name: /light|☀️|sun/i });
    this.darkThemeButton = page.getByRole("button", { name: /dark|🌙|moon/i });
    this.systemThemeButton = page.getByRole("button", { name: /system|💻|monitor/i });

    // Content areas
    this.mainContent = page.getByRole("main");
    this.sidebar = page.locator("[data-tour='sidebar']");
    this.loadingSpinner = page.locator(".animate-spin");

    // Dashboard specific content
    this.myIssuesSection = page.getByText(/my issues/i).first();
    this.projectsSection = page.getByRole("heading", { name: /my projects/i });
    this.recentActivitySection = page.getByText(/recent activity/i);
    this.quickStatsSection = page.getByText(/quick stats/i);
    this.assignedTab = page.getByRole("button", { name: /assigned/i }).first();
    this.createdTab = page.getByRole("button", { name: /created/i }).first();

    // Modals - Command Palette
    this.commandPalette = page.getByRole("dialog").filter({ hasText: /command/i });
    this.commandPaletteInput = page.getByPlaceholder(/type.*command|search.*command/i);

    // Modals - Shortcuts
    this.shortcutsModal = page.getByRole("dialog").filter({ hasText: /keyboard shortcuts/i });

    // Modals - Global Search
    this.globalSearchModal = page.getByRole("dialog").filter({ hasText: /search/i });
    this.globalSearchInput = page.getByPlaceholder(/search.*issues|search.*documents/i);

    // Notifications
    this.notificationPanel = page.locator("[role='menu']").filter({ hasText: /notification/i }).or(
      page.getByRole("region", { name: /notification/i }),
    );
    this.markAllReadButton = page.getByRole("button", { name: /mark.*read/i });
    this.notificationItems = page.locator("[data-notification-item]");

    // Documents sidebar
    this.documentSearchInput = page.getByPlaceholder(/search.*document/i);
    this.newDocumentButton = page.getByRole("button", { name: /new.*document|\+ new/i });
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page.locator("[data-document-list]");

    // Projects sidebar
    this.newProjectButton = page.getByRole("button", { name: /new.*project|\+ new/i });
    this.projectList = page.locator("[data-project-list]");
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
    await tabs[tab].evaluate((el: HTMLElement) => el.click());
    await this.waitForLoad();
  }

  // ===================
  // Actions - Header
  // ===================

  async openCommandPalette() {
    await this.commandPaletteButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.commandPalette).toBeVisible({ timeout: 5000 });
  }

  async closeCommandPalette() {
    await this.page.keyboard.press("Escape");
    await expect(this.commandPalette).not.toBeVisible();
  }

  async openShortcutsHelp() {
    await this.shortcutsHelpButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.shortcutsModal).toBeVisible({ timeout: 5000 });
  }

  async closeShortcutsHelp() {
    await this.page.keyboard.press("Escape");
    await expect(this.shortcutsModal).not.toBeVisible();
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const buttons = {
      light: this.lightThemeButton,
      dark: this.darkThemeButton,
      system: this.systemThemeButton,
    };
    await buttons[theme].evaluate((el: HTMLElement) => el.click());
  }

  async openNotifications() {
    await this.notificationButton.evaluate((el: HTMLElement) => el.click());
  }

  async closeNotifications() {
    await this.page.keyboard.press("Escape");
  }

  async signOut() {
    await this.signOutButton.evaluate((el: HTMLElement) => el.click());
  }

  async openGlobalSearch() {
    await this.globalSearchButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.globalSearchModal).toBeVisible({ timeout: 5000 });
  }

  async closeGlobalSearch() {
    await this.page.keyboard.press("Escape");
    await expect(this.globalSearchModal).not.toBeVisible();
  }

  // ===================
  // Actions - Dashboard Content
  // ===================

  async filterIssues(filter: "assigned" | "created") {
    const tabs = {
      assigned: this.assignedTab,
      created: this.createdTab,
    };
    await tabs[filter].evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Actions - Documents Sidebar
  // ===================

  async createNewDocument() {
    await this.newDocumentButton.evaluate((el: HTMLElement) => el.click());
  }

  async searchDocuments(query: string) {
    await this.documentSearchInput.fill(query);
  }

  // ===================
  // Actions - Projects Sidebar
  // ===================

  async createNewProject() {
    await this.newProjectButton.evaluate((el: HTMLElement) => el.click());
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
