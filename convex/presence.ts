import { getAuthUserId } from "@convex-dev/auth/server";
import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";

import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { batchFetchUsers } from "./lib/batchHelpers";
import { unauthenticated } from "./lib/errors";

// Type assertion for component - unavoidable without running dev server
// Two-step cast ensures type safety: unknown → ConstructorParameters<typeof Presence>[0]
export const presence = new Presence(
  components.presence as unknown as ConstructorParameters<typeof Presence>[0],
);

export const getUserId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
    userId: v.optional(v.string()), // Accepted but validated via auth
  },
  handler: async (ctx, { roomId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw unauthenticated();
    }
    return await presence.heartbeat(ctx, roomId, authUserId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const presenceList = await presence.list(ctx, roomToken);

    // Batch fetch users to avoid N+1 queries
    const userIds = presenceList.map((entry) => entry.userId as Id<"users">);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    return presenceList.map((entry) => {
      const user = userMap.get(entry.userId as Id<"users">);
      return {
        ...entry,
        name: user?.name,
        image: user?.image,
        email: user?.email,
      };
    });
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
