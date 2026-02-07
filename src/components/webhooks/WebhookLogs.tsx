import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

type WebhookExecution = Doc<"webhookExecutions">;
type PaginatedQuery = FunctionReference<"query", "public">;

interface WebhookLogsProps {
  webhookId: Id<"webhooks">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookLogs({ webhookId, open, onOpenChange }: WebhookLogsProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const { results: executions } = usePaginatedQuery(
    api.webhooks.listExecutions as PaginatedQuery,
    { webhookId },
    { initialNumItems: 50 },
  ) as { results: WebhookExecution[] };
  const retryExecution = useMutation(api.webhooks.retryExecution);

  const handleRetry = async (executionId: Id<"webhookExecutions">) => {
    try {
      await retryExecution({ id: executionId });
      showSuccess("Webhook delivery queued for retry");
    } catch (error) {
      showError(error, "Failed to retry webhook");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
            ✓ Success
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-error/10 text-status-error">
            ✗ Failed
          </span>
        );
      case "retrying":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-warning/10 text-status-warning">
            ⟳ Retrying
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (createdAt: number, completedAt?: number) => {
    if (!completedAt) return "-";
    const duration = completedAt - createdAt;
    return `${duration}ms`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Webhook Delivery Logs</DialogTitle>
        </DialogHeader>
        {!executions || executions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <Typography variant="h5" className="mb-1">
              No delivery logs yet
            </Typography>
            <Typography variant="caption">
              Webhook deliveries will appear here once triggered
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            <Typography variant="caption" className="mb-4">
              Showing {executions.length} most recent deliveries
            </Typography>

            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution._id}
                  className="border border-ui-border rounded-lg p-4 hover:border-ui-border-secondary transition-colors"
                >
                  {/* Header */}
                  <Flex justify="between" align="center" className="mb-3">
                    <Flex gap="md" align="center">
                      {getStatusBadge(execution.status)}
                      <Typography variant="small">{execution.event}</Typography>
                      {execution.responseStatus && (
                        <Typography variant="meta" as="span">
                          HTTP {String(execution.responseStatus)}
                        </Typography>
                      )}
                    </Flex>
                    <Flex gap="md" align="center">
                      <Typography variant="meta" as="span">
                        {formatDate(execution._creationTime)}
                      </Typography>
                      {execution.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(execution._id)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedExecution(
                            selectedExecution === execution._id ? null : execution._id,
                          )
                        }
                      >
                        {selectedExecution === execution._id ? "Hide Details" : "Show Details"}
                      </Button>
                    </Flex>
                  </Flex>

                  {/* Metadata */}
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <Typography variant="meta">
                      <span className="font-medium text-ui-text">Attempts:</span>{" "}
                      {execution.attempts}
                    </Typography>
                    <Typography variant="meta">
                      <span className="font-medium text-ui-text">Duration:</span>{" "}
                      {formatDuration(execution._creationTime, execution.completedAt)}
                    </Typography>
                    <Typography variant="meta">
                      <span className="font-medium text-ui-text">Status:</span>{" "}
                      {String(execution.status)}
                    </Typography>
                  </div>

                  {/* Error message */}
                  {execution.error && (
                    <div className="bg-status-error-bg border border-status-error/30 rounded p-3 mt-3">
                      <div className="text-xs font-medium text-status-error-text mb-1">Error:</div>
                      <div className="text-xs text-status-error-text/90 font-mono">
                        {String(execution.error)}
                      </div>
                    </div>
                  )}

                  {/* Expandable Details */}
                  {selectedExecution === execution._id && (
                    <div className="mt-3 pt-3 border-t border-ui-border space-y-3">
                      {/* Request Payload */}
                      <div>
                        <Typography variant="label" className="mb-1">
                          Request Payload:
                        </Typography>
                        <pre className="bg-ui-bg-secondary border border-ui-border rounded p-3 text-xs overflow-x-auto">
                          {JSON.stringify(JSON.parse(execution.requestPayload), null, 2)}
                        </pre>
                      </div>

                      {/* Response Body */}
                      {execution.responseBody && (
                        <div>
                          <Typography variant="label" className="mb-1">
                            Response Body:
                          </Typography>
                          <pre className="bg-ui-bg-secondary border border-ui-border rounded p-3 text-xs overflow-x-auto max-h-48">
                            {execution.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
