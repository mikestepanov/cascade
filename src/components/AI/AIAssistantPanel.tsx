/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ErrorBoundary } from "../ErrorBoundary";
import { AIChat } from "./AIChat";
import { AIErrorFallback } from "./AIErrorFallback";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { AI_CONFIG } from "./config";

interface AIAssistantPanelProps {
  projectId?: Id<"projects">;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ projectId, isOpen, onClose }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "suggestions">("chat");
  const [currentChatId, setCurrentChatId] = useState<Id<"aiChats"> | undefined>();
  const [isAnimating, setIsAnimating] = useState(false);

  const chats = useQuery(api.ai.queries.getUserChats, projectId ? { projectId } : {});
  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId } : "skip",
  );

  const unreadSuggestions = suggestions?.filter((s) => !s.accepted && !s.dismissed).length || 0;

  const handleTabChange = (tab: "chat" | "suggestions") => {
    if (tab === activeTab) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsAnimating(false);
    }, AI_CONFIG.animations.tabTransition);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity cursor-default"
          onClick={onClose}
          aria-label="Close AI assistant"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full ${AI_CONFIG.panel.width.mobile} ${AI_CONFIG.panel.width.tablet} ${AI_CONFIG.panel.width.desktop} bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-all duration-${AI_CONFIG.animations.slideInOut} ${
          isOpen ? "translate-x-0 ease-out" : "translate-x-full ease-in"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-xs text-blue-100">
                {projectId ? "Project-specific context" : "General chat"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Close AI assistant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => handleTabChange("chat")}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "chat"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            💬 Chat
            {chats && chats.length > 0 && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {chats.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("suggestions")}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "suggestions"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            💡 Suggestions
            {unreadSuggestions > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                {unreadSuggestions}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className={`h-[calc(100vh-${AI_CONFIG.panel.headerHeight}px)] overflow-hidden`}>
          <div
            className={`transition-opacity duration-${AI_CONFIG.animations.tabTransition} ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <ErrorBoundary
              fallback={
                <AIErrorFallback
                  title="Chat Error"
                  message="Failed to load AI chat. Please try refreshing."
                  onRetry={() => window.location.reload()}
                />
              }
            >
              {activeTab === "chat" ? (
                <AIChat
                  projectId={projectId}
                  chatId={currentChatId}
                  onChatCreated={setCurrentChatId}
                />
              ) : (
                <AISuggestionsPanel projectId={projectId} />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}
