import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Workspaces Page Object
 * Handles top-level department/workspace management
 */
export class WorkspacesPage extends BasePage {
  readonly newWorkspaceButton: Locator;
  readonly workspaceNameInput: Locator;
  readonly workspaceDescriptionInput: Locator;
  readonly submitWorkspaceButton: Locator;
  readonly workspaceList: Locator;
  readonly workspaceCards: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Scope to main content to avoid sidebar's "Add new workspace" button
    this.newWorkspaceButton = page.getByRole("button", {
      name: /\+ Create Workspace|Create Workspace/i,
    });
    this.workspaceNameInput = page.locator("#workspace-name");
    this.workspaceDescriptionInput = page.locator("#workspace-description");
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
    this.workspaceList = page.locator(".grid"); // Adjust based on actual container
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
  }

  async expectLoaded() {
    // Wait for any loading spinner to be hidden
    const loadingSpinner = this.page
      .locator(".loading-spinner")
      .or(this.page.getByText(/loading/i));
    await loadingSpinner.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }

  async goto() {
    const workspacesUrl = `/${this.orgSlug}/workspaces`;

    await this.page.goto(workspacesUrl, { waitUntil: "domcontentloaded" });

    try {
      // Wait for the Workspaces heading
      await this.page
        .getByRole("heading", { name: /workspaces/i })
        .first()
        .waitFor({ state: "visible", timeout: 15000 });
    } catch (e) {
      const currentUrl = this.page.url();
      const bodyText = await this.page
        .evaluate(() => document.body.innerText)
        .catch(() => "Could not get body text");
      console.log(`[DEBUG] WorkspacesPage.goto failed`);
      console.log(`[DEBUG] Target URL: ${workspacesUrl}`);
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

  async createWorkspace(name: string, description?: string) {
    await this.newWorkspaceButton.click({ force: true });

    // Wait for modal to be stable - description input often loads or re-renders
    await this.workspaceNameInput.waitFor({ state: "visible", timeout: 10000 });
    // await this.workspaceDescriptionInput.waitFor({ state: "visible", timeout: 10000 });

    await this.workspaceNameInput.fill(name);

    if (description) {
      await this.workspaceDescriptionInput.waitFor({ state: "visible", timeout: 10000 });
      // Ensure it's stable
      await this.page.waitForTimeout(500);
      await this.workspaceDescriptionInput.fill(description, { force: true });
    }

    await this.submitWorkspaceButton.click({ force: true });

    // Wait for modal to close (name input disappears)
    await expect(this.workspaceNameInput).not.toBeVisible({ timeout: 15000 });

    // Additional wait for list to refresh
    await this.page.waitForTimeout(500);
  }

  async expectWorkspacesView() {
    await expect(this.newWorkspaceButton).toBeVisible();
  }

  async expectWorkspaceCount(count: number) {
    await expect(this.workspaceCards).toHaveCount(count);
  }
}
