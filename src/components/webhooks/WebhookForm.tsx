import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toggleInArray } from "@/lib/array-utils";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Input } from "../ui/form";
import { Checkbox } from "../ui/form/Checkbox";
import { Modal } from "../ui/Modal";

interface WebhookFormProps {
  projectId: Id<"projects">;
  webhook?: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    secret?: string;
    events: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_EVENTS = [
  { value: "issue.created", label: "Issue Created" },
  { value: "issue.updated", label: "Issue Updated" },
  { value: "issue.deleted", label: "Issue Deleted" },
  { value: "sprint.started", label: "Sprint Started" },
  { value: "sprint.ended", label: "Sprint Ended" },
  { value: "comment.created", label: "Comment Added" },
];

/**
 * Form component for creating/editing webhooks
 * Extracted from WebhooksManager for better reusability
 */
export function WebhookForm({ projectId, webhook, isOpen, onClose }: WebhookFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWebhook = useMutation(api.webhooks.create);
  const updateWebhook = useMutation(api.webhooks.update);

  // Reset form when webhook changes or dialog opens
  useEffect(() => {
    if (webhook) {
      setName(webhook.name);
      setUrl(webhook.url);
      setSecret(webhook.secret || "");
      setSelectedEvents(webhook.events);
    } else {
      setName("");
      setUrl("");
      setSecret("");
      setSelectedEvents([]);
    }
    setIsSubmitting(false);
  }, [webhook]);

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

      if (webhook) {
        await updateWebhook({ id: webhook._id, ...webhookData });
        showSuccess("Webhook updated");
      } else {
        await createWebhook({ projectId, ...webhookData });
        showSuccess("Webhook created");
      }
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={webhook ? "Edit Webhook" : "Create Webhook"}
      maxWidth="lg"
      fullScreenOnMobile={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <Input
          label="Webhook Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Slack Notifications, Discord Bot"
          required
          autoFocus
        />

        <Input
          label="Webhook URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          required
        />

        <Input
          label="Secret (Optional)"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Used to sign webhook payloads"
          helpText="If provided, webhook payloads will be signed with HMAC-SHA256"
        />

        <div>
          <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Events to Subscribe <span className="text-status-error">*</span>
          </div>
          <div className="space-y-2 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
            {AVAILABLE_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                label={event.label}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
              />
            ))}
          </div>
          {selectedEvents.length === 0 && (
            <p className="mt-1 text-sm text-status-error">Select at least one event</p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            {webhook ? "Update" : "Create"} Webhook
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
