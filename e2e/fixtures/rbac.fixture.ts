import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS } from "../config";
import { ProjectsPage } from "../pages";

/**
 * RBAC Test Fixtures
 *
 * Provides fixtures for testing role-based access control with multiple users.
 * Each user (admin, editor, viewer) has their own browser context with saved auth state.
 *
 * IMPORTANT: Each test gets fresh browser contexts created from the saved auth state files.
 * This is necessary because Convex auth uses refresh token rotation - once a token
 * is used, it gets rotated and the old one becomes invalid.
 *
 * Usage:
 *   rbacTest("viewer cannot create issues", async ({ viewerPage, viewerProjectsPage }) => {
 *     // Test with viewer's context
 *   });
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");
const RBAC_CONFIG_PATH = path.join(AUTH_DIR, "rbac-config.json");

type UserRole = "admin" | "editor" | "viewer";

interface SavedRbacConfig {
  projectKey: string;
  companySlug: string;
  projectId?: string;
  companyId?: string;
}

/**
 * Get RBAC config - reads from saved file (actual values from API) or falls back to static config
 */
function getRbacConfig(): { projectKey: string; companySlug: string } {
  try {
    if (fs.existsSync(RBAC_CONFIG_PATH)) {
      const content = fs.readFileSync(RBAC_CONFIG_PATH, "utf-8");
      const config: SavedRbacConfig = JSON.parse(content);
      if (config.projectKey && config.companySlug) {
        return { projectKey: config.projectKey, companySlug: config.companySlug };
      }
    }
  } catch {
    // Fall through to default
  }
  // Fallback to static config (should not happen if global-setup ran correctly)
  console.warn("⚠️ Could not read RBAC config from file, using static config");
  return { projectKey: RBAC_TEST_CONFIG.projectKey, companySlug: RBAC_TEST_CONFIG.companySlug };
}

/**
 * Get auth state path for a user role
 */
function getAuthPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin: AUTH_PATHS.teamLead,
    editor: AUTH_PATHS.teamMember,
    viewer: AUTH_PATHS.viewer,
  };
  return path.join(AUTH_DIR, path.basename(paths[role]));
}

/**
 * Check if auth state file exists and is valid
 */
function isAuthStateValid(role: UserRole): boolean {
  const authPath = getAuthPath(role);
  if (!fs.existsSync(authPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(authPath, "utf-8");
    const state = JSON.parse(content);

    if (state.origins && Array.isArray(state.origins)) {
      for (const origin of state.origins) {
        if (origin.localStorage && Array.isArray(origin.localStorage)) {
          const hasAuthToken = origin.localStorage.some(
            (item: { name: string }) =>
              item.name.includes("auth") ||
              item.name.includes("token") ||
              item.name.includes("convex"),
          );
          if (hasAuthToken) {
            return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

// Test-scoped fixtures type
export type RbacFixtures = {
  // Admin (project owner) - can do everything
  adminContext: BrowserContext;
  adminPage: Page;
  adminProjectsPage: ProjectsPage;

  // Editor - can create/edit issues, but not manage project
  editorContext: BrowserContext;
  editorPage: Page;
  editorProjectsPage: ProjectsPage;

  // Viewer - read-only access
  viewerContext: BrowserContext;
  viewerPage: Page;
  viewerProjectsPage: ProjectsPage;

  // RBAC project info
  rbacProjectKey: string;
  rbacProjectUrl: string;
  rbacCompanySlug: string;

  // Helper to navigate to RBAC project
  gotoRbacProject: (page: Page) => Promise<void>;
};

/**
 * RBAC Test fixture with multiple user contexts
 * All contexts and pages are TEST-scoped - fresh for each test
 */
export const rbacTest = base.extend<RbacFixtures>({
  // Test-scoped admin context - fresh for each test
  adminContext: async ({ browser }, use) => {
    if (!isAuthStateValid("admin")) {
      throw new Error("Admin auth state not found. Run global setup first.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("admin"),
    });
    await use(context);
    await context.close();
  },

  // Test-scoped editor context
  editorContext: async ({ browser }, use) => {
    if (!isAuthStateValid("editor")) {
      throw new Error("Editor auth state not found. Run global setup first.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("editor"),
    });
    await use(context);
    await context.close();
  },

  // Test-scoped viewer context
  viewerContext: async ({ browser }, use) => {
    if (!isAuthStateValid("viewer")) {
      throw new Error("Viewer auth state not found. Run global setup first.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("viewer"),
    });
    await use(context);
    await context.close();
  },

  // Test-scoped pages
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },

  adminProjectsPage: async ({ adminPage }, use) => {
    await use(new ProjectsPage(adminPage));
  },

  editorPage: async ({ editorContext }, use) => {
    const page = await editorContext.newPage();
    await use(page);
    await page.close();
  },

  editorProjectsPage: async ({ editorPage }, use) => {
    await use(new ProjectsPage(editorPage));
  },

  viewerPage: async ({ viewerContext }, use) => {
    const page = await viewerContext.newPage();
    await use(page);
    await page.close();
  },

  viewerProjectsPage: async ({ viewerPage }, use) => {
    await use(new ProjectsPage(viewerPage));
  },

  // RBAC project info - read from saved config (actual values from API)
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires object destructuring pattern
  rbacProjectKey: async ({}, use) => {
    const config = getRbacConfig();
    await use(config.projectKey);
  },

  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires object destructuring pattern
  rbacCompanySlug: async ({}, use) => {
    const config = getRbacConfig();
    await use(config.companySlug);
  },

  rbacProjectUrl: async ({ rbacCompanySlug, rbacProjectKey }, use) => {
    await use(`/${rbacCompanySlug}/projects/${rbacProjectKey}/board`);
  },

  // Helper to navigate to RBAC project with auth initialization
  gotoRbacProject: async ({ rbacCompanySlug, rbacProjectKey }, use) => {
    const goto = async (page: Page) => {
      const targetUrl = `/${rbacCompanySlug}/projects/${rbacProjectKey}/board`;

      // Navigate directly to target - auth tokens should be in localStorage from storageState
      await page.goto(targetUrl);
      await page.waitForLoadState("networkidle");

      // Wait for auth to process and Convex queries to complete
      await page.waitForTimeout(2000);

      // Check if we got redirected to landing page (auth not working)
      const currentUrl = page.url();
      if (currentUrl === "http://localhost:5555/" || currentUrl.endsWith("/signin")) {
        throw new Error(
          `Auth failed: redirected to ${currentUrl}. Check that global-setup ran correctly.`,
        );
      }
    };
    await use(goto);
  },
});

export { expect };

/**
 * User info for reference in tests
 */
export const RBAC_USERS = {
  admin: {
    email: TEST_USERS.teamLead.email,
    role: "admin" as const,
    description: "Project admin - full control",
  },
  editor: {
    email: TEST_USERS.teamMember.email,
    role: "editor" as const,
    description: "Editor - can create/edit issues",
  },
  viewer: {
    email: TEST_USERS.viewer.email,
    role: "viewer" as const,
    description: "Viewer - read-only access",
  },
};
