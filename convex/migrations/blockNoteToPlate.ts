/**
 * BlockNote to Plate Format Converter
 *
 * Converts document content from BlockNote/ProseMirror format to Slate/Plate format.
 * Used during document migration from the old editor to the new Plate editor.
 *
 * BlockNote format:
 * - type: "paragraph", "heading", "bulletListItem", etc.
 * - props: { level: 1, checked: true, ... }
 * - content: [{ type: "text", text: "...", styles: {} }]
 * - children: [] (nested blocks)
 *
 * ProseMirror format (stored in documentVersions.snapshot):
 * - type: "doc", "paragraph", "heading", etc.
 * - attrs: { level: 1, ... }
 * - content: [] (children nodes)
 * - marks: [{ type: "bold" }]
 * - text: "..." (for text nodes)
 *
 * Plate/Slate format:
 * - type: "p", "h1", "ul", "li", etc.
 * - children: [{ text: "...", bold: true }]
 */

// Slate/Plate node types (matching src/lib/plate/plugins.ts)
const NODE_TYPES = {
  paragraph: "p",
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  blockquote: "blockquote",
  bulletedList: "ul",
  numberedList: "ol",
  listItem: "li",
  todoList: "action_item",
  codeBlock: "code_block",
  codeLine: "code_line",
  table: "table",
  tableRow: "tr",
  tableCell: "td",
  tableCellHeader: "th",
  image: "img",
} as const;

// =============================================================================
// Type definitions
// =============================================================================

interface BlockNoteTextSpan {
  type: "text";
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
}

interface BlockNoteBlock {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: BlockNoteTextSpan[];
  children?: BlockNoteBlock[];
}

interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  marks?: ProseMirrorMark[];
  text?: string;
}

interface ProseMirrorSnapshot {
  type: "doc";
  content?: ProseMirrorNode[];
}

interface SlateText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface SlateElement {
  type: string;
  children: (SlateElement | SlateText)[];
  url?: string;
  language?: string;
  checked?: boolean;
}

export type SlateValue = SlateElement[];

// =============================================================================
// BlockNote to Slate conversion
// =============================================================================

/**
 * Convert BlockNote content to Slate value
 */
export function blockNoteToSlate(blocks: BlockNoteBlock[]): SlateValue {
  return blocks.flatMap(convertBlockNoteBlock);
}

function convertBlockNoteBlock(block: BlockNoteBlock): SlateElement[] {
  const children = convertBlockNoteContent(block.content);

  switch (block.type) {
    case "paragraph":
      return [{ type: NODE_TYPES.paragraph, children }];

    case "heading": {
      const level = (block.props?.level as number) || 1;
      const type =
        level === 1 ? NODE_TYPES.heading1 : level === 2 ? NODE_TYPES.heading2 : NODE_TYPES.heading3;
      return [{ type, children }];
    }

    case "bulletListItem": {
      const listItem: SlateElement = { type: NODE_TYPES.listItem, children };
      // Include nested children
      if (block.children && block.children.length > 0) {
        const nestedItems = block.children.flatMap(convertBlockNoteBlock);
        return [
          {
            type: NODE_TYPES.bulletedList,
            children: [listItem, ...nestedItems],
          },
        ];
      }
      return [{ type: NODE_TYPES.bulletedList, children: [listItem] }];
    }

    case "numberedListItem": {
      const listItem: SlateElement = { type: NODE_TYPES.listItem, children };
      if (block.children && block.children.length > 0) {
        const nestedItems = block.children.flatMap(convertBlockNoteBlock);
        return [
          {
            type: NODE_TYPES.numberedList,
            children: [listItem, ...nestedItems],
          },
        ];
      }
      return [{ type: NODE_TYPES.numberedList, children: [listItem] }];
    }

    case "checkListItem": {
      const checked = (block.props?.checked as boolean) || false;
      return [{ type: NODE_TYPES.todoList, checked, children }];
    }

    case "codeBlock": {
      const language = (block.props?.language as string) || "";
      const codeLines = children
        .map((child) => ("text" in child ? child.text : ""))
        .join("")
        .split("\n")
        .map((line) => ({
          type: NODE_TYPES.codeLine,
          children: [{ text: line }],
        }));
      return [
        {
          type: NODE_TYPES.codeBlock,
          language,
          children:
            codeLines.length > 0
              ? codeLines
              : [{ type: NODE_TYPES.codeLine, children: [{ text: "" }] }],
        },
      ];
    }

    case "image": {
      const url = (block.props?.url as string) || "";
      return [{ type: NODE_TYPES.image, url, children: [{ text: "" }] }];
    }

    case "table": {
      // BlockNote tables have rows in children
      const tableRows = (block.children || []).map((row, rowIndex) => {
        const cells = (row.children || []).map((cell) => {
          const cellContent = convertBlockNoteContent(cell.content);
          const cellType = rowIndex === 0 ? NODE_TYPES.tableCellHeader : NODE_TYPES.tableCell;
          return { type: cellType, children: cellContent };
        });
        return { type: NODE_TYPES.tableRow, children: cells };
      });
      return [{ type: NODE_TYPES.table, children: tableRows }];
    }

    default:
      // Fallback to paragraph for unknown types
      return [{ type: NODE_TYPES.paragraph, children }];
  }
}

