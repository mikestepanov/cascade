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

  constructor(page: Page) {
    super(page);

    this.newWorkspaceButton = page.getByRole("button", {
      name: /\+ Create Workspace|Add new workspace|\+ New/i,
    });
    this.workspaceNameInput = page.getByLabel(/workspace name/i);
    this.workspaceDescriptionInput = page.getByLabel(/description/i);
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
    this.workspaceList = page.locator(".grid"); // Adjust based on actual container
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
  }

  async expectLoaded() {
    // Wait for the global loading spinner or "Loading..." text to disappear
    const loadingSpinner = this.page
      .locator(".loading-spinner")
      .or(this.page.getByText(/loading/i));
    // Wait for it to become hidden OR detached
    await loadingSpinner.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    await loadingSpinner.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500); // Small stabilization
  }

  async goto() {
    const slug = this.getCompanySlug();
    const workspacesUrl = `/${slug}/workspaces`;

    // Navigate with retry logic to handle redirects
    await expect(async () => {
      await this.page.goto(workspacesUrl, { waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(1000);

      const currentUrl = this.page.url();
      if (!currentUrl.includes("/workspaces")) {
        console.log(`  ⚠️ WorkspacesPage.goto: Redirected to ${currentUrl}, retrying...`);
        throw new Error("Redirected away from workspaces page");
      }
    }).toPass({ timeout: 15000 });

    await this.expectLoaded();
    await this.waitForLoad();
  }

  async createWorkspace(name: string, description?: string) {
    await this.newWorkspaceButton.click();
    await this.workspaceNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.workspaceNameInput.fill(name);
    if (description) {
      await this.workspaceDescriptionInput.fill(description);
    }
    await this.submitWorkspaceButton.click();
    // Wait for navigation or modal close
    await expect(this.workspaceNameInput).not.toBeVisible({ timeout: 10000 });
  }

  async expectWorkspacesView() {
    await expect(this.newWorkspaceButton).toBeVisible();
  }

  async expectWorkspaceCount(count: number) {
    await expect(this.workspaceCards).toHaveCount(count);
  }
}
