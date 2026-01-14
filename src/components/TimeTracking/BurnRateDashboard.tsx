import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/progress";
import { Typography } from "../ui/Typography";

interface BurnRateDashboardProps {
  projectId: Id<"projects">;
}

interface UserWithBurnRate {
  cost: number;
  user?: Doc<"users">;
  hours: number;
  billableHours: number;
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
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Header with date range selector */}
      <Flex justify="between" align="center">
        <h2 className="text-lg font-semibold text-ui-text-primary">Burn Rate & Team Costs</h2>

        <Flex gap="sm">
          {(["week", "month", "quarter"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-lg transition-colors",
                dateRange === range
                  ? "bg-brand-600 text-white"
                  : "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark",
              )}
            >
              {ranges[range].label}
            </button>
          ))}
        </Flex>
      </Flex>

      {/* Burn Rate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Cost"
          value={formatCurrency(burnRate.totalCost)}
          icon="💰"
          color="info"
        />
        <MetricCard
          label="Per Day"
          value={formatCurrency(burnRate.burnRatePerDay)}
          icon="📅"
          color="success"
        />
        <MetricCard
          label="Per Week"
          value={formatCurrency(burnRate.burnRatePerWeek)}
          icon="📊"
          color="accent"
        />
        <MetricCard
          label="Per Month"
          value={formatCurrency(burnRate.burnRatePerMonth)}
          icon="🗓️"
          color="warning"
        />
      </div>

      {/* Hours Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-ui-bg-primary border border-ui-border-primary rounded-lg">
          <h3 className="text-sm font-medium text-ui-text-primary mb-2">Total Hours</h3>
          <div className="text-3xl font-bold text-ui-text-primary">
            {formatHours(burnRate.totalHours)}h
          </div>
          <Typography className="text-xs text-ui-text-tertiary mt-1">
            {burnRate.entriesCount} time entries
          </Typography>
        </div>

        <div className="p-4 bg-ui-bg-primary border border-ui-border-primary rounded-lg">
          <h3 className="text-sm font-medium text-ui-text-primary mb-2">Billable Hours</h3>
          <div className="text-3xl font-bold text-status-success dark:text-status-success">
            {formatHours(burnRate.billableHours)}h
          </div>
          <Typography className="text-xs text-ui-text-tertiary mt-1">
            {formatCurrency(burnRate.billableCost)} billable
          </Typography>
        </div>
      </div>

      {/* Team Costs Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-ui-text-primary mb-3">Team Costs Breakdown</h3>

        {teamCosts.length === 0 ? (
          <div className="text-center p-8 bg-ui-bg-secondary rounded-lg">
            <Typography className="text-sm text-ui-text-tertiary">
              No time entries for this period
            </Typography>
          </div>
        ) : (
          <Flex direction="column" gap="sm">
            {(teamCosts as unknown as UserWithBurnRate[]).map((member) => {
              const percentOfTotal =
                burnRate.totalCost > 0 ? (member.cost / burnRate.totalCost) * 100 : 0;

              return (
                <div
                  key={member.user?._id || "unknown"}
                  className="p-4 bg-ui-bg-primary border border-ui-border-primary rounded-lg"
                >
                  <div className="mb-2">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="md">
                        {member.user?.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-ui-bg-tertiary flex items-center justify-center text-sm font-medium text-ui-text-secondary">
                            {member.user?.name?.[0] || "?"}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-ui-text-primary">
                            {member.user?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-ui-text-tertiary">
                            {formatHours(member.hours)}h total ({formatHours(member.billableHours)}h
                            billable)
                          </div>
                        </div>
                      </Flex>

                      <div className="flex flex-col items-end">
                        <div className="py-2 text-right text-sm font-medium text-ui-text-primary">
                          {formatHours(member.hours)}
                        </div>
                        <div className="py-2 text-right text-sm font-medium text-ui-text-primary">
                          {formatHours(member.billableHours)}
                        </div>
                        <div className="text-sm font-semibold text-ui-text-primary">
                          {formatCurrency(member.cost)}
                        </div>
                        <div className="text-xs text-ui-text-tertiary">
                          {percentOfTotal.toFixed(0)}% of total
                        </div>
                      </div>
                    </Flex>
                  </div>

                  {/* Progress bar */}
                  <Progress value={percentOfTotal} />
                </div>
              );
            })}
          </Flex>
        )}
      </div>
    </Flex>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: "info" | "success" | "accent" | "warning";
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    info: "bg-status-info-bg dark:bg-status-info-bg-dark border-status-info/30 dark:border-status-info/40",
    success:
      "bg-status-success-bg dark:bg-status-success-bg-dark border-status-success/30 dark:border-status-success/40",
    accent: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800",
    warning:
      "bg-status-warning-bg dark:bg-status-warning-bg-dark border-status-warning/30 dark:border-status-warning/40",
  };

  return (
    <div className={cn("p-4 border rounded-lg", colorClasses[color])}>
      <Flex align="center" gap="sm" className="mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-ui-text-secondary">{label}</span>
      </Flex>
      <div className="text-2xl font-bold text-ui-text-primary">{value}</div>
    </div>
  );
}
