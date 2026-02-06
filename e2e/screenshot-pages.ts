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
 *   pnpm screenshots                # auto-detect color scheme
 *   pnpm screenshots:light-mode     # force light mode
 *   pnpm screenshots -- --light     # force light mode (explicit)
 *   pnpm screenshots -- --headed    # visible browser
 *
 * Requires dev server running (pnpm dev).
 * Automatically creates a test user, logs in via API, and screenshots every page.
 * Screenshots are saved to e2e/screenshots/ with numbered filenames.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
// Env loaded via --env-file=.env.local in the npm script
import { TEST_USERS } from "./config";
import { type SeedScreenshotResult, testUserService } from "./utils/test-user-service";

const BASE_URL = process.env.BASE_URL || "http://localhost:5555";
const CONVEX_URL = process.env.VITE_CONVEX_URL || "";
const SCREENSHOT_DIR = path.join(process.cwd(), "e2e", "screenshots");
const VIEWPORT = { width: 1920, height: 1080 };
const SETTLE_MS = 2500;

// CLI flags
const COLOR_SCHEME: "light" | "dark" | "no-preference" = process.argv.includes("--light")
  ? "light"
  : process.argv.includes("--dark")
    ? "dark"
    : "no-preference";

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
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
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
  await takeScreenshot(page, p, "settings", `/${orgSlug}/settings`);
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

    // Calendar view-mode screenshots (day, week, month)
    console.log(`\n  Calendar views:\n`);
    const calendarUrl = `/${orgSlug}/projects/${projectKey}/calendar`;
    try {
      await page.goto(`${BASE_URL}${calendarUrl}`, { waitUntil: "networkidle", timeout: 15000 });
    } catch {
      // networkidle often times out
    }
    await page.waitForTimeout(SETTLE_MS);

    // Calendar view-mode screenshots: day, week, month
    // Toggle items have data-testid="calendar-mode-{day|week|month}".
    for (const mode of ["day", "week", "month"] as const) {
      const toggleItem = page.getByTestId(`calendar-mode-${mode}`);
      if ((await toggleItem.count()) > 0) {
        await toggleItem.first().click();
        await page.waitForTimeout(SETTLE_MS);
      }
      const n = nextIndex(p);
      const num = String(n).padStart(2, "0");
      const filename = `${num}-${p}-calendar-${mode}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
      totalScreenshots++;
      console.log(`  ${num}  [${p}] calendar-${mode}`);
    }

    // Event details modal screenshot — click first visible calendar event
    // Switch back to week view for the modal screenshot (events are most visible)
    const weekToggle = page.getByTestId("calendar-mode-week");
    if ((await weekToggle.count()) > 0) {
      await weekToggle.first().click();
      await page.waitForTimeout(SETTLE_MS);
    }
    // Events are rendered as tabIndex={0} divs with event titles
    const eventEl = page
      .locator("[tabindex='0']")
      .filter({ hasText: /Sprint Planning|Design Review|Focus Time|Standup/i });
    if ((await eventEl.count()) > 0) {
      await eventEl.first().click();
      await page.waitForTimeout(SETTLE_MS);
      const n = nextIndex(p);
      const num = String(n).padStart(2, "0");
      const filename = `${num}-${p}-calendar-event-modal.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
      totalScreenshots++;
      console.log(`  ${num}  [${p}] calendar-event-modal`);

      // Close the modal via Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
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
    const wsBase = `/${orgSlug}/workspaces/${wsSlug}`;
    await takeScreenshot(page, p, `workspace-${wsSlug}`, wsBase);
    await takeScreenshot(page, p, `workspace-${wsSlug}-settings`, `${wsBase}/settings`);

    // Try seed-provided team slug first, fall back to discovery
    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      const teamBase = `${wsBase}/teams/${resolvedTeam}`;
      const teamTabs = ["board", "calendar", "settings"] as const;
      // Team index (projects list)
      await takeScreenshot(page, p, `team-${resolvedTeam}`, teamBase);
      for (const tab of teamTabs) {
        await takeScreenshot(page, p, `team-${resolvedTeam}-${tab}`, `${teamBase}/${tab}`);
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

  // Document editor (discover first document link from the documents page)
  await page
    .goto(`${BASE_URL}/${orgSlug}/documents`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    })
    .catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
  const docId = await discoverFirstHref(page, /\/documents\/([a-z0-9]+)/);
  if (docId) {
    await takeScreenshot(page, p, "document-editor", `/${orgSlug}/documents/${docId}`);
  }

  // Public pages (landing + signin + invite) captured in pre-login phase too
  await takeScreenshot(page, p, "landing", "/");
  await takeScreenshot(page, p, "signin", "/signin");
  await takeScreenshot(page, p, "invite-invalid", "/invite/screenshot-test-token");

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

  console.log(`\n  Base URL:       ${BASE_URL}`);
  console.log(`  Output dir:    ${SCREENSHOT_DIR}`);
  console.log(`  Color scheme:  ${COLOR_SCHEME}\n`);

  const headless = !process.argv.includes("--headed");
  const authStatePath = path.join(process.cwd(), "e2e", ".auth", "user-teamlead-0.json");
  const hasStoredAuth = fs.existsSync(authStatePath);

  const browser = await chromium.launch({ headless });

  // First context: no auth, for public pages
  const publicContext = await browser.newContext({ viewport: VIEWPORT, colorScheme: COLOR_SCHEME });
  const publicPage = await publicContext.newPage();

  // Capture public pages before login
  console.log("--- Pre-login: Public pages ---\n");
  await takeScreenshot(publicPage, "empty", "landing", "/");
  await takeScreenshot(publicPage, "empty", "signin", "/signin");
  await takeScreenshot(publicPage, "empty", "invite-invalid", "/invite/screenshot-test-token");
  console.log("");
  await publicContext.close();

  // Second context: with auth
  let orgSlug: string | null = null;
  let page: Page;
  let context: BrowserContext;

  // Try saved auth state first (like regular E2E tests)
  if (hasStoredAuth) {
    console.log("  Using saved auth state from .auth/user-teamlead-0.json...");
    context = await browser.newContext({
      viewport: VIEWPORT,
      colorScheme: COLOR_SCHEME,
      storageState: authStatePath,
    });
    page = await context.newPage();

    // Navigate to /app and wait for redirect
    await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForURL((u) => /\/[^/]+\/(dashboard|projects|issues)/.test(new URL(u).pathname), {
        timeout: 15000,
      });
      await page.waitForTimeout(2000);
      orgSlug = new URL(page.url()).pathname.split("/").filter(Boolean)[0];
      console.log(`  Logged in via stored auth. Org: ${orgSlug}\n`);
    } catch {
      console.log("  Stored auth expired or invalid. Falling back to API login...\n");
      await context.close();
    }
  }

  // Fallback to API login if stored auth didn't work
  if (!orgSlug && CONVEX_URL) {
    context = await browser.newContext({ viewport: VIEWPORT, colorScheme: COLOR_SCHEME });
    page = await context.newPage();
    orgSlug = await autoLogin(page);
  }

  if (!orgSlug) {
    // Reopen headed so user can interact
    await browser.close();
    const fallbackBrowser = await chromium.launch({ headless: false });
    const fallbackContext = await fallbackBrowser.newContext({
      viewport: VIEWPORT,
      colorScheme: COLOR_SCHEME,
    });
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
