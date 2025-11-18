/**
 * Recent activity timeline for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
interface Activity {
  _id: string;
  userName: string;
  action: string;
  field?: string;
  issueKey: string;
  createdAt: number;
}

export function RecentActivity({ activities }: { activities: Activity[] | undefined }) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3 last:border-0"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
              {activity.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900">
                <span className="font-medium">{activity.userName}</span> {activity.action}{" "}
                {activity.field && (
                  <>
                    <span className="font-medium">{activity.field}</span> on
                  </>
                )}{" "}
                <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                  {activity.issueKey}
                </span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
