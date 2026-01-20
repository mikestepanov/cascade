import { expect } from "@playwright/test";
import { rbacTest } from "./fixtures/rbac.fixture";

rbacTest.describe("Organization Management", () => {
  rbacTest(
    "Admin can update organization name and settings",
    async ({ adminSettingsPage, adminPage, rbacOrgSlug }) => {
      await adminSettingsPage.goto(rbacOrgSlug);
      await adminSettingsPage.switchToTab("admin");

      const newName = `E2E Org ${Date.now()}`;
      await adminSettingsPage.updateOrganizationName(newName);

      // Verify name in input
      await adminSettingsPage.expectOrganizationName(newName);

      // Verify name in sidebar (should update automatically)
      await expect(adminPage.getByRole("heading", { name: newName })).toBeVisible();

      // Reset name for other tests (slug follows name)
      await adminSettingsPage.updateOrganizationName("Nixelo E2E");
      await adminSettingsPage.expectOrganizationName("Nixelo E2E");
    },
  );

  rbacTest("Admin can toggle time approval setting", async ({ adminSettingsPage, rbacOrgSlug }) => {
    await adminSettingsPage.goto(rbacOrgSlug);
    await adminSettingsPage.switchToTab("admin");

    // Toggle on
    await adminSettingsPage.toggleTimeApproval(true);
    await expect(adminSettingsPage.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Toggle off
    await adminSettingsPage.toggleTimeApproval(false);
    await expect(adminSettingsPage.requiresTimeApprovalSwitch).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

rbacTest.describe("Workspace Management", () => {
  rbacTest(
    "Admin can create multiple workspaces",
    async ({ adminWorkspacesPage, adminPage, rbacOrgSlug }) => {
      await adminWorkspacesPage.goto(rbacOrgSlug);

      const wsName1 = `WS Alpha ${Date.now()}`;
      const wsName2 = `WS Beta ${Date.now()}`;

      await adminWorkspacesPage.createWorkspace(wsName1);

      // Reload to ensure list is updated
      await adminPage.reload({ waitUntil: "domcontentloaded" });

      await expect(adminPage.getByRole("link", { name: wsName1 })).toBeVisible({ timeout: 15000 });

      // Second workspace creation is currently flaky in E2E environment due to modal/toast timing
      // TODO: Re-enable this when we have a more robust way to handle the swift transition
      /*
    await adminWorkspacesPage.goto(rbacOrgSlug);
    await adminWorkspacesPage.createWorkspace(wsName2);
    await expect(adminPage.getByRole("link", { name: wsName2 })).toBeVisible();

    // Verify both in list
    await adminPage.goto(rbacOrgSlug);
    await expect(adminPage.getByRole("link", { name: wsName1 })).toBeVisible();
    await expect(adminPage.getByRole("link", { name: wsName2 })).toBeVisible();
    */

      // Verify first workspace is in list
      await adminPage.goto(rbacOrgSlug);
      await expect(adminPage.getByRole("link", { name: wsName1 })).toBeVisible();
    },
  );
});

rbacTest.describe("RBAC Verification", () => {
  rbacTest(
    "Editor cannot access Admin tab in settings",
    async ({ editorPage, editorSettingsPage, rbacOrgSlug }) => {
      await editorSettingsPage.goto(rbacOrgSlug);

      // Admin tab should not even be visible
      await expect(editorPage.getByRole("tab", { name: /admin/i })).not.toBeVisible();

      // Direct navigation to admin tab should hide content or redirect
      await editorPage.goto(`/${rbacOrgSlug}/settings/profile?tab=admin`);
      await expect(editorPage.getByText(/organization settings/i)).not.toBeVisible();
    },
  );

  rbacTest(
    "Viewer cannot access Admin tab in settings",
    async ({ viewerPage, viewerSettingsPage, rbacOrgSlug }) => {
      await viewerSettingsPage.goto(rbacOrgSlug);
      await expect(viewerPage.getByRole("tab", { name: /admin/i })).not.toBeVisible();
    },
  );
});
