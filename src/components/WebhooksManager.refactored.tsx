import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { WebhookForm } from "./webhooks/WebhookForm";
import { WebhookCard } from "./webhooks/WebhookCard";

interface WebhooksManagerProps {
  projectId: Id<"projects">;
}

type Webhook = {
  _id: Id<"webhooks">;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: number;
};

/**
 * Refactored WebhooksManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 332 lines to ~100 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Consistent with other refactored Manager components
 */
export function WebhooksManager({ projectId }: WebhooksManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"webhooks"> | null>(null);

  const webhooks = useQuery(api.webhooks.listByProject, { projectId });
  const deleteWebhook = useMutation(api.webhooks.remove);

  const handleCreate = () => {
    setEditingWebhook(null);
    setShowModal(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteWebhook({ id: deleteConfirm });
      showSuccess("Webhook deleted");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete webhook");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCloseForm = () => {
    setShowModal(false);
    setEditingWebhook(null);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Webhooks"
          description="Configure webhooks to receive real-time notifications"
          action={
            <Button
              onClick={handleCreate}
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
            />
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <WebhookCard
                  key={webhook._id}
                  webhook={webhook}
                  onEdit={() => handleEdit(webhook)}
                  onDelete={() => setDeleteConfirm(webhook._id)}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Form */}
      <WebhookForm
        projectId={projectId}
        webhook={editingWebhook}
        isOpen={showModal}
        onClose={handleCloseForm}
      />

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
