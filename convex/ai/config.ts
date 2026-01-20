/**
 * AI Provider Configuration
 * Uses Anthropic Claude exclusively
 */

import { validation } from "../lib/errors";
import { getAnthropicApiKey, getAnthropicModel, isAnthropicConfigured } from "../lib/env";

export type AIProvider = "anthropic";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Claude models (using aliases - auto-point to latest snapshot)
 */
export const CLAUDE_MODELS = {
  opus: "claude-opus-4-5",
  haiku: "claude-haiku-4-5",
} as const;

/**
 * Default model for each use case
 */
export const DEFAULT_MODELS = {
  chat: CLAUDE_MODELS.opus, // High quality for chat
  suggestions: CLAUDE_MODELS.haiku, // Fast/cheap for suggestions
  summary: CLAUDE_MODELS.opus, // High quality for meeting summaries
} as const;

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): AIConfig {
  const anthropicKey = getAnthropicApiKey();
  if (!anthropicKey) {
    throw validation(
      "ANTHROPIC_API_KEY",
      "ANTHROPIC_API_KEY not configured. Set ANTHROPIC_API_KEY in environment variables.",
    );
  }

  return {
    provider: "anthropic",
    apiKey: anthropicKey,
    model: getAnthropicModel(),
    temperature: 0.7,
    maxTokens: 4096,
  };
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return isAnthropicConfigured();
}
