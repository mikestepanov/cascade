import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";

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

  const _project = useQuery(api.projects.get, { id: projectId });
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
      showSuccess(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update status");
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    try {
      const result = await bulkUpdatePriority({
        issueIds,
        priority: priority as "lowest" | "low" | "medium" | "high" | "highest",
      });
      showSuccess(`Updated ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to update priority");
    }
  };

  const handleAssign = async (assigneeId: string) => {
    try {
      const result = await bulkAssign({
        issueIds,
        assigneeId: assigneeId === "unassigned" ? null : (assigneeId as Id<"users">),
      });
      showSuccess(`Assigned ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to assign issues");
    }
  };

  const handleMoveToSprint = async (sprintId: string) => {
    try {
      const result = await bulkMoveToSprint({
        issueIds,
        sprintId: sprintId === "backlog" ? null : (sprintId as Id<"sprints">),
      });
      showSuccess(`Moved ${result.updated} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to move to sprint");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await bulkDelete({ issueIds });
      showSuccess(`Deleted ${result.deleted} issue(s)`);
      onClearSelection();
    } catch (error) {
      showError(error, "Failed to delete issues");
    } finally {
      setDeleteConfirm(false);
    }
  };

  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-brand-600 text-white shadow-lg z-30 transition-transform">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Flex align="center" justify="between" gap="lg">
            {/* Selection Info */}
            <Flex align="center" gap="lg">
              <p className="font-medium">
                {count} issue{count !== 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-sm underline hover:no-underline"
              >
                Clear selection
              </button>
            </Flex>

            {/* Actions */}
            <Flex align="center" gap="sm" className="flex-wrap">
              <button
                type="button"
                onClick={() => setShowActions(!showActions)}
                className="px-4 py-2 bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-brand-600 dark:text-brand-400 rounded hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors font-medium"
              >
                {showActions ? "Hide Actions" : "Show Actions"}
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 bg-status-error text-white rounded hover:bg-status-error-hover transition-colors"
              >
                Delete
              </button>
            </Flex>
          </Flex>

          {/* Expanded Actions */}
          {showActions && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <div className="block text-sm font-medium mb-2">Change Status</div>
                  <select
                    onChange={(e) => e.target.value && handleUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded border-0 focus:ring-2 focus:ring-white"
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
                  <div className="block text-sm font-medium mb-2">Change Priority</div>
                  <select
                    onChange={(e) => e.target.value && handleUpdatePriority(e.target.value)}
                    className="w-full px-3 py-2 bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded border-0 focus:ring-2 focus:ring-white"
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
                  <div className="block text-sm font-medium mb-2">Assign To</div>
                  <select
                    onChange={(e) => e.target.value && handleAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded border-0 focus:ring-2 focus:ring-white"
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
                  <div className="block text-sm font-medium mb-2">Move to Sprint</div>
                  <select
                    onChange={(e) => e.target.value && handleMoveToSprint(e.target.value)}
                    className="w-full px-3 py-2 bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded border-0 focus:ring-2 focus:ring-white"
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
