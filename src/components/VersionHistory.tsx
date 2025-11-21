import { useMutation, useQuery } from "convex/react";
import { Clock, History, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface VersionHistoryProps {
  documentId: Id<"documents">;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion?: (snapshot: any, version: number, title: string) => void;
}

export function VersionHistory({
  documentId,
  isOpen,
  onClose,
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
        onClose();
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    }
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-ui-border-primary dark:border-ui-border-primary-dark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
              Version History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {versions === undefined ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                No version history yet
              </h3>
              <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Versions are automatically saved as you edit. Make some changes to create the first
                version.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => {
                const isLatest = index === 0;
                const isSelected = selectedVersionId === version._id;

                return (
                  <div
                    key={version._id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-ui-border-primary dark:border-ui-border-primary-dark hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isLatest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark rounded">
                              Current
                            </span>
                          )}
                          <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                            {version.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(version.createdAt)}
                          </span>
                          <span>by {version.createdByName}</span>
                        </div>
                        {version.changeDescription && (
                          <p className="mt-2 text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                            {version.changeDescription}
                          </p>
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
            💡 Tip: Versions are saved automatically every minute when you edit. Up to 50 recent
            versions are kept.
          </p>
        </div>
      </div>
    </div>
  );
}
