import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), 'chrome-deep-audit-' + Date.now());
fs.mkdirSync(userDataDir, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 500);
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1600,1050',
  'http://localhost:3000/#/create'
], { stdio: 'ignore' });

// Poll for CDP
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs.find(t => t.type === 'page' && !t.url?.startsWith('chrome-extension') && t.webSocketDebuggerUrl);
    if (target) {
      wsUrl = target.webSocketDebuggerUrl;
      break;
    }
  } catch (e) {}
}

if (!wsUrl) {
  console.error('Failed to connect to CDP');
  chromeProc.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();
const consoleErrors = [];
const consoleWarnings = [];
const unhandledExceptions = [];
const networkFailures = [];

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  } else if (data.method === 'Runtime.consoleAPICalled') {
    if (data.params.type === 'error') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleErrors.push(text);
    } else if (data.params.type === 'warning') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleWarnings.push(text);
    }
  } else if (data.method === 'Runtime.exceptionThrown') {
    unhandledExceptions.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception?.description || ''));
  } else if (data.method === 'Network.responseReceived') {
    const status = data.params.response.status;
    if (status >= 400) {
      networkFailures.push({ url: data.params.response.url, status });
    }
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Eval error: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result?.value;
}

const bugsFound = [];

// Wait for window.app to be ready
let appReady = false;
for (let i = 0; i < 40; i++) {
  try {
    const ready = await evaluate(`typeof window.app !== 'undefined' && window.app.canvas !== undefined`);
    if (ready) {
      appReady = true;
      break;
    }
  } catch (_) {}
  await new Promise(r => setTimeout(r, 200));
}
if (!appReady) {
  bugsFound.push('window.app failed to initialize within 8 seconds');
}

console.log('--- TEST 1: View Modes Switching (Schematic, Split, Grapher) ---');
try {
  for (const mode of ['schematic', 'split', 'grapher']) {
    await evaluate(`window.app.setViewMode('${mode}')`);
    await new Promise(r => setTimeout(r, 200));
    const currentMode = await evaluate(`window.app.currentViewMode || window.app.currentMode`);
    if (currentMode !== mode) {
      bugsFound.push(`View mode switch to '${mode}' failed, current is '${currentMode}'`);
    }
    const buttonActive = await evaluate(`document.querySelector('#view-studio .view-mode-btn[data-mode="${mode}"]')?.classList.contains('active')`);
    if (!buttonActive) {
      bugsFound.push(`View mode button for '${mode}' not marked active`);
    }
  }
  await evaluate(`window.app.setViewMode('split')`);
} catch (e) {
  bugsFound.push(`View mode switching error: ${e.message}`);
}

console.log('--- TEST 2: Instrument Modals (DMM, Logic Analyzer, FFT) ---');
try {
  for (const inst of ['btnOpenDMM', 'btnOpenLogicAnalyzer', 'btnOpenSpectrumAnalyzer']) {
    const clicked = await evaluate(`
      (() => {
        const btn = document.getElementById('${inst}');
        if (!btn) return 'BUTTON_MISSING';
        btn.click();
        return 'CLICKED';
      })()
    `);
    if (clicked === 'BUTTON_MISSING') {
      bugsFound.push(`Instrument button #${inst} missing in DOM`);
    }
    await new Promise(r => setTimeout(r, 300));
    // Close open modals
    await evaluate(`document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'))`);
  }
} catch (e) {
  bugsFound.push(`Instrument modals error: ${e.message}`);
}

console.log('--- TEST 3: Component Operations (Add, Rotate, Flip, Delete) ---');
try {
  const compOpResult = await evaluate(`
    (() => {
      const app = window.app;
      const initialCount = app.canvas.components.length;
      
      // 1. Add resistor
      const comp = app.canvas.addComponent('RESISTOR', 500, 300);
      if (!comp || app.canvas.components.length !== initialCount + 1) {
        return 'ADD_FAILED';
      }
      
      // 2. Select it
      app.canvas.selectedComponent = comp;
      
      // 3. Rotate it
      const origRot = comp.rotation || 0;
      app.canvas.rotateSelected(90);
      if (comp.rotation !== (origRot + 90) % 360) {
        return 'ROTATE_FAILED';
      }
      
      // 4. Flip it
      app.canvas.flipSelected('x');
      if (!comp.flipX) {
        return 'FLIP_FAILED';
      }
      
      // 5. Delete it
      app.canvas.removeSelected();
      if (app.canvas.components.length !== initialCount) {
        return 'DELETE_FAILED';
      }
      
      return 'SUCCESS';
    })()
  `);
  if (compOpResult !== 'SUCCESS') {
    bugsFound.push(`Component operations failed: ${compOpResult}`);
  }
} catch (e) {
  bugsFound.push(`Component operations error: ${e.message}`);
}

