import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface BulkOperationsBarProps {
  projectId: Id<"projects">;
  selectedIssueIds: Set<Id<"issues">>;
  onClearSelection: () => void;
  workflowStates: Array<{ id: string; name: string }>;
}

export function BulkOperationsBar({
  projectId,
  selectedIssueIds,
  onClearSelection,
  workflowStates,
}: BulkOperationsBarProps) {
  const [showActions, setShowActions] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const project = useQuery(api.projects.get, { id: projectId });
  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const members = useQuery(api.projectMembers.list, { projectId });

  const bulkUpdateStatus = useMutation(api.issues.bulkUpdateStatus);
  const bulkUpdatePriority = useMutation(api.issues.bulkUpdatePriority);
  const bulkAssign = useMutation(api.issues.bulkAssign);
  const bulkMoveToSprint = useMutation(api.issues.bulkMoveToSprint);
  const bulkDelete = useMutation(api.issues.bulkDelete);

  const issueIds = Array.from(selectedIssueIds);
  const count = issueIds.length;

  const handleUpdateStatus = async (statusId: string) => {
    try {
      const result = await bulkUpdateStatus({ issueIds, newStatus: statusId });
      toast.success(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    try {
      const result = await bulkUpdatePriority({
        issueIds,
        priority: priority as "lowest" | "low" | "medium" | "high" | "highest",
      });
      toast.success(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to update priority");
    }
  };

  const handleAssign = async (assigneeId: string) => {
    try {
      const result = await bulkAssign({
        issueIds,
        assigneeId: assigneeId === "unassigned" ? null : (assigneeId as Id<"users">),
      });
      toast.success(`Assigned ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign issues");
    }
  };

  const handleMoveToSprint = async (sprintId: string) => {
    try {
      const result = await bulkMoveToSprint({
        issueIds,
        sprintId: sprintId === "backlog" ? null : (sprintId as Id<"sprints">),
      });
      toast.success(`Moved ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to move to sprint");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await bulkDelete({ issueIds });
      toast.success(`Deleted ${result.deleted} issue(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete issues");
    } finally {
      setDeleteConfirm(false);
    }
  };

  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-primary text-white shadow-lg z-30 transition-transform">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-4">
              <p className="font-medium">
                {count} issue{count !== 1 ? "s" : ""} selected
              </p>
              <button onClick={onClearSelection} className="text-sm underline hover:no-underline">
                Clear selection
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowActions(!showActions)}
                className="px-4 py-2 bg-white text-primary rounded hover:bg-gray-100 transition-colors font-medium"
              >
                {showActions ? "Hide Actions" : "Show Actions"}
              </button>

              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Expanded Actions */}
          {showActions && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">Change Status</label>
                  <select
                    onChange={(e) => e.target.value && handleUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded border-0 focus:ring-2 focus:ring-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select status...
                    </option>
                    {workflowStates.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-2">Change Priority</label>
                  <select
                    onChange={(e) => e.target.value && handleUpdatePriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded border-0 focus:ring-2 focus:ring-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select priority...
                    </option>
                    <option value="highest">Highest</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="lowest">Lowest</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium mb-2">Assign To</label>
                  <select
                    onChange={(e) => e.target.value && handleAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded border-0 focus:ring-2 focus:ring-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select assignee...
                    </option>
                    <option value="unassigned">Unassigned</option>
                    {members?.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.userName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sprint */}
                <div>
                  <label className="block text-sm font-medium mb-2">Move to Sprint</label>
                  <select
                    onChange={(e) => e.target.value && handleMoveToSprint(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded border-0 focus:ring-2 focus:ring-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select sprint...
                    </option>
                    <option value="backlog">Backlog</option>
                    {sprints?.map((sprint) => (
                      <option key={sprint._id} value={sprint._id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Issues"
        message={`Are you sure you want to delete ${count} issue${count !== 1 ? "s" : ""}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
