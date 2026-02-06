import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

/**
 * Recent activity timeline for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
interface Activity {
  _id: string;
  userName: string;
  action: string;
  field?: string;
  issueKey?: string;
  _creationTime: number;
}

export function RecentActivity({ activities }: { activities: Activity[] | undefined }) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="bg-ui-bg rounded-lg shadow-card border border-ui-border p-6">
      <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
        Recent Activity
      </Typography>
      <div className="relative">
        {/* Timeline line */}
        {activities.length > 1 && (
          <div className="absolute left-4 top-4 bottom-4 w-px bg-ui-border" />
        )}

        <Flex direction="column" gap="none">
          {activities.map((activity) => (
            <Flex
              key={activity._id}
              gap="md"
              align="start"
              className="relative text-sm py-3 px-2 -mx-2 rounded-lg transition-colors duration-150 hover:bg-ui-bg-secondary/30"
            >
              <Flex
                align="center"
                justify="center"
                className="shrink-0 w-8 h-8 rounded-full bg-ui-bg-tertiary text-ui-text-secondary text-xs font-medium relative z-10"
              >
                {activity.userName.charAt(0).toUpperCase()}
              </Flex>
              <div className="flex-1 min-w-0">
                <Typography variant="p" className="mb-0">
                  <span className="font-semibold text-ui-text">{activity.userName}</span>{" "}
                  <span className="text-ui-text-secondary">{activity.action}</span>{" "}
                  {activity.field && (
                    <>
                      <span className="font-medium text-ui-text">{activity.field}</span>{" "}
                      <span className="text-ui-text-secondary">on</span>{" "}
                    </>
                  )}
                  <span className="font-mono text-xs bg-ui-bg-tertiary text-ui-text-secondary px-1.5 py-0.5 rounded border border-ui-border">
                    {activity.issueKey}
                  </span>
                </Typography>
                <Typography variant="muted" className="text-xs mt-1.5 text-ui-text-tertiary">
                  {new Date(activity._creationTime).toLocaleString()}
                </Typography>
              </div>
            </Flex>
          ))}
        </Flex>
      </div>
    </div>
  );
}
