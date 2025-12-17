import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Projects/Workspaces Page Object
 * Handles the projects view with sidebar and kanban board
 * Note: UI uses "Workspaces" terminology, URLs use /projects/ path
 */
export class ProjectsPage extends BasePage {
  private companySlug: string;
  // ===================
  // Locators - Sidebar
  // ===================
  readonly sidebar: Locator;
  readonly newProjectButton: Locator;
  readonly addProjectButton: Locator; // Alias for sidebar "Add new project" button
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

  constructor(page: Page, companySlug = "nixelo-e2e") {
    super(page);
    this.companySlug = companySlug;

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.locator("aside").first());
    // Updated to match "Project" terminology in UI
    this.newProjectButton = page.getByRole("button", { name: /new.*project|\+ new/i });
    this.addProjectButton = page.getByRole("button", { name: "Add new project" });
    this.projectList = page
      .locator("[data-project-list]")
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.projectItems = page
      .locator("[data-project-item]")
      .or(this.sidebar.getByRole("button").filter({ hasNotText: /new|add/i }));

    // Create project form - look for form containing project inputs
    this.createProjectForm = page
      .locator("[data-create-project-form]")
      .or(page.locator("form").filter({ has: page.getByPlaceholder(/project name/i) }));
    this.projectNameInput = page
      .getByPlaceholder(/project name/i)
      .or(page.getByLabel(/project name/i));
    this.projectKeyInput = page.getByPlaceholder(/project key/i);
    this.projectDescriptionInput = page
      .getByPlaceholder(/description/i)
      .or(page.getByLabel(/description/i));
    this.makePublicCheckbox = page.getByRole("checkbox", { name: /public/i });
    this.boardTypeKanban = page
      .getByRole("radio", { name: /kanban/i })
      .or(page.getByLabel(/kanban/i));
    this.boardTypeScrum = page.getByRole("radio", { name: /scrum/i }).or(page.getByLabel(/scrum/i));
    this.createButton = page.getByRole("button", { name: /^create$/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Project board - look for Kanban Board heading or board container
    this.projectBoard = page
      .locator("[data-project-board]")
      .or(page.getByRole("heading", { name: /kanban board/i }));
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

    // Project tabs
    this.boardTab = page
      .getByRole("tab", { name: /board/i })
      .or(page.getByRole("button", { name: /board/i }));
    this.backlogTab = page
      .getByRole("tab", { name: /backlog/i })
      .or(page.getByRole("button", { name: /backlog/i }));
    this.sprintsTab = page
      .getByRole("tab", { name: /sprint/i })
      .or(page.getByRole("button", { name: /sprint/i }));
    this.analyticsTab = page
      .getByRole("tab", { name: /analytics/i })
      .or(page.getByRole("button", { name: /analytics/i }));
    this.settingsTab = page
      .getByRole("tab", { name: /settings/i })
      .or(page.getByRole("button", { name: /settings/i }));

    // Issue detail dialog
    this.issueDetailDialog = page.getByRole("dialog");
    this.startTimerButton = this.issueDetailDialog.getByRole("button", { name: "Start Timer" });
    this.stopTimerButton = this.issueDetailDialog.getByRole("button", { name: "Stop Timer" });
    this.timerStoppedToast = page.getByText(/Timer stopped/i);
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto(`/${this.companySlug}/projects`);
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
    await this.projectNameInput.fill(name);
    await this.projectKeyInput.fill(key);
    if (description) {
      await this.projectDescriptionInput.fill(description);
    }
    await this.createButton.evaluate((el: HTMLElement) => el.click());
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
