import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Input, Select } from "./ui/form";

interface IssueDependenciesProps {
  issueId: Id<"issues">;
  workspaceId: Id<"workspaces">;
}

export function IssueDependencies({ issueId, workspaceId: _workspaceId }: IssueDependenciesProps) {
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
                  <Badge variant="brand" size="md">
                    {getLinkTypeLabel(link.linkType, "outgoing")}
                  </Badge>
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
                  <Badge variant="accent" size="md">
                    {getLinkTypeLabel(link.linkType, "incoming")}
                  </Badge>
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
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedIssueKey("");
            setSearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {/* Link Type */}
            <Select
              label="Relationship Type"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as "blocks" | "relates" | "duplicates")}
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
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedIssueKey("");
                  setSearchQuery("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddLink} disabled={!selectedIssueKey}>
                Add Dependency
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
