interface IssueMetadataProps {
  status: string;
  type: string;
  assignee?: { name: string } | null;
  reporter?: { name: string } | null;
  storyPoints?: number | null;
  labels: string[];
}

/**
 * Displays issue metadata grid and labels
 * Extracted from IssueDetailModal for better organization
 */
export function IssueMetadataSection({
  status,
  type,
  assignee,
  reporter,
  storyPoints,
  labels,
}: IssueMetadataProps) {
  return (
    <>
      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
          <p className="font-medium dark:text-white">{status}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
          <p className="font-medium capitalize dark:text-white">{type}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Assignee:</span>
          <p className="font-medium dark:text-white">{assignee?.name || "Unassigned"}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Reporter:</span>
          <p className="font-medium dark:text-white">{reporter?.name || "Unknown"}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Story Points:</span>
          <p className="font-medium dark:text-white">{storyPoints ?? "Not set"}</p>
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Labels</h3>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
