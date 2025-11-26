import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { ImportExportModal } from "./ImportExportModal";
import { Flex } from "./ui/Flex";

interface ExportButtonProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

export function ExportButton({ projectId, sprintId, status }: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Flex
        as="button"
        align="center"
        gap="sm"
        onClick={() => setIsModalOpen(true)}
        className="px-3 py-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
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
      </Flex>

      <ImportExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        sprintId={sprintId}
        status={status}
      />
    </>
  );
}
