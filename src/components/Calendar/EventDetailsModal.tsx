import { useMutation, useQuery } from "convex/react";
import { Calendar, Check, Clock, Link as LinkIcon, MapPin, Trash2, X } from "lucide-react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "../ui/Badge";

interface EventDetailsModalProps {
  eventId: Id<"calendarEvents">;
  onClose: () => void;
}

export function EventDetailsModal({ eventId, onClose }: EventDetailsModalProps) {
  const event = useQuery(api.calendarEvents.get, { id: eventId });
  const attendance = useQuery(api.calendarEventsAttendance.getAttendance, { eventId });
  const deleteEvent = useMutation(api.calendarEvents.remove);
  const markAttendance = useMutation(api.calendarEventsAttendance.markAttendance);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  if (!event) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl p-6">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      await deleteEvent({ id: eventId });
      showSuccess("Event deleted");
      onClose();
    } catch (error) {
      showError(error, "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAttendance = async (
    userId: Id<"users">,
    status: "present" | "tardy" | "absent",
  ) => {
    setIsSavingAttendance(true);
    try {
      await markAttendance({ eventId, userId, status });
      showSuccess("Attendance marked");
    } catch (error) {
      showError(error, "Failed to mark attendance");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "meeting":
        return "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200";
      case "deadline":
        return "bg-status-error-bg text-status-error dark:bg-status-error-dark dark:text-status-error-dark";
      case "timeblock":
        return "bg-status-success-bg text-status-success dark:bg-status-success-dark dark:text-status-success-dark";
      case "personal":
        return "bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary dark:bg-ui-bg-tertiary-dark dark:text-ui-text-secondary-dark";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-status-success-bg text-status-success dark:bg-status-success-dark dark:text-status-success-dark";
      case "tentative":
        return "bg-status-warning-bg text-status-warning dark:bg-status-warning-dark dark:text-status-warning-dark";
      case "cancelled":
        return "bg-status-error-bg text-status-error dark:bg-status-error-dark dark:text-status-error-dark";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary dark:bg-ui-bg-tertiary-dark dark:text-ui-text-secondary-dark";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge size="md" className={`capitalize ${getEventTypeColor(event.eventType)}`}>
                {event.eventType}
              </Badge>
              <Badge size="md" className={`capitalize ${getStatusColor(event.status)}`}>
                {event.status}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details modal"
            className="p-2 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-lg"
          >
            <X className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-0.5" />
            <div>
              <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                {formatDate(event.startTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                {event.allDay ? (
                  "All day"
                ) : (
                  <>
                    {formatTime(event.startTime, { hour: "numeric", minute: "2-digit" })} -{" "}
                    {formatTime(event.endTime, { hour: "numeric", minute: "2-digit" })}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              {event.organizerName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                Organizer
              </div>
              <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                {event.organizerName}
              </div>
              {event.organizerEmail && (
                <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {event.organizerEmail}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                Description
              </div>
              <div className="text-ui-text-secondary dark:text-ui-text-secondary-dark whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <MapPin className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-0.5" />
              <div>
                <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Location
                </div>
                <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                  {event.location}
                </div>
              </div>
            </div>
          )}

          {/* Meeting URL */}
          {event.meetingUrl && (
            <div className="flex items-start gap-3 border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <LinkIcon className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-0.5" />
              <div>
                <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Meeting Link
                </div>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Join Meeting
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <div className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                Notes
              </div>
              <div className="text-ui-text-secondary dark:text-ui-text-secondary-dark whitespace-pre-wrap">
                {event.notes}
              </div>
            </div>
          )}

          {/* Recurring */}
          {event.isRecurring && (
            <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
                <span className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  Recurring event
                </span>
              </div>
            </div>
          )}

          {/* Attendance Tracking (only for required meetings, only visible to organizer) */}
          {event.isRequired && attendance && (
            <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                  Attendance ({attendance.markedCount}/{attendance.totalAttendees} marked)
                </h4>
              </div>

              <div className="space-y-2">
                {attendance.attendees.map((attendee) => (
                  <div
                    key={attendee.userId}
                    className="flex items-center justify-between p-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Status Icon */}
                      {attendee.status === "present" && (
                        <Check className="w-4 h-4 text-status-success" />
                      )}
                      {attendee.status === "tardy" && (
                        <Clock className="w-4 h-4 text-status-warning" />
                      )}
                      {attendee.status === "absent" && <X className="w-4 h-4 text-status-error" />}
                      {!attendee.status && <div className="w-4 h-4" />}

                      {/* Attendee Name */}
                      <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                        {attendee.userName}
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={attendee.status || ""}
                      onChange={(e) =>
                        handleMarkAttendance(
                          attendee.userId,
                          e.target.value as "present" | "tardy" | "absent",
                        )
                      }
                      disabled={isSavingAttendance}
                      className="text-sm px-2 py-1 border border-ui-border-primary dark:border-ui-border-primary-dark rounded bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                    >
                      <option value="">Not marked</option>
                      <option value="present">✓ Present</option>
                      <option value="tardy">⏰ Tardy</option>
                      <option value="absent">✗ Absent</option>
                    </select>
                  </div>
                ))}
              </div>

              {attendance.totalAttendees === 0 && (
                <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-center py-4">
                  No attendees added to this meeting
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 p-6 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-status-error hover:bg-status-error-bg dark:hover:bg-status-error-dark rounded-md disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Event"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-md hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
