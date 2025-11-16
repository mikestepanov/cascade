import { Button } from "../ui/Button";
import type { Id } from "../../../convex/_generated/dataModel";

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
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">{webhook.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                webhook.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {webhook.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2 font-mono break-all">{webhook.url}</p>
          <div className="flex flex-wrap gap-1">
            {webhook.events.map((event) => (
              <span key={event} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {event}
              </span>
            ))}
          </div>
          {webhook.lastTriggered && (
            <p className="text-xs text-gray-500 mt-2">
              Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
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
        </div>
      </div>
    </div>
  );
}
