/**
 * Global Setup - Runs once before all tests
 *
 * Creates auth state for fixed test users:
 * - teamLead: Team lead (admin in RBAC) - default user for most tests
 * - teamMember: Team member (editor in RBAC)
 * - viewer: Read-only user (viewer in RBAC)
 *
 * Uses API-first approach:
 * 1. Delete existing user via API
 * 2. Create user via API (with password hash)
 * 3. Browser sign-in to get auth tokens
 * 4. Save auth state to .auth/*.json
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, chromium, type FullConfig, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS, type TestUser } from "./config";
import { clearInbox, testUserService, trySignInUser } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, ".auth");

/**
 * Result from setting up a test user
 */
interface SetupResult {
  success: boolean;
  companySlug?: string;
}

/**
 * Extract company slug from URL (e.g., /e2e-dashboard-xxxxx/dashboard -> e2e-dashboard-xxxxx)
 */
function extractCompanySlug(url: string): string | undefined {
  const match = url.match(/\/([^/]+)\/(dashboard|settings|projects|documents|issues)/);
  return match?.[1];
}

/**
 * Set up auth state for a specific test user
 */
async function setupTestUser(
  context: BrowserContext,
  page: Page,
  baseURL: string,
  userKey: string,
  user: TestUser,
  authPath: string,
): Promise<SetupResult> {
  const authStatePath = path.join(AUTH_DIR, path.basename(authPath));

  // IMPORTANT: Always create fresh auth state because Convex uses refresh token rotation.
  // Once a refresh token is used, it becomes invalid. Reusing old auth state files
  // will fail because the tokens have been rotated by previous test runs.
  // Delete any existing auth file to force fresh sign-in.
  if (fs.existsSync(authStatePath)) {
    fs.unlinkSync(authStatePath);
    console.log(`  🗑️ ${userKey}: Deleted stale auth state`);
  }

  console.log(`  🔧 ${userKey}: Setting up auth for ${user.email}...`);

  // Clear context storage
  await context.clearCookies();

  // Always delete and recreate user to ensure deterministic company slug
  // This ensures the slug is derived from email prefix without random suffix
  console.log(`  🗑️ ${userKey}: Deleting existing user to ensure fresh state...`);
  await testUserService.deleteTestUser(user.email);

  const createResult = await testUserService.createTestUser(user.email, user.password, true);
  let success = false;

  if (createResult.success) {
    console.log(`  ✓ ${userKey}: User created via API (${createResult.userId})`);

    // Debug: Verify password is correctly stored
    const debugResult = await testUserService.debugVerifyPassword(user.email, user.password);
    if (!debugResult.passwordMatches) {
      console.warn(`  ⚠️ ${userKey}: Password verification failed:`, JSON.stringify(debugResult));
    } else {
      console.log(`  ✓ ${userKey}: Password verified successfully`);
    }

    success = await trySignInUser(page, baseURL, user);
    if (!success) {
      console.warn(`  ⚠️ ${userKey}: Sign-in failed after API user creation`);
    }
  } else {
    console.warn(`  ⚠️ ${userKey}: API user creation failed: ${createResult.error}`);
  }

  if (success) {
    await context.storageState({ path: authStatePath });
    const companySlug = extractCompanySlug(page.url());
    console.log(`  ✓ ${userKey}: Auth state saved`);
    return { success: true, companySlug };
  } else {
    console.warn(`  ⚠️ ${userKey}: Failed to create auth state`);
    await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${userKey}.png`) });
    return { success: false };
  }
}

/**
 * Wait for the React app to be fully loaded
 */
async function waitForAppReady(page: Page, baseURL: string): Promise<boolean> {
  try {
    console.log("⏳ Waiting for React app to be ready...");

    // Navigate with generous timeout
    await page.goto(baseURL, { waitUntil: "load", timeout: 120000 });

    // Wait for EITHER sign-in page OR dashboard (whichever loads first)
    // This is more reliable than checking for empty root
    await page.waitForSelector('h1, h2, [role="heading"], button[type="submit"]', {
      state: "visible",
      timeout: 60000,
    });

    console.log("✓ React app is ready");
    return true;
  } catch (error) {
    console.error("❌ React app failed to load:", error);
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: path.join(AUTH_DIR, "app-load-failed.png"), fullPage: true });
      const html = await page.content();
      fs.writeFileSync(path.join(AUTH_DIR, "app-load-failed.html"), html);
      console.log("  📸 Debug files saved to .auth/");
    } catch {}
    return false;
  }
}

/**
 * Global setup entry point
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:5555";

  // Clear Mailtrap inbox
  console.log("📧 Clearing Mailtrap inbox...");
  await clearInbox();

  // Seed project templates
  console.log("🌱 Seeding project templates...");
  const seeded = await testUserService.seedTemplates();
  if (seeded) {
    console.log("  ✓ Project templates seeded");
  } else {
    console.warn("  ⚠️ Failed to seed project templates");
  }

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Force delete ALL test users and associated data to ensure a fresh state
  console.log("\n🧹 Nuking stale test users...");
  const nukeResult = await testUserService.nukeTestUsers();
  console.log(`  ✓ Deleted ${nukeResult.deleted} test users\n`);

  const browser = await chromium.launch();

  // Wait for React app to be ready before starting user setup
  const testPage = await browser.newPage();
  const appReady = await waitForAppReady(testPage, baseURL);
  await testPage.close();

  if (!appReady) {
    await browser.close();
    throw new Error("React app failed to load. Cannot proceed with global setup.");
  }

  // Users to set up (teamLead is the default user for most tests)
  const usersToSetup: Array<{ key: string; user: TestUser; authPath: string }> = [
    { key: "teamLead", user: TEST_USERS.teamLead, authPath: AUTH_PATHS.teamLead },
    { key: "teamMember", user: TEST_USERS.teamMember, authPath: AUTH_PATHS.teamMember },
    { key: "viewer", user: TEST_USERS.viewer, authPath: AUTH_PATHS.viewer },
  ];

  console.log(`\n👥 Setting up ${usersToSetup.length} test user(s)...\n`);

  // Store company slugs for each user
  const userConfigs: Record<string, { companySlug?: string }> = {};

  for (const { key, user, authPath } of usersToSetup) {
    const context = await browser.newContext();
    // Force online status for headless environment (fixes Convex client connection)
    await context.addInitScript(() => {
      try {
        Object.defineProperty(navigator, "onLine", { get: () => true });
      } catch (e) {
        console.warn("Failed to override navigator.onLine", e);
      }
    });
    const page = await context.newPage();

    try {
      const result = await setupTestUser(context, page, baseURL, key, user, authPath);

      if (!result.success) {
        console.error(`  ❌ ${key}: Failed to create auth state`);
        // Don't retry - app should be ready, if it fails there's a real issue
      } else {
        userConfigs[key] = { companySlug: result.companySlug };
      }
    } catch (error) {
      console.error(`  ❌ ${key}: Setup error:`, error);
      try {
        await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${key}.png`) });
      } catch {
        // Ignore screenshot errors
      }
    } finally {
      await context.close();
    }
  }

  await browser.close();

  // Save default user config for tests to use (teamLead is the default)
  if (userConfigs.teamLead?.companySlug) {
    const dashboardConfig = {
      companySlug: userConfigs.teamLead.companySlug,
      email: TEST_USERS.teamLead.email,
    };
    fs.writeFileSync(
      path.join(AUTH_DIR, "dashboard-config.json"),
      JSON.stringify(dashboardConfig, null, 2),
    );
    console.log(`  ✓ Default user config saved: ${dashboardConfig.companySlug}`);
  }

  // Set up RBAC test project
  console.log("\n🔐 Setting up RBAC test project...\n");
  const rbacResult = await testUserService.setupRbacProject({
    projectKey: RBAC_TEST_CONFIG.projectKey,
    projectName: RBAC_TEST_CONFIG.projectName,
    adminEmail: TEST_USERS.teamLead.email,
    editorEmail: TEST_USERS.teamMember.email,
    viewerEmail: TEST_USERS.viewer.email,
  });

  if (rbacResult.success) {
    console.log(`  ✓ RBAC project created: ${rbacResult.projectKey}`);
    console.log(`    - Company slug: ${rbacResult.companySlug}`);
    console.log(`    - Admin: ${TEST_USERS.teamLead.email}`);
    console.log(`    - Editor: ${TEST_USERS.teamMember.email}`);
    console.log(`    - Viewer: ${TEST_USERS.viewer.email}`);

    // Save RBAC config for tests to use (actual company slug from API)
    const rbacConfig = {
      projectKey: rbacResult.projectKey,
      companySlug: rbacResult.companySlug,
      projectId: rbacResult.projectId,
      companyId: rbacResult.companyId,
    };
    fs.writeFileSync(path.join(AUTH_DIR, "rbac-config.json"), JSON.stringify(rbacConfig, null, 2));
    console.log(`  ✓ RBAC config saved to .auth/rbac-config.json`);
  } else {
    console.warn(`  ⚠️ RBAC project setup failed: ${rbacResult.error}`);
  }

  console.log("\n✅ Global setup complete\n");
}

export default globalSetup;
