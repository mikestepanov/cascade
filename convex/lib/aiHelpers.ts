/**
 * AI SDK Type Helpers
 *
 * Provides type-safe utilities for working with AI SDK responses
 */

import type { LanguageModelUsage } from "ai";

/**
 * Safely extract usage information from AI SDK response
 *
 * AI SDK v5 uses inputTokens/outputTokens (not promptTokens/completionTokens).
 * This helper provides type-safe access with fallback to estimation.
 */
export function extractUsage(usage: LanguageModelUsage | undefined): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  if (!usage) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  // AI SDK v5 has totalTokens, inputTokens, outputTokens (all optional)
  const totalTokens = usage.totalTokens ?? 0;

  // inputTokens and outputTokens may not be present in all providers
  // Fall back to estimation: 70% input, 30% output (typical distribution)
  const promptTokens = usage.inputTokens ?? Math.floor(totalTokens * 0.7);
  const completionTokens = usage.outputTokens ?? Math.floor(totalTokens * 0.3);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

/**
 * Get total token count from AI SDK response
 */
export function getTotalTokens(usage: LanguageModelUsage | undefined): number {
  return usage?.totalTokens ?? 0;
}
