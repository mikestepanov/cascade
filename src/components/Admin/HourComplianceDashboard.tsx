import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { InputField, SelectField } from "../ui/FormField";
import { Modal } from "../ui/Modal";

type ComplianceStatus = "compliant" | "under_hours" | "over_hours" | "equity_under";

export function HourComplianceDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviewingRecord, setReviewingRecord] = useState<Id<"hourComplianceRecords"> | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const summary = useQuery(
    api.hourCompliance.getComplianceSummary,
    startDate || endDate
      ? {
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
        }
      : {},
  );

  const records = useQuery(api.hourCompliance.listComplianceRecords, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    limit: 100,
  });

  const reviewRecord = useMutation(api.hourCompliance.reviewComplianceRecord);
  const checkAllCompliance = useMutation(api.hourCompliance.checkAllUsersCompliance);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRecord) return;

    setIsSubmitting(true);
    try {
      await reviewRecord({
        recordId: reviewingRecord,
        notes: reviewNotes || undefined,
      });
      showSuccess("Compliance record reviewed");
      setReviewingRecord(null);
      setReviewNotes("");
    } catch (error) {
      showError(error, "Failed to review record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckAllCompliance = async () => {
    if (!confirm("Check compliance for all active users this week?")) return;

    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      await checkAllCompliance({
        periodType: "week",
        periodStart: weekStart.getTime(),
        periodEnd: weekEnd.getTime(),
      });
      showSuccess("Compliance check initiated for all users");
    } catch (error) {
      showError(error, "Failed to check compliance");
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant":
        return "✅";
      case "under_hours":
        return "⚠️";
      case "over_hours":
        return "🔴";
      case "equity_under":
        return "💎";
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      case "under_hours":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "over_hours":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      case "equity_under":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    }
  };

  const getStatusLabel = (status: ComplianceStatus) => {
    switch (status) {
      case "compliant":
        return "Compliant";
      case "under_hours":
        return "Under Hours";
      case "over_hours":
        return "Over Hours";
      case "equity_under":
        return "Equity Short";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.complianceRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compliance Rate</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.compliant}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">✅ Compliant</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.underHours}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">⚠️ Under Hours</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.overHours}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">🔴 Over Hours</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.equityUnder}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">💎 Equity Short</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Compliance Records */}
      <Card>
        <CardHeader
          title="Hour Compliance Records"
          description="Track employee/contractor/intern hour compliance"
          action={
            <Button onClick={handleCheckAllCompliance} size="sm">
              Check All Users (This Week)
            </Button>
          }
        />

        <CardBody>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SelectField
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ComplianceStatus | "all")}
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="under_hours">Under Hours</option>
              <option value="over_hours">Over Hours</option>
              <option value="equity_under">Equity Short</option>
            </SelectField>

            <InputField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <InputField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Records List */}
          {!records ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : records.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No compliance records"
              description="Check compliance to start tracking"
              action={{
                label: "Check All Users",
                onClick: handleCheckAllCompliance,
              }}
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{getStatusIcon(record.status)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {record.user?.name || record.user?.email || "Unknown User"}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getStatusColor(record.status)}`}
                            >
                              {getStatusLabel(record.status)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                              {record.periodType}ly
                            </span>
                            {record.reviewedBy && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded">
                                Reviewed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Period:</span>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            Hours Worked:
                          </span>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {record.totalHoursWorked.toFixed(1)}h
                          </div>
                        </div>

                        {record.hoursDeficit && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Deficit:
                            </span>
                            <div className="font-medium text-yellow-600 dark:text-yellow-400">
                              -{record.hoursDeficit.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.hoursExcess && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Excess:
                            </span>
                            <div className="font-medium text-red-600 dark:text-red-400">
                              +{record.hoursExcess.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.equityHoursDeficit && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Equity Short:
                            </span>
                            <div className="font-medium text-blue-600 dark:text-blue-400">
                              -{record.equityHoursDeficit.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.totalEquityHours && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Equity Hours:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {record.totalEquityHours.toFixed(1)}h
                            </div>
                          </div>
                        )}
                      </div>

                      {record.reviewNotes && (
                        <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                          <span className="font-medium text-purple-900 dark:text-purple-100">
                            Review Notes:
                          </span>{" "}
                          <span className="text-purple-700 dark:text-purple-300">
                            {record.reviewNotes}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!record.reviewedBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewingRecord(record._id)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingRecord}
        onClose={() => {
          setReviewingRecord(null);
          setReviewNotes("");
        }}
        title="Review Compliance Record"
        maxWidth="lg"
      >
        <form onSubmit={handleReview} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="review-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Review Notes (Optional)
            </label>
            <textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about this compliance record..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" isLoading={isSubmitting}>
              Mark as Reviewed
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setReviewingRecord(null);
                setReviewNotes("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
