import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface AutomationRuleCardProps {
  rule: {
    _id: Id<"automationRules">;
    name: string;
    description?: string;
    trigger: string;
    triggerValue?: string;
    actionType: string;
    actionValue: string;
    isActive: boolean;
    executionCount: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const getTriggerLabel = (trigger: string) => {
  const labels: Record<string, string> = {
    status_changed: "Status Changed",
    assignee_changed: "Assignee Changed",
    priority_changed: "Priority Changed",
    issue_created: "Issue Created",
    label_added: "Label Added",
  };
  return labels[trigger] || trigger;
};

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    set_assignee: "Set Assignee",
    set_priority: "Set Priority",
    add_label: "Add Label",
    add_comment: "Add Comment",
    send_notification: "Send Notification",
  };
  return labels[actionType] || actionType;
};

/**
 * Card component for displaying an individual automation rule
 * Extracted from AutomationRulesManager for better reusability
 */
export function AutomationRuleCard({ rule, onEdit, onDelete }: AutomationRuleCardProps) {
  const updateRule = useMutation(api.automationRules.update);

  const handleToggle = async () => {
    try {
      await updateRule({
        id: rule._id,
        isActive: !rule.isActive,
      });
      showSuccess(rule.isActive ? "Rule disabled" : "Rule enabled");
    } catch (error) {
      showError(error, "Failed to toggle rule");
    }
  };

  return (
    <Card className="p-4">
      <Flex justify="between" align="start" gap="lg">
        <div className="flex-1 min-w-0">
          <Flex gap="md" align="center" className="mb-2">
            <h4 className="font-medium text-ui-text-primary">{rule.name}</h4>
            <Badge variant={rule.isActive ? "success" : "neutral"} size="md">
              {rule.isActive ? "Active" : "Inactive"}
            </Badge>
          </Flex>

          {rule.description && (
            <Typography variant="p" color="secondary" className="text-sm mb-3">
              {rule.description}
            </Typography>
          )}

          <Flex gap="lg" align="center" className="text-sm">
            <Flex gap="sm" align="center">
              <span className="text-ui-text-tertiary">When:</span>
              <Badge variant="brand" size="md">
                {getTriggerLabel(rule.trigger)}
                {rule.triggerValue && ` → ${rule.triggerValue}`}
              </Badge>
            </Flex>

            <Flex gap="sm" align="center">
              <span className="text-ui-text-tertiary">Then:</span>
              <Badge variant="accent" size="md">
                {getActionLabel(rule.actionType)}
              </Badge>
            </Flex>

            <div className="text-ui-text-tertiary">Executed: {rule.executionCount} times</div>
          </Flex>
        </div>

        <Flex gap="sm" align="center" className="shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            className="p-2 hover:bg-ui-bg-secondary rounded transition-colors"
            title={rule.isActive ? "Disable rule" : "Enable rule"}
            aria-label={rule.isActive ? "Disable rule" : "Enable rule"}
          >
            {rule.isActive ? "⏸️" : "▶️"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-ui-bg-secondary rounded transition-colors"
            title="Edit rule"
            aria-label="Edit rule"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 hover:bg-ui-bg-secondary rounded transition-colors"
            title="Delete rule"
            aria-label="Delete rule"
          >
            🗑️
          </button>
        </Flex>
      </Flex>
    </Card>
  );
}
