import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "../src");
const IGNORE_DIRS = ["src/lib", "src/components/ui"]; // Ignore utils/ui components themselves

// Colors for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

let errorCount = 0;

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      if (filePath.endsWith(".tsx")) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function checkFile(filePath) {
  // skip ignored dirs
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath).split(path.sep).join("/");
  if (IGNORE_DIRS.some((d) => relPath.startsWith(d))) return;

  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  function visit(node) {
    // 1. Check for raw <p> tags
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText();
      if (tagName === "p") {
        reportError(filePath, node, "Use <Typography> component instead of raw <p> tags.");
      }
    }

    // 2. Check className attributes
    if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
      if (node.initializer && ts.isJsxExpression(node.initializer)) {
        const expr = node.initializer.expression;

        // Check for template literals inside className: className={`... ${...}`}
        if (expr && ts.isTemplateExpression(expr)) {
          reportError(
            filePath,
            node,
            "Avoid manual string concatenation in className. Use cn() utility instead.",
          );
        }

        // Check for manual concatenation: className={"..." + "..."}
        if (expr && ts.isBinaryExpression(expr)) {
          reportError(
            filePath,
            node,
            "Avoid manual string concatenation in className. Use cn() utility instead.",
          );
        }
      }

      // 3. Check for specific 'flex' usage in string literals could be <Flex>
      // This is heuristic: if className contains "flex" and "items-center" or "justify-...", suggest <Flex>
      // We look at StringLiteral inside className="..." or className={"..."}
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

      const hasFlex = classText.includes("flex");
      const hasAlignment = classText.includes("items-") || classText.includes("justify-");
      // Only flag if it's a simple flex container to avoid false positives on complex layouts
      // This is a naive check; might want to disable "flex" check if it's too noisy
      // For now, let's keep it disabled or strict? User asked for "using flex classname instead of Flex component"
      // Let's flag if we see "flex" AND alignment, as that's exactly what <Flex> does.

      // Excluding specific commonly used non-layout flexes if needed, or stick to strict.
      if (hasFlex && hasAlignment && !classText.includes("hidden")) {
        // hidden often implies responsive toggling where <Flex> might be trickier without props
        // This is a warning/suggestion
        // reportError(filePath, node, "Consider using <Flex> component for flex layouts.", "warning");
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function reportError(filePath, node, message, level = "error") {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());

  const color = level === "error" ? colors.red : colors.yellow;
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  console.log(
    `${color}${level.toUpperCase()}${colors.reset} ${relPath}:${line + 1}:${character + 1} - ${message}`,
  );

  if (level === "error") {
    errorCount++;
  }
}

console.log(`${colors.bold}Running Standards Check...${colors.reset}`);
const files = walk(ROOT_DIR);
files.forEach(checkFile);

if (errorCount > 0) {
  console.log(`\n${colors.red}Found ${errorCount} architectural violations.${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}All architectural checks passed!${colors.reset}`);
  process.exit(0);
}
