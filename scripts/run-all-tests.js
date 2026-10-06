import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, '..', 'test');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.js'));

console.log(`\n======================================================`);
console.log(`  e-Samastha Automated Test Suite Runner`);
console.log(`  Found ${files.length} test suites in /test`);
console.log(`======================================================\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const file of files) {
  const filePath = path.join(testDir, file);
  try {
    const { stdout } = await execAsync(`node "${filePath}"`);
    console.log(`[PASS] ${file}`);
    passed++;
  } catch (err) {
    console.log(`[FAIL] ${file}`);
    failed++;
    failures.push({
      file,
      error: (err.stderr || err.stdout || err.message).trim()
    });
  }
}

console.log(`\n======================================================`);
console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed out of ${files.length} Suites`);
console.log(`======================================================\n`);

if (failures.length > 0) {
  console.log(`Failure details:`);
  for (const f of failures) {
    console.log(`\n--- ${f.file} ---`);
    console.log(f.error.split('\n').slice(0, 10).join('\n'));
  }
  process.exit(1);
} else {
  console.log(`All suites passed successfully!\n`);
  process.exit(0);
}
