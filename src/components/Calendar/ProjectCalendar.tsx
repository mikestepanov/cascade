import { CalendarView } from "./CalendarView";

interface ProjectCalendarProps {
  projectKey: string;
}

/**
 * Project-specific calendar view
 * Wraps the unified CalendarView.
 * TODO: Pass projectKey filter to CalendarView once supported by backend
 */
export function ProjectCalendar({ projectKey }: ProjectCalendarProps) {
  // eslint-disable-next-line no-console
  console.log("Viewing calendar for project:", projectKey);
  return <CalendarView />;
}
