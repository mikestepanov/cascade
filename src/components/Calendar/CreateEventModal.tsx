import { useMutation, useQuery } from "convex/react";
import { Calendar, Clock, Link as LinkIcon, MapPin, X } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface CreateEventModalProps {
  onClose: () => void;
  defaultDate?: Date;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

export function CreateEventModal({
  onClose,
  defaultDate = new Date(),
  projectId,
  issueId,
}: CreateEventModalProps) {
  const createEvent = useMutation(api.calendarEvents.create);
  const projects = useQuery(api.projects.list, {});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(defaultDate.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<"meeting" | "deadline" | "timeblock" | "personal">(
    "meeting",
  );
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | undefined>(projectId);
  const [isRequired, setIsRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse start and end times
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(startDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      await createEvent({
        title,
        description: description || undefined,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        allDay,
        location: location || undefined,
        eventType,
        meetingUrl: meetingUrl || undefined,
        projectId: selectedProjectId,
        issueId,
        attendeeIds: [],
        isRequired: eventType === "meeting" ? isRequired : undefined,
      });

      showSuccess("Event created successfully");
      onClose();
    } catch (error) {
      showError(error, "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ui-border-primary dark:border-ui-border-primary-dark">
          <h2 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark">Create Event</h2>
          <button
            onClick={onClose}
            aria-label="Close create event modal"
            className="p-2 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark rounded-lg"
          >
            <X className="w-5 h-5 text-ui-text-secondary dark:text-ui-text-secondary-dark" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
              placeholder="Team standup, Client call, etc."
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              Event Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["meeting", "deadline", "timeblock", "personal"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${
                    eventType === type
                      ? "bg-brand-600 text-white"
                      : "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={allDay}
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={allDay}
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark disabled:opacity-50"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">All day event</span>
            </label>
          </div>

          {/* Required Attendance (only for meetings) */}
          {eventType === "meeting" && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                  Required attendance (track who attends)
                </span>
              </label>
              {isRequired && (
                <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1 ml-6">
                  Admins can mark who attended, was tardy, or missed this meeting
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
              placeholder="Add notes, agenda, or details..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
              placeholder="Office, Zoom, Google Meet, etc."
            />
          </div>

          {/* Meeting URL */}
          {eventType === "meeting" && (
            <div>
              <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Meeting Link
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}

          {/* Link to Project */}
          <div>
            <label className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
              Link to Project (optional)
            </label>
            <select
              value={selectedProjectId || ""}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value ? (e.target.value as Id<"projects">) : undefined,
                )
              }
              className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
            >
              <option value="">No project</option>
              {projects?.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark rounded-md hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
