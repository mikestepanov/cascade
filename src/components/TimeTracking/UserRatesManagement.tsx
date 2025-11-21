import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function UserRatesManagement() {
  const currentUser = useQuery(api.auth.loggedInUser);
  const projects = useQuery(api.projects.list);
  const userRates = useQuery(api.timeTracking.listUserRates, {});

  const setUserRate = useMutation(api.timeTracking.setUserRate);

  const [showAddRate, setShowAddRate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "default">("default");
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rateType, setRateType] = useState<"internal" | "billable">("internal");
  const [notes, setNotes] = useState("");

  const handleSaveRate = async () => {
    if (!currentUser) return;

    const userId = editingUserId || currentUser._id;
    const rate = parseFloat(hourlyRate);

    if (Number.isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    try {
      await setUserRate({
        userId,
        projectId: selectedProject === "default" ? undefined : selectedProject,
        hourlyRate: rate,
        currency,
        rateType,
        notes: notes || undefined,
      });

      toast.success("Hourly rate saved");
      setShowAddRate(false);
      setEditingUserId(null);
      setHourlyRate("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save rate");
    }
  };

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr || "USD",
    }).format(amount);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
            Hourly Rates
          </h2>
          <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1">
            Manage hourly rates for cost tracking and burn rate calculations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddRate(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          Set My Rate
        </button>
      </div>

      {/* Current Rates List */}
      {userRates && userRates.length > 0 ? (
        <div className="space-y-3">
          {userRates.map((rate) => (
            <div
              key={rate._id}
              className="p-4 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                      {rate.user?.name || "Unknown User"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        rate.rateType === "billable"
                          ? "bg-status-success/10 dark:bg-status-success/20 text-status-success dark:text-status-success"
                          : "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                      }`}
                    >
                      {rate.rateType}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    {rate.projectId ? (
                      <span>Project-specific rate</span>
                    ) : (
                      <span>Default rate (applies to all projects)</span>
                    )}
                  </div>
                  {rate.notes && (
                    <p className="mt-2 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      {rate.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
                    {formatCurrency(rate.hourlyRate, rate.currency)}
                  </div>
                  <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                    per hour
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-lg border-2 border-dashed border-ui-border-primary dark:border-ui-border-primary-dark">
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
            No hourly rates set
          </h3>
          <p className="mt-1 text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            Set your hourly rate to enable cost tracking and burn rate calculations
          </p>
          <button
            type="button"
            onClick={() => setShowAddRate(true)}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            Set My Rate
          </button>
        </div>
      )}

      {/* Add/Edit Rate Modal */}
      {showAddRate && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowAddRate(false);
              setEditingUserId(null);
              setHourlyRate("");
              setNotes("");
            }}
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl z-50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-ui-text-primary dark:text-ui-text-primary-dark">
              Set Hourly Rate
            </h2>

            <div className="space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  Apply To
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) =>
                    setSelectedProject(
                      e.target.value === "default" ? "default" : (e.target.value as Id<"projects">),
                    )
                  }
                  className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
                >
                  <option value="default">All Projects (Default)</option>
                  {projects?.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} (Override)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-1">
                  Project-specific rates override the default rate
                </p>
              </div>

              {/* Rate Type */}
              <div>
                <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  Rate Type
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex items-center gap-2 cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors ${
                      rateType === "internal"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-ui-border-primary dark:border-ui-border-primary-dark"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rateType"
                      checked={rateType === "internal"}
                      onChange={() => setRateType("internal")}
                      className="w-4 h-4 text-brand-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        Internal Cost
                      </div>
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        What you pay
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2 cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors ${
                      rateType === "billable"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-ui-border-primary dark:border-ui-border-primary-dark"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rateType"
                      checked={rateType === "billable"}
                      onChange={() => setRateType("billable")}
                      className="w-4 h-4 text-brand-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        Billable Rate
                      </div>
                      <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                        Charge clients
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  Hourly Rate
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
                      $
                    </span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Senior developer rate, Contract rate for Q1 2024..."
                  rows={2}
                  className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-ui-bg-primary-dark dark:text-ui-text-primary-dark resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddRate(false);
                  setEditingUserId(null);
                  setHourlyRate("");
                  setNotes("");
                }}
                className="px-4 py-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRate}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                Save Rate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
