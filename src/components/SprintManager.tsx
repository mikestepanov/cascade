import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { SkeletonProjectCard } from "./ui/Skeleton";

interface SprintManagerProps {
  projectId: Id<"projects">;
  canEdit?: boolean;
}

export function SprintManager({ projectId, canEdit = true }: SprintManagerProps) {
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
          <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
            Sprint Management
          </h2>
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
        <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
          Sprint Management
        </h2>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            <span className="hidden sm:inline">Create Sprint</span>
            <span className="sm:hidden">+ Sprint</span>
          </Button>
        )}
      </div>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark p-4 rounded-lg mb-6 border border-ui-border-primary dark:border-ui-border-primary-dark">
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
              <Button type="submit" variant="primary">
                Create Sprint
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSprintName("");
                  setNewSprintGoal("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.length === 0 ? (
          <div className="text-center py-12 text-ui-text-secondary dark:text-ui-text-secondary-dark">
            No sprints created yet. Create your first sprint to get started.
          </div>
        ) : (
          sprints.map((sprint) => (
            <div
              key={sprint._id}
              className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                      {sprint.name}
                    </h3>
                    <Badge size="md" className={getStatusColor(sprint.status)}>
                      {sprint.status}
                    </Badge>
                    <span className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                      {sprint.issueCount} issues
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-2">
                      {sprint.goal}
                    </p>
                  )}
                  {sprint.startDate && sprint.endDate && (
                    <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {sprint.status === "future" && (
                      <Button
                        onClick={() => void handleStartSprint(sprint._id)}
                        variant="success"
                        size="sm"
                      >
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === "active" && (
                      <Button
                        onClick={() => void handleCompleteSprint(sprint._id)}
                        variant="secondary"
                        size="sm"
                      >
                        Complete Sprint
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
