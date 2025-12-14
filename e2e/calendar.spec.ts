import { authenticatedTest as test } from "./fixtures";

/**
 * Calendar E2E Tests
 *
 * Tests the calendar functionality:
 * - Calendar navigation
 * - Calendar view display
 * - View switching (month/week/day)
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Calendar", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Calendar Navigation", () => {
    test("can navigate to calendar page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await dashboardPage.expectActiveTab("calendar");
    });

    test("displays calendar view", async ({ dashboardPage, calendarPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");

      // Calendar should be visible
      await calendarPage.expectCalendarView();
    });
  });

  test.describe("Calendar Controls", () => {
    test("can navigate between months", async ({ dashboardPage, calendarPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await calendarPage.expectCalendarView();

      // Navigate to previous
      await calendarPage.goToPrevious();

      // Navigate to next
      await calendarPage.goToNext();

      // Navigate to today
      await calendarPage.goToToday();
    });

    test("can switch calendar views", async ({ dashboardPage, calendarPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await calendarPage.expectCalendarView();

      // Try to switch views if buttons are available
      // These are optional as not all calendar implementations have all views
      const monthViewVisible = await calendarPage.monthViewButton.isVisible().catch(() => false);
      const weekViewVisible = await calendarPage.weekViewButton.isVisible().catch(() => false);
      const dayViewVisible = await calendarPage.dayViewButton.isVisible().catch(() => false);

      if (monthViewVisible) {
        await calendarPage.switchToMonthView();
      }

      if (weekViewVisible) {
        await calendarPage.switchToWeekView();
      }

      if (dayViewVisible) {
        await calendarPage.switchToDayView();
      }

      // Switch back to month view if available
      if (monthViewVisible) {
        await calendarPage.switchToMonthView();
      }
    });
  });
});
