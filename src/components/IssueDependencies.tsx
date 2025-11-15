import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface IssueDependenciesProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueDependencies({ issueId, projectId }: IssueDependenciesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIssueKey, setSelectedIssueKey] = useState("");
  const [linkType, setLinkType] = useState<"blocks" | "relates" | "duplicates">("blocks");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"issueLinks"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const links = useQuery(api.issueLinks.getForIssue, { issueId });
  const searchResults = useQuery(
    api.issues.search,
    searchQuery.length >= 2 ? { query: searchQuery, limit: 20 } : "skip",
  );
  const createLink = useMutation(api.issueLinks.create);
  const removeLink = useMutation(api.issueLinks.remove);

  const handleAddLink = async () => {
    if (!selectedIssueKey) {
      toast.error("Please select an issue");
      return;
    }

    try {
      await createLink({
        fromIssueId: issueId,
        toIssueId: selectedIssueKey as Id<"issues">,
        linkType,
      });
      toast.success("Dependency added");
      setShowAddDialog(false);
      setSelectedIssueKey("");
      setSearchQuery("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add dependency");
    }
  };

  const handleRemoveLink = async () => {
    if (!deleteConfirm) return;

    try {
      await removeLink({ linkId: deleteConfirm });
      toast.success("Dependency removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove dependency");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getLinkTypeLabel = (type: string, direction: "outgoing" | "incoming") => {
    if (direction === "outgoing") {
      switch (type) {
        case "blocks":
          return "Blocks";
        case "relates":
          return "Relates to";
        case "duplicates":
          return "Duplicates";
        default:
          return type;
      }
    } else {
      switch (type) {
        case "blocks":
          return "Blocked by";
        case "relates":
          return "Related by";
        case "duplicates":
          return "Duplicated by";
        default:
          return type;
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      default:
        return "✓";
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Dependency Button */}
      <div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" variant="secondary">
          + Add Dependency
        </Button>
      </div>

      {/* Outgoing Links */}
      {links && links.outgoing.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dependencies
          </h4>
          <div className="space-y-2">
            {links.outgoing.map((link) => (
              <div
                key={link._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-medium">
                    {getLinkTypeLabel(link.linkType, "outgoing")}
                  </span>
                  {link.issue && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getTypeIcon(link.issue.type)}</span>
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {link.issue.key}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {link.issue.title}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDeleteConfirm(link._id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remove dependency"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Links */}
      {links && links.incoming.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Referenced By
          </h4>
          <div className="space-y-2">
            {links.incoming.map((link) => (
              <div
                key={link._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded font-medium">
                    {getLinkTypeLabel(link.linkType, "incoming")}
                  </span>
                  {link.issue && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getTypeIcon(link.issue.type)}</span>
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {link.issue.key}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {link.issue.title}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDeleteConfirm(link._id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remove dependency"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {links && links.outgoing.length === 0 && links.incoming.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No dependencies yet
        </div>
      )}

      {/* Add Dependency Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Add Dependency
            </h3>

            <div className="space-y-4">
              {/* Link Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship Type
                </label>
                <select
                  value={linkType}
                  onChange={(e) =>
                    setLinkType(e.target.value as "blocks" | "relates" | "duplicates")
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="blocks">Blocks</option>
                  <option value="relates">Relates to</option>
                  <option value="duplicates">Duplicates</option>
                </select>
              </div>

              {/* Search Issues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Issue
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                  {searchResults
                    .filter((issue) => issue._id !== issueId)
                    .map((issue) => (
                      <button
                        key={issue._id}
                        onClick={() => {
                          setSelectedIssueKey(issue._id);
                          setSearchQuery("");
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0 ${
                          selectedIssueKey === issue._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getTypeIcon(issue.type)}</span>
                          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {issue.key}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {issue.title}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Selected Issue */}
              {selectedIssueKey && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-medium">{selectedIssueKey}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedIssueKey("");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!selectedIssueKey}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Dependency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleRemoveLink}
        title="Remove Dependency"
        message="Are you sure you want to remove this dependency?"
        variant="danger"
        confirmLabel="Remove"
      />
    </div>
  );
}
