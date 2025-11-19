import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface ImportPanelProps {
  projectId: Id<"projects">;
  onImportComplete?: () => void;
}

type ImportFormat = "csv" | "json";

/**
 * Extracted import panel from ImportExportModal
 * Handles all import logic and UI
 */
export function ImportPanel({ projectId, onImportComplete }: ImportPanelProps) {
  const [importFormat, setImportFormat] = useState<ImportFormat>("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  const importCSV = useMutation(api.export.importIssuesCSV);
  const importJSON = useMutation(api.export.importIssuesJSON);

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
      showError(new Error("Please select a file to import"), "Validation Error");
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
        showSuccess(
          `Successfully imported ${result.imported} issue${result.imported > 1 ? "s" : ""}${
            result.failed > 0 ? ` (${result.failed} failed)` : ""
          }`,
        );

        setImportFile(null);
        setImportData("");
        onImportComplete?.();
      } else {
        showError(new Error("No issues were imported"), "Import Failed");
      }
    } catch (error) {
      showError(error, "Failed to import issues");
    } finally {
      setIsImporting(false);
    }
  };

  return (
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
                <div className="text-xs text-gray-600 dark:text-gray-400">Spreadsheet format</div>
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
              <li>Optional: type, priority, description, labels, estimated hours, due date</li>
              <li>All imported issues will be created in the first workflow state</li>
            </ul>
          </div>
        </div>
      </div>

      <Button onClick={handleImport} disabled={!importData || isImporting} className="w-full">
        {isImporting ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            Importing...
          </div>
        ) : (
          `Import from ${importFormat.toUpperCase()}`
        )}
      </Button>
    </div>
  );
}
