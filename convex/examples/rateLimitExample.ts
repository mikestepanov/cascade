/**
 * Example: Using Rate Limiter with AI Chat
 *
 * Add rate limiting to protect expensive AI endpoints
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { rateLimit } from "./rateLimits";

/**
 * Rate-limited AI chat
 */
export const chatWithRateLimit = action({
  args: {
    chatId: v.optional(v.id("aiChats")),
    projectId: v.optional(v.id("projects")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Rate limit: 10 messages per minute
    await rateLimit(ctx, {
      name: "aiChat",
      key: userId.subject, // Rate limit per user
      throws: true, // Throw error if limit exceeded
    });

    // Now call the actual AI chat function
    // (Your existing ai.chat implementation)
    // ...

    return { success: true };
  },
});
