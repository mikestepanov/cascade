/**
 * Two-pass visual screenshot tool for reviewing all app pages.
 *
 * Pass 1 (empty): Screenshots top-level pages before any data is seeded.
 * Pass 2 (filled): Seeds data via E2E endpoint, then screenshots all pages + sub-pages.
 *
 * Output filenames are prefixed for easy visual comparison:
 *   01-empty-dashboard.png  vs  01-filled-dashboard.png
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
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");
const VIEWPORT = { width: 1920, height: 1080 };
const SETTLE_MS = 2500;

const SCREENSHOT_USER = {
  email: TEST_USERS.teamLead.email.replace("@", "-screenshots@"),
  password: TEST_USERS.teamLead.password,
};

// Per-prefix counters for numbered filenames
const counters = new Map<string, number>();

function nextIndex(prefix: string): number {
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return n;
}

let totalScreenshots = 0;

async function takeScreenshot(
  page: Page,
  prefix: string,
  name: string,
  url: string,
): Promise<void> {
  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const filename = `${num}-${prefix}-${name}.png`;
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    // networkidle often times out on real-time apps -- page is still usable
  }
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
  totalScreenshots++;
  console.log(`  ${num}  [${prefix}] ${name}`);
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

// ---------------------------------------------------------------------------
// Pass 1: Empty state screenshots (top-level pages only, no data seeded)
// ---------------------------------------------------------------------------
async function screenshotEmpty(page: Page, orgSlug: string): Promise<void> {
  const p = "empty";
  console.log("--- Pass 1: Empty states ---\n");

  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);

  console.log("");
}

// ---------------------------------------------------------------------------
// Pass 2: Filled state screenshots (all pages + sub-pages with seeded data)
// ---------------------------------------------------------------------------
async function screenshotFilled(
  page: Page,
  orgSlug: string,
  seed: SeedScreenshotResult,
): Promise<void> {
  const p = "filled";
  console.log("--- Pass 2: Filled states ---\n");

  // Top-level pages
  await takeScreenshot(page, p, "dashboard", `/${orgSlug}/dashboard`);
  await takeScreenshot(page, p, "projects", `/${orgSlug}/projects`);
  await takeScreenshot(page, p, "issues", `/${orgSlug}/issues`);
  await takeScreenshot(page, p, "documents", `/${orgSlug}/documents`);
  await takeScreenshot(page, p, "documents-templates", `/${orgSlug}/documents/templates`);
  await takeScreenshot(page, p, "workspaces", `/${orgSlug}/workspaces`);
  await takeScreenshot(page, p, "time-tracking", `/${orgSlug}/time-tracking`);
  await takeScreenshot(page, p, "settings-profile", `/${orgSlug}/settings/profile`);

  // Project sub-pages (deterministic using seed data)
  const projectKey = seed.projectKey;
  if (projectKey) {
    console.log(`\n  Project: ${projectKey}\n`);
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
        p,
        `project-${projectKey.toLowerCase()}-${tab}`,
        `/${orgSlug}/projects/${projectKey}/${tab}`,
      );
    }
  }

  // Issue detail (deterministic using first seeded issue)
  const firstIssue = seed.issueKeys?.[0];
  if (firstIssue) {
    await takeScreenshot(
      page,
      p,
      `issue-${firstIssue.toLowerCase()}`,
      `/${orgSlug}/issues/${firstIssue}`,
    );
  }

  // Workspace & team sub-pages
  const wsSlug = seed.workspaceSlug;
  const teamSlug = seed.teamSlug;

  if (wsSlug) {
    await takeScreenshot(page, p, `workspace-${wsSlug}`, `/${orgSlug}/workspaces/${wsSlug}`);

    // Try seed-provided team slug first, fall back to discovery
    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      for (const tab of ["board"]) {
        await takeScreenshot(
          page,
          p,
          `team-${resolvedTeam}-${tab}`,
          `/${orgSlug}/workspaces/${wsSlug}/teams/${resolvedTeam}/${tab}`,
        );
      }
    }
  } else {
    // No seed workspace — try discovery
    await takeScreenshot(page, p, "workspaces-nav", `/${orgSlug}/workspaces`);
    const discoveredWs = await discoverFirstHref(page, /\/workspaces\/([^/]+)/);
    if (discoveredWs) {
      await takeScreenshot(
        page,
        p,
        `workspace-${discoveredWs}`,
        `/${orgSlug}/workspaces/${discoveredWs}`,
      );
    }
  }

  // Public pages (landing + signin) captured in pre-login phase
  await takeScreenshot(page, p, "landing", "/");
  await takeScreenshot(page, p, "signin", "/signin");

  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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

  // Capture public pages before login
  console.log("--- Pre-login: Public pages ---\n");
  await takeScreenshot(page, "empty", "landing", "/");
  await takeScreenshot(page, "empty", "signin", "/signin");
  console.log("");

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
    // Fallback: single-pass (filled only) since we can't seed via API without CONVEX_URL
    console.log("  Manual login — running filled pass only (no seed endpoint available)\n");
    const emptySeed: SeedScreenshotResult = { success: false };
    await screenshotFilled(fallbackPage, orgSlug, emptySeed);
    await fallbackBrowser.close();
    return;
  }

  // Pass 1: Empty state
  await screenshotEmpty(page, orgSlug);

  // Seed data for filled state
  console.log("  Seeding screenshot data...");
  const seedResult = await testUserService.seedScreenshotData(SCREENSHOT_USER.email);
  if (!seedResult.success) {
    console.error(`  Seed failed: ${seedResult.error}`);
    console.log("  Continuing with filled pass anyway (may show empty states)\n");
  } else {
    console.log(
      `  Seeded: project=${seedResult.projectKey}, issues=${seedResult.issueKeys?.length ?? 0}\n`,
    );
  }

  // Reload to ensure Convex reactivity has propagated
  try {
    await page.goto(`${BASE_URL}/${orgSlug}/dashboard`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
  } catch {
    // networkidle often times out on real-time apps
  }
  await page.waitForTimeout(3000);

  // Pass 2: Filled state
  await screenshotFilled(page, orgSlug, seedResult);

  await browser.close();
  console.log(`Done! ${totalScreenshots} screenshots saved to e2e/screenshots/\n`);
}

run().catch(console.error);
