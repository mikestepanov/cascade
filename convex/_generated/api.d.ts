/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as automationRules from "../automationRules.js";
import type * as documents from "../documents.js";
import type * as email_digests from "../email/digests.js";
import type * as email_helpers from "../email/helpers.js";
import type * as email_notifications from "../email/notifications.js";
import type * as http from "../http.js";
import type * as issues from "../issues.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as projects from "../projects.js";
import type * as prosemirror from "../prosemirror.js";
import type * as router from "../router.js";
import type * as sprints from "../sprints.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  automationRules: typeof automationRules;
  documents: typeof documents;
  email: {
    digests: typeof email_digests;
    helpers: typeof email_helpers;
    notifications: typeof email_notifications;
  };
  http: typeof http;
  issues: typeof issues;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  presence: typeof presence;
  projects: typeof projects;
  prosemirror: typeof prosemirror;
  router: typeof router;
  sprints: typeof sprints;
  unsubscribe: typeof unsubscribe;
  users: typeof users;
  webhooks: typeof webhooks;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<typeof fullApiWithMounts, FunctionReference<any, "public">>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  prosemirrorSync: {
    lib: {
      deleteDocument: FunctionReference<"mutation", "internal", { id: string }, null>;
      deleteSnapshots: FunctionReference<
        "mutation",
        "internal",
        { afterVersion?: number; beforeVersion?: number; id: string },
        null
      >;
      deleteSteps: FunctionReference<
        "mutation",
        "internal",
        {
          afterVersion?: number;
          beforeTs: number;
          deleteNewerThanLatestSnapshot?: boolean;
          id: string;
        },
        null
      >;
      getSnapshot: FunctionReference<
        "query",
        "internal",
        { id: string; version?: number },
        { content: null } | { content: string; version: number }
      >;
      getSteps: FunctionReference<
        "query",
        "internal",
        { id: string; version: number },
        {
          clientIds: Array<string | number>;
          steps: Array<string>;
          version: number;
        }
      >;
      latestVersion: FunctionReference<"query", "internal", { id: string }, null | number>;
      submitSnapshot: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          id: string;
          pruneSnapshots?: boolean;
          version: number;
        },
        null
      >;
      submitSteps: FunctionReference<
        "mutation",
        "internal",
        {
          clientId: string | number;
          id: string;
          steps: Array<string>;
          version: number;
        },
        | {
            clientIds: Array<string | number>;
            status: "needs-rebase";
            steps: Array<string>;
          }
        | { status: "synced" }
      >;
    };
  };
  presence: {
    public: {
      disconnect: FunctionReference<"mutation", "internal", { sessionToken: string }, null>;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<"mutation", "internal", { roomId: string }, null>;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
    };
  };
};
