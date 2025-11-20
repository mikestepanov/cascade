import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAction, useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { CreateIssueModal } from "./CreateIssueModal";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

// Mock toast utilities
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock array utilities
vi.mock("@/lib/array-utils", () => ({
  toggleInArray: vi.fn((arr: any[], item: any) => {
    if (arr.includes(item)) {
      return arr.filter((i) => i !== item);
    }
    return [...arr, item];
  }),
}));

describe("CreateIssueModal", () => {
  const mockCreateIssue = vi.fn();
  const mockOnClose = vi.fn();
  const mockProjectId = "project-123" as Id<"projects">;
  const _mockSprintId = "sprint-456" as Id<"sprints">;

  const mockProject = {
    _id: mockProjectId,
    name: "Test Project",
    key: "TEST",
    members: [
      { _id: "user-1" as Id<"users">, name: "Alice" },
      { _id: "user-2" as Id<"users">, name: "Bob" },
    ],
  };

  const mockTemplates = [
    {
      _id: "template-1" as Id<"issueTemplates">,
      name: "Bug Template",
      type: "bug" as const,
      titleTemplate: "Bug: ",
      descriptionTemplate: "## Steps to reproduce\n1. ",
      defaultPriority: "high" as const,
      defaultLabels: ["bug"],
    },
  ];

  const mockLabels = [
    { _id: "label-1" as Id<"labels">, name: "bug", color: "#ff0000" },
    { _id: "label-2" as Id<"labels">, name: "feature", color: "#00ff00" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as vi.Mock).mockReturnValue(mockCreateIssue);
    (useAction as vi.Mock).mockReturnValue(vi.fn());
    // Mock useQuery to return values in order:
    // 1st call: api.projects.get -> mockProject
    // 2nd call: api.templates.list -> mockTemplates
    // 3rd call: api.labels.list -> mockLabels
    (useQuery as vi.Mock)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockTemplates)
      .mockReturnValueOnce(mockLabels);
  });

  it("should render story points input field", () => {
    render(<CreateIssueModal projectId={mockProjectId} onClose={mockOnClose} />);

    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);
    expect(storyPointsInput).toBeInTheDocument();
    expect(storyPointsInput).toHaveAttribute("type", "number");
    expect(storyPointsInput).toHaveAttribute("min", "0");
    expect(storyPointsInput).toHaveAttribute("step", "0.5");
  });

  it("should allow user to enter story points", async () => {
    const user = userEvent.setup();
    render(<CreateIssueModal projectId={mockProjectId} onClose={mockOnClose} />);

    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);
    await user.type(storyPointsInput, "5");

    expect(storyPointsInput).toHaveValue(5);
  });

  it("should create issue with story points", async () => {
    const user = userEvent.setup();
    mockCreateIssue.mockResolvedValue("new-issue-id");

    // Use mockImplementation to handle re-renders from user interactions
    let callCount = 0;
    (useQuery as vi.Mock).mockImplementation(() => {
      callCount++;
      const callIndex = (callCount - 1) % 3; // Cycle through 3 queries
      return [mockProject, mockTemplates, mockLabels][callIndex];
    });

    render(<CreateIssueModal projectId={mockProjectId} onClose={mockOnClose} />);

    const titleInput = screen.getByPlaceholderText(/Enter issue title/i);
    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);

    await user.type(titleInput, "Test Issue");
    await user.type(storyPointsInput, "8");

    const submitButton = screen.getByRole("button", { name: /Create Issue/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: mockProjectId,
          title: "Test Issue",
          storyPoints: 8,
        }),
      );
    });
  });
});
