/**
 * Shared utilities for validation checks.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "../..");

// ANSI color codes
export const c = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

/**
 * Recursively walk a directory and return file paths matching given extensions.
 * @param {string} dir - Directory to walk
 * @param {object} opts - Options: { extensions: Set<string>, skip: Set<string> }
 * @returns {string[]}
 */
export function walkDir(dir, opts = {}) {
  const { extensions, skip = new Set(["node_modules", "dist", ".next", ".git"]) } = opts;
  const results = [];

  function recurse(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        recurse(full);
      } else if (!extensions || extensions.has(path.extname(entry.name))) {
        results.push(full);
      }
    }
  }

  recurse(dir);
  return results;
}

/**
 * Get a relative path from ROOT, normalized to forward slashes.
 * @param {string} filePath
 * @returns {string}
 */
export function relPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}
