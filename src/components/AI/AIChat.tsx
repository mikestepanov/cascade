/**
 * AIChat - Refactored with useAIChat hook
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Id } from "../../../convex/_generated/dataModel";
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
        className={`relative max-w-[${AI_CONFIG.message.maxWidth.mobile}] md:max-w-[${AI_CONFIG.message.maxWidth.desktop}] rounded-lg px-4 py-3 ${
          message.role === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        }`}
      >
        {/* Copy button for assistant messages */}
        {message.role === "assistant" && (
          <button
            type="button"
            onClick={() => onCopy(message.content, messageId)}
            className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow-md"
            title="Copy message"
          >
            {isCopied ? (
              <svg
                className="w-4 h-4 text-green-600"
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
                className="w-4 h-4 text-gray-600 dark:text-gray-400"
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
          </button>
        )}

        {/* Message content with markdown for assistant */}
        {message.role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {/* Message metadata */}
        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
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
        </div>
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Starting new chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!messages ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-20 w-3/4" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ask me anything about your project, or use natural language commands.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                <p>💡 "What's our team velocity?"</p>
                <p>💡 "Which issues are blocking the sprint?"</p>
                <p>💡 "Summarize this week's progress"</p>
              </div>
            </div>
          </div>
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
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 safe-area-inset-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your project..."
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all"
            rows={1}
            style={{
              minHeight: `${AI_CONFIG.textarea.minHeight}px`,
              maxHeight: `${AI_CONFIG.textarea.maxHeight}px`,
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            aria-label="Send message"
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
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
});
