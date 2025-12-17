/**
 * Centralized URL route constants
 *
 * Usage:
 *   import { ROUTES } from "@/config/routes";
 *   navigate({ to: ROUTES.dashboard(companySlug) });
 *   <Link to={ROUTES.projects.board(companySlug, projectKey)}>Board</Link>
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

  projects: {
    /** Workspaces list: /:slug/projects */
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