console.log('--- TEST 4: Simulation Execution & Reset ---');
try {
  const simResult = await evaluate(`
    (() => {
      const app = window.app;
      app.startSimulation();
      return app.isSimRunning;
    })()
  `);
  if (!simResult) bugsFound.push('Simulation failed to start');
  await new Promise(r => setTimeout(r, 500));
  
  const simTime = await evaluate(`window.app.engine.time`);
  if (simTime <= 0) bugsFound.push(`Simulation time did not advance: ${simTime}`);

  await evaluate(`window.app.stopSimulation()`);
  await evaluate(`window.app.resetSimulation()`);
  const resetTime = await evaluate(`window.app.engine.time`);
  if (resetTime !== 0) bugsFound.push(`Simulation reset failed, time is ${resetTime}`);
} catch (e) {
  bugsFound.push(`Simulation control error: ${e.message}`);
}

console.log('--- TEST 5: Preset Circuits Loading ---');
try {
  const presets = ['buckConverter', 'rcPhaseShiftOscillator', 'bjtCommonEmitter', 'invertingOpAmp'];
  for (const presetKey of presets) {
    const loaded = await evaluate(`
      (() => {
        window.app.loadCircuitPreset('${presetKey}');
        return window.app.canvas.components.length > 0;
      })()
    `);
    if (!loaded) bugsFound.push(`Preset '${presetKey}' loaded 0 components`);
    await new Promise(r => setTimeout(r, 200));
  }
} catch (e) {
  bugsFound.push(`Preset loading error: ${e.message}`);
}

console.log('--- TEST 6: Discover Circuits Navigation & Filter Tabs ---');
try {
  await evaluate(`window.location.hash = '#/discover'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 500));
  const filterTabsResult = await evaluate(`
    (() => {
      const tabs = document.querySelectorAll('#view-discover .filter-tab');
      if (tabs.length === 0) return 'NO_TABS';
      let clicksOk = true;
      tabs.forEach(t => {
        t.click();
        if (!t.classList.contains('active')) clicksOk = false;
      });
      return clicksOk ? 'TABS_OK' : 'TAB_CLICK_FAIL';
    })()
  `);
  if (filterTabsResult !== 'TABS_OK') bugsFound.push(`Discover filter tabs failed: ${filterTabsResult}`);
} catch (e) {
  bugsFound.push(`Discover circuits error: ${e.message}`);
}

console.log('--- TEST 7: Dynamic Blocks Studio Execution ---');
try {
  await evaluate(`window.location.hash = '#/blocks'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 500));
  const blocksResult = await evaluate(`
    (() => {
      const canvas = window.app.blocksCanvas;
      const engine = window.app.blocksEngine;
      if (!canvas || !engine) return 'BLOCKS_NOT_INITIALIZED';
      return 'BLOCKS_READY';
    })()
  `);
  if (blocksResult !== 'BLOCKS_READY') bugsFound.push(`Blocks studio failed: ${blocksResult}`);
} catch (e) {
  bugsFound.push(`Blocks studio error: ${e.message}`);
}

console.log('--- TEST 8: Code Scientific IDE Execution ---');
try {
  await evaluate(`window.location.hash = '#/code'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 500));
  const codeResult = await evaluate(`
    (() => {
      const editor = window.app.codeEditor;
      if (!editor) return 'CODE_NOT_INITIALIZED';
      return 'CODE_READY';
    })()
  `);
  if (codeResult !== 'CODE_READY') bugsFound.push(`Code IDE failed: ${codeResult}`);
} catch (e) {
  bugsFound.push(`Code IDE error: ${e.message}`);
}

console.log('--- TEST 9: Admin Dashboard Tabs & Demo Mode ---');
try {
  await evaluate(`window.location.hash = '#/admin?demo=true'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 600));
  const adminTestResult = await evaluate(`
    (() => {
      const usersTab = document.getElementById('adminTabUsers');
      const circuitsTab = document.getElementById('adminTabCircuits');
      const activityTab = document.getElementById('adminTabActivity');
      
      if (!usersTab || !circuitsTab || !activityTab) return 'MISSING_TABS';
      
      // Click circuits tab
      document.querySelector('.admin-tab-btn[data-admin-tab="circuits"]')?.click();
      if (!circuitsTab.classList.contains('active') || usersTab.classList.contains('active')) {
        return 'CIRCUITS_TAB_FAIL';
      }
      
      // Click activity tab
      document.querySelector('.admin-tab-btn[data-admin-tab="activity"]')?.click();
      if (!activityTab.classList.contains('active') || circuitsTab.classList.contains('active')) {
        return 'ACTIVITY_TAB_FAIL';
      }
      
      return 'ADMIN_TABS_SUCCESS';
    })()
  `);
  if (adminTestResult !== 'ADMIN_TABS_SUCCESS') bugsFound.push(`Admin tabs interaction failed: ${adminTestResult}`);
} catch (e) {
  bugsFound.push(`Admin dashboard error: ${e.message}`);
}

