import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATTERNS } from "@/config/routes";
import { render, screen } from "@/test/custom-render";
import { MyIssuesList } from "./MyIssuesList";

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock company context
vi.mock("@/hooks/useCompanyContext", () => ({
  useCompany: () => ({ companySlug: "test-company" }),
}));

// Mock navigation hook
const mockIssueNavigation = {
  listRef: { current: null },
  getItemProps: (index: number) => ({
    "data-list-index": index,
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
    onMouseEnter: vi.fn(),
  }),
  selectedIndex: -1,
  setSelectedIndex: vi.fn(),
};

describe("MyIssuesList", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockIssues = [
    {
      _id: "1" as Id<"issues">,
      key: "PROJ-123",
      title: "Fix login bug",
      type: "bug",
      priority: "high",
      status: "In Progress",
      projectId: "proj1" as Id<"projects">,
      projectKey: "PROJ",
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
      projectKey: "PROJ",
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
      projectKey: "BETA",
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
    expect(assignedTab).toHaveClass("border-brand-indigo-border");
  });

  it("should highlight active tab (created)", () => {
    render(<MyIssuesList {...defaultProps} issueFilter="created" />);

    const createdTab = screen.getByLabelText("Show created issues");
    expect(createdTab).toHaveClass("border-brand-indigo-border");
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

  it("should navigate to project when clicking an issue", async () => {
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} />);

    const firstIssue = screen.getByText("Fix login bug");
    await user.click(firstIssue);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTE_PATTERNS.projects.board,
      params: { companySlug: "test-company", key: "PROJ" },
    });
  });

  it("should render View My Workspaces button in empty state", () => {
    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    expect(screen.getByText("View My Workspaces")).toBeInTheDocument();
  });

  it("should navigate to projects when clicking View My Workspaces", async () => {
    const user = userEvent.setup();

    render(<MyIssuesList {...defaultProps} displayIssues={[]} />);

    const button = screen.getByText("View My Workspaces");
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTE_PATTERNS.workspaces.list,
      params: { companySlug: "test-company" },
    });
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
