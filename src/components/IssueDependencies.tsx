import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Input, Select } from "./ui/form";
import { ModalBackdrop } from "./ui/ModalBackdrop";

interface IssueDependenciesProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueDependencies({ issueId, projectId: _projectId }: IssueDependenciesProps) {
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
      showError("Please select an issue");
      return;
    }

    try {
      await createLink({
        fromIssueId: issueId,
        toIssueId: selectedIssueKey as Id<"issues">,
        linkType,
      });
      showSuccess("Dependency added");
      setShowAddDialog(false);
      setSelectedIssueKey("");
      setSearchQuery("");
    } catch (error) {
      showError(error, "Failed to add dependency");
    }
  };

  const handleRemoveLink = async () => {
    if (!deleteConfirm) return;

    try {
      await removeLink({ linkId: deleteConfirm });
      showSuccess("Dependency removed");
    } catch (error) {
      showError(error, "Failed to remove dependency");
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
          <h4 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Dependencies
          </h4>
          <div className="space-y-2">
            {links.outgoing.map((link) => (
              <div
                key={link._id}
                className="flex items-center justify-between p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs px-2 py-1 bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 rounded font-medium">
                    {getLinkTypeLabel(link.linkType, "outgoing")}
                  </span>
                  {link.issue && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getTypeIcon(link.issue.type)}</span>
                      <span className="text-sm font-mono text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        {link.issue.key}
                      </span>
                      <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                        {link.issue.title}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(link._id)}
                  className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error-dark p-1"
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
          <h4 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Referenced By
          </h4>
          <div className="space-y-2">
            {links.incoming.map((link) => (
              <div
                key={link._id}
                className="flex items-center justify-between p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs px-2 py-1 bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200 rounded font-medium">
                    {getLinkTypeLabel(link.linkType, "incoming")}
                  </span>
                  {link.issue && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getTypeIcon(link.issue.type)}</span>
                      <span className="text-sm font-mono text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        {link.issue.key}
                      </span>
                      <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                        {link.issue.title}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(link._id)}
                  className="text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error-dark p-1"
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
        <div className="text-center py-6 text-ui-text-secondary dark:text-ui-text-secondary-dark text-sm">
          No dependencies yet
        </div>
      )}

      {/* Add Dependency Dialog */}
      {showAddDialog && (
        <>
          <ModalBackdrop onClick={() => setShowAddDialog(false)} zIndex="z-50" animated={false} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs stopPropagation to prevent backdrop clicks */}
            <div
              className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg p-6 max-w-lg w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-ui-text-primary dark:text-ui-text-primary-dark">
                Add Dependency
              </h3>

              <div className="space-y-4">
                {/* Link Type */}
                <Select
                  label="Relationship Type"
                  value={linkType}
                  onChange={(e) =>
                    setLinkType(e.target.value as "blocks" | "relates" | "duplicates")
                  }
                >
                  <option value="blocks">Blocks</option>
                  <option value="relates">Relates to</option>
                  <option value="duplicates">Duplicates</option>
                </Select>

                {/* Search Issues */}
                <Input
                  label="Search Issue"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                />

                {/* Search Results */}
                {searchResults && searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg">
                    {searchResults
                      .filter((issue) => issue._id !== issueId)
                      .map((issue) => (
                        <button
                          type="button"
                          key={issue._id}
                          onClick={() => {
                            setSelectedIssueKey(issue._id);
                            setSearchQuery("");
                          }}
                          className={`w-full p-3 text-left hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark border-b border-ui-border-secondary dark:border-ui-border-secondary-dark last:border-0 ${
                            selectedIssueKey === issue._id ? "bg-brand-50 dark:bg-brand-950" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getTypeIcon(issue.type)}</span>
                            <span className="text-sm font-mono text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                              {issue.key}
                            </span>
                            <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                              {issue.title}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Selected Issue */}
                {selectedIssueKey && (
                  <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    Selected: <span className="font-medium">{selectedIssueKey}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDialog(false);
                      setSelectedIssueKey("");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!selectedIssueKey}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Dependency
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
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
