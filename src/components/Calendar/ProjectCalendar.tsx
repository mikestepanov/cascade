import type { Id } from "@convex/_generated/dataModel";
import { CalendarView } from "./CalendarView";

interface ProjectCalendarProps {
  projectId: Id<"projects">;
}

/**
 * Project-specific calendar view
 * Wraps the unified CalendarView.
 * TODO: Pass projectId filter to CalendarView once supported by backend
 */
export function ProjectCalendar({ projectId: _projectId }: ProjectCalendarProps) {
  return <CalendarView />;
}
