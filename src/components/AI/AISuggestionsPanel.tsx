/**
 * AISuggestionsPanel - Refactored with useAISuggestions hook
 */

import React from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "../ui/Skeleton";
import { SUGGESTION_METADATA, type SuggestionType } from "./config";
import { useAISuggestions } from "./hooks";

interface AISuggestionsPanelProps {
  projectId?: Id<"projects">;
}

export const AISuggestionsPanel = React.memo(function AISuggestionsPanel({
  projectId,
}: AISuggestionsPanelProps) {
  const {
    isGenerating,
    selectedType,
    suggestions,
    _unreadCount,
    setSelectedType,
    handleGenerateInsights,
    handleAcceptSuggestion,
    handleDismissSuggestion,
  } = useAISuggestions({ projectId });

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
          <FilterButton
            active={!selectedType}
            onClick={() => setSelectedType(undefined)}
            label="All"
          />
          <FilterButton
            active={selectedType === "risk_detection"}
            onClick={() => setSelectedType("risk_detection")}
            label="⚠️ Risks"
            variant="red"
          />
          <FilterButton
            active={selectedType === "insight"}
            onClick={() => setSelectedType("insight")}
            label="💡 Insights"
            variant="purple"
          />
          <FilterButton
            active={selectedType === "sprint_planning"}
            onClick={() => setSelectedType("sprint_planning")}
            label="📅 Planning"
            variant="green"
          />
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
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Sub-components

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  variant?: "default" | "red" | "purple" | "green";
}

const FilterButton = React.memo(function FilterButton({
  active,
  onClick,
  label,
  variant = "default",
}: FilterButtonProps) {
  const activeColors = {
    default: "bg-blue-600 text-white",
    red: "bg-red-600 text-white",
    purple: "bg-purple-600 text-white",
    green: "bg-green-600 text-white",
  };

  const inactiveColors =
    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
        active ? activeColors[variant] : inactiveColors
      }`}
    >
      {label}
    </button>
  );
});

interface SuggestionCardProps {
  suggestion: any;
  onAccept: (id: Id<"aiSuggestions">) => void;
  onDismiss: (id: Id<"aiSuggestions">) => void;
}

const SuggestionCard = React.memo(function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  const metadata = SUGGESTION_METADATA[suggestion.suggestionType as SuggestionType];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{metadata?.icon || "💡"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {metadata?.label || suggestion.suggestionType}
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
                onClick={() => onAccept(suggestion._id)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors touch-manipulation"
              >
                ✓ Accept
              </button>
              <button
                type="button"
                onClick={() => onDismiss(suggestion._id)}
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
  );
});
