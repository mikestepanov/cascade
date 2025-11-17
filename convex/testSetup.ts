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

import analytics from "./analytics";
import attachments from "./attachments";
import auth from "./auth";
import automationRules from "./automationRules";
import customFields from "./customFields";
import dashboard from "./dashboard";
import documents from "./documents";
import files from "./files";
import issueLinks from "./issueLinks";
import issues from "./issues";
import labels from "./labels";
import notifications from "./notifications";
import presence from "./presence";
import projects from "./projects";
import projectTemplates from "./projectTemplates";
import prosemirror from "./prosemirror";
import savedFilters from "./savedFilters";
import sprints from "./sprints";
import templates from "./templates";
import timeEntries from "./timeEntries";
import users from "./users";
import watchers from "./watchers";
import webhooks from "./webhooks";

export const modules = {
  analytics,
  attachments,
  auth,
  automationRules,
  customFields,
  dashboard,
  documents,
  files,
  issues,
  issueLinks,
  labels,
  notifications,
  presence,
  projects,
  projectTemplates,
  prosemirror,
  savedFilters,
  sprints,
  templates,
  timeEntries,
  users,
  watchers,
  webhooks,
};
