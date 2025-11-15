import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IssueDetailModal } from "./IssueDetailModal";
import { useQuery, useMutation } from "convex/react";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock TimeTracker component
vi.mock("./TimeTracker", () => ({
  TimeTracker: ({ issueKey }: any) => <div>TimeTracker for {issueKey}</div>,
}));

describe("IssueDetailModal", () => {
  const mockUpdateIssue = vi.fn();
  const mockOnClose = vi.fn();
  const mockIssueId = "issue-123" as any;

  const mockIssue = {
    _id: mockIssueId,
    key: "TEST-123",
    title: "Fix authentication bug",
    description: "Users cannot login with valid credentials",
    type: "bug" as const,
    priority: "high" as const,
    status: "in-progress",
    assignee: { name: "John Doe" },
    reporter: { name: "Jane Smith" },
    labels: ["backend", "urgent"],
    estimatedHours: 8,
    loggedHours: 3.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue(mockUpdateIssue);
  });

  it("should show loading state when issue is undefined", () => {
    (useQuery as any).mockReturnValue(undefined);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByRole("generic")).toBeInTheDocument();
  });

  it("should render issue details", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText("TEST-123")).toBeInTheDocument();
    expect(screen.getByText(/Fix authentication bug/i)).toBeInTheDocument();
    expect(screen.getByText(/Users cannot login/i)).toBeInTheDocument();
  });

  it("should display issue metadata", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("in-progress")).toBeInTheDocument();
  });

  it("should display labels", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
  });

  it("should show correct type icon", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText("🐛")).toBeInTheDocument(); // Bug icon
  });

  it("should show priority badge with correct color", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const priorityBadge = screen.getByText("high");
    expect(priorityBadge.className).toContain("text-orange-600");
  });

  it("should render TimeTracker component", () => {
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText(/TimeTracker for TEST-123/i)).toBeInTheDocument();
  });

  it("should close modal when close button is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button", { name: "" });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should close modal when backdrop is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const backdrop = screen.getByText(/TEST-123/i)
      .closest(".fixed")?.previousSibling as HTMLElement;

    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("should enter edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("should allow editing title and description", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(/Add a description/i) as HTMLTextAreaElement;

    expect(titleInput.value).toBe("Fix authentication bug");
    expect(descriptionInput.value).toBe("Users cannot login with valid credentials");

    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "New description");

    expect(titleInput.value).toBe("New title");
    expect(descriptionInput.value).toBe("New description");
  });

  it("should call update mutation when Save is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);
    mockUpdateIssue.mockResolvedValue(undefined);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateIssue).toHaveBeenCalledWith({
        id: mockIssueId,
        title: "Updated title",
        description: "Users cannot login with valid credentials",
      });
    });
  });

  it("should exit edit mode when Cancel is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Save/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    });
  });

  it("should show No description provided when description is empty", () => {
    const issueWithoutDescription = { ...mockIssue, description: "" };
    (useQuery as any).mockReturnValue(issueWithoutDescription);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText(/No description provided/i)).toBeInTheDocument();
  });

  it("should show Unassigned when no assignee", () => {
    const issueWithoutAssignee = { ...mockIssue, assignee: null };
    (useQuery as any).mockReturnValue(issueWithoutAssignee);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.getByText(/Unassigned/i)).toBeInTheDocument();
  });

  it("should not show Labels section when no labels", () => {
    const issueWithoutLabels = { ...mockIssue, labels: [] };
    (useQuery as any).mockReturnValue(issueWithoutLabels);

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    expect(screen.queryByText(/Labels/i)).not.toBeInTheDocument();
  });

  it("should handle save error gracefully", async () => {
    const user = userEvent.setup();
    (useQuery as any).mockReturnValue(mockIssue);
    mockUpdateIssue.mockRejectedValue(new Error("Network error"));

    const { toast } = await import("sonner");

    render(<IssueDetailModal issueId={mockIssueId} onClose={mockOnClose} />);

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "New title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update issue");
    });
  });
});
