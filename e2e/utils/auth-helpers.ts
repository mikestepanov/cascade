/**
 * Auth UI Helpers
 *
 * Shared browser interaction helpers for authentication flows.
 * Used by both global-setup.ts and auth.fixture.ts to avoid duplication.
 */

import type { Page } from "@playwright/test";
import type { TestUser } from "../config";
import { waitForVerificationEmail } from "./mailtrap";

/**
 * Check if we're on the dashboard
 * Handles both old (/dashboard) and new (/:companySlug/dashboard) URL patterns
 *
 * This only checks URL pattern. For content verification, use waitForDashboardContent().
 */
export async function isOnDashboard(page: Page): Promise<boolean> {
  const url = page.url();
  const dashboardUrlPattern = /\/[^/]+\/dashboard$/;
  return dashboardUrlPattern.test(url) || url.endsWith("/dashboard");
}

/**
 * Wait for dashboard content to be fully loaded (My Work heading visible)
 * Call this after confirming URL is dashboard to ensure content rendered.
 *
 * @returns true if content loaded, false if timed out
 */
export async function waitForDashboardContent(page: Page, timeout = 15000): Promise<boolean> {
  const myWorkHeading = page.getByRole("heading", { name: /my work/i });

  try {
    await myWorkHeading.waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're on the onboarding page
 */
export async function isOnOnboarding(page: Page): Promise<boolean> {
  if (page.url().includes("/onboarding")) {
    return true;
  }
  const welcomeHeading = page.getByRole("heading", { name: /welcome to nixelo/i });
  if (await welcomeHeading.isVisible().catch(() => false)) {
    return true;
  }
  return false;
}

/**
 * Click the "Continue with email" button and wait for form to expand
 * Waits specifically for the button text to change to "Sign in" or "Create account"
 */
export async function clickContinueWithEmail(page: Page): Promise<boolean> {
  const continueButton = page.getByRole("button", { name: /continue with email/i });
  const signInButton = page.getByRole("button", { name: "Sign in", exact: true });
  const createAccountButton = page.getByRole("button", { name: "Create account", exact: true });

  // Check if form is already expanded by looking for the submit button
  const signInVisible = await signInButton.isVisible().catch(() => false);
  const createAccountVisible = await createAccountButton.isVisible().catch(() => false);

  if (signInVisible || createAccountVisible) {
    console.log("✓ Form already expanded (submit button visible)");
    return true;
  }

  // Check if continue button exists
  const continueVisible = await continueButton.isVisible().catch(() => false);
  if (!continueVisible) {
    console.log("❌ Continue button not found");
    return false;
  }

  // Wait for page to be fully loaded and React to hydrate
  // On cold starts, React needs more time to attach click handlers
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  // Click the button
  await continueButton.click({ timeout: 5000 });

  // Wait for form to expand
  try {
    await Promise.race([
      signInButton.waitFor({ state: "visible", timeout: 5000 }),
      createAccountButton.waitFor({ state: "visible", timeout: 5000 }),
    ]);
    console.log("✓ Form expanded successfully");
    return true;
  } catch {
    console.log("❌ Form did not expand after click");
    return false;
  }
}

/**
 * Handle being on onboarding or dashboard after authentication
 */
export async function handleOnboardingOrDashboard(page: Page): Promise<boolean> {
  await page.waitForTimeout(1000);

  if (await isOnDashboard(page)) {
    console.log("✓ Already on dashboard");
    return true;
  }

  if (await isOnOnboarding(page)) {
    console.log("📋 On onboarding - completing...");

    // Wait for onboarding page to load (it starts in "loading" state)
    // The "Skip for now" button only appears after queries load and step changes to "role-select"
    const skipButton = page.getByRole("button", { name: /skip for now/i });

    try {
      // Wait up to 15 seconds for the skip button to appear (queries need to load)
      await skipButton.waitFor({ state: "visible", timeout: 15000 });
      console.log("✓ Skip button found, clicking...");
      await skipButton.click();

      // Wait for navigation to dashboard
      await page.waitForURL(/\/[^/]+\/dashboard/, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      if (await isOnDashboard(page)) {
        console.log("✓ Successfully skipped to dashboard");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Skip button not found after waiting:", String(error).slice(0, 100));
    }

    // Fallback: try other selectors
    const fallbackSelectors = [
      page.getByRole("link", { name: /skip for now/i }),
      page.getByText(/skip for now/i),
    ];

    for (const skipElement of fallbackSelectors) {
      try {
        if (await skipElement.isVisible().catch(() => false)) {
          await skipElement.click();
          await page.waitForTimeout(2000);
          if (await isOnDashboard(page)) {
            return true;
          }
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    console.log("⚠️ Could not skip onboarding");
  }

  return false;
}

/**
 * Try to sign in with specific user credentials
 */
export async function trySignInUser(page: Page, baseURL: string, user: TestUser): Promise<boolean> {
  try {
    console.log(`  🔐 Attempting sign-in for ${user.email}...`);
    await page.goto(`${baseURL}/signin`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    if (await isOnDashboard(page)) {
      console.log("  ✓ Already on dashboard");
      return true;
    }

    console.log("  📋 Waiting for sign-in page...");
    await page
      .getByRole("heading", { name: /welcome back/i })
      .waitFor({ state: "visible", timeout: 15000 });

    console.log("  📧 Expanding email form...");
    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) {
      console.log("  ❌ Failed to expand email form");
      return false;
    }

    // Wait for form to stabilize after expansion (React hydration on cold starts)
    await page.waitForTimeout(1000);

    console.log("  📝 Filling credentials...");
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.waitForTimeout(500);

    console.log("  🚀 Clicking sign-in button...");
    const signInButton = page.getByRole("button", { name: "Sign in", exact: true });
    await signInButton.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(300); // Small delay for button to be clickable
    await signInButton.click();

    try {
      // Wait for redirect - handles both old (/dashboard) and new (/:companySlug/dashboard) patterns
      await page.waitForURL(/\/(onboarding|[^/]+\/dashboard)/, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });
      console.log("  ✓ Redirected to:", page.url());
    } catch {
      console.log("  ⚠️ No redirect detected, checking current page...");
    }

    return await handleOnboardingOrDashboard(page);
  } catch (error) {
    console.log("  ❌ Sign-in error:", String(error).slice(0, 200));
    return false;
  }
}

/**
 * Wait for either verification screen or redirect after signup
 */
export async function waitForSignUpResult(page: Page): Promise<"verification" | "redirect" | null> {
  const verificationHeading = page.getByRole("heading", { name: /verify your email/i });
  const startTime = Date.now();

  while (Date.now() - startTime < 15000) {
    if (await verificationHeading.isVisible().catch(() => false)) {
      return "verification";
    }
    const url = page.url();
    // Check for onboarding or dashboard patterns (both old and new URL structures)
    if (url.includes("/onboarding") || /\/[^/]+\/dashboard/.test(url)) {
      return "redirect";
    }
    await page.waitForTimeout(500);
  }
  return null;
}

/**
 * Complete email verification with OTP from Mailtrap
 */
export async function completeEmailVerification(page: Page, email: string): Promise<boolean> {
  console.log(`  📬 Waiting for verification email for ${email}...`);
  try {
    const otp = await waitForVerificationEmail(email, {
      timeout: 90000,
      pollInterval: 2000,
    });
    console.log(`  ✓ Retrieved OTP: ${otp}`);

    const codeInput = page.getByPlaceholder("8-digit code");
    await codeInput.waitFor({ state: "visible", timeout: 5000 });
    await codeInput.fill(otp);

    const verifyButton = page.getByRole("button", { name: /verify email/i });
    await verifyButton.click();
    // Wait for redirect to onboarding or company dashboard
    await page.waitForURL(/\/(onboarding|[^/]+\/dashboard)/, { timeout: 15000 });
    return true;
  } catch (verifyError) {
    console.error(`  ❌ Email verification failed for ${email}:`, verifyError);
    return false;
  }
}

/**
 * Sign up a user via UI (for testing actual sign-up flow)
 * Uses Mailtrap for email verification
 */
export async function signUpUserViaUI(
  page: Page,
  baseURL: string,
  user: TestUser,
): Promise<boolean> {
  try {
    await page.goto(`${baseURL}/signup`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    // Check for onboarding or dashboard patterns (both old and new URL structures)
    if (currentUrl.includes("/onboarding") || /\/[^/]+\/dashboard/.test(currentUrl)) {
      return await handleOnboardingOrDashboard(page);
    }

    const signUpHeading = page.getByRole("heading", { name: /create an account/i });
    await signUpHeading.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

    if (!(await signUpHeading.isVisible().catch(() => false))) {
      return await isOnDashboard(page);
    }

    const formExpanded = await clickContinueWithEmail(page);
    if (!formExpanded) return false;

    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.waitForTimeout(400);

    const submitButton = page.getByRole("button", { name: "Create account", exact: true });
    await submitButton.waitFor({ state: "visible", timeout: 5000 });
    console.log(`  📤 Submitting sign-up form for ${user.email}...`);
    await submitButton.click();

    const signUpResult = await waitForSignUpResult(page);
    console.log(`  📋 Sign-up result: ${signUpResult || "timeout"}`);

    if (signUpResult === "verification") {
      const emailVerified = await completeEmailVerification(page, user.email);
      if (!emailVerified) return false;
    } else if (signUpResult === null) {
      const url = page.url();
      console.log(`  📍 Current URL after timeout: ${url}`);
      return false;
    }

    return await handleOnboardingOrDashboard(page);
  } catch (error) {
    console.error(`  ❌ Sign-up error for ${user.email}:`, error);
    return false;
  }
}
