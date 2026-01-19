import { expect } from "@playwright/test";
import { dashboardLocators, settingsLocators } from "../locators";
import { BasePage } from "./base.page";

/**
 * Settings Page Object
 * Handles the settings view with integrations, API keys, and preferences
 */
export class SettingsPage extends BasePage {
  // ===================
  // Locators - Settings Tabs
  // ===================
  readonly integrationsTab: Locator;
  readonly apiKeysTab: Locator;
  readonly offlineTab: Locator;
  readonly preferencesTab: Locator;
  readonly adminTab: Locator;
  readonly devToolsTab: Locator;

  // ===================
  // Locators - Theme Options (in Preferences tab)
  // ===================
  readonly themeLightOption: Locator;
  readonly themeDarkOption: Locator;
  readonly themeSystemOption: Locator;

  // ===================
  // Locators - Integrations
  // ===================
  readonly githubIntegration: Locator;
  readonly googleCalendarIntegration: Locator;
  readonly pumbleIntegration: Locator;
  readonly connectGithubButton: Locator;
  readonly connectGoogleButton: Locator;
  readonly connectPumbleButton: Locator;

  // ===================
  // Locators - API Keys
  // ===================
  readonly apiKeysList: Locator;
  readonly generateApiKeyButton: Locator;
  readonly apiKeyNameInput: Locator;
  readonly createApiKeyButton: Locator;
  readonly copyApiKeyButton: Locator;
  readonly revokeApiKeyButton: Locator;

  // ===================
  // Locators - Offline Mode
  // ===================
  readonly offlineToggle: Locator;
  readonly syncStatusIndicator: Locator;
  readonly forceSyncButton: Locator;

  // ===================
  // Locators - Preferences
  // ===================
  readonly notificationPreferences: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly pushNotificationsToggle: Locator;
  readonly languageSelect: Locator;
  readonly timezoneSelect: Locator;

  // ===================
  // Locators - Admin
  // ===================
  readonly userManagementSection: Locator;
  readonly inviteUserButton: Locator;
  readonly userTypeManager: Locator;
  readonly hourComplianceDashboard: Locator;

  // ===================
  // Locators - Invite User Modal
  // ===================
  readonly inviteUserModal: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly sendInviteButton: Locator;

  // ===================
  // Locators - Organization Settings
  // ===================
  readonly organizationNameInput: Locator;
  readonly requiresTimeApprovalSwitch: Locator;
  readonly saveSettingsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Settings tabs
    this.integrationsTab = page
      .getByRole("tab", { name: /integration/i })
      .or(page.getByRole("button", { name: /integration/i }));
    this.apiKeysTab = page
      .getByRole("tab", { name: /api.*key/i })
      .or(page.getByRole("button", { name: /api.*key/i }));
    this.offlineTab = page
      .getByRole("tab", { name: /offline/i })
      .or(page.getByRole("button", { name: /offline/i }));
    this.preferencesTab = page
      .getByRole("tab", { name: /preference/i })
      .or(page.getByRole("button", { name: /preference/i }));
    this.adminTab = page
      .getByRole("tab", { name: /admin/i })
      .or(page.getByRole("button", { name: /admin/i }));
    this.devToolsTab = page.getByRole("tab", { name: /dev tools/i });

    // Theme options (in Preferences tab) - ToggleGroupItems with aria-labels
    this.themeLightOption = page.getByRole("radio", { name: /light theme/i });
    this.themeDarkOption = page.getByRole("radio", { name: /dark theme/i });
    this.themeSystemOption = page.getByRole("radio", { name: /system theme/i });

    // Integrations
    this.githubIntegration = page
      .locator("[data-integration='github']")
      .or(page.getByText(/github/i).first());
    this.googleCalendarIntegration = page
      .locator("[data-integration='google-calendar']")
      .or(page.getByText(/google.*calendar/i).first());
    this.pumbleIntegration = page
      .locator("[data-integration='pumble']")
      .or(page.getByText(/pumble/i).first());
    this.connectGithubButton = page.getByRole("button", { name: /connect.*github/i });
    this.connectGoogleButton = page.getByRole("button", { name: /connect.*google/i });
    this.connectPumbleButton = page.getByRole("button", { name: /connect.*pumble/i });