function convertBlockNoteContent(content?: BlockNoteTextSpan[]): (SlateElement | SlateText)[] {
  if (!content || content.length === 0) {
    return [{ text: "" }];
  }

  return content.map((span) => {
    const slateText: SlateText = { text: span.text || "" };

    if (span.styles) {
      if (span.styles.bold) slateText.bold = true;
      if (span.styles.italic) slateText.italic = true;
      if (span.styles.underline) slateText.underline = true;
      if (span.styles.strikethrough) slateText.strikethrough = true;
      if (span.styles.code) slateText.code = true;
    }

    return slateText;
  });
}

// =============================================================================
// ProseMirror to Slate conversion
// =============================================================================

/**
 * Convert ProseMirror snapshot to Slate value
 */
export function proseMirrorToSlate(snapshot: ProseMirrorSnapshot): SlateValue {
  if (!snapshot.content || snapshot.content.length === 0) {
    return [{ type: NODE_TYPES.paragraph, children: [{ text: "" }] }];
  }

  return snapshot.content.flatMap(convertProseMirrorNode);
}

function convertProseMirrorNode(node: ProseMirrorNode): SlateElement[] {
  // Text nodes are handled by the parent
  if (node.type === "text") {
    return [];
  }

  // Get children by recursively processing content
  const children = getProseMirrorChildren(node);

  switch (node.type) {
    case "paragraph":
      return [{ type: NODE_TYPES.paragraph, children }];

    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const type =
        level === 1 ? NODE_TYPES.heading1 : level === 2 ? NODE_TYPES.heading2 : NODE_TYPES.heading3;
      return [{ type, children }];
    }

    case "bulletList": {
      const items = (node.content || []).map((item) => {
        const itemChildren = getProseMirrorChildren(item);
        return { type: NODE_TYPES.listItem, children: itemChildren };
      });
      return [{ type: NODE_TYPES.bulletedList, children: items }];
    }

    case "orderedList": {
      const items = (node.content || []).map((item) => {
        const itemChildren = getProseMirrorChildren(item);
        return { type: NODE_TYPES.listItem, children: itemChildren };
      });
      return [{ type: NODE_TYPES.numberedList, children: items }];
    }

    case "listItem": {
      // listItem content is usually wrapped in paragraph
      return [{ type: NODE_TYPES.listItem, children }];
    }

    case "taskList": {
      const items = (node.content || []).map((item) => {
        const checked = (item.attrs?.checked as boolean) || false;
        const itemChildren = getProseMirrorChildren(item);
        return { type: NODE_TYPES.todoList, checked, children: itemChildren };
      });
      return items;
    }

    case "blockquote":
      return [{ type: NODE_TYPES.blockquote, children }];

    case "codeBlock": {
      const language = (node.attrs?.language as string) || "";
      const codeText = children.map((child) => ("text" in child ? child.text : "")).join("");
      const codeLines = codeText.split("\n").map((line) => ({
        type: NODE_TYPES.codeLine,
        children: [{ text: line }],
      }));
      return [
        {
          type: NODE_TYPES.codeBlock,
          language,
          children:
            codeLines.length > 0
              ? codeLines
              : [{ type: NODE_TYPES.codeLine, children: [{ text: "" }] }],
        },
      ];
    }

    case "image": {
      const url = (node.attrs?.src as string) || "";
      return [{ type: NODE_TYPES.image, url, children: [{ text: "" }] }];
    }

    case "table": {
      const rows = (node.content || []).map((row, rowIndex) => {
        const cells = (row.content || []).map((cell) => {
          const cellChildren = getProseMirrorChildren(cell);
          const cellType = rowIndex === 0 ? NODE_TYPES.tableCellHeader : NODE_TYPES.tableCell;
          return { type: cellType, children: cellChildren };
        });
        return { type: NODE_TYPES.tableRow, children: cells };
      });
      return [{ type: NODE_TYPES.table, children: rows }];
    }

    case "horizontalRule":
      // Skip horizontal rules or convert to paragraph
      return [{ type: NODE_TYPES.paragraph, children: [{ text: "---" }] }];

    default:
      // Unknown node type - try to extract text content
      if (children.length > 0) {
        return [{ type: NODE_TYPES.paragraph, children }];
      }
      return [];
  }
}

