import { useQuery } from "convex/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "@/lib/icons";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailsModal } from "./EventDetailsModal";

type ViewMode = "week" | "month";

/**
 * Format hour for display (e.g., "12 AM", "1 PM")
 */
function formatHour(hour: number, isMobile: boolean): string {
  if (isMobile) {
    // Mobile: Compact format
    if (hour === 0) return "12a";
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return "12p";
    return `${hour - 12}p`;
  }
  // Desktop: Full format
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<Id<"calendarEvents"> | null>(null);

  // Calculate date range based on view mode
  const { startDate, endDate } = getDateRange(currentDate, viewMode);

  // Fetch events for the current range
  const events = useQuery(api.calendarEvents.listByDateRange, {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
  });

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderText = () => {
    if (viewMode === "week") {
      const endOfWeek = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
      const endMonth = endOfWeek.toLocaleDateString("en-US", { month: "short" });
      const year = startDate.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDate.getDate()}-${endOfWeek.getDate()}, ${year}`;
      } else {
        return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
      }
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  return (
    <Flex direction="column" className="h-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark">
      {/* Header */}
      <div className="border-b border-ui-border-primary dark:border-ui-border-primary-dark p-3 sm:p-4">
        <Flex
          direction="column"
          gap="md"
          className="sm:flex-row items-stretch sm:items-center justify-between"
        >
          <Flex gap="lg" align="center" className="gap-2 sm:gap-4">
            <Button
              onClick={handleToday}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Today
            </Button>
            <Flex gap="sm" align="center" className="gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-1 hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 dark:text-ui-text-primary-dark" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark rounded"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-ui-text-primary-dark" />
              </button>
            </Flex>
            <h2 className="text-base sm:text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark truncate">
              {getHeaderText()}
            </h2>
          </Flex>

          <Flex gap="md" align="center" className="gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              variant="brand"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <ToggleGroupItem value="week" className="flex-1 sm:flex-initial">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" className="flex-1 sm:flex-initial">
                Month
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === "week" ? (
          <WeekView startDate={startDate} events={events || []} onEventClick={setSelectedEventId} />
        ) : (
          <MonthView
            currentDate={currentDate}
            events={events || []}
            onEventClick={setSelectedEventId}
          />
        )}
      </div>

      {/* Modals */}
      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        defaultDate={currentDate}
      />

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          open={true}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
        />
      )}
    </Flex>
  );
}

// Week View Component
function WeekView({
  startDate,
  events,
  onEventClick,
}: {
  startDate: Date;
  events: Doc<"calendarEvents">[];
  onEventClick: (id: Id<"calendarEvents">) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Flex direction="column" className="h-full">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
        <div className="p-1 sm:p-2 text-xs font-medium text-ui-text-tertiary dark:text-ui-text-tertiary-dark" />
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.getTime()}
              className="p-1 sm:p-2 text-center border-l border-ui-border-primary dark:border-ui-border-primary-dark"
            >
              <div
                className={`text-xs font-medium ${isToday ? "text-brand-600 dark:text-brand-400" : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark"}`}
              >
                <span className="hidden sm:inline">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="sm:hidden">
                  {day.toLocaleDateString("en-US", { weekday: "short" })[0]}
                </span>
              </div>
              <div
                className={`text-base sm:text-xl font-semibold ${
                  isToday
                    ? "bg-brand-600 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-sm sm:text-xl"
                    : "text-ui-text-primary dark:text-ui-text-primary-dark"
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="border-r border-ui-border-primary dark:border-ui-border-primary-dark">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 sm:h-16 border-b border-ui-border-primary dark:border-ui-border-primary-dark px-1 sm:px-2 py-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
              >
                <span className="hidden sm:inline">{formatHour(hour, false)}</span>
                <span className="sm:hidden">{formatHour(hour, true)}</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day) => (
            <div
              key={day.getTime()}
              className="border-r border-ui-border-primary dark:border-ui-border-primary-dark relative"
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 sm:h-16 border-b border-ui-border-primary dark:border-ui-border-primary-dark"
                />
              ))}

              {/* Events for this day */}
              {events
                .filter((event) => isSameDay(new Date(event.startTime), day))
                .map((event) => {
                  const startHour = new Date(event.startTime).getHours();
                  const startMinute = new Date(event.startTime).getMinutes();
                  const duration = (event.endTime - event.startTime) / (1000 * 60); // minutes

                  const top = (startHour + startMinute / 60) * 48; // 48px per hour on mobile, 64px on desktop
                  const height = (duration / 60) * 48;

                  return (
                    <button
                      type="button"
                      key={event._id}
                      onClick={() => onEventClick(event._id)}
                      className="absolute left-0 right-0 mx-0.5 sm:mx-1 px-1 sm:px-2 py-0.5 sm:py-1 text-xs rounded text-left overflow-hidden hover:opacity-80 transition-opacity"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: getEventColor(event.eventType),
                      }}
                    >
                      <div className="font-medium text-white truncate text-xs">{event.title}</div>
                      {height > 30 && (
                        <div className="text-white text-opacity-90 truncate text-xs hidden sm:block">
                          {formatTime(event.startTime)}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </Flex>
  );
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date;
  events: Doc<"calendarEvents">[];
  onEventClick: (id: Id<"calendarEvents">) => void;
}) {
  // Get first day of month
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const _lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get start of calendar grid (previous month's days if needed)
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - startDay.getDay()); // Start on Sunday

  // Generate 42 days (6 weeks)
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(startDay);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <Flex direction="column" className="h-full">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, _idx) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-center text-xs font-medium text-ui-text-tertiary dark:text-ui-text-tertiary-dark border-l border-ui-border-primary dark:border-ui-border-primary-dark first:border-l-0"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), day));

          return (
            <div
              key={day.getTime()}
              className={`border-l border-b border-ui-border-primary dark:border-ui-border-primary-dark first:border-l-0 p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] ${
                !isCurrentMonth
                  ? "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark"
                  : "bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
              }`}
            >
              <div
                className={`text-xs sm:text-sm font-medium mb-1 ${
                  isToday
                    ? "bg-brand-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs"
                    : isCurrentMonth
                      ? "text-ui-text-primary dark:text-ui-text-primary-dark"
                      : "text-ui-text-tertiary dark:text-ui-text-tertiary-dark"
                }`}
              >
                {day.getDate()}
              </div>

              <Flex direction="column" gap="xs" className="space-y-0.5 sm:space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    type="button"
                    key={event._id}
                    onClick={() => onEventClick(event._id)}
                    className="block w-full text-left px-0.5 sm:px-1 py-0.5 text-xs rounded truncate hover:opacity-80"
                    style={{
                      backgroundColor: getEventColor(event.eventType),
                      color: "white",
                    }}
                    title={`${formatTime(event.startTime)} ${event.title}`}
                  >
                    <span className="hidden sm:inline">{formatTime(event.startTime)} </span>
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark px-0.5 sm:px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </Flex>
            </div>
          );
        })}
      </div>
    </Flex>
  );
}

// Utility functions
function getDateRange(currentDate: Date, viewMode: ViewMode) {
  if (viewMode === "week") {
    // Start on Sunday
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    return { startDate, endDate };
  } else {
    // Month view
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    return { startDate, endDate };
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    meeting: "var(--color-event-meeting)",
    deadline: "var(--color-event-deadline)",
    timeblock: "var(--color-event-timeblock)",
    personal: "var(--color-event-personal)",
  };
  return colors[eventType] || "var(--color-event-default)";
}
