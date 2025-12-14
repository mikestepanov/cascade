import type { EntryMode, TimeEntryFormState } from "./useTimeEntryForm";

/** Default end of workday hour for duration-based entries (5 PM) */
const DEFAULT_WORKDAY_END_HOUR = 17;

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validate context (project/issue or description/activity)
 */
export function validateContext(hasValidContext: boolean): ValidationResult {
  if (!hasValidContext) {
    return {
      isValid: false,
      errorMessage: "Please select a project and issue, or fill in description and activity",
    };
  }
  return { isValid: true };
}

/**
 * Validate date field
 */
export function validateDate(date: string): ValidationResult {
  if (!date) {
    return { isValid: false, errorMessage: "Please select a date" };
  }
  return { isValid: true };
}

/**
 * Validate duration for duration mode
 */
export function validateDuration(
  entryMode: EntryMode,
  effectiveDuration: number,
): ValidationResult {
  if (entryMode === "duration" && effectiveDuration <= 0) {
    return { isValid: false, errorMessage: "Please enter a valid duration" };
  }
  return { isValid: true };
}

/**
 * Validate time range fields
 */
export function validateTimeRange(
  entryMode: EntryMode,
  startTime: string,
  endTime: string,
  timeRangeDuration: number,
): ValidationResult {
  if (entryMode !== "timeRange") {
    return { isValid: true };
  }

  if (!(startTime && endTime)) {
    return { isValid: false, errorMessage: "Please fill in start time and end time" };
  }

  if (timeRangeDuration <= 0) {
    return { isValid: false, errorMessage: "End time must be after start time" };
  }

  return { isValid: true };
}

/**
 * Run all validations for log time submission
 */
export function validateLogTimeSubmission(
  state: TimeEntryFormState,
  hasValidContext: boolean,
  effectiveDuration: number,
): ValidationResult {
  // Check context
  const contextResult = validateContext(hasValidContext);
  if (!contextResult.isValid) return contextResult;

  // Check date
  const dateResult = validateDate(state.date);
  if (!dateResult.isValid) return dateResult;

  // Check duration (duration mode)
  const durationResult = validateDuration(state.entryMode, effectiveDuration);
  if (!durationResult.isValid) return durationResult;

  // Check time range (timeRange mode)
  const timeRangeResult = validateTimeRange(
    state.entryMode,
    state.startTime,
    state.endTime,
    state.timeRangeDuration,
  );
  if (!timeRangeResult.isValid) return timeRangeResult;

  return { isValid: true };
}

/**
 * Calculate entry times based on mode
 */
export function calculateEntryTimes(
  state: TimeEntryFormState,
  effectiveDuration: number,
): { startTime: number; endTime: number } {
  if (state.entryMode === "duration") {
    const dateObj = new Date(state.date);
    const now = new Date();
    // Create a new Date for end time to avoid mutating dateObj
    const endDate =
      dateObj.toDateString() === now.toDateString()
        ? now
        : new Date(new Date(dateObj).setHours(DEFAULT_WORKDAY_END_HOUR, 0, 0, 0));
    const entryEndTime = endDate.getTime();
    const entryStartTime = entryEndTime - effectiveDuration * 1000;
    return { startTime: entryStartTime, endTime: entryEndTime };
  }

  // timeRange mode
  return {
    startTime: new Date(`${state.date}T${state.startTime}`).getTime(),
    endTime: new Date(`${state.date}T${state.endTime}`).getTime(),
  };
}
