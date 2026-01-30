import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { ImportExportModal } from "./ImportExportModal";

interface ExportButtonProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

export function ExportButton({ projectId, sprintId, status }: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ui-text bg-ui-bg border border-ui-border rounded-lg hover:bg-ui-bg-secondary transition-colors"
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        <span>Import / Export</span>
      </button>

      <ImportExportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
        sprintId={sprintId}
        status={status}
      />
    </>
  );
}
