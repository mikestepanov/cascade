import type { Doc, Id } from "@convex/_generated/dataModel";
import type { NixeloCalendarEvent } from "./calendar-types";

export function toCalendarEvent(doc: Doc<"calendarEvents">): NixeloCalendarEvent {
  return {
    id: doc._id,
    convexId: doc._id,
    title: doc.title,
    start: new Date(doc.startTime),
    end: new Date(doc.endTime),
    color: doc.eventType,
    eventType: doc.eventType,
  };
}

export function extractConvexId(event: NixeloCalendarEvent): Id<"calendarEvents"> {
  return event.convexId as Id<"calendarEvents">;
}
