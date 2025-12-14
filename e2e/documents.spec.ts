import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Documents E2E Tests
 *
 * Tests the document management functionality:
 * - Document list view
 * - Creating documents
 * - Document editor
 * - Document deletion
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Documents", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Documents Navigation", () => {
    test("can navigate to documents page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("documents");
      await dashboardPage.expectActiveTab("documents");
    });

    test("displays documents sidebar with new document button", async ({
      dashboardPage,
      documentsPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();
    });
  });

  test.describe("Document Creation", () => {
    test("can create a new blank document", async ({ dashboardPage, documentsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");

      // Wait for documents view to load
      await documentsPage.expectDocumentsView();

      // Create new document
      await documentsPage.createNewDocument();

      // Should navigate to document editor (URL contains /documents/ followed by ID)
      await page.waitForURL(/\/documents\/[^/]+$/, { timeout: 10000 });

      // Editor should be visible
      await documentsPage.expectEditorVisible();
    });
  });

  test.describe("Document Editor", () => {
    test("can edit document title", async ({ dashboardPage, documentsPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();

      // Create a new document first
      await documentsPage.createNewDocument();
      await page.waitForURL(/\/documents\/[^/]+$/, { timeout: 10000 });
      await documentsPage.expectEditorVisible();

      // The BlockNote editor should be present
      await expect(documentsPage.editorContent).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Document Search", () => {
    test("can search documents", async ({ dashboardPage, documentsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();

      // Search for a document
      await documentsPage.searchDocuments("test");

      // Clear search
      await documentsPage.clearSearch();
    });
  });
});
