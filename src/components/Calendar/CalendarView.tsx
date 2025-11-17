import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{getHeaderText()}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } rounded-l-md`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } rounded-r-md border-l border-gray-300`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === "week" ? (
          <WeekView
            startDate={startDate}
            events={events || []}
            onEventClick={setSelectedEventId}
          />
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
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          defaultDate={currentDate}
        />
      )}

      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
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
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
        <div className="p-2 text-xs font-medium text-gray-500"></div>
        {days.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={idx} className="p-2 text-center border-l border-gray-200">
              <div className={`text-xs font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={`text-xl font-semibold ${
                  isToday
                    ? "bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                    : "text-gray-900"
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
          <div className="border-r border-gray-200">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 px-2 py-1 text-xs text-gray-500">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="border-r border-gray-200 relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-gray-200"
                />
              ))}

              {/* Events for this day */}
              {events
                .filter((event) => isSameDay(new Date(event.startTime), day))
                .map((event) => {
                  const startHour = new Date(event.startTime).getHours();
                  const startMinute = new Date(event.startTime).getMinutes();
                  const duration =
                    (event.endTime - event.startTime) / (1000 * 60); // minutes

                  const top = (startHour + startMinute / 60) * 64; // 64px per hour
                  const height = (duration / 60) * 64;

                  return (
                    <button
                      key={event._id}
                      onClick={() => onEventClick(event._id)}
                      className="absolute left-0 right-0 mx-1 px-2 py-1 text-xs rounded text-left overflow-hidden hover:opacity-80 transition-opacity"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: getEventColor(event.eventType),
                      }}
                    >
                      <div className="font-medium text-white truncate">{event.title}</div>
                      {height > 40 && (
                        <div className="text-white text-opacity-90 truncate">
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
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

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
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-l border-gray-200 first:border-l-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.startTime), day),
          );

          return (
            <div
              key={idx}
              className={`border-l border-b border-gray-200 first:border-l-0 p-2 min-h-[100px] ${
                !isCurrentMonth ? "bg-gray-50" : ""
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday
                    ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                    : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event._id}
                    onClick={() => onEventClick(event._id)}
                    className="block w-full text-left px-1 py-0.5 text-xs rounded truncate hover:opacity-80"
                    style={{
                      backgroundColor: getEventColor(event.eventType),
                      color: "white",
                    }}
                  >
                    {formatTime(event.startTime)} {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 3} more
                  </div>
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
