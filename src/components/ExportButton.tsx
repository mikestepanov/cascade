import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ExportButtonProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

export function ExportButton({ projectId, sprintId, status }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const csvData = useQuery(
    api.export.exportIssuesCSV,
    isExporting ? { projectId, sprintId, status } : "skip"
  );

  const handleExport = async () => {
    setIsExporting(true);
  };

  // When CSV data is ready, download it
  if (csvData !== undefined && isExporting) {
    if (!csvData || csvData.trim().length === 0) {
      toast.error("No data to export");
      setIsExporting(false);
    } else {
      try {
        // Create blob and download
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Generate filename
        const timestamp = new Date().toISOString().split("T")[0];
        const sprintSuffix = sprintId ? "-sprint" : "";
        const statusSuffix = status ? `-${status}` : "";
        link.download = `issues-export-${timestamp}${sprintSuffix}${statusSuffix}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Issues exported successfully!");
      } catch (error) {
        toast.error("Failed to export issues");
        console.error("Export error:", error);
      } finally {
        setIsExporting(false);
      }
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}
