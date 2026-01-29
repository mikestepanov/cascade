import { isSameDay } from "date-fns";
import { useCalendarContext } from "../../calendar-context";

export function CalendarBodyDayEvents(): React.ReactElement {
  const { events, date, onEventClick } = useCalendarContext();
  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  if (!dayEvents.length) {
    return <div className="p-2 text-muted-foreground">No events today...</div>;
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
              <div className={`size-2 rounded-full bg-${event.color}-500`} />
              <p className="text-muted-foreground text-sm font-medium">{event.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
