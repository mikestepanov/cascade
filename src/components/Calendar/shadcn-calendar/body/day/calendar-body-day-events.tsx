import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { DOT_COLOR_CLASSES, EventColor } from "../../../calendar-colors";
import { useCalendarContext } from "../../calendar-context";

export function CalendarBodyDayEvents(): React.ReactElement {
  const { events, date, onEventClick } = useCalendarContext();
  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  if (!dayEvents.length) {
    return <div className="p-2 text-ui-text-secondary">No events today...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium p-2 pb-0 font-heading">Events</p>
      <div className="flex flex-col gap-2">
        {dayEvents.map((event) => (
          <button
            type="button"
            key={event.id}
            className="flex items-center gap-2 px-2 cursor-pointer text-left"
            onClick={() => onEventClick(event)}
          >
            <div className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", DOT_COLOR_CLASSES[event.color as EventColor])} />
              <p className="text-ui-text-secondary text-sm font-medium">{event.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
