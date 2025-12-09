/**
 * Test User Service
 *
 * Encapsulates all E2E API calls for test user management.
 * Single source of truth for API interactions.
 */

import { E2E_ENDPOINTS, getE2EHeaders, type TestUser } from "../config";

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  existing?: boolean;
  error?: string;
}

export interface RbacProjectConfig {
  projectKey: string;
  adminEmail: string;
  editorEmail: string;
  viewerEmail: string;
}

export interface RbacProjectResult {
  success: boolean;
  projectKey?: string;
  projectId?: string;
  error?: string;
}

/**
 * Service class for E2E test user API operations
 */
export class TestUserService {
  /**
   * Delete a test user via E2E API
   */
  async deleteTestUser(email: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.deleteTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to delete user ${email}:`, error);
      return false;
    }
  }

  /**
   * Create a test user via E2E API (with password hash - bypasses email verification)
   */
  async createTestUser(
    email: string,
    password: string,
    skipOnboarding = false,
  ): Promise<CreateUserResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.createTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, password, skipOnboarding }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`  ⚠️ Failed to create user ${email}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Verify a test user's email via E2E API
   */
  async verifyTestUser(email: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.verifyTestUser, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return result.success === true && result.verified === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to verify user ${email}:`, error);
      return false;
    }
  }

  /**
   * Setup RBAC test project with users in different roles
   */
  async setupRbacProject(config: RbacProjectConfig): Promise<RbacProjectResult> {
    try {
      const response = await fetch(E2E_ENDPOINTS.setupRbacProject, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify(config),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`  ⚠️ Failed to setup RBAC project:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Cleanup RBAC test project
   */
  async cleanupRbacProject(projectKey: string): Promise<boolean> {
    try {
      const response = await fetch(E2E_ENDPOINTS.cleanupRbacProject, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ projectKey }),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.warn(`  ⚠️ Failed to cleanup RBAC project:`, error);
      return false;
    }
  }

  /**
   * Cleanup old test users (garbage collection)
   */
  async cleanupOldTestUsers(): Promise<{ deleted: number }> {
    try {
      const response = await fetch(E2E_ENDPOINTS.cleanup, {
        method: "POST",
        headers: getE2EHeaders(),
      });
      const result = await response.json();
      return { deleted: result.deleted || 0 };
    } catch (error) {
      console.warn(`  ⚠️ Failed to cleanup old test users:`, error);
      return { deleted: 0 };
    }
  }
}

// Singleton instance for convenience
export const testUserService = new TestUserService();
