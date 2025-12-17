/**
 * Centralized URL route constants
 *
 * NEW HIERARCHY (Option B):
 * Company → Workspaces (departments) → Teams → Projects → Issues
 *
 * Usage:
 *   import { ROUTES } from "@/config/routes";
 *   navigate({ to: ROUTES.dashboard(companySlug) });
 *   <Link to={ROUTES.workspaces.teams.projects.board(companySlug, workspaceSlug, teamSlug, projectKey)}>Board</Link>
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

  // ============================================
  // Auth routes (auth required, no company)
  // ============================================

  /** Onboarding page */
  onboarding: "/onboarding" as const,

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
  },

  // NEW HIERARCHY: Workspaces → Teams → Projects
  workspaces: {
    /** Workspaces list: /:slug/workspaces */
    list: (slug: string) => `/${slug}/workspaces` as const,
    
    /** Workspace home: /:slug/workspaces/:workspace */
    detail: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}` as const,
    
    /** Workspace board (future): /:slug/workspaces/:workspace/board */
    board: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/board` as const,
    
    /** Workspace wiki (future): /:slug/workspaces/:workspace/wiki */
    wiki: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/wiki` as const,
    
    /** Workspace settings: /:slug/workspaces/:workspace/settings */
    settings: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/settings` as const,

    teams: {
      /** Teams list: /:slug/workspaces/:workspace/teams */
      list: (slug: string, workspace: string) => `/${slug}/workspaces/${workspace}/teams` as const,
      
      /** Team home: /:slug/workspaces/:workspace/teams/:team */
      detail: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}` as const,
      
      /** Team board (future): /:slug/workspaces/:workspace/teams/:team/board */
      board: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/board` as const,
      
      /** Team backlog (future): /:slug/workspaces/:workspace/teams/:team/backlog */
      backlog: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/backlog` as const,
      
      /** Team wiki (future): /:slug/workspaces/:workspace/teams/:team/wiki */
      wiki: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/wiki` as const,
      
      /** Team calendar: /:slug/workspaces/:workspace/teams/:team/calendar */
      calendar: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/calendar` as const,
      
      /** Team settings: /:slug/workspaces/:workspace/teams/:team/settings */
      settings: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/settings` as const,

      projects: {
        /** Projects list: /:slug/workspaces/:workspace/teams/:team/projects */
        list: (slug: string, workspace: string, team: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects` as const,
        
        /** Project board: /:slug/workspaces/:workspace/teams/:team/projects/:key/board */
        board: (slug: string, workspace: string, team: string, key: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/board` as const,
        
        /** Project calendar: /:slug/workspaces/:workspace/teams/:team/projects/:key/calendar */
        calendar: (slug: string, workspace: string, team: string, key: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/calendar` as const,
        
        /** Project timesheet: /:slug/workspaces/:workspace/teams/:team/projects/:key/timesheet */
        timesheet: (slug: string, workspace: string, team: string, key: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/timesheet` as const,
        
        /** Project wiki (future): /:slug/workspaces/:workspace/teams/:team/projects/:key/wiki */
        wiki: (slug: string, workspace: string, team: string, key: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/wiki` as const,
        
        /** Project settings: /:slug/workspaces/:workspace/teams/:team/projects/:key/settings */
        settings: (slug: string, workspace: string, team: string, key: string) => `/${slug}/workspaces/${workspace}/teams/${team}/projects/${key}/settings` as const,
      },
    },
  },

  // LEGACY: Direct project access (for backward compatibility during migration)
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
  companySlug: "/$companySlug" as const,
  dashboard: "/_auth/_app/$companySlug/dashboard" as const,
  
  documents: {
    list: "/_auth/_app/$companySlug/documents/" as const,
    detail: "/_auth/_app/$companySlug/documents/$id" as const,
  },
  
  // NEW HIERARCHY: Workspaces → Teams → Projects
  workspaces: {
    list: "/_auth/_app/$companySlug/workspaces/" as const,
    detail: "/_auth/_app/$companySlug/workspaces/$workspaceSlug" as const,
    layout: "/_auth/_app/$companySlug/workspaces/$workspaceSlug" as const,
    board: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/board" as const,
    wiki: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/wiki" as const,
    settings: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/settings" as const,
    
    teams: {
      list: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/" as const,
      detail: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      layout: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug" as const,
      board: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/board" as const,
      backlog: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/backlog" as const,
      wiki: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki" as const,
      calendar: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar" as const,
      settings: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/settings" as const,
      
      projects: {
        list: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/" as const,
        layout: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key" as const,
        board: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/board" as const,
        calendar: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/calendar" as const,
        timesheet: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/timesheet" as const,
        wiki: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/wiki" as const,
        settings: "/_auth/_app/$companySlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/settings" as const,
      },
    },
  },
  
  // LEGACY: Direct project access (backward compatibility)
  projects: {
    list: "/_auth/_app/$companySlug/projects/" as const,
    layout: "/_auth/_app/$companySlug/projects/$key" as const,
    board: "/_auth/_app/$companySlug/projects/$key/board" as const,
    calendar: "/_auth/_app/$companySlug/projects/$key/calendar" as const,
    timesheet: "/_auth/_app/$companySlug/projects/$key/timesheet" as const,
    settings: "/_auth/_app/$companySlug/projects/$key/settings" as const,
  },
  
  issues: {
    detail: "/_auth/_app/$companySlug/issues/$key" as const,
  },
  
  settings: {
    profile: "/_auth/_app/$companySlug/settings/profile" as const,
  },
  
  timeTracking: "/_auth/_app/$companySlug/time-tracking" as const,
} as const;
