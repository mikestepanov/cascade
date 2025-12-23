import { test } from "@playwright/test";
import { CONVEX_SITE_URL, E2E_API_KEY, TEST_USERS } from "./config";

/**
 * Cleanup script to remove accumulated E2E workspaces
 */
test("cleanup e2e workspaces", async () => {
  try {
    // Admin user email
    const email = TEST_USERS.teamLead.email;

    console.log(`NUKE: Deleting ALL E2E workspaces for Nixelo E2E...`);
    const url = `${CONVEX_SITE_URL}/e2e/nuke-workspaces`;
    console.log(`Target URL: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-e2e-api-key": E2E_API_KEY,
      },
      body: JSON.stringify({ confirm: true }),
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`Response body: ${text}`);
      throw new Error(`Cleanup failed: ${response.status} ${response.statusText} - ${text}`);
    }

    const result = await response.json();
    console.log("NUKE result:", result);
  } catch (e) {
    console.error("Cleanup test failed with error:", e);
    throw e;
  }
});
