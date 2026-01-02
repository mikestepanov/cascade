import type { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { toast } from "sonner";

/**
 * Markdown import/export utilities for document editor
 * Enables CLI AI tools to patch documents via markdown files
 */

// Helper type for BlockNote content items
type ContentItem = { text?: string };

// Helper type for block props (BlockNote uses flexible props)
type BlockProps = Record<string, unknown>;

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
export function readMarkdownFile(file: File): Promise<string> {
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

// Helper to get text content from block
function getTextContent(content: unknown): string {
  return Array.isArray(content) ? content.map((item: ContentItem) => item.text || "").join("") : "";
}

// Helper to convert block type to markdown
function convertBlockType(block: Block, textContent: string, indent: string): string {
  const props = block.props as BlockProps;

  if (block.type === "heading") {
    const headingLevel = (props?.level as number) || 1;
    return `${"#".repeat(headingLevel)} ${textContent}`;
  }

  if (block.type === "paragraph") return textContent;
  if (block.type === "bulletListItem") return `${indent}- ${textContent}`;
  if (block.type === "numberedListItem") return `${indent}1. ${textContent}`;

  if (block.type === "checkListItem") {
    const checked = props?.checked ? "x" : " ";
    return `${indent}- [${checked}] ${textContent}`;
  }

  if (block.type === "codeBlock") {
    const language = (props?.language as string) || "";
    return `\`\`\`${language}\n${textContent}\n\`\`\``;
  }

  if (block.type === "table") {
    return "| Table | Content |\n|-------|---------|";
  }

  if (block.type === "image") {
    const imageUrl = (props?.url as string) || "";
    const imageCaption = (props?.caption as string) || "";
    return `![${imageCaption}](${imageUrl})`;
  }

  return textContent;
}

/**
 * Convert a single block to markdown
 */
async function blockToMarkdown(block: Block, level: number): Promise<string> {
  const indent = "  ".repeat(level);
  const textContent = getTextContent(block.content);
  let result = convertBlockType(block, textContent, indent);

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
async function markdownToBlocks(
  editor: BlockNoteEditor,
  markdown: string,
): Promise<PartialBlock[]> {
  // Strip frontmatter before parsing
  const content = stripFrontmatter(markdown);

  // Try to use BlockNote's tryParseMarkdownToBlocks if available
  if (
    "tryParseMarkdownToBlocks" in editor &&
    typeof editor.tryParseMarkdownToBlocks === "function"
  ) {
    try {
      const editorWithMarkdown = editor as BlockNoteEditor & {
        tryParseMarkdownToBlocks: (content: string) => Promise<PartialBlock[]>;
      };
      const blocks = await editorWithMarkdown.tryParseMarkdownToBlocks(content);
      if (Array.isArray(blocks)) {
        return blocks;
      }
    } catch (_error) {
      // Fall through to simple markdown parser
    }
  }

  // Fallback: Simple markdown parser
  return parseMarkdownSimple(content);
}

/**
 * Simple markdown parser as fallback
 * Handles common markdown syntax
 */
// Helper to try parsing heading
function tryParseHeading(line: string, blocks: PartialBlock[]): boolean {
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) return false;

  blocks.push({
    type: "heading",
    props: { level: headingMatch[1].length },
    content: [{ type: "text", text: headingMatch[2], styles: {} }],
    children: [],
  } as PartialBlock);
  return true;
}

// Helper to try parsing list items
function tryParseListItem(line: string, blocks: PartialBlock[]): boolean {
  // Checklist items
  if (line.match(/^\s*[-*]\s+\[[ x]\]/)) {
    const checked = line.includes("[x]");
    const text = line.replace(/^\s*[-*]\s+\[[ x]\]\s*/, "");
    blocks.push({
      type: "checkListItem",
      props: { checked },
      content: [{ type: "text", text, styles: {} }],
      children: [],
    } as PartialBlock);
    return true;
  }

  // Bullet items
  if (line.match(/^\s*[-*]\s+/)) {
    const text = line.replace(/^\s*[-*]\s+/, "");
    blocks.push({
      type: "bulletListItem",
      props: {},
      content: [{ type: "text", text, styles: {} }],
      children: [],
    } as PartialBlock);
    return true;
  }

  // Numbered items
  if (line.match(/^\s*\d+\.\s+/)) {
    const text = line.replace(/^\s*\d+\.\s+/, "");
    blocks.push({
      type: "numberedListItem",
      props: {},
      content: [{ type: "text", text, styles: {} }],
      children: [],
    } as PartialBlock);
    return true;
  }

  return false;
}

// Helper to try parsing images
function tryParseImage(line: string, blocks: PartialBlock[]): boolean {
  const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!imageMatch) return false;

  blocks.push({
    type: "image",
    props: { url: imageMatch[2], caption: imageMatch[1] },
  } as PartialBlock);
  return true;
}

function parseMarkdownSimple(markdown: string): PartialBlock[] {
  const blocks: PartialBlock[] = [];
  const lines = markdown.split("\n");

  let currentBlock: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";

  for (const line of lines) {
    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: "codeBlock",
          props: { language: codeLanguage },
          content: [{ type: "text", text: currentBlock.join("\n"), styles: {} }],
          children: [],
        } as PartialBlock);
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

    // Try parsing different markdown elements
    if (
      tryParseHeading(line, blocks) ||
      tryParseListItem(line, blocks) ||
      tryParseImage(line, blocks)
    ) {
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
    } as PartialBlock);
  }

  // Handle any remaining code block
  if (inCodeBlock && currentBlock.length > 0) {
    blocks.push({
      type: "codeBlock",
      props: { language: codeLanguage },
      content: [{ type: "text", text: currentBlock.join("\n"), styles: {} }],
      children: [],
    } as PartialBlock);
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
export function handleMarkdownImport(editor: BlockNoteEditor): Promise<void> {
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
export function readMarkdownForPreview(): Promise<{
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
