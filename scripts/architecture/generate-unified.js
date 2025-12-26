const fs = require("fs");

// Usage: node generate-unified.js <input-md-file> <output-mmd-file>
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!(inputFile && outputFile)) {
  console.error("Usage: node generate-unified.js <input-md-file> <output-mmd-file>");
  process.exit(1);
}

try {
  const content = fs.readFileSync(inputFile, "utf8");

  // Regex to find all mermaid blocks
  // Matches ```mermaid [content] ```
  const mermaidRegex = /```mermaid\s+([\s\S]*?)```/g;

  let match;
  let combinedGraph = "erDiagram\n";
  let foundAny = false;

  match = mermaidRegex.exec(content);
  while (match !== null) {
    const graphContent = match[1].trim();

    // Only process ER diagrams
    if (graphContent.startsWith("erDiagram")) {
      foundAny = true;
      // Remove "erDiagram" header from the block
      const body = graphContent.replace("erDiagram", "").trim();
      combinedGraph += "    %% --- Merged Block ---\n";
      // Indent for readability
      combinedGraph += body
        .split("\n")
        .map((line) => "    " + line)
        .join("\n");
      combinedGraph += "\n\n";
    }

    match = mermaidRegex.exec(content);
  }

  if (foundAny) {
    fs.writeFileSync(outputFile, combinedGraph);
    console.log(`✅ generated ${outputFile}`);
  } else {
    console.warn(`⚠️ No erDiagram blocks found in ${inputFile}`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
