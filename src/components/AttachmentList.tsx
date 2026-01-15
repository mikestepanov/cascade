import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Typography } from "@/components/ui/Typography";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";

interface AttachmentListProps {
  attachmentIds: Id<"_storage">[];
  issueId: Id<"issues">;
  canEdit?: boolean;
}

export function AttachmentList({ attachmentIds, issueId, canEdit = false }: AttachmentListProps) {
  const removeAttachment = useMutation(api.attachments.removeAttachment);

  const handleRemove = async (storageId: Id<"_storage">) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;

    try {
      await removeAttachment({ issueId, storageId });
      showSuccess("Attachment removed");
    } catch (error) {
      showError(error, "Failed to remove attachment");
    }
  };

  if (attachmentIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Typography variant="h4" className="text-sm font-medium text-ui-text-primary">
        Attachments ({attachmentIds.length})
      </Typography>
      <div className="grid grid-cols-1 gap-2">
        {attachmentIds.map((storageId) => (
          <AttachmentItem
            key={storageId}
            storageId={storageId}
            canEdit={canEdit}
            onRemove={() => handleRemove(storageId)}
          />
        ))}
      </div>
    </div>
  );
}

function AttachmentItem({
  storageId,
  canEdit,
  onRemove,
}: {
  storageId: Id<"_storage">;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const url = useQuery(api.attachments.getAttachment, { storageId });

  if (!url) {
    return (
      <Flex
        align="center"
        gap="sm"
        className="p-2 bg-ui-bg-secondary rounded border border-ui-border-primary"
      >
        <div className="animate-pulse h-8 w-8 bg-ui-bg-tertiary rounded" />
        <div className="flex-1 animate-pulse h-4 bg-ui-bg-tertiary rounded" />
      </Flex>
    );
  }

  const filename = getFilenameFromUrl(url);
  const fileIcon = getFileIcon(filename);

  return (
    <Flex
      align="center"
      gap="sm"
      className="p-2 bg-ui-bg-secondary rounded border border-ui-border-primary hover:bg-ui-bg-tertiary transition-colors"
    >
      <div className="text-2xl">{fileIcon}</div>
      <div className="flex-1 min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline truncate block"
        >
          {filename}
        </a>
      </div>
      <Flex gap="xs">
        <a href={url} download className="text-ui-text-secondary hover:text-ui-text-primary">
          <span className="sr-only">Download attachment</span>
          <svg
            aria-hidden="true"
            className="w-5 h-5"
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
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-status-error hover:text-status-error-hover"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
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
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "file");
  } catch {
    return "file";
  }
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "🖼️";
  }
  if (ext === "pdf") {
    return "📄";
  }
  if (["txt", "md"].includes(ext)) {
    return "📝";
  }
  if (ext === "zip") {
    return "📦";
  }
  if (["json", "csv"].includes(ext)) {
    return "📊";
  }
  return "📎";
}
