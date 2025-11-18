import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Input, Select, Textarea } from "./ui/form";
import { ModalBackdrop } from "./ui/ModalBackdrop";

interface AutomationRulesManagerProps {
  projectId: Id<"projects">;
}

type AutomationRule = {
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

export function AutomationRulesManager({ projectId }: AutomationRulesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"automationRules"> | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("status_changed");
  const [triggerValue, setTriggerValue] = useState("");
  const [actionType, setActionType] = useState("add_label");
  const [actionValue, setActionValue] = useState("");

  const rules = useQuery(api.automationRules.list, { projectId });
  const createRule = useMutation(api.automationRules.create);
  const updateRule = useMutation(api.automationRules.update);
  const removeRule = useMutation(api.automationRules.remove);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTrigger("status_changed");
    setTriggerValue("");
    setActionType("add_label");
    setActionValue("");
    setEditingRule(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (rule: AutomationRule) => {
    setName(rule.name);
    setDescription(rule.description || "");
    setTrigger(rule.trigger);
    setTriggerValue(rule.triggerValue || "");
    setActionType(rule.actionType);
    setActionValue(rule.actionValue);
    setEditingRule(rule);
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !actionValue.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Validate JSON for action value
      JSON.parse(actionValue);

      if (editingRule) {
        await updateRule({
          id: editingRule._id,
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

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rule");
    }
  };

  const handleToggle = async (ruleId: Id<"automationRules">, currentState: boolean) => {
    try {
      await updateRule({
        id: ruleId,
        isActive: !currentState,
      });
      toast.success(currentState ? "Rule disabled" : "Rule enabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle rule");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeRule({ id: deleteConfirm });
      toast.success("Rule deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete rule");
    } finally {
      setDeleteConfirm(null);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Automation Rules
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automate workflows with trigger-based actions
          </p>
        </div>
        <Button onClick={handleCreate}>+ Create Rule</Button>
      </div>

      {/* Rules List */}
      {!rules || rules.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="mb-2">No automation rules yet</p>
            <p className="text-sm">Create your first rule to automate repetitive tasks</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule._id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        rule.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {rule.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">When:</span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {getTriggerLabel(rule.trigger)}
                        {rule.triggerValue && ` → ${rule.triggerValue}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Then:</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                        {getActionLabel(rule.actionType)}
                      </span>
                    </div>

                    <div className="text-gray-500 dark:text-gray-400">
                      Executed: {rule.executionCount} times
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(rule._id, rule.isActive)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={rule.isActive ? "Disable rule" : "Enable rule"}
                  >
                    {rule.isActive ? "⏸️" : "▶️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(rule)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Edit rule"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(rule._id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Delete rule"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <>
          <ModalBackdrop
            onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}
            zIndex="z-50"
            animated={false}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <Input
                  label="Rule Name *"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Auto-assign high priority bugs"
                />

                {/* Description */}
                <Input
                  label="Description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />

                {/* Trigger */}
                <Select
                  label="When (Trigger) *"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                >
                  <option value="status_changed">Status Changed</option>
                  <option value="assignee_changed">Assignee Changed</option>
                  <option value="priority_changed">Priority Changed</option>
                  <option value="issue_created">Issue Created</option>
                  <option value="label_added">Label Added</option>
                </Select>

                {/* Trigger Value */}
                <Input
                  label="Trigger Value (Optional)"
                  type="text"
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="e.g., 'done' for specific status"
                  helperText="Leave empty to trigger on any value change"
                />

                {/* Action Type */}
                <Select
                  label="Then (Action) *"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="set_assignee">Set Assignee</option>
                  <option value="set_priority">Set Priority</option>
                  <option value="add_label">Add Label</option>
                  <option value="add_comment">Add Comment</option>
                  <option value="send_notification">Send Notification</option>
                </Select>

                {/* Action Value */}
                <Textarea
                  label="Action Parameters (JSON) *"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='{"label": "auto-resolved"}'
                  helperText={`Examples: {"label": "urgent"}  {"priority": "high"}  {"comment": "Auto comment"}`}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>{editingRule ? "Update" : "Create"} Rule</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Automation Rule"
        message="Are you sure you want to delete this automation rule? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
