// @ts-nocheck - Example file requires component types from `npx convex dev`
"use node";

/**
 * Example: Using Action Cache for AI Suggestions
 *
 * Cache expensive AI calls to save money and improve speed
 */

import { openai } from "@ai-sdk/openai";
import { ActionCache } from "@convex-dev/action-cache";
import { generateText } from "ai";
import { v } from "convex/values";
import { components } from "../_generated/api";

// Initialize action cache
const cache = new ActionCache(components.actionCache, {
  action: async (text: string) => {
    // Expensive AI call
    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: text,
    });
    return response.text;
  },
});

/**
 * Cached AI suggestion - saves money on repeated queries
 */
export const cachedSuggestion = cache.wrapAction({
  args: {
    title: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Cache key: combination of title + type
    const cacheKey = `${args.type}:${args.title}`;

    // This will use cached result if available
    const prompt = `Generate description for ${args.type}: ${args.title}`;

    return await cache.fetch(ctx, {
      key: cacheKey,
      action: prompt,
      ttl: 3600000, // Cache for 1 hour
    });
  },
});

/**
 * Benefits:
 * - Same request within 1 hour = instant response + $0
 * - Saves ~$0.001-$0.005 per cached request
 * - Much faster (0ms vs 1-2s)
 */
