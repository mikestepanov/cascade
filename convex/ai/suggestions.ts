/**
 * AI-Powered Suggestions
 *
 * Generate intelligent suggestions for issues, sprints, and projects
 */

import { openai } from "@ai-sdk/openai";
import { ActionCache } from "@convex-dev/action-cache";
import { generateText } from "ai";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, mutation, query } from "../_generated/server";
import { rateLimit } from "../rateLimits";

/**
 * Action cache for AI suggestions
 * Caches expensive AI calls to save money and improve speed
 */
const descriptionCache = new ActionCache(components.actionCache, {
  action: async (prompt: string) => {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });
    return response.text;
  },
});

const priorityCache = new ActionCache(components.actionCache, {
  action: async (prompt: string) => {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });
    return response.text;
  },
});

const labelsCache = new ActionCache(components.actionCache, {
  action: async (prompt: string) => {
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });
    return response.text;
  },
});

/**
 * Generate AI suggestion for issue description
 */
export const suggestIssueDescription = action({
  args: {
    title: v.string(),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, {
      name: "aiSuggestion",
      key: userId.subject,
      throws: true,
    });

    // Get project context
    const project = await ctx.runQuery(internal.ai.getProjectContext, {
      projectId: args.projectId,
    });

    const prompt = `Generate a clear, concise issue description for the following ${args.type}:

Title: ${args.title}

Project Context:
${project}

Requirements:
- Write 2-3 sentences
- Include acceptance criteria if applicable
- Be specific and actionable
- Use professional project management language

Description:`;

    // Use cache with 1 hour TTL - same title + type = cached result
    const cacheKey = `desc:${args.type}:${args.title}`;
    const suggestion = await descriptionCache.fetch(ctx, {
      key: cacheKey,
      action: prompt,
      ttl: 3600000, // 1 hour
    });

    // Store suggestion
    await ctx.runMutation(internal.ai.storeSuggestion, {
      userId: userId.subject,
      projectId: args.projectId,
      suggestionType: "issue_description",
      targetId: args.title,
      suggestion,
      modelUsed: "gpt-4o-mini",
    });

    return suggestion;
  },
});

/**
 * Suggest priority based on issue details
 */
export const suggestPriority = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, {
      name: "aiSuggestion",
      key: userId.subject,
      throws: true,
    });

    const prompt = `Analyze this issue and suggest a priority (highest, high, medium, low, lowest):

Type: ${args.type}
Title: ${args.title}
Description: ${args.description || "No description"}

Consider:
- Urgency and impact
- Issue type (bugs are typically higher priority)
- Business value
- Dependencies

Respond with ONLY ONE of these words: highest, high, medium, low, lowest

Priority:`;

    // Use cache with 1 hour TTL
    const cacheKey = `priority:${args.type}:${args.title}:${args.description || ""}`;
    const response = await priorityCache.fetch(ctx, {
      key: cacheKey,
      action: prompt,
      ttl: 3600000, // 1 hour
    });

    const priority = response.trim().toLowerCase();

    // Validate priority
    const validPriorities = ["highest", "high", "medium", "low", "lowest"];
    const suggestedPriority = validPriorities.includes(priority) ? priority : "medium";

    // Store suggestion
    await ctx.runMutation(internal.ai.storeSuggestion, {
      userId: userId.subject,
      projectId: args.projectId,
      suggestionType: "issue_priority",
      targetId: args.title,
      suggestion: suggestedPriority,
      modelUsed: "gpt-4o-mini",
    });

    return suggestedPriority as "highest" | "high" | "medium" | "low" | "lowest";
  },
});

/**
 * Suggest labels for an issue
 */
export const suggestLabels = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Rate limit: 20 suggestions per hour per user
    await rateLimit(ctx, {
      name: "aiSuggestion",
      key: userId.subject,
      throws: true,
    });

    // Get existing project labels
    const existingLabels = await ctx.runQuery(internal.ai.getProjectLabels, {
      projectId: args.projectId,
    });

    const prompt = `Suggest 2-4 relevant labels for this issue:

Type: ${args.type}
Title: ${args.title}
Description: ${args.description || "No description"}

${existingLabels.length > 0 ? `Existing project labels: ${existingLabels.join(", ")}` : ""}

Guidelines:
- Prefer existing labels when applicable
- Suggest new labels only if needed
- Labels should be lowercase, kebab-case (e.g., "bug-fix", "frontend", "high-priority")
- Be specific but concise

Respond with a comma-separated list of labels only.

Labels:`;

    // Use cache with 1 hour TTL
    const cacheKey = `labels:${args.type}:${args.title}:${args.description || ""}`;
    const response = await labelsCache.fetch(ctx, {
      key: cacheKey,
      action: prompt,
      ttl: 3600000, // 1 hour
    });

    const suggestedLabels = response
      .split(",")
      .map((label) => label.trim().toLowerCase())
      .filter((label) => label.length > 0)
      .slice(0, 4);

    // Store suggestion
    await ctx.runMutation(internal.ai.storeSuggestion, {
      userId: userId.subject,
      projectId: args.projectId,
      suggestionType: "issue_labels",
      targetId: args.title,
      suggestion: suggestedLabels.join(", "),
      modelUsed: "gpt-4o-mini",
    });

    return suggestedLabels;
  },
});

/**
 * Get project labels
 */
export const getProjectLabels = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return labels.map((label) => label.name);
  },
});

/**
 * Store AI suggestion
 */
export const storeSuggestion = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    suggestionType: v.union(
      v.literal("issue_description"),
      v.literal("issue_priority"),
      v.literal("issue_labels"),
      v.literal("issue_assignee"),
      v.literal("sprint_planning"),
      v.literal("risk_detection"),
      v.literal("insight"),
    ),
    targetId: v.string(),
    suggestion: v.string(),
    modelUsed: v.string(),
    reasoning: v.optional(v.string()),
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

    await ctx.db.insert("aiSuggestions", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      suggestionType: args.suggestionType,
      targetId: args.targetId,
      suggestion: args.suggestion,
      reasoning: args.reasoning,
      modelUsed: args.modelUsed,
      createdAt: Date.now(),
    });
  },
});

/**
 * Accept or dismiss a suggestion
 */
export const respondToSuggestion = mutation({
  args: {
    suggestionId: v.id("aiSuggestions"),
    accepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.suggestionId, {
      accepted: args.accepted,
      dismissed: !args.accepted,
      respondedAt: Date.now(),
    });
  },
});
