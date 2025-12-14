import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { z } from "zod";
import { FormInput, FormTextarea, useAppForm } from "@/lib/form";
import { Calendar, Clock, LinkIcon, MapPin } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/ShadcnSelect";

// =============================================================================
// Schema
// =============================================================================

const eventTypes = ["meeting", "deadline", "timeblock", "personal"] as const;

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Date is required"),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean(),
  eventType: z.enum(eventTypes),
  location: z.string().optional(),
  meetingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isRequired: z.boolean(),
});

// =============================================================================
// Component
// =============================================================================

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

export function CreateEventModal({
  open,
  onOpenChange,
  defaultDate = new Date(),
  projectId,
  issueId,
}: CreateEventModalProps) {
  const createEvent = useMutation(api.calendarEvents.create);
  const projects = useQuery(api.workspaces.list, {});

  // Project selection (uses Radix Select, kept outside form)
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | undefined>(projectId);

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultDate.toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      eventType: "meeting" as const,
      location: "",
      meetingUrl: "",
      isRequired: false,
    },
    validators: { onChange: createEventSchema },
    onSubmit: async ({ value }) => {
      try {
        // Parse start and end times
        const [startHour, startMinute] = value.startTime.split(":").map(Number);
        const [endHour, endMinute] = value.endTime.split(":").map(Number);

        const startDateTime = new Date(value.startDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(value.startDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        await createEvent({
          title: value.title,
          description: value.description || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          allDay: value.allDay,
          location: value.location || undefined,
          eventType: value.eventType,
          meetingUrl: value.meetingUrl || undefined,
          projectId: selectedProjectId,
          issueId,
          attendeeIds: [],
          isRequired: value.eventType === "meeting" ? value.isRequired : undefined,
        });

        showSuccess("Event created successfully");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create event");
      }
    },
  });

  const eventType = form.useStore((state) => state.values.eventType);
  const allDay = form.useStore((state) => state.values.allDay);
  const isRequired = form.useStore((state) => state.values.isRequired);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Flex direction="column" gap="lg" className="p-6">
            {/* Title */}
            <form.Field name="title">
              {(field) => (
                <FormInput
                  field={field}
                  label="Event Title *"
                  placeholder="Team standup, Client call, etc."
                  required
                />
              )}
            </form.Field>

            {/* Event Type */}
            <div>
              <div className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1">
                Event Type
              </div>
              <div className="grid grid-cols-4 gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => form.setFieldValue("eventType", type)}
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
                <form.Field name="startDate">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="event-date"
                        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                      >
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date *
                      </label>
                      <input
                        id="event-date"
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        required
                        className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <div>
                <form.Field name="startTime">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="event-start-time"
                        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                      >
                        <Clock className="w-4 h-4 inline mr-1" />
                        Start Time
                      </label>
                      <input
                        id="event-start-time"
                        type="time"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={allDay}
                        className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark disabled:opacity-50"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <div>
                <form.Field name="endTime">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="event-end-time"
                        className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                      >
                        End Time
                      </label>
                      <input
                        id="event-end-time"
                        type="time"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={allDay}
                        className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark disabled:opacity-50"
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            {/* All Day Toggle */}
            <form.Field name="allDay">
              {(field) => (
                <div>
                  <label>
                    <Flex gap="sm" align="center" className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                        All day event
                      </span>
                    </Flex>
                  </label>
                </div>
              )}
            </form.Field>

            {/* Required Attendance (only for meetings) */}
            {eventType === "meeting" && (
              <form.Field name="isRequired">
                {(field) => (
                  <div>
                    <label>
                      <Flex gap="sm" align="center" className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-sm text-ui-text-primary dark:text-ui-text-primary-dark">
                          Required attendance (track who attends)
                        </span>
                      </Flex>
                    </label>
                    {isRequired && (
                      <p className="text-xs text-ui-text-secondary dark:text-ui-text-secondary-dark mt-1 ml-6">
                        Admins can mark who attended, was tardy, or missed this meeting
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            )}

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <FormTextarea
                  field={field}
                  label="Description"
                  rows={3}
                  placeholder="Add notes, agenda, or details..."
                />
              )}
            </form.Field>

            {/* Location */}
            <form.Field name="location">
              {(field) => (
                <div>
                  <label
                    htmlFor="event-location"
                    className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                  >
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    id="event-location"
                    type="text"
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                    placeholder="Office, Zoom, Google Meet, etc."
                  />
                </div>
              )}
            </form.Field>

            {/* Meeting URL */}
            {eventType === "meeting" && (
              <form.Field name="meetingUrl">
                {(field) => (
                  <div>
                    <label
                      htmlFor="event-meeting-url"
                      className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
                    >
                      <LinkIcon className="w-4 h-4 inline mr-1" />
                      Meeting Link
                    </label>
                    <input
                      id="event-meeting-url"
                      type="url"
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                )}
              </form.Field>
            )}

            {/* Link to Project */}
            <div>
              <label
                htmlFor="event-project"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
              >
                Link to Workspace (optional)
              </label>
              <Select
                value={selectedProjectId || "none"}
                onValueChange={(value) =>
                  setSelectedProjectId(value === "none" ? undefined : (value as Id<"projects">))
                }
              >
                <SelectTrigger className="w-full px-3 py-2 border border-ui-border-primary dark:border-ui-border-primary-dark rounded-md bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark">
                  <SelectValue placeholder="No workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workspace</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name} ({project.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <DialogFooter className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <>
                    <Button onClick={() => onOpenChange(false)} variant="secondary">
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Event"}
                    </Button>
                  </>
                )}
              </form.Subscribe>
            </DialogFooter>
          </Flex>
        </form>
      </DialogContent>
    </Dialog>
  );
}
