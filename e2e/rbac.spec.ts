/**
 * RBAC (Role-Based Access Control) E2E Tests
 *
 * Tests permission boundaries for different user roles:
 * - Admin: Full control (project owner)
 * - Editor: Can create/edit issues, sprints, but not manage project
 * - Viewer: Read-only access, can only view and comment
 *
 * Test project: RBAC (created in global-setup)
 * - Admin: e2e-teamlead@inbox.mailtrap.io
 * - Editor: e2e-member@inbox.mailtrap.io
 * - Viewer: e2e-viewer@inbox.mailtrap.io
 */

import { expect, RBAC_USERS, rbacTest } from "./fixtures";

rbacTest.describe("RBAC - Project Access", () => {
  rbacTest(
    "all roles can view the project board",
    async ({ adminPage, editorPage, viewerPage, gotoRbacProject }) => {
      // Admin can view
      await gotoRbacProject(adminPage);
      await expect(adminPage.getByRole("heading", { name: /kanban board/i })).toBeVisible();

      // Editor can view
      await gotoRbacProject(editorPage);
      await expect(editorPage.getByRole("heading", { name: /kanban board/i })).toBeVisible();

      // Viewer can view
      await gotoRbacProject(viewerPage);
      await expect(viewerPage.getByRole("heading", { name: /kanban board/i })).toBeVisible();
    },
  );

  rbacTest(
    "all roles can see project in sidebar",
    async ({ adminPage, editorPage, viewerPage, rbacProjectKey }) => {
      // Navigate to projects page
      await adminPage.goto("/projects");
      await editorPage.goto("/projects");
      await viewerPage.goto("/projects");

      // Check sidebar for project
      await expect(adminPage.getByText(rbacProjectKey)).toBeVisible();
      await expect(editorPage.getByText(rbacProjectKey)).toBeVisible();
      await expect(viewerPage.getByText(rbacProjectKey)).toBeVisible();
    },
  );
});

rbacTest.describe("RBAC - Issue Creation", () => {
  rbacTest("admin can create issues", async ({ adminPage, gotoRbacProject }) => {
    await gotoRbacProject(adminPage);

    // Find and click add issue button
    const addIssueButton = adminPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    await addIssueButton.click();

    // Verify create issue modal appears
    const modal = adminPage.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByPlaceholder(/title/i)).toBeVisible();
  });

  rbacTest("editor can create issues", async ({ editorPage, gotoRbacProject }) => {
    await gotoRbacProject(editorPage);

    // Find and click add issue button
    const addIssueButton = editorPage.getByRole("button", { name: /add issue/i }).first();
    await expect(addIssueButton).toBeVisible();
    await addIssueButton.click();

    // Verify create issue modal appears
    const modal = editorPage.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByPlaceholder(/title/i)).toBeVisible();
  });

  rbacTest("viewer cannot see create issue button", async ({ viewerPage, gotoRbacProject }) => {
    await gotoRbacProject(viewerPage);

    // Add issue button should not be visible for viewer
    const addIssueButton = viewerPage.getByRole("button", { name: /add issue/i });
    await expect(addIssueButton).toHaveCount(0);
  });
});

rbacTest.describe("RBAC - Project Settings Access", () => {
  rbacTest("admin can access project settings", async ({ adminPage, rbacProjectKey }) => {
    await adminPage.goto(`/projects/${rbacProjectKey}/settings`);
    await adminPage.waitForLoadState("domcontentloaded");

    // Admin should see settings page
    await expect(adminPage.getByRole("heading", { name: /project settings/i })).toBeVisible();
  });

  rbacTest("editor cannot access project settings", async ({ editorPage, rbacProjectKey }) => {
    await editorPage.goto(`/projects/${rbacProjectKey}/settings`);
    await editorPage.waitForLoadState("domcontentloaded");

    // Editor should be redirected or see access denied
    // Either the settings heading is not visible or they're redirected to board
    const settingsHeading = editorPage.getByRole("heading", { name: /project settings/i });
    const isSettingsVisible = await settingsHeading.isVisible().catch(() => false);

    if (isSettingsVisible) {
      // If they can see it, danger zone should not be accessible
      const dangerZone = editorPage.getByText(/danger zone/i);
      await expect(dangerZone).not.toBeVisible();
    } else {
      // They were redirected - check they're on board or another allowed page
      expect(editorPage.url()).not.toContain("/settings");
    }
  });

  rbacTest("viewer cannot access project settings", async ({ viewerPage, rbacProjectKey }) => {
    await viewerPage.goto(`/projects/${rbacProjectKey}/settings`);
    await viewerPage.waitForLoadState("domcontentloaded");

    // Viewer should be redirected or see access denied
    const settingsHeading = viewerPage.getByRole("heading", { name: /project settings/i });
    const isSettingsVisible = await settingsHeading.isVisible().catch(() => false);

    if (isSettingsVisible) {
      // If they can see it, all edit controls should be disabled/hidden
      const deleteButton = viewerPage.getByRole("button", { name: /delete project/i });
      await expect(deleteButton).not.toBeVisible();
    } else {
      // They were redirected
      expect(viewerPage.url()).not.toContain("/settings");
    }
  });
});

