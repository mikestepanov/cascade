import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FormDialog } from "../ui/FormDialog";

type FieldType = "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "url";

interface CustomFieldFormProps {
  projectId: Id<"projects">;
  field?: {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracted form component for creating/editing custom fields
 * Separated from CustomFieldsManager for better reusability
 */
export function CustomFieldForm({ projectId, field, isOpen, onClose }: CustomFieldFormProps) {
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createField = useMutation(api.customFields.create);
  const updateField = useMutation(api.customFields.update);

  // Reset form when field changes or dialog opens
  useEffect(() => {
    if (field) {
      setName(field.name);
      setFieldKey(field.fieldKey);
      setFieldType(field.fieldType as FieldType);
      setOptions(field.options?.join(", ") || "");
      setIsRequired(field.isRequired);
      setDescription(field.description || "");
    } else {
      setName("");
      setFieldKey("");
      setFieldType("text");
      setOptions("");
      setIsRequired(false);
      setDescription("");
    }
  }, [field]);

  const handleSave = async () => {
    if (!name.trim() || (!field && !fieldKey.trim())) {
      showError("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);

      const optionsArray =
        fieldType === "select" || fieldType === "multiselect"
          ? options
              .split(",")
              .map((o) => o.trim())
              .filter((o) => o)
          : undefined;

      if (field) {
        await updateField({
          id: field._id,
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

      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save field");
    } finally {
      setIsLoading(false);
    }
  };

  const requiresOptions = fieldType === "select" || fieldType === "multiselect";

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title={field ? "Edit Custom Field" : "Create Custom Field"}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Field Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g., Sprint Points"
          />
        </div>

        {/* Field Key (only for create) */}
        {!field && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Key *
            </label>
            <input
              type="text"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 font-mono"
              placeholder="e.g., sprint_points"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unique identifier (lowercase, underscores only)
            </p>
          </div>
        )}

        {/* Field Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Field Type *
          </label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as FieldType)}
            disabled={!!field}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Select (Dropdown)</option>
            <option value="multiselect">Multi-Select</option>
            <option value="date">Date</option>
            <option value="checkbox">Checkbox</option>
            <option value="url">URL</option>
          </select>
          {field && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Field type cannot be changed after creation
            </p>
          )}
        </div>

        {/* Options (for select types) */}
        {requiresOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Options *
            </label>
            <input
              type="text"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Option 1, Option 2, Option 3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate options with commas
            </p>
          </div>
        )}

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

        {/* Required Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRequired"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isRequired" className="text-sm text-gray-700 dark:text-gray-300">
            Required field
          </label>
        </div>
      </div>
    </FormDialog>
  );
}
