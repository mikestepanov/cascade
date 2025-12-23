import { CalendarView } from "./CalendarView";

interface ProjectCalendarProps {
  projectKey: string;
}

/**
 * Project-specific calendar view
 * Wraps the unified CalendarView.
 * TODO: Pass projectKey filter to CalendarView once supported by backend
 */
export function ProjectCalendar({ projectKey: _projectKey }: ProjectCalendarProps) {
  return <CalendarView />;
}
