import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export function CalendarBodyHeader({
  date,
  onlyDay = false,
}: {
  date: Date;
  onlyDay?: boolean;
}): React.ReactElement {
  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex items-center justify-center gap-1 py-2 w-full sticky top-0 bg-ui-bg z-10 border-b border-ui-border">
      <span
        className={cn("text-xs font-medium", isToday ? "text-brand" : "text-ui-text-secondary")}
      >
        {format(date, "EEE")}
      </span>
      {!onlyDay && (
        <span
          className={cn(
            "text-xs font-medium",
            isToday ? "text-brand font-bold" : "text-ui-text",
          )}
        >
          {format(date, "dd")}
        </span>
      )}
    </div>
  );
}
