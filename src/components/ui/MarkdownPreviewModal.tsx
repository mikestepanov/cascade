import { useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface MarkdownPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  markdown: string;
  filename: string;
}

/**
 * Preview markdown content before importing
 * Shows both raw markdown and rendered preview
 */
export function MarkdownPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  markdown,
  filename,
}: MarkdownPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "preview">("preview");

  // Count blocks for preview stats
  const lines = markdown.split("\n");
  const headings = lines.filter((line) => line.match(/^#{1,6}\s/)).length;
  const lists = lines.filter((line) => line.match(/^\s*[-*]\s/)).length;
  const codeBlocks = (markdown.match(/```/g) || []).length / 2;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview Markdown Import" maxWidth="4xl">
      <div className="p-6">
        {/* File Info */}
        <div className="mb-4 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              📄 {filename}
            </span>
            <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              {lines.length} lines • {headings} headings • {lists} lists • {codeBlocks} code blocks
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 p-3 bg-status-warning/10 dark:bg-status-warning/20 border border-status-warning/30 dark:border-status-warning/50 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-status-warning dark:text-status-warning text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-status-warning dark:text-status-warning">
                This will replace all current document content
              </p>
              <p className="text-xs text-status-warning/90 dark:text-status-warning/80 mt-1">
                Make sure you have a backup or export the current version first.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-ui-border-primary dark:border-ui-border-primary-dark mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-secondary dark:hover:text-ui-text-secondary-dark"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "raw"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-ui-text-secondary dark:hover:text-ui-text-secondary-dark"
            }`}
          >
            Raw Markdown
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg">
          {activeTab === "preview" ? (
            <div className="p-4 prose dark:prose-invert max-w-none">
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(markdown) }}
              />
            </div>
          ) : (
            <pre className="p-4 text-sm text-ui-text-primary dark:text-ui-text-primary-dark whitespace-pre-wrap font-mono">
              {markdown}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button onClick={onConfirm} variant="primary">
            Import & Replace Content
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Simple markdown to HTML renderer for preview
 * Basic implementation for common syntax
 */
function renderMarkdownPreview(markdown: string): string {
  let html = markdown;

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Code blocks
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>',
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Lists
  html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  return html;
}
