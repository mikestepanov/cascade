/**
 * Wait Helpers for E2E Tests
 *
 * Semantic wait functions that replace arbitrary timeouts with
 * meaningful waits for specific conditions.
 */

import type { Page } from "@playwright/test";

/**
 * Wait timeouts used across tests.
 * These are fallback maximums - prefer element-based waits.
 */
export const WAIT_TIMEOUTS = {
  /** Short wait for animations/transitions (300ms) */
  animation: 300,
  /** Wait for React hydration on cold starts */
  reactHydration: 500,
  /** Wait for form ready state (SignInForm/SignUpForm have 350ms delay) */
  formReady: 400,
  /** Wait for page navigation to settle */
  navigation: 1000,
  /** Wait for async operations (API calls, etc.) */
  asyncOperation: 2000,
  /** Long wait for slow operations */
  slowOperation: 3000,
} as const;

/**
 * Wait for auth form to be ready for submission.
 * The SignInForm/SignUpForm have a 350ms delay before formReady=true.
 * This waits for the data-form-ready attribute to be "true".
 */
export async function waitForFormReady(page: Page, timeout = 5000): Promise<boolean> {
  try {
    await page.locator('form[data-form-ready="true"]').waitFor({
      state: "attached",
      timeout,
    });
    return true;
  } catch {
    // Fallback: wait for DOM to be ready if attribute not found
    await page.waitForLoadState("domcontentloaded");
    return false;
  }
}

/**
 * Wait for an animation or transition to complete.
 * Use this after clicking elements that trigger CSS transitions.
 *
 * NOTE: This is one of the few acceptable uses of waitForTimeout -
 * CSS animations don't have JS hooks. Consider using CSS animation-end
 * events or data attributes if this becomes flaky.
 * @deprecated Prefer waiting for specific element states instead
 */
export async function waitForAnimation(page: Page): Promise<void> {
  await page.waitForTimeout(WAIT_TIMEOUTS.animation);
}

/**
 * Wait for React to hydrate after page load.
 * Use this on cold starts when elements might not be interactive yet.
 */
export async function waitForReactHydration(page: Page): Promise<void> {
  // Wait for DOM to be ready and network to settle
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for a dropdown menu to open.
 * Waits for the dropdown to have the expected visible state.
 */
export async function waitForDropdown(page: Page, dropdownSelector: string): Promise<void> {
  const dropdown = page.locator(dropdownSelector);
  await dropdown.waitFor({ state: "visible" });
  // Wait for dropdown to be stable (not animating)
  await dropdown.evaluate((el) => {
    return new Promise<void>((resolve) => {
      if (!el.getAnimations().length) {
        resolve();
        return;
      }
      Promise.all(el.getAnimations().map((a) => a.finished)).then(() => resolve());
    });
  });
}

/**
 * Wait for a modal/dialog to open and be interactive.
 */
export async function waitForModal(page: Page, modalSelector = '[role="dialog"]'): Promise<void> {
  const modal = page.locator(modalSelector);
  await modal.waitFor({ state: "visible" });
  // Wait for modal to be stable (not animating)
  await modal.evaluate((el) => {
    return new Promise<void>((resolve) => {
      if (!el.getAnimations().length) {
        resolve();
        return;
      }
      Promise.all(el.getAnimations().map((a) => a.finished)).then(() => resolve());
    });
  });
}

/**
 * Wait for toast notification to appear.
 */
export async function waitForToast(
  page: Page,
  type?: "success" | "error" | "info",
): Promise<string | null> {
  const selector = type ? `[data-sonner-toast][data-type="${type}"]` : "[data-sonner-toast]";

  try {
    const toast = page.locator(selector).first();
    await toast.waitFor({ state: "visible" });
    return await toast.textContent();
  } catch {
    return null;
  }
}

/**
 * Wait for page navigation to complete and settle.
 * Use after actions that trigger route changes.
 */
export async function waitForNavigation(page: Page, urlPattern?: RegExp): Promise<void> {
  if (urlPattern) {
    await page.waitForURL(urlPattern);
  }
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Wait for an element to be both visible and enabled (clickable).
 */
export async function waitForClickable(
  page: Page,
  selector: string,
  timeout = 5000,
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    await element.waitFor({ state: "visible", timeout });
    const isDisabled = await element.isDisabled();
    return !isDisabled;
  } catch {
    return false;
  }
}
