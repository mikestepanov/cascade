import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Clock, History, RotateCcw } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

/**
 * Get relative time string (e.g., "5 minutes ago")
 * Returns null if diff is >= 7 days
 */
function getRelativeTimeString(diffMs: number): string | null {
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return null;
}

interface DocumentVersion {
  _id: Id<"documentVersions">;
  title: string;
  _creationTime: number;
  createdByName: string;
  changeDescription?: string;
}

interface VersionHistoryProps {
  documentId: Id<"documents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreVersion?: (snapshot: unknown, version: number, title: string) => void;
}

export function VersionHistory({
  documentId,
  open,
  onOpenChange,
  onRestoreVersion,
}: VersionHistoryProps) {
  const [selectedVersionId, _setSelectedVersionId] = useState<Id<"documentVersions"> | null>(null);

  const versions = useQuery(api.documentVersions.listVersions, { documentId });
  const _selectedVersion = useQuery(
    api.documentVersions.getVersion,
    selectedVersionId ? { documentId, versionId: selectedVersionId } : "skip",
  );
  const restoreVersion = useMutation(api.documentVersions.restoreVersion);

  const handleRestore = async (versionId: Id<"documentVersions">) => {
    try {
      const result = await restoreVersion({ documentId, versionId });

      if (onRestoreVersion && result) {
        onRestoreVersion(result.snapshot, result.version, result.title);
        showSuccess("Version restored successfully");
        onOpenChange(false);
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const relativeTime = getRelativeTimeString(diffMs);
    if (relativeTime) return relativeTime;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <Flex align="center" gap="md">
            <History className="w-5 h-5 text-brand-600" />
            <DialogTitle>Version History</DialogTitle>
          </Flex>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {versions === undefined ? (
            <Flex align="center" justify="center" className="py-12">
              <LoadingSpinner size="lg" />
            </Flex>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-ui-text-tertiary mx-auto mb-4" />
              <Typography variant="h3" className="text-lg font-medium text-ui-text-primary mb-2">
                No version history yet
              </Typography>
              <Typography className="text-sm text-ui-text-secondary">
                Versions are automatically saved as you edit. Make some changes to create the first
                version.
              </Typography>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version: DocumentVersion, index: number) => {
                const isLatest = index === 0;
                const isSelected = selectedVersionId === version._id;

                return (
                  <div
                    key={version._id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isSelected
                        ? "border-brand-500 bg-brand-indigo-track"
                        : "border-ui-border-primary hover:border-ui-border-secondary",
                    )}
                  >
                    <Flex align="start" justify="between">
                      <div className="flex-1">
                        <Flex align="center" gap="sm" className="mb-1">
                          {isLatest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-status-success-bg text-status-success-text rounded">
                              Current
                            </span>
                          )}
                          <span className="text-sm font-medium text-ui-text-primary">
                            {version.title}
                          </span>
                        </Flex>
                        <Flex align="center" gap="md" className="text-sm text-ui-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(version._creationTime)}
                          </span>
                          <span>by {version.createdByName}</span>
                        </Flex>
                        {version.changeDescription && (
                          <Typography className="mt-2 text-sm text-ui-text-secondary">
                            {version.changeDescription}
                          </Typography>
                        )}
                      </div>

                      {!isLatest && (
                        <Button
                          onClick={() => handleRestore(version._id)}
                          size="sm"
                          variant="outline"
                          className="ml-4"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Restore
                        </Button>
                      )}
                    </Flex>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-ui-border-primary">
          <Typography className="text-sm text-ui-text-secondary">
            Tip: Versions are saved automatically every minute when you edit. Up to 50 recent
            versions are kept.
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
}
