import type { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PresenceIndicator } from "./PresenceIndicator";
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

  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId);

  if (!document || !userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
        toast.success("Title updated");
      } catch {
        toast.error("Failed to update title");
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
      toast.success(document.isPublic ? "Document is now private" : "Document is now public");
    } catch {
      toast.error("Failed to update document visibility");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Document Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => void handleTitleSave()}
                onKeyDown={handleTitleKeyDown}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full"
              />
            ) : (
              <h1
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                onClick={document.isOwner ? handleTitleEdit : undefined}
                title={document.isOwner ? "Click to edit title" : ""}
              >
                {document.title}
              </h1>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <PresenceIndicator roomId={documentId} userId={userId} />

            {document.isOwner && (
              <button
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sync.editor ? (
            <BlockNoteView editor={sync.editor} theme="light" className="min-h-96" />
          ) : (
            <div className="text-center py-12">
              <button
                onClick={() => void sync.create({ type: "doc", content: [] })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Initialize Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
