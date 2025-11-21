import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BurnRateDashboard } from "./BurnRateDashboard";
import { TimeEntriesList } from "./TimeEntriesList";
import { UserRatesManagement } from "./UserRatesManagement";

export function TimeTrackingPage() {
  const [activeTab, setActiveTab] = useState<"entries" | "burn-rate" | "rates">("entries");
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "all">("all");
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");

  const projects = useQuery(api.projects.list);

  // Calculate date range
  const now = Date.now();
  const ranges = {
    week: {
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now,
    },
    month: {
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now,
    },
    all: {
      startDate: undefined,
      endDate: undefined,
    },
  };

  const { startDate, endDate } = ranges[dateRange];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
          Time Tracking
        </h1>
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
          Track time, analyze costs, and monitor burn rate
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark">
        <nav className="-mb-px flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("entries")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "entries"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            Time Entries
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("burn-rate")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "burn-rate"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            Burn Rate & Costs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rates")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "rates"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark"
            }`}
          >
            Hourly Rates
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Project filter */}
        <div>
          <label className="block text-xs font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) =>
              setSelectedProject(
                e.target.value === "all" ? "all" : (e.target.value as Id<"projects">),
              )
            }
            className="px-3 py-2 text-sm border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
          >
            <option value="all">All Projects</option>
            {projects?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range filter */}
        {activeTab === "entries" && (
          <div>
            <label className="block text-xs font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as "week" | "month" | "all")}
              className="px-3 py-2 text-sm border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {activeTab === "entries" && (
          <TimeEntriesList
            projectId={selectedProject === "all" ? undefined : selectedProject}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === "burn-rate" && selectedProject !== "all" && (
          <BurnRateDashboard projectId={selectedProject} />
        )}

        {activeTab === "burn-rate" && selectedProject === "all" && (
          <div className="text-center p-12 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
              Select a project
            </h3>
            <p className="mt-1 text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
              Choose a project to view burn rate and cost analysis
            </p>
          </div>
        )}

        {activeTab === "rates" && <UserRatesManagement />}
      </div>
    </div>
  );
}
