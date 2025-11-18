import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          Sub-tasks
          {totalSubtasks > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({completedSubtasks}/{totalSubtasks} completed)
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => setIsCreatingSubtask(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Sub-task
        </button>
      </div>

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
          />
        </div>
      )}

      {/* Create sub-task form */}
      {isCreatingSubtask && (
        <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateSubtask}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingSubtask(false);
                setSubtaskTitle("");
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub-task list */}
      {subtasks && subtasks.length > 0 ? (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask._id}
              className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 group"
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">{subtask.key}</span>
                  <span className="text-sm text-gray-900">{subtask.title}</span>
                </div>
                {subtask.assignee && (
                  <span className="text-xs text-gray-500">Assigned to {subtask.assignee.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isCreatingSubtask && <p className="text-sm text-gray-500 italic">No sub-tasks yet</p>
      )}
    </div>
  );
}
