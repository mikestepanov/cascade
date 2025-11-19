import { useMutation, useQuery } from "convex/react";
import { Copy, Key, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";

/**
 * API Keys Manager
 *
 * Allows users to generate and manage API keys for CLI/AI integration
 */
export function ApiKeysManager() {
  const apiKeys = useQuery(api.apiKeys.list);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<Id<"apiKeys"> | null>(null);

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generate API keys for CLI tools, AI agents, and external integrations
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Key
          </Button>
        </div>

        {/* API Keys List */}
        {!apiKeys || apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              No API keys yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate your first API key to access Cascade programmatically
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Generate Your First Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onViewStats={() => setSelectedKeyId(key.id)} />
            ))}
          </div>
        )}

        {/* Documentation Link */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            📚 <strong>Need help?</strong> Check out the{" "}
            <a
              href="/docs/API.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-700"
            >
              API Documentation
            </a>{" "}
            for usage examples and integration guides.
          </p>
        </div>
      </div>

      {/* Generate Key Modal */}
      {showGenerateModal && <GenerateKeyModal onClose={() => setShowGenerateModal(false)} />}

      {/* Usage Stats Modal */}
      {selectedKeyId && (
        <UsageStatsModal keyId={selectedKeyId} onClose={() => setSelectedKeyId(null)} />
      )}
    </Card>
  );
}

/**
 * Individual API Key Card
 */
function ApiKeyCard({ apiKey, onViewStats }: { apiKey: any; onViewStats: () => void }) {
  const revokeKey = useMutation(api.apiKeys.revoke);
  const deleteKey = useMutation(api.apiKeys.remove);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRevoke = async () => {
    if (!confirm(`Revoke API key "${apiKey.name}"? This will immediately stop it from working.`)) {
      return;
    }

    setIsRevoking(true);
    try {
      await revokeKey({ keyId: apiKey.id });
      toast.success("API key revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke API key");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete API key "${apiKey.name}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteKey({ keyId: apiKey.id });
      toast.success("API key deleted successfully");
    } catch (error) {
      toast.error("Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyKeyPrefix = () => {
    navigator.clipboard.writeText(apiKey.keyPrefix);
    toast.success("Key prefix copied to clipboard");
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Name & Status */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{apiKey.name}</h4>
            {apiKey.isActive ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                Revoked
              </span>
            )}
          </div>

          {/* Key Prefix */}
          <div className="flex items-center gap-2 mb-3">
            <code className="text-sm font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
              {apiKey.keyPrefix}...
            </code>
            <button
              onClick={copyKeyPrefix}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy key prefix"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {/* Scopes */}
          <div className="flex flex-wrap gap-1 mb-3">
            {apiKey.scopes.map((scope: string) => (
              <span
                key={scope}
                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded"
              >
                {scope}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>
              <strong>{apiKey.usageCount}</strong> API calls
            </span>
            <span>•</span>
            <span>
              <strong>{apiKey.rateLimit}</strong> req/min
            </span>
            {apiKey.lastUsedAt && (
              <>
                <span>•</span>
                <span>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
              </>
            )}
            {apiKey.expiresAt && (
              <>
                <span>•</span>
                <span className={apiKey.expiresAt < Date.now() ? "text-red-600" : ""}>
                  Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onViewStats}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="View usage statistics"
          >
            <TrendingUp className="h-4 w-4" />
          </button>
          {apiKey.isActive && (
            <button
              onClick={handleRevoke}
              disabled={isRevoking}
              className="px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
              title="Revoke key"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete key"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate API Key Modal
 */
function GenerateKeyModal({ onClose }: { onClose: () => void }) {
  const generateKey = useMutation(api.apiKeys.generate);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["issues:read"]);
  const [rateLimit, setRateLimit] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const availableScopes = [
    { value: "issues:read", label: "Read Issues", description: "View issues and their details" },
    { value: "issues:write", label: "Write Issues", description: "Create and update issues" },
    { value: "issues:delete", label: "Delete Issues", description: "Delete issues" },
    { value: "projects:read", label: "Read Projects", description: "View project information" },
    { value: "projects:write", label: "Write Projects", description: "Create and update projects" },
    { value: "comments:read", label: "Read Comments", description: "View issue comments" },
    { value: "comments:write", label: "Write Comments", description: "Add comments to issues" },
    { value: "search:read", label: "Search", description: "Search across projects" },
  ];

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for this API key");
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateKey({
        name: name.trim(),
        scopes: selectedScopes,
        rateLimit,
      });

      setGeneratedKey(result.apiKey);
      toast.success("API key generated successfully!");
    } catch (error) {
      toast.error("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAndClose = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      toast.success("API key copied to clipboard!");
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate API Key" maxWidth="2xl">
      <div className="p-6 space-y-6">
        {!generatedKey ? (
          <>
            {/* Key Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CLI Tool, GitHub Actions, Claude Code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A descriptive name to help you identify this key
              </p>
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions (Scopes) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableScopes.map((scope) => (
                  <label
                    key={scope.value}
                    className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="mt-0.5 h-4 w-4 text-blue-600 rounded"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {scope.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {scope.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rate Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                min="10"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of API requests allowed per minute (default: 100)
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate API Key"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Success - Show Generated Key */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                API Key Generated!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                ⚠️ <strong>Save this key now!</strong> You won't be able to see it again.
              </p>

              {/* Generated Key Display */}
              <div className="mb-6 p-4 bg-gray-900 dark:bg-gray-950 rounded-lg">
                <code className="text-sm font-mono text-green-400 break-all select-all">
                  {generatedKey}
                </code>
              </div>

              {/* Copy Instructions */}
              <div className="text-left mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Usage Example:</p>
                <code className="block bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                  curl -H "Authorization: Bearer {generatedKey.substring(0, 20)}..."
                  https://cascade.app/api/issues
                </code>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={copyAndClose}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy & Close
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  I've Saved It
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Usage Statistics Modal
 */
function UsageStatsModal({ keyId, onClose }: { keyId: Id<"apiKeys">; onClose: () => void }) {
  const stats = useQuery(api.apiKeys.getUsageStats, { keyId });

  return (
    <Modal isOpen={true} onClose={onClose} title="API Key Usage Statistics" maxWidth="2xl">
      <div className="p-6">
        {!stats ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalCalls.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last 24 Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.last24Hours.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.last24Hours > 0
                    ? Math.round((stats.successCount / stats.last24Hours) * 100)
                    : 100}
                  %
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.avgResponseTime}ms
                </p>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Recent Requests
              </h4>
              {stats.recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No recent requests
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.recentLogs.map((log: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {log.method}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">{log.endpoint}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            log.statusCode < 400
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{log.responseTime}ms</span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        {log.error && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 dark:text-red-400">{log.error}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
