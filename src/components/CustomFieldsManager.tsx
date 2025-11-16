import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { InputField } from "./ui/FormField";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface CustomFieldsManagerProps {
  projectId: Id<"projects">;
}

type FieldType = "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "url";

export function CustomFieldsManager({ projectId }: CustomFieldsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"customFields"> | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState("");

  const customFields = useQuery(api.customFields.list, { projectId });
  const createField = useMutation(api.customFields.create);
  const updateField = useMutation(api.customFields.update);
  const removeField = useMutation(api.customFields.remove);

  const resetForm = () => {
    setName("");
    setFieldKey("");
    setFieldType("text");
    setOptions("");
    setIsRequired(false);
    setDescription("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (field: {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  }) => {
    setName(field.name);
    setFieldKey(field.fieldKey);
    setFieldType(field.fieldType);
    setOptions(field.options?.join(", ") || "");
    setIsRequired(field.isRequired);
    setDescription(field.description || "");
    setEditingId(field._id);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!name.trim() || (!editingId && !fieldKey.trim())) {
      showError("Please fill in all required fields");
      return;
    }

    try {
      const optionsArray =
        fieldType === "select" || fieldType === "multiselect"
          ? options
              .split(",")
              .map((o) => o.trim())
              .filter((o) => o)
          : undefined;

      if (editingId) {
        await updateField({
          id: editingId,
          name,
          options: optionsArray,
          isRequired,
          description: description || undefined,
        });
        showSuccess("Field updated");
      } else {
        await createField({
          projectId,
          name,
          fieldKey: fieldKey.toLowerCase().replace(/\s+/g, "_"),
          fieldType,
          options: optionsArray,
          isRequired,
          description: description || undefined,
        });
        showSuccess("Field created");
      }
      resetForm();
    } catch (error) {
      showError(error, "Failed to save field");
    }
  };

  const handleDelete = async (id: Id<"customFields">) => {
    if (!confirm("Are you sure? This will delete all values for this field.")) {
      return;
    }

    try {
      await removeField({ id });
      showSuccess("Field deleted");
    } catch (error) {
      showError(error, "Failed to delete field");
    }
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case "text":
        return "📝";
      case "number":
        return "🔢";
      case "select":
        return "📋";
      case "multiselect":
        return "☑️";
      case "date":
        return "📅";
      case "checkbox":
        return "✅";
      case "url":
        return "🔗";
      default:
        return "📄";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Custom Fields</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add custom metadata fields to your issues
          </p>
        </div>
        {!isCreating && <Button onClick={() => setIsCreating(true)}>+ Add Field</Button>}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingId ? "Edit Field" : "New Field"}
          </h3>
          <div className="space-y-4">
            <InputField
              label="Field Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer ID"
              required
            />

            {!editingId && (
              <InputField
                label="Field Key"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="customer_id"
                required
                helperText="Unique identifier (lowercase, underscores only)"
              />
            )}

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Field Type {!editingId && <span className="text-red-500">*</span>}
              </div>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                disabled={!!editingId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select (single)</option>
                <option value="multiselect">Multi-Select</option>
                <option value="date">Date</option>
                <option value="checkbox">Checkbox</option>
                <option value="url">URL</option>
              </select>
            </div>

            {(fieldType === "select" || fieldType === "multiselect") && (
              <div>
                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Options (comma-separated)
                </div>
                <input
                  type="text"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label
                htmlFor="isRequired"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Required field
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave}>{editingId ? "Update Field" : "Create Field"}</Button>
              <Button onClick={resetForm} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

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
            <Card key={field._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getFieldTypeIcon(field.fieldType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {field.name}
                      </h3>
                      {field.isRequired && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                        {field.fieldKey}
                      </code>
                      <span>•</span>
                      <span className="capitalize">{field.fieldType}</span>
                    </div>
                    {field.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {field.description}
                      </p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.options.map((option) => (
                          <span
                            key={option}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(field)} variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(field._id)}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 dark:text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
