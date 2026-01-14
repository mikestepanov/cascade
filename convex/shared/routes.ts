/**
 * Route path patterns for TanStack Router
 * Use these when defining routes with createFileRoute
 */
export const ROUTE_PATTERNS = {
  home: "/" as const,
  signin: "/signin" as const,
  signup: "/signup" as const,
  forgotPassword: "/forgot-password" as const,
  invite: "/invite/$token" as const,
  terms: "/terms" as const,
  privacy: "/privacy" as const,
  onboarding: "/onboarding" as const,
  app: "/app" as const,
  companySlug: "/$companySlug" as const,
  dashboard: "/$companySlug/dashboard" as const,

  documents: {
    list: "/$companySlug/documents" as const,
    detail: "/$companySlug/documents/$id" as const,
    templates: "/$companySlug/documents/templates" as const,
  },

  workspaces: {
    list: "/$companySlug/workspaces" as const,
    detail: "/$companySlug/workspaces/$workspaceSlug" as const,
    layout: "/$companySlug/workspaces/$workspaceSlug" as const,
    board: "/$companySlug/workspaces/$workspaceSlug/board" as const,
    wiki: "/$companySlug/workspaces/$workspaceSlug/wiki" as const,
    settings: "/$companySlug/workspaces/$workspaceSlug/settings" as const,

    teams: {
      list: "/$companySlug/workspaces/$workspaceSlug/teams" as const,
      detail: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      layout: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      board: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/board" as const,
      backlog: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog" as const,
      wiki: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki" as const,
      calendar: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar" as const,
      settings: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/settings" as const,

      projects: {
        list: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects" as const,
        layout: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key" as const,
        board:
          "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/board" as const,
        calendar:
          "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/calendar" as const,
        timesheet:
          "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/timesheet" as const,
        wiki: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/wiki" as const,
        settings:
          "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/settings" as const,
      },
    },
  },

  projects: {
    list: "/$companySlug/projects" as const,
    layout: "/$companySlug/projects/$key" as const,
    board: "/$companySlug/projects/$key/board" as const,
    calendar: "/$companySlug/projects/$key/calendar" as const,
    timesheet: "/$companySlug/projects/$key/timesheet" as const,
    settings: "/$companySlug/projects/$key/settings" as const,
  },

  issues: {
    detail: "/$companySlug/issues/$key" as const,
  },

  settings: {
    profile: "/$companySlug/settings/profile" as const,
  },

  timeTracking: "/$companySlug/time-tracking" as const,
} as const;
