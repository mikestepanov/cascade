/**
 * Unified validation script — runs all custom code checks in sequence.
 *
 * Checks:
 *   1. Standards (AST)      — typography, className concat, dark mode, raw TW colors, shorthands
 *   2. Color audit          — raw TW colors, hardcoded hex, rgb/hsl, style props + allowlists
 *   3. API calls            — validates api.X.Y calls match Convex exports
 *   4. Query issues         — N+1 queries, unbounded .collect(), missing indexes
 *   5. Arbitrary Tailwind   — arbitrary values like h-[50px] (warning only)
 *
 * Exit code 1 if any error-level check fails.
 * Arbitrary Tailwind + MEDIUM/LOW query issues are warnings only.
 *
 * Usage:
 *   node scripts/validate.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ── ANSI colors ──────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

// ── Shared utilities ─────────────────────────────────────────────────────────

function walkDir(dir, opts = {}) {
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

function relPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

// ── Result tracking ──────────────────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK 1: Standards (AST)
// ═══════════════════════════════════════════════════════════════════════════════

function runStandardsCheck() {
  const SRC_DIR = path.join(ROOT, "src");
  const IGNORE_DIRS = ["src/lib", "src/components/ui"];

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, node, message, level = "error") {
    const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
    const rel = relPath(filePath);
    const color = level === "error" ? c.red : c.yellow;
    errors.push(`  ${color}${level.toUpperCase()}${c.reset} ${rel}:${line + 1}:${character + 1} - ${message}`);
    if (level === "error") errorCount++;
  }

  function getClassNameText(node) {
    const attr = node.attributes.properties.find(
      (p) => ts.isJsxAttribute(p) && p.name.getText() === "className",
    );
    const init = attr?.initializer;
    if (!init) return "";
    if (ts.isStringLiteral(init)) return init.text;
    if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
      return init.expression.text;
    }
    return "";
  }

  const RAW_TW_COLORS =
    /\b(?:bg|text|border|ring|shadow|divide|outline|fill|stroke|from|to|via|decoration|placeholder|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/;

  const tailwindShorthandMap = {
    "flex-shrink-0": "shrink-0",
    "flex-shrink": "shrink",
    "flex-grow-0": "grow-0",
    "flex-grow": "grow",
  };

  function getClassText(node) {
    let classText = "";
    if (node.initializer && ts.isStringLiteral(node.initializer)) {
      classText = node.initializer.text;
    } else if (
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isStringLiteral(node.initializer.expression)
    ) {
      classText = node.initializer.expression.text;
    }
    return classText;
  }

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_DIRS.some((d) => rel.startsWith(d))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      // Typography tags
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText();
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          reportError(filePath, node, `Use <Typography> component instead of raw <${tagName}> tags.`);
        }
        // Flex standard
        if (tagName === "div") {
          const classText = getClassNameText(node);
          const classes = classText.split(/\s+/);
          if (classes.includes("flex") || classes.includes("inline-flex")) {
            reportError(filePath, node, 'Use <Flex> component instead of <div className="flex"> for one-dimensional layouts.', "warning");
          }
        }
      }

      // className checks
      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        // Concatenation
        if (node.initializer && ts.isJsxExpression(node.initializer)) {
          const expr = node.initializer.expression;
          if (expr && (ts.isTemplateExpression(expr) || ts.isBinaryExpression(expr))) {
            reportError(filePath, node, "Avoid manual string concatenation in className. Use cn() utility instead.");
          }
        }

        const classText = getClassText(node);
        const classes = classText.split(/\s+/);

        // Dark mode redundancy
        const REDUNDANT_PATTERN = /(bg|text|border)-(ui-bg|ui-text|ui-border|status)-[a-z-]+-dark/;
        if (classes.some((cls) => cls.includes("dark:") && REDUNDANT_PATTERN.test(cls))) {
          reportError(filePath, node, "Redundant dark mode class detected. Semantic tokens now handle dark mode automatically in index.css.", "warning");
        }

        // Raw Tailwind colors
        for (const cls of classes) {
          const bare = cls.replace(/^[a-z-]+:/g, "");
          if (RAW_TW_COLORS.test(bare)) {
            reportError(filePath, node, `Raw Tailwind color '${cls}' — use semantic tokens (brand-*, status-*, accent-*, ui-*) instead.`);
          }
        }

        // Shorthands
        for (const cls of classes) {
          if (tailwindShorthandMap[cls]) {
            reportError(filePath, node, `Non-canonical Tailwind class: '${cls}'. Use '${tailwindShorthandMap[cls]}' instead.`, "warning");
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  totalErrors += errorCount;
  return { passed: errorCount === 0, detail: errorCount > 0 ? `${errorCount} violation(s)` : null, messages: errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK 2: Color audit
// ═══════════════════════════════════════════════════════════════════════════════

function runColorAudit() {
  const SRC = path.join(ROOT, "src");
  const CONVEX = path.join(ROOT, "convex");

  // Allowlists
  const ALLOWLIST_RAW_TAILWIND = [
    "src/components/landing/",
    "src/components/auth/AppSplashScreen.tsx",
    "src/components/AI/AIChat.tsx",
    "src/components/Settings/PumbleIntegration.tsx",
    "*.test.ts",
    "*.test.tsx",
    "src/index.css",
  ];

  const ALLOWLIST_HARDCODED_HEX = [
    "src/components/auth/GoogleAuthButton.tsx",
    "src/components/ui/ColorPicker.tsx",
    "src/components/ui/ColorPicker.test.tsx",
    "src/index.css",
    "src/components/landing/",
    "convex/http/",
    "convex/pumble.ts",
    "convex/invites.ts",
    "convex/bookingPages.ts",
    "convex/projectTemplates.ts",
    "convex/onboarding.ts",
    "convex/schema.ts",
    "convex/lib/issueHelpers.ts",
    "src/components/LabelsManager.tsx",
    "src/components/Settings/DevToolsTab.tsx",
    "src/components/AI/config.ts",
    "*.test.ts",
    "*.test.tsx",
    "convex/labels.test.ts",
  ];

  const SEMANTIC_PREFIXES = [
    "brand-", "accent-", "ui-bg-", "ui-text-", "ui-border-",
    "status-success", "status-warning", "status-error", "status-info",
    "priority-", "issue-type-", "primary", "secondary",
  ];

  const RAW_COLORS = [
    "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
    "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
    "indigo", "violet", "purple", "fuchsia", "pink", "rose", "black", "white",
  ];

  const TW_PREFIXES = [
    "bg-", "text-", "border-", "ring-", "shadow-", "divide-", "outline-",
    "fill-", "stroke-", "from-", "to-", "via-", "decoration-", "placeholder-", "caret-",
  ];

  const TW_COLOR_RE = new RegExp(
    "(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl|first|last|odd|even|placeholder):)*" +
      "(?:" + TW_PREFIXES.map((p) => p.replace("-", "\\-")).join("|") + ")" +
      "([a-z]+-\\d{2,3}(?:\\/\\d{1,3})?)",
    "g",
  );

  const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  const FUNC_COLOR_RE = /(?:rgba?|hsla?)\s*\([^)]+\)/g;
  const STYLE_PROP_RE = /(?:color|backgroundColor|borderColor|background|fill|stroke)\s*:\s*["'][^"']+["']/g;

  const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss"]);

  function isAllowed(filePath, allowlist) {
    const normalized = filePath.replace(/\\/g, "/");
    return allowlist.some((pattern) => {
      if (pattern.startsWith("*")) return normalized.endsWith(pattern.slice(1));
      return normalized.includes(pattern);
    });
  }

  function classifyTwColor(colorPart) {
    for (const prefix of SEMANTIC_PREFIXES) {
      if (colorPart.startsWith(prefix)) return "SEMANTIC";
    }
    for (const raw of RAW_COLORS) {
      if (colorPart.startsWith(raw + "-") || colorPart === raw) return "RAW";
    }
    if (/^(muted|foreground|background|border|input|ring|card|popover|destructive|accent|primary|secondary)/.test(colorPart)) {
      return "SHADCN";
    }
    return "UNKNOWN";
  }

  const findings = [];
  let semanticCount = 0;

  function scan(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    if (rel.includes("tailwind.config") || rel.includes("calendar-tailwind-classes")) return;
    if (rel.includes("audit-colors") || rel.includes("validate.js")) return;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      // Tailwind color classes
      let match;
      TW_COLOR_RE.lastIndex = 0;
      while ((match = TW_COLOR_RE.exec(line)) !== null) {
        const category = classifyTwColor(match[1]);
        if (category === "SEMANTIC" || category === "SHADCN" || category === "UNKNOWN") {
          if (category === "SEMANTIC") semanticCount++;
          continue;
        }
        if (category === "RAW" && isAllowed(rel, ALLOWLIST_RAW_TAILWIND)) continue;
        findings.push({ file: rel, line: lineNum, category, type: "tw-class", value: match[0] });
      }

      // Hex colors
      HEX_RE.lastIndex = 0;
      while ((match = HEX_RE.exec(line)) !== null) {
        if (trimmed.startsWith("import ")) continue;
        const hex = match[0].toLowerCase();
        if (hex.length < 4) continue;
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        findings.push({ file: rel, line: lineNum, category: "HARDCODED", type: "hex", value: hex });
      }

      // rgb/rgba/hsl/hsla
      FUNC_COLOR_RE.lastIndex = 0;
      while ((match = FUNC_COLOR_RE.exec(line)) !== null) {
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        findings.push({ file: rel, line: lineNum, category: "HARDCODED", type: "func", value: match[0] });
      }

      // Style object color properties
      STYLE_PROP_RE.lastIndex = 0;
      while ((match = STYLE_PROP_RE.exec(line)) !== null) {
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        const styleValue = match[0].replace(/.*:\s*["']/, "").replace(/["']$/, "");
        if (!/^(#|rgb|hsl|transparent|currentColor|inherit|white|black)/.test(styleValue)) continue;
        findings.push({ file: rel, line: lineNum, category: "HARDCODED", type: "style-prop", value: match[0] });
      }
    }
  }

  const dirs = [SRC];
  if (fs.existsSync(CONVEX)) dirs.push(CONVEX);
  const files = dirs.flatMap((d) => walkDir(d, { extensions: EXTS }));
  for (const f of files) scan(f);

  const violations = findings.filter((f) => f.category === "RAW" || f.category === "HARDCODED");

  const messages = [];
  if (violations.length > 0) {
    const byFile = {};
    for (const f of violations) {
      if (!byFile[f.file]) byFile[f.file] = [];
      byFile[f.file].push(f);
    }
    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset}`);
      const seen = new Set();
      for (const item of items) {
        const key = `${item.line}:${item.value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        messages.push(`    ${c.dim}L${String(item.line).padStart(4)}${c.reset}  ${c.red}${item.value}${c.reset}`);
      }
    }
  }

  totalErrors += violations.length;
  return {
    passed: violations.length === 0,
    detail: violations.length > 0
      ? `${violations.length} violation(s)`
      : `${semanticCount} semantic, 0 violations`,
    messages,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK 3: API calls
// ═══════════════════════════════════════════════════════════════════════════════

function runApiCallsCheck() {
  const srcDir = path.join(ROOT, "src");
  const convexDir = path.join(ROOT, "convex");

  // Get all API calls from src
  const srcFiles = walkDir(srcDir, { extensions: new Set([".ts", ".tsx"]) });
  const apiCalls = new Map();

  for (const file of srcFiles) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
        const matches = line.matchAll(/api\.(\w+)\.(\w+)/g);
        for (const match of matches) {
          const call = `${match[1]}.${match[2]}`;
          if (!apiCalls.has(call)) apiCalls.set(call, []);
          apiCalls.get(call).push(`${relPath(file)}:${i + 1}`);
        }
      }
    } catch {
      // skip
    }
  }

  // Get exported functions from convex
  function resolveSubPath(basePath, relativePath) {
    const subPath = path.join(path.dirname(basePath), relativePath);
    if (!subPath.endsWith(".ts")) {
      if (fs.existsSync(subPath + ".ts")) return subPath + ".ts";
      if (fs.existsSync(path.join(subPath, "index.ts"))) return path.join(subPath, "index.ts");
    }
    return subPath;
  }

  function getExportsFromFile(file) {
    const funcs = new Set();
    try {
      const content = fs.readFileSync(file, "utf8");
      const directMatches = content.matchAll(/export const (\w+)\s*=/g);
      for (const match of directMatches) funcs.add(match[1]);

      const reExportMatches = content.matchAll(/export \* from\s+["'](\.\/[^"']+)["']/g);
      for (const match of reExportMatches) {
        const subPath = resolveSubPath(file, match[1]);
        if (fs.existsSync(subPath)) {
          for (const f of getExportsFromFile(subPath)) funcs.add(f);
        }
      }
    } catch {
      // skip
    }
    return funcs;
  }

  const exportedFuncs = new Map();

  // Top-level convex files
  const convexTopLevel = walkDir(convexDir, { extensions: new Set([".ts"]) }).filter((f) => {
    const rel = path.relative(convexDir, f);
    return !(rel.includes(path.sep) || rel.includes(".test.") || rel.includes("schema") || rel.includes("config"));
  });

  for (const file of convexTopLevel) {
    const moduleName = path.basename(file, ".ts");
    exportedFuncs.set(moduleName, getExportsFromFile(file));
  }

  // Subdirectories
  const subdirs = ["ai", "email", "api", "http", "lib", "internal"];
  for (const subdir of subdirs) {
    const subPath = path.join(convexDir, subdir);
    if (!fs.existsSync(subPath)) continue;
    const subFiles = walkDir(subPath, { extensions: new Set([".ts"]) });
    for (const file of subFiles) {
      const submodule = path.basename(file, ".ts");
      exportedFuncs.set(`${subdir}.${submodule}`, getExportsFromFile(file));
    }
  }

  // Find mismatches
  let found = 0;
  const errors = [];
  for (const [call, files] of [...apiCalls.entries()].sort()) {
    const [moduleName, func] = call.split(".");
    if (moduleName === "convex") continue;
    if (call === "pumble.com") continue;
    if (exportedFuncs.has(call)) continue;
    if (["ai.actions", "ai.mutations", "ai.queries", "email.notifications", "email.helpers"].includes(call)) continue;

    const moduleFuncs = exportedFuncs.get(moduleName);
    if (!moduleFuncs) {
      errors.push(`  ${c.red}MISSING MODULE${c.reset}: convex/${moduleName}.ts  (api.${call})`);
      found++;
    } else if (!moduleFuncs.has(func)) {
      errors.push(`  ${c.red}MISSING FUNCTION${c.reset}: api.${call}  in: ${files.slice(0, 3).join(", ")}`);
      found++;
    }
  }

  totalErrors += found;
  return {
    passed: found === 0,
    detail: found > 0 ? `${found} invalid call(s)` : `${apiCalls.size} calls validated`,
    messages: errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK 4: Query issues
// ═══════════════════════════════════════════════════════════════════════════════

function runQueryIssuesCheck() {
  const convexDir = path.join(ROOT, "convex");

  const SEVERITY = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" };
  const EXCLUDED_FILES = [
    "boundedQueries.ts", "softDeleteHelpers.ts", "batchHelpers.ts",
    "purge.ts", "e2e.ts", "testUtils.ts",
  ];

  function findTsFiles(dir) {
    return walkDir(dir, { extensions: new Set([".ts", ".tsx"]) }).filter((f) => {
      const name = path.basename(f);
      return !(name.includes(".test.") || name.endsWith(".d.ts") || EXCLUDED_FILES.includes(name));
    });
  }

  function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const issues = [];

    let inLoopContext = false;
    let loopStartLine = 0;
    let braceDepth = 0;
    let loopBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Detect loop starts
      const surroundingForFilter = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
      const isQueryFilter =
        /\.filter\s*\(/.test(line) &&
        (surroundingForFilter.includes("ctx.db") ||
          surroundingForFilter.includes(".query(") ||
          /\.filter\s*\(\s*(notDeleted|onlyDeleted)\s*\)/.test(line) ||
          /\.filter\s*\(\s*\(?\s*q\s*\)?\s*=>/.test(line));
      const isSortOrOther = /\.(sort|find|some|every|includes)\s*\(/.test(line);
      const isArrayMethod =
        /\.(map|forEach|reduce)\s*\(/.test(line) || (/\.filter\s*\(/.test(line) && !isQueryFilter);
      const isActualLoop = /\b(for|while)\s*\(/.test(line) || (isArrayMethod && !isSortOrOther);

      if (isActualLoop && !inLoopContext) {
        inLoopContext = true;
        loopStartLine = lineNum;
        loopBraceDepth = braceDepth;
      }

      if (inLoopContext) {
        if (braceDepth < loopBraceDepth) {
          inLoopContext = false;
        }
        if (/\)\s*;?\s*$/.test(line) && braceDepth <= loopBraceDepth && !/^\s*(for|while|if|else)\s*\(/.test(lines[i + 1] || "")) {
          const nextLine = lines[i + 1] || "";
          if (!/^\s*\./.test(nextLine)) inLoopContext = false;
        }
        if (/\]\s*[0-9]*\s*;?\s*$/.test(line)) inLoopContext = false;
      }

      // Unbounded .collect()
      if (/\.collect\s*\(\s*\)/.test(line)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        const contextLines = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
        const hasBound = /\.take\s*\(/.test(contextLines) || /\.first\s*\(/.test(contextLines);
        if (!hasBound) {
          issues.push({ type: "UNBOUNDED_COLLECT", severity: SEVERITY.HIGH, line: lineNum, code: trimmed, message: "Unbounded .collect() - add .take(BOUNDED_LIST_LIMIT) or use .first()" });
        }
      }

      // N+1 queries
      if (inLoopContext) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) continue;

        if (/ctx\.db\.(get|query)\s*\(/.test(line) || /await\s+ctx\.db\.(get|query)/.test(line)) {
          const surroundingContext = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join("\n");
          const functionContext = lines.slice(Math.max(0, i - 40), i + 1).join("\n");
          const isDeleteHelper = /function\s+delete\w*\s*\(/.test(functionContext) || /async\s+function\s+delete\w*/.test(functionContext) || /\bdelete\w*\s*=\s*async/.test(functionContext);
          if (!((/Promise\.all/.test(surroundingContext) || /batch/i.test(surroundingContext) || isDeleteHelper))) {
            issues.push({ type: "N_PLUS_1", severity: SEVERITY.HIGH, line: lineNum, loopLine: loopStartLine, code: trimmedLine, message: `Database query inside loop (loop at line ${loopStartLine})` });
          }
        }
      }

      // Sequential awaits in loops
      const loopLine = lines[loopStartLine - 1] || "";
      const isWhileLoop = /\bwhile\s*\(/.test(loopLine);
      const nearbyContext = lines.slice(Math.max(0, i - 10), i + 1).join("\n");
      const isInSwitch = /switch\s*\([^)]+\)\s*\{/.test(nearbyContext) && /\bcase\s+/.test(nearbyContext);
      const functionContext = lines.slice(Math.max(0, i - 40), i + 1).join("\n");
      const isDeleteOrCleanup = /function\s+(delete|cleanup|purge|cascade|handleDelete)\w*/i.test(functionContext) || /async\s+function\s+(cascade|handleDelete)/i.test(functionContext) || /autoRetry/i.test(functionContext);

      if (inLoopContext && !isWhileLoop && !isInSwitch && !isDeleteOrCleanup && /await\s+/.test(line) && !/Promise\.all/.test(line)) {
        if (/ctx\.(db|storage|scheduler)/.test(line)) {
          const surroundingContext = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 1)).join("\n");
          if (!/Promise\.all/.test(surroundingContext)) {
            const widerContext = lines.slice(Math.max(0, loopStartLine - 2), Math.min(lines.length, i + 15)).join("\n");
            const assignmentMatch = lines[loopStartLine - 1]?.match(/const\s+(\w+)\s*=.*\.map/);
            const variableName = assignmentMatch?.[1];
            const promiseAllPattern = variableName ? new RegExp(`Promise\\.all\\s*\\(\\s*${variableName}`) : /Promise\.all\s*\(/;
            if (!promiseAllPattern.test(widerContext)) {
              issues.push({ type: "SEQUENTIAL_AWAIT", severity: SEVERITY.MEDIUM, line: lineNum, loopLine: loopStartLine, code: line.trim(), message: "Sequential await in loop - consider Promise.all" });
            }
          }
        }
      }

      // Missing index
      if (/\.query\s*\([^)]+\)/.test(line)) {
        const queryContext = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
        const hasIndex = /\.withIndex\s*\(/.test(queryContext) || /\.withSearchIndex\s*\(/.test(queryContext);
        if (!hasIndex && /\.filter\s*\(/.test(queryContext)) {
          issues.push({ type: "MISSING_INDEX", severity: SEVERITY.LOW, line: lineNum, code: line.trim(), message: "Query uses .filter() without .withIndex()" });
        }
      }

      // Large .take()
      const takeMatch = line.match(/\.take\s*\(\s*(\d+)\s*\)/);
      if (takeMatch) {
        const takeValue = parseInt(takeMatch[1], 10);
        if (takeValue > 1000) {
          issues.push({ type: "LARGE_TAKE", severity: SEVERITY.MEDIUM, line: lineNum, code: line.trim(), message: `Large .take(${takeValue}) - consider pagination` });
        }
      }
    }

    return issues;
  }

  const files = findTsFiles(convexDir);
  const allIssues = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues.map((issue) => ({ ...issue, file: relPath(file) })));
    }
  }

  const highCount = allIssues.filter((i) => i.severity === SEVERITY.HIGH).length;
  const medCount = allIssues.filter((i) => i.severity === SEVERITY.MEDIUM).length;
  const lowCount = allIssues.filter((i) => i.severity === SEVERITY.LOW).length;

  const messages = [];
  if (highCount > 0) {
    for (const issue of allIssues.filter((i) => i.severity === SEVERITY.HIGH)) {
      messages.push(`  ${c.red}[HIGH]${c.reset} ${issue.file}:${issue.line} ${issue.type} — ${issue.message}`);
    }
  }

  totalErrors += highCount;
  if (medCount + lowCount > 0) totalWarnings += medCount + lowCount;

  let detail;
  if (highCount > 0) {
    detail = `${highCount} high severity`;
  } else if (medCount + lowCount > 0) {
    const parts = [];
    if (medCount > 0) parts.push(`${medCount} medium`);
    if (lowCount > 0) parts.push(`${lowCount} low`);
    detail = `0 high severity, ${parts.join(", ")} warning(s)`;
  } else {
    detail = "0 high severity";
  }

  return { passed: highCount === 0, detail, messages };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK 5: Arbitrary Tailwind
