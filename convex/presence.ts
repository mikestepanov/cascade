import { getAuthUserId } from "@convex-dev/auth/server";
import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
// @ts-expect-error - components export requires running `npx convex dev` to generate types
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Type assertion for component - unavoidable without running dev server
// Using 'unknown' first makes this a safe two-step cast instead of direct 'any'
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
  },
  handler: async (ctx, { roomId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    return await presence.heartbeat(ctx, roomId, authUserId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const presenceList = await presence.list(ctx, roomToken);
    const listWithUserInfo = await Promise.all(
      presenceList.map(async (entry) => {
        const user = await ctx.db.get(entry.userId as Id<"users">);
        if (!user) {
          return entry;
        }
        return {
          ...entry,
          name: user?.name,
          image: user?.image,
          email: user?.email,
        };
      }),
    );
    return listWithUserInfo;
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
