import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Projects/Workspaces Page Object
 * Handles the projects view with sidebar and kanban board
 * Note: UI uses "Workspaces" terminology, URLs use /projects/ path
 */
export class ProjectsPage extends BasePage {
  // ===================
  // Locators - Sidebar
  // ===================
  readonly sidebar: Locator;
  readonly newProjectButton: Locator;
  readonly createEntityButton: Locator; // Alias for sidebar "Add new project" or "Create Workspace" button
  readonly projectList: Locator;
  readonly projectItems: Locator;

  // ===================
  // Locators - Create Project Form
  // ===================
  readonly createProjectForm: Locator;
  readonly projectNameInput: Locator;
  readonly projectKeyInput: Locator;
  readonly projectDescriptionInput: Locator;
  readonly makePublicCheckbox: Locator;
  readonly boardTypeKanban: Locator;
  readonly boardTypeScrum: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  // ===================
  // Locators - Project Board
  // ===================
  readonly projectBoard: Locator;
  readonly boardColumns: Locator;
  readonly issueCards: Locator;
  readonly createIssueButton: Locator;

  // ===================
  // Locators - Create Issue Modal
  // ===================
  readonly createIssueModal: Locator;
  readonly issueTitleInput: Locator;
  readonly issueDescriptionInput: Locator;
  readonly issueTypeSelect: Locator;
  readonly issuePrioritySelect: Locator;
  readonly issueAssigneeSelect: Locator;
  readonly submitIssueButton: Locator;

  // ===================
  // Locators - Project Tabs
  // ===================
  readonly boardTab: Locator;
  readonly backlogTab: Locator;
  readonly sprintsTab: Locator;
  readonly analyticsTab: Locator;
  readonly settingsTab: Locator;

  // ===================
  // Locators - Issue Detail Dialog
  // ===================
  readonly issueDetailDialog: Locator;
  readonly startTimerButton: Locator;
  readonly stopTimerButton: Locator;
  readonly timerStoppedToast: Locator;

  // Workspace creation
  readonly workspaceNameInput: Locator;
  readonly workspaceDescriptionInput: Locator;
  readonly submitWorkspaceButton: Locator;

  constructor(page: Page, _companySlug = "nixelo-e2e") {
    super(page);

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.locator("aside").first());
    // Updated to match "Project" terminology in UI (now "Workspaces")
    this.newProjectButton = page.getByRole("button", {
      name: /\+ create project/i,
    });
    this.createEntityButton = page.getByRole("button", {
      name: /add new project|create (workspace|project)|\+ create (workspace|project)/i,
    });
    this.projectList = page
      .locator("[data-project-list]")
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.projectItems = page
      .locator("[data-project-item]")
      .or(this.sidebar.getByRole("button").filter({ hasNotText: /new|add/i }));

    // Create project form - look for dialog content
    this.createProjectForm = page.getByTestId("create-project-modal");

    // Template selection
    // We'll pick the first template by default or look for specific one
    // const templateButton = this.createProjectForm.getByRole("button").filter({ hasText: "Software Project" });

    this.projectNameInput = page.getByLabel(/project name/i);
    this.projectKeyInput = page.getByLabel(/project key/i);
    this.projectDescriptionInput = page.getByLabel(/description/i);
    this.makePublicCheckbox = page.getByRole("checkbox", { name: /public/i });

    // Board type is now part of template, but keeping locators just in case
    this.boardTypeKanban = page.getByRole("radio", { name: /kanban/i });
    this.boardTypeScrum = page.getByRole("radio", { name: /scrum/i });

    // Button in the modal
    this.createButton = this.createProjectForm.getByRole("button", {
      name: /create project/i,
    });
    this.cancelButton = this.createProjectForm.getByRole("button", { name: /cancel/i });

    // Project board - look for Kanban Board heading or board container
    this.projectBoard = page
      .locator("[data-project-board]")
      .or(page.getByRole("heading", { name: /kanban board|scrum board/i }));
    this.boardColumns = page.locator("[data-board-column]").or(page.locator(".kanban-column"));
    this.issueCards = page.locator("[data-issue-card]").or(page.locator(".issue-card"));
    // Create issue - look for "Add issue" button (column headers have "Add issue to X")
    this.createIssueButton = page.getByRole("button", { name: /add issue/i }).first();

    // Create issue modal
    this.createIssueModal = page
      .getByRole("dialog")
      .filter({ hasText: /create.*issue|new.*issue/i });
    this.issueTitleInput = page.getByPlaceholder(/title|issue.*title/i);
    this.issueDescriptionInput = page
      .getByPlaceholder(/description/i)
      .or(page.locator("[data-issue-description]"));
    this.issueTypeSelect = page.getByRole("combobox", { name: /type/i });
    this.issuePrioritySelect = page.getByRole("combobox", { name: /priority/i });
    this.issueAssigneeSelect = page.getByRole("combobox", { name: /assignee/i });
    this.submitIssueButton = this.createIssueModal.getByRole("button", { name: /create|submit/i });

