import type { Doc } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { Download, History, Upload } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";
import { Badge } from "./ui/Badge";
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

  const titleComponent = (
    <Typography
      variant="h1"
      role={document.isOwner ? "button" : undefined}
      tabIndex={document.isOwner ? 0 : undefined}
      className="text-xl sm:text-2xl font-bold text-ui-text cursor-pointer hover:bg-ui-bg-secondary rounded px-2 py-1 transition-colors"
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
    >
      {document.title}
    </Typography>
  );

  return (
    <div className="border-b border-ui-border p-3 sm:p-6">
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
              className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-ring rounded px-2 py-1 text-ui-text"
            />
          ) : document.isOwner ? (
            <Tooltip content="Click to edit title">{titleComponent}</Tooltip>
          ) : (
            titleComponent
          )}
        </div>

        <Flex wrap align="center" className="gap-1.5 sm:gap-2 w-full sm:w-auto">
          <PresenceIndicator roomId={document._id} userId={userId} />

          {/* Version History */}
          <Tooltip content="View version history">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowVersionHistory}
              leftIcon={<History className="w-4 h-4" aria-hidden="true" />}
              className="px-2 sm:px-3 py-1 bg-ui-bg-tertiary text-ui-text hover:bg-ui-bg-secondary min-h-0"
              aria-label="Version history"
            >
              <span className="hidden sm:inline">History</span>
              {versionCount !== undefined && versionCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {versionCount}
                </Badge>
              )}
            </Button>
          </Tooltip>

          {/* Import Markdown */}
          <Tooltip content="Import from Markdown file">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onImportMarkdown()}
              disabled={!editorReady}
              leftIcon={<Upload className="w-4 h-4" aria-hidden="true" />}
              className="px-2 sm:px-3 py-1 bg-brand-indigo-track text-brand-indigo-text hover:opacity-80 min-h-0"
              aria-label="Import from Markdown"
            >
              <span className="hidden sm:inline">Import MD</span>
            </Button>
          </Tooltip>

          {/* Export Markdown */}
          <Tooltip content="Export as Markdown file">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onExportMarkdown()}
              disabled={!editorReady}
              leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
              className="px-2 sm:px-3 py-1 bg-brand-cyan-track text-brand-cyan-text hover:opacity-80 min-h-0"
              aria-label="Export as Markdown"
            >
              <span className="hidden sm:inline">Export MD</span>
            </Button>
          </Tooltip>

          {document.isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onTogglePublic()}
              className={cn(
                "px-2 sm:px-3 py-1 min-h-0",
                document.isPublic
                  ? "bg-status-success-bg text-status-success-text hover:opacity-80"
                  : "bg-ui-bg-tertiary text-ui-text hover:bg-ui-bg-secondary",
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
