import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentHeader } from "./DocumentHeader";
import type { Doc } from "@convex/_generated/dataModel";
import { TooltipProvider } from "@/components/ui/Tooltip";

// Mock PresenceIndicator
vi.mock("./PresenceIndicator", () => ({
  PresenceIndicator: () => <div data-testid="presence-indicator" />,
}));

const mockDocument = {
  _id: "doc123",
  _creationTime: Date.now(),
  title: "Test Document",
  content: "Test content",
  isPublic: false,
  organizationId: "org123",
  createdBy: "user123",
  updatedAt: Date.now(),
  creatorName: "Test User",
  isOwner: true,
} as unknown as Doc<"documents"> & { creatorName: string; isOwner: boolean };

describe("DocumentHeader", () => {
  it("renders without crashing", () => {
    render(
      <TooltipProvider>
        <DocumentHeader
          document={mockDocument}
          userId="user123"
          versionCount={5}
          onTitleEdit={vi.fn()}
          onTogglePublic={vi.fn()}
          onImportMarkdown={vi.fn()}
          onExportMarkdown={vi.fn()}
          onShowVersionHistory={vi.fn()}
          editorReady={true}
        />
      </TooltipProvider>
    );
    expect(screen.getByText("Test Document")).toBeInTheDocument();
  });

  it("renders buttons with aria-labels", () => {
    render(
      <TooltipProvider>
        <DocumentHeader
          document={mockDocument}
          userId="user123"
          versionCount={5}
          onTitleEdit={vi.fn()}
          onTogglePublic={vi.fn()}
          onImportMarkdown={vi.fn()}
          onExportMarkdown={vi.fn()}
          onShowVersionHistory={vi.fn()}
          editorReady={true}
        />
      </TooltipProvider>
    );
    expect(screen.getByRole("button", { name: "Version history" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import from Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export as Markdown" })).toBeInTheDocument();
  });
});
