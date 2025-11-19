import type { Block, BlockNoteEditor } from "@blocknote/core";
import { toast } from "sonner";

/**
 * Markdown import/export utilities for document editor
 * Enables CLI AI tools to patch documents via markdown files
 */

/**
 * Convert BlockNote blocks to Markdown string
 */
export async function exportToMarkdown(editor: BlockNoteEditor): Promise<string> {
  try {
    const blocks = editor.document;
    return await blocksToMarkdown(blocks);
  } catch (_error) {
    throw new Error("Failed to export document to markdown");
  }
}

/**
 * Convert Markdown string to BlockNote blocks
 */
export async function importFromMarkdown(editor: BlockNoteEditor, markdown: string): Promise<void> {
  try {
    const blocks = await markdownToBlocks(editor, markdown);
    editor.replaceBlocks(editor.document, blocks);
  } catch (_error) {
    throw new Error("Failed to import markdown to document");
  }
}

/**
 * Download markdown file
 */
export function downloadMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read markdown file from upload
 */
export async function readMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        resolve(content);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Convert BlockNote blocks to markdown string
 * Uses a simplified markdown conversion for common block types
 */
async function blocksToMarkdown(blocks: Block[]): Promise<string> {
  const lines: string[] = [];

  for (const block of blocks) {
    const markdown = await blockToMarkdown(block, 0);
    if (markdown) {
      lines.push(markdown);
    }
  }

  return lines.join("\n\n");
}

/**
 * Convert a single block to markdown
 */
async function blockToMarkdown(block: Block, level: number): Promise<string> {
  const indent = "  ".repeat(level);
  let result = "";

  // Get text content if available
  const content = block.content as unknown;
  const textContent =
    Array.isArray(content) && content.length > 0
      ? content.map((item: any) => item.text || "").join("")
      : "";

  // Convert based on block type
  switch (block.type) {
    case "heading": {
      const headingLevel = (block.props as any)?.level || 1;
      result = `${"#".repeat(headingLevel)} ${textContent}`;
      break;
    }

    case "paragraph":
      result = textContent;
      break;

    case "bulletListItem":
      result = `${indent}- ${textContent}`;
      break;

    case "numberedListItem":
      result = `${indent}1. ${textContent}`;
      break;

    case "checkListItem": {
      const checked = (block.props as any)?.checked ? "x" : " ";
      result = `${indent}- [${checked}] ${textContent}`;
      break;
    }

    case "codeBlock": {
      const language = (block.props as any)?.language || "";
      result = `\`\`\`${language}\n${textContent}\n\`\`\``;
      break;
    }

    case "table":
      result = "| Table | Content |\n|-------|---------|";
      break;

    case "image": {
      const imageUrl = (block.props as any)?.url || "";
      const imageCaption = (block.props as any)?.caption || "";
      result = `![${imageCaption}](${imageUrl})`;
      break;
    }

    default:
      result = textContent;
  }

  // Process children recursively
  const children = block.children || [];
  if (children.length > 0) {
    const childMarkdown = await Promise.all(
      children.map((child) => blockToMarkdown(child, level + 1)),
    );
    const childText = childMarkdown.filter(Boolean).join("\n");
    if (childText) {
      result = result ? `${result}\n${childText}` : childText;
    }
  }

  return result;
}

/**
 * Strip YAML frontmatter from markdown
 */
export function stripFrontmatter(markdown: string): string {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n\n/;
  return markdown.replace(frontmatterRegex, "");
}

/**
 * Convert markdown string to BlockNote blocks
 * Uses BlockNote's built-in markdown parsing when available
 */
async function markdownToBlocks(editor: BlockNoteEditor, markdown: string): Promise<Block[]> {
  // Strip frontmatter before parsing
  const content = stripFrontmatter(markdown);

  // Try to use BlockNote's tryParseMarkdownToBlocks if available
  if (
    "tryParseMarkdownToBlocks" in editor &&
    typeof editor.tryParseMarkdownToBlocks === "function"
  ) {
    try {
      const blocks = await (editor as any).tryParseMarkdownToBlocks(content);
      if (blocks && Array.isArray(blocks)) {
        return blocks;
      }
    } catch (_error) {}
  }

  // Fallback: Simple markdown parser
  return parseMarkdownSimple(content);
}

