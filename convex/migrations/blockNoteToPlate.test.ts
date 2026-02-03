/**
 * Unit tests for BlockNote to Plate format converter
 */

import { describe, expect, it } from "vitest";
import {
  blockNoteToSlate,
  convertToSlate,
  proseMirrorToSlate,
  type SlateValue,
} from "./blockNoteToPlate";

describe("BlockNote to Plate Converter", () => {
  describe("blockNoteToSlate", () => {
    it("converts paragraphs", () => {
      const blockNote = [
        {
          type: "paragraph",
          content: [{ type: "text" as const, text: "Hello world" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("p");
      expect(result[0].children).toContainEqual({ text: "Hello world" });
    });

    it("converts headings with levels", () => {
      const blockNote = [
        {
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text" as const, text: "H1" }],
        },
        {
          type: "heading",
          props: { level: 2 },
          content: [{ type: "text" as const, text: "H2" }],
        },
        {
          type: "heading",
          props: { level: 3 },
          content: [{ type: "text" as const, text: "H3" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result[0].type).toBe("h1");
      expect(result[1].type).toBe("h2");
      expect(result[2].type).toBe("h3");
    });

    it("converts bullet list items", () => {
      const blockNote = [
        {
          type: "bulletListItem",
          content: [{ type: "text" as const, text: "Item 1" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("ul");
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0]).toMatchObject({
        type: "li",
        children: [{ text: "Item 1" }],
      });
    });

    it("converts numbered list items", () => {
      const blockNote = [
        {
          type: "numberedListItem",
          content: [{ type: "text" as const, text: "Item 1" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("ol");
    });

    it("converts checklist items", () => {
      const blockNote = [
        {
          type: "checkListItem",
          props: { checked: true },
          content: [{ type: "text" as const, text: "Done" }],
        },
        {
          type: "checkListItem",
          props: { checked: false },
          content: [{ type: "text" as const, text: "Todo" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result[0].type).toBe("action_item");
      expect(result[0].checked).toBe(true);
      expect(result[1].type).toBe("action_item");
      expect(result[1].checked).toBe(false);
    });

    it("converts code blocks", () => {
      const blockNote = [
        {
          type: "codeBlock",
          props: { language: "typescript" },
          content: [{ type: "text" as const, text: "const x = 1;\nconst y = 2;" }],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("code_block");
      expect(result[0].language).toBe("typescript");
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0]).toMatchObject({
        type: "code_line",
        children: [{ text: "const x = 1;" }],
      });
    });

    it("converts images", () => {
      const blockNote = [
        {
          type: "image",
          props: { url: "https://example.com/image.png" },
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("img");
      expect(result[0].url).toBe("https://example.com/image.png");
    });

    it("converts text styles", () => {
      const blockNote = [
        {
          type: "paragraph",
          content: [
            { type: "text" as const, text: "normal " },
            { type: "text" as const, text: "bold", styles: { bold: true } },
            { type: "text" as const, text: " ", styles: {} },
            { type: "text" as const, text: "italic", styles: { italic: true } },
            { type: "text" as const, text: " ", styles: {} },
            { type: "text" as const, text: "code", styles: { code: true } },
          ],
        },
      ];

      const result = blockNoteToSlate(blockNote);

      expect(result[0].children).toContainEqual({ text: "normal " });
      expect(result[0].children).toContainEqual({ text: "bold", bold: true });
      expect(result[0].children).toContainEqual({ text: "italic", italic: true });
      expect(result[0].children).toContainEqual({ text: "code", code: true });
    });

    it("handles empty content", () => {
      const blockNote = [{ type: "paragraph" }];

      const result = blockNoteToSlate(blockNote);

      expect(result).toHaveLength(1);
      expect(result[0].children).toContainEqual({ text: "" });
    });
  });

  describe("proseMirrorToSlate", () => {
    it("converts doc with paragraphs", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("p");
      expect(result[0].children).toContainEqual({ text: "Hello world" });
    });

    it("converts headings", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Title" }],
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result[0].type).toBe("h2");
    });

    it("converts bullet lists", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Item" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result[0].type).toBe("ul");
      expect(result[0].children[0].type).toBe("li");
    });

    it("converts marks to text styles", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "bold", marks: [{ type: "bold" }] },
              { type: "text", text: "italic", marks: [{ type: "italic" }] },
              { type: "text", text: "code", marks: [{ type: "code" }] },
            ],
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result[0].children).toContainEqual({ text: "bold", bold: true });
      expect(result[0].children).toContainEqual({ text: "italic", italic: true });
      expect(result[0].children).toContainEqual({ text: "code", code: true });
    });

    it("handles empty doc", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("p");
    });

    it("converts code blocks", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "codeBlock",
            attrs: { language: "javascript" },
            content: [{ type: "text", text: "const x = 1;" }],
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result[0].type).toBe("code_block");
      expect(result[0].language).toBe("javascript");
    });

    it("converts images", () => {
      const proseMirror = {
        type: "doc" as const,
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/img.png" },
          },
        ],
      };

      const result = proseMirrorToSlate(proseMirror);

      expect(result[0].type).toBe("img");
      expect(result[0].url).toBe("https://example.com/img.png");
    });
  });

  describe("convertToSlate", () => {
    it("detects and converts ProseMirror format", () => {
      const proseMirror = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Test" }],
          },
        ],
      };

      const result = convertToSlate(proseMirror);

      expect(result[0].type).toBe("p");
    });

    it("detects and converts BlockNote format", () => {
      const blockNote = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Test" }],
        },
      ];

      const result = convertToSlate(blockNote);

      expect(result[0].type).toBe("p");
    });

    it("returns Slate format unchanged", () => {
      const slate: SlateValue = [
        {
          type: "p",
          children: [{ text: "Test" }],
        },
      ];

      const result = convertToSlate(slate);

      expect(result).toEqual(slate);
    });

    it("handles null/undefined content", () => {
      expect(convertToSlate(null)).toEqual([{ type: "p", children: [{ text: "" }] }]);
      expect(convertToSlate(undefined)).toEqual([{ type: "p", children: [{ text: "" }] }]);
    });

    it("handles unknown format", () => {
      const unknown = { random: "data" };

      const result = convertToSlate(unknown);

      expect(result).toEqual([{ type: "p", children: [{ text: "" }] }]);
    });
  });
});
