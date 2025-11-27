import type { FullConfig } from "@playwright/test";

/**
 * Global setup - runs once before all tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log("\n🎭 Playwright E2E Tests Starting...\n");

  // Log configuration
  const { baseURL } = config.projects[0].use;
  console.log(`  Base URL: ${baseURL}`);
  console.log(`  Workers: ${config.workers}`);
  console.log(`  Retries: ${config.projects[0].retries}`);
  console.log("");

  // Add any global setup here:
  // - Database seeding
  // - Test user creation
  // - Environment validation
}

export default globalSetup;
