import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";

interface WebhookLogsProps {
  webhookId: Id<"webhooks">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookLogs({ webhookId, open, onOpenChange }: WebhookLogsProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const executions = useQuery(api.webhooks.listExecutions, { webhookId });
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-status-success/10 dark:bg-status-success/20 text-status-success">
            ✓ Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-status-error/10 dark:bg-status-error/20 text-status-error">
            ✗ Failed
          </span>
        );
      case "retrying":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-status-warning/10 dark:bg-status-warning/20 text-status-warning">
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
            <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              No delivery logs yet
            </h3>
            <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
              Webhook deliveries will appear here once triggered
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
              Showing {executions.length} most recent deliveries
            </div>

            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution._id}
                  className="border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4 hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark transition-colors"
                >
                  {/* Header */}
                  <Flex justify="between" align="center" className="mb-3">
                    <Flex gap="md" align="center">
                      {getStatusBadge(execution.status)}
                      <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {execution.event}
                      </span>
                      {execution.responseStatus && (
                        <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                          HTTP {execution.responseStatus}
                        </span>
                      )}
                    </Flex>
                    <Flex gap="md" align="center">
                      <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        {formatDate(execution.createdAt)}
                      </span>
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
                  <div className="grid grid-cols-3 gap-4 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark mb-2">
                    <div>
                      <span className="font-medium">Attempts:</span> {execution.attempts}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      {formatDuration(execution.createdAt, execution.completedAt)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {execution.status}
                    </div>
                  </div>

                  {/* Error message */}
                  {execution.error && (
                    <div className="bg-status-error/10 dark:bg-status-error/20 border border-status-error/30 dark:border-status-error/50 rounded p-3 mt-3">
                      <div className="text-xs font-medium text-status-error dark:text-status-error mb-1">
                        Error:
                      </div>
                      <div className="text-xs text-status-error/90 dark:text-status-error/80 font-mono">
                        {execution.error}
                      </div>
                    </div>
                  )}

                  {/* Expandable Details */}
                  {selectedExecution === execution._id && (
                    <div className="mt-3 pt-3 border-t border-ui-border-primary dark:border-ui-border-primary-dark space-y-3">
                      {/* Request Payload */}
                      <div>
                        <div className="text-xs font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                          Request Payload:
                        </div>
                        <pre className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded p-3 text-xs overflow-x-auto">
                          {JSON.stringify(JSON.parse(execution.requestPayload), null, 2)}
                        </pre>
                      </div>

                      {/* Response Body */}
                      {execution.responseBody && (
                        <div>
                          <div className="text-xs font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                            Response Body:
                          </div>
                          <pre className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded p-3 text-xs overflow-x-auto max-h-48">
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
