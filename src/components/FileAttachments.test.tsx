import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FileAttachments } from "./FileAttachments";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock toast
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock confirm dialog
vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, title }: any) =>
    isOpen ? (
      <div role="dialog">
        <h1>{title}</h1>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

describe("FileAttachments", () => {
  const mockAddAttachment = vi.fn();
  const mockRemoveAttachment = vi.fn();
  const mockGenerateUploadUrl = vi.fn();
  const issueId = "issue-123" as Id<"issues">;

  const mockAttachments = [
    {
      storageId: "storage-1" as Id<"_storage">,
      filename: "test-image.png",
      url: "https://example.com/test-image.png",
      uploadedAt: Date.now(),
      uploadedBy: "user-1" as Id<"users">,
    },
    {
      storageId: "storage-2" as Id<"_storage">,
      filename: "document.pdf",
      url: "https://example.com/document.pdf",
      uploadedAt: Date.now(),
      uploadedBy: "user-1" as Id<"users">,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMutation).mockImplementation((apiCall: any) => {
      // We can't easily check the function reference here without importing api,
      // but for this unit test it's fine to return generic mocks or specific ones if needed.
      return mockRemoveAttachment as any;
    });

    vi.mocked(useQuery).mockReturnValue(mockAttachments as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render list of attachments", () => {
    render(<FileAttachments issueId={issueId} />);

    expect(screen.getByText("Attachments (2)")).toBeInTheDocument();
    expect(screen.getByText("test-image.png")).toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("should render download and delete actions", () => {
    render(<FileAttachments issueId={issueId} />);

    // Check Download links
    // They should be accessible by their accessible name (from sr-only span)
    expect(screen.getByRole("link", { name: "Download test-image.png" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download document.pdf" })).toBeInTheDocument();

    // Check Delete buttons
    // They should be accessible by aria-label
    const deleteButtons = screen.getAllByRole("button", { name: "Delete attachment" });
    expect(deleteButtons).toHaveLength(2);
  });
});
