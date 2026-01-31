import { isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarEvent } from "../../calendar-event";
import { CalendarBodyHeader } from "../calendar-body-header";
import { hours } from "./calendar-body-margin-day-margin";

export function CalendarBodyDayContent({ date }: { date: Date }): React.ReactElement {
  const { events } = useCalendarContext();

  const dayEvents = events.filter((event) => isSameDay(event.start, date));
  const today = isToday(date);

  return (
    <div className={cn("flex flex-col flex-grow", today && "bg-brand/[0.03]")}>
      <CalendarBodyHeader date={date} />

      <div className="flex-1 relative">
        {hours.map((hour) => (
          <div key={hour} className="h-32 border-b border-ui-border group" />
        ))}

        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