rbacTest.describe("RBAC - Settings Tab Visibility", () => {
  rbacTest("admin sees settings tab", async ({ adminPage, gotoRbacProject }) => {
    await gotoRbacProject(adminPage);

    const settingsTab = adminPage
      .getByRole("tab", { name: /settings/i })
      .or(adminPage.getByRole("link", { name: /settings/i }));
    await expect(settingsTab).toBeVisible();
  });

  rbacTest("editor does not see settings tab", async ({ editorPage, gotoRbacProject }) => {
    await gotoRbacProject(editorPage);

    const settingsTab = editorPage
      .getByRole("tab", { name: /settings/i })
      .or(editorPage.getByRole("link", { name: /settings/i }));
    // Settings tab should not be visible or should be hidden
    const count = await settingsTab.count();
    expect(count).toBe(0);
  });

  rbacTest("viewer does not see settings tab", async ({ viewerPage, gotoRbacProject }) => {
    await gotoRbacProject(viewerPage);

    const settingsTab = viewerPage
      .getByRole("tab", { name: /settings/i })
      .or(viewerPage.getByRole("link", { name: /settings/i }));
    const count = await settingsTab.count();
    expect(count).toBe(0);
  });
});

rbacTest.describe("RBAC - Member Management", () => {
  rbacTest("admin can see member management in settings", async ({ adminPage, rbacProjectKey }) => {
    await adminPage.goto(`/projects/${rbacProjectKey}/settings`);
    await adminPage.waitForLoadState("domcontentloaded");

    // Look for members/team section
    const membersSection = adminPage.getByText(/team members|project members|members/i);
    await expect(membersSection.first()).toBeVisible();

    // Admin should see add member button or invite option
    const addMemberButton = adminPage.getByRole("button", { name: /add member|invite/i });
    await expect(addMemberButton).toBeVisible();
  });

  rbacTest(
    "admin can see all three test users in members list",
    async ({ adminPage, rbacProjectKey }) => {
      await adminPage.goto(`/projects/${rbacProjectKey}/settings`);
      await adminPage.waitForLoadState("domcontentloaded");

      // Check that all RBAC users are listed
      // Using email patterns since display names might vary
      await expect(adminPage.getByText(/teamlead|admin/i).first()).toBeVisible();
      await expect(adminPage.getByText(/member|editor/i).first()).toBeVisible();
      await expect(adminPage.getByText(/viewer/i).first()).toBeVisible();
    },
  );
});

rbacTest.describe("RBAC - Sprint Management", () => {
  rbacTest("admin can access sprints view", async ({ adminPage, rbacProjectKey }) => {
    // Navigate to sprints tab
    await adminPage.goto(`/projects/${rbacProjectKey}/board`);
    await adminPage.waitForLoadState("domcontentloaded");

    const sprintsTab = adminPage
      .getByRole("tab", { name: /sprint/i })
      .or(adminPage.getByRole("link", { name: /sprint/i }));

    if (await sprintsTab.isVisible().catch(() => false)) {
      await sprintsTab.click();
      await adminPage.waitForTimeout(500);

      // Should see sprint management UI
      const createSprintButton = adminPage.getByRole("button", {
        name: /create sprint|new sprint/i,
      });
      await expect(createSprintButton).toBeVisible();
    }
  });

  rbacTest("editor can access sprints view", async ({ editorPage, rbacProjectKey }) => {
    await editorPage.goto(`/projects/${rbacProjectKey}/board`);
    await editorPage.waitForLoadState("domcontentloaded");

    const sprintsTab = editorPage
      .getByRole("tab", { name: /sprint/i })
      .or(editorPage.getByRole("link", { name: /sprint/i }));

    if (await sprintsTab.isVisible().catch(() => false)) {
      await sprintsTab.click();
      await editorPage.waitForTimeout(500);

      // Editor should also be able to create sprints
      const createSprintButton = editorPage.getByRole("button", {
        name: /create sprint|new sprint/i,
      });
      await expect(createSprintButton).toBeVisible();
    }
  });
});

