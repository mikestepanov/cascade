import type { FullConfig } from "@playwright/test";

/**
 * Global teardown - runs once after all tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  // Add any global cleanup here:
  // - Database cleanup
  // - Test data removal
  // - Report generation
}

export default globalTeardown;
