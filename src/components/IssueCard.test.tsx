import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueCard } from "./IssueCard";

// Mock issue utilities
vi.mock("@/lib/issue-utils", () => ({
  getTypeIcon: vi.fn((type: string) => {
    const icons = { bug: "🐛", task: "✓", story: "📖", epic: "🎯" };
    return icons[type as keyof typeof icons] || "📄";
  }),
  getTypeLabel: vi.fn((type: string) => {
    const labels = {
      bug: "🐛 Bug",
      task: "✓ Task",
      story: "📖 Story",
      epic: "🎯 Epic",
    };
    return labels[type as keyof typeof labels] || "📋 Task";
  }),
  getPriorityIcon: vi.fn((priority: string) => {
    const icons = {
      lowest: "⬇️",
      low: "↘️",
      medium: "➡️",
      high: "↗️",
      highest: "⬆️",
    };
    return icons[priority as keyof typeof icons] || "➡️";
  }),
  getPriorityColor: vi.fn((priority: string) => {
    const colors = {
      lowest: "text-priority-lowest",
      low: "text-priority-low",
      medium: "text-priority-medium",
      high: "text-priority-high",
      highest: "text-priority-highest",
    };
    return colors[priority as keyof typeof colors] || "text-ui-text-tertiary";
  }),
}));

describe("IssueCard", () => {
  const mockOnDragStart = vi.fn();

  const mockIssue = {
    _id: "issue-1" as Id<"issues">,
    key: "TEST-123",
    title: "Fix critical bug in authentication",
    type: "bug" as const,
    priority: "high" as const,
    assignee: {
      _id: "user-1" as Id<"users">,
      name: "Alice Johnson",
      image: "https://example.com/avatar.jpg",
    },
    labels: [
      { name: "backend", color: "#3B82F6" },
      { name: "urgent", color: "#EF4444" },
    ],
    storyPoints: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display story points when present", () => {
    render(<IssueCard issue={mockIssue} onDragStart={mockOnDragStart} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("should not display story points when undefined", () => {
    const issueWithoutPoints = { ...mockIssue, storyPoints: undefined };
    render(<IssueCard issue={issueWithoutPoints} onDragStart={mockOnDragStart} />);

    expect(screen.queryByText("pts")).not.toBeInTheDocument();
  });

  it("should display decimal story points", () => {
    const issueWithDecimalPoints = { ...mockIssue, storyPoints: 3.5 };
    render(<IssueCard issue={issueWithDecimalPoints} onDragStart={mockOnDragStart} />);

    expect(screen.getByText("3.5")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
  });

  it("should display tooltip with assignee name on hover", async () => {
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} onDragStart={mockOnDragStart} />);

    const avatar = screen.getByAltText("Alice Johnson");
    expect(avatar).toBeInTheDocument();

    await user.hover(avatar);

    const tooltipText = await screen.findByRole("tooltip", { name: "Assigned to: Alice Johnson" });
    expect(tooltipText).toBeInTheDocument();
  });
});
