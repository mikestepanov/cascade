import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/form/Checkbox";
import { Input } from "./ui/form/Input";
import { Select } from "./ui/form/Select";

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update field");
    }
  };

  const handleCancel = () => {
    setEditingFieldId(null);
    setEditValue("");
  };

  type CustomField = {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  };

  const renderFieldInput = (field: CustomField) => {
    switch (field.fieldType) {
      case "text":
      case "url":
        return (
          <Input
            type={field.fieldType === "url" ? "url" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}...`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter number..."
          />
        );

      case "date":
        return (
          <Input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        );

      case "checkbox":
        return (
          <Checkbox
            label={field.description || "Check to enable"}
            checked={editValue === "true"}
            onChange={(e) => setEditValue(e.target.checked ? "true" : "false")}
          />
        );

      case "select":
        return (
          <Select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
            <option value="">Select an option...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
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
                <Checkbox
                  key={option}
                  label={option}
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditValue([...selectedOptions, option].join(", "));
                    } else {
                      setEditValue(selectedOptions.filter((o) => o !== option).join(", "));
                    }
                  }}
                />
              );
            })}
          </div>
        );

      default:
        return (
          <Input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        );
    }
  };

  const renderFieldValue = (field: CustomField, value?: string) => {
    if (!value) {
      return (
        <span className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark italic text-sm">
          Not set
        </span>
      );
    }

    switch (field.fieldType) {
      case "checkbox":
        return value === "true" ? (
          <span className="text-status-success dark:text-status-success-dark">✓ Yes</span>
        ) : (
          <span className="text-ui-text-secondary dark:text-ui-text-secondary-dark">✗ No</span>
        );

      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline"
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
                className="text-xs px-2 py-1 bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 rounded"
              >
                {option.trim()}
              </span>
            ))}
          </div>
        );

      default:
        return <span className="text-ui-text-primary dark:text-ui-text-primary-dark">{value}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark uppercase tracking-wide">
        Custom Fields
      </h3>

      {customFields.map((field) => {
        const fieldValue = getFieldValue(field._id);
        const isEditing = editingFieldId === field._id;

        return (
          <div
            key={field._id}
            className="border-b border-ui-border-secondary dark:border-ui-border-secondary-dark pb-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                    {field.name}
                  </div>
                  {field.isRequired && (
                    <span className="text-status-error dark:text-status-error-dark text-xs">*</span>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-0.5">
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
