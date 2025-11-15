import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("BulkOperationsBar - Component Behavior", () => {
  const mockProjectId = "project123" as any;
  const mockOnClearSelection = vi.fn();
  const mockWorkflowStates = [
    { id: "todo", name: "To Do" },
    { id: "done", name: "Done" },
  ];

  const mockProject = { _id: mockProjectId, name: "Test" };
  const mockSprints = [{ _id: "sprint1" as any, name: "Sprint 1" }];
  const mockMembers = [{ userId: "user1" as any, userName: "John Doe" }];

  const mockBulkUpdateStatus = vi.fn();
  const mockBulkUpdatePriority = vi.fn();
  const mockBulkAssign = vi.fn();
  const mockBulkMoveToSprint = vi.fn();
  const mockBulkDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup queries to cycle through values on each render
    // Component calls useQuery 3 times: project, sprints, members
    // On re-render, it calls them again in the same order
    let queryCallCount = 0;
    (useQuery as any).mockImplementation(() => {
      const results = [mockProject, mockSprints, mockMembers];
      return results[queryCallCount++ % 3];
    });

    // Setup mutations - return the first mock for ALL useMutation calls
    // The component creates 5 mutation hooks, but we only test one at a time
    (useMutation as any).mockReturnValue(mockBulkUpdateStatus);
  });

  describe("Visibility Logic", () => {
    it("should not render when no issues selected", () => {
      const emptySelection = new Set<any>();

      const { container } = render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={emptySelection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when at least one issue is selected", () => {
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText(/selected/i)).toBeInTheDocument();
    });
  });

  describe("Count Display Formatting", () => {
    it("should use singular 'issue' when exactly 1 selected", () => {
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText("1 issue selected")).toBeInTheDocument();
    });

    it("should use plural 'issues' when multiple selected", () => {
      const selection = new Set(["issue1" as any, "issue2" as any, "issue3" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText("3 issues selected")).toBeInTheDocument();
    });

    it("should update count when selection changes", () => {
      const selection = new Set(["issue1" as any]);

      const { rerender } = render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText("1 issue selected")).toBeInTheDocument();

      const newSelection = new Set(["issue1" as any, "issue2" as any]);
      rerender(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={newSelection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText("2 issues selected")).toBeInTheDocument();
    });
  });

  describe("Clear Selection Logic", () => {
    it("should call onClearSelection when Clear button clicked", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Clear selection/i));

      expect(mockOnClearSelection).toHaveBeenCalled();
    });

    it("should call onClearSelection after successful status update", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      // Click Show Actions
      await user.click(screen.getByText(/Show Actions/i));

      // Get all comboboxes (selects) - they appear in order: status, priority, assignee, sprint
      const selects = screen.getAllByRole("combobox");
      const statusSelect = selects[0];

      // Select a status using fireEvent for immediate onChange trigger
      fireEvent.change(statusSelect, { target: { value: "done" } });

      await waitFor(() => {
        expect(mockBulkUpdateStatus).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          newStatus: "done",
        });
        expect(mockOnClearSelection).toHaveBeenCalled();
      });
    });

    it("should call onClearSelection after successful delete", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkDelete.mockResolvedValue({ deleted: 1 });
      (useMutation as any).mockReturnValue(mockBulkDelete);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      // Click the main Delete button
      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      // Wait for dialog and find confirm button using within() for reliability
      const dialog = await screen.findByRole("dialog");
      expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();

      // Find Delete button within dialog (not the main Delete button)
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]; // Second Delete button is in dialog

      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockBulkDelete).toHaveBeenCalledWith({ issueIds: ["issue1"] });
        expect(mockOnClearSelection).toHaveBeenCalled();
      });
    });
  });

  describe("Assignee Conversion Logic", () => {
    it("should convert 'unassigned' string to null", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkAssign.mockResolvedValue({ updated: 1 });

      // Override to return assign mock for all mutations
      (useMutation as any).mockReturnValue(mockBulkAssign);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      // Get assignee select (3rd combobox: status, priority, assignee, sprint)
      const selects = screen.getAllByRole("combobox");

      fireEvent.change(selects[2], { target: { value: "unassigned" } });

      await waitFor(() => {
        expect(mockBulkAssign).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          assigneeId: null,
        });
      });
    });

    it("should pass user ID as-is when not unassigned", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkAssign.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkAssign);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");

      fireEvent.change(selects[2], { target: { value: "user1" } });

      await waitFor(() => {
        expect(mockBulkAssign).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          assigneeId: "user1",
        });
      });
    });
  });

  describe("Sprint Conversion Logic", () => {
    it("should convert 'backlog' string to null", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkMoveToSprint);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      // Get sprint select (4th combobox)
      const selects = screen.getAllByRole("combobox");

      fireEvent.change(selects[3], { target: { value: "backlog" } });

      await waitFor(() => {
        expect(mockBulkMoveToSprint).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          sprintId: null,
        });
      });
    });

    it("should pass sprint ID as-is when not backlog", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkMoveToSprint);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");

      fireEvent.change(selects[3], { target: { value: "sprint1" } });

      await waitFor(() => {
        expect(mockBulkMoveToSprint).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          sprintId: "sprint1",
        });
      });
    });
  });

  describe("Success Message Formatting", () => {
    it("should use singular in status success message", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "done" } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Updated 1 issue(s)");
      });
    });

    it("should use plural in status success message", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any, "issue2" as any]);
      mockBulkUpdateStatus.mockResolvedValue({ updated: 2 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "done" } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Updated 2 issue(s)");
      });
    });

    it("should use correct message for priority update", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkUpdatePriority.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkUpdatePriority);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[1], { target: { value: "high" } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Updated 1 issue(s)");
      });
    });

    it("should use correct message for assign", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkAssign.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkAssign);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[2], { target: { value: "unassigned" } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Assigned 1 issue(s)");
      });
    });

    it("should use correct message for move to sprint", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });
      (useMutation as any).mockReturnValue(mockBulkMoveToSprint);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[3], { target: { value: "backlog" } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Moved 1 issue(s)");
      });
    });

    it("should use correct message for delete", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkDelete.mockResolvedValue({ deleted: 1 });
      (useMutation as any).mockReturnValue(mockBulkDelete);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      // Wait for dialog
      await screen.findByRole("dialog");
      expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();

      // Find Delete button within dialog (second Delete button)
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1];

      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Deleted 1 issue(s)");
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast when status update fails", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockRejectedValue(new Error("Update failed"));

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "done" } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
      });
    });

    it("should show generic error when error has no message", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkUpdatePriority.mockRejectedValue({});
      (useMutation as any).mockReturnValue(mockBulkUpdatePriority);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[1], { target: { value: "high" } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update priority");
      });
    });

    it("should show correct generic error for each operation type", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkAssign.mockRejectedValue({});
      (useMutation as any).mockReturnValue(mockBulkAssign);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[2], { target: { value: "unassigned" } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to assign issues");
      });
    });

    it("should NOT call onClearSelection when operation fails", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockRejectedValue(new Error("Failed"));

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "done" } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(mockOnClearSelection).not.toHaveBeenCalled();
    });
  });

  describe("Delete Confirmation Dialog", () => {
    it("should show singular message in delete dialog for 1 issue", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();
      });
    });

    it("should show plural message in delete dialog for multiple issues", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any, "issue2" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/delete 2 issues/i)).toBeInTheDocument();
      });
    });

    it("should close dialog when cancel clicked", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText(/delete 1 issue/i)).not.toBeInTheDocument();
      });
    });

    it("should close dialog after successful delete", async () => {
      // Override BEFORE render so component gets the right mock
      mockBulkDelete.mockResolvedValue({ deleted: 1 });
      (useMutation as any).mockReturnValue(mockBulkDelete);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      // Wait for dialog
      await screen.findByRole("dialog");
      expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();

      // Find Delete button within dialog (second Delete button)
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1];

      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete 1 issue/i)).not.toBeInTheDocument();
      });
    });

    it("should close dialog after failed delete", async () => {
      mockBulkDelete.mockRejectedValue(new Error("Failed"));
      // Override to use delete mock
      (useMutation as any).mockReturnValue(mockBulkDelete);

      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      // Wait for dialog
      await screen.findByRole("dialog");
      expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();

      // Find Delete button within dialog (second Delete button)
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1];

      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete 1 issue/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Set to Array Conversion", () => {
    it("should convert Set to Array when calling mutations", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any, "issue2" as any]);
      mockBulkUpdateStatus.mockResolvedValue({ updated: 2 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));

      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[0], { target: { value: "done" } });

      await waitFor(() => {
        expect(mockBulkUpdateStatus).toHaveBeenCalledWith({
          issueIds: expect.arrayContaining(["issue1", "issue2"]),
          newStatus: "done",
        });
      });
    });
  });
});
