#!/usr/bin/env node

/**
 * Query Issues Finder
 *
 * Detects potential N+1 queries and unbounded .collect() calls in Convex code.
 *
 * Usage:
 *   node scripts/find-query-issues.cjs [path]
 *
 * Examples:
 *   node scripts/find-query-issues.cjs           # Scan convex/ directory
 *   node scripts/find-query-issues.cjs convex/   # Same as above
 *   node scripts/find-query-issues.cjs convex/projects.ts  # Scan single file
 */

const fs = require("fs");
const path = require("path");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

const SEVERITY = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

const severityColors = {
  [SEVERITY.HIGH]: colors.red,
  [SEVERITY.MEDIUM]: colors.yellow,
  [SEVERITY.LOW]: colors.cyan,
};

// Files to exclude from analysis (contain examples, intentional batch patterns, or utility code)
const EXCLUDED_FILES = [
  "boundedQueries.ts", // Contains JSDoc examples of query patterns
  "softDeleteHelpers.ts", // Contains JSDoc examples of filter patterns
  "batchHelpers.ts", // Intentional batch pattern using asyncMap
  "purge.ts", // Database cleanup utility with intentional batch deletion
  "e2e.ts", // E2E test setup file with intentional sequential patterns
  "testUtils.ts", // Test utility file with intentional patterns
];

/**
 * Find all TypeScript files in a directory recursively
 */
function findTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
        findTsFiles(fullPath, files);
      }
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      // Skip test files, type declaration files, and excluded files
      if (
        !entry.name.includes(".test.") &&
        !entry.name.endsWith(".d.ts") &&
        !EXCLUDED_FILES.includes(entry.name)
      ) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Analyze a file for query issues
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  // Track context for N+1 detection
  let inLoopContext = false;
  let loopStartLine = 0;
  let braceDepth = 0;
  let loopBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track brace depth for loop context
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    // Detect loop starts
    // Note: We exclude .filter() in query chains (ctx.db...filter) as those are database filters, not JS loops
    // Check surrounding lines for ctx.db query context
    const surroundingForFilter = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
    // Database filter patterns: .filter((q) => ...) or .filter(notDeleted) etc.
    const isQueryFilter = /\.filter\s*\(/.test(line) &&
      (surroundingForFilter.includes("ctx.db") ||
       surroundingForFilter.includes(".query(") ||
       /\.filter\s*\(\s*(notDeleted|onlyDeleted)\s*\)/.test(line) ||
       /\.filter\s*\(\s*\(?\s*q\s*\)?\s*=>/.test(line));
    // Also exclude .sort() which is often chained with filter
    const isSortOrOther = /\.(sort|find|some|every|includes)\s*\(/.test(line);
    const isArrayMethod = /\.(map|forEach|reduce)\s*\(/.test(line) ||
      (/\.filter\s*\(/.test(line) && !isQueryFilter);
    const isActualLoop = /\b(for|while)\s*\(/.test(line) || (isArrayMethod && !isSortOrOther);

    if (isActualLoop) {
      if (!inLoopContext) {
        inLoopContext = true;
        loopStartLine = lineNum;
        loopBraceDepth = braceDepth;
      }
    }

    // Detect loop ends
    // Also end loop context when we see a semicolon that ends the array method chain
    // e.g., `.filter(...).map(...);` or `.sort(...)[0];`
    if (inLoopContext) {
      if (braceDepth < loopBraceDepth) {
        inLoopContext = false;
      }
      // End context on array method chain termination (line ending with ; or ][0] etc.)
      if (/\)\s*;?\s*$/.test(line) && braceDepth <= loopBraceDepth && !/^\s*(for|while|if|else)\s*\(/.test(lines[i + 1] || "")) {
        // Check if next line doesn't continue the chain
        const nextLine = lines[i + 1] || "";
        if (!/^\s*\./.test(nextLine)) {
          inLoopContext = false;
        }
      }
      // [0] or other array access after chain ends the "loop"
      if (/\]\s*[0-9]*\s*;?\s*$/.test(line)) {
        inLoopContext = false;
      }
    }

    // === Check 1: Unbounded .collect() ===
    // Look for .collect() without preceding .take() or .first()
    if (/\.collect\s*\(\s*\)/.test(line)) {
      // Check previous lines for .take() or .first() in the same query chain
      let hasBound = false;
      const contextLines = lines.slice(Math.max(0, i - 5), i + 1).join("\n");

      // Check if it's part of a bounded query
      if (/\.take\s*\(/.test(contextLines) || /\.first\s*\(/.test(contextLines)) {
        hasBound = true;
      }

      // Check if it's in a comment or string
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
        continue;
      }

      if (!hasBound) {
        issues.push({
          type: "UNBOUNDED_COLLECT",
          severity: SEVERITY.HIGH,
          line: lineNum,
          code: line.trim(),
          message: "Unbounded .collect() - add .take(BOUNDED_LIST_LIMIT) or use .first()",
        });
      }
    }

    // === Check 2: N+1 Query Pattern ===
    // Detect database queries inside loops
    if (inLoopContext) {
      // Skip lines in comments or JSDoc
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) {
        continue;
      }

      // Check for ctx.db queries
      if (/ctx\.db\.(get|query)\s*\(/.test(line) || /await\s+ctx\.db\.(get|query)/.test(line)) {
        // Exclude if it's clearly a batch helper, Promise.all context, or delete helper function
        const surroundingContext = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join("\n");
        // Check for delete helper function context (larger window to find function name)
        const functionContext = lines.slice(Math.max(0, i - 40), i + 1).join("\n");
        const isDeleteHelper = /function\s+delete\w*\s*\(/.test(functionContext) ||
          /async\s+function\s+delete\w*/.test(functionContext) ||
          /\bdelete\w*\s*=\s*async/.test(functionContext);

        if (!/Promise\.all/.test(surroundingContext) && !/batch/i.test(surroundingContext) && !isDeleteHelper) {
          issues.push({
            type: "N_PLUS_1",
            severity: SEVERITY.HIGH,
            line: lineNum,
            loopLine: loopStartLine,
            code: line.trim(),
            message: `Database query inside loop (loop at line ${loopStartLine}) - consider batch fetching`,
          });
        }
      }
    }

    // === Check 3: Sequential awaits in loops ===
    if (inLoopContext && /await\s+/.test(line) && !/Promise\.all/.test(line)) {
      // Check if this is a database operation
      if (/ctx\.(db|storage|scheduler)/.test(line)) {
        const surroundingContext = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 1)).join("\n");

        // Skip if already flagged or in Promise.all
        if (!/Promise\.all/.test(surroundingContext)) {
          // Check if this is in a map that's wrapped in Promise.all
          const widerContext = lines.slice(Math.max(0, loopStartLine - 2), Math.min(lines.length, i + 5)).join("\n");
          if (!/Promise\.all\s*\(/.test(widerContext)) {
            issues.push({
              type: "SEQUENTIAL_AWAIT",
              severity: SEVERITY.MEDIUM,
              line: lineNum,
              loopLine: loopStartLine,
              code: line.trim(),
              message: `Sequential await in loop - consider Promise.all for parallel execution`,
            });
          }
        }
      }
    }

    // === Check 4: Missing index usage ===
    if (/\.query\s*\([^)]+\)/.test(line)) {
      // Look ahead for .withIndex
      const queryContext = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
      if (!/\.withIndex\s*\(/.test(queryContext) && /\.filter\s*\(/.test(queryContext)) {
        // This is a query with filter but no index - potential full table scan
        issues.push({
          type: "MISSING_INDEX",
          severity: SEVERITY.LOW,
          line: lineNum,
          code: line.trim(),
          message: "Query uses .filter() without .withIndex() - may cause full table scan",
        });
      }
    }

    // === Check 5: Large .take() values ===
    const takeMatch = line.match(/\.take\s*\(\s*(\d+)\s*\)/);
    if (takeMatch) {
      const takeValue = parseInt(takeMatch[1], 10);
      if (takeValue > 1000) {
        issues.push({
          type: "LARGE_TAKE",
          severity: SEVERITY.MEDIUM,
          line: lineNum,
          code: line.trim(),
          message: `Large .take(${takeValue}) - consider pagination for better performance`,
        });
      }
    }
  }

  return issues;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let targetPath = args[0] || "convex";

  // Resolve relative to cwd
  if (!path.isAbsolute(targetPath)) {
    targetPath = path.join(process.cwd(), targetPath);
  }

  console.log(`\n${colors.bold}=== QUERY ISSUES FINDER ===${colors.reset}\n`);

  let files = [];

  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      files = findTsFiles(targetPath);
      console.log(`Scanning ${files.length} files in ${targetPath}\n`);
    } else if (stat.isFile()) {
      files = [targetPath];
      console.log(`Scanning ${targetPath}\n`);
    }
  } else {
    console.error(`${colors.red}Error: Path not found: ${targetPath}${colors.reset}`);
    process.exit(1);
  }

  const allIssues = [];
  const issuesByFile = new Map();

  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      const relativePath = path.relative(process.cwd(), file);
      issuesByFile.set(relativePath, issues);
      allIssues.push(...issues.map((issue) => ({ ...issue, file: relativePath })));
    }
  }

  // Group by severity
  const bySeverity = {
    [SEVERITY.HIGH]: allIssues.filter((i) => i.severity === SEVERITY.HIGH),
    [SEVERITY.MEDIUM]: allIssues.filter((i) => i.severity === SEVERITY.MEDIUM),
    [SEVERITY.LOW]: allIssues.filter((i) => i.severity === SEVERITY.LOW),
  };

  // Print results grouped by file
  if (issuesByFile.size === 0) {
    console.log(`${colors.green}✅ No query issues found!${colors.reset}\n`);
  } else {
    for (const [file, issues] of issuesByFile) {
      console.log(`${colors.bold}${file}${colors.reset}`);

      for (const issue of issues) {
        const sevColor = severityColors[issue.severity];
        console.log(
          `  ${sevColor}[${issue.severity}]${colors.reset} Line ${issue.line}: ${issue.type}`
        );
        console.log(`    ${colors.dim}${issue.message}${colors.reset}`);
        console.log(`    ${colors.dim}→ ${issue.code.substring(0, 80)}${issue.code.length > 80 ? "..." : ""}${colors.reset}`);
      }
      console.log();
    }
  }

  // Print summary
  console.log(`${colors.bold}=== SUMMARY ===${colors.reset}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files with issues: ${issuesByFile.size}`);
  console.log();

  if (allIssues.length > 0) {
    console.log(`${colors.red}[HIGH]${colors.reset}   ${bySeverity[SEVERITY.HIGH].length} issues`);
    console.log(`${colors.yellow}[MEDIUM]${colors.reset} ${bySeverity[SEVERITY.MEDIUM].length} issues`);
    console.log(`${colors.cyan}[LOW]${colors.reset}    ${bySeverity[SEVERITY.LOW].length} issues`);
    console.log();

    // Issue type breakdown
    const byType = {};
    for (const issue of allIssues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }

    console.log("By type:");
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
    console.log();

    // Exit with error code if HIGH severity issues found
    if (bySeverity[SEVERITY.HIGH].length > 0) {
      console.log(
        `${colors.red}❌ Found ${bySeverity[SEVERITY.HIGH].length} high severity issues${colors.reset}\n`
      );
      process.exit(1);
    }
  }

  console.log(`${colors.green}✅ No high severity issues${colors.reset}\n`);
}

main();
