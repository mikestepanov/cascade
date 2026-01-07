import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";
import { AUTH_PATHS, RBAC_TEST_CONFIG, TEST_USERS } from "../config";
import { ProjectsPage, WorkspacesPage } from "../pages";

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

function getRbacConfig(): { projectKey: string; companySlug: string } {
  try {
    if (fs.existsSync(RBAC_CONFIG_PATH)) {
      const content = fs.readFileSync(RBAC_CONFIG_PATH, "utf-8");
      const config: SavedRbacConfig = JSON.parse(content);
      if (config.projectKey && config.companySlug) {
        return { projectKey: config.projectKey, companySlug: config.companySlug };
      }
    }
  } catch {}
  return { projectKey: RBAC_TEST_CONFIG.projectKey, companySlug: RBAC_TEST_CONFIG.companySlug };
}

function getAuthPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin: AUTH_PATHS.teamLead,
    editor: AUTH_PATHS.teamMember,
    viewer: AUTH_PATHS.viewer,
  };
  return path.join(AUTH_DIR, path.basename(paths[role]));
}

function isAuthStateValid(role: UserRole): boolean {
  const authPath = getAuthPath(role);
  if (!fs.existsSync(authPath)) return false;
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
          if (hasAuthToken) return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export type RbacFixtures = {
  adminContext: BrowserContext;
  adminPage: Page;
  adminProjectsPage: ProjectsPage;
  adminWorkspacesPage: WorkspacesPage;

  editorContext: BrowserContext;
  editorPage: Page;
  editorProjectsPage: ProjectsPage;
  editorWorkspacesPage: WorkspacesPage;

  viewerContext: BrowserContext;
  viewerPage: Page;
  viewerProjectsPage: ProjectsPage;
  viewerWorkspacesPage: WorkspacesPage;

  rbacProjectKey: string;
  rbacProjectUrl: string;
  rbacCompanySlug: string;
  gotoRbacProject: (page: Page) => Promise<void>;
};

export const rbacTest = base.extend<RbacFixtures>({
  adminContext: async ({ browser }, use) => {
    if (!isAuthStateValid("admin")) throw new Error("Admin auth state not found.");
    const context = await browser.newContext({ storageState: getAuthPath("admin") });
    await use(context);
    await context.close();
  },
  editorContext: async ({ browser }, use) => {
    if (!isAuthStateValid("editor")) throw new Error("Editor auth state not found.");
    const context = await browser.newContext({ storageState: getAuthPath("editor") });
    await use(context);
    await context.close();
  },
  viewerContext: async ({ browser }, use) => {
    if (!isAuthStateValid("viewer")) throw new Error("Viewer auth state not found.");
    const context = await browser.newContext({ storageState: getAuthPath("viewer") });
    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
  adminProjectsPage: async ({ adminPage }, use) => {
    // Add re-auth check for admin (handle redirect to landing page)
    const targetUrl = adminPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await adminPage.goto("/nixelo-e2e/dashboard");
      await adminPage.waitForLoadState("networkidle");
      await adminPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(adminPage));
  },
  adminWorkspacesPage: async ({ adminPage }, use) => {
    await use(new WorkspacesPage(adminPage));
  },

  editorPage: async ({ editorContext }, use) => {
    const page = await editorContext.newPage();
    await use(page);
    await page.close();
  },
  editorProjectsPage: async ({ editorPage }, use) => {
    // Add re-auth check for editor
    const targetUrl = editorPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await editorPage.goto("/nixelo-e2e/dashboard");
      await editorPage.waitForLoadState("networkidle");
      await editorPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(editorPage));
  },
  editorWorkspacesPage: async ({ editorPage }, use) => {
    await use(new WorkspacesPage(editorPage));
  },

  viewerPage: async ({ viewerContext }, use) => {
    const page = await viewerContext.newPage();
    await use(page);
    await page.close();
  },
  viewerProjectsPage: async ({ viewerPage }, use) => {
    // Add re-auth check for viewer
    const targetUrl = viewerPage.url();
    if (targetUrl === "http://localhost:5555/" || targetUrl.endsWith("/signin")) {
      await viewerPage.goto("/nixelo-e2e/dashboard");
      await viewerPage.waitForLoadState("networkidle");
      await viewerPage.waitForTimeout(1000);
    }
    await use(new ProjectsPage(viewerPage));
  },
  viewerWorkspacesPage: async ({ viewerPage }, use) => {
    await use(new WorkspacesPage(viewerPage));
  },

  rbacProjectKey: async ({}, use) => {
    await use(getRbacConfig().projectKey);
  },

  rbacCompanySlug: async ({}, use) => {
    await use(getRbacConfig().companySlug);
  },
  rbacProjectUrl: async ({ rbacCompanySlug, rbacProjectKey }, use) => {
    await use(`/${rbacCompanySlug}/projects/${rbacProjectKey}/board`);
  },

  gotoRbacProject: async ({ rbacCompanySlug, rbacProjectKey }, use) => {
    const goto = async (page: Page) => {
      const targetUrl = `/${rbacCompanySlug}/projects/${rbacProjectKey}/board`;

      // 1. "Pre-warm" the session by visiting the public landing page first.
      // This allows the Convex auth client to initialize and hydrate the session from localStorage
      // in a safe environment where no redirects will occur.
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Optional: Verify we have storage state injected (sanity check)
      await page.evaluate(() => {
        // Just ensuring JS execution works and storage is potentially available
        return window.localStorage.length;
      });

      // 2. Now navigate to the protected route.
      // Auth state should be ready, preventing false-positive redirects.
      await page.goto(targetUrl);

      // 3. Verify successful navigation
      try {
        await expect(page).toHaveURL(/.*\/board/, { timeout: 20000 });
      } catch (e) {
        // Diagnostic error if we still fail
        const url = page.url();
        if (url.includes("/signin")) {
          throw new Error(
            `Session lost: Redirected to signin during RBAC navigation to ${targetUrl}. Auth hydration failed.`,
          );
        }
        throw e;
      }

      await page.waitForLoadState("domcontentloaded");
    };
    await use(goto);
  },
});

export { expect };

export function hasAdminAuth(): boolean {
  return isAuthStateValid("admin");
}
export function hasEditorAuth(): boolean {
  return isAuthStateValid("editor");
}
export function hasViewerAuth(): boolean {
  return isAuthStateValid("viewer");
}

export const RBAC_USERS = {
  admin: { email: TEST_USERS.teamLead.email, role: "admin" as const, description: "Project admin" },
  editor: { email: TEST_USERS.teamMember.email, role: "editor" as const, description: "Editor" },
  viewer: { email: TEST_USERS.viewer.email, role: "viewer" as const, description: "Viewer" },
};
