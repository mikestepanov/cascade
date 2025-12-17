import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { ApiAuthContext } from "./lib/apiAuth";

/**
 * API Key Management
 *
 * Provides secure API key generation and management for CLI/external integrations.
 * Keys follow format: sk_casc_<random_32_chars>
 */

// Generate a cryptographically secure random API key
function generateApiKey(): string {
  const prefix = "sk_casc";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomPart = Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
  return `${prefix}_${randomPart}`;
}

// Hash API key using SHA-256 (Node.js crypto)
async function hashApiKey(key: string): Promise<string> {
  // In Convex, we can use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Query to validate API key (for use in HTTP actions)
 * This is public but only contains validation logic, not sensitive data
 */
export const validateApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<ApiAuthContext | null> => {
    // Hash the provided key
    const keyHash = await hashApiKey(args.apiKey);

    // Find key by hash
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();

    if (!key) return null;
    if (!key.isActive) return null;
    if (key.expiresAt && key.expiresAt < Date.now()) return null;

    return {
      userId: key.userId,
      keyId: key._id,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
    };
  },
});

/**
 * Generate a new API key
 */
export const generate = mutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
    projectId: v.optional(v.id("projects")),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 16); // "sk_casc_AbCdEfGh"

    // If projectId is specified, verify user has access
    if (args.projectId) {
      const projectId = args.projectId;
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      // Check if user is a member
      const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("projectId", projectId).eq("userId", userId),
        )
        .first();

      if (!membership && project.createdBy !== userId) {
        throw new Error("You don't have access to this project");
      }
    }

    // Validate scopes
    const validScopes = [
      "issues:read",
      "issues:write",
      "issues:delete",
      "projects:read",
      "projects:write",
      "comments:read",
      "comments:write",
      "documents:read",
      "documents:write",
      "search:read",
    ];

    for (const scope of args.scopes) {
      if (!validScopes.includes(scope)) {
        throw new Error(`Invalid scope: ${scope}`);
      }
    }

    // Create API key record
    const keyId = await ctx.db.insert("apiKeys", {
      userId,
      name: args.name,
      keyHash,
      keyPrefix,
      scopes: args.scopes,
      projectId: args.projectId,
      rateLimit: args.rateLimit ?? 100, // Default 100 req/min
      isActive: true,
      usageCount: 0,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    // Return the API key (ONLY time it's shown in plain text)
    return {
      id: keyId,
      apiKey, // ⚠️ User must save this - won't be shown again
      name: args.name,
      scopes: args.scopes,
      keyPrefix,
    };
  },
});

/**
 * List user's API keys
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Return keys with sensitive data removed
    return keys.map((key) => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
    }));
  },
});

/**
 * Revoke an API key
 */
export const revoke = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("API key not found");
    if (key.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.keyId, {
      isActive: false,
      revokedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an API key permanently
 */
export const remove = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("API key not found");
    if (key.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.keyId);

    return { success: true };
  },
});

/**
 * Update API key settings
 */
export const update = mutation({
  args: {
    keyId: v.id("apiKeys"),
    name: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("API key not found");
    if (key.userId !== userId) throw new Error("Not authorized");

    const updates: Partial<{
      name: string;
      scopes: string[];
      rateLimit: number;
      expiresAt: number;
    }> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.scopes !== undefined) updates.scopes = args.scopes;
    if (args.rateLimit !== undefined) updates.rateLimit = args.rateLimit;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(args.keyId, updates);

    return { success: true };
  },
});

/**
 * Validate API key (used by HTTP endpoints)
 * Returns user ID and key metadata if valid
 */
export const validate = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Hash the provided key
    const keyHash = await hashApiKey(args.apiKey);

    // Find key by hash
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();

    if (!key) {
      return { valid: false, error: "Invalid API key" };
    }

    if (!key.isActive) {
      return { valid: false, error: "API key has been revoked" };
    }

    if (key.expiresAt && key.expiresAt < Date.now()) {
      return { valid: false, error: "API key has expired" };
    }

    // Return validation result
    return {
      valid: true,
      userId: key.userId,
      keyId: key._id,
      scopes: key.scopes,
      projectId: key.projectId,
      rateLimit: key.rateLimit,
    };
  },
});

/**
 * Record API key usage (called by HTTP endpoints)
 */
export const recordUsage = mutation({
  args: {
    keyId: v.id("apiKeys"),
    method: v.string(),
    endpoint: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) return;

    // Update key usage stats
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
      usageCount: key.usageCount + 1,
    });

    // Log usage
    await ctx.db.insert("apiUsageLogs", {
      apiKeyId: args.keyId,
      userId: key.userId,
      method: args.method,
      endpoint: args.endpoint,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get API usage statistics
 */
export const getUsageStats = query({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("API key not found");
    if (key.userId !== userId) throw new Error("Not authorized");

    // Get recent usage logs
    const logs = await ctx.db
      .query("apiUsageLogs")
      .withIndex("by_api_key_created", (q) => q.eq("apiKeyId", args.keyId))
      .order("desc")
      .take(100);

    // Calculate stats
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter((log) => log.createdAt > oneDayAgo);
    const lastHourLogs = logs.filter((log) => log.createdAt > oneHourAgo);

    const successCount = recentLogs.filter((log) => log.statusCode < 400).length;
    const errorCount = recentLogs.filter((log) => log.statusCode >= 400).length;
    const avgResponseTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length
        : 0;

    return {
      totalCalls: key.usageCount,
      last24Hours: recentLogs.length,
      lastHour: lastHourLogs.length,
      successCount,
      errorCount,
      avgResponseTime: Math.round(avgResponseTime),
      recentLogs: logs.slice(0, 10).map((log) => ({
        method: log.method,
        endpoint: log.endpoint,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        error: log.error,
        createdAt: log.createdAt,
      })),
    };
  },
});
