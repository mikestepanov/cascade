import JSZip from "jszip";
import { toast } from "sonner";
import type { BlockNoteEditor } from "@blocknote/core";
import { exportToMarkdown } from "./markdown";

/**
 * Batch markdown export utilities
 * Export multiple documents at once as a zip file
 */

interface Document {
  _id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  creatorName: string;
  isPublic: boolean;
}

interface DocumentWithEditor extends Document {
  editor?: BlockNoteEditor;
  markdown?: string;
}

/**
 * Add YAML frontmatter to markdown
 */
export function addFrontmatter(
  markdown: string,
  metadata: {
    title: string;
    created: string;
    updated: string;
    author: string;
    public: boolean;
    documentId?: string;
  },
): string {
  const frontmatter = `---
title: "${metadata.title}"
created: ${metadata.created}
updated: ${metadata.updated}
author: ${metadata.author}
public: ${metadata.public}
${metadata.documentId ? `documentId: ${metadata.documentId}` : ""}
---

`;

  return frontmatter + markdown;
}

/**
 * Export multiple documents as a zip file
 */
export async function exportDocumentsAsZip(
  documents: DocumentWithEditor[],
  projectName: string,
): Promise<void> {
  try {
    const zip = new JSZip();
    const folder = zip.folder(projectName) || zip;

    // Add README
    const readme = generateReadme(projectName, documents.length);
    folder.file("README.md", readme);

    // Process each document
    for (const doc of documents) {
      let markdown: string;

      if (doc.markdown) {
        markdown = doc.markdown;
      } else if (doc.editor) {
        markdown = await exportToMarkdown(doc.editor);
      } else {
        console.warn(`Skipping document ${doc.title} - no content available`);
        continue;
      }

      // Add frontmatter
      const withMetadata = addFrontmatter(markdown, {
        title: doc.title,
        created: new Date(doc.createdAt).toISOString(),
        updated: new Date(doc.updatedAt).toISOString(),
        author: doc.creatorName,
        public: doc.isPublic,
        documentId: doc._id,
      });

      // Clean filename
      const filename = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md";
      folder.file(filename, withMetadata);
    }

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-docs.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${documents.length} documents as ${projectName}-docs.zip`);
  } catch (error) {
    console.error("Failed to export documents:", error);
    toast.error("Failed to create export archive");
    throw error;
  }
}

/**
 * Generate README for exported documents
 */
function generateReadme(projectName: string, documentCount: number): string {
  const date = new Date().toISOString().split("T")[0];

  return `# ${projectName} - Documentation Export

**Exported**: ${date}
**Documents**: ${documentCount}

## Contents

This archive contains ${documentCount} markdown documents exported from Cascade.

Each document includes:
- YAML frontmatter with metadata (title, dates, author, visibility)
- Original document content in markdown format

## Editing Workflow

1. **Edit locally** with your favorite editor or AI tool
2. **Import back** to Cascade using the Import MD button
3. **Collaborate** - changes sync in real-time

## Using with CLI AI Tools

### Claude
\`\`\`bash
# Improve a document
claude "refactor this for clarity" document-name.md > improved.md

# Bulk improvements
for file in *.md; do
  claude "add examples" "$file" > "updated-$file"
done
\`\`\`

### Cursor / GitHub Copilot
\`\`\`bash
# Open in VS Code with AI
code .
# Use Ctrl+K to edit with AI
\`\`\`

## Metadata Format

Each file includes YAML frontmatter:
\`\`\`yaml
---
title: "Document Title"
created: 2024-01-15T10:30:00Z
updated: 2024-01-15T14:45:00Z
author: John Doe
public: true
documentId: abc123
---
\`\`\`

## Re-importing

To import edited documents back to Cascade:
1. Open the document in Cascade
2. Click "Import MD" button
3. Select the edited markdown file
4. Confirm import (this replaces the current content)

---

*Exported from Cascade - Collaborative Project Management*
`;
}

/**
 * Parse frontmatter from markdown
 */
export function parseFrontmatter(markdown: string): {
  metadata: Record<string, any> | null;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { metadata: null, content: markdown };
  }

  const [, frontmatterText, content] = match;
  const metadata: Record<string, any> = {};

  // Parse YAML-like frontmatter
  const lines = frontmatterText.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: any = line.slice(colonIndex + 1).trim();

    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Parse boolean
    if (value === "true" || value === "false") {
      value = value === "true";
    }

    metadata[key] = value;
  }

  return { metadata, content };
}

/**
 * Download JSZip package info
 * User needs to install: npm install jszip
 */
export function checkJSZipInstalled(): boolean {
  try {
    require("jszip");
    return true;
  } catch {
    return false;
  }
}
