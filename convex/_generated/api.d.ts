/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai_actions from "../ai/actions.js";
import type * as ai_config from "../ai/config.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_providers from "../ai/providers.js";
import type * as ai_queries from "../ai/queries.js";
import type * as analytics from "../analytics.js";
import type * as api_issues from "../api/issues.js";
import type * as apiKeys from "../apiKeys.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as automationRules from "../automationRules.js";
import type * as availability from "../availability.js";
import type * as bookingPages from "../bookingPages.js";
import type * as bookings from "../bookings.js";
import type * as calendarEvents from "../calendarEvents.js";
import type * as calendarEventsAttendance from "../calendarEventsAttendance.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
import type * as dashboard from "../dashboard.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documentVersions from "../documentVersions.js";
import type * as documents from "../documents.js";
import type * as email_digests from "../email/digests.js";
import type * as email_helpers from "../email/helpers.js";
import type * as email_index from "../email/index.js";
import type * as email_notifications from "../email/notifications.js";
import type * as email_provider from "../email/provider.js";
import type * as email_resend from "../email/resend.js";
import type * as email_sendpulse from "../email/sendpulse.js";
import type * as export_ from "../export.js";
import type * as files from "../files.js";
import type * as github from "../github.js";
import type * as googleCalendar from "../googleCalendar.js";
import type * as hourCompliance from "../hourCompliance.js";
import type * as http_googleOAuth from "../http/googleOAuth.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as issueLinks from "../issueLinks.js";
import type * as issues from "../issues.js";
import type * as labels from "../labels.js";
import type * as lib_apiAuth from "../lib/apiAuth.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as offlineSync from "../offlineSync.js";
import type * as onboarding from "../onboarding.js";
import type * as presence from "../presence.js";
import type * as projectTemplates from "../projectTemplates.js";
import type * as projects from "../projects.js";
import type * as prosemirror from "../prosemirror.js";
import type * as pumble from "../pumble.js";
import type * as rbac from "../rbac.js";
import type * as router from "../router.js";
import type * as savedFilters from "../savedFilters.js";
import type * as sprints from "../sprints.js";
import type * as templates from "../templates.js";
import type * as test_utils from "../test-utils.js";
import type * as testSetup from "../testSetup.js";
import type * as timeTracking from "../timeTracking.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as watchers from "../watchers.js";
import type * as webhooks from "../webhooks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "ai/actions": typeof ai_actions;
  "ai/config": typeof ai_config;
  "ai/mutations": typeof ai_mutations;
  "ai/providers": typeof ai_providers;
  "ai/queries": typeof ai_queries;
  analytics: typeof analytics;
  "api/issues": typeof api_issues;
  apiKeys: typeof apiKeys;
  attachments: typeof attachments;
  auth: typeof auth;
  automationRules: typeof automationRules;
  availability: typeof availability;
  bookingPages: typeof bookingPages;
  bookings: typeof bookings;
  calendarEvents: typeof calendarEvents;
  calendarEventsAttendance: typeof calendarEventsAttendance;
  crons: typeof crons;
  customFields: typeof customFields;
  dashboard: typeof dashboard;
  documentTemplates: typeof documentTemplates;
  documentVersions: typeof documentVersions;
  documents: typeof documents;
  "email/digests": typeof email_digests;
  "email/helpers": typeof email_helpers;
  "email/index": typeof email_index;
  "email/notifications": typeof email_notifications;
  "email/provider": typeof email_provider;
  "email/resend": typeof email_resend;
  "email/sendpulse": typeof email_sendpulse;
  export: typeof export_;
  files: typeof files;
  github: typeof github;
  googleCalendar: typeof googleCalendar;
  hourCompliance: typeof hourCompliance;
  "http/googleOAuth": typeof http_googleOAuth;
  http: typeof http;
  invites: typeof invites;
  issueLinks: typeof issueLinks;
  issues: typeof issues;
  labels: typeof labels;
  "lib/apiAuth": typeof lib_apiAuth;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  offlineSync: typeof offlineSync;
  onboarding: typeof onboarding;
  presence: typeof presence;
  projectTemplates: typeof projectTemplates;
  projects: typeof projects;
  prosemirror: typeof prosemirror;
  pumble: typeof pumble;
  rbac: typeof rbac;
  router: typeof router;
  savedFilters: typeof savedFilters;
  sprints: typeof sprints;
  templates: typeof templates;
  "test-utils": typeof test_utils;
  testSetup: typeof testSetup;
  timeTracking: typeof timeTracking;
  unsubscribe: typeof unsubscribe;
  userProfiles: typeof userProfiles;
  users: typeof users;
  watchers: typeof watchers;
  webhooks: typeof webhooks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
