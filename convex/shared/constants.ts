/**
 * Reserved slugs that cannot be used as organization slugs
 * These are route paths in the application - GitHub-style validation
 */
export const RESERVED_SLUGS = [
  // App routes
  "dashboard",
  "documents",
  "projects",
  "issues",
  "settings",
  "time-tracking",
  "timetracking",
  // Auth routes
  "onboarding",
  "invite",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "signout",
  // System routes
  "api",
  "admin",
  "app",
  "auth",
  "oauth",
  "callback",
  "webhooks",
  "health",
  "status",
  // Reserved terms
  "www",
  "mail",
  "email",
  "support",
  "help",
  "about",
  "contact",
  "legal",
  "privacy",
  "terms",
  "blog",
  "docs",
  "pricing",
  "enterprise",
] as const;

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as (typeof RESERVED_SLUGS)[number]);
}
