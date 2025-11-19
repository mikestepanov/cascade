import { useMutation, useQuery } from "convex/react";
import { Calendar, Check, Clock, Link as LinkIcon, MapPin, Trash2, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatDate, formatTime } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
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
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "deadline":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "timeblock":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "personal":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "tentative":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded capitalize ${getEventTypeColor(event.eventType)}`}
              >
                {event.eventType}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded capitalize ${getStatusColor(event.status)}`}
              >
                {event.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close event details modal"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(event.startTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              {event.organizerName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Organizer</div>
              <div className="font-medium text-gray-900 dark:text-white">{event.organizerName}</div>
              {event.organizerEmail && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {event.organizerEmail}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </div>
              <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                <div className="font-medium text-gray-900 dark:text-white">{event.location}</div>
              </div>
            </div>
          )}

          {/* Meeting URL */}
          {event.meetingUrl && (
            <div className="flex items-start gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <LinkIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Meeting Link</div>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Join Meeting
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</div>
              <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.notes}
              </div>
            </div>
          )}

          {/* Recurring */}
          {event.isRecurring && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Recurring event</span>
              </div>
            </div>
          )}

          {/* Attendance Tracking (only for required meetings, only visible to organizer) */}
          {event.isRequired && attendance && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Attendance ({attendance.markedCount}/{attendance.totalAttendees} marked)
                </h4>
              </div>

              <div className="space-y-2">
                {attendance.attendees.map((attendee) => (
                  <div
                    key={attendee.userId}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Status Icon */}
                      {attendee.status === "present" && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      {attendee.status === "tardy" && (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      {attendee.status === "absent" && <X className="w-4 h-4 text-red-600" />}
                      {!attendee.status && <div className="w-4 h-4" />}

                      {/* Attendee Name */}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                      className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No attendees added to this meeting
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Event"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
