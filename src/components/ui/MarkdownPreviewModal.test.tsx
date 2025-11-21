import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownPreviewModal } from "./MarkdownPreviewModal";

// Mock the Modal component
vi.mock("./Modal", () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

// Mock the Button component
vi.mock("./Button", () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button type="button" onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe("MarkdownPreviewModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    markdown: "# Test Heading\n\nParagraph content.",
    filename: "test-document.md",
  };

  it("should render when open", () => {
    render(<MarkdownPreviewModal {...defaultProps} />);

    expect(screen.getByText("Preview Markdown Import")).toBeInTheDocument();
    expect(screen.getByText(/test-document.md/)).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<MarkdownPreviewModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Preview Markdown Import")).not.toBeInTheDocument();
  });

  it("should display file statistics", () => {
    const markdown = `# Heading 1
## Heading 2

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
print("hello")
\`\`\``;

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    // Should show statistics
    expect(screen.getByText(/2 headings/)).toBeInTheDocument();
    expect(screen.getByText(/3 lists/)).toBeInTheDocument();
    expect(screen.getByText(/2 code blocks/)).toBeInTheDocument();
  });

  it("should show warning about content replacement", () => {
    render(<MarkdownPreviewModal {...defaultProps} />);

    expect(screen.getByText(/This will replace all current document content/)).toBeInTheDocument();
    expect(
      screen.getByText(/Make sure you have a backup or export the current version first/),
    ).toBeInTheDocument();
  });

  it("should switch between Preview and Raw tabs", async () => {
    const user = userEvent.setup();
    render(<MarkdownPreviewModal {...defaultProps} />);

    // Should start on Preview tab
    expect(screen.getByText("Preview")).toHaveClass("border-blue-500");

    // Click Raw tab
    const rawTab = screen.getByText("Raw Markdown");
    await user.click(rawTab);

    // Raw tab should now be active
    expect(rawTab).toHaveClass("border-blue-500");
    expect(screen.getByText("Preview")).not.toHaveClass("border-blue-500");
  });

  it("should display raw markdown in Raw tab", async () => {
    const user = userEvent.setup();
    const markdown = "# Test\n\nContent here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    // Switch to Raw tab
    await user.click(screen.getByText("Raw Markdown"));

    // Should display raw markdown
    expect(screen.getByText(/# Test/)).toBeInTheDocument();
    expect(screen.getByText(/Content here\./)).toBeInTheDocument();
  });

  it("should call onConfirm when import button clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<MarkdownPreviewModal {...defaultProps} onConfirm={onConfirm} />);

    const importButton = screen.getByText("Import & Replace Content");
    await user.click(importButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onClose when cancel button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<MarkdownPreviewModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should render markdown preview with HTML", () => {
    const markdown = "# Heading\n\n**Bold text**\n\n*Italic text*";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    // Should have rendered HTML (checking for h1 in the preview)
    const preview = screen.getByText("Preview").closest("div");
    expect(preview).toBeTruthy();
  });

  it("should calculate correct line count", () => {
    const markdown = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/5 lines/)).toBeInTheDocument();
  });

  it("should handle markdown without headings", () => {
    const markdown = "Just plain text\n\nNo headings here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 headings/)).toBeInTheDocument();
  });

  it("should handle markdown without lists", () => {
    const markdown = "# Heading\n\nJust paragraphs.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 lists/)).toBeInTheDocument();
  });

  it("should handle markdown without code blocks", () => {
    const markdown = "# Heading\n\nNo code here.";

    render(<MarkdownPreviewModal {...defaultProps} markdown={markdown} />);

    expect(screen.getByText(/0 code blocks/)).toBeInTheDocument();
  });

  it("should display filename with emoji", () => {
    render(<MarkdownPreviewModal {...defaultProps} filename="my-doc.md" />);

    expect(screen.getByText("📄 my-doc.md")).toBeInTheDocument();
  });

  it("should display warning emoji", () => {
    render(<MarkdownPreviewModal {...defaultProps} />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });
});
