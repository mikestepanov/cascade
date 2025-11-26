import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
        <div>
          <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Status:
          </span>
          <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            {status}
          </p>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Type:
          </span>
          <p className="font-medium capitalize dark:text-white">{type}</p>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Assignee:
          </span>
          <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            {assignee?.name || "Unassigned"}
          </p>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Reporter:
          </span>
          <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            {reporter?.name || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Story Points:
          </span>
          <p className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            {storyPoints ?? "Not set"}
          </p>
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Labels
          </h3>
          <Flex wrap gap="sm">
            {labels.map((label) => (
              <Badge key={label} variant="neutral" shape="pill" size="md">
                {label}
              </Badge>
            ))}
          </Flex>
        </div>
      )}
    </>
  );
}
