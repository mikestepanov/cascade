import { Avatar } from "../ui/Avatar";
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

const getActionBadgeVariant = (action: string): "success" | "info" | "warning" | "neutral" => {
  switch (action) {
    case "created":
      return "success";
    case "updated":
      return "info";
    case "commented":
      return "info";
    case "assigned":
      return "warning";
    case "moved":
      return "neutral";
    default:
      return "neutral";
  }
};

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow">
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
                  {/* User avatar */}
                  <div className="shrink-0 relative z-10">
                    <Avatar name={activity.userName} size="md" variant="brand" />
                  </div>

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
