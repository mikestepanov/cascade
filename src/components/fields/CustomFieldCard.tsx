import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

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
      <Flex justify="between" align="start">
        <Flex gap="md" align="start" className="flex-1">
          <div className="text-2xl">{getFieldTypeIcon(field.fieldType)}</div>
          <div className="flex-1">
            <Flex gap="sm" align="center">
              <Typography variant="h3" className="font-semibold text-ui-text-primary">
                {field.name}
              </Typography>
              {field.isRequired && <Badge variant="error">Required</Badge>}
            </Flex>
            <Flex gap="sm" align="center" className="text-sm text-ui-text-secondary mt-1">
              <code className="px-2 py-0.5 bg-ui-bg-secondary rounded font-mono text-xs">
                {field.fieldKey}
              </code>
              <span>•</span>
              <span className="capitalize">{field.fieldType}</span>
            </Flex>
            {field.description && (
              <Typography variant="muted" className="mt-2">
                {field.description}
              </Typography>
            )}
            {field.options && field.options.length > 0 && (
              <Flex wrap gap="xs" className="mt-2">
                {field.options.map((option) => (
                  <Badge key={option} variant="secondary" size="md">
                    {option}
                  </Badge>
                ))}
              </Flex>
            )}
          </div>
        </Flex>
        <Flex gap="sm">
          <Button onClick={onEdit} variant="secondary" size="sm">
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="secondary"
            size="sm"
            className="text-status-error dark:text-status-error"
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
