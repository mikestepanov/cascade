/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ErrorBoundary } from "../ErrorBoundary";
import { Flex } from "../ui/Flex";
import { ModalBackdrop } from "../ui/ModalBackdrop";
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

  const unreadSuggestions = suggestions?.filter((s) => !(s.accepted || s.dismissed)).length || 0;

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
      {isOpen && <ModalBackdrop onClick={onClose} animated={false} />}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full ${AI_CONFIG.panel.width.mobile} ${AI_CONFIG.panel.width.tablet} ${AI_CONFIG.panel.width.desktop} bg-ui-bg-primary dark:bg-ui-bg-primary-dark shadow-2xl z-50 transform transition-all duration-${AI_CONFIG.animations.slideInOut} ${
          isOpen ? "translate-x-0 ease-out" : "translate-x-full ease-in"
        }`}
      >
        {/* Header */}
        <Flex
          justify="between"
          align="center"
          className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-gradient-to-r from-brand-600 to-accent-600"
        >
          <Flex align="center" gap="md">
            <div className="text-2xl">🤖</div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-xs text-brand-100">
                {projectId ? "Project-specific context" : "General chat"}
              </p>
            </div>
          </Flex>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white hover:bg-ui-bg-primary/20 rounded-lg transition-colors"
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
        </Flex>

        {/* Tabs */}
        <div className="flex border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <button
            type="button"
            onClick={() => handleTabChange("chat")}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === "chat"
                ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
                : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            💬 Chat
            {chats && chats.length > 0 && (
              <span className="ml-2 text-xs bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark px-2 py-0.5 rounded-full">
                {chats.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("suggestions")}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === "suggestions"
                ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
                : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            💡 Suggestions
            {unreadSuggestions > 0 && (
              <span className="ml-2 text-xs bg-status-error text-white px-2 py-0.5 rounded-full">
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
