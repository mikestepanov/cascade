import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FormDialog } from "../ui/FormDialog";

interface AutomationRuleFormProps {
  projectId: Id<"projects">;
  rule?: {
    _id: Id<"automationRules">;
    name: string;
    description?: string;
    trigger: string;
    triggerValue?: string;
    actionType: string;
    actionValue: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracted form component for creating/editing automation rules
 * Separated from AutomationRulesManager for better reusability
 */
export function AutomationRuleForm({ projectId, rule, isOpen, onClose }: AutomationRuleFormProps) {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [trigger, setTrigger] = useState(rule?.trigger || "status_changed");
  const [triggerValue, setTriggerValue] = useState(rule?.triggerValue || "");
  const [actionType, setActionType] = useState(rule?.actionType || "add_label");
  const [actionValue, setActionValue] = useState(rule?.actionValue || "");
  const [isLoading, setIsLoading] = useState(false);

  const createRule = useMutation(api.automationRules.create);
  const updateRule = useMutation(api.automationRules.update);

  // Reset form when rule changes
  useState(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || "");
      setTrigger(rule.trigger);
      setTriggerValue(rule.triggerValue || "");
      setActionType(rule.actionType);
      setActionValue(rule.actionValue);
    } else {
      setName("");
      setDescription("");
      setTrigger("status_changed");
      setTriggerValue("");
      setActionType("add_label");
      setActionValue("");
    }
  });

  const handleSave = async () => {
    if (!name.trim() || !actionValue.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Validate JSON for action value
      JSON.parse(actionValue);

      setIsLoading(true);

      if (rule) {
        await updateRule({
          id: rule._id,
          name: name.trim(),
          description: description.trim() || undefined,
          trigger,
          triggerValue: triggerValue.trim() || undefined,
          actionType,
          actionValue: actionValue.trim(),
        });
        toast.success("Rule updated");
      } else {
        await createRule({
          projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          trigger,
          triggerValue: triggerValue.trim() || undefined,
          actionType,
          actionValue: actionValue.trim(),
        });
        toast.success("Rule created");
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rule");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={rule ? "Edit Automation Rule" : "Create Automation Rule"}
      isLoading={isLoading}
      size="lg"
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rule Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g., Auto-assign high priority issues"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Optional description"
          />
        </div>

        {/* Trigger */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trigger Event *
          </label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="status_changed">Status Changed</option>
            <option value="assignee_changed">Assignee Changed</option>
            <option value="priority_changed">Priority Changed</option>
            <option value="issue_created">Issue Created</option>
            <option value="label_added">Label Added</option>
          </select>
        </div>

        {/* Trigger Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trigger Value
          </label>
          <input
            type="text"
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Optional trigger condition"
          />
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action *
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="set_assignee">Set Assignee</option>
            <option value="set_priority">Set Priority</option>
            <option value="add_label">Add Label</option>
            <option value="add_comment">Add Comment</option>
            <option value="send_notification">Send Notification</option>
          </select>
        </div>

        {/* Action Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action Value (JSON) *
          </label>
          <textarea
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 font-mono text-sm"
            placeholder='{"label": "urgent"}'
          />
        </div>
      </div>
    </FormDialog>
  );
}
