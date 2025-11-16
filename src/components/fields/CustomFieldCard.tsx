import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { Id } from "../../../convex/_generated/dataModel";

type FieldType = "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "url";

interface CustomFieldCardProps {
  field: {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single custom field with its configuration
 * Extracted from CustomFieldsManager for better reusability
 */
export function CustomFieldCard({ field, onEdit, onDelete }: CustomFieldCardProps) {
  const getFieldTypeIcon = (type: string) => {
    switch (type as FieldType) {
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
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{getFieldTypeIcon(field.fieldType)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{field.name}</h3>
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{field.description}</p>
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
          <Button onClick={onEdit} variant="secondary" size="sm">
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="secondary"
            size="sm"
            className="text-red-600 dark:text-red-400"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
