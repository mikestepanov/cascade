import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface WebhookLogsProps {
  webhookId: Id<"webhooks">;
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookLogs({ webhookId, isOpen, onClose }: WebhookLogsProps) {
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ✗ Failed
          </span>
        );
      case "retrying":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
    <Modal isOpen={isOpen} onClose={onClose} title="Webhook Delivery Logs" maxWidth="5xl">
      <div className="p-6">
        {!executions || executions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No delivery logs yet</h3>
            <p className="text-sm text-gray-500">
              Webhook deliveries will appear here once triggered
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Showing {executions.length} most recent deliveries
            </div>

            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(execution.status)}
                      <span className="text-sm font-medium text-gray-900">{execution.event}</span>
                      {execution.responseStatus && (
                        <span className="text-xs text-gray-500">HTTP {execution.responseStatus}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
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
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 mb-2">
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
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                      <div className="text-xs font-medium text-red-800 mb-1">Error:</div>
                      <div className="text-xs text-red-700 font-mono">{execution.error}</div>
                    </div>
                  )}

                  {/* Expandable Details */}
                  {selectedExecution === execution._id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      {/* Request Payload */}
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Request Payload:
                        </div>
                        <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
                          {JSON.stringify(JSON.parse(execution.requestPayload), null, 2)}
                        </pre>
                      </div>

                      {/* Response Body */}
                      {execution.responseBody && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            Response Body:
                          </div>
                          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto max-h-48">
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
      </div>
    </Modal>
  );
}