    // API Keys
    this.apiKeysList = page.locator("[data-api-keys-list]");
    this.generateApiKeyButton = page.getByRole("button", {
      name: /generate|create.*key|new.*key/i,
    });
    this.apiKeyNameInput = page.getByPlaceholder(/key.*name|name/i);
    this.createApiKeyButton = page.getByRole("button", { name: /^create$/i });
    this.copyApiKeyButton = page.getByRole("button", { name: /copy/i });
    this.revokeApiKeyButton = page.getByRole("button", { name: /revoke|delete/i });

    // Offline mode
    this.offlineToggle = page
      .getByRole("switch", { name: /offline/i })
      .or(page.getByRole("checkbox", { name: /offline/i }));
    this.syncStatusIndicator = page.locator("[data-sync-status]");
    this.forceSyncButton = page.getByRole("button", { name: /sync|force.*sync/i });

    // Preferences
    this.notificationPreferences = page.locator("[data-notification-preferences]");
    this.emailNotificationsToggle = page
      .getByRole("switch", { name: /email/i })
      .or(page.getByRole("checkbox", { name: /email.*notification/i }));
    this.pushNotificationsToggle = page
      .getByRole("switch", { name: /push/i })
      .or(page.getByRole("checkbox", { name: /push.*notification/i }));
    this.languageSelect = page.getByRole("combobox", { name: /language/i });
    this.timezoneSelect = page.getByRole("combobox", { name: /timezone/i });

    // Admin
    this.userManagementSection = page
      .locator("[data-user-management]")
      .or(page.getByText(/user.*management/i));
    this.inviteUserButton = page.getByRole("button", { name: /invite.*user/i });
    this.userTypeManager = page.locator("[data-user-type-manager]");
    this.hourComplianceDashboard = page.locator("[data-hour-compliance]");

    // Invite user form (it's an inline Card, not a dialog)
    this.inviteUserModal = page.getByRole("heading", { name: /send invitation/i });
    this.inviteEmailInput = page.getByPlaceholder("user@example.com");
    this.inviteRoleSelect = page.getByLabel(/role/i);
    this.sendInviteButton = page.getByRole("button", { name: "Send Invitation", exact: true });

