import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface BurnRateDashboardProps {
  projectId: Id<"projects">;
}

export function BurnRateDashboard({ projectId }: BurnRateDashboardProps) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("month");

  // Calculate date range
  const now = Date.now();
  const ranges = {
    week: {
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now,
      label: "Last 7 Days",
    },
    month: {
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now,
      label: "Last 30 Days",
    },
    quarter: {
      startDate: now - 90 * 24 * 60 * 60 * 1000,
      endDate: now,
      label: "Last 90 Days",
    },
  };

  const { startDate, endDate } = ranges[dateRange];

  const burnRate = useQuery(api.timeTracking.getBurnRate, {
    projectId,
    startDate,
    endDate,
  });

  const teamCosts = useQuery(api.timeTracking.getTeamCosts, {
    projectId,
    startDate,
    endDate,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  if (!(burnRate && teamCosts)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
          Burn Rate & Team Costs
        </h2>

        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                dateRange === range
                  ? "bg-brand-600 text-white"
                  : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
              }`}
            >
              {ranges[range].label}
            </button>
          ))}
        </div>
      </div>

      {/* Burn Rate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Cost"
          value={formatCurrency(burnRate.totalCost)}
          icon="💰"
          color="blue"
        />
        <MetricCard
          label="Per Day"
          value={formatCurrency(burnRate.burnRatePerDay)}
          icon="📅"
          color="green"
        />
        <MetricCard
          label="Per Week"
          value={formatCurrency(burnRate.burnRatePerWeek)}
          icon="📊"
          color="purple"
        />
        <MetricCard
          label="Per Month"
          value={formatCurrency(burnRate.burnRatePerMonth)}
          icon="🗓️"
          color="orange"
        />
      </div>

      {/* Hours Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg">
          <h3 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">Total Hours</h3>
          <div className="text-3xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
            {formatHours(burnRate.totalHours)}h
          </div>
          <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
            {burnRate.entriesCount} time entries
          </p>
        </div>

        <div className="p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg">
          <h3 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
            Billable Hours
          </h3>
          <div className="text-3xl font-bold text-status-success dark:text-status-success">
            {formatHours(burnRate.billableHours)}h
          </div>
          <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
            {formatCurrency(burnRate.billableCost)} billable
          </p>
        </div>
      </div>

      {/* Team Costs Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-3">
          Team Costs Breakdown
        </h3>

        {teamCosts.length === 0 ? (
          <div className="text-center p-8 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
            <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              No time entries for this period
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {teamCosts.map((member) => {
              const percentOfTotal =
                burnRate.totalCost > 0 ? (member.cost / burnRate.totalCost) * 100 : 0;

              return (
                <div
                  key={member.user?._id || "unknown"}
                  className="p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {member.user?.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark flex items-center justify-center text-sm font-medium text-ui-text-secondary dark:text-ui-text-secondary-dark">
                          {member.user?.name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                          {member.user?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                          {formatHours(member.hours)}h total ({formatHours(member.billableHours)}h
                          billable)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                        {formatCurrency(member.cost)}
                      </div>
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        {percentOfTotal.toFixed(0)}% of total
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 dark:bg-brand-500 rounded-full transition-all"
                      style={{ width: `${percentOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800",
    green: "bg-status-success/10 dark:bg-status-success/20 border-status-success/30 dark:border-status-success/40",
    purple: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800",
    orange: "bg-status-warning/10 dark:bg-status-warning/20 border-status-warning/30 dark:border-status-warning/40",
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-ui-text-secondary dark:text-ui-text-secondary-dark">{label}</span>
      </div>
      <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">{value}</div>
    </div>
  );
}
