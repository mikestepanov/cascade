/**
 * Fully automatic visual screenshot tool for reviewing all app pages.
 *
 * Usage:
 *   pnpm screenshots
 *
 * Requires dev server running (pnpm dev).
 * Automatically creates a test user, logs in via API, and screenshots every page.
 * Screenshots are saved to e2e/screenshots/ with numbered filenames.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { chromium, type Page } from "@playwright/test";
// Env loaded via --env-file=.env.local in the npm script
import { TEST_USERS } from "./config";
import { testUserService } from "./utils/test-user-service";

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = 2500;

const SCREENSHOT_USER = {
  email: TEST_USERS.teamLead.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamLead.password,
};

let index = 0;

async function takeScreenshot(page: Page, name: string, url: string): Promise<void> {
  index++;
  const num = String(index).padStart(2, "0");
  const filename = `${num}-${name}.png`;
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    // networkidle often times out on real-time apps -- page is still usable
  }
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
  console.log(`  ${num}  ${name}`);
}

async function discoverFirstHref(page: Page, pattern: RegExp): Promise<string | null> {
  try {
    const links = page.locator("a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const match = href.match(pattern);
        if (match?.[1]) return match[1];
      }
    }
  } catch {}
  return null;
}

async function autoLogin(page: Page): Promise<string | null> {
  console.log("  Creating test user...");
  await testUserService.deleteTestUser(SCREENSHOT_USER.email);
  const createResult = await testUserService.createTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
    true, // skip onboarding
  );
  if (!createResult.success) {
    console.error(`  Failed to create user: ${createResult.error}`);
    return null;
  }
  console.log(`  User ready: ${SCREENSHOT_USER.email}`);

  console.log("  Logging in via API...");
  const loginResult = await testUserService.loginTestUser(
    SCREENSHOT_USER.email,
    SCREENSHOT_USER.password,
  );
  if (!(loginResult.success && loginResult.token)) {
    console.error(`  API login failed: ${loginResult.error}`);
    return null;
  }

  // Navigate to signin first so we have a page context for localStorage
  await page.goto(`${BASE_URL}/signin`, { waitUntil: "domcontentloaded" });

  // Inject tokens into localStorage
  await page.evaluate(
    ({ token, refreshToken, convexUrl }) => {
      localStorage.setItem("convexAuthToken", token);
      if (refreshToken) {
        localStorage.setItem("convexAuthRefreshToken", refreshToken);
      }
      if (convexUrl) {
        const ns = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
        localStorage.setItem(`__convexAuthJWT_${ns}`, token);
        if (refreshToken) {
          localStorage.setItem(`__convexAuthRefreshToken_${ns}`, refreshToken);
        }
      }
    },
    {
      token: loginResult.token,
      refreshToken: loginResult.refreshToken ?? null,
      convexUrl: CONVEX_URL,
    },
  );

  // Navigate to /app which routes to /$orgSlug/dashboard
  await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });

  // Wait for redirect to dashboard
  try {
    await page.waitForURL((u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname), {
      timeout: 20000,
    });
  } catch {
    console.error("  Login redirect timed out. Current URL:", page.url());
    return null;
  }

  await page.waitForTimeout(2000);
  const orgSlug = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
  console.log(`  Logged in. Org: ${orgSlug}\n`);
  return orgSlug;
}

async function manualLogin(page: Page): Promise<string | null> {
  console.log("\n  Auto-login unavailable. Please sign in manually.");
  console.log("  The script will resume once you reach the dashboard.\n");

  await page.goto(BASE_URL);
  await page.waitForURL(
    (u) => /\/[^/]+\/(dashboard|projects|issues|documents)/.test(new URL(u).pathname),
    { timeout: 300_000 },
  );
  await page.waitForTimeout(2000);
  const orgSlug = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
  console.log(`  Logged in. Org: ${orgSlug}\n`);
  return orgSlug;
}

async function run(): Promise<void> {
  // Clean output directory
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log(`\n  Base URL:    ${BASE_URL}`);
  console.log(`  Output dir:  ${SCREENSHOT_DIR}\n`);

  const headless = !process.argv.includes("--headed");
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // Try automatic login first, fall back to manual
  let orgSlug: string | null = null;
  if (CONVEX_URL) {
    orgSlug = await autoLogin(page);
  }
  if (!orgSlug) {
    // Reopen headed so user can interact
    await browser.close();
    const fallbackBrowser = await chromium.launch({ headless: false });
    const fallbackContext = await fallbackBrowser.newContext({ viewport: VIEWPORT });
    const fallbackPage = await fallbackContext.newPage();
    orgSlug = await manualLogin(fallbackPage);
    if (!orgSlug) {
      console.error("  Could not detect org slug. Aborting.");
      await fallbackBrowser.close();
      return;
    }
    // Continue with fallback browser
    await screenshotAll(fallbackPage, orgSlug);
    await fallbackBrowser.close();
    return;
  }

  await screenshotAll(page, orgSlug);
  await browser.close();
}

async function screenshotAll(page: Page, orgSlug: string): Promise<void> {
  console.log("Taking screenshots...\n");

  // --- Core pages ---
  await takeScreenshot(page, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, "projects", `/${orgSlug}/projects`);

  // --- Discover a project key ---
  const projectKey = await discoverFirstHref(page, /\/projects\/([A-Z0-9_-]+)\//i);

  if (projectKey) {
    console.log(`\n  Found project: ${projectKey}\n`);
    const tabs = [
      "board",
      "backlog",
      "sprints",
      "roadmap",
      "calendar",
      "activity",
      "analytics",
      "billing",
      "timesheet",
      "settings",
    ];
    for (const tab of tabs) {
      await takeScreenshot(
        page,
        `project-${projectKey.toLowerCase()}-${tab}`,
        `/${orgSlug}/projects/${projectKey}/${tab}`,
      );
    }
  } else {
    console.log("\n  No projects found -- skipping project sub-pages\n");
  }

  // --- Issues ---
  await takeScreenshot(page, "issues", `/${orgSlug}/issues`);

  const issueKey = await discoverFirstHref(page, /\/issues\/([A-Z]+-\d+)/i);
  if (issueKey) {
    await takeScreenshot(page, `issue-${issueKey.toLowerCase()}`, `/${orgSlug}/issues/${issueKey}`);
  }

  // --- Documents ---
  await takeScreenshot(page, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, "documents-templates", `/${orgSlug}/documents/templates`);

  // --- Workspaces ---
  await takeScreenshot(page, "workspaces", `/${orgSlug}/workspaces`);

  const wsSlug = await discoverFirstHref(page, /\/workspaces\/([^/]+)/);
  if (wsSlug) {
    await takeScreenshot(page, `workspace-${wsSlug}`, `/${orgSlug}/workspaces/${wsSlug}`);

    const teamSlug = await discoverFirstHref(page, /\/teams\/([^/]+)/);
    if (teamSlug) {
      for (const tab of ["board", "backlog", "calendar", "settings"]) {
        await takeScreenshot(
          page,
          `team-${teamSlug}-${tab}`,
          `/${orgSlug}/workspaces/${wsSlug}/teams/${teamSlug}/${tab}`,
        );
      }
    }
  }

  // --- Time tracking ---
  await takeScreenshot(page, "time-tracking", `/${orgSlug}/time-tracking`);

  // --- Settings ---
  await takeScreenshot(page, "settings-profile", `/${orgSlug}/settings/profile`);

  // --- Public pages (no auth needed) ---
  await takeScreenshot(page, "landing", "/");
  await takeScreenshot(page, "signin", "/signin");

  console.log(`\nDone! ${index} screenshots saved to e2e/screenshots/\n`);
}

run().catch(console.error);
