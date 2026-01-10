import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  formatDate,
  formatDateCustom,
  formatDateForInput,
  formatDateTime,
  formatHours,
  formatRelativeTime,
  getTodayString,
  isFuture,
  isPast,
} from "./dates";

describe("dates utility functions", () => {
  describe("formatRelativeTime", () => {
    beforeEach(() => {
      // Mock current time to 2026-01-15 12:00:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for timestamps within the last minute', () => {
      const timestamp = new Date("2026-01-15T11:59:30").getTime();
      expect(formatRelativeTime(timestamp)).toBe("Just now");
    });

    it("should return minutes ago for timestamps within the last hour", () => {
      const timestamp = new Date("2026-01-15T11:30:00").getTime();
      expect(formatRelativeTime(timestamp)).toBe("30m ago");
    });

    it("should return hours ago for timestamps within the last 24 hours", () => {
      const timestamp = new Date("2026-01-15T09:00:00").getTime();
      expect(formatRelativeTime(timestamp)).toBe("3h ago");
    });

    it("should return days ago for timestamps within the last week", () => {
      const timestamp = new Date("2026-01-12T12:00:00").getTime();
      expect(formatRelativeTime(timestamp)).toBe("3d ago");
    });

    it("should return weeks ago for timestamps within the last month", () => {
      const timestamp = new Date("2026-01-01T12:00:00").getTime();
      expect(formatRelativeTime(timestamp)).toBe("2w ago");
    });

    it("should return absolute date for timestamps older than 30 days", () => {
      const timestamp = new Date("2024-12-01T12:00:00").getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toMatch(/12\/1\/2024|1\/12\/2024/); // Different locales
    });

    it("should handle edge case of exactly 1 hour ago", () => {
      const timestamp = new Date("2026-01-15T11:00:00").getTime();
      expect(formatRelativeTime(timestamp)).toBe("1h ago");
    });
  });

  describe("formatDate", () => {
    it("should format timestamp as locale date string", () => {
      const timestamp = new Date("2026-01-15T12:00:00").getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/1\/15\/2026|15\/1\/2026/); // Different locales
    });

    it("should handle timestamp at midnight", () => {
      const timestamp = new Date("2026-01-15T00:00:00").getTime();
      const result = formatDate(timestamp);
      expect(result).toMatch(/1\/15\/2026|15\/1\/2026/);
    });
  });

  describe("formatDateTime", () => {
    it("should format timestamp as locale date and time string", () => {
      const timestamp = new Date("2026-01-15T14:30:00").getTime();
      const result = formatDateTime(timestamp);
      expect(result).toContain("2026");
      expect(result.length).toBeGreaterThan(10); // Should include time
    });
  });

  describe("formatDateForInput", () => {
    it("should format date as YYYY-MM-DD for HTML inputs", () => {
      const date = new Date("2026-01-15T12:00:00");
      expect(formatDateForInput(date)).toBe("2026-01-15");
    });

    it("should format date with single digit month and day correctly", () => {
      const date = new Date("2026-03-05T12:00:00");
      expect(formatDateForInput(date)).toBe("2026-03-05");
    });

    it("should use current date when no argument provided", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));

      expect(formatDateForInput()).toBe("2026-01-15");

      vi.useRealTimers();
    });
  });

  describe("getTodayString", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));

      expect(getTodayString()).toBe("2026-01-15");

      vi.useRealTimers();
    });
  });

  describe("formatDateCustom", () => {
    it("should format date with custom options", () => {
      const timestamp = new Date("2026-01-15T12:00:00").getTime();
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };

      expect(formatDateCustom(timestamp, options)).toBe("January 15, 2026");
    });

    it("should format date with short month and weekday", () => {
      const timestamp = new Date("2026-01-15T12:00:00").getTime();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };

      expect(formatDateCustom(timestamp, options)).toBe("Wed, Jan 15");
    });
  });

  describe("daysBetween", () => {
    it("should calculate days between two timestamps", () => {
      const start = new Date("2026-01-01T00:00:00").getTime();
      const end = new Date("2026-01-15T00:00:00").getTime();

      expect(daysBetween(start, end)).toBe(14);
    });

    it("should return positive number regardless of order", () => {
      const start = new Date("2026-01-15T00:00:00").getTime();
      const end = new Date("2026-01-01T00:00:00").getTime();

      expect(daysBetween(start, end)).toBe(14);
    });

    it("should return 0 for same day", () => {
      const start = new Date("2026-01-15T08:00:00").getTime();
      const end = new Date("2026-01-15T18:00:00").getTime();

      expect(daysBetween(start, end)).toBe(0);
    });

    it("should handle partial days by flooring", () => {
      const start = new Date("2026-01-01T00:00:00").getTime();
      const end = new Date("2026-01-02T12:00:00").getTime();

      expect(daysBetween(start, end)).toBe(1);
    });
  });

  describe("addDays", () => {
    it("should add positive days to a date", () => {
      const date = new Date("2026-01-15T12:00:00");
      const result = addDays(date, 5);

      expect(formatDateForInput(result)).toBe("2026-01-20");
    });

    it("should subtract days with negative number", () => {
      const date = new Date("2026-01-15T12:00:00");
      const result = addDays(date, -5);

      expect(formatDateForInput(result)).toBe("2026-01-10");
    });

    it("should handle month boundaries", () => {
      const date = new Date("2026-01-30T12:00:00");
      const result = addDays(date, 5);

      expect(formatDateForInput(result)).toBe("2026-02-04");
    });

    it("should handle year boundaries", () => {
      const date = new Date("2024-12-30T12:00:00");
      const result = addDays(date, 5);

      expect(formatDateForInput(result)).toBe("2026-01-04");
    });

    it("should not mutate original date", () => {
      const date = new Date("2026-01-15T12:00:00");
      const original = date.getTime();

      addDays(date, 5);

      expect(date.getTime()).toBe(original);
    });
  });

  describe("isPast", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for past timestamps", () => {
      const timestamp = new Date("2026-01-14T12:00:00").getTime();
      expect(isPast(timestamp)).toBe(true);
    });

    it("should return false for future timestamps", () => {
      const timestamp = new Date("2026-01-16T12:00:00").getTime();
      expect(isPast(timestamp)).toBe(false);
    });

    it("should return false for current timestamp", () => {
      const timestamp = new Date("2026-01-15T12:00:00").getTime();
      expect(isPast(timestamp)).toBe(false);
    });
  });

  describe("isFuture", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for future timestamps", () => {
      const timestamp = new Date("2026-01-16T12:00:00").getTime();
      expect(isFuture(timestamp)).toBe(true);
    });

    it("should return false for past timestamps", () => {
      const timestamp = new Date("2026-01-14T12:00:00").getTime();
      expect(isFuture(timestamp)).toBe(false);
    });

    it("should return false for current timestamp", () => {
      const timestamp = new Date("2026-01-15T12:00:00").getTime();
      expect(isFuture(timestamp)).toBe(false);
    });
  });

  describe("formatHours", () => {
    it("should format hours less than 1 as minutes", () => {
      expect(formatHours(0.5)).toBe("30m");
      expect(formatHours(0.25)).toBe("15m");
      expect(formatHours(0.75)).toBe("45m");
    });

    it("should format hours between 1 and 8 with hours and minutes", () => {
      expect(formatHours(1.5)).toBe("1h 30m");
      expect(formatHours(2.25)).toBe("2h 15m");
      expect(formatHours(5.75)).toBe("5h 45m");
    });

    it("should format whole hours without minutes", () => {
      expect(formatHours(1)).toBe("1h");
      expect(formatHours(5)).toBe("5h");
    });

    it("should format hours >= 8 as hours only", () => {
      expect(formatHours(8)).toBe("8h");
      expect(formatHours(10)).toBe("10h");
      expect(formatHours(40)).toBe("40h");
    });

    it("should handle edge case of exactly 1 hour", () => {
      expect(formatHours(1.0)).toBe("1h");
    });

    it("should round minutes properly", () => {
      expect(formatHours(1.51)).toBe("1h 31m");
      expect(formatHours(1.49)).toBe("1h 29m");
    });

    it("should handle very small values", () => {
      expect(formatHours(0.1)).toBe("6m");
      expect(formatHours(0.01)).toBe("1m");
    });
  });
});
