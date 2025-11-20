import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { useMutation, useQuery } from "convex/react";
import { History } from "lucide-react";
import { useState } from "react";
import { handleMarkdownExport, importFromMarkdown, readMarkdownForPreview } from "@/lib/markdown";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PresenceIndicator } from "./PresenceIndicator";
import { Input } from "./ui/form/Input";
import { MarkdownPreviewModal } from "./ui/MarkdownPreviewModal";
import { Skeleton, SkeletonText } from "./ui/Skeleton";
import { VersionHistory } from "./VersionHistory";
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId);
  const versionCount = useQuery(api.documentVersions.getVersionCount, { documentId });

  if (!(document && userId)) {
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
    } catch (_error) {
      // Ignore file parsing errors - invalid files are silently rejected
    }
  };

  const handleConfirmImport = async () => {
    if (!(sync.editor && previewMarkdown)) return;

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
    } catch (_error) {
      // Export errors are shown to user by handleMarkdownExport
    }
  };

  const handleRestoreVersion = async (snapshot: any, _version: number, title: string) => {
    try {
      // Submit the restored snapshot to ProseMirror
      if (sync.editor && snapshot) {
        // Update document title if it changed
        if (title !== document.title) {
          await updateTitle({ id: documentId, title });
        }
        // The snapshot will be applied automatically through ProseMirror sync
        showSuccess("Version restored successfully. Refreshing...");
        // Reload the page to apply the restored version
        window.location.reload();
      }
    } catch (error) {
      showError(error, "Failed to restore version");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Document Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex-1 w-full sm:w-auto">
            {isEditingTitle ? (
              <Input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => void handleTitleSave()}
                onKeyDown={handleTitleKeyDown}
                className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 dark:text-white"
              />
            ) : (
              <h1
                role={document.isOwner ? "button" : undefined}
                tabIndex={document.isOwner ? 0 : undefined}
                className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
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

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <PresenceIndicator roomId={documentId} userId={userId} />

            {/* Version History */}
            <button
              type="button"
              onClick={() => setShowVersionHistory(true)}
              className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
              title="View version history"
              aria-label="Version history"
            >
              <span className="inline-flex items-center gap-0.5 sm:gap-1">
                <History className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">History</span>
                {versionCount !== undefined && versionCount > 0 && (
                  <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                    {versionCount}
                  </span>
                )}
              </span>
            </button>

            {/* Import Markdown */}
            <button
              type="button"
              onClick={() => void handleImportMarkdown()}
              disabled={!sync.editor}
              className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Import from Markdown file"
              aria-label="Import from Markdown"
            >
              <span className="inline-flex items-center gap-0.5 sm:gap-1">
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 sm:w-4 sm:h-4"
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
              className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export as Markdown file"
              aria-label="Export as Markdown"
            >
              <span className="inline-flex items-center gap-0.5 sm:gap-1">
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 sm:w-4 sm:h-4"
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
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  document.isPublic
                    ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {document.isPublic ? "Public" : "Private"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>Created by {document.creatorName}</span>
          <span className="hidden sm:inline">•</span>
          <span>Last updated {new Date(document.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          {sync.isLoading ? (
            <SkeletonText lines={8} />
          ) : sync.editor ? (
            <BlockNoteView editor={sync.editor} theme="light" className="min-h-96" />
          ) : (
            <div className="text-center py-8 sm:py-12">
              <button
                type="button"
                onClick={() => void sync.create({ type: "doc", content: [] })}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

      {/* Version History Modal */}
      <VersionHistory
        documentId={documentId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestoreVersion={handleRestoreVersion}
      />
    </div>
  );
}
