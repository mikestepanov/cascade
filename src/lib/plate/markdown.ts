/**
 * Markdown import/export utilities for Plate editor
 * Enables CLI AI tools to patch documents via markdown files
 *
 * Converts between Markdown and Slate Value (array of nodes)
 */

import type { Value } from "platejs";
import { toast } from "sonner";
import { NODE_TYPES } from "./plugins";

// Slate node types
interface SlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

interface SlateElement {
  type: string;
  children: (SlateElement | SlateText)[];
  url?: string;
  language?: string;
  checked?: boolean;
}

/**
 * Convert Slate Value to Markdown string
 */
export function valueToMarkdown(value: Value): string {
  const lines: string[] = [];

  for (const node of value) {
    const markdown = nodeToMarkdown(node as SlateElement, 0);
    if (markdown !== null) {
      lines.push(markdown);
    }
  }

  return lines.join("\n\n");
}

/**
 * Convert Markdown string to Slate Value
 */
export function markdownToValue(markdown: string): Value {
  // Strip frontmatter before parsing
  const content = stripFrontmatter(markdown);
  return parseMarkdown(content);
}

/**
 * Strip YAML frontmatter from markdown
 */
export function stripFrontmatter(markdown: string): string {
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n\n?/;
  return markdown.replace(frontmatterRegex, "");
}

/**
 * Convert inline text with marks to markdown
 */
function textToMarkdown(children: (SlateElement | SlateText)[]): string {
  return children
    .map((child) => {
      if ("text" in child) {
        let text = child.text;
        if (child.bold) text = `**${text}**`;
        if (child.italic) text = `*${text}*`;
        if (child.code) text = `\`${text}\``;
        if (child.strikethrough) text = `~~${text}~~`;
        return text;
      }
      // Nested element - recursively get text
      return textToMarkdown(child.children);
    })
    .join("");
}

/**
 * Convert a single Slate node to markdown
 */
function nodeToMarkdown(node: SlateElement, indent: number): string | null {
  const indentStr = "  ".repeat(indent);
  const text = textToMarkdown(node.children);

  switch (node.type) {
    case NODE_TYPES.paragraph:
      return text || "";

    case NODE_TYPES.heading1:
      return `# ${text}`;

    case NODE_TYPES.heading2:
      return `## ${text}`;

    case NODE_TYPES.heading3:
      return `### ${text}`;

    case NODE_TYPES.blockquote:
      return `> ${text}`;

    case NODE_TYPES.bulletedList:
      return node.children
        .map((child) => nodeToMarkdown(child as SlateElement, indent))
        .filter(Boolean)
        .join("\n");

    case NODE_TYPES.numberedList:
      return node.children
        .map((child, i) => {
          const childMd = nodeToMarkdown(child as SlateElement, indent);
          // Replace leading "- " with "N. " for numbered items
          return childMd ? childMd.replace(/^(\s*)- /, `$1${i + 1}. `) : null;
        })
        .filter(Boolean)
        .join("\n");

    case NODE_TYPES.listItem:
      return `${indentStr}- ${text}`;

    case NODE_TYPES.todoList:
      return node.children
        .map((child) => {
          const todoItem = child as SlateElement & { checked?: boolean };
          const checked = todoItem.checked ? "x" : " ";
          const itemText = textToMarkdown(todoItem.children);
          return `${indentStr}- [${checked}] ${itemText}`;
        })
        .filter(Boolean)
        .join("\n");

    case NODE_TYPES.codeBlock: {
      const language = node.language || "";
      const codeContent = node.children
        .map((line) => textToMarkdown((line as SlateElement).children))
        .join("\n");
      return `\`\`\`${language}\n${codeContent}\n\`\`\``;
    }

    case NODE_TYPES.codeLine:
      return text;

    case NODE_TYPES.table:
      return tableToMarkdown(node);

    case NODE_TYPES.image:
      return `![](${node.url || ""})`;

    default:
      return text || null;
  }
}

/**
 * Convert table node to markdown
 */
function tableToMarkdown(table: SlateElement): string {
  const rows = table.children as SlateElement[];
  if (rows.length === 0) return "";

  const lines: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = (row.children as SlateElement[]).map((cell) => textToMarkdown(cell.children));
    lines.push(`| ${cells.join(" | ")} |`);

    // Add separator after header row
    if (i === 0) {
      lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
    }
  }

  return lines.join("\n");
}

/**
 * Parse markdown string to Slate Value
 */
