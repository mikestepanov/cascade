import { describe, expect, it } from "vitest";
import { addFrontmatter, parseFrontmatter } from "./markdown-batch";

describe("markdown-batch utilities", () => {
  describe("addFrontmatter", () => {
    it("should add YAML frontmatter to markdown", () => {
      const markdown = "# Heading\n\nContent here.";
      const metadata = {
        title: "Test Document",
        created: "2024-01-15T10:30:00Z",
        updated: "2024-01-15T14:45:00Z",
        author: "John Doe",
        public: true,
        documentId: "abc123",
      };

      const result = addFrontmatter(markdown, metadata);

      expect(result).toContain('title: "Test Document"');
      expect(result).toContain("created: 2024-01-15T10:30:00Z");
      expect(result).toContain("updated: 2024-01-15T14:45:00Z");
      expect(result).toContain("author: John Doe");
      expect(result).toContain("public: true");
      expect(result).toContain("documentId: abc123");
      expect(result).toContain("# Heading");
      expect(result).toContain("Content here.");
    });

    it("should handle minimal metadata", () => {
      const markdown = "Content";
      const metadata = {
        title: "Simple Doc",
        created: "2024-01-01",
        updated: "2024-01-02",
        author: "Test",
        public: false,
      };

      const result = addFrontmatter(markdown, metadata);

      expect(result).toContain('title: "Simple Doc"');
      expect(result).toContain("public: false");
      expect(result).toContain("Content");
    });

    it("should omit optional documentId if not provided", () => {
      const markdown = "Content";
      const metadata = {
        title: "Doc",
        created: "2024-01-01",
        updated: "2024-01-02",
        author: "Test",
        public: true,
      };

      const result = addFrontmatter(markdown, metadata);

      expect(result).not.toContain("documentId:");
    });

    it("should preserve markdown formatting", () => {
      const markdown = `# Heading

## Subheading

- List item 1
- List item 2

\`\`\`javascript
const x = 1;
\`\`\``;

      const metadata = {
        title: "Code Doc",
        created: "2024-01-01",
        updated: "2024-01-02",
        author: "Dev",
        public: true,
      };

      const result = addFrontmatter(markdown, metadata);

      expect(result).toContain("# Heading");
      expect(result).toContain("## Subheading");
      expect(result).toContain("- List item 1");
      expect(result).toContain("```javascript");
    });
  });

  describe("parseFrontmatter", () => {
    it("should parse YAML frontmatter", () => {
      const markdown = `---
title: "Test Document"
created: 2024-01-15T10:30:00Z
updated: 2024-01-15T14:45:00Z
author: John Doe
public: true
documentId: abc123
---

# Heading

Content here.`;

      const result = parseFrontmatter(markdown);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.title).toBe("Test Document");
      expect(result.metadata?.created).toBe("2024-01-15T10:30:00Z");
      expect(result.metadata?.updated).toBe("2024-01-15T14:45:00Z");
      expect(result.metadata?.author).toBe("John Doe");
      expect(result.metadata?.public).toBe(true);
      expect(result.metadata?.documentId).toBe("abc123");
      expect(result.content).toBe("# Heading\n\nContent here.");
    });

    it("should handle markdown without frontmatter", () => {
      const markdown = "# Heading\n\nContent without frontmatter.";

      const result = parseFrontmatter(markdown);

      expect(result.metadata).toBeNull();
      expect(result.content).toBe(markdown);
    });

    it("should parse boolean values correctly", () => {
      const markdown = `---
public: true
archived: false
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.metadata?.public).toBe(true);
      expect(result.metadata?.archived).toBe(false);
    });

    it("should remove quotes from string values", () => {
      const markdown = `---
title: "Quoted Title"
author: "John Doe"
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.metadata?.title).toBe("Quoted Title");
      expect(result.metadata?.author).toBe("John Doe");
    });

    it("should handle empty frontmatter", () => {
      const markdown = `---

---

Content`;

      const result = parseFrontmatter(markdown);

      // Empty frontmatter should parse successfully
      expect(result.metadata).toBeDefined();
      expect(Object.keys(result.metadata || {}).length).toBe(0);
      expect(result.content).toBe("Content");
    });

    it("should handle multiline values", () => {
      const markdown = `---
title: "Test"
description: This is a description
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.metadata?.title).toBe("Test");
      expect(result.metadata?.description).toContain("This is a description");
    });
  });

  describe("roundtrip conversion", () => {
    it("should preserve content through add and parse", () => {
      const originalMarkdown = "# Test\n\nContent here.";
      const metadata = {
        title: "Test",
        created: "2024-01-01",
        updated: "2024-01-02",
        author: "John",
        public: true,
      };

      const withFrontmatter = addFrontmatter(originalMarkdown, metadata);
      const parsed = parseFrontmatter(withFrontmatter);

      expect(parsed.content).toBe(originalMarkdown);
      expect(parsed.metadata?.title).toBe(metadata.title);
      expect(parsed.metadata?.author).toBe(metadata.author);
      expect(parsed.metadata?.public).toBe(metadata.public);
    });
  });
});
