/**
 * AI Components - Public exports
 */

// Main components
export { AIAssistantPanel } from "./AIAssistantPanel";
export { AIAssistantButton } from "./AIAssistantButton";
export type { AIAssistantButtonProps } from "./AIAssistantButton";
export { AIChat } from "./AIChat";
export { AISuggestionsPanel } from "./AISuggestionsPanel";

// Error handling
export { AIErrorFallback } from "./AIErrorFallback";
export type { AIErrorFallbackProps } from "./AIErrorFallback";

// Configuration and types
export { AI_CONFIG, SUGGESTION_METADATA, SUGGESTION_TYPES, AI_SHORTCUTS } from "./config";
export type { SuggestionType } from "./config";

// Hooks (for advanced usage)
export { useAIChat, useAISuggestions } from "./hooks";
export type {
  UseAIChatOptions,
  UseAIChatReturn,
  UseAISuggestionsOptions,
  UseAISuggestionsReturn,
} from "./hooks";
