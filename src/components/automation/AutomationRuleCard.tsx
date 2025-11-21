import { useMutation } from "convex/react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "../ui/Card";

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">{rule.name}</h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                rule.isActive
                  ? "bg-status-success/10 text-status-success dark:bg-status-success/30 dark:text-status-success"
                  : "bg-ui-bg-tertiary text-ui-text-primary dark:bg-ui-bg-tertiary-dark dark:text-ui-text-primary-dark"
              }`}
            >
              {rule.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {rule.description && (
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-3">{rule.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">When:</span>
              <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded">
                {getTriggerLabel(rule.trigger)}
                {rule.triggerValue && ` → ${rule.triggerValue}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">Then:</span>
              <span className="px-2 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded">
                {getActionLabel(rule.actionType)}
              </span>
            </div>

            <div className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Executed: {rule.executionCount} times
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            className="p-2 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded transition-colors"
            title={rule.isActive ? "Disable rule" : "Enable rule"}
            aria-label={rule.isActive ? "Disable rule" : "Enable rule"}
          >
            {rule.isActive ? "⏸️" : "▶️"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded transition-colors"
            title="Edit rule"
            aria-label="Edit rule"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded transition-colors"
            title="Delete rule"
            aria-label="Delete rule"
          >
            🗑️
          </button>
        </div>
      </div>
    </Card>
  );
}
