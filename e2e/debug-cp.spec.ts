import { authenticatedTest, expect } from "./fixtures";

authenticatedTest("debug command palette visibility", async ({ dashboardPage, page }) => {
  // Capture page console logs
  page.on("console", (msg) => console.log(`PAGE LOG: [${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => console.log(`PAGE ERROR: ${err.message}`));

  await dashboardPage.goto();

  console.log("Current URL:", page.url());

  // Wait for hydration
  console.log("Waiting for app to settle...");
  await page.waitForTimeout(5000);

  // Try to open command palette
  console.log("Clicking command palette button...");
  await dashboardPage.commandPaletteButton.click();

  // Wait a bit
  await page.waitForTimeout(3000);

  // Log ALL dialogs present in the DOM
  console.log("--- DIALOGS ---");
  const anyDialog = await page.locator('[role="dialog"]').all();
  console.log(`Found ${anyDialog.length} elements with role="dialog"`);

  for (let i = 0; i < anyDialog.length; i++) {
    const html = await anyDialog[i].innerHTML().catch(() => "N/A");
    const visible = await anyDialog[i].isVisible();
    console.log(
      `Dialog ${i}: visible=${visible}, contains "Type a command"=${html.includes("Type a command")}`,
    );
    console.log(
      `Dialog ${i} innerText preview: "${(await anyDialog[i].innerText()).substring(0, 100).replace(/\n/g, " ")}..."`,
    );
  }

  // Log ALL inputs
  console.log("--- INPUTS ---");
  const inputs = await page.locator("input").all();
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute("placeholder");
    const visible = await inputs[i].isVisible();
    console.log(`Input ${i}: placeholder="${placeholder}", visible=${visible}`);
  }

  // Check the specific CP input
  const cpInput = page.getByPlaceholder(/type a command/i);
  console.log(`CP Input exists: ${(await cpInput.count()) > 0}`);
  if ((await cpInput.count()) > 0) {
    console.log(`CP Input visible: ${await cpInput.isVisible()}`);
  }

  await expect(dashboardPage.commandPalette).toBeVisible({ timeout: 10000 });
});
