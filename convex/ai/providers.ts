/**
 * AI Provider Abstraction Layer
 * Unified interface for different AI providers
 */

import type { AIConfig } from "./config";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Anthropic Claude provider
 */
async function callAnthropic(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.filter((m) => m.role !== "system"),
      system: messages.find((m) => m.role === "system")?.content,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * OpenAI provider
 */
async function callOpenAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Custom provider (for local models, etc.)
 */
async function callCustomProvider(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const endpoint = process.env.CUSTOM_AI_ENDPOINT;
  if (!endpoint) {
    throw new Error("CUSTOM_AI_ENDPOINT not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Custom AI provider error: ${error}`);
  }

  const data = await response.json();

  // Assume OpenAI-compatible response format
  return {
    content: data.choices?.[0]?.message?.content || data.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Main AI call function - routes to appropriate provider
 */
export async function callAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  switch (config.provider) {
    case "anthropic":
      return await callAnthropic(config, messages);
    case "openai":
      return await callOpenAI(config, messages);
    case "custom":
      return await callCustomProvider(config, messages);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
