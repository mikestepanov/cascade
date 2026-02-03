import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/Tooltip";
import { AIChat } from "./AIChat";
import * as hooks from "./hooks";

// Mock the hook
vi.mock("./hooks", () => ({
  useAIChat: vi.fn(),
}));

describe("AIChat", () => {
  it("renders copy button with tooltip for assistant messages", () => {
    // Mock return value of useAIChat
    vi.mocked(hooks.useAIChat).mockReturnValue({
      chatId: "chat123" as any,
      inputMessage: "",
      isSending: false,
      copiedMessageId: null,
      messagesEndRef: { current: null },
      textareaRef: { current: null },
      messages: [
        {
          _id: "msg1" as any,
          _creationTime: Date.now(),
          chatId: "chat123" as any,
          role: "assistant",
          content: "Hello world",
        },
      ],
      setInputMessage: vi.fn(),
      handleSendMessage: vi.fn(),
      handleKeyPress: vi.fn(),
      copyToClipboard: vi.fn(),
    });

    render(
      <TooltipProvider>
        <AIChat projectId={"proj1" as any} />
      </TooltipProvider>,
    );

    // Check for the button
    const copyButton = screen.getByLabelText("Copy message");
    expect(copyButton).toBeInTheDocument();

    // Check that title is gone (we replaced it)
    expect(copyButton).not.toHaveAttribute("title");
  });
});