// ═══════════════════════════════════════════════════════════════════════════════

function runArbitraryTailwindCheck() {
  const srcDir = path.join(ROOT, "src");

  const patterns = [
    { regex: /w-\[/, desc: "width" },
    { regex: /h-\[/, desc: "height" },
    { regex: /min-w-\[/, desc: "min-width" },
    { regex: /max-w-\[/, desc: "max-width" },
    { regex: /min-h-\[/, desc: "min-height" },
    { regex: /max-h-\[/, desc: "max-height" },
    { regex: /p-\[/, desc: "padding" },
    { regex: /m-\[/, desc: "margin" },
    { regex: /gap-\[/, desc: "gap" },
    { regex: /space-x-\[/, desc: "horizontal space" },
    { regex: /space-y-\[/, desc: "vertical space" },
    { regex: /scale-\[/, desc: "scale" },
    { regex: /rotate-\[/, desc: "rotate" },
    { regex: /translate-x-\[/, desc: "translate-x" },
    { regex: /translate-y-\[/, desc: "translate-y" },
    { regex: /text-\[/, desc: "font-size or color" },
    { regex: /leading-\[/, desc: "line-height" },
    { regex: /tracking-\[/, desc: "letter-spacing" },
    { regex: /rounded-\[/, desc: "border-radius" },
    { regex: /border-\[/, desc: "border-width" },
    { regex: /bg-\[#/, desc: "background color (hex)" },
    { regex: /text-\[#/, desc: "text color (hex)" },
    { regex: /border-\[#/, desc: "border color (hex)" },
  ];

  const files = walkDir(srcDir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  let totalFound = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const { regex } of patterns) {
        if (regex.test(lines[i])) {
          totalFound++;
          break; // count each line only once
        }
      }
    }
  }

  if (totalFound > 0) totalWarnings += totalFound;

  return {
    passed: true, // warnings only, never fails
    detail: totalFound > 0 ? `${totalFound} arbitrary value(s), warning` : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const checks = [
  { name: "Standards (AST)", fn: runStandardsCheck },
  { name: "Color audit", fn: runColorAudit },
  { name: "API calls", fn: runApiCallsCheck },
  { name: "Query issues", fn: runQueryIssuesCheck },
  { name: "Arbitrary Tailwind", fn: runArbitraryTailwindCheck },
];

console.log(`\n${c.bold}Running validation...${c.reset}\n`);

const results = [];
for (let i = 0; i < checks.length; i++) {
  const { name, fn } = checks[i];
  const result = fn();
  result.name = name;
  result.index = i;
  results.push(result);
}

// Print summary lines
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  const idx = `[${i + 1}/${checks.length}]`;
  const dots = ".".repeat(Math.max(1, 30 - result.name.length));
  const statusColor = !result.passed ? c.red : (result.detail && result.detail.includes("warning") ? c.yellow : c.green);
  const statusText = !result.passed ? "FAIL" : (result.detail && result.detail.includes("warning") ? "WARN" : "PASS");
  const detailStr = result.detail ? `  (${result.detail})` : "";
  console.log(`${idx} ${result.name}${dots} ${statusColor}${statusText}${c.reset}${detailStr}`);
}

// Print detailed messages for failed/warned checks
const failedResults = results.filter((r) => r.messages && r.messages.length > 0);
if (failedResults.length > 0) {
  for (const result of failedResults) {
    console.log(`\n${c.bold}── ${result.name} details ──${c.reset}`);
    for (const msg of result.messages) console.log(msg);
  }
}

console.log("");

if (totalErrors > 0) {
  console.log(`${c.red}${c.bold}RESULT: FAIL${c.reset} (${totalErrors} error(s)${totalWarnings > 0 ? `, ${totalWarnings} warning(s)` : ""})`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`${c.green}${c.bold}RESULT: PASS${c.reset} (0 errors, ${totalWarnings} warning(s))`);
} else {
  console.log(`${c.green}${c.bold}RESULT: PASS${c.reset} (0 errors, 0 warnings)`);
}
