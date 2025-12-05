import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatTime } from "@/lib/formatting";
import { Calendar, Check, Clock, LinkIcon, MapPin, Trash2, X } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MeetingRecordingSection } from "../MeetingRecordingSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/ShadcnSelect";

interface EventDetailsModalProps {
  eventId: Id<"calendarEvents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsModal({ eventId, open, onOpenChange }: EventDetailsModalProps) {
  const event = useQuery(api.calendarEvents.get, { id: eventId });
  const attendance = useQuery(api.calendarEventsAttendance.getAttendance, { eventId });
  const deleteEvent = useMutation(api.calendarEvents.remove);
  const markAttendance = useMutation(api.calendarEventsAttendance.markAttendance);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  if (!event) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          <Flex justify="center" className="p-8">
            <LoadingSpinner size="lg" />
          </Flex>
        </DialogContent>
      </Dialog>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      await deleteEvent({ id: eventId });
      showSuccess("Event deleted");
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <Flex direction="column" gap="lg">
          {/* Badges */}
          <Flex gap="sm" align="center">
            <Badge size="md" className={`capitalize ${getEventTypeColor(event.eventType)}`}>
              {event.eventType}
            </Badge>
            <Badge size="md" className={`capitalize ${getStatusColor(event.status)}`}>
              {event.status}
            </Badge>
          </Flex>

          {/* Content */}
          <Flex direction="column" gap="lg">
            {/* Date and Time */}
            <Flex gap="md" align="start">
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
            </Flex>

            {/* Organizer */}
            <Flex gap="md" align="start">
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
            </Flex>

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
              <Flex
                gap="md"
                align="start"
                className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4"
              >
                <MapPin className="w-5 h-5 text-ui-text-tertiary dark:text-ui-text-tertiary-dark mt-0.5" />
                <div>
                  <div className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    Location
                  </div>
                  <div className="font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                    {event.location}
                  </div>
                </div>
              </Flex>
            )}

            {/* Meeting URL */}
            {event.meetingUrl && (
              <Flex
                gap="md"
                align="start"
                className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4"
              >
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
              </Flex>
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
                <Flex gap="sm" align="center">
                  <Clock className="w-4 h-4 text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
                  <span className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                    Recurring event
                  </span>
                </Flex>
              </div>
            )}

            {/* Meeting Recording Section (for meetings with a meeting URL) */}
            {event.eventType === "meeting" && event.meetingUrl && (
              <MeetingRecordingSection
                calendarEventId={eventId}
                meetingUrl={event.meetingUrl}
                meetingTitle={event.title}
                scheduledStartTime={event.startTime}
              />
            )}

            {/* Attendance Tracking (only for required meetings, only visible to organizer) */}
            {event.isRequired && attendance && (
              <div className="border-t border-ui-border-primary dark:border-ui-border-primary-dark pt-4">
                <Flex justify="between" align="center" className="mb-3">
                  <h4 className="text-sm font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                    Attendance ({attendance.markedCount}/{attendance.totalAttendees} marked)
                  </h4>
                </Flex>

                <Flex direction="column" gap="sm">
                  {attendance.attendees.map((attendee) => (
                    <Flex
                      key={attendee.userId}
                      justify="between"
                      align="center"
                      className="p-2 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded-md"
                    >
                      <Flex gap="sm" align="center" className="flex-1">
                        {/* Status Icon */}
                        {attendee.status === "present" && (
                          <Check className="w-4 h-4 text-status-success" />
                        )}
                        {attendee.status === "tardy" && (
                          <Clock className="w-4 h-4 text-status-warning" />
                        )}
                        {attendee.status === "absent" && (
                          <X className="w-4 h-4 text-status-error" />
                        )}
                        {!attendee.status && <div className="w-4 h-4" />}

                        {/* Attendee Name */}
                        <span className="text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark">
                          {attendee.userName}
                        </span>
                      </Flex>

                      {/* Status Dropdown */}
                      <Select
                        value={attendee.status || ""}
                        onValueChange={(value) =>
                          handleMarkAttendance(
                            attendee.userId,
                            value as "present" | "tardy" | "absent",
                          )
                        }
                        disabled={isSavingAttendance}
                      >
                        <SelectTrigger className="text-sm px-2 py-1 border border-ui-border-primary dark:border-ui-border-primary-dark rounded bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark">
                          <SelectValue placeholder="Not marked" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not marked</SelectItem>
                          <SelectItem value="present">✓ Present</SelectItem>
                          <SelectItem value="tardy">⏰ Tardy</SelectItem>
                          <SelectItem value="absent">✗ Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </Flex>
                  ))}
                </Flex>

                {attendance.totalAttendees === 0 && (
                  <p className="text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark text-center py-4">
                    No attendees added to this meeting
                  </p>
                )}
              </div>
            )}
          </Flex>

          {/* Actions */}
          <DialogFooter>
            <Button
              onClick={handleDelete}
              variant="danger"
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
