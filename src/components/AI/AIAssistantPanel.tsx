/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ErrorBoundary } from "../ErrorBoundary";
import { Flex } from "../ui/Flex";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { AIChat } from "./AIChat";
import { AIErrorFallback } from "./AIErrorFallback";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { AI_CONFIG } from "./config";

interface AIAssistantPanelProps {
  workspaceId?: Id<"workspaces">;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ workspaceId, isOpen, onClose }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "suggestions">("chat");
  const [currentChatId, setCurrentChatId] = useState<Id<"aiChats"> | undefined>();
  const [isAnimating, setIsAnimating] = useState(false);

  const chats = useQuery(api.ai.queries.getUserChats, workspaceId ? { workspaceId } : {});
  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    workspaceId ? { workspaceId } : "skip",
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={`${AI_CONFIG.panel.width.mobile} ${AI_CONFIG.panel.width.tablet} ${AI_CONFIG.panel.width.desktop} p-0 flex flex-col bg-ui-bg-primary dark:bg-ui-bg-primary-dark`}
      >
        {/* Header */}
        <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-gradient-to-r from-brand-600 to-accent-600">
          <SheetHeader className="text-left">
            <Flex align="center" gap="md">
              <div className="text-2xl">🤖</div>
              <div>
                <SheetTitle className="text-lg font-semibold text-white">AI Assistant</SheetTitle>
                <SheetDescription className="text-xs text-brand-100">
                  {workspaceId ? "Workspace-specific context" : "General chat"}
                </SheetDescription>
              </div>
            </Flex>
          </SheetHeader>
        </div>

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
        <div className="flex-1 overflow-hidden">
          <div
            className={`h-full transition-opacity duration-${AI_CONFIG.animations.tabTransition} ${
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
                  workspaceId={workspaceId}
                  chatId={currentChatId}
                  onChatCreated={setCurrentChatId}
                />
              ) : (
                <AISuggestionsPanel workspaceId={workspaceId} />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
