import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Typography } from "../ui/Typography";

// =============================================================================
// Schema & Constants
// =============================================================================

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  webhookUrl: z
    .string()
    .url("Invalid URL")
    .refine((url) => url.includes("pumble.com"), {
      message: "Must be a valid Pumble webhook URL",
    }),
});

const AVAILABLE_EVENTS = [
  { value: "issue.created", label: "Issue Created" },
  { value: "issue.updated", label: "Issue Updated" },
  { value: "issue.assigned", label: "Issue Assigned" },
  { value: "issue.completed", label: "Issue Completed" },
  { value: "issue.deleted", label: "Issue Deleted" },
  { value: "comment.created", label: "Comment Added" },
];

export function PumbleIntegration() {
  const [showAddModal, setShowAddModal] = useState(false);
  const webhooks = useQuery(api.pumble.listWebhooks);
  const projects = useQuery(api.projects.getCurrentUserProjects);

  return (
    <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-sm border border-ui-border-primary dark:border-ui-border-primary-dark">
      {/* Header */}
      <div className="p-6 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <Flex justify="between" align="start">
          <Flex gap="md" align="center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-linear-to-br from-accent-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                Pumble Integration
              </h3>
              <Typography className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Send notifications to Pumble channels when issues are created or updated
              </Typography>
            </div>
          </Flex>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="bg-accent-600 hover:bg-accent-700"
          >
            Add Webhook
          </Button>
        </Flex>
      </div>

      {/* Content */}
      <div className="p-6">
        {webhooks === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Loading webhooks...
            </div>
          </div>
        ) : webhooks.length === 0 ? (
          <EmptyState onAddWebhook={() => setShowAddModal(true)} />
        ) : (
          <Flex direction="column" gap="lg">
            {webhooks.map((webhook: Doc<"webhooks">) => (
              <WebhookCard key={webhook._id} webhook={webhook} projects={projects || []} />
            ))}
          </Flex>
        )}

        {/* Documentation Link */}
        <div className="mt-6 pt-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <a
            href="https://help.pumble.com/hc/en-us/articles/360041954051-Incoming-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
          >
            <Flex gap="xs" align="center">
              <span>How to create a Pumble incoming webhook</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Flex>
          </a>
        </div>
      </div>

      {/* Add Webhook Modal */}
      <AddWebhookModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        projects={projects || []}
      />
    </div>
  );
}

function EmptyState({ onAddWebhook }: { onAddWebhook: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-accent-600 dark:text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Chat message icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
        No Pumble webhooks configured
      </h3>
      <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6 max-w-md mx-auto">
        Connect Nixelo to Pumble channels to receive notifications when issues are created, updated,
        or assigned.
      </Typography>
      <Button
        onClick={onAddWebhook}
        variant="primary"
        className="bg-accent-600 hover:bg-accent-700"
      >
        Add Your First Webhook
      </Button>
    </div>
  );
}

// WebhookCard component for displaying webhook details
// WebhookCard component for displaying webhook details
interface WebhookCardProps {
  webhook: Doc<"webhooks">;
  projects: Doc<"projects">[];
}

