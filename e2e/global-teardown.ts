import type { FullConfig } from "@playwright/test";

/**
 * Global teardown - runs once after all tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log("\n🎭 Playwright E2E Tests Complete\n");

  // Add any global cleanup here:
  // - Database cleanup
  // - Test data removal
  // - Report generation
}

export default globalTeardown;