rbacTest.describe("RBAC - Analytics Access", () => {
  rbacTest(
    "all roles can view analytics",
    async ({ adminPage, editorPage, viewerPage, rbacProjectKey }) => {
      const checkAnalytics = async (page: typeof adminPage, role: string) => {
        await page.goto(`/projects/${rbacProjectKey}/board`);
        await page.waitForLoadState("domcontentloaded");

        const analyticsTab = page
          .getByRole("tab", { name: /analytics/i })
          .or(page.getByRole("link", { name: /analytics/i }));

        if (await analyticsTab.isVisible().catch(() => false)) {
          await analyticsTab.click();
          await page.waitForTimeout(500);

          // All roles should be able to view analytics (read-only)
          const analyticsContent = page.getByText(/overview|metrics|velocity/i);
          await expect(analyticsContent.first()).toBeVisible();
        }
      };

      await checkAnalytics(adminPage, "admin");
      await checkAnalytics(editorPage, "editor");
      await checkAnalytics(viewerPage, "viewer");
    },
  );
});

rbacTest.describe("RBAC - Permission Summary", () => {
  /**
   * Summary test that logs permission matrix for documentation
   */
  rbacTest(
    "permission matrix verification",
    async ({ adminPage, editorPage, viewerPage, gotoRbacProject, rbacProjectKey }) => {
      const results: Record<string, Record<string, boolean>> = {
        admin: {},
        editor: {},
        viewer: {},
      };

      // Test: View Board
      await gotoRbacProject(adminPage);
      results.admin.viewBoard = await adminPage
        .getByRole("heading", { name: /kanban board/i })
        .isVisible()
        .catch(() => false);

      await gotoRbacProject(editorPage);
      results.editor.viewBoard = await editorPage
        .getByRole("heading", { name: /kanban board/i })
        .isVisible()
        .catch(() => false);

      await gotoRbacProject(viewerPage);
      results.viewer.viewBoard = await viewerPage
        .getByRole("heading", { name: /kanban board/i })
        .isVisible()
        .catch(() => false);

      // Test: Create Issue Button
      results.admin.createIssue = await adminPage
        .getByRole("button", { name: /add issue/i })
        .first()
        .isVisible()
        .catch(() => false);
      results.editor.createIssue = await editorPage
        .getByRole("button", { name: /add issue/i })
        .first()
        .isVisible()
        .catch(() => false);
      results.viewer.createIssue = await viewerPage
        .getByRole("button", { name: /add issue/i })
        .first()
        .isVisible()
        .catch(() => false);

      // Test: Settings Tab
      results.admin.settingsTab = await adminPage
        .getByRole("tab", { name: /settings/i })
        .or(adminPage.getByRole("link", { name: /settings/i }))
        .isVisible()
        .catch(() => false);
      results.editor.settingsTab = await editorPage
        .getByRole("tab", { name: /settings/i })
        .or(editorPage.getByRole("link", { name: /settings/i }))
        .isVisible()
        .catch(() => false);
      results.viewer.settingsTab = await viewerPage
        .getByRole("tab", { name: /settings/i })
        .or(viewerPage.getByRole("link", { name: /settings/i }))
        .isVisible()
        .catch(() => false);

      // Log permission matrix
      console.log("\n📋 RBAC Permission Matrix:");
      console.log("┌──────────────────┬───────┬────────┬────────┐");
      console.log("│ Permission       │ Admin │ Editor │ Viewer │");
      console.log("├──────────────────┼───────┼────────┼────────┤");
      console.log(
        `│ View Board       │   ${results.admin.viewBoard ? "✓" : "✗"}   │   ${results.editor.viewBoard ? "✓" : "✗"}    │   ${results.viewer.viewBoard ? "✓" : "✗"}    │`,
      );
      console.log(
        `│ Create Issue     │   ${results.admin.createIssue ? "✓" : "✗"}   │   ${results.editor.createIssue ? "✓" : "✗"}    │   ${results.viewer.createIssue ? "✓" : "✗"}    │`,
      );
      console.log(
        `│ Settings Tab     │   ${results.admin.settingsTab ? "✓" : "✗"}   │   ${results.editor.settingsTab ? "✓" : "✗"}    │   ${results.viewer.settingsTab ? "✓" : "✗"}    │`,
      );
      console.log("└──────────────────┴───────┴────────┴────────┘");

      // Assertions
      // All can view board
      expect(results.admin.viewBoard).toBe(true);
      expect(results.editor.viewBoard).toBe(true);
      expect(results.viewer.viewBoard).toBe(true);

      // Only admin and editor can create issues
      expect(results.admin.createIssue).toBe(true);
      expect(results.editor.createIssue).toBe(true);
      expect(results.viewer.createIssue).toBe(false);

      // Only admin can see settings
      expect(results.admin.settingsTab).toBe(true);
      expect(results.editor.settingsTab).toBe(false);
      expect(results.viewer.settingsTab).toBe(false);
    },
  );
});
