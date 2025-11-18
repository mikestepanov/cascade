import { Card, CardBody } from "../ui/Card";
import { SkeletonStatCard } from "../ui/Skeleton";

interface Stats {
  assignedToMe: number;
  completedThisWeek: number;
  highPriority: number;
  createdByMe: number;
}

interface QuickStatsProps {
  stats: Stats | undefined;
}

/**
 * Dashboard quick stats cards showing:
 * - Assigned issues
 * - Completed this week
 * - High priority issues
 * - Created issues
 */
export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {!stats ? (
        /* Loading skeletons */
        <>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </>
      ) : (
        <>
          {/* Assigned to Me */}
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-l-4 border-blue-500 dark:border-blue-400 animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                ASSIGNED TO ME
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats.assignedToMe || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">Active tasks</div>
            </CardBody>
          </Card>

          {/* Completed This Week */}
          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 border-l-4 border-green-500 dark:border-green-400 animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                COMPLETED
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {stats.completedThisWeek || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">This week</div>
            </CardBody>
          </Card>

          {/* High Priority - Warning state */}
          <Card
            className={`border-l-4 animate-fade-in ${
              (stats.highPriority || 0) > 0
                ? "bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 border-orange-500 dark:border-orange-400"
                : "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-gray-300 dark:border-gray-600"
            }`}
          >
            <CardBody className="text-center">
              <div
                className={`text-sm font-medium mb-2 ${
                  (stats.highPriority || 0) > 0
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                HIGH PRIORITY
              </div>
              <div
                className={`text-4xl font-bold ${
                  (stats.highPriority || 0) > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {stats.highPriority || 0}
              </div>
              <div
                className={`text-xs mt-2 ${
                  (stats.highPriority || 0) > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {(stats.highPriority || 0) > 0 ? "Needs attention" : "All clear"}
              </div>
            </CardBody>
          </Card>

          {/* Created by Me */}
          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 border-l-4 border-purple-500 dark:border-purple-400 animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                CREATED
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.createdByMe || 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Total issues
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
