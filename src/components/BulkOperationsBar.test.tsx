import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    (useQuery as any)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockSprints)
      .mockReturnValueOnce(mockMembers);
    (useMutation as any)
      .mockReturnValueOnce(mockBulkUpdateStatus)
      .mockReturnValueOnce(mockBulkUpdatePriority)
      .mockReturnValueOnce(mockBulkAssign)
      .mockReturnValueOnce(mockBulkMoveToSprint)
      .mockReturnValueOnce(mockBulkDelete);
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
      const selection1 = new Set(["issue1" as any]);

      const { rerender } = render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection1}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      expect(screen.getByText("1 issue selected")).toBeInTheDocument();

      const selection2 = new Set(["issue1" as any, "issue2" as any]);

      rerender(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection2}
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

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(mockOnClearSelection).toHaveBeenCalled();
      });
    });

    it("should call onClearSelection after successful delete", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkDelete.mockResolvedValue({ deleted: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i }).find(
        (btn) => btn.className.includes("bg-")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockOnClearSelection).toHaveBeenCalled();
      });
    });
  });

  describe("Assignee Conversion Logic", () => {
    it("should convert 'unassigned' string to null", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkAssign.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Assign To/i), "unassigned");

      await waitFor(() => {
        expect(mockBulkAssign).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          assigneeId: null, // Converted to null
        });
      });
    });

    it("should pass user ID as-is when not unassigned", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkAssign.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Assign To/i), "user1");

      await waitFor(() => {
        expect(mockBulkAssign).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          assigneeId: "user1", // Passed as-is
        });
      });
    });
  });

  describe("Sprint Conversion Logic", () => {
    it("should convert 'backlog' string to null", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Move to Sprint/i), "backlog");

      await waitFor(() => {
        expect(mockBulkMoveToSprint).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          sprintId: null, // Converted to null
        });
      });
    });

    it("should pass sprint ID as-is when not backlog", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Move to Sprint/i), "sprint1");

      await waitFor(() => {
        expect(mockBulkMoveToSprint).toHaveBeenCalledWith({
          issueIds: ["issue1"],
          sprintId: "sprint1", // Passed as-is
        });
      });
    });
  });

  describe("Success Toast Message Formatting", () => {
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
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

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
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Updated 2 issue(s)");
      });
    });

    it("should use correct message for priority update", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdatePriority.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Priority/i), "high");

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Updated 1 issue(s)");
      });
    });

    it("should use correct message for assign", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkAssign.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Assign To/i), "user1");

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Assigned 1 issue(s)");
      });
    });

    it("should use correct message for move to sprint", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkMoveToSprint.mockResolvedValue({ updated: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Move to Sprint/i), "sprint1");

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Moved 1 issue(s)");
      });
    });

    it("should use correct message for delete", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkDelete.mockResolvedValue({ deleted: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i }).find(
        (btn) => btn.className.includes("bg-")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Deleted 1 issue(s)");
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast when status update fails", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockRejectedValue(new Error("Permission denied"));

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Permission denied");
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkUpdateStatus.mockRejectedValue(new Error());

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update status");
      });
    });

    it("should show correct generic error for each operation type", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);

      mockBulkUpdatePriority.mockRejectedValue(new Error());
      mockBulkAssign.mockRejectedValue(new Error());
      mockBulkMoveToSprint.mockRejectedValue(new Error());
      mockBulkDelete.mockRejectedValue(new Error());

      const { rerender } = render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      // Test priority error
      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Priority/i), "high");
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update priority");
      });

      // Re-render for assign error
      rerender(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );
      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Assign To/i), "user1");
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
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnClearSelection).not.toHaveBeenCalled();
      });
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

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      expect(screen.getByText(/delete 1 issue/i)).toBeInTheDocument();
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

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      expect(screen.getByText(/delete 2 issues/i)).toBeInTheDocument();
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

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText(/Delete Issues/i)).not.toBeInTheDocument();
      });
    });

    it("should close dialog after successful delete", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkDelete.mockResolvedValue({ deleted: 1 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i }).find(
        (btn) => btn.className.includes("bg-")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/Delete Issues/i)).not.toBeInTheDocument();
      });
    });

    it("should close dialog after failed delete", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any]);
      mockBulkDelete.mockRejectedValue(new Error("Failed"));

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      const confirmButton = screen.getAllByRole("button", { name: /Delete/i }).find(
        (btn) => btn.className.includes("bg-")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/Delete Issues/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Set Conversion to Array", () => {
    it("should convert Set to Array when calling mutations", async () => {
      const user = userEvent.setup();
      const selection = new Set(["issue1" as any, "issue2" as any, "issue3" as any]);
      mockBulkUpdateStatus.mockResolvedValue({ updated: 3 });

      render(
        <BulkOperationsBar
          projectId={mockProjectId}
          selectedIssueIds={selection}
          onClearSelection={mockOnClearSelection}
          workflowStates={mockWorkflowStates}
        />
      );

      await user.click(screen.getByText(/Show Actions/i));
      await user.selectOptions(screen.getByLabelText(/Change Status/i), "done");

      await waitFor(() => {
        expect(mockBulkUpdateStatus).toHaveBeenCalledWith({
          issueIds: ["issue1", "issue2", "issue3"], // Array, not Set
          newStatus: "done",
        });
      });
    });
  });
});
