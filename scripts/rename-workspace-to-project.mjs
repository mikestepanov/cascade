#!/usr/bin/env node

/**
 * Rename Script: Workspace → Project
 *
 * This script renames all instances of "workspace/Workspace/workspaces"
 * to "project/Project/projects" throughout the codebase.
 *
 * Usage:
 *   node scripts/rename-workspace-to-project.mjs --dry-run
 *   node scripts/rename-workspace-to-project.mjs --execute
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// Files/folders to skip
const SKIP = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "dev-dist",
  "convex/_generated",
  "test-results",
  "playwright-report",
  "ARCHITECTURE_COMPARISON.md", // Keep as documentation
  "ARCHITECTURE_DECISION.md", // Keep as documentation
  "MIGRATION_PLAN_OPTION_B.md", // Keep as documentation
  "MIGRATION-STATUS.md", // Keep as documentation
  "MIGRATION-COMPLETE.md", // Keep as documentation
  "TODO-TANSTACK-MIGRATION.md", // Keep as documentation
];

// File extensions to process
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".md", ".json"];

// Rename patterns (ORDER MATTERS!)
const PATTERNS = [
  // File/folder names (will be handled separately)
  // Content replacements

  // 1. PascalCase: Workspace → Project
  { from: /\bWorkspace([A-Z])/g, to: "Project$1", desc: "PascalCase (Workspace*)" },
  { from: /\bWorkspace\b/g, to: "Project", desc: "PascalCase (Workspace)" },

  // 2. Plural lowercase: workspaces → projects
  { from: /\bworkspaces\b/g, to: "projects", desc: "plural lowercase (workspaces)" },

  // 3. camelCase: workspace → project (but not workspaceId → projectId yet)
  { from: /\bworkspace([A-Z])/g, to: "project$1", desc: "camelCase (workspace*)" },
  { from: /\bworkspace\b/g, to: "project", desc: "lowercase (workspace)" },

  // 4. Special cases - IDs and specific patterns
  { from: /\bworkspaceId\b/g, to: "projectId", desc: "ID field (workspaceId)" },
  { from: /\bworkspaceIds\b/g, to: "projectIds", desc: "ID field plural (workspaceIds)" },
  { from: /\bworkspaceKey\b/g, to: "projectKey", desc: "key field (workspaceKey)" },
  { from: /\bworkspaceSlug\b/g, to: "projectSlug", desc: "slug field (workspaceSlug)" },

  // 5. URL patterns
  { from: /\/workspaces\//g, to: "/projects/", desc: "URL path (/workspaces/)" },
  { from: /workspaces\//g, to: "projects/", desc: "path (workspaces/)" },

  // 6. Comments and strings
  { from: /"workspaces"/g, to: '"projects"', desc: 'string literal ("workspaces")' },
  { from: /'workspaces'/g, to: "'projects'", desc: "string literal ('workspaces')" },
  { from: /"workspace"/g, to: '"project"', desc: 'string literal ("workspace")' },
  { from: /'workspace'/g, to: "'project'", desc: "string literal ('workspace')" },
];

// Files and folders to rename
const FILE_RENAMES = [
  // Convex files
  { from: "convex/workspaces.ts", to: "convex/projects.ts" },
  { from: "convex/workspaces.test.ts", to: "convex/projects.test.ts" },
  { from: "convex/workspaceMembers.ts", to: "convex/projectMembers.ts" },
  { from: "convex/workspaceAccess.ts", to: "convex/projectAccess.ts" },
  { from: "convex/workspaceTemplates.ts", to: "convex/projectTemplates.ts" },

  // Route files (if they exist)
  {
    from: "src/routes/_auth/_app/$companySlug/workspaces",
    to: "src/routes/_auth/_app/$companySlug/projects",
  },
];

// Statistics
const stats = {
  filesScanned: 0,
  filesModified: 0,
  filesRenamed: 0,
  replacements: 0,
  errors: 0,
};

/**
 * Check if path should be skipped
 */
function shouldSkip(filePath) {
  return SKIP.some((skip) => filePath.includes(skip));
}

/**
 * Check if file extension should be processed
 */
function shouldProcess(filePath) {
  return EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

/**
 * Get all files recursively
 */
function getAllFiles(dir, files = []) {
  if (shouldSkip(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldSkip(fullPath)) continue;

    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (shouldProcess(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Process file content
 */
function processFile(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;
    const changes = [];

    // Apply all patterns
    for (const pattern of PATTERNS) {
      const before = content;
      content = content.replace(pattern.from, pattern.to);

      if (before !== content) {
        modified = true;
        const count = (before.match(pattern.from) || []).length;
        changes.push(`  - ${pattern.desc}: ${count} replacement${count > 1 ? "s" : ""}`);
        stats.replacements += count;
      }
    }

    if (modified) {
      stats.filesModified++;
      log.info(`Modified: ${path.relative(ROOT, filePath)}`);
      changes.forEach((change) => console.log(change));

      if (!dryRun) {
        fs.writeFileSync(filePath, content, "utf8");
      }
    }

    stats.filesScanned++;
  } catch (error) {
    stats.errors++;
    log.error(`Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Rename files and folders
 */
function renameFiles(dryRun = true) {
  log.info("\n📝 Renaming files and folders...\n");

  for (const { from, to } of FILE_RENAMES) {
    const fromPath = path.join(ROOT, from);
    const toPath = path.join(ROOT, to);

    if (fs.existsSync(fromPath)) {
      log.info(`Rename: ${from} → ${to}`);

      if (!dryRun) {
        // Create parent directory if needed
        const toDir = path.dirname(toPath);
        if (!fs.existsSync(toDir)) {
          fs.mkdirSync(toDir, { recursive: true });
        }

        // Rename
        fs.renameSync(fromPath, toPath);
      }

      stats.filesRenamed++;
    } else {
      log.warning(`Not found: ${from}`);
    }
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  console.log("\n" + "=".repeat(60));
  log.info("Workspace → Project Rename Script");
  console.log("=".repeat(60) + "\n");

  if (dryRun) {
    log.warning("DRY RUN MODE - No changes will be made");
    log.info("Use --execute to apply changes");
  } else {
    log.warning("EXECUTE MODE - Changes will be applied!");
  }

  console.log("");

  // Step 1: Process file contents
  log.info("📄 Processing file contents...\n");

  const files = getAllFiles(ROOT);
  log.info(`Found ${files.length} files to scan\n`);

  for (const file of files) {
    processFile(file, dryRun);
  }

  // Step 2: Rename files and folders
  renameFiles(dryRun);

  // Print summary
  console.log("\n" + "=".repeat(60));
  log.info("Summary");
  console.log("=".repeat(60) + "\n");

  console.log(`Files scanned:    ${stats.filesScanned}`);
  console.log(`Files modified:   ${stats.filesModified}`);
  console.log(`Files renamed:    ${stats.filesRenamed}`);
  console.log(`Total replacements: ${stats.replacements}`);

  if (stats.errors > 0) {
    console.log(`${colors.red}Errors:           ${stats.errors}${colors.reset}`);
  }

  console.log("");

  if (dryRun) {
    log.warning("This was a DRY RUN - no changes were made");
    log.info("Review the output above, then run with --execute to apply changes");
  } else {
    log.success("Changes applied successfully!");
    log.info("Next steps:");
    console.log("  1. Run: pnpm convex dev --once");
    console.log("  2. Run: pnpm typecheck");
    console.log("  3. Test the application");
  }

  console.log("");
}

main();
