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

  function checkTypographyTags(node, filePath) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText();
      const rawTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6"];
      if (rawTags.includes(tagName)) {
        reportError(filePath, node, `Use <Typography> component instead of raw <${tagName}> tags.`);
      }
    }
  }

  function checkClassNameConcatenation(node, filePath) {
    if (node.initializer && ts.isJsxExpression(node.initializer)) {
      const expr = node.initializer.expression;

      // Check for template literals or binary expressions (manual concatenation)
      if (expr && (ts.isTemplateExpression(expr) || ts.isBinaryExpression(expr))) {
        reportError(
          filePath,
          node,
          "Avoid manual string concatenation in className. Use cn() utility instead.",
        );
      }
    }
  }

  function checkFlexHeuristic(node, _filePath) {
    // Check for "flex" usage heuristic
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

    if (hasFlex && hasAlignment && !classText.includes("hidden")) {
      // Logic for suggesting <Flex> component could go here if enabled
    }
  }

  function checkDarkModeStandard(node, filePath) {
    if (!ts.isJsxAttribute(node) || node.name.getText() !== "className") return;

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

    // Flag redundant dark mode classes for semantic tokens
    const classes = classText.split(/\s+/);
    const REDUNDANT_PATTERN = /(bg|text|border)-(ui-bg|ui-text|ui-border|status)-[a-z-]+-dark/;

    if (classes.some((cls) => cls.includes("dark:") && REDUNDANT_PATTERN.test(cls))) {
      reportError(
        filePath,
        node,
        "Redundant dark mode class detected. Semantic tokens now handle dark mode automatically in index.css. Use single classes like 'bg-ui-bg-primary' instead of 'dark:bg-ui-bg-primary-dark'.",
        "warning",
      );
    }
  }

  const tailwindShorthandMap = {
    "flex-shrink-0": "shrink-0",
    "flex-shrink": "shrink",
    "flex-grow-0": "grow-0",
    "flex-grow": "grow",
  };

  function checkTailwindShorthands(node, filePath) {
    if (!ts.isJsxAttribute(node) || node.name.getText() !== "className") return;

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

    const classes = classText.split(/\s+/);
    for (const cls of classes) {
      if (tailwindShorthandMap[cls]) {
        reportError(
          filePath,
          node,
          `Non-canonical Tailwind class detected: '${cls}'. Use '${tailwindShorthandMap[cls]}' instead.`,
          "warning",
        );
      }
    }
  }

  function checkClassName(node, filePath) {
    if (!ts.isJsxAttribute(node) || node.name.getText() !== "className") return;
    checkClassNameConcatenation(node, filePath);
    checkFlexHeuristic(node, filePath);
    checkDarkModeStandard(node, filePath);
    checkTailwindShorthands(node, filePath);
  }

  function visit(node) {
    checkTypographyTags(node, filePath);
    checkClassName(node, filePath);
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
