import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { config } from "dotenv";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/analyze_design.js <competitor> <page>
const [, , competitor, page] = process.argv;

if (!competitor || !page) {
  console.error("Usage: node scripts/analyze_design.js <competitor> <page>");
  process.exit(1);
}

const LIBRARY_ROOT = path.resolve(__dirname, "../docs/research/library", competitor);
const screenshotPath = path.join(LIBRARY_ROOT, `${page}_desktop_light.png`);
const deepDataPath = path.join(LIBRARY_ROOT, `${page}_deep.json`);

async function analyze() {
  console.log(`\n🤖 Analyzing UI/UX for ${competitor}/${page}...`);

  if (!fs.existsSync(screenshotPath)) {
    console.error(`   ❌ Screenshot not found: ${screenshotPath}`);
    process.exit(1);
  }

  const screenshot = fs.readFileSync(screenshotPath);
  const deepData = fs.existsSync(deepDataPath)
    ? JSON.parse(fs.readFileSync(deepDataPath, "utf-8"))
    : {};

  try {
    const { text } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this UI screenshot from ${competitor} (${page} page). 
              
              Technical context:
              - Frameworks: ${deepData.fingerprint?.frameworks?.join(", ") || "Unknown"}
              - UI Libraries: ${deepData.fingerprint?.ui?.join(", ") || "Unknown"}
              
              Please provide:
              1. **Layout Labeling**: Identify key sections (Hero, Features, Pricing, etc.) and their approximate vertical positions.
              2. **UX Audit**: Evaluate information density (1-10), visual hierarchy, and CTA clarity.
              3. **Design Tokens**: Note interesting color choices, border radiuses, or spacing patterns.
              4. **Competitor Strategy**: What feeling is this UI trying to evoke (e.g., premium, developer-centric, enterprise)?
              
              Respond in JSON format.`,
            },
            {
              type: "image",
              image: screenshot,
            },
          ],
        },
      ],
    });

    const outputPath = path.join(LIBRARY_ROOT, `${page}_analysis.json`);
    fs.writeFileSync(outputPath, text);
    console.log(`\n✅ Analysis saved to ${outputPath}`);
  } catch (err) {
    console.error(`\n❌ AI Analysis failed: ${err.message}`);
  }
}

analyze();
