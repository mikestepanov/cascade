/**
 * Global Setup - Runs once before all tests
 *
 * Creates auth state for fixed test users:
 * - dashboard: Default user for most tests
 * - teamLead: Team lead (admin in RBAC)
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
 * Set up auth state for a specific test user
 */
async function setupTestUser(
  context: BrowserContext,
  page: Page,
  baseURL: string,
  userKey: string,
  user: TestUser,
  authPath: string,
): Promise<boolean> {
  const authStatePath = path.join(AUTH_DIR, path.basename(authPath));

  // Check if auth file already exists and is recent (less than 1 hour old)
  if (fs.existsSync(authStatePath)) {
    const stats = fs.statSync(authStatePath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < 60 * 60 * 1000) {
      console.log(`  ✓ ${userKey}: Using existing auth state (${Math.round(ageMs / 60000)}m old)`);
      return true;
    }
  }

  console.log(`  🔧 ${userKey}: Setting up auth for ${user.email}...`);

  // Clear context storage
  await context.clearCookies();

  // Try sign-in first (user might already exist)
  let success = await trySignInUser(page, baseURL, user);

  if (!success) {
    // Recreate user via API
    console.log(`  ℹ️ ${userKey}: Sign-in failed, recreating user via API...`);
    await testUserService.deleteTestUser(user.email);

    const createResult = await testUserService.createTestUser(user.email, user.password, true);
    if (createResult.success) {
      console.log(`  ✓ ${userKey}: User created via API (${createResult.userId})`);
      success = await trySignInUser(page, baseURL, user);
      if (!success) {
        console.warn(`  ⚠️ ${userKey}: Sign-in failed after API user creation`);
      }
    } else {
      console.warn(`  ⚠️ ${userKey}: API user creation failed: ${createResult.error}`);
    }
  }

  if (success) {
    await context.storageState({ path: authStatePath });
    console.log(`  ✓ ${userKey}: Auth state saved`);
    return true;
  } else {
    console.warn(`  ⚠️ ${userKey}: Failed to create auth state`);
    await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${userKey}.png`) });
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

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  // Users to set up
  const usersToSetup: Array<{ key: string; user: TestUser; authPath: string }> = [
    { key: "dashboard", user: TEST_USERS.dashboard, authPath: AUTH_PATHS.dashboard },
    { key: "teamLead", user: TEST_USERS.teamLead, authPath: AUTH_PATHS.teamLead },
    { key: "teamMember", user: TEST_USERS.teamMember, authPath: AUTH_PATHS.teamMember },
    { key: "viewer", user: TEST_USERS.viewer, authPath: AUTH_PATHS.viewer },
  ];

  console.log(`\n👥 Setting up ${usersToSetup.length} test user(s)...\n`);

  for (const { key, user, authPath } of usersToSetup) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await setupTestUser(context, page, baseURL, key, user, authPath);
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

  // Set up RBAC test project
  console.log("\n🔐 Setting up RBAC test project...\n");
  const rbacResult = await testUserService.setupRbacProject({
    projectKey: RBAC_TEST_CONFIG.projectKey,
    adminEmail: TEST_USERS.teamLead.email,
    editorEmail: TEST_USERS.teamMember.email,
    viewerEmail: TEST_USERS.viewer.email,
  });

  if (rbacResult.success) {
    console.log(`  ✓ RBAC project created: ${rbacResult.projectKey}`);
    console.log(`    - Admin: ${TEST_USERS.teamLead.email}`);
    console.log(`    - Editor: ${TEST_USERS.teamMember.email}`);
    console.log(`    - Viewer: ${TEST_USERS.viewer.email}`);
  } else {
    console.warn(`  ⚠️ RBAC project setup failed: ${rbacResult.error}`);
  }

  console.log("\n✅ Global setup complete\n");
}

export default globalSetup;
