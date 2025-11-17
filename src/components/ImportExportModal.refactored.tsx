import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { ExportPanel } from "./import-export/ExportPanel";
import { ImportPanel } from "./import-export/ImportPanel";
import { Modal } from "./ui/Modal";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
}

type Mode = "export" | "import";

/**
 * Refactored ImportExportModal - Now focused on orchestration
 * Import and Export logic extracted to separate panels
 *
 * Benefits:
 * - Reduced from 355 lines to ~70 lines
 * - Import/Export can be used independently
 * - Each panel testable in isolation
 * - Clearer separation of concerns
 */
export function ImportExportModal({ isOpen, onClose, projectId }: ImportExportModalProps) {
  const [mode, setMode] = useState<Mode>("export");

  const handleImportComplete = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import / Export Issues" size="large">
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("export")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              mode === "export"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            📤 Export
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              mode === "import"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            📥 Import
          </button>
        </div>

        {/* Panel Content */}
        {mode === "export" ? (
          <ExportPanel projectId={projectId} />
        ) : (
          <ImportPanel projectId={projectId} onImportComplete={handleImportComplete} />
        )}
      </div>
    </Modal>
  );
}
