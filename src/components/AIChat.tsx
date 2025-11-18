import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Skeleton } from "./ui/Skeleton";

interface AIChatProps {
  projectId?: Id<"projects">;
  chatId?: Id<"aiChats">;
  onChatCreated?: (chatId: Id<"aiChats">) => void;
}

export function AIChat({ projectId, chatId: initialChatId, onChatCreated }: AIChatProps) {
  const [chatId, setChatId] = useState<Id<"aiChats"> | null>(initialChatId || null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createChat = useMutation(api.ai.mutations.createChat);
  const sendMessage = useAction(api.ai.actions.sendChatMessage);
  const messages = useQuery(api.ai.queries.getChatMessages, chatId ? { chatId } : "skip");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create chat on mount if no chatId provided
  useEffect(() => {
    if (!chatId) {
      createChat({ projectId, title: "New Chat" }).then((newChatId) => {
        setChatId(newChatId);
        onChatCreated?.(newChatId);
      });
    }
  }, [chatId, projectId, createChat, onChatCreated]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatId || isSending) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        chatId,
        message,
        projectId,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setInputMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.role === "assistant" && message.modelUsed && (
                        <span className="hidden sm:inline">• {message.modelUsed}</span>
                      )}
                      {message.role === "assistant" && message.responseTime && (
                        <span className="hidden md:inline">
                          • {(message.responseTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your project..."
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{
              minHeight: "44px",
              maxHeight: "120px",
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
