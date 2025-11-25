/**
 * AISuggestionsPanel - Refactored with useAISuggestions hook
 */

import React from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Flex } from "../ui/Flex";
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
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center text-ui-text-secondary dark:text-ui-text-secondary-dark">
          <p>Select a project to view AI suggestions</p>
        </div>
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      {/* Action Bar */}
      <div className="p-3 sm:p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
        <button
          type="button"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg text-sm sm:text-base font-medium hover:from-brand-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
        >
          <Flex align="center" justify="center" gap="sm">
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
          </Flex>
        </button>

        {/* Filter Tabs */}
        <Flex wrap gap="sm" className="mt-3">
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
        </Flex>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {!suggestions ? (
          <Flex direction="column" gap="md">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </Flex>
        ) : suggestions.length === 0 ? (
          <Flex align="center" justify="center" className="h-full text-center px-4">
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-base sm:text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                No Suggestions Yet
              </h3>
              <p className="text-sm sm:text-base text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
                Click "Generate AI Insights" to analyze your project and get AI-powered
                recommendations.
              </p>
            </div>
          </Flex>
        ) : (
          <Flex direction="column" gap="md">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
              />
            ))}
          </Flex>
        )}
      </div>
    </Flex>
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
    default: "bg-brand-600 text-white",
    red: "bg-status-error text-white",
    purple: "bg-accent-600 text-white",
    green: "bg-status-success text-white",
  };

  const inactiveColors =
    "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark";

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
  suggestion: Doc<"aiSuggestions">;
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
    <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <Flex align="start" gap="md">
        <div className="text-2xl flex-shrink-0">{metadata?.icon || "💡"}</div>
        <div className="flex-1 min-w-0">
          <Flex align="center" gap="sm" className="mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200">
              {metadata?.label || suggestion.suggestionType}
            </span>
            <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              {new Date(suggestion.createdAt).toLocaleDateString()}
            </span>
          </Flex>
          <p className="text-ui-text-primary dark:text-ui-text-primary-dark whitespace-pre-wrap break-words">
            {suggestion.suggestion}
          </p>
          {suggestion.reasoning && (
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-2">
              <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
            </p>
          )}
          {suggestion.confidence !== undefined && (
            <div className="mt-2">
              <Flex
                align="center"
                gap="sm"
                className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
              >
                <span>Confidence:</span>
                <div className="flex-1 max-w-[100px] bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
                <span>{Math.round(suggestion.confidence * 100)}%</span>
              </Flex>
            </div>
          )}
          {!(suggestion.accepted || suggestion.dismissed) && (
            <Flex gap="sm" className="mt-3">
              <button
                type="button"
                onClick={() => onAccept(suggestion._id)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-status-success text-white rounded-lg hover:bg-status-success/90 focus:outline-none focus:ring-2 focus:ring-status-success transition-colors touch-manipulation"
              >
                ✓ Accept
              </button>
              <button
                type="button"
                onClick={() => onDismiss(suggestion._id)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-lg hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-ui-border-secondary transition-colors touch-manipulation"
              >
                ✗ Dismiss
              </button>
            </Flex>
          )}
          {suggestion.accepted && (
            <Flex
              align="center"
              gap="xs"
              className="mt-3 text-sm text-status-success dark:text-status-success"
            >
              <span>✓</span>
              <span>Accepted</span>
            </Flex>
          )}
          {suggestion.dismissed && (
            <Flex
              align="center"
              gap="xs"
              className="mt-3 text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
            >
              <span>✗</span>
              <span>Dismissed</span>
            </Flex>
          )}
        </div>
      </Flex>
    </div>
  );
});
