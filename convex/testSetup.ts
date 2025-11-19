/**
 * Test setup file for Convex backend tests
 *
 * This file exports all backend modules so they can be used with convex-test.
 * When using convexTest(), pass this modules object to make your functions available in tests.
 *
 * Usage:
 * ```typescript
 * import { convexTest } from "convex-test";
 * import { modules } from "./testSetup";
 * import schema from "./schema";
 *
 * const t = convexTest(schema, modules);
 * ```
 */

export const modules = {
  analytics: () => import("./analytics"),
  attachments: () => import("./attachments"),
  auth: () => import("./auth"),
  automationRules: () => import("./automationRules"),
  customFields: () => import("./customFields"),
  dashboard: () => import("./dashboard"),
  documents: () => import("./documents"),
  files: () => import("./files"),
  issueLinks: () => import("./issueLinks"),
  issues: () => import("./issues"),
  labels: () => import("./labels"),
  notifications: () => import("./notifications"),
  presence: () => import("./presence"),
  projects: () => import("./projects"),
  projectTemplates: () => import("./projectTemplates"),
  prosemirror: () => import("./prosemirror"),
  savedFilters: () => import("./savedFilters"),
  sprints: () => import("./sprints"),
  templates: () => import("./templates"),
  timeTracking: () => import("./timeTracking"),
  users: () => import("./users"),
  watchers: () => import("./watchers"),
  webhooks: () => import("./webhooks"),
};
