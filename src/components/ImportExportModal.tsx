import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { ExportPanel } from "./import-export/ExportPanel";
import { ImportPanel } from "./import-export/ImportPanel";
import { Modal } from "./ui/Modal";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

type Mode = "export" | "import";

/**
 * Refactored ImportExportModal - Now focused on orchestration
 * Import and Export logic extracted to separate panels
 *
 * Benefits:
 * - Reduced from 368 lines to ~70 lines
 * - Import/Export can be used independently
 * - Each panel testable in isolation
 * - Clearer separation of concerns
 */
export function ImportExportModal({
  isOpen,
  onClose,
  projectId,
  sprintId,
  status,
}: ImportExportModalProps) {
  const [mode, setMode] = useState<Mode>("export");

  const handleImportComplete = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import / Export Issues" size="large">
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2 p-1 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-lg">
          <button
            type="button"
            onClick={() => setMode("export")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              mode === "export"
                ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            📤 Export
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              mode === "import"
                ? "bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            📥 Import
          </button>
        </div>

        {/* Panel Content */}
        {mode === "export" ? (
          <ExportPanel projectId={projectId} sprintId={sprintId} status={status} />
        ) : (
          <ImportPanel projectId={projectId} onImportComplete={handleImportComplete} />
        )}
      </div>
    </Modal>
  );
}
