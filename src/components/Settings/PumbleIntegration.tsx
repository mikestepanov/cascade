import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Select } from "../ui/form/Select";

export function PumbleIntegration() {
  const [showAddModal, setShowAddModal] = useState(false);
  const webhooks = useQuery(api.pumble.listWebhooks);
  const projects = useQuery(api.projects.list);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Pumble Integration
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Send notifications to Pumble channels when issues are created or updated
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Webhook
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {webhooks === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading webhooks...</div>
          </div>
        ) : webhooks.length === 0 ? (
          <EmptyState onAddWebhook={() => setShowAddModal(true)} />
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <WebhookCard key={webhook._id} webhook={webhook} projects={projects || []} />
            ))}
          </div>
        )}

        {/* Documentation Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a
            href="https://help.pumble.com/hc/en-us/articles/360041954051-Incoming-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1"
          >
            <span>How to create a Pumble incoming webhook</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
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
      <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-purple-600 dark:text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Pumble webhooks configured
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Connect Cascade to Pumble channels to receive notifications when issues are created,
        updated, or assigned.
      </p>
      <button
        onClick={onAddWebhook}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
      >
        Add Your First Webhook
      </button>
    </div>
  );
}

interface WebhookCardProps {
  webhook: any;
  projects: any[];
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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{webhook.name}</h4>
            {webhook.isActive ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{maskedUrl}</p>
          {project && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Project: {project.name}</p>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {webhook.events.map((event: string) => (
          <span
            key={event}
            className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded"
          >
            {event.replace("issue.", "")}
          </span>
        ))}
      </div>

      {/* Settings */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600 dark:text-gray-400">
        {webhook.sendMentions && (
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Mentions</span>
          </span>
        )}
        {webhook.sendAssignments && (
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Assignments</span>
          </span>
        )}
        {webhook.sendStatusChanges && (
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Status Changes</span>
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-3 text-sm">
        <div className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {webhook.messagesSent}
          </span>{" "}
          messages sent
        </div>
        {webhook.lastMessageAt && (
          <div className="text-gray-600 dark:text-gray-400">
            Last: {new Date(webhook.lastMessageAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Error */}
      {webhook.lastError && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          Last error: {webhook.lastError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleTest}
          className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
        >
          Test Webhook
        </button>
        <button
          onClick={handleToggleActive}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          {webhook.isActive ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-auto"
        >
          Delete
        </button>
      </div>

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
  projects: any[];
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Add Pumble Webhook
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Events to Send
            </label>
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
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Additional Settings
            </label>
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
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Webhook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditWebhookModalProps {
  webhook: any;
  projects: any[];
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Webhook</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Webhook Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Events to Send
            </label>
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
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Additional Settings
            </label>
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
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
