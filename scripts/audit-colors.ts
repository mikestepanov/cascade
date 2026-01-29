/**
 * Color audit — finds every non-semantic color reference in the codebase.
 *
 * Enforces the semantic color system defined in tailwind.config.js.
 * Uses allowlists for legitimate exceptions (Google brand colors, email
 * templates, color pickers, etc.).
 *
 * Categories:
 *   SEMANTIC  — our design tokens (brand-*, status-*, accent-*, ui-bg-*, etc.)
 *   SHADCN    — shadcn/ui tokens (muted, foreground, background, etc.)
 *   RAW       — raw Tailwind palette colors (blue-500, red-400, gray-100)
 *   HARDCODED — inline hex (#fff), rgb(), rgba(), hsl()
 *
 * Usage:
 *   npx tsx scripts/audit-colors.ts              # Full report
 *   npx tsx scripts/audit-colors.ts --raw-only   # Only raw Tailwind violations
 *   npx tsx scripts/audit-colors.ts --json       # JSON output for tooling
 *
 * Exit code 1 if violations found (after allowlist filtering).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = "SEMANTIC" | "SHADCN" | "RAW" | "HARDCODED" | "UNKNOWN";
type FindingType = "tw-class" | "hex" | "func" | "style-prop";

interface Finding {
  file: string;
  line: number;
  category: Category;
  type: FindingType;
  value: string;
  color: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const CONVEX = join(ROOT, "convex");
const FLAGS = process.argv.slice(2);
const JSON_OUT = FLAGS.includes("--json");
const RAW_ONLY = FLAGS.includes("--raw-only");

// ── Allowlists ───────────────────────────────────────────────────────────────
// Files or directories where raw/hardcoded colors are acceptable.

const ALLOWLIST_RAW_TAILWIND: string[] = [
  // Landing page uses custom gradient branding (cyan/teal/purple theme)
  "src/components/landing/",
  // Splash screen uses brand gradient animations
  "src/components/auth/AppSplashScreen.tsx",
  // AI chat uses custom speaker color coding
  "src/components/AI/AIChat.tsx",
  // Pumble integration has brand-specific styling
  "src/components/Settings/PumbleIntegration.tsx",
  // Test files — assertions reference raw class names
  "*.test.ts",
  "*.test.tsx",
  // CSS theme definitions (these ARE the token source)
  "src/index.css",
];

const ALLOWLIST_HARDCODED_HEX: string[] = [
  // Google brand colors (mandated by Google brand guidelines)
  "src/components/auth/GoogleAuthButton.tsx",
  // Color picker presets (user-facing color selection)
  "src/components/ui/ColorPicker.tsx",
  "src/components/ui/ColorPicker.test.tsx",
  // CSS theme definitions (these define the semantic tokens)
  "src/index.css",
  // Landing page icons (custom SVG gradients)
  "src/components/landing/",
  // Backend email/notification HTML templates (no Tailwind available)
  "convex/http/",
  "convex/pumble.ts",
  "convex/invites.ts",
  "convex/bookingPages.ts",
  // Backend data defaults (workflow state colors, label defaults)
  "convex/projectTemplates.ts",
  "convex/onboarding.ts",
  "convex/schema.ts",
  "convex/lib/issueHelpers.ts",
  // Labels manager uses hex for user-defined label colors
  "src/components/LabelsManager.tsx",
  // Dev tools tab
  "src/components/Settings/DevToolsTab.tsx",
  // AI config uses semantic string names not classes
  "src/components/AI/config.ts",
  // Test files
  "*.test.ts",
  "*.test.tsx",
  // Backend test files
  "convex/labels.test.ts",
];

// ── Semantic tokens from tailwind.config.js ──────────────────────────────────

const SEMANTIC_PREFIXES = [
  "brand-",
  "accent-",
  "ui-bg-",
  "ui-text-",
  "ui-border-",
  "status-success",
  "status-warning",
  "status-error",
  "status-info",
  "priority-",
  "issue-type-",
  "primary",
  "secondary",
];

// ── Raw Tailwind palette names ───────────────────────────────────────────────

const RAW_COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "black",
  "white",
];

// ── Tailwind class prefixes that take colors ─────────────────────────────────

const TW_PREFIXES = [
  "bg-",
  "text-",
  "border-",
  "ring-",
  "shadow-",
  "divide-",
  "outline-",
  "fill-",
  "stroke-",
  "from-",
  "to-",
  "via-",
  "decoration-",
  "placeholder-",
  "caret-",
];

// ── Regexes ──────────────────────────────────────────────────────────────────

const TW_COLOR_RE = new RegExp(
  "(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl|first|last|odd|even|placeholder):)*" +
    "(?:" +
    TW_PREFIXES.map((p) => p.replace("-", "\\-")).join("|") +
    ")" +
    "([a-z]+-\\d{2,3}(?:\\/\\d{1,3})?)",
  "g",
);

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const FUNC_COLOR_RE = /(?:rgba?|hsla?)\s*\([^)]+\)/g;
const STYLE_PROP_RE =
  /(?:color|backgroundColor|borderColor|background|fill|stroke)\s*:\s*["'][^"']+["']/g;

// ── File walking ─────────────────────────────────────────────────────────────

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss"]);
const SKIP = new Set(["node_modules", "dist", ".next", ".git", "pnpm-lock.yaml"]);

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (EXTS.has(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

// ── Allowlist matching ───────────────────────────────────────────────────────

function isAllowed(filePath: string, allowlist: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return allowlist.some((pattern) => {
    if (pattern.startsWith("*")) {
      return normalized.endsWith(pattern.slice(1));
    }
    return normalized.includes(pattern);
  });
}

// ── Classification ───────────────────────────────────────────────────────────

function classifyTwColor(colorPart: string): Category {
  for (const prefix of SEMANTIC_PREFIXES) {
    if (colorPart.startsWith(prefix)) return "SEMANTIC";
  }
  for (const raw of RAW_COLORS) {
    if (colorPart.startsWith(raw + "-") || colorPart === raw) return "RAW";
  }
  if (
    /^(muted|foreground|background|border|input|ring|card|popover|destructive|accent|primary|secondary)/.test(
      colorPart,
    )
  ) {
    return "SHADCN";
  }
  return "UNKNOWN";
}

// ── Scanner ──────────────────────────────────────────────────────────────────

const findings: Finding[] = [];

function scan(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");

  // Skip self and config files
  if (rel.includes("tailwind.config") || rel.includes("calendar-tailwind-classes")) return;
  if (rel.includes("audit-colors")) return;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // 1. Tailwind color classes
    let match: RegExpExecArray | null;
    TW_COLOR_RE.lastIndex = 0;
    while ((match = TW_COLOR_RE.exec(line)) !== null) {
      const category = classifyTwColor(match[1]);
      if (category === "RAW" && isAllowed(rel, ALLOWLIST_RAW_TAILWIND)) continue;
      findings.push({
        file: rel,
        line: lineNum,
        category,
        type: "tw-class",
        value: match[0],
        color: match[1],
      });
    }

    // 2. Hex colors
    HEX_RE.lastIndex = 0;
    while ((match = HEX_RE.exec(line)) !== null) {
      if (trimmed.startsWith("import ")) continue;
      const hex = match[0].toLowerCase();
      if (hex.length < 4) continue;
      if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
      findings.push({
        file: rel,
        line: lineNum,
        category: "HARDCODED",
        type: "hex",
        value: hex,
        color: hex,
      });
    }

    // 3. rgb/rgba/hsl/hsla
    FUNC_COLOR_RE.lastIndex = 0;
    while ((match = FUNC_COLOR_RE.exec(line)) !== null) {
      if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
      findings.push({
        file: rel,
        line: lineNum,
        category: "HARDCODED",
        type: "func",
        value: match[0],
        color: match[0],
      });
    }

    // 4. Style object color properties
    STYLE_PROP_RE.lastIndex = 0;
    while ((match = STYLE_PROP_RE.exec(line)) !== null) {
      if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
      findings.push({
        file: rel,
        line: lineNum,
        category: "HARDCODED",
        type: "style-prop",
        value: match[0],
        color: match[0],
      });
    }
  }
}

// ── ANSI colors ──────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

// ── Run ──────────────────────────────────────────────────────────────────────

console.log(`${c.bold}Scanning for color violations...${c.reset}\n`);

const files = [...walk(SRC), ...walk(CONVEX)];
for (const f of files) scan(f);

// ── Output ───────────────────────────────────────────────────────────────────

if (JSON_OUT) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(0);
}

// Group by category
const grouped: Record<string, Finding[]> = {};
for (const f of findings) {
  if (!grouped[f.category]) grouped[f.category] = [];
  grouped[f.category].push(f);
}

// Violations = RAW + HARDCODED (after allowlist filtering)
const violations = findings.filter((f) => f.category === "RAW" || f.category === "HARDCODED");

// Summary
console.log("=".repeat(80));
console.log(`${c.bold}COLOR AUDIT SUMMARY${c.reset}`);
console.log("=".repeat(80));
console.log(`Files scanned:  ${files.length}`);
console.log(`Total findings: ${findings.length}`);
console.log(`Violations:     ${violations.length}\n`);

for (const [cat, items] of Object.entries(grouped).sort()) {
  const isViolation = cat === "RAW" || cat === "HARDCODED";
  const color = isViolation ? c.red : c.green;
  console.log(`  ${color}${cat.padEnd(12)}${c.reset} ${String(items.length).padStart(5)} occurrences`);
}
console.log("");

// ── RAW Tailwind violations ──────────────────────────────────────────────────

const rawFindings = grouped.RAW || [];
if (rawFindings.length > 0) {
  console.log("=".repeat(80));
  console.log(`${c.red}${c.bold}RAW TAILWIND COLORS (must use semantic tokens)${c.reset}`);
  console.log("=".repeat(80));

  const byFile: Record<string, Finding[]> = {};
  for (const f of rawFindings) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  for (const [file, items] of Object.entries(byFile).sort()) {
    console.log(`\n  ${c.bold}${file}${c.reset}`);
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.line}:${item.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`    ${c.dim}L${String(item.line).padStart(4)}${c.reset}  ${c.red}${item.value}${c.reset}`);
    }
  }
  console.log("");
}

// ── HARDCODED violations ─────────────────────────────────────────────────────

const hardcoded = grouped.HARDCODED || [];
if (hardcoded.length > 0 && !RAW_ONLY) {
  console.log("=".repeat(80));
  console.log(`${c.red}${c.bold}HARDCODED COLORS (hex, rgb, rgba, hsl, style props)${c.reset}`);
  console.log("=".repeat(80));

  const byFile: Record<string, Finding[]> = {};
  for (const f of hardcoded) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  for (const [file, items] of Object.entries(byFile).sort()) {
    console.log(`\n  ${c.bold}${file}${c.reset}`);
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.line}:${item.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(
        `    ${c.dim}L${String(item.line).padStart(4)}${c.reset}  [${item.type.padEnd(10)}] ${c.yellow}${item.value}${c.reset}`,
      );
    }
  }
  console.log("");
}

// ── Exit ─────────────────────────────────────────────────────────────────────

console.log("=".repeat(80));
if (violations.length > 0) {
  console.log(
    `${c.red}${c.bold}FAIL${c.reset}: ${violations.length} color violation(s) found`,
  );
  console.log(
    `${c.dim}If a file needs an exception, add it to the allowlist in scripts/audit-colors.ts${c.reset}`,
  );
} else {
  console.log(`${c.green}${c.bold}PASS${c.reset}: No color violations found`);
}
console.log("=".repeat(80));

process.exit(violations.length > 0 ? 1 : 0);
