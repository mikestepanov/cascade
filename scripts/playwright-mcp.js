#!/usr/bin/env node
/**
 * Cross-platform wrapper for Playwright MCP
 * Works on Windows, Linux, and macOS
 */
const { spawn } = require("node:child_process");

const isWindows = process.platform === "win32";

const child = spawn(isWindows ? "npx.cmd" : "npx", ["@playwright/mcp@latest"], {
  stdio: "inherit",
  env: { ...process.env, PLAYWRIGHT_HEADLESS: "true" },
  shell: isWindows,
});

child.on("error", (err) => {
  console.error("Failed to start Playwright MCP:", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
