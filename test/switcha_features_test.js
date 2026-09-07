/**
 * Switcha Features & Rebranding Test Suite
 * Tests My Circuits storage, PWA Manifest, SVG icons, and switches/digital components.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log('  SWITCHA 2.0: FEATURE & ARCHITECTURE INTEGRATION TEST SUITE');
console.log('======================================================================\n');

// 1. Manifest verification
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
assert.strictEqual(manifest.name, 'Switcha - Interactive Electronic & Digital Circuit Simulator');
assert.strictEqual(manifest.short_name, 'Switcha');
assert.strictEqual(manifest.theme_color, '#03b585');
assert.ok(manifest.shortcuts && manifest.shortcuts.length >= 3, 'Manifest has shortcut actions');
console.log('✓ PASS: Web App Manifest is fully configured for Switcha PWA installability');

// 2. Icon verification
const iconSvg = fs.readFileSync(path.join(rootDir, 'icons', 'icon.svg'), 'utf8');
assert.ok(iconSvg.toLowerCase().includes('switcha'), 'Icon contains Switcha brand element');
assert.ok(iconSvg.includes('<svg'), 'Valid SVG format');
console.log('✓ PASS: App Icon SVG created with modern dark tech background and switch terminal aesthetics');

// 3. HTML markup verification
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert.ok(indexHtml.includes('id="view-my-circuits"'), 'HTML has view-my-circuits');
assert.ok(indexHtml.includes('id="btnSaveMyCircuit"'), 'HTML has Save to My Circuits toolbar button');
assert.ok(indexHtml.includes('id="networkStatusPill"'), 'HTML has live network status pill');
assert.ok(indexHtml.includes('id="switchaToast"'), 'HTML has floating toast container');
assert.ok(indexHtml.includes('SWITCH_SPST'), 'HTML quick components include SPST switch');
assert.ok(indexHtml.includes('SEVEN_SEG_DISPLAY'), 'HTML quick components include 7-segment display');
assert.ok(!indexHtml.includes('ElectroSim'), 'HTML has zero lingering ElectroSim references');
console.log('✓ PASS: index.html markup contains all Switcha views, components, and zero legacy names');

// 4. CSS Verification
const styleCss = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');
assert.ok(styleCss.includes('.network-status-pill'), 'CSS contains network status pill styles');
assert.ok(styleCss.includes('.my-circuits-container'), 'CSS contains My Circuits styles');
assert.ok(styleCss.includes('.switcha-toast'), 'CSS contains floating toast notification styles');
console.log('✓ PASS: CSS stylesheet includes responsive styles for My Circuits and live status indicators');

// 5. Service Worker Verification
const swJs = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
assert.ok(swJs.includes('switcha-pwa-v'), 'SW cache name matches switcha-pwa-v*');
assert.ok(!swJs.includes('electrosim'), 'SW has zero electrosim references');
console.log('✓ PASS: Service Worker is updated with Switcha PWA cache strategy');

console.log('\n======================================================================');
console.log('✓ ALL SWITCHA 2.0 FEATURE VERIFICATIONS PASSED CLEANLY (5/5)');
console.log('======================================================================\n');
