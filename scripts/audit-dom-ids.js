import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Find all document.getElementById('...') calls
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
const referencedIds = new Set();
let match;
while ((match = idRegex.exec(appJs)) !== null) {
  referencedIds.add(match[1]);
}

console.log(`Found ${referencedIds.size} unique IDs referenced in js/app.js`);

// Find all id="..." in index.html
const htmlIdRegex = /id=['"]([^'"]+)['"]/g;
const existingIds = new Set();
while ((match = htmlIdRegex.exec(html)) !== null) {
  existingIds.add(match[1]);
}

console.log(`Found ${existingIds.size} unique IDs defined in index.html`);

const missingIds = [];
for (const id of referencedIds) {
  if (!existingIds.has(id)) {
    missingIds.push(id);
  }
}

console.log('\n--- MISSING DOM IDs (Referenced in app.js but not in index.html) ---');
if (missingIds.length === 0) {
  console.log('✔ None! All referenced IDs exist in index.html.');
} else {
  missingIds.sort().forEach(id => {
    console.log(`✖ Missing: "${id}"`);
  });
}
