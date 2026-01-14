import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface IssueMetadataProps {
  status: string;
  type: string;
  assignee?: { name: string } | null;
  reporter?: { name: string } | null;
  storyPoints?: number | null;
  labels: LabelInfo[];
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ui-bg-secondary rounded-lg">
        <div>
          <span className="text-sm text-ui-text-tertiary">Status:</span>
          <Typography variant="p" className="font-medium text-ui-text-primary">
            {status}
          </Typography>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary">Type:</span>
          <Typography variant="p" className="font-medium capitalize dark:text-white">
            {type}
          </Typography>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary">Assignee:</span>
          <Typography variant="p" className="font-medium text-ui-text-primary">
            {assignee?.name || "Unassigned"}
          </Typography>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary">Reporter:</span>
          <Typography variant="p" className="font-medium text-ui-text-primary">
            {reporter?.name || "Unknown"}
          </Typography>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary">Story Points:</span>
          <Typography variant="p" className="font-medium text-ui-text-primary">
            {storyPoints ?? "Not set"}
          </Typography>
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-ui-text-primary mb-2">Labels</h3>
          <Flex wrap gap="sm">
            {labels.map((label) => (
              <span
                key={label.name}
                className="px-2 py-0.5 text-xs font-medium rounded-md text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </Flex>
        </div>
      )}
    </>
  );
}