function WebhookCard({ webhook, projects }: WebhookCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const testWebhook = useMutation(api.pumble.testWebhook);
  const deleteWebhook = useMutation(api.pumble.deleteWebhook);
  const updateWebhook = useMutation(api.pumble.updateWebhook);

  const project = webhook.projectId ? projects.find((p) => p._id === webhook.projectId) : null;

  const handleTest = async () => {
    try {
      await testWebhook({ webhookId: webhook._id });
      showSuccess("Test message sent to Pumble!");
    } catch (error) {
      showError(error, "Failed to send test message");
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateWebhook({
        webhookId: webhook._id,
        isActive: !webhook.isActive,
      });
      showSuccess(webhook.isActive ? "Webhook disabled" : "Webhook enabled");
    } catch (error) {
      showError(error, "Failed to update webhook");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete webhook "${webhook.name}"?`)) return;

    try {
      await deleteWebhook({ webhookId: webhook._id });
      showSuccess("Webhook deleted");
    } catch (error) {
      showError(error, "Failed to delete webhook");
    }
  };

  const maskedUrl = webhook.url.replace(/([^/]{8})[^/]+/, "$1***");

  return (
    <div className="border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4 hover:border-accent-300 dark:hover:border-accent-700 transition-colors">
      <Flex justify="between" align="start" className="mb-3">
        <div className="flex-1">
          <Flex gap="sm" align="center" className="mb-1">
            <h4 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              {webhook.name}
            </h4>
            {webhook.isActive ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark rounded">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded">
                Inactive
              </span>
            )}
          </Flex>
          <Typography className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark font-mono">
            {maskedUrl}
          </Typography>
          {project && (
            <Typography className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
              Project: {project.name}
            </Typography>
          )}
        </div>
      </Flex>

      {/* Events */}
      <Flex className="flex-wrap gap-1.5 mb-3">
        {webhook.events.map((event: string) => (
          <span
            key={event}
            className="px-2 py-0.5 text-xs font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300 rounded"
          >
            {event.replace("issue.", "")}
          </span>
        ))}
      </Flex>

      {/* Stats */}
      {webhook.lastTriggered && (
        <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-3">
          Last triggered: {new Date(webhook.lastTriggered).toLocaleDateString()}
        </div>
      )}

      {/* Actions */}
      <Flex
        gap="sm"
        align="center"
        className="pt-3 border-t border-ui-border-primary dark:border-ui-border-primary-dark"
      >
        <Button
          onClick={handleTest}
          variant="ghost"
          size="sm"
          className="text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20"
        >
          Test Webhook
        </Button>
        <Button onClick={handleToggleActive} variant="secondary" size="sm">
          {webhook.isActive ? "Disable" : "Enable"}
        </Button>
        <Button onClick={() => setShowEditModal(true)} variant="secondary" size="sm">
          Edit
        </Button>
        <Button onClick={handleDelete} variant="danger" size="sm" className="ml-auto">
          Delete
        </Button>
      </Flex>

      {/* Edit Modal */}
      <EditWebhookModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        webhook={webhook}
        projects={projects}
      />
    </div>
  );
}

interface AddWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Doc<"projects">[];
}

function AddWebhookModal({ open, onOpenChange, projects }: AddWebhookModalProps) {
  // Events kept outside form due to checkbox array pattern
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(undefined);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "issue.created",
    "issue.updated",
    "issue.assigned",
  ]);

  const addWebhook = useMutation(api.pumble.addWebhook);

  const form = useForm({
    defaultValues: {
      name: "",
      webhookUrl: "",
    },
    validators: { onChange: webhookSchema },
    onSubmit: async ({ value }: { value: { name: string; webhookUrl: string } }) => {
      if (selectedEvents.length === 0) {
        showError("Please select at least one event");
        return;
      }

      try {
        await addWebhook({
          name: value.name.trim(),
          url: value.webhookUrl.trim(),
          projectId,
          events: selectedEvents,
        });
        showSuccess("Webhook added successfully!");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to add webhook");
      }
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setProjectId(undefined);
      setSelectedEvents(["issue.created", "issue.updated", "issue.assigned"]);
    }
  }, [open, form]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Pumble Webhook</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook Name"
                placeholder="e.g., Team Notifications"
                required
              />
            )}
          </form.Field>

          {/* Webhook URL */}
          <form.Field name="webhookUrl">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook URL"
                type="url"
                placeholder="https://api.pumble.com/projects/.../..."
                className="font-mono text-sm"
                helperText="Get this from Pumble: Channel Settings → Integrations → Incoming Webhooks"
                required
              />
            )}
          </form.Field>

          {/* Project */}
          <div>
            <label
              htmlFor="project-select"
              className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
            >
              Project (Optional)
            </label>
            <select
              id="project-select"
              value={projectId || ""}
              onChange={(e) =>
                setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined)
              }
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
            >
              <option value="">All Projects</option>
              {projects?.map((project: Doc<"projects">) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Typography variant="muted" className="mt-1">
              Leave empty to receive notifications from all projects
            </Typography>
          </div>

          {/* Events */}
          <div>
            <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
              Events to Send <span className="text-status-error">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <Typography variant="small" color="error" className="mt-1">
                Select at least one event
              </Typography>
            )}
          </div>

          {/* Actions */}
          <DialogFooter>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-accent-600 hover:bg-accent-700"
                    isLoading={isSubmitting}
                  >
                    Add Webhook
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: Doc<"webhooks">;
  projects: Doc<"projects">[];
}

function EditWebhookModal({ open, onOpenChange, webhook }: EditWebhookModalProps) {
  // Events kept outside form due to checkbox array pattern
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook.events);

  const updateWebhook = useMutation(api.pumble.updateWebhook);

  const form = useForm({
    defaultValues: {
      name: webhook.name,
      webhookUrl: webhook.url,
    },
    validators: { onChange: webhookSchema },
    onSubmit: async ({ value }: { value: { name: string; webhookUrl: string } }) => {
      if (selectedEvents.length === 0) {
        showError("Please select at least one event");
        return;
      }

      try {
        await updateWebhook({
          webhookId: webhook._id,
          name: value.name.trim(),
          url: value.webhookUrl.trim(),
          events: selectedEvents,
        });
        showSuccess("Webhook updated successfully!");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to update webhook");
      }
    },
  });

  // Reset form when webhook changes
  useEffect(() => {
    form.setFieldValue("name", webhook.name);
    form.setFieldValue("webhookUrl", webhook.url);
    setSelectedEvents(webhook.events);
  }, [webhook, form]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook Name"
                placeholder="e.g., Team Notifications"
                required
              />
            )}
          </form.Field>

          {/* Webhook URL */}
          <form.Field name="webhookUrl">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook URL"
                type="url"
                className="font-mono text-sm"
                required
              />
            )}
          </form.Field>

          {/* Events */}
          <div>
            <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
              Events to Send <span className="text-status-error">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <Typography variant="small" color="error" className="mt-1">
                Select at least one event
              </Typography>
            )}
          </div>

          {/* Actions */}
          <DialogFooter>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-accent-600 hover:bg-accent-700"
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
