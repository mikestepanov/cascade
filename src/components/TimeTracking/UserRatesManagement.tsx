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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hourly Rates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage hourly rates for cost tracking and burn rate calculations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddRate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {rate.user?.name || "Unknown User"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        rate.rateType === "billable"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {rate.rateType}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {rate.projectId ? (
                      <span>Project-specific rate</span>
                    ) : (
                      <span>Default rate (applies to all projects)</span>
                    )}
                  </div>
                  {rate.notes && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{rate.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(rate.hourlyRate, rate.currency)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">per hour</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No hourly rates set
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Set your hourly rate to enable cost tracking and burn rate calculations
          </p>
          <button
            type="button"
            onClick={() => setShowAddRate(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Set Hourly Rate
            </h2>

            <div className="space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apply To
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) =>
                    setSelectedProject(
                      e.target.value === "default" ? "default" : (e.target.value as Id<"projects">),
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="default">All Projects (Default)</option>
                  {projects?.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} (Override)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Project-specific rates override the default rate
                </p>
              </div>

              {/* Rate Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rate Type
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex items-center gap-2 cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors ${
                      rateType === "internal"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rateType"
                      checked={rateType === "internal"}
                      onChange={() => setRateType("internal")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Internal Cost
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">What you pay</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2 cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors ${
                      rateType === "billable"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rateType"
                      checked={rateType === "billable"}
                      onChange={() => setRateType("billable")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Billable Rate
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Charge clients</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hourly Rate
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Senior developer rate, Contract rate for Q1 2024..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 resize-none"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
