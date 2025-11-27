import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Flex } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";

interface Subtask {
  _id: Id<"issues">;
  key: string;
  title: string;
  status: string;
  assignee?: { name: string } | null;
}

interface SubtasksListProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  subtasks: Subtask[] | undefined;
}

/**
 * Displays and manages sub-tasks for an issue
 * Includes progress tracking, creation form, and list
 * Extracted from IssueDetailModal for better organization
 */
export function SubtasksList({ issueId, projectId, subtasks }: SubtasksListProps) {
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const createIssue = useMutation(api.issues.create);

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim()) return;

    try {
      await createIssue({
        projectId,
        title: subtaskTitle.trim(),
        type: "subtask",
        priority: "medium",
        parentId: issueId,
      });
      showSuccess("Sub-task created");
      setSubtaskTitle("");
      setIsCreatingSubtask(false);
    } catch (error) {
      showError(error, "Failed to create sub-task");
    }
  };

  // Calculate sub-task progress
  const completedSubtasks =
    subtasks?.filter((st) => st.status === "done" || st.status === "completed").length || 0;
  const totalSubtasks = subtasks?.length || 0;

  return (
    <div>
      <Flex justify="between" align="center" className="mb-3">
        <h3 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
          Sub-tasks
          {totalSubtasks > 0 && (
            <span className="ml-2 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              ({completedSubtasks}/{totalSubtasks} completed)
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => setIsCreatingSubtask(true)}
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-500 font-medium"
        >
          + Add Sub-task
        </button>
      </Flex>

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2 mb-3">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
          />
        </div>
      )}

      {/* Create sub-task form */}
      {isCreatingSubtask && (
        <div className="mb-3 p-3 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <Input
            type="text"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            placeholder="Sub-task title..."
            className="mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateSubtask();
              } else if (e.key === "Escape") {
                setIsCreatingSubtask(false);
                setSubtaskTitle("");
              }
            }}
            autoFocus
          />
          <Flex gap="sm">
            <button
              type="button"
              onClick={handleCreateSubtask}
              className="px-3 py-1 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingSubtask(false);
                setSubtaskTitle("");
              }}
              className="px-3 py-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark text-sm"
            >
              Cancel
            </button>
          </Flex>
        </div>
      )}

      {/* Sub-task list */}
      {subtasks && subtasks.length > 0 ? (
        <Flex direction="column" gap="sm">
          {subtasks.map((subtask) => (
            <Flex
              key={subtask._id}
              gap="sm"
              align="start"
              className="p-2 rounded hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark group"
            >
              <Checkbox
                checked={subtask.status === "done" || subtask.status === "completed"}
                onChange={() => {
                  // Toggle sub-task completion
                  // You can implement this later with a mutation
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <Flex gap="sm" align="center">
                  <span className="text-xs font-mono text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    {subtask.key}
                  </span>
                  <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                    {subtask.title}
                  </span>
                </Flex>
                {subtask.assignee && (
                  <span className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    Assigned to {subtask.assignee.name}
                  </span>
                )}
              </div>
            </Flex>
          ))}
        </Flex>
      ) : (
        !isCreatingSubtask && (
          <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark italic">
            No sub-tasks yet
          </p>
        )
      )}
    </div>
  );
}