console.log('--- TEST 10: Mandatory Login for Save & Open (Circuits, Blocks, Code, Import) ---');
try {
  // Test Circuit Save
  await evaluate(`window.location.hash = '#/create'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 500));
  const saveCircuitAuth = await evaluate(`
    (() => {
      document.getElementById('btnSaveMyCircuit')?.click();
      const open = document.getElementById('loginModal')?.classList.contains('active');
      document.getElementById('loginModal')?.classList.remove('active');
      return open;
    })()
  `);
  if (!saveCircuitAuth) bugsFound.push('Circuit Save did not enforce login modal');

  // Test Export Modal JSON Import
  const importModalAuth = await evaluate(`
    (() => {
      document.getElementById('btnImportJSON')?.click();
      const open = document.getElementById('loginModal')?.classList.contains('active');
      document.getElementById('loginModal')?.classList.remove('active');
      return open;
    })()
  `);
  if (!importModalAuth) bugsFound.push('Import JSON in export modal did not enforce login modal');

  // Test Blocks Save
  await evaluate(`window.location.hash = '#/blocks'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 400));
  const saveBlockAuth = await evaluate(`
    (() => {
      document.getElementById('btnSaveBlockModel')?.click();
      const open = document.getElementById('loginModal')?.classList.contains('active');
      document.getElementById('loginModal')?.classList.remove('active');
      return open;
    })()
  `);
  if (!saveBlockAuth) bugsFound.push('Blocks Model Save did not enforce login modal');

  // Test Code Save
  await evaluate(`window.location.hash = '#/code'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 400));
  const saveCodeAuth = await evaluate(`
    (() => {
      document.querySelector('#codeBtnSave')?.click();
      const open = document.getElementById('loginModal')?.classList.contains('active');
      document.getElementById('loginModal')?.classList.remove('active');
      return open;
    })()
  `);
  if (!saveCodeAuth) bugsFound.push('Code IDE Save did not enforce login modal');

} catch (e) {
  bugsFound.push(`Save auth check error: ${e.message}`);
}

console.log('--- TEST 11: Dedicated Admin Circuit Studio (#/admin/studio?demo=true) ---');
try {
  await evaluate(`window.location.hash = '#/admin/studio?demo=true'; window.dispatchEvent(new Event('hashchange'));`);
  await new Promise(r => setTimeout(r, 600));

  const adminStudioCheck = await evaluate(`
    (() => {
      const page = document.getElementById('view-admin-studio');
      if (!page || !page.classList.contains('active')) return 'PAGE_NOT_ACTIVE';
      if (!window.app.adminCanvas || !window.app.adminEngine) return 'ADMIN_ENGINE_MISSING';
      
      // Check admin simulation
      window.app.startAdminSimulation();
      const isRunning = window.app.isAdminSimRunning;
      window.app.stopAdminSimulation();
      
      // Check admin view mode switch
      window.app.setAdminViewMode('schematic');
      const isSchematic = document.getElementById('adminCanvasPanel')?.style.display === 'block';
      window.app.setAdminViewMode('split');
      
      return (isRunning && isSchematic) ? 'ADMIN_STUDIO_SUCCESS' : 'ADMIN_STUDIO_OP_FAILED';
    })()
  `);
  if (adminStudioCheck !== 'ADMIN_STUDIO_SUCCESS') {
    bugsFound.push(`Admin Circuit Studio check failed: ${adminStudioCheck}`);
  }
} catch (e) {
  bugsFound.push(`Admin Circuit Studio error: ${e.message}`);
}

console.log('\n================================================================');
console.log('DEEP BUG AUDIT REPORT');
console.log('================================================================');
console.log('Console Errors count:', consoleErrors.length);
if (consoleErrors.length > 0) console.log('Console Errors:', consoleErrors);

console.log('Unhandled Exceptions count:', unhandledExceptions.length);
if (unhandledExceptions.length > 0) console.log('Exceptions:', unhandledExceptions);

console.log('Network 4xx/5xx count:', networkFailures.length);
if (networkFailures.length > 0) console.log('Network Failures:', networkFailures);

console.log('Functional Bugs Found count:', bugsFound.length);
if (bugsFound.length > 0) console.log('Bugs Found:', bugsFound);

chromeProc.kill();
process.exit(bugsFound.length > 0 || unhandledExceptions.length > 0 || consoleErrors.length > 0 ? 1 : 0);
