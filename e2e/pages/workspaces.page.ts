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

    this.newWorkspaceButton = page.getByRole("button", { name: "+ Create Workspace" });
    this.workspaceNameInput = page.getByLabel(/workspace name/i);
    this.workspaceDescriptionInput = page.getByLabel(/description/i);
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
    this.workspaceList = page.locator(".grid"); // Adjust based on actual container
    this.workspaceCards = page.locator("a[href*='/workspaces/']");
  }

  async goto() {
    const currentUrl = this.page.url();
    const match = currentUrl.match(/\/([^/]+)\//);
    const slug = match ? match[1] : "nixelo-e2e";
    await this.page.goto(`/${slug}/workspaces`);
    await this.page.waitForLoadState("networkidle");
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
