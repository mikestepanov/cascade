import { useMutation, useQuery } from "convex/react";
import { Calendar, ExternalLink, Github, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useOfflineSyncStatus, useOnlineStatus } from "../hooks/useOffline";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export function Settings() {
  const [activeTab, setActiveTab] = useState<"integrations" | "offline" | "preferences">(
    "integrations",
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account, integrations, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Settings tabs">
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "integrations"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Integrations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("offline")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "offline"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Offline Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "preferences"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Preferences
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "offline" && <OfflineTab />}
          {activeTab === "preferences" && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <GitHubIntegration />
      <GoogleCalendarIntegration />
    </div>
  );
}

function GitHubIntegration() {
  const githubConnection = useQuery(api.github.getConnection);
  const disconnectGitHub = useMutation(api.github.disconnectGitHub);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect GitHub? This will remove all linked repositories.",
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectGitHub();
      toast.success("GitHub disconnected successfully");
    } catch (error) {
      toast.error("Failed to disconnect GitHub");
      console.error(error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    toast.info("GitHub OAuth not yet implemented. Please set up OAuth in convex/auth.config.ts");
    // TODO: Implement GitHub OAuth flow
    // window.location.href = "/auth/github";
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-900 dark:bg-gray-800 rounded-lg">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link repositories and track PRs and commits
              </p>
              {githubConnection && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Connected as @{githubConnection.githubUsername}
                </p>
              )}
            </div>
          </div>
          <div>
            {githubConnection ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                Connect GitHub
              </Button>
            )}
          </div>
        </div>

        {githubConnection && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <LinkedRepositories />
          </div>
        )}
      </div>
    </Card>
  );
}

function LinkedRepositories() {
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(null);
  const projects = useQuery(api.projects.list, {});
  const repositories = useQuery(
    api.github.listRepositories,
    selectedProject ? { projectId: selectedProject } : "skip",
  );
  const unlinkRepo = useMutation(api.github.unlinkRepository);

  const handleUnlink = async (repoId: Id<"githubRepositories">) => {
    if (!confirm("Are you sure you want to unlink this repository?")) {
      return;
    }

    try {
      await unlinkRepo({ repositoryId: repoId });
      toast.success("Repository unlinked");
    } catch (error) {
      toast.error("Failed to unlink repository");
      console.error(error);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Linked Repositories
      </h4>

      {/* Project selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Project
        </label>
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(e.target.value as Id<"projects">)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- Select a project --</option>
          {projects?.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name} ({project.key})
            </option>
          ))}
        </select>
      </div>

      {/* Repository list */}
      {selectedProject && (
        <div className="space-y-2">
          {repositories && repositories.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No repositories linked to this project yet.
            </p>
          )}
          {repositories?.map((repo) => (
            <div
              key={repo._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Github className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {repo.repoFullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {repo.syncPRs && "PRs"} {repo.syncPRs && repo.autoLinkCommits && "• "}
                    {repo.autoLinkCommits && "Auto-link commits"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleUnlink(repo._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => toast.info("Repository linking UI coming soon")}
        >
          + Link New Repository
        </Button>
      )}
    </div>
  );
}

function GoogleCalendarIntegration() {
  const calendarConnection = useQuery(api.googleCalendar.getConnection);
  const disconnectGoogle = useMutation(api.googleCalendar.disconnectGoogle);
  const updateSyncSettings = useMutation(api.googleCalendar.updateSyncSettings);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectGoogle();
      toast.success("Google Calendar disconnected successfully");
    } catch (error) {
      toast.error("Failed to disconnect Google Calendar");
      console.error(error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    toast.info("Google OAuth not yet implemented. Please set up OAuth in convex/auth.config.ts");
    // TODO: Implement Google OAuth flow
    // window.location.href = "/auth/google";
  };

  const handleToggleSync = async () => {
    if (!calendarConnection) return;

    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncEnabled: !calendarConnection.syncEnabled,
      });
      toast.success(`Sync ${!calendarConnection.syncEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to update sync settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeSyncDirection = async (direction: "import" | "export" | "bidirectional") => {
    setIsSaving(true);
    try {
      await updateSyncSettings({
        syncDirection: direction,
      });
      toast.success("Sync direction updated");
    } catch (error) {
      toast.error("Failed to update sync direction");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Google Calendar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sync calendar events between Cascade and Google Calendar
              </p>
              {calendarConnection && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Connected to {calendarConnection.providerAccountId}
                  </p>
                  {calendarConnection.lastSyncAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last synced: {new Date(calendarConnection.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            {calendarConnection ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                Connect Google
              </Button>
            )}
          </div>
        </div>

        {calendarConnection && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Enable Sync
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatically sync events between Cascade and Google Calendar
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleSync}
                disabled={isSaving}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${calendarConnection.syncEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${calendarConnection.syncEnabled ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {/* Sync Direction */}
            {calendarConnection.syncEnabled && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Sync Direction
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "bidirectional"}
                      onChange={() => handleChangeSyncDirection("bidirectional")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Bidirectional
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sync both ways (recommended)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "import"}
                      onChange={() => handleChangeSyncDirection("import")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Import Only
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Only import from Google → Cascade
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="syncDirection"
                      checked={calendarConnection.syncDirection === "export"}
                      onChange={() => handleChangeSyncDirection("export")}
                      disabled={isSaving}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Export Only
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Only export from Cascade → Google
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function OfflineTab() {
  const isOnline = useOnlineStatus();
  const { pending, count, isLoading } = useOfflineSyncStatus();

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${isOnline ? "bg-green-500" : "bg-red-500"}`}>
              {isOnline ? (
                <Wifi className="h-6 w-6 text-white" />
              ) : (
                <WifiOff className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Connection Status
              </h3>
              <p
                className={`text-sm mt-1 ${isOnline ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {isOnline ? "✓ You are online" : "✗ You are offline"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Changes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {isLoading ? "..." : count}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sync Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {isOnline ? "Ready" : "Paused"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  IndexedDB
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Offline Features */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Offline Features
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  View Cached Content
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access recently viewed projects and issues while offline
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Offline Edits
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Make changes offline - they'll sync automatically when you're back online
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Background Sync
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Changes sync automatically in the background when connection is restored
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Install as App
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Install Cascade as a standalone app on your device
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sync Queue */}
      {count > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Pending Sync Queue
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info("Manual sync triggered")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
            <div className="space-y-2">
              {pending.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.mutationType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                    Pending
                  </span>
                </div>
              ))}
              {pending.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                  +{pending.length - 5} more items
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function PreferencesTab() {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          User Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Additional preference settings coming soon...
        </p>
      </div>
    </Card>
  );
}
