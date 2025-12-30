import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Log an audit entry
 * Intended to be scheduled via ctx.scheduler.runAfter(0, internal.auditLogs.log, ...)
 */
export const log = internalMutation({
  args: {
    action: v.string(),
    actorId: v.optional(v.id("users")),
    targetId: v.string(),
    targetType: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      action: args.action,
      actorId: args.actorId,
      targetId: args.targetId,
      targetType: args.targetType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});
