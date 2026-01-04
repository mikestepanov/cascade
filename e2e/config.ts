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
 * User Roles
 */
export type PlatformRole = "user" | "superAdmin";
export type ProjectRole = "viewer" | "editor" | "admin";
export type OnboardingPersona = "team_lead" | "team_member";

/**
 * Test User Configuration
 */
export interface TestUser {
  email: string;
  password: string;
  platformRole: PlatformRole;
  onboardingPersona?: OnboardingPersona;
  description: string;
}

/**
 * Test Users Configuration
 *
 * All test users use @inbox.mailtrap.io domain for email verification.
 * Users are created on first run and reused across test runs.
 *
 * Platform Roles:
 * - admin: Full platform access, can manage users and invites
 * - user: Standard user access
 *
 * Onboarding Personas:
 * - team_lead: Creates projects, manages team
 * - team_member: Joins existing projects
 */
export const TEST_USERS = {
  // Platform admin user - full admin access
  admin: {
    email: "e2e-admin@inbox.mailtrap.io",
    password: "E2ETestPassword123!",
    platformRole: "superAdmin" as PlatformRole,
    onboardingPersona: "team_lead" as OnboardingPersona,
    description: "Platform admin with full access",
  },

  // Team lead user - creates and manages projects
  teamLead: {
    email: "e2e-teamlead@inbox.mailtrap.io",
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_lead" as OnboardingPersona,
    description: "Team lead who creates and manages projects",
  },

  // Team member user - joins projects, standard access
  teamMember: {
    email: "e2e-member@inbox.mailtrap.io",
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_member" as OnboardingPersona,
    description: "Team member with standard access",
  },

  // Viewer user - read-only project access
  viewer: {
    email: "e2e-viewer@inbox.mailtrap.io",
    password: "E2ETestPassword123!",
    platformRole: "user" as PlatformRole,
    onboardingPersona: "team_member" as OnboardingPersona,
    description: "Viewer with read-only project access",
  },
} as const;

// Default user for most tests - use teamLead
export const DEFAULT_TEST_USER = TEST_USERS.teamLead;

/**
 * Test company configuration
 * All test users (teamLead, teamMember, viewer) share this single company.
 */
export const TEST_COMPANY_NAME = "Nixelo E2E";
export const TEST_COMPANY_SLUG = "nixelo-e2e";

/**
 * Company Settings Type
 * Matches the schema in convex/schema.ts
 */
export interface CompanySettings {
  defaultMaxHoursPerWeek: number;
  defaultMaxHoursPerDay: number;
  requiresTimeApproval: boolean;
  billingEnabled: boolean;
}

/**
 * Settings Profiles for E2E Testing
 *
 * Use these profiles to test different settings configurations.
 * Most tests should use 'default'. Only use specific profiles
 * when testing features affected by that setting.
 */
export const SETTINGS_PROFILES: Record<string, CompanySettings> = {
  // Default profile - used by most tests
  default: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: false,
    billingEnabled: true,
  },

  // Billing disabled - for testing billing feature gates
  billingDisabled: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: false,
    billingEnabled: false,
  },

  // Time approval required - for testing approval workflows
  timeApprovalRequired: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: true,
    billingEnabled: true,
  },

  // Strict time limits - for testing hour limit enforcement
  strictTimeLimits: {
    defaultMaxHoursPerWeek: 20,
    defaultMaxHoursPerDay: 4,
    requiresTimeApproval: true,
    billingEnabled: true,
  },
};

/**
 * Prefixes for dynamically created test users
 */
export const TEST_USER_PREFIXES = {
  auth: "e2e-auth",
  onboarding: "e2e-onboarding",
  temp: "e2e-temp",
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
  // Verify test user's email (POST) - bypasses email verification
  verifyTestUser: `${CONVEX_SITE_URL}/e2e/verify-test-user`,
  // Clean up old test users (POST)
  cleanup: `${CONVEX_SITE_URL}/e2e/cleanup`,
  // Set up RBAC test project with users in different roles (POST)
  setupRbacProject: `${CONVEX_SITE_URL}/e2e/setup-rbac-project`,
  // Clean up RBAC test project (POST)
  cleanupRbacProject: `${CONVEX_SITE_URL}/e2e/cleanup-rbac-project`,
  // Debug: Verify password against stored hash (POST)
  debugVerifyPassword: `${CONVEX_SITE_URL}/e2e/debug-verify-password`,
  // Update company settings (POST) - for testing different settings profiles
  updateCompanySettings: `${CONVEX_SITE_URL}/e2e/update-company-settings`,
  // Seed project templates (POST)
  seedTemplates: `${CONVEX_SITE_URL}/e2e/seed-templates`,
  // Force delete ALL test users (POST)
  nukeTestUsers: `${CONVEX_SITE_URL}/e2e/nuke-test-users`,
};

/**
 * RBAC Test Configuration
 */
export const RBAC_TEST_CONFIG = {
  projectKey: "RBAC",
  projectName: "RBAC Test Project",
  /**
   * Company slug for URL paths.
   * Uses "dashboard" because that's the auto-created company when test users first log in.
   * The RBAC setup will use this existing company instead of creating a new one.
   */
  companySlug: TEST_COMPANY_SLUG,
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
 * Auth state file paths for each test user
 */
export const AUTH_PATHS = {
  admin: ".auth/user-admin.json",
  teamLead: ".auth/user-teamlead.json",
  teamMember: ".auth/user-member.json",
  viewer: ".auth/user-viewer.json",
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
