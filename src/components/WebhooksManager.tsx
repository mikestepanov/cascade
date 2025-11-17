import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { toggleInArray } from "@/lib/array-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { InputField } from "./ui/FormField";
import { Modal } from "./ui/Modal";

interface WebhooksManagerProps {
  projectId: Id<"projects">;
}

const AVAILABLE_EVENTS = [
  { value: "issue.created", label: "Issue Created" },
  { value: "issue.updated", label: "Issue Updated" },
  { value: "issue.deleted", label: "Issue Deleted" },
  { value: "sprint.started", label: "Sprint Started" },
  { value: "sprint.ended", label: "Sprint Ended" },
  { value: "comment.created", label: "Comment Added" },
];

export function WebhooksManager({ projectId }: WebhooksManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"webhooks"> | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"webhooks"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const webhooks = useQuery(api.webhooks.listByProject, { projectId });
  const createWebhook = useMutation(api.webhooks.create);
  const updateWebhook = useMutation(api.webhooks.update);
  const deleteWebhook = useMutation(api.webhooks.remove);

  const resetForm = () => {
    setName("");
    setUrl("");
    setSecret("");
    setSelectedEvents([]);
    setEditingId(null);
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEvents.length === 0) {
      showError("Select at least one event");
      return;
    }

    setIsSubmitting(true);
    try {
      const webhookData = {
        name: name.trim(),
        url: url.trim(),
        secret: secret.trim() || undefined,
        events: selectedEvents,
      };

      if (editingId) {
        await updateWebhook({ id: editingId, ...webhookData });
        showSuccess("Webhook updated");
      } else {
        await createWebhook({ projectId, ...webhookData });
        showSuccess("Webhook created");
      }
      resetForm();
    } catch (error) {
      showError(error, "Failed to save webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (webhook: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    secret?: string;
    events: string[];
  }) => {
    setEditingId(webhook._id);
    setName(webhook.name);
    setUrl(webhook.url);
    setSecret(webhook.secret || "");
    setSelectedEvents(webhook.events);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteWebhook({ id: deleteConfirm });
      showSuccess("Webhook deleted");
    } catch (error) {
      showError(error, "Failed to delete webhook");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Webhooks"
          description="Configure webhooks to receive real-time notifications"
          action={
            <Button
              onClick={() => setShowModal(true)}
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              New Webhook
            </Button>
          }
        />

        <CardBody>
          {!webhooks || webhooks.length === 0 ? (
            <EmptyState
              icon="🔗"
              title="No webhooks configured"
              description="Add webhooks to integrate with external services"
              action={{
                label: "Add Your First Webhook",
                onClick: () => setShowModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook._id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
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
                      <p className="text-sm text-gray-600 mb-2 font-mono break-all">
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                          >
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
                        onClick={() => startEdit(webhook)}
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
                        onClick={() => setDeleteConfirm(webhook._id)}
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
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Webhook" : "Create Webhook"}
        maxWidth="lg"
        fullScreenOnMobile={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <InputField
            label="Webhook Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Slack Notifications, Discord Bot"
            required
            autoFocus
          />

          <InputField
            label="Webhook URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            required
          />

          <InputField
            label="Secret (Optional)"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Used to sign webhook payloads"
            helpText="If provided, webhook payloads will be signed with HMAC-SHA256"
          />

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe <span className="text-red-500">*</span>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              {AVAILABLE_EVENTS.map((event) => (
                <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{event.label}</span>
                </label>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Select at least one event</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Update" : "Create"} Webhook
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Webhook"
        message="Are you sure you want to delete this webhook? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
