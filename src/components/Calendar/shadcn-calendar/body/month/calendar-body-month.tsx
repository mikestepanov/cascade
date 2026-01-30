import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCalendarContext } from "../../calendar-context";
import { CalendarEvent } from "../../calendar-event";

export function CalendarBodyMonth(): React.ReactElement {
  const { date, events, setDate, setMode } = useCalendarContext();

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const today = new Date();

  const visibleEvents = events.filter(
    (event) =>
      isWithinInterval(event.start, {
        start: calendarStart,
        end: calendarEnd,
      }) || isWithinInterval(event.end, { start: calendarStart, end: calendarEnd }),
  );

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="hidden md:grid grid-cols-7 border-ui-border divide-x divide-ui-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-ui-text-secondary border-b border-ui-border"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthStart.toISOString()}
          className="grid md:grid-cols-7 flex-grow overflow-y-auto relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeInOut",
          }}
        >
          {calendarDays.map((day) => {
            const dayEvents = visibleEvents.filter((event) => isSameDay(event.start, day));
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, date);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative flex flex-col border-b border-r border-ui-border p-2 min-h-[120px] cursor-pointer hover:bg-ui-bg-tertiary/30 transition-colors",
                  !isCurrentMonth && "bg-ui-bg-tertiary/50 hidden md:flex",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setDate(day);
                  setMode("day");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDate(day);
                    setMode("day");
                  }
                }}
              >
                <div
                  className={cn(
                    "text-sm font-medium w-fit p-1 flex flex-col items-center justify-center rounded-full aspect-square",
                    isToday && "bg-brand text-brand-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>
                <AnimatePresence mode="wait">
                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        className="relative h-auto"
                        month
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <motion.div
                        key={`more-${day.toISOString()}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-ui-text-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDate(day);
                          setMode("day");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setDate(day);
                            setMode("day");
                          }
                        }}
                      >
                        +{dayEvents.length - 3} more
                      </motion.div>
                    )}
                  </div>
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
