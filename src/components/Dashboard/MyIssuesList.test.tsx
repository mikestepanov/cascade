import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { MyIssuesList } from "./MyIssuesList";

// Mock navigation hook
const mockIssueNavigation = {
  listRef: { current: null },
  getItemProps: (index: number) => ({
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
  }),
};

describe("MyIssuesList", () => {
  const mockIssues = [
    {
      _id: "1" as Id<"issues">,
      key: "PROJ-123",
      title: "Fix login bug",
      type: "bug",
      priority: "high",
      status: "In Progress",
      projectId: "proj1" as Id<"projects">,
      projectName: "Project Alpha",
    },
    {
      _id: "2" as Id<"issues">,
      key: "PROJ-124",
      title: "Add dark mode",
      type: "feature",
      priority: "medium",
      status: "To Do",
      projectId: "proj1" as Id<"projects">,
      projectName: "Project Alpha",
    },
  ];

  const mockCreatedIssues = [
    {
      _id: "3" as Id<"issues">,
      key: "PROJ-125",
      title: "Update documentation",
      type: "task",
      priority: "low",
      status: "Done",
      projectId: "proj2" as Id<"projects">,
      projectName: "Project Beta",
    },
  ];

  const defaultProps = {
    myIssues: mockIssues,
    myCreatedIssues: mockCreatedIssues,
    displayIssues: mockIssues,
    issueFilter: "assigned" as const,
    onFilterChange: vi.fn(),
    issueNavigation: mockIssueNavigation,
    onNavigateToProject: vi.fn(),
    onNavigateToProjects: vi.fn(),
  };

  it("should render card header", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText("My Issues")).toBeInTheDocument();
    expect(screen.getByText("Track your assigned and created issues")).toBeInTheDocument();
  });

  it("should render loading skeleton when data is undefined", () => {
    render(
      <MyIssuesList
        {...defaultProps}
        myIssues={undefined}
        myCreatedIssues={undefined}
        displayIssues={undefined}
      />,
    );

    // SkeletonList should be present (check for skeleton structure)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no assigned issues", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    expect(screen.getByText("No issues found")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have any assigned issues. Visit a project to get started."),
    ).toBeInTheDocument();
  });

  it("should render empty state when no created issues", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="created" displayIssues={[]} />);

    expect(screen.getByText("No issues found")).toBeInTheDocument();
    expect(
      screen.getByText("You haven't created any issues yet. Visit a project to create one."),
    ).toBeInTheDocument();
  });

  it("should render assigned issues tab with correct count", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText(`Assigned (${mockIssues.length})`)).toBeInTheDocument();
  });

  it("should render created issues tab with correct count", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText(`Created (${mockCreatedIssues.length})`)).toBeInTheDocument();
  });

  it("should highlight active tab (assigned)", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="assigned" />);

    const assignedTab = screen.getByLabelText("Show assigned issues");
    expect(assignedTab).toHaveClass("border-brand-600");
  });

  it("should highlight active tab (created)", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="created" />);

    const createdTab = screen.getByLabelText("Show created issues");
    expect(createdTab).toHaveClass("border-brand-600");
  });

  it("should call onFilterChange when switching to assigned tab", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MyIssuesList {...defaultProps} onFilterChange={onFilterChange} issueFilter="created" />,
    );

    const assignedTab = screen.getByLabelText("Show assigned issues");
    await user.click(assignedTab);

    expect(onFilterChange).toHaveBeenCalledWith("assigned");
  });

  it("should call onFilterChange when switching to created tab", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} onFilterChange={onFilterChange} />);

    const createdTab = screen.getByLabelText("Show created issues");
    await user.click(createdTab);

    expect(onFilterChange).toHaveBeenCalledWith("created");
  });

  it("should render issue list when issues are present", () => {
    render(<MyIssuesList {...defaultProps} />);

    expect(screen.getByText("PROJ-123")).toBeInTheDocument();
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(screen.getByText("PROJ-124")).toBeInTheDocument();
    expect(screen.getByText("Add dark mode")).toBeInTheDocument();
  });

  it("should display issue details (key, type, priority, status)", () => {
    render(<MyIssuesList {...defaultProps} />);

    // Issue key
    expect(screen.getByText("PROJ-123")).toBeInTheDocument();

    // Issue title
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();

    // Priority badge
    expect(screen.getByText("high")).toBeInTheDocument();

    // Status (both issues have statuses)
    expect(screen.getByText("In Progress")).toBeInTheDocument();

    // Project names (both issues from Project Alpha)
    const projectNames = screen.getAllByText("Project Alpha");
    expect(projectNames.length).toBe(2); // Both issues from same project
  });

  it("should call onNavigateToProject when clicking an issue", async () => {
    const onNavigateToProject = vi.fn();
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} onNavigateToProject={onNavigateToProject} />);

    const firstIssue = screen.getByText("Fix login bug");
    await user.click(firstIssue);

    expect(onNavigateToProject).toHaveBeenCalledWith("proj1");
  });

  it("should render View My Projects button in empty state", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    expect(screen.getByText("View My Projects")).toBeInTheDocument();
  });

  it("should call onNavigateToProjects when clicking View My Projects", async () => {
    const onNavigateToProjects = vi.fn();
    const user = userEvent.setup();

    render(
      <MyIssuesList
        {...defaultProps}
        displayIssues={[]}
        onNavigateToProjects={onNavigateToProjects}
      />,
    );

    const button = screen.getByText("View My Projects");
    await user.click(button);

    expect(onNavigateToProjects).toHaveBeenCalled();
  });

  it("should not render View My Projects button when onNavigateToProjects is not provided", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} onNavigateToProjects={undefined} />);

    expect(screen.queryByText("View My Projects")).not.toBeInTheDocument();
  });

  it("should render multiple issues with staggered animation", () => {
    render(<MyIssuesList {...defaultProps} />);

    const issueButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("PROJ-"));

    expect(issueButtons).toHaveLength(2);

    // Check that each has animation delay
    expect(issueButtons[0]).toHaveStyle({ animationDelay: "0ms" });
    expect(issueButtons[1]).toHaveStyle({ animationDelay: "50ms" });
  });

  it("should have correct accessibility attributes", () => {
    render(<MyIssuesList {...defaultProps} />);

    const assignedTab = screen.getByLabelText("Show assigned issues");
    const createdTab = screen.getByLabelText("Show created issues");

    expect(assignedTab).toHaveAttribute("type", "button");
    expect(createdTab).toHaveAttribute("type", "button");
  });

  it("should handle zero issues gracefully", () => {
    render(
      <MyIssuesList {...defaultProps} myIssues={[]} myCreatedIssues={[]} displayIssues={[]} />,
    );

    expect(screen.getByText("Assigned (0)")).toBeInTheDocument();
    expect(screen.getByText("Created (0)")).toBeInTheDocument();
  });
});
