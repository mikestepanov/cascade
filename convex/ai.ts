/**
 * AI Integration with OpenAI
 *
 * Provides AI-powered features:
 * - Project assistant (chat)
 * - Semantic issue search (vector embeddings)
 * - AI suggestions (descriptions, priorities, labels)
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { rateLimit } from "./rateLimits";

/**
 * Generate embedding for text using OpenAI
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    // Use OpenAI's text-embedding-3-small model (1536 dimensions)
    const model = openai.embedding("text-embedding-3-small");

    const { embeddings } = await model.doEmbed({
      values: [args.text],
    });

    return embeddings[0]; // Return first (and only) embedding
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
    const issue = await ctx.runQuery(internal.ai.getIssueForEmbedding, {
      issueId: args.issueId,
    });

    if (!issue) {
      throw new Error("Issue not found");
    }

    // Combine title and description for embedding
    const text = `${issue.title}\n\n${issue.description || ""}`.trim();

    // Generate embedding
    const embedding = await ctx.runAction(internal.ai.generateEmbedding, {
      text,
    });

    // Store embedding
    await ctx.runMutation(internal.ai.storeIssueEmbedding, {
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
    return await ctx.runQuery(internal.ai.getIssueData, { issueId: args.issueId });
  },
});

/**
 * Internal query to fetch issue
 */
export const getIssueData = internalQuery({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

/**
 * Store embedding in issue document
 */
export const storeIssueEmbedding = internalMutation({
  args: {
    issueId: v.id("issues"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, {
      embedding: args.embedding,
    });
  },
});

/**
 * AI Chat - Send message and get AI response
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
      chatId = await ctx.runMutation(internal.ai.createChat, {
        userId: userId.subject,
        projectId: args.projectId,
        title: args.message.slice(0, 100), // First 100 chars as title
      });
    }

    // Store user message
    await ctx.runMutation(internal.ai.addMessage, {
      chatId,
      role: "user",
      content: args.message,
    });

    // Get project context if available
    let context = "";
    if (args.projectId) {
      context = await ctx.runQuery(internal.ai.getProjectContext, {
        projectId: args.projectId,
      });
    }

    // Generate AI response
    const systemPrompt = `You are a helpful project management assistant for Cascade, a collaborative project management platform.

${context ? `Project Context:\n${context}\n\n` : ""}

Help users with:
- Understanding their projects and issues
- Finding information quickly
- Suggesting improvements
- Answering questions about project status

Be concise, helpful, and professional.`;

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.message },
      ],
    });

    // Store AI response
    await ctx.runMutation(internal.ai.addMessage, {
      chatId,
      role: "assistant",
      content: response.text,
      modelUsed: "gpt-4o-mini",
      // biome-ignore lint/suspicious/noExplicitAny: AI SDK usage types are provider-specific
      tokensUsed: (response.usage as any)?.totalTokens,
    });

    // Track usage
    await ctx.runMutation(internal.ai.trackUsage, {
      userId: userId.subject,
      projectId: args.projectId,
      provider: "openai",
      model: "gpt-4o-mini",
      operation: "chat",
      // Use actual token counts if available, otherwise estimate from totalTokens
      // Note: AI SDK v4 usage types may vary by provider
      // biome-ignore lint/suspicious/noExplicitAny: AI SDK usage types are provider-specific
      promptTokens:
        (response.usage as any)?.promptTokens ??
        Math.floor(((response.usage as any)?.totalTokens ?? 0) * 0.7),
      // biome-ignore lint/suspicious/noExplicitAny: AI SDK usage types are provider-specific
      completionTokens:
        (response.usage as any)?.completionTokens ??
        Math.floor(((response.usage as any)?.totalTokens ?? 0) * 0.3),
      // biome-ignore lint/suspicious/noExplicitAny: AI SDK usage types are provider-specific
      totalTokens: (response.usage as any)?.totalTokens ?? 0,
      success: true,
    });

    return {
      chatId,
      message: response.text,
    };
  },
});

/**
 * Create new AI chat
 */
export const createChat = internalMutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by subject ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("aiChats", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Add message to chat
 */
export const addMessage = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      modelUsed: args.modelUsed,
      tokensUsed: args.tokensUsed,
      createdAt: Date.now(),
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get project context for AI
 */
export const getProjectContext = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return "";

    // Get active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Get issues summary
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(100); // Limit for context

    const issuesByStatus = issues.reduce(
      (acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return `
Project: ${project.name} (${project.key})
Description: ${project.description || "No description"}
Active Sprint: ${activeSprint ? activeSprint.name : "None"}
Total Issues: ${issues.length}
Issues by Status: ${Object.entries(issuesByStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ")}
    `.trim();
  },
});

/**
 * Track AI usage
 */
export const trackUsage = internalMutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    provider: v.union(v.literal("anthropic"), v.literal("openai"), v.literal("custom")),
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
    // Find user by subject ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("aiUsage", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      provider: args.provider,
      model: args.model,
      operation: args.operation,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      totalTokens: args.totalTokens,
      responseTime: 0, // TODO: Calculate actual response time
      success: args.success,
      createdAt: Date.now(),
    });
  },
});
