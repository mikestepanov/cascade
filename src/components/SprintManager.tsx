import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { SkeletonProjectCard } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

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
        <Flex align="center" justify="between" className="mb-6">
          <Typography variant="h2" className="text-xl font-semibold text-ui-text">
            Sprint Management
          </Typography>
        </Flex>
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
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="md"
        className="sm:flex-row sm:items-center mb-6"
      >
        <Typography variant="h2" className="text-xl font-semibold text-ui-text">
          Sprint Management
        </Typography>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            <span className="hidden sm:inline">Create Sprint</span>
            <span className="sm:hidden">+ Sprint</span>
          </Button>
        )}
      </Flex>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="bg-ui-bg-secondary p-4 rounded-lg mb-6 border border-ui-border">
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
            <Flex direction="column" gap="sm" className="sm:flex-row">
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
            </Flex>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.length === 0 ? (
          <div className="text-center py-12 text-ui-text-secondary">
            No sprints created yet. Create your first sprint to get started.
          </div>
        ) : (
          sprints.map((sprint: Doc<"sprints"> & { issueCount: number }) => (
            <div key={sprint._id} className="bg-ui-bg border border-ui-border rounded-lg p-4">
              <Flex
                direction="column"
                align="start"
                justify="between"
                gap="lg"
                className="sm:flex-row sm:items-center"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <Flex wrap align="center" gap="sm" className="sm:gap-3 mb-2">
                    <Typography
                      variant="h3"
                      className="text-base sm:text-lg font-medium text-ui-text"
                    >
                      {sprint.name}
                    </Typography>
                    <Badge size="md" className={getStatusColor(sprint.status)}>
                      {sprint.status}
                    </Badge>
                    <span className="text-sm text-ui-text-secondary">
                      {sprint.issueCount} issues
                    </span>
                  </Flex>
                  {sprint.goal && (
                    <Typography className="text-ui-text-secondary mb-2">{sprint.goal}</Typography>
                  )}
                  {sprint.startDate && sprint.endDate && (
                    <Typography className="text-sm text-ui-text-secondary">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </Typography>
                  )}
                </div>
                {canEdit && (
                  <Flex direction="column" gap="sm" className="sm:flex-row w-full sm:w-auto">
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
                  </Flex>
                )}
              </Flex>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