function parseMarkdown(markdown: string): Value {
  const nodes: SlateElement[] = [];
  const lines = markdown.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push({
        type: NODE_TYPES.codeBlock,
        language,
        children: codeLines.map((codeLine) => ({
          type: NODE_TYPES.codeLine,
          children: [{ text: codeLine }],
        })),
      });
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const type =
        level === 1 ? NODE_TYPES.heading1 : level === 2 ? NODE_TYPES.heading2 : NODE_TYPES.heading3;
      nodes.push({
        type,
        children: parseInlineText(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      nodes.push({
        type: NODE_TYPES.blockquote,
        children: parseInlineText(line.slice(2)),
      });
      i++;
      continue;
    }

    // Checklist items
    const checkMatch = line.match(/^\s*[-*]\s+\[([ x])\]\s+(.*)$/);
    if (checkMatch) {
      nodes.push({
        type: NODE_TYPES.todoList,
        checked: checkMatch[1] === "x",
        children: parseInlineText(checkMatch[2]),
      });
      i++;
      continue;
    }

    // Bullet list items
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      nodes.push({
        type: NODE_TYPES.listItem,
        children: parseInlineText(bulletMatch[1]),
      });
      i++;
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numberedMatch) {
      nodes.push({
        type: NODE_TYPES.listItem,
        children: parseInlineText(numberedMatch[1]),
      });
      i++;
      continue;
    }

    // Images
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      nodes.push({
        type: NODE_TYPES.image,
        url: imageMatch[2],
        children: [{ text: "" }],
      });
      i++;
      continue;
    }

    // Tables (simple detection)
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableRows: SlateElement[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const rowLine = lines[i];
        // Skip separator row
        if (rowLine.match(/^\|[\s-:|]+\|$/)) {
          i++;
          continue;
        }
        const cells = rowLine
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim());
        const isHeader = tableRows.length === 0;
        tableRows.push({
          type: NODE_TYPES.tableRow,
          children: cells.map((cell) => ({
            type: isHeader ? NODE_TYPES.tableCellHeader : NODE_TYPES.tableCell,
            children: parseInlineText(cell),
          })),
        });
        i++;
      }
      if (tableRows.length > 0) {
        nodes.push({
          type: NODE_TYPES.table,
          children: tableRows,
        });
      }
      continue;
    }

    // Empty lines - skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraphs
    nodes.push({
      type: NODE_TYPES.paragraph,
      children: parseInlineText(line),
    });
    i++;
  }

  // Return at least one empty paragraph if no nodes
  if (nodes.length === 0) {
    return [{ type: NODE_TYPES.paragraph, children: [{ text: "" }] }];
  }

  return nodes as Value;
}

/**
 * Parse inline markdown text with marks (bold, italic, code, etc.)
 */
function parseInlineText(text: string): SlateText[] {
  const result: SlateText[] = [];

  // Simple regex-based parsing for inline marks
  // This is a basic implementation - could be enhanced for nested marks
  let remaining = text;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      result.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      result.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push({ text: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Strikethrough
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      result.push({ text: strikeMatch[1], strikethrough: true });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Plain text up to next special char or end
    const plainMatch = remaining.match(/^[^*`~]+/);
    if (plainMatch) {
      result.push({ text: plainMatch[0] });
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    // Single special character that didn't match a pattern
    result.push({ text: remaining[0] });
    remaining = remaining.slice(1);
  }

  // Return at least one empty text node
  if (result.length === 0) {
    return [{ text: "" }];
  }

  return result;
}

// ============================================================================
// File operations (browser-only)
// ============================================================================

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
 * Handle complete import flow - returns Slate Value
 */
export function handleMarkdownImport(): Promise<Value | null> {
  return new Promise((resolve) => {
    triggerMarkdownImport(async (file) => {
      try {
        const markdown = await readMarkdownFile(file);
        const value = markdownToValue(markdown);
        toast.success(`Imported ${file.name}`);
        resolve(value);
      } catch (_error) {
        toast.error("Failed to import markdown file");
        resolve(null);
      }
    });
  });
}

/**
 * Read markdown file for preview
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
 * Handle complete export flow
 */
export function handleMarkdownExport(value: Value, documentTitle: string): void {
  try {
    const markdown = valueToMarkdown(value);
    const filename = documentTitle.toLowerCase().replace(/\s+/g, "-");
    downloadMarkdown(markdown, filename);
    toast.success("Document exported as markdown");
  } catch (_error) {
    toast.error("Failed to export document");
  }
}
