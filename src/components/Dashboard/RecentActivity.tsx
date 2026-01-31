import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { SkeletonText } from "../ui/Skeleton";
import { Typography } from "../ui/Typography";

interface Activity {
  _id: string;
  userName: string;
  action: string;
  issueKey: string;
  projectName: string;
  _creationTime: number;
}

interface RecentActivityProps {
  activities: Activity[] | undefined;
}

const getActionLabel = (action: string): string => {
  switch (action) {
    case "created":
      return "+";
    case "updated":
      return "~";
    case "commented":
      return "#";
    case "assigned":
      return "@";
    case "moved":
      return ">";
    default:
      return "*";
  }
};

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader title="Feed" description="Latest updates across all projects" />
      <CardBody>
        {!activities ? (
          /* Loading skeleton */
          <Flex direction="column" gap="md">
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
          </Flex>
        ) : activities.length === 0 ? (
          <EmptyState icon="📊" title="No activity" description="No recent activity to show" />
        ) : (
          <Flex direction="column" gap="md" className="h-96 overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((activity: Activity, activityIndex: number) => (
              <div key={activity._id} className="relative">
                {/* Timeline connector */}
                {activityIndex < activities.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-ui-border" />
                )}

                <Flex gap="md" align="start">
                  <Flex
                    align="center"
                    justify="center"
                    className="shrink-0 w-8 h-8 rounded-full bg-ui-bg-tertiary border border-ui-border relative z-10"
                  >
                    <span
                      className="text-xs font-mono font-bold text-ui-text-secondary"
                      aria-hidden="true"
                    >
                      {getActionLabel(activity.action)}
                    </span>
                  </Flex>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="text-sm">
                      <Typography variant="small" as="span" className="font-bold text-ui-text">
                        {activity.userName}
                      </Typography>{" "}
                      <Typography variant="small" as="span" color="secondary">
                        {activity.action}
                      </Typography>
                    </div>
                    <div className="mt-1">
                      <Badge
                        variant="neutral"
                        className="font-mono text-caption bg-ui-bg-tertiary/50 border-ui-border/50"
                      >
                        {activity.issueKey}
                      </Badge>
                    </div>
                    <Flex
                      gap="xs"
                      align="center"
                      className="mt-1.5 text-caption text-ui-text-tertiary uppercase tracking-wider font-bold"
                    >
                      <span>{activity.projectName}</span>
                      <span>•</span>
                      <span>{new Date(activity._creationTime).toLocaleDateString()}</span>
                    </Flex>
                  </div>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
