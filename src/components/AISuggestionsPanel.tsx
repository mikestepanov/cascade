import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Skeleton } from "./ui/Skeleton";

interface AISuggestionsPanelProps {
  projectId?: Id<"projects">;
}

export function AISuggestionsPanel({ projectId }: AISuggestionsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>();

  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId, suggestionType: selectedType as any } : "skip",
  );

  const generateInsights = useAction(api.ai.actions.generateProjectInsights);
  const acceptSuggestion = useMutation(api.ai.mutations.acceptSuggestion);
  const dismissSuggestion = useMutation(api.ai.mutations.dismissSuggestion);

  const handleGenerateInsights = async () => {
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
  };

  const getSuggestionIcon = (type: string) => {
    const icons: Record<string, string> = {
      issue_description: "📝",
      issue_priority: "⚡",
      issue_labels: "🏷️",
      issue_assignee: "👤",
      sprint_planning: "📅",
      risk_detection: "⚠️",
      insight: "💡",
    };
    return icons[type] || "💡";
  };

  const getSuggestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      issue_description: "Issue Description",
      issue_priority: "Priority Suggestion",
      issue_labels: "Label Suggestion",
      issue_assignee: "Assignee Suggestion",
      sprint_planning: "Sprint Planning",
      risk_detection: "Risk Detected",
      insight: "Project Insight",
    };
    return labels[type] || type;
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Select a project to view AI suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Action Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm sm:text-base font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-manipulation"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Analyzing Project...</span>
              <span className="sm:hidden">Analyzing...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span className="hidden sm:inline">Generate AI Insights</span>
              <span className="sm:hidden">Generate Insights</span>
            </>
          )}
        </button>

        {/* Filter Tabs */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedType(undefined)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              !selectedType
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("risk_detection")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              selectedType === "risk_detection"
                ? "bg-red-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            ⚠️ Risks
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("insight")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              selectedType === "insight"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            💡 Insights
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("sprint_planning")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              selectedType === "sprint_planning"
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            📅 Planning
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {!suggestions ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Suggestions Yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                Click "Generate AI Insights" to analyze your project and get AI-powered
                recommendations.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getSuggestionIcon(suggestion.suggestionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {getSuggestionTypeLabel(suggestion.suggestionType)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {suggestion.suggestion}
                    </p>
                    {suggestion.reasoning && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
                      </p>
                    )}
                    {suggestion.confidence !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Confidence:</span>
                          <div className="flex-1 max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${suggestion.confidence * 100}%` }}
                            />
                          </div>
                          <span>{Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                      </div>
                    )}
                    {!suggestion.accepted && !suggestion.dismissed && (
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => acceptSuggestion({ suggestionId: suggestion._id })}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors touch-manipulation"
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissSuggestion({ suggestionId: suggestion._id })}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors touch-manipulation"
                        >
                          ✗ Dismiss
                        </button>
                      </div>
                    )}
                    {suggestion.accepted && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span>✓</span>
                        <span>Accepted</span>
                      </div>
                    )}
                    {suggestion.dismissed && (
                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <span>✗</span>
                        <span>Dismissed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
