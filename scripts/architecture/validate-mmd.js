const fs = require("node:fs");

const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node validate-mmd.js <input-mmd-file>");
  process.exit(1);
}

try {
  const content = fs.readFileSync(inputFile, "utf8");

  const definedEntities = new Set();
  const referencedEntities = new Set();

  // Regex for definitions: ENTITY_NAME {
  const defRegex = /^\s*([A-Z_0-9]+)\s*\{/gm;
  let match;
  match = defRegex.exec(content);
  while (match !== null) {
    definedEntities.add(match[1]);
    match = defRegex.exec(content);
  }

  // Regex for relationships: ENTITY_A ||--o{ ENTITY_B
  // Supports various cardinalities: ||--||, ||--|{, }|--||, etc.
  const relRegex = /^\s*([A-Z_0-9]+)\s*[}|][|o][-.]+[o|][{|]\s*([A-Z_0-9]+)/gm;
  match = relRegex.exec(content);
  while (match !== null) {
    referencedEntities.add(match[1]);
    referencedEntities.add(match[2]);
    match = relRegex.exec(content);
  }

  const missing = [];
  for (const ref of referencedEntities) {
    if (!definedEntities.has(ref)) {
      missing.push(ref);
    }
  }

  if (missing.length > 0) {
    console.error(
      `❌ Validation Failed: The following entities are used in relationships but NOT defined:`,
    );
    missing.forEach((m) => {
      console.error(`   - ${m}`);
    });
    process.exit(1);
  } else {
    console.log(`✅ Validation Passed: All ${definedEntities.size} entities are fully defined.`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
