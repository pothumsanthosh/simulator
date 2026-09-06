import fs from 'fs';
import { ComponentDefinitions, ComponentTypes } from '../js/engine/components.js';
import { CircuitEngine } from '../js/engine/circuit-engine.js';

const engineCode = fs.readFileSync('./js/engine/circuit-engine.js', 'utf8');
const canvasCode = fs.readFileSync('./js/editor/schematic-canvas.js', 'utf8');

console.log('====================================================');
console.log('  FORENSIC COMPONENT CATALOG & ENGINE AUDIT');
console.log('====================================================');

const allTypes = Object.keys(ComponentDefinitions);
console.log('Total Components in Catalog:', allTypes.length);

const unstamped = [];
const unrendered = [];
const pinAuditResults = [];

for (const type of allTypes) {
  const def = ComponentDefinitions[type];
  const stampPattern = `ComponentTypes.${type}`;
  const hasStamping = engineCode.includes(stampPattern);
  const hasCanvas = canvasCode.includes(stampPattern);

  if (!hasStamping && type !== 'GROUND' && type !== 'NET_LABEL' && type !== 'TEXT_LABEL' && type !== 'ANNOTATION' && type !== 'NODE' && type !== 'JUNCTION') {
    unstamped.push(type);
  }
  if (!hasCanvas) {
    unrendered.push(type);
  }

  // Check pin names
  const declaredPins = def.pins.map(p => p.id);
  const caseIdx = engineCode.indexOf(`case ComponentTypes.${type}:`);
  if (caseIdx !== -1) {
    const nextBreak = engineCode.indexOf('break;', caseIdx);
    const block = engineCode.substring(caseIdx, nextBreak !== -1 ? nextBreak + 6 : caseIdx + 1000);
    const pinRegex = /getNode\s*\(\s*comp\s*,\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    const usedPins = [];
    while ((match = pinRegex.exec(block)) !== null) {
      usedPins.push(match[1]);
    }
    for (const p of usedPins) {
      if (!declaredPins.includes(p)) {
        pinAuditResults.push({ type, pin: p, issue: 'Engine references pin not declared in component pins' });
      }
    }
  }
}

console.log(`\n1. Unstamped Components in Engine (${unstamped.length}):`);
unstamped.forEach(t => console.log(`   - ${t}`));

console.log(`\n2. Unrendered Custom Vector Symbols (${unrendered.length}):`);
unrendered.forEach(t => console.log(`   - ${t}`));

console.log(`\n3. Pin Inconsistencies (${pinAuditResults.length}):`);
pinAuditResults.forEach(r => console.log(`   - [${r.type}] Pin "${r.pin}": ${r.issue}`));
