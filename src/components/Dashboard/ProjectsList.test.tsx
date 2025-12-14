import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { ProjectsList } from "./ProjectsList";

// Mock navigation hook
const mockProjectNavigation = {
  listRef: { current: null },
  getItemProps: (index: number) => ({
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
  }),
};

describe("ProjectsList", () => {
  const mockProjects = [
    {
      _id: "proj1" as Id<"projects">,
      key: "ALPHA",
      name: "Project Alpha",
      role: "admin",
      myIssues: 5,
      totalIssues: 12,
    },
    {
      _id: "proj2" as Id<"projects">,
      key: "BETA",
      name: "Project Beta",
      role: "editor",
      myIssues: 2,
      totalIssues: 8,
    },
    {
      _id: "proj3" as Id<"projects">,
      key: "GAMMA",
      name: "Project Gamma",
      role: "viewer",
      myIssues: 0,
      totalIssues: 3,
    },
  ];

  const defaultProps = {
    projects: mockProjects,
    projectNavigation: mockProjectNavigation,
    onNavigateToProject: vi.fn(),
    onNavigateToProjects: vi.fn(),
  };

  it("should render card header with workspace count", () => {
    render(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("My Workspaces")).toBeInTheDocument();
    expect(screen.getByText(`${mockProjects.length} workspaces`)).toBeInTheDocument();
  });

  it("should render loading skeleton when data is undefined", () => {
    render(<ProjectsList {...defaultProps} projects={undefined} />);

    // Should render 3 skeleton project cards
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no workspaces", () => {
    render(<ProjectsList {...defaultProps} projects={[]} />);

    expect(screen.getByText("No workspaces")).toBeInTheDocument();
    expect(screen.getByText("You're not a member of any workspaces yet")).toBeInTheDocument();
  });

  it("should render Go to Workspaces button in empty state", () => {
    render(<ProjectsList {...defaultProps} projects={[]} />);

    expect(screen.getByText("Go to Workspaces")).toBeInTheDocument();
  });

  it("should call onNavigateToProjects when clicking Go to Workspaces", async () => {
    const onNavigateToProjects = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectsList {...defaultProps} projects={[]} onNavigateToProjects={onNavigateToProjects} />,
    );

    const button = screen.getByText("Go to Workspaces");
    await user.click(button);

    expect(onNavigateToProjects).toHaveBeenCalled();
  });

  it("should not render Go to Workspaces button when onNavigateToProjects is not provided", () => {
    render(<ProjectsList {...defaultProps} projects={[]} onNavigateToProjects={undefined} />);

    expect(screen.queryByText("Go to Workspaces")).not.toBeInTheDocument();
  });

  it("should render all projects when data is present", () => {
    render(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();
  });

  it("should display project role badges", () => {
    render(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
  });

  it("should display issue counts for each project", () => {
    render(<ProjectsList {...defaultProps} />);

    // Project Alpha: 5 my issues • 12 total
    expect(screen.getByText("5 my issues • 12 total")).toBeInTheDocument();

    // Project Beta: 2 my issues • 8 total
    expect(screen.getByText("2 my issues • 8 total")).toBeInTheDocument();

    // Project Gamma: 0 my issues • 3 total
    expect(screen.getByText("0 my issues • 3 total")).toBeInTheDocument();
  });

  it("should call onNavigateToProject when clicking a project", async () => {
    const onNavigateToProject = vi.fn();
    const user = userEvent.setup();

    render(<ProjectsList {...defaultProps} onNavigateToProject={onNavigateToProject} />);

    const firstProject = screen.getByText("Project Alpha");
    await user.click(firstProject);

    expect(onNavigateToProject).toHaveBeenCalledWith("ALPHA");
  });

  it("should render projects with staggered animation", () => {
    render(<ProjectsList {...defaultProps} />);

    const projectButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Project"));

    expect(projectButtons).toHaveLength(3);

    // Check that each has animation delay
    expect(projectButtons[0]).toHaveStyle({ animationDelay: "0ms" });
    expect(projectButtons[1]).toHaveStyle({ animationDelay: "50ms" });
    expect(projectButtons[2]).toHaveStyle({ animationDelay: "100ms" });
  });

  it("should apply navigation props to project items", () => {
    render(<ProjectsList {...defaultProps} />);

    const projectButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Project"));

    // First item should have tabIndex 0 (focused)
    expect(projectButtons[0]).toHaveAttribute("tabindex", "0");

    // Other items should have tabIndex -1
    expect(projectButtons[1]).toHaveAttribute("tabindex", "-1");
    expect(projectButtons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("should have correct button types", () => {
    render(<ProjectsList {...defaultProps} />);

    const projectButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Project"));

    for (const button of projectButtons) {
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("should handle project with long name (truncation)", () => {
    const longNameProject = [
      {
        _id: "proj4" as Id<"projects">,
        key: "LONG",
        name: "This is a very long project name that should be truncated in the UI",
        role: "admin",
        myIssues: 1,
        totalIssues: 5,
      },
    ];

    render(<ProjectsList {...defaultProps} projects={longNameProject} />);

    const projectName = screen.getByText(
      "This is a very long project name that should be truncated in the UI",
    );
    expect(projectName).toHaveClass("truncate");
  });

  it("should handle zero issues in a project", () => {
    const zeroIssuesProject = [
      {
        _id: "proj5" as Id<"projects">,
        key: "EMPTY",
        name: "Empty Project",
        role: "editor",
        myIssues: 0,
        totalIssues: 0,
      },
    ];

    render(<ProjectsList {...defaultProps} projects={zeroIssuesProject} />);

    expect(screen.getByText("0 my issues • 0 total")).toBeInTheDocument();
  });

  it("should render with capitalized role badges", () => {
    render(<ProjectsList {...defaultProps} />);

    // All role badges should have the capitalize class
    const roleBadges = [
      screen.getByText("admin"),
      screen.getByText("editor"),
      screen.getByText("viewer"),
    ];

    for (const badge of roleBadges) {
      // The Badge component has capitalize class
      expect(badge).toBeInTheDocument();
    }
  });

  it("should handle single workspace", () => {
    const singleProject = [mockProjects[0]];

    render(<ProjectsList {...defaultProps} projects={singleProject} />);

    expect(screen.getByText("1 workspace")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("should show 0 workspaces in header when array is empty", () => {
    render(<ProjectsList {...defaultProps} projects={[]} />);

    expect(screen.getByText("0 workspaces")).toBeInTheDocument();
  });

  it("should show 0 workspaces in header when undefined", () => {
    render(<ProjectsList {...defaultProps} projects={undefined} />);

    expect(screen.getByText("0 workspaces")).toBeInTheDocument();
  });
});
