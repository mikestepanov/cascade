import { useMutation } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input, Select } from "../ui/form";
import { Typography } from "../ui/Typography";

interface WorkflowState {
  id: string;
  name: string;
  category: "todo" | "inprogress" | "done";
  order: number;
}

interface WorkflowSettingsProps {
  projectId: Id<"projects">;
  workflowStates: WorkflowState[];
}

const CATEGORY_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "inprogress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const CATEGORY_COLORS: Record<string, string> = {
  todo: "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark",
  inprogress: "bg-status-info/20 text-status-info",
  done: "bg-status-success/20 text-status-success",
};

export function WorkflowSettings({ projectId, workflowStates }: WorkflowSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [states, setStates] = useState<WorkflowState[]>(workflowStates);
  const [isSaving, setIsSaving] = useState(false);

  const updateWorkflow = useMutation(api.workspaces.updateWorkflow);

  const handleEdit = () => {
    setStates([...workflowStates]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setStates(workflowStates);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate
    if (states.some((s) => !s.name.trim())) {
      showError(new Error("All states must have a name"), "Validation error");
      return;
    }

    // Ensure at least one state per category
    const categories = new Set(states.map((s) => s.category));
    if (!(categories.has("todo") && categories.has("inprogress") && categories.has("done"))) {
      showError(
        new Error(
          "Workflow must have at least one state in each category (To Do, In Progress, Done)",
        ),
        "Validation error",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateWorkflow({
        projectId,
        workflowStates: states,
      });
      showSuccess("Workflow updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStateChange = (index: number, field: keyof WorkflowState, value: string | number) => {
    const newStates = [...states];
    newStates[index] = { ...newStates[index], [field]: value };
    setStates(newStates);
  };

  const handleAddState = () => {
    const newId = `state_${Date.now()}`;
    setStates([
      ...states,
      {
        id: newId,
        name: "New State",
        category: "todo",
        order: states.length,
      },
    ]);
  };

  const handleRemoveState = (index: number) => {
    if (states.length <= 3) {
      showError(new Error("Workflow must have at least 3 states"), "Cannot remove");
      return;
    }
    const newStates = states.filter((_, i) => i !== index);
    // Reorder
    newStates.forEach((s, i) => {
      s.order = i;
    });
    setStates(newStates);
  };

  const handleMoveState = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === states.length - 1)
    ) {
      return;
    }

    const newStates = [...states];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newStates[index], newStates[swapIndex]] = [newStates[swapIndex], newStates[index]];
    // Update order
    newStates.forEach((s, i) => {
      s.order = i;
    });
    setStates(newStates);
  };

  // Group states by category for display
  const groupedStates = {
    todo: workflowStates.filter((s) => s.category === "todo").sort((a, b) => a.order - b.order),
    inprogress: workflowStates
      .filter((s) => s.category === "inprogress")
      .sort((a, b) => a.order - b.order),
    done: workflowStates.filter((s) => s.category === "done").sort((a, b) => a.order - b.order),
  };

  return (
    <Card>
      <div className="p-6">
        <Flex justify="between" align="center" className="mb-4">
          <div>
            <Typography variant="large">Workflow</Typography>
            <Typography variant="small" color="secondary">
              Configure issue status workflow
            </Typography>
          </div>
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </Flex>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {states.map((state, index) => (
                <div
                  key={state.id}
                  className="flex items-center gap-3 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
                >
                  <Flex gap="xs" direction="column">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveState(index, "up")}
                      disabled={index === 0}
                      className="p-1 h-6"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveState(index, "down")}
                      disabled={index === states.length - 1}
                      className="p-1 h-6"
                    >
                      ↓
                    </Button>
                  </Flex>
                  <Input
                    value={state.name}
                    onChange={(e) => handleStateChange(index, "name", e.target.value)}
                    className="flex-1"
                    placeholder="State name"
                  />
                  <Select
                    value={state.category}
                    onChange={(e) => handleStateChange(index, "category", e.target.value)}
                    options={CATEGORY_OPTIONS}
                    className="w-36"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveState(index)}
                    className="text-status-error hover:text-status-error"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={handleAddState}>
              + Add State
            </Button>

            <Flex
              gap="sm"
              className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark"
            >
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <div className="space-y-4">
            {(["todo", "inprogress", "done"] as const).map((category) => (
              <div key={category}>
                <Typography variant="small" color="secondary" className="mb-2 capitalize">
                  {category === "inprogress"
                    ? "In Progress"
                    : category === "todo"
                      ? "To Do"
                      : "Done"}
                </Typography>
                <Flex gap="sm" wrap="wrap">
                  {groupedStates[category].map((state) => (
                    <Badge key={state.id} className={CATEGORY_COLORS[state.category]}>
                      {state.name}
                    </Badge>
                  ))}
                </Flex>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
