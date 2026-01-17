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
  orgSlug: "/$orgSlug" as const,
  dashboard: "/$orgSlug/dashboard" as const,

  documents: {
    list: "/$orgSlug/documents" as const,
    detail: "/$orgSlug/documents/$id" as const,
    templates: "/$orgSlug/documents/templates" as const,
  },

  workspaces: {
    list: "/$orgSlug/workspaces" as const,
    detail: "/$orgSlug/workspaces/$workspaceSlug" as const,
    layout: "/$orgSlug/workspaces/$workspaceSlug" as const,
    board: "/$orgSlug/workspaces/$workspaceSlug/board" as const,
    wiki: "/$orgSlug/workspaces/$workspaceSlug/wiki" as const,
    settings: "/$orgSlug/workspaces/$workspaceSlug/settings" as const,

    teams: {
      list: "/$orgSlug/workspaces/$workspaceSlug/teams" as const,
      detail: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      layout: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      board: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/board" as const,
      backlog: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog" as const,
      wiki: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki" as const,
      calendar: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar" as const,
      settings: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings" as const,

      projects: {
        list: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects" as const,
        layout: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key" as const,
        board: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/board" as const,
        calendar:
          "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/calendar" as const,
        timesheet:
          "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/timesheet" as const,
        wiki: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/wiki" as const,
        settings:
          "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/settings" as const,
      },
    },
  },

  projects: {
    list: "/$orgSlug/projects" as const,
    layout: "/$orgSlug/projects/$key" as const,
    board: "/$orgSlug/projects/$key/board" as const,
    calendar: "/$orgSlug/projects/$key/calendar" as const,
    timesheet: "/$orgSlug/projects/$key/timesheet" as const,
    settings: "/$orgSlug/projects/$key/settings" as const,
  },

  issues: {
    detail: "/$orgSlug/issues/$key" as const,
  },

  settings: {
    profile: "/$orgSlug/settings/profile" as const,
  },

  timeTracking: "/$orgSlug/time-tracking" as const,
} as const;
