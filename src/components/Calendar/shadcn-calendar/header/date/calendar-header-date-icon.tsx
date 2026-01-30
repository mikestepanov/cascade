import { format } from "date-fns";
import { useCalendarContext } from "../../calendar-context";

export function CalendarHeaderDateIcon(): React.ReactElement {
  const { calendarIconIsToday, date: calendarDate } = useCalendarContext();
  const date = calendarIconIsToday ? new Date() : calendarDate;
  return (
    <div className="flex size-14 flex-col items-start overflow-hidden rounded-lg border">
      <p className="flex h-6 w-full items-center justify-center bg-brand text-center text-xs font-semibold text-brand-foreground uppercase">
        {format(date, "MMM")}
      </p>
      <p className="flex w-full items-center justify-center text-lg font-bold">
        {format(date, "dd")}
      </p>
    </div>
  );
}
