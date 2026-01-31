/**
 * CHECK 5: Arbitrary Tailwind
 * Arbitrary values like h-[50px] (warning only)
 */

import fs from "node:fs";
import path from "node:path";
import { ROOT, walkDir } from "./utils.js";

export function run() {
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

  // Approved arbitrary values that cannot be replaced with design tokens
  const ALLOWED_PATTERNS = [
    // CSS calc expressions (responsive safe-area)
    /max-w-\[calc\(/,
    // Radix CSS variable bindings
    /\[var\(--radix-/,
    // Percentage max-widths for constrained layouts (service worker banners)
    /max-w-\[90%\]/,
    // Slide animation offsets (e.g. slide-out-to-top-[48%])
    /slide-(in|out)[\w-]+-\[\d+%\]/,
  ];

  const files = walkDir(srcDir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  let totalFound = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      for (const { regex } of patterns) {
        if (regex.test(line)) {
          // Skip lines matching approved patterns
          if (ALLOWED_PATTERNS.some((allowed) => allowed.test(line))) {
            break;
          }
          totalFound++;
          break; // count each line only once
        }
      }
    }
  }

  return {
    passed: true, // warnings only, never fails
    errors: 0,
    warnings: totalFound,
    detail: totalFound > 0 ? `${totalFound} arbitrary value(s), warning` : null,
    messages: [],
  };
}
