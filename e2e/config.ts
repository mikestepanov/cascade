/**
 * E2E Test Configuration
 *
 * Centralized configuration for E2E tests including test user credentials,
 * API endpoints, and test settings.
 */

/**
 * Get a required environment variable. Throws if not defined.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Convex site URL for E2E API endpoints
// Derived from VITE_CONVEX_URL (same pattern as frontend)
function getConvexSiteUrl(): string {
  return requireEnv("VITE_CONVEX_URL").replace(".convex.cloud", ".convex.site");
}

export const CONVEX_SITE_URL = getConvexSiteUrl();

// E2E API Key for authenticated endpoints (optional in dev)
export const E2E_API_KEY = process.env.E2E_API_KEY || "";

/**
 * Get headers for E2E API requests
 */
export function getE2EHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (E2E_API_KEY) {
    headers["x-e2e-api-key"] = E2E_API_KEY;
  }
  return headers;
}

/**
 * Test Users Configuration
 *
 * Dashboard user: Persistent user with completed onboarding
 * - Used for dashboard, projects, issues tests
 * - Created once, reused across runs
 *
 * Onboarding user: Fresh user created via API (no email verification)
 * - Used for onboarding wizard tests
 * - Created per test run, cleaned up after
 */
export const TEST_USERS = {
  // Persistent dashboard user - completed onboarding
  dashboard: {
    email: "e2e-dashboard@inbox.mailtrap.io",
    password: "E2ETestPassword123!",
  },
  // Prefix for fresh auth test users (timestamp will be appended)
  authTestPrefix: "e2e-auth",
  // Prefix for fresh onboarding test users
  onboardingTestPrefix: "e2e-onboarding",
};

/**
 * E2E API Endpoints
 */
export const E2E_ENDPOINTS = {
  // Get OTP for test email (GET ?email=...)
  getOTP: `${CONVEX_SITE_URL}/e2e/otp`,
  // Reset onboarding state (POST)
  resetOnboarding: `${CONVEX_SITE_URL}/e2e/reset-onboarding`,
  // Create test user via API (POST) - bypasses email verification
  createTestUser: `${CONVEX_SITE_URL}/e2e/create-test-user`,
  // Delete test user (POST)
  deleteTestUser: `${CONVEX_SITE_URL}/e2e/delete-test-user`,
};

/**
 * Test Timeouts
 */
export const TIMEOUTS = {
  // How long to wait for OTP email to arrive
  otpWait: 30000,
  // Poll interval for checking OTP
  otpPollInterval: 2000,
  // Page load timeout
  pageLoad: 30000,
  // Element visibility timeout
  elementVisible: 10000,
};

/**
 * Auth state file paths
 */
export const AUTH_PATHS = {
  // Dashboard user auth state (completed onboarding)
  dashboard: ".auth/user-dashboard.json",
  // Onboarding user auth state (not completed onboarding)
  onboarding: ".auth/user-onboarding.json",
};

/**
 * Generate a unique test email address
 */
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@inbox.mailtrap.io`;
}

/**
 * Check if an email is a test email (for cleanup purposes)
 */
export function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}
