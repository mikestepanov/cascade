import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/scrape_deep_data.js <URL> <competitor/page>
// Example: node scripts/scrape_deep_data.js https://clickup.com/pricing clickup/pricing
const [,, targetUrl, targetPath] = process.argv;

if (!targetUrl || !targetPath) {
  console.error('Usage: node scripts/scrape_deep_data.js <URL> <competitor/page>');
  console.error('Example: node scripts/scrape_deep_data.js https://clickup.com/pricing clickup/pricing');
  process.exit(1);
}

(async () => {
  console.log(`Starting Deep Capture for ${targetPath} (${targetUrl})...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 1. Navigate
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Navigated.');
  
  // 2. Wait and Scroll
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  // 3. Extract HTML (Computed DOM)
  const fullHtml = await page.content();
  
  // 4. Extract Deep Data
  const deepData = await page.evaluate(() => {
    // Network (Performance)
    const network = performance.getEntriesByType('resource').map(e => ({
      name: e.name,
      type: e.initiatorType,
      duration: e.duration,
      size: e.transferSize
    }));

    // CSS Vars
    const cssVars = {};
    try {
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.style) {
                        for (let i = 0; i < rule.style.length; i++) {
                            const prop = rule.style[i];
                            if (prop.startsWith('--')) {
                                cssVars[prop] = rule.style.getPropertyValue(prop).trim();
                            }
                        }
                    }
                }
            } catch(e) {}
        }
    } catch(e) {}

    // Fonts
    const fonts = [];
    try {
        document.fonts.forEach(f => fonts.push({ family: f.family, status: f.status }));
    } catch(e) {}

    // Scripts
    const scripts = Array.from(document.scripts).map(s => s.src).filter(Boolean);

    return { network, cssVars, fonts, scripts };
  });

  // 5. Save Files
  const outputDir = path.resolve(__dirname, '../docs/research/library', targetPath);
  
  if (!fs.existsSync(outputDir)){
      fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(targetPath);
  fs.writeFileSync(path.join(outputDir, `${baseName}.html`), fullHtml);
  fs.writeFileSync(path.join(outputDir, `${baseName}_deep.json`), JSON.stringify(deepData, null, 2));

  console.log(`Success: Saved ${baseName}.html and ${baseName}_deep.json to ${outputDir}`);
  
  await browser.close();
})();
