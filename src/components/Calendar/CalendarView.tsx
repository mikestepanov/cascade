import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailsModal } from "./EventDetailsModal";

type ViewMode = "week" | "month";

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleToday}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200"
            >
              Today
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={handlePrevious} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 dark:text-gray-300" />
              </button>
              <button onClick={handleNext} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-gray-300" />
              </button>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {getHeaderText()}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md flex-1 sm:flex-initial">
              <button
                onClick={() => setViewMode("week")}
                className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
                  viewMode === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } rounded-l-md`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 text-xs sm:text-sm ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } rounded-r-md border-l border-gray-300 dark:border-gray-600`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
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
      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} defaultDate={currentDate} />
      )}

      {selectedEventId && (
        <EventDetailsModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
      )}
    </div>
  );
}

// Week View Component
function WeekView({
  startDate,
  events,
  onEventClick,
}: {
  startDate: Date;
  events: any[];
  onEventClick: (id: Id<"calendarEvents">) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-1 sm:p-2 text-xs font-medium text-gray-500 dark:text-gray-400" />
        {days.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={idx} className="p-1 sm:p-2 text-center border-l border-gray-200 dark:border-gray-700">
              <div className={`text-xs font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                <span className="hidden sm:inline">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className="sm:hidden">{day.toLocaleDateString("en-US", { weekday: "short" })[0]}</span>
              </div>
              <div
                className={`text-base sm:text-xl font-semibold ${
                  isToday
                    ? "bg-blue-600 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-sm sm:text-xl"
                    : "text-gray-900 dark:text-gray-100"
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
          <div className="border-r border-gray-200 dark:border-gray-700">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 sm:h-16 border-b border-gray-200 dark:border-gray-700 px-1 sm:px-2 py-1 text-xs text-gray-500 dark:text-gray-400"
              >
                <span className="hidden sm:inline">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
                <span className="sm:hidden">
                  {hour === 0
                    ? "12a"
                    : hour < 12
                      ? `${hour}a`
                      : hour === 12
                        ? "12p"
                        : `${hour - 12}p`}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="border-r border-gray-200 dark:border-gray-700 relative">
              {hours.map((hour) => (
                <div key={hour} className="h-12 sm:h-16 border-b border-gray-200 dark:border-gray-700" />
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
    </div>
  );
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date;
  events: any[];
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
    <div className="flex flex-col h-full">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 first:border-l-0"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), day));

          return (
            <div
              key={idx}
              className={`border-l border-b border-gray-200 dark:border-gray-700 first:border-l-0 p-1 sm:p-2 min-h-[80px] sm:min-h-[100px] ${
                !isCurrentMonth ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
              }`}
            >
              <div
                className={`text-xs sm:text-sm font-medium mb-1 ${
                  isToday
                    ? "bg-blue-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs"
                    : isCurrentMonth
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
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
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-0.5 sm:px-1">+{dayEvents.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  switch (eventType) {
    case "meeting":
      return "#3B82F6"; // Blue
    case "deadline":
      return "#EF4444"; // Red
    case "timeblock":
      return "#10B981"; // Green
    case "personal":
      return "#8B5CF6"; // Purple
    default:
      return "#6B7280"; // Gray
  }
}
