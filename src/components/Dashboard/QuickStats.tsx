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
          <Card className="bg-gradient-to-br from-brand-50 to-ui-bg-primary dark:from-brand-900/20 dark:to-ui-bg-primary-dark border-l-4 border-brand-600 dark:border-brand-500 animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-brand-700 dark:text-brand-400 mb-2">
                ASSIGNED TO ME
              </div>
              <div className="text-4xl font-bold text-brand-600 dark:text-brand-400">
                {stats.assignedToMe || 0}
              </div>
              <div className="text-xs text-brand-600 dark:text-brand-400 mt-2">Active tasks</div>
            </CardBody>
          </Card>

          {/* Completed This Week */}
          <Card className="bg-gradient-to-br from-status-success-bg to-ui-bg-primary dark:from-status-success-bg-dark dark:to-ui-bg-primary-dark border-l-4 border-status-success dark:border-status-success animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-status-success-text dark:text-status-success-text-dark mb-2">
                COMPLETED
              </div>
              <div className="text-4xl font-bold text-status-success dark:text-status-success">
                {stats.completedThisWeek || 0}
              </div>
              <div className="text-xs text-status-success dark:text-status-success mt-2">This week</div>
            </CardBody>
          </Card>

          {/* High Priority - Warning state */}
          <Card
            className={`border-l-4 animate-fade-in ${
              (stats.highPriority || 0) > 0
                ? "bg-gradient-to-br from-status-warning-bg to-ui-bg-primary dark:from-status-warning-bg-dark dark:to-ui-bg-primary-dark border-status-warning dark:border-status-warning"
                : "bg-gradient-to-br from-ui-bg-secondary to-ui-bg-primary dark:from-ui-bg-secondary-dark dark:to-ui-bg-primary-dark border-ui-border-primary dark:border-ui-border-primary-dark"
            }`}
          >
            <CardBody className="text-center">
              <div
                className={`text-sm font-medium mb-2 ${
                  (stats.highPriority || 0) > 0
                    ? "text-status-warning-text dark:text-status-warning-text-dark"
                    : "text-ui-text-secondary dark:text-ui-text-secondary-dark"
                }`}
              >
                HIGH PRIORITY
              </div>
              <div
                className={`text-4xl font-bold ${
                  (stats.highPriority || 0) > 0
                    ? "text-status-warning dark:text-status-warning"
                    : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
                }`}
              >
                {stats.highPriority || 0}
              </div>
              <div
                className={`text-xs mt-2 ${
                  (stats.highPriority || 0) > 0
                    ? "text-status-warning dark:text-status-warning"
                    : "text-ui-text-secondary dark:text-ui-text-secondary-dark"
                }`}
              >
                {(stats.highPriority || 0) > 0 ? "Needs attention" : "All clear"}
              </div>
            </CardBody>
          </Card>

          {/* Created by Me */}
          <Card className="bg-gradient-to-br from-accent-50 to-ui-bg-primary dark:from-accent-900/20 dark:to-ui-bg-primary-dark border-l-4 border-accent-600 dark:border-accent-500 animate-fade-in">
            <CardBody className="text-center">
              <div className="text-sm font-medium text-accent-700 dark:text-accent-400 mb-2">
                CREATED
              </div>
              <div className="text-4xl font-bold text-accent-600 dark:text-accent-400">
                {stats.createdByMe || 0}
              </div>
              <div className="text-xs text-accent-600 dark:text-accent-400 mt-2">Total issues</div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
