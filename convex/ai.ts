// @ts-nocheck - Circular type inference through internal wrappers
/**
 * AI Integration with Anthropic Claude
 *
 * Provides AI-powered features:
 * - Project assistant (chat)
 * - Semantic issue search (vector embeddings)
 * - AI suggestions (descriptions, priorities, labels)
 *
 * Note: Type checking disabled due to Convex framework limitation.
 * Even with internal functions extracted to convex/internal/ai.ts, TypeScript
 * infers circular types through the wrapper functions. This is unavoidable
 * without removing backward-compatible wrappers entirely.
 *
 * The code uses type-safe helpers (extractUsage) to maintain type safety.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { extractUsage } from "./lib/aiHelpers";
import { rateLimit } from "./rateLimits";

// Claude models (using aliases - auto-point to latest snapshot)
const CLAUDE_OPUS = "claude-opus-4-5";
const _CLAUDE_HAIKU = "claude-haiku-4-5";

/**
 * Generate embedding for text using Voyage AI (Anthropic recommended)
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.internal.ai.generateEmbedding, args);
  },
});

/**
 * Generate and store embedding for an issue
 * Called automatically when issue is created/updated
 */
export const generateIssueEmbedding = internalAction({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.runQuery(internal.internal.ai.getIssueData, {
      issueId: args.issueId,
    });

    if (!issue) {
      throw new Error("Issue not found");
    }

    // Combine title and description for embedding
    const text = `${issue.title}\n\n${issue.description || ""}`.trim();

    // Generate embedding
    const embedding = await ctx.runAction(internal.internal.ai.generateEmbedding, {
      text,
    });

    // Store embedding
    await ctx.runMutation(internal.internal.ai.storeIssueEmbedding, {
      issueId: args.issueId,
      embedding,
    });

    return embedding;
  },
});

/**
 * Internal query to get issue data for embedding
 */
export const getIssueForEmbedding = internalAction({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.internal.ai.getIssueData, { issueId: args.issueId });
  },
});

/**
 * Internal query to fetch issue (kept for backward compatibility)
 */
export const getIssueData = internalAction({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.internal.ai.getIssueData, args);
  },
});

/**
 * Store embedding in issue document (kept for backward compatibility)
 */
export const storeIssueEmbedding = internalAction({
  args: {
    issueId: v.id("issues"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.internal.ai.storeIssueEmbedding, args);
  },
});

/**
 * AI Chat - Send message and get AI response
 * Uses Claude Opus 4.5 for high-quality responses
 */
export const chat = action({
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

    // Rate limit: 10 messages per minute per user
    await rateLimit(ctx, "aiChat", {
      key: userId.subject,
      throws: true,
    });

    // Create or get chat
    let chatId = args.chatId;
    if (!chatId) {
      chatId = await ctx.runMutation(internal.internal.ai.createChat, {
        userId: userId.subject,
        projectId: args.projectId,
        title: args.message.slice(0, 100), // First 100 chars as title
      });
    }

    // Store user message
    await ctx.runMutation(internal.internal.ai.addMessage, {
      chatId,
      role: "user",
      content: args.message,
    });

    // Get project context if available
    let context = "";
    if (args.projectId) {
      context = await ctx.runQuery(internal.internal.ai.getProjectContext, {
        projectId: args.projectId,
      });
    }

    // Generate AI response using Claude Opus 4.5
    const systemPrompt = `You are a helpful project management assistant for Nixelo, a collaborative project management platform.

${context ? `Project Context:\n${context}\n\n` : ""}

Help users with:
- Understanding their projects and issues
- Finding information quickly
- Suggesting improvements
- Answering questions about project status

Be concise, helpful, and professional.`;

    const response = await generateText({
      model: anthropic(CLAUDE_OPUS),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.message },
      ],
    });

    // Extract usage information type-safely
    const usage = extractUsage(response.usage);

    // Store AI response
    await ctx.runMutation(internal.internal.ai.addMessage, {
      chatId,
      role: "assistant",
      content: response.text,
      modelUsed: CLAUDE_OPUS,
      tokensUsed: usage.totalTokens,
    });

    // Track usage
    await ctx.runMutation(internal.internal.ai.trackUsage, {
      userId: userId.subject,
      projectId: args.projectId,
      provider: "anthropic",
      model: CLAUDE_OPUS,
      operation: "chat",
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      success: true,
    });

    return {
      chatId,
      message: response.text,
    };
  },
});

// Re-export internal functions for backward compatibility
export const createChat = internalAction({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.internal.ai.createChat, args);
  },
});

export const addMessage = internalAction({
  args: {
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.internal.ai.addMessage, args);
  },
});

export const getProjectContext = internalAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.internal.ai.getProjectContext, args);
  },
});

export const trackUsage = internalAction({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    provider: v.literal("anthropic"),
    model: v.string(),
    operation: v.union(
      v.literal("chat"),
      v.literal("suggestion"),
      v.literal("automation"),
      v.literal("analysis"),
    ),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.internal.ai.trackUsage, args);
  },
});
