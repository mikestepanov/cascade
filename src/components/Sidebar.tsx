import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SkeletonList } from "./ui/Skeleton";

interface SidebarProps {
  selectedDocumentId: Id<"documents"> | null;
  onSelectDocument: (id: Id<"documents"> | null) => void;
}

export function Sidebar({ selectedDocumentId, onSelectDocument }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);

  const documents = useQuery(api.documents.list);
  const searchResults = useQuery(api.documents.search, { query: searchQuery });
  const createDocument = useMutation(api.documents.create);
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
      toast.success("Document created successfully");
    } catch {
      toast.error("Failed to create document");
    }
  };

  const handleDeleteDocument = async (docId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument({ id: docId });
      if (selectedDocumentId === docId) {
        onSelectDocument(null);
      }
      toast.success("Document deleted successfully");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Create Document Button */}
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Document
        </button>
      </div>

      {/* Create Document Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={(e) => void handleCreateDocument(e)} className="space-y-3">
            <input
              type="text"
              placeholder="Document title..."
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newDocIsPublic}
                onChange={(e) => setNewDocIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make public
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle("");
                  setNewDocIsPublic(false);
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        {displayedDocuments === undefined ? (
          <div className="p-4">
            <SkeletonList items={5} />
          </div>
        ) : displayedDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery.trim() ? "No documents found" : "No documents yet"}
          </div>
        ) : (
          <div className="p-2">
            {displayedDocuments.map((doc) => (
              <div
                key={doc._id}
                role="button"
                tabIndex={0}
                className={`group p-3 rounded-md cursor-pointer transition-colors ${
                  selectedDocumentId === doc._id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
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
                    <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">by {doc.creatorName}</span>
                      {doc.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Public
                        </span>
                      )}
                      {doc.isOwner && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
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
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                      title="Delete document"
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
