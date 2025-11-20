import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { SkeletonProjectCard } from "./ui/Skeleton";

interface SprintManagerProps {
  projectId: Id<"projects">;
}

export function SprintManager({ projectId }: SprintManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");

  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const createSprint = useMutation(api.sprints.create);
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await createSprint({
        projectId,
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
      });

      setNewSprintName("");
      setNewSprintGoal("");
      setShowCreateForm(false);
      showSuccess("Sprint created successfully");
    } catch (error) {
      showError(error, "Failed to create sprint");
    }
  };

  const handleStartSprint = async (sprintId: Id<"sprints">) => {
    const startDate = Date.now();
    const endDate = startDate + 14 * 24 * 60 * 60 * 1000; // 2 weeks

    try {
      await startSprint({
        sprintId,
        startDate,
        endDate,
      });
      showSuccess("Sprint started successfully");
    } catch (error) {
      showError(error, "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: Id<"sprints">) => {
    try {
      await completeSprint({ sprintId });
      showSuccess("Sprint completed successfully");
    } catch (error) {
      showError(error, "Failed to complete sprint");
    }
  };

  if (!sprints) {
    return (
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sprint Management</h2>
        </div>
        <div className="space-y-4">
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sprint Management</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="px-3 sm:px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Create Sprint</span>
          <span className="sm:hidden">+ Sprint</span>
        </button>
      </div>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={(e) => void handleCreateSprint(e)} className="space-y-4">
            <Input
              label="Sprint Name"
              type="text"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              placeholder="e.g., Sprint 1"
            />
            <Textarea
              label="Sprint Goal (Optional)"
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              placeholder="What do you want to achieve in this sprint?"
              rows={2}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Create Sprint
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSprintName("");
                  setNewSprintGoal("");
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No sprints created yet. Create your first sprint to get started.
          </div>
        ) : (
          sprints.map((sprint) => (
            <div key={sprint._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{sprint.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sprint.status)}`}
                    >
                      {sprint.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{sprint.issueCount} issues</span>
                  </div>
                  {sprint.goal && <p className="text-gray-600 dark:text-gray-400 mb-2">{sprint.goal}</p>}
                  {sprint.startDate && sprint.endDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {sprint.status === "future" && (
                    <button
                      type="button"
                      onClick={() => void handleStartSprint(sprint._id)}
                      className="px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white rounded text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    >
                      Start Sprint
                    </button>
                  )}
                  {sprint.status === "active" && (
                    <button
                      type="button"
                      onClick={() => void handleCompleteSprint(sprint._id)}
                      className="px-3 py-1.5 bg-gray-600 dark:bg-gray-500 text-white rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      Complete Sprint
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
