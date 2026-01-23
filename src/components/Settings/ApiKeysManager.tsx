import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, TrendingUp } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Tooltip } from "../ui/Tooltip";
import { Typography } from "../ui/Typography";

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
        <Flex justify="between" align="center" className="mb-6">
          <div>
            <Typography variant="h3" className="text-lg font-semibold text-ui-text-primary">
              <Flex gap="sm" align="center">
                <Key className="h-5 w-5" />
                API Keys
              </Flex>
            </Typography>
            <Typography className="text-sm text-ui-text-secondary mt-1">
              Generate API keys for CLI tools, AI agents, and external integrations
            </Typography>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
            <Flex gap="sm" align="center">
              <Plus className="h-4 w-4" />
              Generate Key
            </Flex>
          </Button>
        </Flex>

        {/* API Keys List */}
        {!apiKeys || apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-ui-bg-secondary rounded-lg border-2 border-dashed border-ui-border-primary">
            <Key className="h-12 w-12 text-ui-text-tertiary mx-auto mb-3" />
            <Typography variant="h4" className="text-sm font-medium text-ui-text-primary mb-1">
              No API keys yet
            </Typography>
            <Typography className="text-sm text-ui-text-secondary mb-4">
              Generate your first API key to access Nixelo programmatically
            </Typography>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateModal(true)}
              className="mx-auto"
            >
              <Flex gap="sm" align="center">
                <Plus className="h-4 w-4" />
                Generate Your First Key
              </Flex>
            </Button>
          </div>
        ) : (
          <Flex direction="column" gap="lg">
            {apiKeys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onViewStats={() => setSelectedKeyId(key.id)} />
            ))}
          </Flex>
        )}

        {/* Documentation Link */}
        <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
          <Typography className="text-sm text-brand-900 dark:text-brand-100">
            📚 <strong>Need help?</strong> Check out the{" "}
            <a
              href="/docs/API.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-700"
            >
              API Documentation
            </a>{" "}
            for usage examples and integration guides.
          </Typography>
        </div>
      </div>

      {/* Generate Key Modal */}
      <GenerateKeyModal open={showGenerateModal} onOpenChange={setShowGenerateModal} />

      {/* Usage Stats Modal */}
      <UsageStatsModal
        open={selectedKeyId !== null}
        onOpenChange={(open) => !open && setSelectedKeyId(null)}
        keyId={selectedKeyId}
      />
    </Card>
  );
}

/**
 * Individual API Key Card
 */
// biome-ignore lint/suspicious/noExplicitAny: API keys are mapped to a custom object
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
      showSuccess("API key revoked successfully");
    } catch (error) {
      showError(error, "Failed to revoke API key");
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
      showSuccess("API key deleted successfully");
    } catch (error) {
      showError(error, "Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyKeyPrefix = () => {
    navigator.clipboard.writeText(apiKey.keyPrefix);
    toast.success("Key prefix copied to clipboard");
  };

  return (
    <div className="p-4 bg-ui-bg-secondary rounded-lg border border-ui-border-primary">
      <Flex justify="between" align="start">
        <div className="flex-1">
          {/* Name & Status */}
          <Flex gap="sm" align="center" className="mb-2">
            <Typography variant="h4" className="font-medium text-ui-text-primary">
              {apiKey.name}
            </Typography>
            {apiKey.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="error">Revoked</Badge>
            )}
          </Flex>

          {/* Key Prefix */}
          <Flex gap="sm" align="center" className="mb-3">
            <code className="text-sm font-mono bg-ui-bg-primary px-2 py-1 rounded border border-ui-border-primary">
              {apiKey.keyPrefix}...
            </code>
            <Tooltip content="Copy key prefix">
              <Button
                onClick={copyKeyPrefix}
                variant="ghost"
                size="sm"
                className="p-1 min-w-0"
                aria-label="Copy key prefix"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </Tooltip>
          </Flex>

          {/* Scopes */}
          <Flex className="flex-wrap gap-1 mb-3">
            {apiKey.scopes.map((scope: string) => (
              <span
                key={scope}
                className="px-2 py-0.5 text-xs bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400 rounded"
              >
                {scope}
              </span>
            ))}
          </Flex>

          {/* Stats */}
          <Flex gap="lg" align="center" className="text-xs text-ui-text-secondary">
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
                <span className={apiKey.expiresAt < Date.now() ? "text-status-error" : ""}>
                  Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                </span>
              </>
            )}
          </Flex>
        </div>

        {/* Actions */}
        <Flex gap="sm" align="center" className="ml-4">
          <Tooltip content="View usage statistics">
            <Button
              onClick={onViewStats}
              variant="ghost"
              size="sm"
              className="p-2 min-w-0 text-ui-text-tertiary hover:text-brand-600 dark:hover:text-brand-400"
              aria-label="View usage statistics"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </Tooltip>
          {apiKey.isActive && (
            <Button
              onClick={handleRevoke}
              variant="ghost"
              size="sm"
              isLoading={isRevoking}
              className="text-status-warning hover:bg-status-warning-bg"
              aria-label="Revoke key"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          )}
          <Tooltip content="Delete API key">
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              isLoading={isDeleting}
              className="p-2 min-w-0 text-ui-text-tertiary hover:text-status-error dark:hover:text-status-error"
              aria-label="Delete key"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </div>
  );
}

/**
 * Generate API Key Modal
 */
function GenerateKeyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
      showError("Please enter a name for this API key");
      return;
    }

    if (selectedScopes.length === 0) {
      showError("Please select at least one scope");
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
      showSuccess("API key generated successfully!");
    } catch (error) {
      showError(error, "Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAndClose = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      showSuccess("API key copied to clipboard!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {!generatedKey ? (
            <>
              {/* Key Name */}
              <Input
                label="Key Name *"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CLI Tool, GitHub Actions, Claude Code"
                helperText="A descriptive name to help you identify this key"
              />

              {/* Scopes */}
              <div>
                <div className="block text-sm font-medium text-ui-text-primary mb-2">
                  Permissions (Scopes) <span className="text-status-error">*</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      htmlFor={`scope-${scope.value}`}
                      className="flex items-start p-3 bg-ui-bg-secondary rounded-lg cursor-pointer hover:bg-ui-bg-tertiary"
                    >
                      <Checkbox
                        id={`scope-${scope.value}`}
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5"
                      />
                      <div className="ml-3">
                        <Typography className="text-sm font-medium text-ui-text-primary">
                          {scope.label}
                        </Typography>
                        <Typography className="text-xs text-ui-text-tertiary">
                          {scope.description}
                        </Typography>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rate Limit */}
              <Input
                label="Rate Limit (requests per minute)"
                type="number"
                value={rateLimit.toString()}
                onChange={(e) => setRateLimit(parseInt(e.target.value, 10) || 100)}
                min="10"
                max="1000"
                helperText="Maximum number of API requests allowed per minute (default: 100)"
              />

              {/* Actions */}
              <DialogFooter>
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate API Key"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Success - Show Generated Key */}
              <div className="text-center">
                <Flex
                  justify="center"
                  align="center"
                  className="mx-auto h-12 w-12 rounded-full bg-status-success-bg mb-4"
                >
                  <Key className="h-6 w-6 text-status-success dark:text-status-success" />
                </Flex>
                <Typography
                  variant="h3"
                  className="text-lg font-semibold text-ui-text-primary mb-2"
                >
                  API Key Generated!
                </Typography>
                <Typography className="text-sm text-ui-text-secondary mb-6">
                  ⚠️ <strong>Save this key now!</strong> You won't be able to see it again.
                </Typography>

                {/* Generated Key Display */}
                <div className="mb-6 p-4 bg-ui-bg-primary-dark rounded-lg">
                  <code className="text-sm font-mono text-status-success break-all select-all">
                    {generatedKey}
                  </code>
                </div>

                {/* Copy Instructions */}
                <div className="text-left mb-6 p-4 bg-status-info-bg rounded-lg text-sm">
                  <Typography className="font-medium text-status-info-text mb-2">
                    Usage Example:
                  </Typography>
                  <code className="block bg-ui-bg-primary p-2 rounded text-xs font-mono">
                    curl -H "Authorization: Bearer {generatedKey.substring(0, 20)}..."
                    https://nixelo.app/api/issues
                  </code>
                </div>

                {/* Actions */}
                <DialogFooter>
                  <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    I've Saved It
                  </Button>
                  <Button variant="primary" onClick={copyAndClose} className="flex-1">
                    <Flex justify="center" gap="sm" align="center">
                      <Copy className="h-4 w-4" />
                      Copy & Close
                    </Flex>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Usage Statistics Modal
 */
function UsageStatsModal({
  open,
  onOpenChange,
  keyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: Id<"apiKeys"> | null;
}) {
  const stats = useQuery(api.apiKeys.getUsageStats, keyId ? { keyId } : "skip");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Key Usage Statistics</DialogTitle>
        </DialogHeader>
        {!stats ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <Typography className="mt-2 text-sm text-ui-text-tertiary">
              Loading statistics...
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">Total Calls</Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary">
                  {stats.totalCalls.toLocaleString()}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Last 24 Hours
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary">
                  {stats.last24Hours.toLocaleString()}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Success Rate
                </Typography>
                <Typography className="text-2xl font-bold text-status-success dark:text-status-success">
                  {stats.last24Hours > 0
                    ? Math.round((stats.successCount / stats.last24Hours) * 100)
                    : 100}
                  %
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Avg Response
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text-primary">
                  {stats.avgResponseTime}ms
                </Typography>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <Typography variant="h4" className="text-sm font-semibold text-ui-text-primary mb-3">
                Recent Requests
              </Typography>
              {stats.recentLogs.length === 0 ? (
                <Typography className="text-sm text-ui-text-tertiary py-4 text-center">
                  No recent requests
                </Typography>
              ) : (
                <Flex direction="column" gap="sm" className="max-h-64 overflow-y-auto">
                  {/* biome-ignore lint/suspicious/noExplicitAny: Doc type mismatch */}
                  {stats.recentLogs.map((log: any) => (
                    <div
                      key={log._id}
                      className={cn(
                        "p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg text-sm",
                      )}
                    >
                      <Flex justify="between" align="center" className="mb-1">
                        <Flex gap="sm" align="center">
                          <span className="font-mono font-medium text-ui-text-primary">
                            {log.method}
                          </span>
                          <span className="text-ui-text-secondary">{log.endpoint}</span>
                        </Flex>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            log.statusCode < 400
                              ? "bg-status-success/10 text-status-success dark:bg-status-success/20 dark:text-status-success"
                              : "bg-status-error/10 text-status-error dark:bg-status-error/20 dark:text-status-error",
                          )}
                        >
                          {log.statusCode}
                        </span>
                      </Flex>
                      <Flex gap="lg" align="center" className="text-xs text-ui-text-tertiary">
                        <span>{log.responseTime}ms</span>
                        <span>•</span>
                        {/* biome-ignore lint/suspicious/noExplicitAny: property existence check on unknown Doc type */}
                        <span>{new Date((log as any)._creationTime).toLocaleString()}</span>
                        {log.error && (
                          <>
                            <span>•</span>
                            <span className="text-status-error dark:text-status-error">
                              {log.error}
                            </span>
                          </>
                        )}
                      </Flex>
                    </div>
                  ))}
                </Flex>
              )}
            </div>

            {/* Close Button */}
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