function getProseMirrorChildren(node: ProseMirrorNode): (SlateElement | SlateText)[] {
  if (!node.content || node.content.length === 0) {
    return [{ text: "" }];
  }

  const children: (SlateElement | SlateText)[] = [];

  for (const child of node.content) {
    if (child.type === "text") {
      const slateText: SlateText = { text: child.text || "" };

      // Convert marks to Slate text properties
      if (child.marks) {
        for (const mark of child.marks) {
          switch (mark.type) {
            case "bold":
            case "strong":
              slateText.bold = true;
              break;
            case "italic":
            case "em":
              slateText.italic = true;
              break;
            case "underline":
              slateText.underline = true;
              break;
            case "strike":
            case "strikethrough":
              slateText.strikethrough = true;
              break;
            case "code":
              slateText.code = true;
              break;
          }
        }
      }

      children.push(slateText);
    } else {
      // Recursively convert nested elements
      const converted = convertProseMirrorNode(child);
      children.push(...converted);
    }
  }

  return children.length > 0 ? children : [{ text: "" }];
}

// =============================================================================
// Auto-detection and conversion
// =============================================================================

/**
 * Detect content format and convert to Slate
 */
export function convertToSlate(content: unknown): SlateValue {
  if (!content) {
    return [{ type: NODE_TYPES.paragraph, children: [{ text: "" }] }];
  }

  // ProseMirror snapshot format
  if (isProseMirrorSnapshot(content)) {
    return proseMirrorToSlate(content);
  }

  // BlockNote format (array of blocks)
  if (isBlockNoteContent(content)) {
    return blockNoteToSlate(content);
  }

  // Already Slate format
  if (isSlateValue(content)) {
    return content;
  }

  // Unknown format - return empty document
  return [{ type: NODE_TYPES.paragraph, children: [{ text: "" }] }];
}

function isProseMirrorSnapshot(content: unknown): content is ProseMirrorSnapshot {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    (content as { type: unknown }).type === "doc"
  );
}

function isBlockNoteContent(content: unknown): content is BlockNoteBlock[] {
  if (!Array.isArray(content) || content.length === 0) {
    return false;
  }

  const first = content[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "type" in first &&
    typeof first.type === "string" &&
    // BlockNote blocks have specific types
    [
      "paragraph",
      "heading",
      "bulletListItem",
      "numberedListItem",
      "checkListItem",
      "codeBlock",
      "image",
      "table",
    ].includes(first.type)
  );
}

function isSlateValue(content: unknown): content is SlateValue {
  if (!Array.isArray(content) || content.length === 0) {
    return false;
  }

  const first = content[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "type" in first &&
    "children" in first &&
    Array.isArray(first.children)
  );
}
