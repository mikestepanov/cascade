interface BoardToolbarProps {
  sprintId?: string;
  selectionMode: boolean;
  historyStack: unknown[];
  redoStack: unknown[];
  onUndo: () => void;
  onRedo: () => void;
  onToggleSelectionMode: () => void;
  showControls?: boolean;
}

import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

/**
 * Kanban board toolbar with title, undo/redo buttons, and selection mode toggle
 * Extracted from KanbanBoard for better organization
 */
export function BoardToolbar({
  sprintId,
  selectionMode,
  historyStack,
  redoStack,
  onUndo,
  onRedo,
  onToggleSelectionMode,
  showControls = true,
}: BoardToolbarProps) {
  return (
    <Flex align="center" justify="between" gap="sm" className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      <Typography variant="h2" className="text-base sm:text-lg font-semibold">
        {sprintId ? "Sprint Board" : "Kanban Board"}
      </Typography>
      {showControls && (
        <Flex align="center" gap="xs" className="sm:gap-2 shrink-0">
          {/* Undo/Redo buttons */}
          <div className="hidden sm:flex items-center gap-1 mr-2 sm:mr-4">
            <Tooltip content="Undo (Ctrl+Z)">
              <button
                type="button"
                onClick={onUndo}
                disabled={historyStack.length === 0}
                className="p-2.5 sm:p-3 rounded hover:bg-ui-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Undo (Ctrl+Z)"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-ui-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)">
              <button
                type="button"
                onClick={onRedo}
                disabled={redoStack.length === 0}
                className="p-2.5 sm:p-3 rounded hover:bg-ui-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Redo (Ctrl+Shift+Z)"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-ui-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* Selection mode toggle */}
          <button
            type="button"
            onClick={onToggleSelectionMode}
            className={cn(
              "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors",
              selectionMode
                ? "bg-primary text-white"
                : "bg-ui-bg-secondary text-ui-text-primary hover:bg-ui-bg-tertiary",
            )}
            aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
          >
            <span className="hidden sm:inline">
              {selectionMode ? "Exit Selection Mode" : "Select Multiple"}
            </span>
            <span className="sm:hidden">{selectionMode ? "Exit" : "Select"}</span>
          </button>
        </Flex>
      )}
    </Flex>
  );
}
