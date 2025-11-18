interface BoardToolbarProps {
  sprintId?: string;
  selectionMode: boolean;
  historyStack: unknown[];
  redoStack: unknown[];
  onUndo: () => void;
  onRedo: () => void;
  onToggleSelectionMode: () => void;
}

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
}: BoardToolbarProps) {
  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex items-center justify-between gap-2">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
        {sprintId ? "Sprint Board" : "Kanban Board"}
      </h2>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Undo/Redo buttons */}
        <div className="hidden sm:flex items-center gap-1 mr-2 sm:mr-4">
          <button
            type="button"
            onClick={onUndo}
            disabled={historyStack.length === 0}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Undo (Ctrl+Z)"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
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
          <button
            type="button"
            onClick={onRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Redo (Ctrl+Shift+Z)"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
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
        </div>

        {/* Selection mode toggle */}
        <button
          type="button"
          onClick={onToggleSelectionMode}
          className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
            selectionMode
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          aria-label={selectionMode ? "Exit selection mode" : "Enable selection mode"}
        >
          <span className="hidden sm:inline">
            {selectionMode ? "Exit Selection Mode" : "Select Multiple"}
          </span>
          <span className="sm:hidden">{selectionMode ? "Exit" : "Select"}</span>
        </button>
      </div>
    </div>
  );
}
