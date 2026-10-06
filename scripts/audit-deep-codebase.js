import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('=== AUDIT 1: Duplicate IDs in index.html ===');
const html = fs.readFileSync('index.html', 'utf8');
const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
const idCounts = {};
for (const m of idMatches) {
  const id = m[1];
  idCounts[id] = (idCounts[id] || 0) + 1;
}
const duplicateIds = Object.entries(idCounts).filter(([_, count]) => count > 1);
if (duplicateIds.length > 0) {
  console.log('Found duplicate IDs:');
  duplicateIds.forEach(([id, count]) => console.log(`  - #${id} (count: ${count})`));
} else {
  console.log('No duplicate IDs found. Total unique IDs: ' + Object.keys(idCounts).length);
}

console.log('\n=== AUDIT 2: Unsafe getElementById in js/app.js ===');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const lines = appJs.split('\n');
const unsafeAccesses = [];

lines.forEach((line, idx) => {
  const directCall = line.match(/document\.getElementById\(['"]([^'"]+)['"]\)\.(addEventListener|click|focus|value|disabled|innerHTML|textContent|style)/);
  if (directCall) {
    const id = directCall[1];
    if (!idCounts[id]) {
      unsafeAccesses.push({ line: idx + 1, id, text: line.trim() });
    }
  }
});

console.log(`Unsafe document.getElementById calls without optional chaining on missing IDs: ${unsafeAccesses.length}`);
unsafeAccesses.forEach(a => {
  console.log(`  Line ${a.line}: #${a.id} -> ${a.text}`);
});

console.log('\n=== AUDIT 3: Missing Images / Assets / CSS references ===');
const assetMatches = html.matchAll(/(?:src|href)=["']([^"']+)["']/g);
const missingFiles = [];
for (const m of assetMatches) {
  const ref = m[1];
  if (ref.startsWith('http') || ref.startsWith('#') || ref.startsWith('mailto:') || ref.startsWith('javascript:')) continue;
  const cleanPath = ref.split('?')[0];
  if (!fs.existsSync(cleanPath)) {
    missingFiles.push({ ref, cleanPath });
  }
}
console.log(`Missing local asset references: ${missingFiles.length}`);
missingFiles.forEach(f => console.log(`  - ${f.ref}`));

console.log('\n=== AUDIT 4: Broken internal anchor links ===');
const anchorMatches = html.matchAll(/href=["'](#[^"']*)["']/g);
const missingAnchors = [];
for (const m of anchorMatches) {
  const hash = m[1];
  if (hash.startsWith('#/')) continue;
  const targetId = hash.slice(1);
  if (targetId && !idCounts[targetId]) {
    missingAnchors.push(hash);
  }
}
console.log(`Missing target anchors: ${missingAnchors.length}`);
missingAnchors.forEach(a => console.log(`  - ${a}`));

console.log('\n=== AUDIT 5: Preset Options vs CircuitLibrary ===');
const { CircuitLibrary } = await import('../js/editor/circuit-library.js');
const libKeys = new Set(Object.keys(CircuitLibrary));
const selectBlock = html.match(/<select[^>]*id=["']circuitPresetSelect["'][^>]*>([\s\S]*?)<\/select>/);
if (selectBlock) {
  const optionMatches = selectBlock[1].matchAll(/value=["']([^"']+)["']/g);
  const selectKeys = [];
  for (const om of optionMatches) {
    if (om[1]) selectKeys.push(om[1]);
  }
  const missingPresets = selectKeys.filter(k => !libKeys.has(k));
  console.log(`HTML Preset options count: ${selectKeys.length}, missing in CircuitLibrary: ${missingPresets.length}`);
  if (missingPresets.length > 0) {
    console.log('Missing presets:', missingPresets);
  }
}

console.log('\n=== AUDIT 6: Protected 6 Engine Files Integrity ===');
const protectedFiles = {
  'js/engine/circuit-engine.js': '80FAB4167D8622F41C59F5200C0E872E2B9EB84359299164415129C3AD8174F2',
  'js/engine/components.js': '2DD3A84EE68214613AFA659C08F0C484554062591BC41FB0ADA8DFC607D0CDFA',
  'js/engine/circuit-model.js': '997A02D15ADF3BFABA3D5278D0BAF9ED0F7CF2A3499AAED77429A359F25F3B03',
  'js/editor/instruments.js': '20EB6DCAC700A5811F146315C47054D86302DEBD2F394F6F090249EC99670EFF',
  'js/editor/grapher.js': '78344C873F6F56E43CD8BC2FBC630A073EB8F24DF381EC2829909F6C2C16C7EF',
  'js/editor/schematic-canvas.js': '3F85A9AD9C31F3B0112F90B1A7295FA1925EEB9F5F79BCE2EB333CE4F121D5E5'
};
let protectedIntact = true;
for (const [filePath, expectedHash] of Object.entries(protectedFiles)) {
  const content = fs.readFileSync(filePath);
  const actualHash = crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
  if (actualHash !== expectedHash) {
    console.error(`❌ Hash MISMATCH for ${filePath}: expected ${expectedHash}, got ${actualHash}`);
    protectedIntact = false;
  } else {
    console.log(`✅ ${filePath} hash verified.`);
  }
}
if (protectedIntact) console.log('All 6 protected files are 100% intact.');
