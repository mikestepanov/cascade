/**
 * AIChat - Refactored with useAIChat hook
 */

import type { Id } from "@convex/_generated/dataModel";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Skeleton } from "../ui/Skeleton";
import { AI_CONFIG } from "./config";
import { useAIChat } from "./hooks";

interface AIChatProps {
  projectId?: Id<"projects">;
  chatId?: Id<"aiChats">;
  onChatCreated?: (chatId: Id<"aiChats">) => void;
}

// Message Item Component
function MessageItem({
  message,
  index,
  chatId,
  copiedMessageId,
  onCopy,
}: {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: number;
    modelUsed?: string;
    responseTime?: number;
  };
  index: number;
  chatId: Id<"aiChats">;
  copiedMessageId: string | null;
  onCopy: (content: string, messageId: string) => void;
}) {
  const messageId = `${chatId}-${index}`;
  const isCopied = copiedMessageId === messageId;

  return (
    <div
      key={`${chatId}-${message.createdAt}-${index}`}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}
    >
      <div
        className={`relative max-w-[85%] md:max-w-[80%] rounded-lg px-4 py-3 ${
          message.role === "user"
            ? "bg-brand-600 text-white"
            : "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
        }`}
      >
        {/* Copy button for assistant messages */}
        {message.role === "assistant" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(message.content, messageId)}
            className="absolute -right-2 -top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow-md border border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
            title="Copy message"
          >
            {isCopied ? (
              <svg
                className="w-4 h-4 text-status-success dark:text-status-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Copied</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-ui-text-secondary dark:text-ui-text-secondary-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Copy</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </Button>
        )}

        {/* Message content with markdown for assistant */}
        {message.role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {/* Message metadata */}
        <Flex align="center" gap="sm" className="mt-2 text-xs opacity-70">
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.role === "assistant" && message.modelUsed && (
            <span className="hidden sm:inline">
              • {message.modelUsed.split("-").slice(0, 2).join("-")}
            </span>
          )}
          {message.role === "assistant" && message.responseTime && (
            <span className="hidden md:inline">• {(message.responseTime / 1000).toFixed(1)}s</span>
          )}
        </Flex>
      </div>
    </div>
  );
}

export const AIChat = React.memo(function AIChat({
  projectId,
  chatId: initialChatId,
  onChatCreated,
}: AIChatProps) {
  const {
    chatId,
    inputMessage,
    isSending,
    copiedMessageId,
    messagesEndRef,
    textareaRef,
    messages,
    setInputMessage,
    handleSendMessage,
    handleKeyPress,
    copyToClipboard,
  } = useAIChat({ projectId, initialChatId, onChatCreated });

  if (!chatId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Starting new chat..." />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      {/* Messages Area */}
      <Flex direction="column" gap="lg" className="flex-1 overflow-y-auto p-4">
        {!messages ? (
          <Flex direction="column" gap="lg">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-20 w-3/4" />
          </Flex>
        ) : messages.length === 0 ? (
          <Flex align="center" justify="center" className="h-full text-center">
            <div>
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                AI Assistant
              </h3>
              <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
                Ask me anything about your project, or use natural language commands.
              </p>
              <Flex
                direction="column"
                gap="xs"
                className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
              >
                <p>💡 "What's our team velocity?"</p>
                <p>💡 "Which issues are blocking the sprint?"</p>
                <p>💡 "Summarize this week's progress"</p>
              </Flex>
            </div>
          </Flex>
        ) : (
          <>
            {messages
              .filter((m) => m.role !== "system")
              .map((message, index) => (
                <MessageItem
                  key={`${message.chatId}-${message.createdAt}-${index}`}
                  message={message}
                  index={index}
                  chatId={message.chatId}
                  copiedMessageId={copiedMessageId}
                  onCopy={copyToClipboard}
                />
              ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg px-4 py-3">
                  <Flex align="center" gap="sm">
                    <Flex gap="xs">
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary dark:bg-ui-text-tertiary-dark rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary dark:bg-ui-text-tertiary-dark rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary dark:bg-ui-text-tertiary-dark rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </Flex>
                    <span className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                      AI is thinking...
                    </span>
                  </Flex>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Flex>

      {/* Input Area */}
      <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark p-3 sm:p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark safe-area-inset-bottom">
        <Flex gap="sm" align="end">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your project..."
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-ui-text-primary dark:text-ui-text-primary-dark placeholder-ui-text-tertiary dark:placeholder-ui-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all"
            rows={1}
            style={{
              minHeight: `${AI_CONFIG.textarea.minHeight}px`,
              maxHeight: `${AI_CONFIG.textarea.maxHeight}px`,
            }}
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            aria-label="Send message"
            className="flex-shrink-0"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Send</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </Button>
        </Flex>
        <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-2 hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Flex>
  );
});
