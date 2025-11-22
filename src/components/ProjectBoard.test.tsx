import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { ProjectBoard } from "./ProjectBoard";

const mockProject = {
  _id: "project1" as Id<"projects">,
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
    projectId: "project1" as Id<"projects">,
    name: "Sprint 1",
    status: "active" as const,
    createdBy: "user1" as Id<"users">,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "sprint2" as Id<"sprints">,
    projectId: "project1" as Id<"projects">,
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
  KanbanBoard: ({ projectId, sprintId }: any) => (
    <div data-testid="kanban-board">
      KanbanBoard: {projectId} {sprintId && `Sprint: ${sprintId}`}
    </div>
  ),
}));

vi.mock("./SprintManager", () => ({
  SprintManager: ({ projectId }: any) => (
    <div data-testid="sprint-manager">SprintManager: {projectId}</div>
  ),
}));

vi.mock("./AnalyticsDashboard", () => ({
  AnalyticsDashboard: ({ projectId }: any) => (
    <div data-testid="analytics-dashboard">AnalyticsDashboard: {projectId}</div>
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

    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render project header with name and details", () => {
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project")).toBeInTheDocument();
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("scrum")).toBeInTheDocument();
  });

  it("should render all tabs for scrum board", () => {
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.getByText("Sprints")).toBeInTheDocument();
    expect(screen.getByText("📊 Analytics")).toBeInTheDocument();
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

    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.queryByText("Sprints")).not.toBeInTheDocument();
    expect(screen.getByText("📊 Analytics")).toBeInTheDocument();
  });

  it("should show KanbanBoard by default", () => {
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
    expect(screen.queryByTestId("sprint-manager")).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-dashboard")).not.toBeInTheDocument();
  });

  it("should switch to backlog when clicking Backlog tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const backlogTab = screen.getByText("Backlog");
    await user.click(backlogTab);

    // Should still show KanbanBoard but without sprint filter
    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
  });

  it("should switch to sprints view when clicking Sprints tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const sprintsTab = screen.getByText("Sprints");
    await user.click(sprintsTab);

    expect(screen.getByTestId("sprint-manager")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  it("should switch to analytics view when clicking Analytics tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const analyticsTab = screen.getByRole("button", { name: "Analytics view" });
    await user.click(analyticsTab);

    expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sprint-manager")).not.toBeInTheDocument();
  });

  it("should highlight active tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const boardTab = screen.getByRole("button", { name: "Board view" });
    expect(boardTab).toHaveClass("border-brand-600", "text-brand-600");

    const analyticsTab = screen.getByRole("button", { name: "Analytics view" });
    await user.click(analyticsTab);

    expect(analyticsTab).toHaveClass("border-brand-600", "text-brand-600");
    expect(boardTab).not.toHaveClass("border-brand-600");
  });

  it("should show sprint selector for scrum board on Board tab", () => {
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const sprintSelector = screen.getByRole("combobox");
    expect(sprintSelector).toBeInTheDocument();

    // Check for sprint options
    expect(screen.getByText("Active Sprint")).toBeInTheDocument();
    expect(screen.getByText("Sprint 1 (active)")).toBeInTheDocument();
    expect(screen.getByText("Sprint 2 (future)")).toBeInTheDocument();
  });

  it("should not show sprint selector on backlog tab", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    // Initially on board tab, sprint selector should be visible
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    // Switch to backlog
    await user.click(screen.getByText("Backlog"));

    // Sprint selector should not be visible
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("should pass active sprint to KanbanBoard by default", () => {
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const kanbanBoard = screen.getByTestId("kanban-board");
    expect(kanbanBoard).toHaveTextContent("Sprint: sprint1");
  });

  it("should change sprint when selecting from dropdown", async () => {
    const user = userEvent.setup();
    render(<ProjectBoard projectId={"project1" as Id<"projects">} />);

    const sprintSelector = screen.getByRole("combobox");
    await user.selectOptions(sprintSelector, "sprint2");

    const kanbanBoard = screen.getByTestId("kanban-board");
    expect(kanbanBoard).toHaveTextContent("Sprint: sprint2");
  });
});
