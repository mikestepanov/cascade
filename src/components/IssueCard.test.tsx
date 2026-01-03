import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueCard } from "./IssueCard";

// Mock issue utilities
vi.mock("@/lib/issue-utils", () => ({
  getTypeIcon: vi.fn((type: string) => {
    const icons = { bug: "🐛", task: "✓", story: "📖", epic: "🎯" };
    return icons[type as keyof typeof icons] || "📄";
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
      lowest: "text-gray-400",
      low: "text-blue-500",
      medium: "text-yellow-500",
      high: "text-orange-500",
      highest: "text-red-500",
    };
    return colors[priority as keyof typeof colors] || "text-gray-500";
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
      { name: "backend", color: "#3b82f6" },
      { name: "urgent", color: "#ef4444" },
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
});
