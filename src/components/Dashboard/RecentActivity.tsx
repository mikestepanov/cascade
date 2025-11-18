import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonText } from "../ui/Skeleton";

interface Activity {
  _id: string;
  userName: string;
  action: string;
  issueKey: string;
  projectName: string;
  createdAt: number;
}

interface RecentActivityProps {
  activities: Activity[] | undefined;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return "➕";
    case "updated":
      return "✏️";
    case "commented":
      return "💬";
    case "assigned":
      return "👤";
    case "moved":
      return "🔄";
    default:
      return "📝";
  }
};

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader title="Recent Activity" description="Latest updates" />
      <CardBody>
        {!activities ? (
          /* Loading skeleton */
          <div className="space-y-3">
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState icon="📊" title="No activity" description="No recent activity to show" />
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity, activityIndex) => (
              <div
                key={activity._id}
                className="relative animate-slide-up"
                style={{ animationDelay: `${activityIndex * 50}ms` }}
              >
                {/* Timeline connector */}
                {activityIndex < activities.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
                )}

                <div className="flex items-start gap-3">
                  {/* Icon circle with background */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center relative z-10">
                    <span className="text-sm" aria-hidden="true">
                      {getActionIcon(activity.action)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {activity.userName}
                      </span>{" "}
                      <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        {activity.issueKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{activity.projectName}</span>
                      <span>•</span>
                      <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
