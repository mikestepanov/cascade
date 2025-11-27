import type { FullConfig } from "@playwright/test";

/**
 * Global setup - runs once before all tests
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(config: FullConfig): Promise<void> {
  // Log configuration
  const { baseURL } = config.projects[0].use;

  // Add any global setup here:
  // - Database seeding
  // - Test user creation
  // - Environment validation
}

export default globalSetup;
