import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DollarSign, Clock, Users, TrendingUp, Download } from "lucide-react";

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

  if (!billing || !project) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  const utilizationRate = billing.totalHours > 0
    ? (billing.billableHours / billing.totalHours) * 100
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  const averageRate = billing.billableHours > 0
    ? billing.totalRevenue / billing.billableHours
    : 0;

  const sortedUsers = Object.entries(billing.byUser).sort(
    ([, a], [, b]) => b.revenue - a.revenue
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billing Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.name} {project.clientName && `• ${project.clientName}`}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" />
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(billing.totalRevenue)}
          </div>
          {project.budget && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              of {formatCurrency(project.budget)} budget (
              {((billing.totalRevenue / project.budget) * 100).toFixed(0)}%)
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            Billable Hours
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {formatHours(billing.billableHours)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            of {formatHours(billing.totalHours)} total hours
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            Utilization Rate
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {utilizationRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {billing.nonBillableHours.toFixed(2)}h non-billable
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" />
            Avg Hourly Rate
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(averageRate)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            per billable hour
          </div>
        </div>
      </div>

      {/* Team Breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Breakdown
          </h3>
        </div>

        {sortedUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No time entries recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {sortedUsers.map(([userName, stats]) => {
              const userUtilization = stats.hours > 0
                ? (stats.billableHours / stats.hours) * 100
                : 0;

              return (
                <div
                  key={userName}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {userName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatHours(stats.billableHours)} / {formatHours(stats.hours)} hours (
                        {userUtilization.toFixed(0)}% billable)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.revenue)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        revenue
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${userUtilization}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {billing.entries}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Time Entries
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Object.keys(billing.byUser).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Team Members
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {averageRate > 0 ? formatCurrency(averageRate) : "N/A"}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Blended Rate
          </div>
        </div>
      </div>
    </div>
  );
}
