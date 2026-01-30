import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";

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
        return "bg-status-success/10 text-status-success";
      case "under_hours":
        return "bg-status-warning/10 text-status-warning";
      case "over_hours":
        return "bg-status-error/10 text-status-error";
      case "equity_under":
        return "bg-brand-subtle text-brand-hover";
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
    <Flex direction="column" gap="xl">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-ui-text">
                  {summary.complianceRate.toFixed(1)}%
                </div>
                <div className="text-sm text-ui-text-secondary">Compliance Rate</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-status-success">{summary.compliant}</div>
                <div className="text-sm text-ui-text-secondary">✅ Compliant</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-status-warning">{summary.underHours}</div>
                <div className="text-sm text-ui-text-secondary">⚠️ Under Hours</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-status-error">{summary.overHours}</div>
                <div className="text-sm text-ui-text-secondary">🔴 Over Hours</div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand">{summary.equityUnder}</div>
                <div className="text-sm text-ui-text-secondary">💎 Equity Short</div>
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
            <Select
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ComplianceStatus | "all")}
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="under_hours">Under Hours</option>
              <option value="over_hours">Over Hours</option>
              <option value="equity_under">Equity Short</option>
            </Select>

            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Records List */}
          {!records ? (
            <div className="text-center py-8 text-ui-text-tertiary">Loading...</div>
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
              {records?.map((record) => (
                <div
                  key={record._id}
                  className="p-4 border border-ui-border rounded-lg hover:bg-ui-bg-tertiary transition-colors"
                >
                  <Flex justify="between" align="start">
                    <div className="flex-1">
                      <Flex gap="md" align="center" className="mb-2">
                        <span className="text-xl">{getStatusIcon(record.status)}</span>
                        <div>
                          <Typography variant="h4" className="font-medium text-ui-text">
                            {record.user?.name || record.user?.email || "Unknown User"}
                          </Typography>
                          <Flex gap="sm" className="mt-1">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded",
                                getStatusColor(record.status),
                              )}
                            >
                              {getStatusLabel(record.status)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-ui-bg-tertiary text-ui-text rounded capitalize">
                              {record.periodType}ly
                            </span>
                            {record.reviewedBy && (
                              <span className="text-xs px-2 py-0.5 bg-accent-subtle text-accent-hover rounded">
                                Reviewed
                              </span>
                            )}
                          </Flex>
                        </div>
                      </Flex>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <span className="text-ui-text-tertiary text-xs">Period:</span>
                          <div className="font-medium text-ui-text">
                            {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
                          </div>
                        </div>

                        <div>
                          <span className="text-ui-text-tertiary text-xs">Hours Worked:</span>
                          <div className="font-medium text-ui-text">
                            {record.totalHoursWorked.toFixed(1)}h
                          </div>
                        </div>

                        {record.hoursDeficit && (
                          <div>
                            <span className="text-ui-text-tertiary text-xs">Deficit:</span>
                            <div className="font-medium text-status-warning">
                              -{record.hoursDeficit.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.hoursExcess && (
                          <div>
                            <span className="text-ui-text-tertiary text-xs">Excess:</span>
                            <div className="font-medium text-status-error">
                              +{record.hoursExcess.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.equityHoursDeficit && (
                          <div>
                            <span className="text-ui-text-tertiary text-xs">Equity Short:</span>
                            <div className="font-medium text-brand">
                              -{record.equityHoursDeficit.toFixed(1)}h
                            </div>
                          </div>
                        )}

                        {record.totalEquityHours && (
                          <div>
                            <span className="text-ui-text-tertiary text-xs">Equity Hours:</span>
                            <div className="font-medium text-ui-text">
                              {record.totalEquityHours.toFixed(1)}h
                            </div>
                          </div>
                        )}
                      </div>

                      {record.reviewNotes && (
                        <div className="mt-3 p-2 bg-accent-subtle rounded text-sm">
                          <span className="font-medium text-accent-active">Review Notes:</span>{" "}
                          <span className="text-accent-hover">{record.reviewNotes}</span>
                        </div>
                      )}
                    </div>

                    <Flex gap="sm" className="ml-4">
                      {!record.reviewedBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewingRecord(record._id)}
                        >
                          Review
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Review Modal */}
      <Dialog
        open={!!reviewingRecord}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingRecord(null);
            setReviewNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Compliance Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReview}>
            <Flex direction="column" gap="lg" className="p-6">
              <Textarea
                label="Review Notes (Optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this compliance record..."
                rows={4}
              />
            </Flex>
            <DialogFooter>
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
              <Button type="submit" isLoading={isSubmitting}>
                Mark as Reviewed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Flex>
  );
}
