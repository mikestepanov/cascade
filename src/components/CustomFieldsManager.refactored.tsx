import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { CustomFieldForm } from "./fields/CustomFieldForm";
import { CustomFieldCard } from "./fields/CustomFieldCard";

interface CustomFieldsManagerProps {
  projectId: Id<"projects">;
}

type CustomField = {
  _id: Id<"customFields">;
  name: string;
  fieldKey: string;
  fieldType: string;
  options?: string[];
  isRequired: boolean;
  description?: string;
};

/**
 * Refactored CustomFieldsManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 329 lines to ~100 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Consistent with AutomationRulesManager pattern
 */
export function CustomFieldsManager({ projectId }: CustomFieldsManagerProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const customFields = useQuery(api.customFields.list, { projectId });
  const removeField = useMutation(api.customFields.remove);

  const handleCreate = () => {
    setEditingField(null);
    setShowFormDialog(true);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setShowFormDialog(true);
  };

  const handleDelete = async (id: Id<"customFields">) => {
    if (!confirm("Are you sure? This will delete all values for this field.")) {
      return;
    }

    try {
      await removeField({ id });
      showSuccess("Field deleted");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete field");
    }
  };

  const handleCloseForm = () => {
    setShowFormDialog(false);
    setEditingField(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Custom Fields
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add custom metadata fields to your issues
          </p>
        </div>
        <Button onClick={handleCreate}>+ Add Field</Button>
      </div>

      {/* Fields List */}
      {!customFields ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : customFields.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 dark:text-gray-400">
            No custom fields yet. Add your first field to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {customFields.map((field) => (
            <CustomFieldCard
              key={field._id}
              field={field}
              onEdit={() => handleEdit(field)}
              onDelete={() => handleDelete(field._id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CustomFieldForm
        projectId={projectId}
        field={editingField}
        isOpen={showFormDialog}
        onClose={handleCloseForm}
      />
    </div>
  );
}
