import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { DocumentTemplatesManager } from "./DocumentTemplatesManager";
import { EmptyState } from "./ui/EmptyState";
import { Checkbox, Input } from "./ui/form";
import { Modal } from "./ui/Modal";
import { SkeletonList } from "./ui/Skeleton";

interface SidebarProps {
  selectedDocumentId: Id<"documents"> | null;
  onSelectDocument: (id: Id<"documents"> | null) => void;
}

export function Sidebar({ selectedDocumentId, onSelectDocument }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"documentTemplates"> | null>(null);

  const documents = useQuery(api.documents.list);
  const searchResults = useQuery(api.documents.search, { query: searchQuery });
  const createDocument = useMutation(api.documents.create);
  const createFromTemplate = useMutation(api.documentTemplates.createDocumentFromTemplate);
  const deleteDocument = useMutation(api.documents.deleteDocument);

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
      onSelectDocument(docId);
      showSuccess("Document created successfully");
    } catch (error) {
      showError(error, "Failed to create document");
    }
  };

  const handleDeleteDocument = async (docId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument({ id: docId });
      if (selectedDocumentId === docId) {
        onSelectDocument(null);
      }
      showSuccess("Document deleted successfully");
    } catch (error) {
      showError(error, "Failed to delete document");
    }
  };

  const handleSelectTemplate = (templateId: Id<"documentTemplates">) => {
    setSelectedTemplateId(templateId);
    setShowTemplateModal(false);
    setShowCreateForm(true);
  };

  const handleCreateFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !selectedTemplateId) return;

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
      onSelectDocument(result.documentId);
      showSuccess("Document created from template");
    } catch (error) {
      showError(error, "Failed to create document from template");
    }
  };

  return (
    <div className="w-full sm:w-72 lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Documents</h2>

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
          <button
            type="button"
            onClick={() => {
              setSelectedTemplateId(null);
              setShowCreateForm(true);
            }}
            className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            aria-label="Create new document"
          >
            + New
          </button>
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Create from template"
            title="Create from template"
          >
            📄
          </button>
        </div>
      </div>

      {/* Create Document Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <form
            onSubmit={(e) => void (selectedTemplateId ? handleCreateFromTemplate(e) : handleCreateDocument(e))}
            className="space-y-3"
          >
            {selectedTemplateId && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded text-xs text-blue-700 dark:text-blue-300">
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
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle("");
                  setNewDocIsPublic(false);
                  setSelectedTemplateId(null);
                }}
                className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Choose a Template"
        maxWidth="4xl"
        fullScreenOnMobile={true}
      >
        <div className="p-4">
          <DocumentTemplatesManager onSelectTemplate={handleSelectTemplate} />
        </div>
      </Modal>

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
              <div
                key={doc._id}
                role="button"
                tabIndex={0}
                className={`group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedDocumentId === doc._id
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => onSelectDocument(doc._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectDocument(doc._id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {doc.creatorName}
                      </span>
                      {doc.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400">
                          Public
                        </span>
                      )}
                      {doc.isOwner && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.isOwner && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteDocument(doc._id);
                      }}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
