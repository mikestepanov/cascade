export type ManualEntryMode = "duration" | "timeRange";

/** Default end of workday hour for duration-based entries (5 PM) */
const DEFAULT_WORKDAY_END_HOUR = 17;

export interface ManualEntryFormValues {
  date: string;
  startTime: string;
  endTime: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validate manual time entry form
 */
export function validateManualTimeEntry(
  values: ManualEntryFormValues,
  entryMode: ManualEntryMode,
  durationSeconds: number,
  timeRangeDuration: number,
): ValidationResult {
  const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;

  if (!values.date) {
    return { isValid: false, errorMessage: "Please select a date" };
  }

  if (entryMode === "duration" && effectiveDuration <= 0) {
    return { isValid: false, errorMessage: "Please enter a valid duration" };
  }

  if (entryMode === "timeRange") {
    if (!(values.startTime && values.endTime)) {
      return { isValid: false, errorMessage: "Please fill in start time and end time" };
    }
    if (timeRangeDuration <= 0) {
      return { isValid: false, errorMessage: "End time must be after start time" };
    }
  }

  return { isValid: true };
}

/**
 * Calculate entry times based on mode
 */
export function calculateManualEntryTimes(
  values: ManualEntryFormValues,
  entryMode: ManualEntryMode,
  effectiveDuration: number,
): { startTimeMs: number; endTimeMs: number } {
  if (entryMode === "duration") {
    const dateObj = new Date(values.date);
    const now = new Date();
    // Create a new Date for end time to avoid mutating dateObj
    const endDate =
      dateObj.toDateString() === now.toDateString()
        ? now
        : new Date(new Date(dateObj).setHours(DEFAULT_WORKDAY_END_HOUR, 0, 0, 0));
    const endTimeMs = endDate.getTime();
    const startTimeMs = endTimeMs - effectiveDuration * 1000;
    return { startTimeMs, endTimeMs };
  }

  // timeRange mode
  const start = new Date(`${values.date}T${values.startTime}`);
  const end = new Date(`${values.date}T${values.endTime}`);
  return { startTimeMs: start.getTime(), endTimeMs: end.getTime() };
}
