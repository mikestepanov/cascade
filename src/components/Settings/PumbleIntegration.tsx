import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Select } from "../ui/form/Select";
import { Modal } from "../ui/Modal";

export function PumbleIntegration() {
  const [showAddModal, setShowAddModal] = useState(false);
  const webhooks = useQuery(api.pumble.listWebhooks);
  const projects = useQuery(api.projects.list);

  return (
    <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-sm border border-ui-border-primary dark:border-ui-border-primary-dark">
      {/* Header */}
      <div className="p-6 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <Flex justify="between" align="start">
          <Flex gap="md" align="center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-pink-500 rounded-lg flex items-center justify-center">
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
              <p className="mt-1 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Send notifications to Pumble channels when issues are created or updated
              </p>
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
            {webhooks.map((webhook) => (
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
      {showAddModal && (
        <AddWebhookModal onClose={() => setShowAddModal(false)} projects={projects || []} />
      )}
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
      <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6 max-w-md mx-auto">
        Connect Cascade to Pumble channels to receive notifications when issues are created,
        updated, or assigned.
      </p>
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

interface WebhookCardProps {
  webhook: Doc<"pumbleWebhooks">;
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

  const maskedUrl = webhook.webhookUrl.replace(/([^/]{8})[^/]+/, "$1***");

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
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark font-mono">
            {maskedUrl}
          </p>
          {project && (
            <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
              Project: {project.name}
            </p>
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

      {/* Settings */}
      <Flex className="flex-wrap gap-md mb-3 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
        {webhook.sendMentions && (
          <Flex gap="xs" align="center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Mentions</span>
          </Flex>
        )}
        {webhook.sendAssignments && (
          <Flex gap="xs" align="center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Assignments</span>
          </Flex>
        )}
        {webhook.sendStatusChanges && (
          <Flex gap="xs" align="center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Status Changes</span>
          </Flex>
        )}
      </Flex>

      {/* Stats */}
      <Flex gap="lg" align="center" className="mb-3 text-sm">
        <div className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
          <span className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            {webhook.messagesSent}
          </span>{" "}
          messages sent
        </div>
        {webhook.lastMessageAt && (
          <div className="text-ui-text-secondary dark:text-ui-text-secondary-dark">
            Last: {new Date(webhook.lastMessageAt).toLocaleDateString()}
          </div>
        )}
      </Flex>

      {/* Error */}
      {webhook.lastError && (
        <div className="mb-3 p-2 bg-status-error/10 dark:bg-status-error/20 border border-status-error/30 dark:border-status-error/40 rounded text-xs text-status-error dark:text-status-error">
          Last error: {webhook.lastError}
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
      {showEditModal && (
        <EditWebhookModal
          webhook={webhook}
          projects={projects}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

interface AddWebhookModalProps {
  onClose: () => void;
  projects: Doc<"projects">[];
}

function AddWebhookModal({ onClose, projects }: AddWebhookModalProps) {
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(undefined);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "issue.created",
    "issue.updated",
    "issue.assigned",
  ]);
  const [sendMentions, setSendMentions] = useState(true);
  const [sendAssignments, setSendAssignments] = useState(true);
  const [sendStatusChanges, setSendStatusChanges] = useState(true);

  const addWebhook = useMutation(api.pumble.addWebhook);

  const availableEvents = [
    { value: "issue.created", label: "Issue Created" },
    { value: "issue.updated", label: "Issue Updated" },
    { value: "issue.assigned", label: "Issue Assigned" },
    { value: "issue.completed", label: "Issue Completed" },
    { value: "issue.deleted", label: "Issue Deleted" },
    { value: "comment.created", label: "Comment Added" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError("Please enter a webhook name");
      return;
    }

    if (!webhookUrl.trim()) {
      showError("Please enter a webhook URL");
      return;
    }

    if (!webhookUrl.includes("pumble.com")) {
      showError("Invalid Pumble webhook URL");
      return;
    }

    if (selectedEvents.length === 0) {
      showError("Please select at least one event");
      return;
    }

    try {
      await addWebhook({
        name: name.trim(),
        webhookUrl: webhookUrl.trim(),
        projectId,
        events: selectedEvents,
        sendMentions,
        sendAssignments,
        sendStatusChanges,
      });
      showSuccess("Webhook added successfully!");
      onClose();
    } catch (error) {
      showError(error, "Failed to add webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Pumble Webhook" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <Input
          label="Webhook Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Team Notifications"
        />

        {/* Webhook URL */}
        <Input
          label="Webhook URL"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://api.pumble.com/workspaces/.../..."
          className="font-mono text-sm"
          helperText="Get this from Pumble: Channel Settings → Integrations → Incoming Webhooks"
        />

        {/* Project */}
        <Select
          label="Project (Optional)"
          value={projectId || ""}
          onChange={(e) =>
            setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined)
          }
          helperText="Leave empty to receive notifications from all projects"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </Select>

        {/* Events */}
        <div>
          <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Events to Send
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availableEvents.map((event) => (
              <Checkbox
                key={event.value}
                label={event.label}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
              />
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div>
          <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Additional Settings
          </div>
          <div className="space-y-2">
            <Checkbox
              label="Send notifications for @mentions"
              checked={sendMentions}
              onChange={(e) => setSendMentions(e.target.checked)}
            />
            <Checkbox
              label="Send notifications for assignments"
              checked={sendAssignments}
              onChange={(e) => setSendAssignments(e.target.checked)}
            />
            <Checkbox
              label="Send notifications for status changes"
              checked={sendStatusChanges}
              onChange={(e) => setSendStatusChanges(e.target.checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <Flex
          justify="end"
          gap="md"
          align="center"
          className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark"
        >
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="bg-accent-600 hover:bg-accent-700">
            Add Webhook
          </Button>
        </Flex>
      </form>
    </Modal>
  );
}

interface EditWebhookModalProps {
  webhook: Doc<"pumbleWebhooks">;
  projects: Doc<"projects">[];
  onClose: () => void;
}

function EditWebhookModal({ webhook, projects: _projects, onClose }: EditWebhookModalProps) {
  const [name, setName] = useState(webhook.name);
  const [webhookUrl, setWebhookUrl] = useState(webhook.webhookUrl);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook.events);
  const [sendMentions, setSendMentions] = useState(webhook.sendMentions);
  const [sendAssignments, setSendAssignments] = useState(webhook.sendAssignments);
  const [sendStatusChanges, setSendStatusChanges] = useState(webhook.sendStatusChanges);

  const updateWebhook = useMutation(api.pumble.updateWebhook);

  const availableEvents = [
    { value: "issue.created", label: "Issue Created" },
    { value: "issue.updated", label: "Issue Updated" },
    { value: "issue.assigned", label: "Issue Assigned" },
    { value: "issue.completed", label: "Issue Completed" },
    { value: "issue.deleted", label: "Issue Deleted" },
    { value: "comment.created", label: "Comment Added" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError("Please enter a webhook name");
      return;
    }

    if (!webhookUrl.trim()) {
      showError("Please enter a webhook URL");
      return;
    }

    if (selectedEvents.length === 0) {
      showError("Please select at least one event");
      return;
    }

    try {
      await updateWebhook({
        webhookId: webhook._id,
        name: name.trim(),
        webhookUrl: webhookUrl.trim(),
        events: selectedEvents,
        sendMentions,
        sendAssignments,
        sendStatusChanges,
      });
      showSuccess("Webhook updated successfully!");
      onClose();
    } catch (error) {
      showError(error, "Failed to update webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Webhook" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="webhook-name"
            className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
          >
            Webhook Name
          </label>
          <input
            id="webhook-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Webhook URL */}
        <Input
          label="Webhook URL"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="font-mono text-sm"
        />

        {/* Events */}
        <div>
          <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Events to Send
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availableEvents.map((event) => (
              <Checkbox
                key={event.value}
                label={event.label}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
              />
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div>
          <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
            Additional Settings
          </div>
          <div className="space-y-2">
            <Checkbox
              label="Send notifications for @mentions"
              checked={sendMentions}
              onChange={(e) => setSendMentions(e.target.checked)}
            />
            <Checkbox
              label="Send notifications for assignments"
              checked={sendAssignments}
              onChange={(e) => setSendAssignments(e.target.checked)}
            />
            <Checkbox
              label="Send notifications for status changes"
              checked={sendStatusChanges}
              onChange={(e) => setSendStatusChanges(e.target.checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <Flex
          justify="end"
          gap="md"
          align="center"
          className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark"
        >
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="bg-accent-600 hover:bg-accent-700">
            Save Changes
          </Button>
        </Flex>
      </form>
    </Modal>
  );
}
