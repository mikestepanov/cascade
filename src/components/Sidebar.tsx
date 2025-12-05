import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { DocumentTemplatesManager } from "./DocumentTemplatesManager";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Checkbox, Input } from "./ui/form";
import { SkeletonList } from "./ui/Skeleton";

interface SidebarProps {
  selectedDocumentId: Id<"documents"> | null;
}

export function Sidebar({ selectedDocumentId }: SidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"documentTemplates"> | null>(
    null,
  );

  const documents = useQuery(api.documents.list);
  const searchResults = useQuery(api.documents.search, { query: searchQuery });
  const createDocument = useMutation(api.documents.create);
  const createFromTemplate = useMutation(api.documentTemplates.createDocumentFromTemplate);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const { deleteId, isDeleting, confirmDelete, cancelDelete, executeDelete } =
    useDeleteConfirmation<"documents">({
      successMessage: "Document deleted successfully",
      onSuccess: () => {
        if (deleteId && selectedDocumentId === deleteId) {
          navigate({ to: "/documents" });
        }
      },
    });

  const displayedDocuments = searchQuery.trim() ? searchResults : documents;

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    try {
      const docId = await createDocument({
        title: newDocTitle.trim(),
        isPublic: newDocIsPublic,
      });
      setNewDocTitle("");
      setNewDocIsPublic(false);
      setShowCreateForm(false);
      navigate({ to: "/documents/$id", params: { id: docId } });
      showSuccess("Document created successfully");
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  const handleDeleteDocument = (docId: Id<"documents">) => {
    confirmDelete(docId);
  };

  const handleSelectTemplate = (templateId: Id<"documentTemplates">) => {
    setSelectedTemplateId(templateId);
    setShowTemplateModal(false);
    setShowCreateForm(true);
  };

  const handleCreateFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newDocTitle.trim() && selectedTemplateId)) return;

    try {
      const result = await createFromTemplate({
        templateId: selectedTemplateId,
        title: newDocTitle.trim(),
        isPublic: newDocIsPublic,
      });
      setNewDocTitle("");
      setNewDocIsPublic(false);
      setShowCreateForm(false);
      setSelectedTemplateId(null);
      navigate({ to: "/documents/$id", params: { id: result.documentId } });
      showSuccess("Document created from template");
    } catch (error) {
      showError(error, "Failed to create document from template");
    }
  };

  return (
    <div className="w-full sm:w-72 lg:w-64 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-r border-ui-border-primary dark:border-ui-border-primary-dark flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <h2 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-4">
          Documents
        </h2>

        {/* Search */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documents"
          />
        </div>

        {/* Create Document Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedTemplateId(null);
              setShowCreateForm(true);
            }}
            variant="primary"
            size="sm"
            className="flex-1"
            aria-label="Create new document"
          >
            + New
          </Button>
          <Button
            onClick={() => setShowTemplateModal(true)}
            variant="secondary"
            size="sm"
            aria-label="Create from template"
            title="Create from template"
          >
            📄
          </Button>
        </div>
      </div>

      {/* Create Document Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <form
            onSubmit={(e) =>
              void (selectedTemplateId ? handleCreateFromTemplate(e) : handleCreateDocument(e))
            }
            className="space-y-3"
          >
            {selectedTemplateId && (
              <div className="p-2 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 rounded text-xs text-brand-700 dark:text-brand-300">
                Creating from template
              </div>
            )}
            <Input
              type="text"
              placeholder="Document title..."
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              aria-label="Document title"
              autoFocus
            />
            <Checkbox
              label="Make public"
              checked={newDocIsPublic}
              onChange={(e) => setNewDocIsPublic(e.target.checked)}
            />
            <div className="flex space-x-2">
              <Button type="submit" variant="primary" size="sm" className="flex-1">
                Create
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle("");
                  setNewDocIsPublic(false);
                  setSelectedTemplateId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Template Selection Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>
          <div>
            <DocumentTemplatesManager onSelectTemplate={handleSelectTemplate} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        {displayedDocuments === undefined ? (
          <div className="p-4">
            <SkeletonList items={5} />
          </div>
        ) : displayedDocuments.length === 0 ? (
          <EmptyState
            icon="📄"
            title={searchQuery.trim() ? "No documents found" : "No documents yet"}
            description={
              searchQuery.trim()
                ? "Try a different search term"
                : "Create your first document to get started"
            }
            action={
              !searchQuery.trim()
                ? {
                    label: "Create Document",
                    onClick: () => setShowCreateForm(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="p-2">
            {displayedDocuments.map((doc) => (
              <Link
                key={doc._id}
                to="/documents/$id"
                params={{ id: doc._id }}
                className={`block w-full text-left group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedDocumentId === doc._id
                    ? "bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700"
                    : "hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                        by {doc.creatorName}
                      </span>
                      {doc.isPublic && <Badge variant="success">Public</Badge>}
                      {doc.isOwner && <Badge variant="primary">Owner</Badge>}
                    </div>
                    <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.isOwner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleDeleteDocument(doc._id);
                      }}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-2.5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark hover:text-status-error dark:hover:text-status-error transition-all"
                      aria-label="Delete document"
                    >
                      <svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={cancelDelete}
        onConfirm={() => executeDelete((id) => deleteDocument({ id }))}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
