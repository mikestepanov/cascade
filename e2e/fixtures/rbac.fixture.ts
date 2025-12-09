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
 * Usage:
 *   rbacTest("viewer cannot create issues", async ({ viewerPage, viewerProjectsPage }) => {
 *     // Test with viewer's context
 *   });
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, "../.auth");

type UserRole = "admin" | "editor" | "viewer";

interface UserContext {
  context: BrowserContext;
  page: Page;
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
 */
export const rbacTest = base.extend<RbacFixtures>({
  // Admin context and page
  adminContext: async ({ browser }, use, testInfo) => {
    if (!isAuthStateValid("admin")) {
      testInfo.skip(true, "Admin auth state not found. Run global setup with RBAC users enabled.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("admin"),
    });
    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
  },

  adminProjectsPage: async ({ adminPage }, use) => {
    await use(new ProjectsPage(adminPage));
  },

  // Editor context and page
  editorContext: async ({ browser }, use, testInfo) => {
    if (!isAuthStateValid("editor")) {
      testInfo.skip(true, "Editor auth state not found. Run global setup with RBAC users enabled.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("editor"),
    });
    await use(context);
    await context.close();
  },

  editorPage: async ({ editorContext }, use) => {
    const page = await editorContext.newPage();
    await use(page);
  },

  editorProjectsPage: async ({ editorPage }, use) => {
    await use(new ProjectsPage(editorPage));
  },

  // Viewer context and page
  viewerContext: async ({ browser }, use, testInfo) => {
    if (!isAuthStateValid("viewer")) {
      testInfo.skip(true, "Viewer auth state not found. Run global setup with RBAC users enabled.");
    }
    const context = await browser.newContext({
      storageState: getAuthPath("viewer"),
    });
    await use(context);
    await context.close();
  },

  viewerPage: async ({ viewerContext }, use) => {
    const page = await viewerContext.newPage();
    await use(page);
  },

  viewerProjectsPage: async ({ viewerPage }, use) => {
    await use(new ProjectsPage(viewerPage));
  },

  // RBAC project info
  rbacProjectKey: RBAC_TEST_CONFIG.projectKey,

  rbacCompanySlug: RBAC_TEST_CONFIG.companySlug,

  rbacProjectUrl: `/${RBAC_TEST_CONFIG.companySlug}/projects/${RBAC_TEST_CONFIG.projectKey}/board`,

  // Helper to navigate to RBAC project
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture requires object destructuring pattern
  gotoRbacProject: async ({}, use) => {
    const goto = async (page: Page) => {
      await page.goto(
        `/${RBAC_TEST_CONFIG.companySlug}/projects/${RBAC_TEST_CONFIG.projectKey}/board`,
      );
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
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