/**
 * Simple markdown parser as fallback
 * Handles common markdown syntax
 */
function parseMarkdownSimple(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");

  let currentBlock: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: "codeBlock",
          props: { language: codeLanguage },
          content: [{ type: "text", text: currentBlock.join("\n"), styles: {} }],
          children: [],
        } as any);
        currentBlock = [];
        inCodeBlock = false;
        codeLanguage = "";
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentBlock.push(line);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        props: { level: headingMatch[1].length },
        content: [{ type: "text", text: headingMatch[2], styles: {} }],
        children: [],
      } as any);
      continue;
    }

    // Bullet lists
    if (line.match(/^\s*[-*]\s+\[[ x]\]/)) {
      const checked = line.includes("[x]");
      const text = line.replace(/^\s*[-*]\s+\[[ x]\]\s*/, "");
      blocks.push({
        type: "checkListItem",
        props: { checked },
        content: [{ type: "text", text, styles: {} }],
        children: [],
      } as any);
      continue;
    }

    if (line.match(/^\s*[-*]\s+/)) {
      const text = line.replace(/^\s*[-*]\s+/, "");
      blocks.push({
        type: "bulletListItem",
        props: {},
        content: [{ type: "text", text, styles: {} }],
        children: [],
      } as any);
      continue;
    }

    // Numbered lists
    if (line.match(/^\s*\d+\.\s+/)) {
      const text = line.replace(/^\s*\d+\.\s+/, "");
      blocks.push({
        type: "numberedListItem",
        props: {},
        content: [{ type: "text", text, styles: {} }],
        children: [],
      } as any);
      continue;
    }

    // Images
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push({
        type: "image",
        props: { url: imageMatch[2], caption: imageMatch[1] },
        content: [],
        children: [],
      } as any);
      continue;
    }

    // Empty lines - skip
    if (!line.trim()) {
      continue;
    }

    // Regular paragraphs
    blocks.push({
      type: "paragraph",
      props: {},
      content: [{ type: "text", text: line, styles: {} }],
      children: [],
    } as any);
  }

  // Handle any remaining code block
  if (inCodeBlock && currentBlock.length > 0) {
    blocks.push({
      type: "codeBlock",
      props: { language: codeLanguage },
      content: [{ type: "text", text: currentBlock.join("\n"), styles: {} }],
      children: [],
    } as any);
  }

  return blocks;
}

/**
 * Trigger file picker for markdown import
 */
export function triggerMarkdownImport(onSelect: (file: File) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".md,.markdown,text/markdown";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      onSelect(file);
    }
  };
  input.click();
}

/**
 * Handle complete import flow with error handling
 */
export async function handleMarkdownImport(editor: BlockNoteEditor): Promise<void> {
  return new Promise((resolve, reject) => {
    triggerMarkdownImport(async (file) => {
      try {
        const markdown = await readMarkdownFile(file);
        await importFromMarkdown(editor, markdown);
        toast.success(`Imported ${file.name}`);
        resolve();
      } catch (error) {
        toast.error("Failed to import markdown file");
        reject(error);
      }
    });
  });
}

/**
 * Read markdown file for preview (doesn't import yet)
 * Returns file content and filename for preview modal
 */
export async function readMarkdownForPreview(): Promise<{
  markdown: string;
  filename: string;
} | null> {
  return new Promise((resolve) => {
    triggerMarkdownImport(async (file) => {
      try {
        const markdown = await readMarkdownFile(file);
        resolve({ markdown, filename: file.name });
      } catch (_error) {
        toast.error("Failed to read markdown file");
        resolve(null);
      }
    });
  });
}

/**
 * Handle complete export flow with error handling
 */
export async function handleMarkdownExport(
  editor: BlockNoteEditor,
  documentTitle: string,
): Promise<void> {
  try {
    const markdown = await exportToMarkdown(editor);
    const filename = documentTitle.toLowerCase().replace(/\s+/g, "-");
    downloadMarkdown(markdown, filename);
    toast.success("Document exported as markdown");
  } catch (error) {
    toast.error("Failed to export document");
    throw error;
  }
}
