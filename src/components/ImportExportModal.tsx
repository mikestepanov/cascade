import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Modal } from "./ui/Modal";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
}

type Mode = "export" | "import";
type ExportFormat = "csv" | "json";

export function ImportExportModal({ isOpen, onClose, projectId }: ImportExportModalProps) {
  const [mode, setMode] = useState<Mode>("export");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [importFormat, setImportFormat] = useState<ExportFormat>("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const csvData = useQuery(
    api.export.exportIssuesCSV,
    isExporting && exportFormat === "csv" ? { projectId } : "skip",
  );

  const jsonData = useQuery(
    api.export.exportIssuesJSON,
    isExporting && exportFormat === "json" ? { projectId } : "skip",
  );

  const importCSV = useMutation(api.export.importIssuesCSV);
  const importJSON = useMutation(api.export.importIssuesJSON);

  const handleExport = () => {
    setIsExporting(true);
  };

  // Handle CSV export
  if (csvData !== undefined && isExporting && exportFormat === "csv") {
    if (!csvData || csvData.trim().length === 0) {
      toast.error("No data to export");
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

        toast.success("Issues exported successfully!");
      } catch (_error) {
        toast.error("Failed to export issues");
      } finally {
        setIsExporting(false);
      }
    }
  }

  // Handle JSON export
  if (jsonData !== undefined && isExporting && exportFormat === "json") {
    if (!jsonData || jsonData.trim().length === 0) {
      toast.error("No data to export");
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

        toast.success("Issues exported successfully!");
      } catch (_error) {
        toast.error("Failed to export issues");
      } finally {
        setIsExporting(false);
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!importData) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);

    try {
      let result: { imported: number; failed: number; errors?: string[] };

      if (importFormat === "csv") {
        result = await importCSV({ projectId, csvData: importData });
      } else {
        result = await importJSON({ projectId, jsonData: importData });
      }

      if (result.imported > 0) {
        toast.success(
          `Successfully imported ${result.imported} issue${result.imported > 1 ? "s" : ""}${
            result.failed > 0 ? ` (${result.failed} failed)` : ""
          }`,
        );

        if (result.errors && result.errors.length > 0) {
        }

        setImportFile(null);
        setImportData("");
        onClose();
      } else {
        toast.error("No issues were imported");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import issues");
    } finally {
      setIsImporting(false);
    }
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

        {mode === "export" ? (
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
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Spreadsheet format
                      </div>
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
                    <li>All issues in this project will be exported</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                `Export as ${exportFormat.toUpperCase()}`
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Import Format
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  onClick={() => setImportFormat("csv")}
                  className={`p-4 cursor-pointer transition-all ${
                    importFormat === "csv"
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📊</div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">CSV</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Spreadsheet format
                      </div>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => setImportFormat("json")}
                  className={`p-4 cursor-pointer transition-all ${
                    importFormat === "json"
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

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File
              </div>
              <input
                type="file"
                accept={importFormat === "csv" ? ".csv" : ".json"}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 focus:outline-none"
              />
              {importFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Import Requirements</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                    <li>CSV must have a header row with column names</li>
                    <li>
                      Required column:{" "}
                      <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">title</code>
                    </li>
                    <li>
                      Optional: type, priority, description, labels, estimated hours, due date
                    </li>
                    <li>All imported issues will be created in the first workflow state</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleImport} disabled={!importData || isImporting} className="w-full">
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importing...
                </>
              ) : (
                `Import from ${importFormat.toUpperCase()}`
              )}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
