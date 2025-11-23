/// <reference types="node" />

/**
 * AI Provider Configuration
 * Supports: Anthropic Claude, OpenAI, and custom providers
 */

export type AIProvider = "anthropic" | "openai" | "custom";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS = {
  anthropic: "claude-3-5-sonnet-20241022",
  openai: "gpt-4-turbo-preview",
  custom: "custom-model",
} as const;

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): AIConfig {
  // Check for Anthropic API key first
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODELS.anthropic,
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  // Check for OpenAI API key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || DEFAULT_MODELS.openai,
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  // Check for custom provider
  const customKey = process.env.CUSTOM_AI_API_KEY;
  const customEndpoint = process.env.CUSTOM_AI_ENDPOINT;
  if (customKey && customEndpoint) {
    return {
      provider: "custom",
      apiKey: customKey,
      model: process.env.CUSTOM_AI_MODEL || DEFAULT_MODELS.custom,
      temperature: 0.7,
      maxTokens: 4096,
    };
  }

  throw new Error(
    "No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or CUSTOM_AI_API_KEY in environment variables.",
  );
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  try {
    getAIConfig();
    return true;
  } catch {
    return false;
  }
}
