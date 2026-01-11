import type { Id } from "@convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

type IssueType = "task" | "bug" | "story" | "epic";
type IssuePriority = "lowest" | "low" | "medium" | "high" | "highest";

interface TemplateCardProps {
  template: {
    _id: Id<"issueTemplates">;
    name: string;
    type: IssueType;
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: IssuePriority;
    defaultLabels?: string[];
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single issue template
 * Extracted from TemplatesManager for better reusability
 */
export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const getTypeIcon = (type: IssueType) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  return (
    <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark transition-colors">
      <Flex justify="between" align="start">
        <div className="flex-1">
          <Flex gap="sm" align="center" className="mb-2">
            <span className="text-lg">{getTypeIcon(template.type)}</span>
            <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              {template.name}
            </h4>
            <span className="text-xs px-2 py-0.5 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded capitalize">
              {template.type}
            </span>
            <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded capitalize">
              {template.defaultPriority}
            </span>
          </Flex>
          <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-1">
            <span className="font-medium">Title:</span> {template.titleTemplate}
          </Typography>
          {template.descriptionTemplate && (
            <Typography className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark line-clamp-2">
              {template.descriptionTemplate}
            </Typography>
          )}
          {template.defaultLabels && template.defaultLabels.length > 0 && (
            <Flex gap="xs" className="mt-2">
              {template.defaultLabels.map((label) => (
                <span
                  key={label}
                  className="text-xs px-2 py-0.5 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded"
                >
                  {label}
                </span>
              ))}
            </Flex>
          )}
        </div>

        <Flex gap="sm" className="ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            leftIcon={
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            leftIcon={
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            }
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