    // Project tabs - updated to be more specific and avoid collision with role-based buttons
    this.boardTab = page
      .getByRole("button", { name: /board view/i })
      .or(page.getByRole("tab", { name: /board/i }));
    this.backlogTab = page
      .getByRole("button", { name: /backlog view/i })
      .or(page.getByRole("tab", { name: /backlog/i }));
    this.sprintsTab = page
      .getByRole("button", { name: /sprints view/i })
      .or(page.getByRole("tab", { name: /sprint/i }));
    this.analyticsTab = page
      .getByRole("button", { name: /analytics view/i })
      .or(page.getByRole("tab", { name: /analytics/i }));
    // Use a method for settings tab to allow scoping to main content if needed
    this.settingsTab = page
      .getByRole("button", { name: /settings view/i })
      .or(page.getByRole("tab", { name: /settings/i }));
    // Issue detail dialog
    this.issueDetailDialog = page.getByRole("dialog");
    this.startTimerButton = this.issueDetailDialog.getByRole("button", { name: "Start Timer" });
    this.stopTimerButton = this.issueDetailDialog.getByRole("button", { name: "Stop Timer" });
    this.timerStoppedToast = page.getByText(/Timer stopped/i);

    // Workspace creation
    this.workspaceNameInput = page.getByLabel(/workspace name/i);
    this.workspaceDescriptionInput = page.getByLabel(/description/i);
    this.submitWorkspaceButton = page.getByRole("button", { name: /create workspace/i });
  }

  /**
   * Get the project settings link specifically from the project navigation (top bar)
   * Scoped to "main" to avoid confusing it with global settings or sidebar items
   */
  getProjectSettingsTab() {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: /settings/i })
      .first();
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    // Navigate directly to the legacy projects route to ensure we hit ProjectsList
    // which has the "Create Project" button wired up correctly.
    // Assumes we are already logged in and on a page with company slug in URL.
    // Fallback to nixelo-e2e if not found (dashboard test default).
    const currentUrl = this.page.url();
    const match = currentUrl.match(/\/([^/]+)\/(dashboard|workspaces|projects|settings)/);
    const slug = match ? match[1] : "nixelo-e2e";
    await this.page.goto(`/${slug}/projects`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async openCreateProjectForm() {
    // Wait for React to hydrate before clicking
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);

    await this.newProjectButton.click();
    await expect(this.createProjectForm).toBeVisible({ timeout: 5000 });
  }

  async createProject(name: string, key: string, description?: string) {
    await this.openCreateProjectForm();

    try {
      // Step 1: Wait for templates to load and select Software Project
      const softwareTemplate = this.createProjectForm
        .getByRole("button")
        .filter({ hasText: /software/i })
        .first();

      await softwareTemplate.waitFor({ state: "visible", timeout: 10000 });
      // Use evaluate click if standard click is flaky due to re-renders
      await softwareTemplate.click().catch(() => softwareTemplate.click());

      // Step 2: Fill in project details
      await this.projectNameInput.waitFor({ state: "visible", timeout: 5000 });
      await this.projectNameInput.fill(name);
      await this.projectKeyInput.fill(key.toUpperCase());
      if (description) {
        await this.projectDescriptionInput.fill(description);
      }
      await this.createButton.click();
    } catch (e) {
      console.error("Failed to create project from template:", e);
      throw e;
    }
  }

  async createWorkspace(name: string, description?: string) {
    await this.createEntityButton.click();
    await this.workspaceNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.workspaceNameInput.fill(name);
    if (description) {
      await this.workspaceDescriptionInput.fill(description);
    }
    await this.submitWorkspaceButton.click();
  }

  async cancelCreateProject() {
    await this.cancelButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.createProjectForm).not.toBeVisible();
  }

  async selectProject(index: number) {
    const item = this.projectItems.nth(index);
    await item.evaluate((el: HTMLElement) => el.click());
  }

  async openCreateIssueModal() {
    await this.createIssueButton.click();
    await expect(this.createIssueModal).toBeVisible({ timeout: 5000 });
  }

  async createIssue(title: string, type?: string, priority?: string) {
    await this.openCreateIssueModal();
    await this.issueTitleInput.fill(title);
    if (type) {
      await this.issueTypeSelect.selectOption(type);
    }
    if (priority) {
      await this.issuePrioritySelect.selectOption(priority);
    }
    await this.submitIssueButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToTab(tab: "board" | "backlog" | "sprints" | "analytics" | "settings") {
    const tabs = {
      board: this.boardTab,
      backlog: this.backlogTab,
      sprints: this.sprintsTab,
      analytics: this.analyticsTab,
      settings: this.settingsTab,
    };
    await tabs[tab].evaluate((el: HTMLElement) => el.click());
  }

  /**
   * Get an issue card by its title
   */
  getIssueCard(title: string) {
    return this.page.getByRole("heading", { name: title, level: 4 });
  }

  /**
   * Open an issue detail dialog by clicking its card
   */
  async openIssueDetail(title: string) {
    const issueCard = this.getIssueCard(title);
    await issueCard.waitFor({ state: "visible", timeout: 5000 });
    await issueCard.click();
    await expect(this.issueDetailDialog).toBeVisible({ timeout: 5000 });
  }

  /**
   * Start timer in issue detail dialog
   */
  async startTimer() {
    await expect(this.startTimerButton).toBeVisible({ timeout: 5000 });
    await this.startTimerButton.scrollIntoViewIfNeeded();
    await this.startTimerButton.click();
    await expect(this.stopTimerButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Stop timer in issue detail dialog
   */
  async stopTimer() {
    await this.stopTimerButton.scrollIntoViewIfNeeded();
    await this.stopTimerButton.click();
    await expect(this.timerStoppedToast).toBeVisible({ timeout: 5000 });
    await expect(this.startTimerButton).toBeVisible({ timeout: 5000 });
  }

  // ===================
  // Assertions
  // ===================

  async expectProjectsView() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.newProjectButton).toBeVisible();
  }

  async expectBoardVisible() {
    await expect(this.projectBoard).toBeVisible();
  }

  async expectProjectCount(count: number) {
    await expect(this.projectItems).toHaveCount(count);
  }
}
