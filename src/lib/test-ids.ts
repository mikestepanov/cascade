/**
 * Shared Test IDs for E2E Tests and Components
 *
 * This file is the single source of truth for all data-testid values.
 * It is imported by both:
 * - Production components: `data-testid={TEST_IDS.ISSUE.CARD}`
 * - E2E tests: `page.getByTestId(TEST_IDS.ISSUE.CARD)`
 *
 * RULES:
 * 1. Every ID here must be used in a component's data-testid attribute
 * 2. Use semantic names that describe WHAT the element is
 * 3. Group by feature/domain
 * 4. Values are kebab-case strings (e.g., 'issue-card')
 */

export const TEST_IDS = {
  // ============================================================
  // Issues & Board
  // ============================================================

  ISSUE: {
    /** @see src/components/IssueCard.tsx */
    CARD: "issue-card",
    /** @see src/components/IssueCard.tsx */
    KEY: "issue-key",
    /** @see src/components/IssueCard.tsx */
    PRIORITY: "issue-priority",
    /** @see src/components/IssueDetailModal.tsx */
    DETAIL_MODAL: "issue-detail-modal",
  },

  BOARD: {
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN: "board-column",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN_HEADER: "board-column-header",
    /** @see src/components/Kanban/KanbanColumn.tsx */
    COLUMN_COUNT: "board-column-count",
  },

  // ============================================================
  // Workspaces & Teams
  // ============================================================

  WORKSPACE: {
    /** @see src/components/WorkspaceCard.tsx */
    CARD: "workspace-card",
    /** @see src/components/WorkspaceCard.tsx */
    NAME: "workspace-name",
  },

  // ============================================================
  // Navigation & Layout
  // ============================================================

  NAV: {
    /** @see src/components/ui/Logo.tsx */
    BRAND_LOGO: "brand-logo",
    /** @see src/components/Sidebar.tsx */
    SIDEBAR: "sidebar",
    /** @see src/routes/__root.tsx */
    MAIN_CONTENT: "main-content",
  },

  // ============================================================
  // Search
  // ============================================================

  SEARCH: {
    /** @see src/components/GlobalSearch.tsx */
    MODAL: "search-modal",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_ITEM: "search-result-item",
    /** @see src/components/GlobalSearch.tsx */
    RESULT_TYPE: "search-result-type",
  },

  // ============================================================
  // Projects
  // ============================================================

  PROJECT: {
    /** @see src/components/CreateProjectFromTemplate.tsx */
    CREATE_MODAL: "create-project-modal",
    /** @see src/components/CreateProjectFromTemplate.tsx */
    NAME_INPUT: "project-name-input",
    /** @see src/components/CreateProjectFromTemplate.tsx */
    KEY_INPUT: "project-key-input",
  },

  // ============================================================
  // Auth
  // ============================================================

  AUTH: {
    /** @see src/components/auth/SignInForm.tsx */
    EMAIL_INPUT: "auth-email-input",
    /** @see src/components/auth/SignInForm.tsx */
    PASSWORD_INPUT: "auth-password-input",
    /** @see src/components/auth/SignInForm.tsx */
    SUBMIT_BUTTON: "auth-submit-button",
  },

  // ============================================================
  // Editor
  // ============================================================

  EDITOR: {
    /** @see src/components/PlateEditor.tsx */
    PLATE: "plate-editor",
    /** @see src/components/CommandPalette.tsx */
    COMMAND_PALETTE: "command-palette",
  },

  // ============================================================
  // Calendar
  // ============================================================

  CALENDAR: {
    /** @see src/components/Calendar/shadcn-calendar/header/actions/calendar-header-actions-mode.tsx */
    MODE_DAY: "calendar-mode-day",
    MODE_WEEK: "calendar-mode-week",
    MODE_MONTH: "calendar-mode-month",
  },

  // ============================================================
  // Debug / Dev Tools
  // ============================================================

  DEBUG: {
    /** @see src/components/DevTools.tsx */
    USER_ROLE: "debug-user-role",
  },

  // ============================================================
  // Activity Feed
  // ============================================================

  ACTIVITY: {
    /** @see src/components/ActivityFeed.tsx */
    FEED: "activity-feed",
    /** @see src/components/ActivityFeed.tsx */
    ENTRY: "activity-entry",
  },

  // ============================================================
  // Sprints
  // ============================================================

  SPRINT: {
    /** @see src/components/SprintCard.tsx */
    CARD: "sprint-card",
    /** @see src/components/SprintCard.tsx */
    NAME: "sprint-name",
  },

  // ============================================================
  // Analytics
  // ============================================================

  ANALYTICS: {
    /** @see src/components/AnalyticsDashboard.tsx */
    CARD: "analytics-card",
  },

  // ============================================================
  // Documents
  // ============================================================

  DOCUMENT: {
    /** @see src/components/DocumentsList.tsx */
    CARD: "document-card",
    /** @see src/components/DocumentHeader.tsx */
    TITLE: "document-title",
  },
} as const;

/** Type helper for accessing TEST_IDS values */
export type TestIdKey = keyof typeof TEST_IDS;
