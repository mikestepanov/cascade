import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

interface FileAttachmentsProps {
  issueId: Id<"issues">;
}

export function FileAttachments({ issueId }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"_storage"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useQuery(api.files.getIssueAttachments, { issueId });
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const addAttachment = useMutation(api.files.addAttachment);
  const removeAttachment = useMutation(api.files.removeAttachment);
  // Define type for attachment if not available globally
  interface Attachment {
    storageId: Id<"_storage">;
    filename: string;
    url: string | null;
    contentType: string;
    size: number;
    uploadedAt: number;
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await result.json();

        // Add to issue
        await addAttachment({
          issueId,
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        showSuccess(`Uploaded ${file.name}`);
      }
    } catch (error) {
      showError(error, "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeAttachment({ issueId, storageId: deleteConfirm });
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const _formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📎";
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <section
        aria-label="File upload area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragOver
            ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
            : "border-ui-border-primary dark:border-ui-border-primary-dark hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-4xl mb-2">📎</div>
          <Typography variant="muted" className="mb-2">
            Drag and drop files here, or click to browse
          </Typography>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
          >
            {uploading ? "Uploading..." : "Choose Files"}
          </Button>
        </label>
      </section>

      {/* Attachments List */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-ui-text-primary">
            Attachments ({attachments.length})
          </h4>
          {attachments.map((attachment: Attachment) => (
            <Flex
              key={attachment.storageId}
              align="center"
              justify="between"
              className="p-3 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary transition-colors"
            >
              <Flex align="center" gap="md" className="flex-1 min-w-0">
                <span className="text-2xl shrink-0">{getFileIcon(attachment.filename)}</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={attachment.url || "#"}
                    download={attachment.filename}
                    className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-500 truncate block"
                  >
                    {attachment.filename}
                  </a>
                  <Typography variant="muted" size="xs">
                    {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </Typography>
                </div>
              </Flex>
              <Flex align="center" gap="sm" className="shrink-0">
                <a
                  href={attachment.url || "#"}
                  download={attachment.filename}
                  className="p-1 text-ui-text-secondary hover:text-brand-600 dark:hover:text-brand-400 rounded"
                  title="Download"
                >
                  <span className="sr-only">Download {attachment.filename}</span>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(attachment.storageId)}
                  className="p-1 text-ui-text-secondary hover:text-status-error rounded"
                  title="Delete"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </Flex>
            </Flex>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
