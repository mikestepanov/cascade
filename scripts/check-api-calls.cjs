const fs = require('fs');
const path = require('path');

// Cross-platform recursive file finder
function findFiles(dir, pattern) {
  const results = [];

  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch (e) {
      // Directory not accessible, skip
    }
  }

  walk(dir);
  return results;
}

// Get all API calls from src (excluding comments)
const srcFiles = findFiles('src', /\.(ts|tsx)$/);
const apiCalls = new Map(); // call -> [files]

for (const file of srcFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      const matches = line.matchAll(/api\.(\w+)\.(\w+)/g);
      for (const match of matches) {
        const call = match[1] + '.' + match[2];
        if (!apiCalls.has(call)) {
          apiCalls.set(call, []);
        }
        apiCalls.get(call).push(`${file}:${i + 1}`);
      }
    }
  } catch(e) {}
}

// Get all exported functions from convex (top-level only)
const convexTopLevel = findFiles('convex', /\.ts$/).filter(f => {
  const rel = path.relative('convex', f);
  return !rel.includes(path.sep) && !rel.includes('.test.') && !rel.includes('schema') && !rel.includes('config');
});

const exportedFuncs = new Map();

for (const file of convexTopLevel) {
  const module = path.basename(file, '.ts');
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/export const (\w+)\s*=/g);
    const funcs = new Set();
    for (const match of matches) {
      funcs.add(match[1]);
    }
    exportedFuncs.set(module, funcs);
  } catch(e) {}
}

// Check subdirectories like ai/, email/, etc.
const subdirs = ['ai', 'email', 'api', 'http', 'lib', 'internal'];
for (const subdir of subdirs) {
  const subPath = path.join('convex', subdir);
  if (!fs.existsSync(subPath)) continue;

  const subFiles = findFiles(subPath, /\.ts$/);
  for (const file of subFiles) {
    const submodule = path.basename(file, '.ts');
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.matchAll(/export const (\w+)\s*=/g);
      const funcs = new Set();
      for (const match of matches) {
        funcs.add(match[1]);
      }
      exportedFuncs.set(subdir + '.' + submodule, funcs);
    } catch(e) {}
  }
}

// Find mismatches
console.log('=== CHECKING API CALLS ===\n');
let found = 0;
for (const [call, files] of [...apiCalls.entries()].sort()) {
  const [module, func] = call.split('.');

  // Skip special cases (URL strings, not actual API calls)
  if (module === 'convex') continue;
  if (call === 'pumble.com') continue;

  // Check if it's a submodule call like ai.actions (these are valid nested modules)
  if (exportedFuncs.has(call)) continue;

  // Skip known valid submodule patterns (ai.actions, ai.mutations, ai.queries, etc.)
  if (['ai.actions', 'ai.mutations', 'ai.queries', 'email.notifications', 'email.helpers'].includes(call)) continue;

  const moduleFuncs = exportedFuncs.get(module);
  if (!moduleFuncs) {
    console.log('❌ MISSING MODULE: convex/' + module + '.ts');
    console.log('   Used as: api.' + call);
    console.log('   In: ' + files.slice(0, 3).join(', ') + (files.length > 3 ? ` (+${files.length - 3} more)` : ''));
    found++;
  } else if (!moduleFuncs.has(func)) {
    console.log('❌ MISSING FUNCTION: api.' + call);
    console.log('   In: ' + files.slice(0, 3).join(', ') + (files.length > 3 ? ` (+${files.length - 3} more)` : ''));
    console.log('   Available: ' + [...moduleFuncs].slice(0, 8).join(', ') + (moduleFuncs.size > 8 ? '...' : ''));
    found++;
  }
}

console.log('\n=== SUMMARY ===');
if (found === 0) {
  console.log('✅ All ' + apiCalls.size + ' API calls are valid!');
  process.exit(0);
} else {
  console.log('❌ Found ' + found + ' invalid API calls');
  process.exit(1);
}
