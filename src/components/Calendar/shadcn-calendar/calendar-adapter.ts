import type { Doc, Id } from "@convex/_generated/dataModel";
import type { NixeloCalendarEvent } from "./calendar-types";

type EventColor = NonNullable<Doc<"calendarEvents">["color"]>;

const EVENT_TYPE_DEFAULT_COLOR: Record<string, EventColor> = {
  meeting: "blue",
  deadline: "red",
  timeblock: "green",
  personal: "purple",
};

export function toCalendarEvent(doc: Doc<"calendarEvents">): NixeloCalendarEvent {
  return {
    id: doc._id,
    convexId: doc._id,
    title: doc.title,
    start: new Date(doc.startTime),
    end: new Date(doc.endTime),
    color: doc.color ?? EVENT_TYPE_DEFAULT_COLOR[doc.eventType] ?? "blue",
    eventType: doc.eventType,
  };
}

export function extractConvexId(event: NixeloCalendarEvent): Id<"calendarEvents"> {
  return event.convexId as Id<"calendarEvents">;
}
