/**
 * useAISuggestions Hook
 * Manages AI suggestions state and business logic
 */

import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { SuggestionType } from "../config";

export interface UseAISuggestionsOptions {
  projectId?: Id<"projects">;
}

export interface UseAISuggestionsReturn {
  // State
  isGenerating: boolean;
  selectedType: SuggestionType | undefined;

  // Data
  suggestions: any[] | undefined;
  unreadCount: number;

  // Actions
  setSelectedType: (type: SuggestionType | undefined) => void;
  handleGenerateInsights: () => Promise<void>;
  handleAcceptSuggestion: (suggestionId: Id<"aiSuggestions">) => Promise<void>;
  handleDismissSuggestion: (suggestionId: Id<"aiSuggestions">) => Promise<void>;
}

export function useAISuggestions({ projectId }: UseAISuggestionsOptions): UseAISuggestionsReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<SuggestionType | undefined>();

  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId, suggestionType: selectedType } : "skip",
  );

  const generateInsights = useAction(api.ai.actions.generateProjectInsights);
  const acceptSuggestion = useMutation(api.ai.mutations.acceptSuggestion);
  const dismissSuggestion = useMutation(api.ai.mutations.dismissSuggestion);

  const unreadCount = suggestions?.filter((s) => !s.accepted && !s.dismissed).length || 0;

  const handleGenerateInsights = useCallback(async () => {
    if (!projectId || isGenerating) return;

    setIsGenerating(true);
    try {
      await generateInsights({ projectId });
      toast.success("AI insights generated successfully!");
    } catch {
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, isGenerating, generateInsights]);

  const handleAcceptSuggestion = useCallback(
    async (suggestionId: Id<"aiSuggestions">) => {
      try {
        await acceptSuggestion({ suggestionId });
        toast.success("Suggestion accepted");
      } catch {
        toast.error("Failed to accept suggestion");
      }
    },
    [acceptSuggestion],
  );

  const handleDismissSuggestion = useCallback(
    async (suggestionId: Id<"aiSuggestions">) => {
      try {
        await dismissSuggestion({ suggestionId });
        toast.success("Suggestion dismissed");
      } catch {
        toast.error("Failed to dismiss suggestion");
      }
    },
    [dismissSuggestion],
  );

  return {
    // State
    isGenerating,
    selectedType,

    // Data
    suggestions,
    unreadCount,

    // Actions
    setSelectedType,
    handleGenerateInsights,
    handleAcceptSuggestion,
    handleDismissSuggestion,
  };
}
