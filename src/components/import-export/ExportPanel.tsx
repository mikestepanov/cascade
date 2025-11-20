import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface ExportPanelProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

type ExportFormat = "csv" | "json";

/**
 * Extracted export panel from ImportExportModal
 * Handles all export logic and UI
 */
export function ExportPanel({ projectId, sprintId, status }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const csvData = useQuery(
    api.export.exportIssuesCSV,
    isExporting && exportFormat === "csv" ? { projectId, sprintId, status } : "skip",
  );

  const jsonData = useQuery(
    api.export.exportIssuesJSON,
    isExporting && exportFormat === "json" ? { projectId, sprintId, status } : "skip",
  );

  const handleExport = () => {
    setIsExporting(true);
  };

  // Handle CSV export
  useEffect(() => {
    if (csvData !== undefined && isExporting && exportFormat === "csv") {
      if (!csvData || csvData.trim().length === 0) {
        showError(new Error("No data to export"), "Export Failed");
        setIsExporting(false);
      } else {
        try {
          const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          const timestamp = new Date().toISOString().split("T")[0];
          link.download = `issues-export-${timestamp}.csv`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSuccess("Issues exported successfully!");
        } catch (error) {
          showError(error, "Failed to export issues");
        } finally {
          setIsExporting(false);
        }
      }
    }
  }, [csvData, isExporting, exportFormat]);

  // Handle JSON export
  useEffect(() => {
    if (jsonData !== undefined && isExporting && exportFormat === "json") {
      if (!jsonData || jsonData.trim().length === 0) {
        showError(new Error("No data to export"), "Export Failed");
        setIsExporting(false);
      } else {
        try {
          const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          const timestamp = new Date().toISOString().split("T")[0];
          link.download = `issues-export-${timestamp}.json`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSuccess("Issues exported successfully!");
        } catch (error) {
          showError(error, "Failed to export issues");
        } finally {
          setIsExporting(false);
        }
      }
    }
  }, [jsonData, isExporting, exportFormat]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Select Export Format
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => setExportFormat("csv")}
            className={`p-4 cursor-pointer transition-all ${
              exportFormat === "csv"
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">CSV</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Spreadsheet format</div>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setExportFormat("json")}
            className={`p-4 cursor-pointer transition-all ${
              exportFormat === "json"
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📄</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">JSON</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Data interchange format
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</div>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Export Information</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>CSV format is compatible with Excel, Google Sheets</li>
              <li>JSON format includes full issue data and metadata</li>
              <li>
                {sprintId || status
                  ? "Filtered issues will be exported"
                  : "All issues in this project will be exported"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Button onClick={handleExport} disabled={isExporting} className="w-full">
        {isExporting ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            Exporting...
          </div>
        ) : (
          `Export as ${exportFormat.toUpperCase()}`
        )}
      </Button>
    </div>
  );
}
