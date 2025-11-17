import { useMutation, useQuery } from "convex/react";
import { showSuccess, showError } from "@/lib/toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";

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
      <h4 className="text-sm font-medium text-gray-700">Attachments ({attachmentIds.length})</h4>
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
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
        <div className="animate-pulse h-8 w-8 bg-gray-200 rounded"></div>
        <div className="flex-1 animate-pulse h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const filename = getFilenameFromUrl(url);
  const fileIcon = getFileIcon(filename);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
      <div className="text-2xl">{fileIcon}</div>
      <div className="flex-1 min-w-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
        >
          {filename}
        </a>
      </div>
      <div className="flex gap-1">
        <a href={url} download className="text-gray-500 hover:text-gray-700">
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
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:text-red-800">
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
      </div>
    </div>
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
