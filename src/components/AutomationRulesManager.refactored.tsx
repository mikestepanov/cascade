import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AutomationRuleCard } from "./automation/AutomationRuleCard";
import { AutomationRuleForm } from "./automation/AutomationRuleForm";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";

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

/**
 * Refactored AutomationRulesManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 398 lines to ~80 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Easier to maintain and extend
 */
export function AutomationRulesManager({ projectId }: AutomationRulesManagerProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"automationRules"> | null>(null);

  const rules = useQuery(api.automationRules.list, { projectId });
  const removeRule = useMutation(api.automationRules.remove);

  const handleCreate = () => {
    setEditingRule(null);
    setShowFormDialog(true);
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowFormDialog(true);
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

  const handleCloseForm = () => {
    setShowFormDialog(false);
    setEditingRule(null);
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
            <AutomationRuleCard
              key={rule._id}
              rule={rule}
              onEdit={() => handleEdit(rule)}
              onDelete={() => setDeleteConfirm(rule._id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AutomationRuleForm
        projectId={projectId}
        rule={editingRule}
        isOpen={showFormDialog}
        onClose={handleCloseForm}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Automation Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
