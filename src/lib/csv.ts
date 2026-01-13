/**
 * CSV Export Utilities
 * Converts data structures to CSV format for Excel compatibility
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; label: string }[],
): string {
  if (data.length === 0) return "";

  // If columns not specified, use all keys from first object
  const cols =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }));

  // Create header row
  const headers = cols.map((col) => escapeCSVValue(col.label)).join(",");

  // Create data rows
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        return escapeCSVValue(formatValue(value));
      })
      .join(","),
  );

  return [headers, ...rows].join("\n");
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format value for CSV (handle different types)
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    // Join arrays with semicolon
    return value.map((v) => formatValue(v)).join("; ");
  }

  if (typeof value === "object") {
    // Stringify objects
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export issues to CSV
 */
export interface IssueCSVRow {
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  estimatedHours: string;
  loggedHours: string;
  labels: string;
  description: string;
  [key: string]: unknown;
}

export function issuesToCSV(
  issues: Array<{
    key: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    assignee?: { name: string } | null;
    reporter?: { name: string } | null;
    createdAt: number;
    updatedAt: number;
    dueDate?: number;
    estimatedHours?: number;
    loggedHours?: number;
    labels: string[];
    description?: string;
  }>,
): string {
  const rows: IssueCSVRow[] = issues.map((issue) => ({
    key: issue.key,
    title: issue.title,
    type: issue.type,
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assignee?.name || "Unassigned",
    reporter: issue.reporter?.name || "Unknown",
    createdAt: new Date(issue.createdAt).toISOString(),
    updatedAt: new Date(issue.updatedAt).toISOString(),
    dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : "",
    estimatedHours: issue.estimatedHours?.toString() || "",
    loggedHours: issue.loggedHours?.toString() || "",
    labels: issue.labels.join("; "),
    description: issue.description || "",
  }));

  const columns = [
    { key: "key" as const, label: "Issue Key" },
    { key: "title" as const, label: "Title" },
    { key: "type" as const, label: "Type" },
    { key: "status" as const, label: "Status" },
    { key: "priority" as const, label: "Priority" },
    { key: "assignee" as const, label: "Assignee" },
    { key: "reporter" as const, label: "Reporter" },
    { key: "createdAt" as const, label: "Created" },
    { key: "updatedAt" as const, label: "Updated" },
    { key: "dueDate" as const, label: "Due Date" },
    { key: "estimatedHours" as const, label: "Estimated Hours" },
    { key: "loggedHours" as const, label: "Logged Hours" },
    { key: "labels" as const, label: "Labels" },
    { key: "description" as const, label: "Description" },
  ];

  return arrayToCSV(rows, columns);
}
