/**
 * Deep color audit — finds every color reference in the codebase.
 *
 * Scans src/ and convex/ for color usage and categorizes each occurrence:
 *
 *   SEMANTIC  — uses our design tokens (brand-*, status-*, accent-*, ui-bg-*, etc.)
 *   SHADCN    — uses shadcn/ui tokens (muted, foreground, background, etc.)
 *   RAW       — raw Tailwind palette colors (blue-500, red-400, gray-100, etc.)
 *   HARDCODED — inline hex (#fff), rgb(), rgba(), hsl() in component files
 *   UNKNOWN   — unrecognized color pattern
 *
 * Usage:
 *   node scripts/audit-colors.cjs              # Full report
 *   node scripts/audit-colors.cjs --raw-only   # Only show raw Tailwind violations
 *   node scripts/audit-colors.cjs --json       # JSON output for tooling
 */

const { readFileSync, readdirSync, statSync } = require("node:fs");
const { join, relative, extname } = require("node:path");

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const CONVEX = join(ROOT, "convex");
const FLAGS = process.argv.slice(2);
const JSON_OUT = FLAGS.includes("--json");
const RAW_ONLY = FLAGS.includes("--raw-only");

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

// Tailwind color class: bg-blue-500, text-red-400/50, border-gray-100, etc.
const TW_COLOR_RE = new RegExp(
  "(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl|first|last|odd|even|placeholder):)*" +
    "(?:" +
    TW_PREFIXES.map((p) => p.replace("-", "\\-")).join("|") +
    ")" +
    "([a-z]+-\\d{2,3}(?:\\/\\d{1,3})?)",
  "g",
);

// Hex color: #fff, #ffffff, #ffffffaa
const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;

// rgb/rgba/hsl/hsla
const FUNC_COLOR_RE = /(?:rgba?|hsla?)\s*\([^)]+\)/g;

// Style object color properties
const STYLE_PROP_RE =
  /(?:color|backgroundColor|borderColor|background|fill|stroke)\s*:\s*["'][^"']+["']/g;

// ── File walker ──────────────────────────────────────────────────────────────
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss"]);
const SKIP = new Set(["node_modules", "dist", ".next", ".git", "pnpm-lock.yaml"]);

function walk(dir) {
  const results = [];
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

// ── Classify a Tailwind color class ──────────────────────────────────────────
function classifyTwColor(colorPart) {
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

// ── Main scan ────────────────────────────────────────────────────────────────
const findings = [];

function scan(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");

  // Skip tailwind config and the old safelist file
  if (rel.includes("tailwind.config") || rel.includes("calendar-tailwind-classes")) return;
  // Skip this script
  if (rel.includes("audit-colors")) return;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // 1. Tailwind color classes
    let match;
    TW_COLOR_RE.lastIndex = 0;
    while ((match = TW_COLOR_RE.exec(line)) !== null) {
      findings.push({
        file: rel,
        line: lineNum,
        category: classifyTwColor(match[1]),
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

// ── Run ──────────────────────────────────────────────────────────────────────
console.log("Scanning...\n");

const files = [...walk(SRC), ...walk(CONVEX)];
for (const f of files) scan(f);

// ── Report ───────────────────────────────────────────────────────────────────

if (JSON_OUT) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(0);
}

// Group by category
const grouped = {};
for (const f of findings) {
  const cat = f.category;
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push(f);
}

// Summary
console.log("=".repeat(80));
console.log("COLOR AUDIT SUMMARY");
console.log("=".repeat(80));
console.log("Files scanned:  " + files.length);
console.log("Total findings: " + findings.length + "\n");

for (const [cat, items] of Object.entries(grouped).sort()) {
  console.log("  " + cat.padEnd(12) + String(items.length).padStart(5) + " occurrences");
}
console.log("");

// ── RAW Tailwind colors ─────────────────────────────────────────────────────
const rawFindings = grouped.RAW || [];
if (rawFindings.length > 0) {
  console.log("=".repeat(80));
  console.log("RAW TAILWIND COLORS (should use semantic tokens)");
  console.log("=".repeat(80));

  const byFile = {};
  for (const f of rawFindings) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  for (const [file, items] of Object.entries(byFile).sort()) {
    console.log("\n  " + file);
    const seen = new Set();
    for (const item of items) {
      const key = item.line + ":" + item.value;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log("    L" + String(item.line).padStart(4) + "  " + item.value);
    }
  }
  console.log("");
}

// ── HARDCODED colors ─────────────────────────────────────────────────────────
const hardcoded = grouped.HARDCODED || [];
if (hardcoded.length > 0 && !RAW_ONLY) {
  console.log("=".repeat(80));
  console.log("HARDCODED COLORS (hex, rgb, rgba, hsl, style props)");
  console.log("=".repeat(80));

  const byFile = {};
  for (const f of hardcoded) {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
  }

  for (const [file, items] of Object.entries(byFile).sort()) {
    console.log("\n  " + file);
    const seen = new Set();
    for (const item of items) {
      const key = item.line + ":" + item.value;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(
        "    L" +
          String(item.line).padStart(4) +
          "  [" +
          item.type.padEnd(10) +
          "] " +
          item.value,
      );
    }
  }
  console.log("");
}

// ── Unique raw color values ──────────────────────────────────────────────────
if (rawFindings.length > 0) {
  console.log("=".repeat(80));
  console.log("UNIQUE RAW TAILWIND COLORS (by frequency)");
  console.log("=".repeat(80));

  const freq = {};
  for (const f of rawFindings) {
    freq[f.value] = (freq[f.value] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  for (const [value, count] of sorted) {
    console.log("  " + String(count).padStart(4) + "x  " + value);
  }
  console.log("");
}

// ── Unique hardcoded hex values ──────────────────────────────────────────────
const hexFindings = hardcoded.filter((f) => f.type === "hex");
if (hexFindings.length > 0 && !RAW_ONLY) {
  console.log("=".repeat(80));
  console.log("UNIQUE HARDCODED HEX VALUES (by frequency)");
  console.log("=".repeat(80));

  const freq = {};
  for (const f of hexFindings) {
    freq[f.value] = (freq[f.value] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  for (const [value, count] of sorted) {
    console.log("  " + String(count).padStart(4) + "x  " + value);
  }
  console.log("");
}

// ── Exit code ────────────────────────────────────────────────────────────────
console.log("=".repeat(80));
if (rawFindings.length > 0) {
  console.log(
    "RESULT: " + rawFindings.length + " raw Tailwind color(s) found — review needed",
  );
} else {
  console.log("RESULT: All clear — no raw Tailwind colors found");
}
console.log("=".repeat(80));

process.exit(rawFindings.length > 0 ? 1 : 0);
