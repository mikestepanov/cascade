import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { handleMarkdownExport, importFromMarkdown, readMarkdownForPreview } from "@/lib/markdown";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PresenceIndicator } from "./PresenceIndicator";
import { Input } from "./ui/form/Input";
import { MarkdownPreviewModal } from "./ui/MarkdownPreviewModal";
import { Skeleton, SkeletonText } from "./ui/Skeleton";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface DocumentEditorProps {
  documentId: Id<"documents">;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const document = useQuery(api.documents.get, { id: documentId });
  const updateTitle = useMutation(api.documents.updateTitle);
  const togglePublic = useMutation(api.documents.togglePublic);
  const userId = useQuery(api.presence.getUserId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");

  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId);

  if (!document || !userId) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Document Header Skeleton */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-1/2" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Editor Skeleton */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <SkeletonText lines={8} />
          </div>
        </div>
      </div>
    );
  }

  const handleTitleEdit = () => {
    setTitleValue(document.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== document.title) {
      try {
        await updateTitle({ id: documentId, title: titleValue.trim() });
        showSuccess("Title updated");
      } catch (error) {
        showError(error, "Failed to update title");
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await togglePublic({ id: documentId });
      showSuccess(document.isPublic ? "Document is now private" : "Document is now public");
    } catch (error) {
      showError(error, "Failed to update document visibility");
    }
  };

  const handleImportMarkdown = async () => {
    if (!sync.editor) {
      showError("Editor not ready");
      return;
    }
    try {
      const result = await readMarkdownForPreview();
      if (result) {
        setPreviewMarkdown(result.markdown);
        setPreviewFilename(result.filename);
        setShowPreview(true);
      }
    } catch (_error) {}
  };

  const handleConfirmImport = async () => {
    if (!sync.editor || !previewMarkdown) return;

    try {
      await importFromMarkdown(sync.editor, previewMarkdown);
      showSuccess(`Imported ${previewFilename}`);
      setShowPreview(false);
      setPreviewMarkdown("");
      setPreviewFilename("");
    } catch (error) {
      showError(error, "Failed to import markdown");
    }
  };

  const handleExportMarkdown = async () => {
    if (!sync.editor) {
      showError("Editor not ready");
      return;
    }
    try {
      await handleMarkdownExport(sync.editor, document.title);
    } catch (_error) {}
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Document Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <Input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => void handleTitleSave()}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
            ) : (
              <h1
                role={document.isOwner ? "button" : undefined}
                tabIndex={document.isOwner ? 0 : undefined}
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                onClick={document.isOwner ? handleTitleEdit : undefined}
                onKeyDown={
                  document.isOwner
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleTitleEdit();
                        }
                      }
                    : undefined
                }
                title={document.isOwner ? "Click to edit title" : ""}
              >
                {document.title}
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <PresenceIndicator roomId={documentId} userId={userId} />

            {/* Import Markdown */}
            <button
              type="button"
              onClick={() => void handleImportMarkdown()}
              disabled={!sync.editor}
              className="px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Import from Markdown file"
              aria-label="Import from Markdown"
            >
              <span className="inline-flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="hidden sm:inline">Import MD</span>
              </span>
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={() => void handleExportMarkdown()}
              disabled={!sync.editor}
              className="px-3 py-1 rounded-md text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export as Markdown file"
              aria-label="Export as Markdown"
            >
              <span className="inline-flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                <span className="hidden sm:inline">Export MD</span>
              </span>
            </button>

            {document.isOwner && (
              <button
                type="button"
                onClick={() => void handleTogglePublic()}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  document.isPublic
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {document.isPublic ? "Public" : "Private"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Created by {document.creatorName}</span>
          <span>•</span>
          <span>Last updated {new Date(document.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {sync.isLoading ? (
            <SkeletonText lines={8} />
          ) : sync.editor ? (
            <BlockNoteView editor={sync.editor} theme="light" className="min-h-96" />
          ) : (
            <div className="text-center py-12">
              <button
                type="button"
                onClick={() => void sync.create({ type: "doc", content: [] })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Initialize Document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Markdown Preview Modal */}
      <MarkdownPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewMarkdown("");
          setPreviewFilename("");
        }}
        onConfirm={() => void handleConfirmImport()}
        markdown={previewMarkdown}
        filename={previewFilename}
      />
    </div>
  );
}
