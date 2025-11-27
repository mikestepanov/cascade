import { useQuery } from "convex/react";
import { useState } from "react";
import { Clock, DollarSign, Download, TrendingUp, Users } from "@/lib/icons";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface BillingReportProps {
  projectId: Id<"projects">;
}

export function BillingReport({ projectId }: BillingReportProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
  const project = useQuery(api.projects.get, { id: projectId });

  // Calculate date range
  const getDateRange = () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "week":
        return { startDate: now - 7 * day, endDate: now };
      case "month":
        return { startDate: now - 30 * day, endDate: now };
      default:
        return {};
    }
  };

  const billing = useQuery(api.timeEntries.getProjectBilling, {
    projectId,
    ...getDateRange(),
  });

  if (!(billing && project)) {
    return (
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner />
      </Flex>
    );
  }

  const utilizationRate =
    billing.totalHours > 0 ? (billing.billableHours / billing.totalHours) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  const averageRate = billing.billableHours > 0 ? billing.totalRevenue / billing.billableHours : 0;

  const sortedUsers = Object.entries(billing.byUser).sort(([, a], [, b]) => b.revenue - a.revenue);

  return (
    <div className="p-6">
      {/* Header */}
      <Flex justify="between" align="center" className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            Billing Report
          </h2>
          <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            {project.name} {project.clientName && `• ${project.clientName}`}
          </p>
        </div>
        <Flex gap="sm">
          <select
            value={dateRange}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "week" || value === "month" || value === "all") {
                setDateRange(value);
              }
            }}
            className="px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button
            type="button"
            className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            <Flex align="center" gap="sm">
              <Download className="w-4 h-4" />
              Export
            </Flex>
          </button>
        </Flex>
      </Flex>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4">
          <Flex
            align="center"
            gap="sm"
            className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-2"
          >
            <DollarSign className="w-4 h-4" />
            Total Revenue
          </Flex>
          <div className="text-3xl font-bold text-status-success">
            {formatCurrency(billing.totalRevenue)}
          </div>
          {project.budget && (
            <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
              of {formatCurrency(project.budget)} budget (
              {((billing.totalRevenue / project.budget) * 100).toFixed(0)}%)
            </div>
          )}
        </div>

        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4">
          <Flex
            align="center"
            gap="sm"
            className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-2"
          >
            <Clock className="w-4 h-4" />
            Billable Hours
          </Flex>
          <div className="text-3xl font-bold text-brand-600">
            {formatHours(billing.billableHours)}
          </div>
          <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
            of {formatHours(billing.totalHours)} total hours
          </div>
        </div>

        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4">
          <Flex
            align="center"
            gap="sm"
            className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-2"
          >
            <TrendingUp className="w-4 h-4" />
            Utilization Rate
          </Flex>
          <div className="text-3xl font-bold text-accent-600">{utilizationRate.toFixed(0)}%</div>
          <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
            {billing.nonBillableHours.toFixed(2)}h non-billable
          </div>
        </div>

        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-4">
          <Flex
            align="center"
            gap="sm"
            className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-2"
          >
            <DollarSign className="w-4 h-4" />
            Avg Hourly Rate
          </Flex>
          <div className="text-3xl font-bold text-status-warning">
            {formatCurrency(averageRate)}
          </div>
          <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
            per billable hour
          </div>
        </div>
      </div>

      {/* Team Breakdown */}
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg p-6">
        <Flex align="center" gap="sm" className="mb-4">
          <Users className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
          <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
            Team Breakdown
          </h3>
        </Flex>

        {sortedUsers.length === 0 ? (
          <div className="text-center py-8 text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            No time entries recorded yet
          </div>
        ) : (
          <Flex direction="column" gap="md">
            {sortedUsers.map(([userName, stats]) => {
              const userUtilization =
                stats.hours > 0 ? (stats.billableHours / stats.hours) * 100 : 0;

              return (
                <div
                  key={userName}
                  className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg"
                >
                  <Flex justify="between" align="center" className="mb-2">
                    <div>
                      <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {userName}
                      </div>
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        {formatHours(stats.billableHours)} / {formatHours(stats.hours)} hours (
                        {userUtilization.toFixed(0)}% billable)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-status-success">
                        {formatCurrency(stats.revenue)}
                      </div>
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        revenue
                      </div>
                    </div>
                  </Flex>

                  {/* Progress bar */}
                  <div className="w-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all"
                      style={{ width: `${userUtilization}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Flex>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
          <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            {billing.entries}
          </div>
          <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Time Entries
          </div>
        </div>
        <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
          <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            {Object.keys(billing.byUser).length}
          </div>
          <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Team Members
          </div>
        </div>
        <div className="p-4 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
          <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            {averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
          </div>
          <div className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Blended Rate
          </div>
        </div>
      </div>
    </div>
  );
}
