/**
 * Plate Editor Plugin Configuration
 *
 * Configures all Plate plugins for the document editor:
 * - Basic nodes (headings, paragraphs, blockquotes)
 * - Basic marks (bold, italic, underline, strikethrough, code)
 * - Lists (bullet, numbered, todo)
 * - Code blocks with syntax highlighting
 * - Tables
 * - Media (images)
 * - Drag and drop
 */

// Basic nodes and marks
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
// Code blocks
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@platejs/code-block/react";
// DnD (no /react export)
import { DndPlugin } from "@platejs/dnd";
// Lists
import { ListPlugin } from "@platejs/list/react";
// Media
import { ImagePlugin } from "@platejs/media/react";
// Slash command (no /react export, uses Base prefix)
import { BaseSlashPlugin } from "@platejs/slash-command";
// Tables
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react";
// Core
import { BaseParagraphPlugin } from "platejs";

/**
 * All plugins for the Plate editor
 * Order matters: plugins are applied in order
 */
export const platePlugins = [
  // Core
  BaseParagraphPlugin,

  // Basic formatting marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,

  // Block elements
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,

  // Lists
  ListPlugin,

  // Code blocks
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,

  // Tables
  TablePlugin,
  TableRowPlugin,
  TableCellPlugin,
  TableCellHeaderPlugin,

  // Media
  ImagePlugin,

  // Interaction
  DndPlugin,
  BaseSlashPlugin,
];

/**
 * Initial empty document value
 */
export const initialValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

/**
 * Slate node types used in our editor
 */
export const NODE_TYPES = {
  // Blocks
  paragraph: "p",
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  blockquote: "blockquote",
  codeBlock: "code_block",
  codeLine: "code_line",

  // Lists
  bulletedList: "ul",
  numberedList: "ol",
  todoList: "todo_li",
  listItem: "li",

  // Tables
  table: "table",
  tableRow: "tr",
  tableCell: "td",
  tableCellHeader: "th",

  // Media
  image: "img",

  // Marks (inline formatting)
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  code: "code",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
