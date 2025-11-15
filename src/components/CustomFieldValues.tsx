import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "./ui/Button";

interface CustomFieldValuesProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function CustomFieldValues({ issueId, projectId }: CustomFieldValuesProps) {
  const [editingFieldId, setEditingFieldId] = useState<Id<"customFields"> | null>(null);
  const [editValue, setEditValue] = useState("");

  const customFields = useQuery(api.customFields.list, { projectId });
  const fieldValues = useQuery(api.customFields.getValuesForIssue, { issueId });
  const setValue = useMutation(api.customFields.setValue);
  const removeValue = useMutation(api.customFields.removeValue);

  if (!customFields || customFields.length === 0) {
    return null;
  }

  const getFieldValue = (fieldId: Id<"customFields">) => {
    return fieldValues?.find((v) => v.fieldId === fieldId);
  };

  const handleEdit = (fieldId: Id<"customFields">, currentValue?: string) => {
    setEditingFieldId(fieldId);
    setEditValue(currentValue || "");
  };

  const handleSave = async (fieldId: Id<"customFields">) => {
    try {
      if (!editValue.trim()) {
        await removeValue({ issueId, fieldId });
      } else {
        await setValue({ issueId, fieldId, value: editValue.trim() });
      }
      setEditingFieldId(null);
      setEditValue("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update field");
    }
  };

  const handleCancel = () => {
    setEditingFieldId(null);
    setEditValue("");
  };

  const renderFieldInput = (field: any) => {
    switch (field.fieldType) {
      case "text":
      case "url":
        return (
          <input
            type={field.fieldType === "url" ? "url" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
            placeholder={field.description || `Enter ${field.name.toLowerCase()}...`}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
            placeholder="Enter number..."
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editValue === "true"}
              onChange={(e) => setEditValue(e.target.checked ? "true" : "false")}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.description || "Check to enable"}
            </span>
          </div>
        );

      case "select":
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select an option...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option: string) => {
              const selectedOptions = editValue
                .split(",")
                .map((o) => o.trim())
                .filter((o) => o);
              const isSelected = selectedOptions.includes(option);

              return (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditValue([...selectedOptions, option].join(", "));
                      } else {
                        setEditValue(selectedOptions.filter((o) => o !== option).join(", "));
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
          />
        );
    }
  };

  const renderFieldValue = (field: any, value?: string) => {
    if (!value) {
      return <span className="text-gray-400 dark:text-gray-500 italic text-sm">Not set</span>;
    }

    switch (field.fieldType) {
      case "checkbox":
        return value === "true" ? (
          <span className="text-green-600 dark:text-green-400">✓ Yes</span>
        ) : (
          <span className="text-gray-500">✗ No</span>
        );

      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {value}
          </a>
        );

      case "date":
        return new Date(value).toLocaleDateString();

      case "multiselect":
        return (
          <div className="flex flex-wrap gap-1">
            {value.split(",").map((option) => (
              <span
                key={option.trim()}
                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
              >
                {option.trim()}
              </span>
            ))}
          </div>
        );

      default:
        return <span className="text-gray-900 dark:text-gray-100">{value}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Custom Fields
      </h3>

      {customFields.map((field) => {
        const fieldValue = getFieldValue(field._id);
        const isEditing = editingFieldId === field._id;

        return (
          <div key={field._id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.name}
                  </label>
                  {field.isRequired && <span className="text-red-500 text-xs">*</span>}
                </div>
                {field.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {field.description}
                  </p>
                )}
              </div>
              {!isEditing && (
                <Button
                  onClick={() => handleEdit(field._id, fieldValue?.value)}
                  variant="secondary"
                  size="sm"
                >
                  {fieldValue ? "Edit" : "Set"}
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                {renderFieldInput(field)}
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(field._id)} size="sm">
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="secondary" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1">{renderFieldValue(field, fieldValue?.value)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
