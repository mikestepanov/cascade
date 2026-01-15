import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { History } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";
import { Button } from "./ui/Button";
import { Input } from "./ui/form/Input";

interface DocumentHeaderProps {
  document: Doc<"documents"> & {
    creatorName: string;
    isOwner: boolean;
  };
  userId: string;
  versionCount: number | undefined;
  onTitleEdit: (title: string) => Promise<void>;
  onTogglePublic: () => Promise<void>;
  onImportMarkdown: () => Promise<void>;
  onExportMarkdown: () => Promise<void>;
  onShowVersionHistory: () => void;
  editorReady: boolean;
}

export function DocumentHeader({
  document,
  userId,
  versionCount,
  onTitleEdit,
  onTogglePublic,
  onImportMarkdown,
  onExportMarkdown,
  onShowVersionHistory,
  editorReady,
}: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(document.title);

  const handleTitleEdit = () => {
    setTitleValue(document.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue !== document.title) {
      await onTitleEdit(titleValue.trim());
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

  return (
    <div className="border-b border-ui-border-primary p-3 sm:p-6">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="md"
        className="sm:flex-row sm:items-center sm:gap-4 mb-3 sm:mb-4"
      >
        <div className="flex-1 w-full sm:w-auto">
          {isEditingTitle ? (
            <Input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => void handleTitleSave()}
              onKeyDown={handleTitleKeyDown}
              className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1 text-ui-text-primary"
            />
          ) : (
            <Typography
              variant="h1"
              role={document.isOwner ? "button" : undefined}
              tabIndex={document.isOwner ? 0 : undefined}
              className="text-xl sm:text-2xl font-bold text-ui-text-primary cursor-pointer hover:bg-ui-bg-secondary rounded px-2 py-1 transition-colors"
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
            </Typography>
          )}
        </div>

        <Flex wrap align="center" className="gap-1.5 sm:gap-2 w-full sm:w-auto">
          <PresenceIndicator roomId={document._id} userId={userId} />

          {/* Version History */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowVersionHistory}
            className="px-2 sm:px-3 py-1 bg-ui-bg-tertiary text-ui-text-primary hover:bg-ui-bg-secondary min-h-0"
            title="View version history"
            aria-label="Version history"
          >
            <span className="inline-flex items-center gap-0.5 sm:gap-1">
              <History className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">History</span>
              {versionCount !== undefined && versionCount > 0 && (
                <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 text-xs bg-ui-bg-tertiary rounded">
                  {versionCount}
                </span>
              )}
            </span>
          </Button>

          {/* Import Markdown */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onImportMarkdown()}
            disabled={!editorReady}
            className="px-2 sm:px-3 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800/40 min-h-0"
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
          </Button>

          {/* Export Markdown */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onExportMarkdown()}
            disabled={!editorReady}
            className="px-2 sm:px-3 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-800/40 min-h-0"
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
          </Button>

          {document.isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onTogglePublic()}
              className={cn(
                "px-2 sm:px-3 py-1 min-h-0",
                document.isPublic
                  ? "bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark hover:bg-status-success-bg dark:hover:bg-status-success-bg-dark hover:opacity-80"
                  : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark",
              )}
            >
              {document.isPublic ? "Public" : "Private"}
            </Button>
          )}
        </Flex>
      </Flex>

      <Flex
        wrap
        align="center"
        className="gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-ui-text-secondary"
      >
        <span>Created by {document.creatorName}</span>
        <span className="hidden sm:inline">•</span>
        <span>Last updated {new Date(document.updatedAt).toLocaleDateString()}</span>
      </Flex>
    </div>
  );
}
