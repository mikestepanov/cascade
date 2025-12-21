import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { IssueDetailModal } from "./IssueDetailModal";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock toast utilities
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock company context
vi.mock("@/hooks/useCompanyContext", () => ({
  useCompany: vi.fn(() => ({
    companySlug: "test-company",
    companyName: "Test Company",
    billingEnabled: false,
  })),
}));

// Mock accessibility utilities
vi.mock("@/lib/accessibility", () => ({
  handleKeyboardClick: vi.fn((callback) => callback),
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", () => ({
  getTypeIcon: vi.fn((type: string) => {
    const icons = { bug: "🐛", task: "✓", story: "📖", epic: "🎯" };
    return icons[type as keyof typeof icons] || "📄";
  }),
  getPriorityColor: vi.fn((priority: string, type: string) => {
    if (type === "badge") {
      const colors = {
        urgent: "bg-red-100 text-red-800",
        high: "bg-orange-100 text-orange-800",
        medium: "bg-yellow-100 text-yellow-800",
        low: "bg-green-100 text-green-800",
      };
      return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
    }
    return "";
  }),
}));

// Mock child components
vi.mock("./TimeTracker", () => ({
  TimeTracker: ({ issueKey }: { issueKey: string }) => <div>TimeTracker for {issueKey}</div>,
}));

vi.mock("./CustomFieldValues", () => ({
  CustomFieldValues: () => <div>CustomFieldValues</div>,
}));

vi.mock("./FileAttachments", () => ({
  FileAttachments: () => <div>FileAttachments</div>,
}));

vi.mock("./IssueComments", () => ({
  IssueComments: () => <div>IssueComments</div>,
}));

vi.mock("./IssueDependencies", () => ({
  IssueDependencies: () => <div>IssueDependencies</div>,
}));

vi.mock("./IssueWatchers", () => ({
  IssueWatchers: () => <div>IssueWatchers</div>,
}));

describe("IssueDetailModal", () => {
  const mockUpdateIssue = vi.fn();
  const _mockCreateIssue = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockIssueId = "issue-123" as Id<"issues">;

  const renderModal = () =>
    render(<IssueDetailModal issueId={mockIssueId} open={true} onOpenChange={mockOnOpenChange} />);

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
    storyPoints: 5,
    projectId: "project-123" as Id<"projects">,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as vi.Mock).mockReturnValue(mockUpdateIssue);
  });

  it("should show loading state when issue is undefined", () => {
    (useQuery as vi.Mock).mockReturnValue(undefined);

    renderModal();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render issue details", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("TEST-123")).toBeInTheDocument();
    expect(screen.getByText(/Fix authentication bug/i)).toBeInTheDocument();
    expect(screen.getByText(/Users cannot login/i)).toBeInTheDocument();
  });

  it("should display issue metadata", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("in-progress")).toBeInTheDocument();
  });

  it("should display labels", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
  });

  it("should show correct type icon", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("🐛")).toBeInTheDocument(); // Bug icon
  });

  it("should show priority badge with correct color", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    const priorityBadge = screen.getByText("high");
    expect(priorityBadge.className).toContain("bg-orange-100");
    expect(priorityBadge.className).toContain("text-orange-800");
  });

  it("should render TimeTracker component", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText(/Time Tracking/i)).toBeInTheDocument();
  });

  it("should close modal when close button is clicked", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    // Radix Dialog provides a close button with "Close" text in sr-only span
    const closeButton = screen.getByRole("button", { name: /^Close$/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should close modal when close button is clicked via dialog-close", async () => {
    const user = userEvent.setup();
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    // Radix Dialog uses data-slot="dialog-close" for close buttons
    const closeButton = document.querySelector('[data-slot="dialog-close"]');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton as Element);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should enter edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup();
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      // Alternate between issue and subtasks: odd calls return issue, even calls return []
      return callCount % 2 === 1 ? mockIssue : [];
    });

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("should allow editing title and description", async () => {
    const user = userEvent.setup();
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? mockIssue : [];
    });

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      /Add a description/i,
    ) as HTMLTextAreaElement;

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
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? mockIssue : [];
    });
    mockUpdateIssue.mockResolvedValue(undefined);

    renderModal();

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
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? mockIssue : [];
    });

    renderModal();

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
    (useQuery as vi.Mock).mockReturnValueOnce(issueWithoutDescription).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText(/No description provided/i)).toBeInTheDocument();
  });

  it("should show Unassigned when no assignee", () => {
    const issueWithoutAssignee = { ...mockIssue, assignee: null };
    (useQuery as vi.Mock).mockReturnValueOnce(issueWithoutAssignee).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText(/Unassigned/i)).toBeInTheDocument();
  });

  it("should not show Labels section when no labels", () => {
    const issueWithoutLabels = { ...mockIssue, labels: [] };
    (useQuery as vi.Mock).mockReturnValueOnce(issueWithoutLabels).mockReturnValueOnce([]);

    renderModal();

    expect(screen.queryByText(/Labels/i)).not.toBeInTheDocument();
  });

  it("should handle save error gracefully", async () => {
    const user = userEvent.setup();
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? mockIssue : [];
    });
    mockUpdateIssue.mockRejectedValue(new Error("Network error"));

    const { showError } = await import("@/lib/toast");

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "New title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Failed to update issue");
    });
  });

  it("should display story points in metadata", () => {
    (useQuery as vi.Mock).mockReturnValueOnce(mockIssue).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("Story Points:")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show 'Not set' when story points is undefined", () => {
    const issueWithoutStoryPoints = { ...mockIssue, storyPoints: undefined };
    (useQuery as vi.Mock).mockReturnValueOnce(issueWithoutStoryPoints).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("Story Points:")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("should display decimal story points correctly", () => {
    const issueWithDecimalPoints = { ...mockIssue, storyPoints: 3.5 };
    (useQuery as vi.Mock).mockReturnValueOnce(issueWithDecimalPoints).mockReturnValueOnce([]);

    renderModal();

    expect(screen.getByText("Story Points:")).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });
});