    // Admin - Organization Settings
    this.organizationNameInput = page.locator("#orgName");
    this.requiresTimeApprovalSwitch = page.getByRole("switch", { name: /require time approval/i });
    this.saveSettingsButton = page.getByRole("button", { name: /save changes/i });
  }

  // ===================
  // Actions - Navigation
  // ===================

  async goto(orgSlug?: string) {
    const slug = orgSlug || this.getOrganizationSlug();

    // Navigate directly to settings URL
    const url = `/${slug}/settings/profile`;
    await this.page.goto(url);

    try {
      // Wait for the Settings heading as a sign of page load
      await this.page
        .getByRole("heading", { name: /settings/i })
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      // Wait for settings page to load - look for integrations tab (always visible)
      await this.integrationsTab.first().waitFor({ state: "visible", timeout: 10000 });
    } catch (e) {
      const currentUrl = this.page.url();
      const bodyText = await this.page
        .evaluate(() => document.body.innerText)
        .catch(() => "Could not get body text");
      console.log(`[DEBUG] SettingsPage.goto failed`);
      console.log(`[DEBUG] Target URL: ${url}`);
      console.log(`[DEBUG] Current URL: ${currentUrl}`);
      const localStorage = await this.page
        .evaluate(() => JSON.stringify(localStorage))
        .catch(() => "Could not get localStorage");
      const convexClientState = await this.page
        .evaluate(() => {
          const client = (window as any).__convex_test_client;
          return client
            ? `Found client. Auth token set: ${!!client.authenticationToken}`
            : "Client not found on window";
        })
        .catch(() => "Error getting client state");
      console.log(`[DEBUG] LocalStorage: ${localStorage}`);
      console.log(`[DEBUG] ConvexClient: ${convexClientState}`);
      console.log(`[DEBUG] Body Text: ${bodyText.substring(0, 1000)}`);
      throw e;
    }
  }

  async switchToTab(
    tab: "integrations" | "apiKeys" | "offline" | "preferences" | "admin" | "devTools",
  ) {
    // Wait for React to fully hydrate and attach event handlers
    // Don't use networkidle - Convex WebSocket keeps connection active
    await this.page.waitForLoadState("domcontentloaded");

    // UI stabilization wait - Tabs often re-render when auth/user data loads
    await this.page.waitForTimeout(1000);

    // Use getByRole("tab") directly - Radix UI tabs have role="tab"
    const tabLocator = this.page.getByRole("tab", { name: new RegExp(tab, "i") });
    await tabLocator.first().waitFor({ state: "visible", timeout: 30000 });

    // Focus first, then click - ensures React event handlers are attached
    await tabLocator.first().focus();

    // Click with increased timeout and retry resilience
    await tabLocator.first().click({ timeout: 20000 });

    // Wait for tab to become active
    await expect(tabLocator.first()).toHaveAttribute("aria-selected", "true", { timeout: 10000 });
    await this.waitForLoad();
  }

  // ===================
  // Actions - Integrations
  // ===================

  async connectGithub() {
    await this.connectGithubButton.evaluate((el: HTMLElement) => el.click());
  }

  async connectGoogleCalendar() {
    await this.connectGoogleButton.evaluate((el: HTMLElement) => el.click());
  }

  async connectPumble() {
    await this.connectPumbleButton.evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Actions - API Keys
  // ===================

  async generateApiKey(name: string) {
    await this.generateApiKeyButton.evaluate((el: HTMLElement) => el.click());
    await this.apiKeyNameInput.fill(name);
    await this.createApiKeyButton.evaluate((el: HTMLElement) => el.click());
  }

  async copyApiKey() {
    await this.copyApiKeyButton.evaluate((el: HTMLElement) => el.click());
  }

  async revokeApiKey() {
    await this.revokeApiKeyButton.first().evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Actions - Offline Mode
  // ===================

  async toggleOfflineMode() {
    await this.offlineToggle.evaluate((el: HTMLElement) => el.click());
  }

  async forceSync() {
    await this.forceSyncButton.evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Actions - Admin
  // ===================

  async openInviteUserModal() {
    // Wait for the Admin tab content to be fully loaded
    await this.page.waitForTimeout(2000);

    // Use the first "Invite User" button (header one, not empty state one)
    const inviteBtn = this.inviteUserButton.first();
    await inviteBtn.waitFor({ state: "visible", timeout: 15000 });

    // Scroll into view and wait for it to be stable
    await inviteBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);

    // Click using standard Playwright click
    await inviteBtn.click();

    // Wait for form to appear
    await expect(this.inviteUserModal).toBeVisible({ timeout: 5000 });
  }

  async inviteUser(email: string, role?: string) {
    await this.openInviteUserModal();
    await this.inviteEmailInput.fill(email);
    if (role) {
      // Radix Select - click trigger with "User" text (default value), then select option
      const selectTrigger = this.page.getByRole("combobox").filter({ hasText: /^User$|^Admin$/ });
      await selectTrigger.click();
      await this.page.getByRole("option", { name: new RegExp(`^${role}$`, "i") }).click();
    }
    await this.sendInviteButton.click();
  }

  async setTheme(theme: "light" | "dark" | "system") {
    const options = {
      light: this.themeLightOption,
      dark: this.themeDarkOption,
      system: this.themeSystemOption,
    };
    await options[theme].click();
  }

  // ===================
  // Assertions
  // ===================

  async expectSettingsView() {
    await expect(this.integrationsTab).toBeVisible();
  }

  async expectIntegrationsTab() {
    await expect(this.githubIntegration).toBeVisible();
  }

  async expectApiKeysTab() {
    await expect(this.generateApiKeyButton).toBeVisible();
  }

  async expectPreferencesTab() {
    await expect(this.notificationPreferences).toBeVisible();
  }

  async updateOrganizationName(name: string) {
    if (name) {
      await this.organizationNameInput.fill(name);
    }
    await this.saveSettingsButton.click();
    await expect(this.page.getByText(/organization settings updated/i)).toBeVisible();
  }

  async toggleTimeApproval(enabled: boolean) {
    const isChecked = await this.requiresTimeApprovalSwitch.getAttribute("aria-checked");
    if ((isChecked === "true") !== enabled) {
      await this.requiresTimeApprovalSwitch.click();
    }
    await this.saveSettingsButton.click();
    await expect(this.page.getByText(/organization settings updated/i)).toBeVisible();
  }

  async expectOrganizationName(name: string) {
    await this.organizationNameInput.waitFor({ state: "visible", timeout: 15000 });
    await expect(this.organizationNameInput).toHaveValue(name, { timeout: 10000 });
  }
}
