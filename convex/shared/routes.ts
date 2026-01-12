/**
 * Centralized URL route constants for the entire repo.
 * Accessible by both the Convex backend and the React frontend.
 */

export const ROUTES = {
  // ============================================
  // Public routes (no auth required)
  // ============================================

  /** Home/Landing page */
  home: "/" as const,

  /** Sign in page */
  signin: "/signin" as const,

  /** Sign up page */
  signup: "/signup" as const,

  /** Forgot password page */
  forgotPassword: "/forgot-password" as const,

  /** Invite acceptance page */
  invite: (token: string) => `/invite/${token}` as const,

  /** Terms & Conditions page */
  terms: "/terms" as const,

  /** Privacy Policy page */
  privacy: "/privacy" as const,

  // ============================================
  // Auth routes (auth required, no company)
  // ============================================

  /** Onboarding page */
  onboarding: "/onboarding" as const,

  /** Gateway page */
  app: "/app" as const,

  // ============================================
  // App routes (auth + company required)
  // ============================================

  /** Dashboard: /:slug/dashboard */
  dashboard: (slug: string) => `/${slug}/dashboard` as const,

  documents: {
    /** Documents list: /:slug/documents */
    list: (slug: string) => `/${slug}/documents` as const,
    /** Document detail: /:slug/documents/:id */
    detail: (slug: string, id: string) => `/${slug}/documents/${id}` as const,
    /** Document templates: /:slug/documents/templates */
    templates: (slug: string) => `/${slug}/documents/templates` as const,
  },

  // NEW HIERARCHY: Workspaces → Teams → Projects
  workspaces: {
    /** Workspaces list: /:slug/workspaces */
    list: (slug: string) => `/${slug}/workspaces` as const,

    /** Workspace home: /:slug/workspaces/:workspace */
    detail: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}` as const,

    /** Workspace board: /:slug/workspaces/:workspace/board */
    board: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/board` as const,

    /** Workspace wiki: /:slug/workspaces/:workspace/wiki */
    wiki: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/wiki` as const,

    /** Workspace settings: /:slug/workspaces/:workspace/settings */
    settings: (slug: string, workspace: string) =>
      `/${slug}/workspaces/${workspace}/settings` as const,

    teams: {
      /** Teams list: /:slug/workspaces/:workspace/teams */
      list: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/teams` as const,

      /** Team home: /:slug/workspaces/:workspace/teams/:team */
      detail: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}` as const,

      /** Team board: /:slug/workspaces/:workspace/teams/:team/board */
      board: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}/board` as const,

      /** Team backlog: /:slug/workspaces/:workspace/teams/:team/backlog */
      backlog: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}/backlog` as const,

      /** Team wiki: /:slug/workspaces/:workspace/teams/:team/wiki */
      wiki: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}/wiki` as const,

      /** Team calendar: /:slug/workspaces/:workspace/teams/:team/calendar */
      calendar: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}/calendar` as const,

      /** Team settings: /:slug/workspaces/:workspace/teams/:team/settings */
      settings: (slug: string, workspace: string, team: string) =>
        `/${slug}/workspaces/${workspace}/teams/${team}/settings` as const,

      projects: {
        /** Projects list: /:slug/workspaces/:workspace/teams/:team/projects */
        list: (slug: string, workspace: string, team: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects` as const,

        /** Project board: /:slug/workspaces/:workspace/teams/:team/projects/:key/board */
        board: (slug: string, workspace: string, team: string, key: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/board` as const,

        /** Project calendar: /:slug/workspaces/:workspace/teams/:team/projects/:key/calendar */
        calendar: (slug: string, workspace: string, team: string, key: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/calendar` as const,

        /** Project timesheet: /:slug/workspaces/:workspace/teams/:team/projects/:key/timesheet */
        timesheet: (slug: string, workspace: string, team: string, key: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/timesheet` as const,

        /** Project wiki: /:slug/workspaces/:workspace/teams/:team/projects/:key/wiki */
        wiki: (slug: string, workspace: string, team: string, key: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/wiki` as const,

        /** Project settings: /:slug/workspaces/:workspace/teams/:team/projects/:key/settings */
        settings: (slug: string, workspace: string, team: string, key: string) =>
          `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/settings` as const,
      },
    },
  },

  projects: {
    /** Projects list: /:slug/projects */
    list: (slug: string) => `/${slug}/projects` as const,
    /** Project board: /:slug/projects/:key/board */
    board: (slug: string, key: string) => `/${slug}/projects/${key}/board` as const,
    /** Project calendar: /:slug/projects/:key/calendar */
    calendar: (slug: string, key: string) => `/${slug}/projects/${key}/calendar` as const,
    /** Project timesheet: /:slug/projects/:key/timesheet */
    timesheet: (slug: string, key: string) => `/${slug}/projects/${key}/timesheet` as const,
    /** Project settings: /:slug/projects/:key/settings */
    settings: (slug: string, key: string) => `/${slug}/projects/${key}/settings` as const,
  },

  issues: {
    /** Issue detail: /:slug/issues/:key */
    detail: (slug: string, key: string) => `/${slug}/issues/${key}` as const,
  },

  settings: {
    /** Settings profile: /:slug/settings/profile */
    profile: (slug: string) => `/${slug}/settings/profile` as const,
  },

  /** Time tracking (admin): /:slug/time-tracking */
  timeTracking: (slug: string) => `/${slug}/time-tracking` as const,
} as const;

/**
 * Route path patterns for TanStack Router
 * Use these when defining routes with createFileRoute
 */
export const ROUTE_PATTERNS = {
  home: "/" as const,
  signin: "/signin" as const,
  signup: "/signup" as const,
  app: "/app" as const,
  companySlug: "/$companySlug" as const,
  dashboard: "/$companySlug/dashboard" as const,

  documents: {
    list: "/$companySlug/documents/" as const,
    detail: "/$companySlug/documents/$id" as const,
    templates: "/$companySlug/documents/templates" as const,
  },

  workspaces: {
    list: "/$companySlug/workspaces/" as const,
    detail: "/$companySlug/workspaces/$workspaceSlug" as const,
    layout: "/$companySlug/workspaces/$workspaceSlug" as const,
    board: "/$companySlug/workspaces/$workspaceSlug/board" as const,
    wiki: "/$companySlug/workspaces/$workspaceSlug/wiki" as const,
    settings: "/$companySlug/workspaces/$workspaceSlug/settings" as const,

    teams: {
      list: "/$companySlug/workspaces/$workspaceSlug/teams/" as const,
      detail: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      layout: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      board: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/board" as const,
      backlog: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog" as const,
      wiki: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki" as const,
      calendar: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar" as const,
      settings: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/settings" as const,

      projects: {
        list: "/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/" as const,
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
    list: "/$companySlug/projects/" as const,
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

/**
 * Route paths for navigation (excluding layout IDs)
 */
export const NAV_PATHS = {
  workspaces: {
    list: "/$companySlug/workspaces" as const,
  },
  projects: {
    board: "/$companySlug/projects/$key/board" as const,
  },
} as const;
