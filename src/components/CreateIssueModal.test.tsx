import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { CreateIssueModal } from "./CreateIssueModal";

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
  const mockSprintId = "sprint-456" as Id<"sprints">;

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
    (useQuery as vi.Mock).mockImplementation((apiFunction: any) => {
      if (apiFunction.toString().includes("projects.get")) {
        return mockProject;
      }
      if (apiFunction.toString().includes("templates.list")) {
        return mockTemplates;
      }
      if (apiFunction.toString().includes("labels.list")) {
        return mockLabels;
      }
      return undefined;
    });
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
