import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { ProjectBoard } from "./ProjectBoard";

// Mock ShadcnSelect to use testable native select
vi.mock("./ui/ShadcnSelect", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
    value?: string;
  }) => (
    <div data-testid="select-root">
      <select
        data-testid="sprint-select"
        value={value || ""}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectTrigger: () => null,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

const mockProject = {
  _id: "project1" as Id<"workspaces">,
  name: "Test Project",
  key: "TEST",
  description: "A test project",
  boardType: "scrum" as const,
  createdBy: "user1" as Id<"users">,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPublic: false,
  members: [],
  workflowStates: [
    { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
    { id: "done", name: "Done", category: "done" as const, order: 1 },
  ],
  creatorName: "Test User",
  isMember: true,
  isOwner: true,
  userRole: "admin" as const,
};

const mockSprints = [
  {
    _id: "sprint1" as Id<"sprints">,
    workspaceId: "project1" as Id<"workspaces">,
    name: "Sprint 1",
    status: "active" as const,
    createdBy: "user1" as Id<"users">,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "sprint2" as Id<"sprints">,
    workspaceId: "project1" as Id<"workspaces">,
    name: "Sprint 2",
    status: "future" as const,
    createdBy: "user1" as Id<"users">,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Create mock function with vi.hoisted so it's available when vi.mock runs
const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

// Mock child components
vi.mock("./KanbanBoard", () => ({
  KanbanBoard: ({ workspaceId, sprintId }: any) => (
    <div data-testid="kanban-board">
      KanbanBoard: {workspaceId} {sprintId && `Sprint: ${sprintId}`}
    </div>
  ),
}));

vi.mock("./SprintManager", () => ({
  SprintManager: ({ workspaceId }: any) => (
    <div data-testid="sprint-manager">SprintManager: {workspaceId}</div>
  ),
}));

vi.mock("./AnalyticsDashboard", () => ({
  AnalyticsDashboard: ({ workspaceId }: any) => (
    <div data-testid="analytics-dashboard">AnalyticsDashboard: {workspaceId}</div>
  ),
}));

vi.mock("convex/react", () => ({
  useQuery: mockUseQuery,
  useMutation: vi.fn(() => vi.fn()),
}));

// Module-level counter that persists across re-renders
let queryCallIndex = 0;

describe("ProjectBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    // Set up default mock - alternate between project and sprints
    mockUseQuery.mockImplementation(() => {
      queryCallIndex++;
      // Odd calls return project, even calls return sprints
      return queryCallIndex % 2 === 1 ? mockProject : mockSprints;
    });
  });

  it("should render loading state when project is not loaded", () => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);

    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    // Should render skeleton placeholders while loading
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("should render project header with name and details", () => {
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project")).toBeInTheDocument();
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("scrum")).toBeInTheDocument();
  });

  it("should render all tabs for scrum board", () => {
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.getByText("Sprints")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("should not render Sprints tab for kanban board", () => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    // Override to return a kanban project
    mockUseQuery.mockImplementation(() => {
      queryCallIndex++;
      // Odd calls return kanban project, even calls return sprints
      return queryCallIndex % 2 === 1 ? { ...mockProject, boardType: "kanban" } : mockSprints;
    });

    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.queryByText("Sprints")).not.toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("should show KanbanBoard by default", () => {
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
    expect(screen.queryByTestId("sprint-manager")).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-dashboard")).not.toBeInTheDocument();
  });

  it("should switch to backlog when clicking Backlog tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const backlogTab = screen.getByText("Backlog");
    await user.click(backlogTab);

    // Should still show KanbanBoard but without sprint filter
    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
  });

  it("should switch to sprints view when clicking Sprints tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const sprintsTab = screen.getByText("Sprints");
    await user.click(sprintsTab);

    expect(screen.getByTestId("sprint-manager")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  it("should switch to analytics view when clicking Analytics tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const analyticsTab = screen.getByRole("button", { name: "Analytics view" });
    await user.click(analyticsTab);

    expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sprint-manager")).not.toBeInTheDocument();
  });

  it("should highlight active tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const boardTab = screen.getByRole("button", { name: "Board view" });
    expect(boardTab).toHaveClass("border-brand-600", "text-brand-600");

    const analyticsTab = screen.getByRole("button", { name: "Analytics view" });
    await user.click(analyticsTab);

    expect(analyticsTab).toHaveClass("border-brand-600", "text-brand-600");
    expect(boardTab).not.toHaveClass("border-brand-600");
  });

  it("should show sprint selector for scrum board on Board tab", () => {
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const sprintSelector = screen.getByTestId("sprint-select");
    expect(sprintSelector).toBeInTheDocument();

    // Check for sprint options in the select
    const options = sprintSelector.querySelectorAll("option");
    expect(options.length).toBeGreaterThanOrEqual(3); // Active Sprint + 2 sprints

    // Check that sprint texts appear somewhere
    expect(screen.getAllByText(/Active Sprint/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sprint 1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sprint 2/).length).toBeGreaterThanOrEqual(1);
  });

  it("should not show sprint selector on backlog tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    // Initially on board tab, sprint selector should be visible
    expect(screen.getByTestId("sprint-select")).toBeInTheDocument();

    // Switch to backlog
    await user.click(screen.getByText("Backlog"));

    // Sprint selector should not be visible
    expect(screen.queryByTestId("sprint-select")).not.toBeInTheDocument();
  });

  it("should pass active sprint to KanbanBoard by default", () => {
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const kanbanBoard = screen.getByTestId("kanban-board");
    expect(kanbanBoard).toHaveTextContent("Sprint: sprint1");
  });

  it("should change sprint when selecting from dropdown", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard workspaceId={"project1" as Id<"workspaces">} />);

    const sprintSelector = screen.getByTestId("sprint-select");
    await user.selectOptions(sprintSelector, "sprint2");

    const kanbanBoard = screen.getByTestId("kanban-board");
    expect(kanbanBoard).toHaveTextContent("Sprint: sprint2");
  });
});
