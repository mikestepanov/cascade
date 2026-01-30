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
    <div className="bg-ui-bg rounded-lg shadow p-6">
      <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-4">
        Recent Activity
      </Typography>
      <Flex direction="column" gap="md">
        {activities.map((activity) => (
          <Flex
            key={activity._id}
            gap="md"
            align="start"
            className="text-sm border-b border-ui-border-secondary pb-3 last:border-0"
          >
            <Flex
              align="center"
              justify="center"
              className="shrink-0 w-8 h-8 rounded-full bg-ui-bg-tertiary text-xs font-medium"
            >
              {activity.userName.charAt(0).toUpperCase()}
            </Flex>
            <div className="flex-1 min-w-0">
              <Typography variant="p">
                <span className="font-medium">{activity.userName}</span> {activity.action}{" "}
                {activity.field && (
                  <>
                    <span className="font-medium">{activity.field}</span> on
                  </>
                )}{" "}
                <span className="font-mono text-xs bg-ui-bg-tertiary px-1 rounded">
                  {activity.issueKey}
                </span>
              </Typography>
              <Typography variant="muted" className="text-xs mt-1">
                {new Date(activity._creationTime).toLocaleString()}
              </Typography>
            </div>
          </Flex>
        ))}
      </Flex>
    </div>
  );
}
