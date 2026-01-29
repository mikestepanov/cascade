import type { Doc, Id } from "@convex/_generated/dataModel";
import type { NixeloCalendarEvent } from "./calendar-types";

const EVENT_TYPE_COLOR: Record<string, string> = {
  meeting: "blue",
  deadline: "red",
  timeblock: "emerald",
  personal: "indigo",
};

export function toCalendarEvent(doc: Doc<"calendarEvents">): NixeloCalendarEvent {
  return {
    id: doc._id,
    convexId: doc._id,
    title: doc.title,
    start: new Date(doc.startTime),
    end: new Date(doc.endTime),
    color: EVENT_TYPE_COLOR[doc.eventType],
    eventType: doc.eventType,
  };
}

export function extractConvexId(event: NixeloCalendarEvent): Id<"calendarEvents"> {
  return event.convexId as Id<"calendarEvents">;
}
