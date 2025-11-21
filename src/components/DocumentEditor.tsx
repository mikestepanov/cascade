import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { handleMarkdownExport, importFromMarkdown, readMarkdownForPreview } from "@/lib/markdown";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { DocumentHeader } from "./DocumentHeader";
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

  const [showPreview, setShowPreview] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId);
  const versionCount = useQuery(api.documentVersions.getVersionCount, { documentId });

  if (!(document && userId)) {
    return (
      <div className="flex flex-col h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
        {/* Document Header Skeleton */}
        <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark p-6">
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

  const handleTitleEdit = async (title: string) => {
    try {
      await updateTitle({ id: documentId, title });
      showSuccess("Title updated");
    } catch (error) {
      showError(error, "Failed to update title");
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

  const handleRestoreVersion = async (snapshot: unknown, _version: number, title: string) => {
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
    <div className="flex flex-col h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      {/* Document Header */}
      <DocumentHeader
        document={document}
        userId={userId}
        versionCount={versionCount}
        onTitleEdit={handleTitleEdit}
        onTogglePublic={handleTogglePublic}
        onImportMarkdown={handleImportMarkdown}
        onExportMarkdown={handleExportMarkdown}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        editorReady={!!sync.editor}
      />

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
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
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
