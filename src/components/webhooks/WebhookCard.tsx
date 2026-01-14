import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface WebhookCardProps {
  webhook: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    isActive: boolean;
    events: string[];
    lastTriggered?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single webhook configuration
 * Extracted from WebhooksManager for better reusability
 */
export function WebhookCard({ webhook, onEdit, onDelete }: WebhookCardProps) {
  return (
    <div className="p-4 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary transition-colors">
      <Flex justify="between" align="start">
        <div className="flex-1">
          <Flex gap="sm" align="center" className="mb-2">
            <Typography variant="h4" className="font-medium text-ui-text-primary">
              {webhook.name}
            </Typography>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded",
                webhook.isActive
                  ? "bg-status-success/10 text-status-success"
                  : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark",
              )}
            >
              {webhook.isActive ? "Active" : "Inactive"}
            </span>
          </Flex>
          <Typography className="text-sm text-ui-text-secondary mb-2 font-mono break-all">
            {webhook.url}
          </Typography>
          <Flex wrap gap="xs">
            {webhook.events.map((event) => (
              <span
                key={event}
                className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded"
              >
                {event}
              </span>
            ))}
          </Flex>
          {webhook.lastTriggered && (
            <Typography className="text-xs text-ui-text-tertiary mt-2">
              Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
            </Typography>
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
