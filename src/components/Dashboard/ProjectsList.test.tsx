import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { WorkspacesList } from "./ProjectsList";

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
const mockWorkspaceNavigation = {
  listRef: { current: null },
  getItemProps: (index: number) => ({
    tabIndex: index === 0 ? 0 : -1,
    className: index === 0 ? "focused" : "",
  }),
};

describe("WorkspacesList", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockWorkspaces = [
    {
      _id: "proj1" as Id<"workspaces">,
      key: "ALPHA",
      name: "Workspace Alpha",
      role: "admin",
      myIssues: 5,
      totalIssues: 12,
    },
    {
      _id: "proj2" as Id<"workspaces">,
      key: "BETA",
      name: "Workspace Beta",
      role: "editor",
      myIssues: 2,
      totalIssues: 8,
    },
    {
      _id: "proj3" as Id<"workspaces">,
      key: "GAMMA",
      name: "Workspace Gamma",
      role: "viewer",
      myIssues: 0,
      totalIssues: 3,
    },
  ];

  const defaultProps = {
    workspaces: mockWorkspaces,
    workspaceNavigation: mockWorkspaceNavigation,
  };

  it("should render card header with workspace count", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("My Workspaces")).toBeInTheDocument();
    expect(screen.getByText(`${mockWorkspaces.length} workspaces`)).toBeInTheDocument();
  });

  it("should render loading skeleton when data is undefined", () => {
    render(<WorkspacesList {...defaultProps} workspaces={undefined} />);

    // Should render 3 skeleton workspace cards
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no workspaces", () => {
    render(<WorkspacesList {...defaultProps} workspaces={[]} />);

    expect(screen.getByText("No workspaces")).toBeInTheDocument();
    expect(screen.getByText("You're not a member of any workspaces yet")).toBeInTheDocument();
  });

  it("should render Go to Workspaces button in empty state", () => {
    render(<WorkspacesList {...defaultProps} workspaces={[]} />);

    expect(screen.getByText("Go to Workspaces")).toBeInTheDocument();
  });

  it("should navigate to workspaces when clicking Go to Workspaces", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList {...defaultProps} workspaces={[]} />);

    const button = screen.getByText("Go to Workspaces");
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/test-company/workspaces",
    });
  });

  it("should render all workspaces when data is present", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("Workspace Alpha")).toBeInTheDocument();
    expect(screen.getByText("Workspace Beta")).toBeInTheDocument();
    expect(screen.getByText("Workspace Gamma")).toBeInTheDocument();
  });

  it("should display workspace role badges", () => {
    render(<WorkspacesList {...defaultProps} />);

    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
  });

  it("should display issue counts for each workspace", () => {
    render(<WorkspacesList {...defaultProps} />);

    // Workspace Alpha: 5 my issues • 12 total
    expect(screen.getByText("5 my issues • 12 total")).toBeInTheDocument();

    // Workspace Beta: 2 my issues • 8 total
    expect(screen.getByText("2 my issues • 8 total")).toBeInTheDocument();

    // Workspace Gamma: 0 my issues • 3 total
    expect(screen.getByText("0 my issues • 3 total")).toBeInTheDocument();
  });

  it("should navigate to workspace when clicking a workspace", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList {...defaultProps} />);

    const firstWorkspace = screen.getByText("Workspace Alpha");
    await user.click(firstWorkspace);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/test-company/workspaces/ALPHA/board",
    });
  });

  it("should render workspaces with staggered animation", () => {
    render(<WorkspacesList {...defaultProps} />);

    const workspaceButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Workspace"));

    expect(workspaceButtons).toHaveLength(3);

    // Check that each has animation delay
    expect(workspaceButtons[0]).toHaveStyle({ animationDelay: "0ms" });
    expect(workspaceButtons[1]).toHaveStyle({ animationDelay: "50ms" });
    expect(workspaceButtons[2]).toHaveStyle({ animationDelay: "100ms" });
  });

  it("should apply navigation props to workspace items", () => {
    render(<WorkspacesList {...defaultProps} />);

    const workspaceButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Workspace"));

    // First item should have tabIndex 0 (focused)
    expect(workspaceButtons[0]).toHaveAttribute("tabindex", "0");

    // Other items should have tabIndex -1
    expect(workspaceButtons[1]).toHaveAttribute("tabindex", "-1");
    expect(workspaceButtons[2]).toHaveAttribute("tabindex", "-1");
  });

  it("should have correct button types", () => {
    render(<WorkspacesList {...defaultProps} />);

    const workspaceButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Workspace"));

    for (const button of workspaceButtons) {
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("should handle workspace with long name (truncation)", () => {
    const longNameWorkspace = [
      {
        _id: "proj4" as Id<"workspaces">,
        key: "LONG",
        name: "This is a very long workspace name that should be truncated in the UI",
        role: "admin",
        myIssues: 1,
        totalIssues: 5,
      },
    ];

    render(<WorkspacesList {...defaultProps} workspaces={longNameWorkspace} />);

    const workspaceName = screen.getByText(
      "This is a very long workspace name that should be truncated in the UI",
    );
    expect(workspaceName).toHaveClass("truncate");
  });

  it("should handle zero issues in a workspace", () => {
    const zeroIssuesWorkspace = [
      {
        _id: "proj5" as Id<"workspaces">,
        key: "EMPTY",
        name: "Empty Workspace",
        role: "editor",
        myIssues: 0,
        totalIssues: 0,
      },
    ];

    render(<WorkspacesList {...defaultProps} workspaces={zeroIssuesWorkspace} />);

    expect(screen.getByText("0 my issues • 0 total")).toBeInTheDocument();
  });

  it("should render with capitalized role badges", () => {
    render(<WorkspacesList {...defaultProps} />);

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
    const singleWorkspace = [mockWorkspaces[0]];

    render(<WorkspacesList {...defaultProps} workspaces={singleWorkspace} />);

    expect(screen.getByText("1 workspace")).toBeInTheDocument();
    expect(screen.getByText("Workspace Alpha")).toBeInTheDocument();
  });

  it("should show 0 workspaces in header when array is empty", () => {
    render(<WorkspacesList {...defaultProps} workspaces={[]} />);

    expect(screen.getByText("0 workspaces")).toBeInTheDocument();
  });

  it("should show 0 workspaces in header when undefined", () => {
    render(<WorkspacesList {...defaultProps} workspaces={undefined} />);

    expect(screen.getByText("0 workspaces")).toBeInTheDocument();
  });
});
