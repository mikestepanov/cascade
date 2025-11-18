/**
 * AI Components - Public exports
 */

export type { AIAssistantButtonProps } from "./AIAssistantButton";
export { AIAssistantButton } from "./AIAssistantButton";
// Main components
export { AIAssistantPanel } from "./AIAssistantPanel";
export { AIChat } from "./AIChat";
export type { AIErrorFallbackProps } from "./AIErrorFallback";

// Error handling
export { AIErrorFallback } from "./AIErrorFallback";
export { AISuggestionsPanel } from "./AISuggestionsPanel";
export type { SuggestionType } from "./config";
// Configuration and types
export { AI_CONFIG, AI_SHORTCUTS, SUGGESTION_METADATA, SUGGESTION_TYPES } from "./config";
export type {
  UseAIChatOptions,
  UseAIChatReturn,
  UseAISuggestionsOptions,
  UseAISuggestionsReturn,
} from "./hooks";
// Hooks (for advanced usage)
export { useAIChat, useAISuggestions } from "./hooks";
