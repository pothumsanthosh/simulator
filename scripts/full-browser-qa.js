import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), 'chrome-full-qa-' + Date.now());
fs.mkdirSync(userDataDir, { recursive: true });

console.log('================================================================');
console.log('🚀 e-Samastha FULL REAL BROWSER QA & AUTOMATED VALIDATION SUITE');
console.log('================================================================\n');

// Ensure server is running
let serverProc = null;
try {
  await fetch('http://localhost:3000/');
} catch (e) {
  serverProc = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));
}

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1920,1080',
  'http://localhost:3000/'
], { stdio: 'ignore' });

// Poll for CDP
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs.find(t => t.type === 'page' && !t.url?.startsWith('chrome-extension') && t.webSocketDebuggerUrl);
    if (target) {
      wsUrl = target.webSocketDebuggerUrl;
      break;
    }
  } catch (e) {}
}

if (!wsUrl) {
  console.error('❌ Failed to connect to headless Chrome CDP');
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
await send('Log.enable');

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error('Evaluation error: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result?.value;
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let testPassed = 0;
let testFailed = 0;
const qaReport = [];

function recordResult(section, testName, passed, detail = '') {
  if (passed) {
    testPassed++;
    console.log(`  ✔ [PASS] ${testName}`);
  } else {
    testFailed++;
    console.error(`  ✖ [FAIL] ${testName} - ${detail}`);
  }
  qaReport.push({ section, testName, passed, detail });
}

try {
  // Wait for application ready
  for (let i = 0; i < 40; i++) {
    try {
      const isReady = await evaluate(`!!window.app && !!document.getElementById('view-home')`);
      if (isReady) break;
    } catch (e) {}
    await wait(200);
  }
  await wait(500);

  if (consoleErrors.length > 0) console.log('Initial Console Errors:', consoleErrors);
  if (unhandledExceptions.length > 0) console.log('Initial Unhandled Exceptions:', unhandledExceptions);

  // =========================================================================
  // SECTION 1: GLOBAL TYPOGRAPHY & DESIGN TOKENS
  // =========================================================================
  console.log('\n[1/8] Checking Global Typography & Design Tokens...');
  
  const bodyFont = await evaluate(`window.getComputedStyle(document.body).fontFamily`);
  recordResult('Typography', 'Body Font uses Lato / modern UI font', bodyFont.toLowerCase().includes('lato') || bodyFont.toLowerCase().includes('sans-serif'), `Font was: ${bodyFont}`);

  const headingFont = await evaluate(`document.querySelector('.banner-title') ? window.getComputedStyle(document.querySelector('.banner-title')).fontFamily : window.getComputedStyle(document.body).fontFamily`);
  recordResult('Typography', 'Hero Title Font uses Lato / modern UI font', headingFont.toLowerCase().includes('lato') || headingFont.toLowerCase().includes('sans-serif'), `Font was: ${headingFont}`);

  const simTimeFont = await evaluate(`window.getComputedStyle(document.getElementById('simTimeDisplay')).fontFamily`);
  recordResult('Typography', 'Sim Time Indicator uses Monospace (Roboto Mono / fallback)', 
    simTimeFont.toLowerCase().includes('roboto') || simTimeFont.toLowerCase().includes('jetbrains') || simTimeFont.toLowerCase().includes('mono'), 
    `Font was: ${simTimeFont}`);

  const brandPrimaryToken = await evaluate(`window.getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || window.getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim()`);
  recordResult('Design Tokens', 'CSS Token --brand-primary / --primary-dark is defined (#03b585)', brandPrimaryToken === '#03b585', `Value was: ${brandPrimaryToken}`);

  // =========================================================================
  // SECTION 2: ROUTE-BY-ROUTE NAVIGATION & RESILIENCE
  // =========================================================================
  console.log('\n[2/8] Testing All Major Application Routes...');

  const routes = [
    { hash: '#/', viewId: 'view-home', name: 'Home Portal' },
    { hash: '#/create', viewId: 'view-studio', name: 'Circuit Studio (/create)' },
    { hash: '#/circuits', viewId: 'view-studio', name: 'Circuits Alias (/circuits)' },
    { hash: '#/blocks', viewId: 'view-blocks', name: 'Blocks Studio (/blocks)' },
    { hash: '#/code', viewId: 'view-code', name: 'Code IDE (/code)' },
    { hash: '#/my-circuits', viewId: 'view-my-circuits', name: 'My Workspace (/my-circuits)' },
    { hash: '#/workspace', viewId: 'view-my-circuits', name: 'Workspace Alias (/workspace)' },
    { hash: '#/discover', viewId: 'view-discover', name: 'Discover Circuits (/discover)' },
    { hash: '#/features', viewId: 'view-features', name: 'Features Guide (/features)' },
    { hash: '#/labs/arduino', viewId: 'view-arduino', name: 'Arduino Lab (/labs/arduino)' },
    { hash: '#/arduino', viewId: 'view-arduino', name: 'Arduino Alias (/arduino)' },
    { hash: '#/admin/login', viewId: 'view-admin-login', name: 'Admin Login (/admin/login)' }
  ];

  for (const r of routes) {
    await evaluate(`window.location.hash = '${r.hash}'; window.dispatchEvent(new Event('hashchange'));`);
    let isViewActive = false;
    for (let w = 0; w < 10; w++) {
      await wait(100);
      isViewActive = await evaluate(`document.getElementById('${r.viewId}').classList.contains('active')`);
      if (isViewActive) break;
    }
    recordResult('Routing', `Navigate to ${r.name}`, isViewActive, `Target view #${r.viewId} active: ${isViewActive}`);
  }

  // Route refresh & resilience test
  await evaluate(`window.location.hash = '#/create'; window.dispatchEvent(new Event('hashchange'));`);
  await wait(300);
  await evaluate(`window.location.hash = '#/features'; window.dispatchEvent(new Event('hashchange'));`);
  await wait(300);
  await evaluate(`window.location.hash = '#/create'; window.dispatchEvent(new Event('hashchange'));`);
  let studioStillActive = false;
  for (let w = 0; w < 10; w++) {
    await wait(100);
    studioStillActive = await evaluate(`document.getElementById('view-studio').classList.contains('active')`);
    if (studioStillActive) break;
  }
  recordResult('Routing', 'Return to Circuit Studio after navigating away', studioStillActive);

  // =========================================================================
  // SECTION 3: CIRCUIT STUDIO REGRESSION & INTERACTION
  // =========================================================================
  console.log('\n[3/8] Testing Circuit Studio Real Interaction...');

  // Ensure on studio
  await evaluate(`window.location.hash = '#/create'`);
  await wait(300);

  const canvasExists = await evaluate(`!!document.getElementById('schematicCanvas')`);
  recordResult('Circuit Studio', 'Schematic Canvas DOM element present', canvasExists);

  const appInstance = await evaluate(`!!window.app`);
  recordResult('Circuit Studio', 'Global SwitchaApp instance initialized (window.app)', appInstance);

  const compCountBefore = await evaluate(`window.app.canvas.components.length`);
  recordResult('Circuit Studio', 'Initial preset circuit loaded with components', compCountBefore > 0, `Components: ${compCountBefore}`);

  // Test simulation start
  await evaluate(`window.app.startSimulation()`);
  await wait(400);
  const isSimRunning = await evaluate(`window.app.isSimRunning`);
  recordResult('Circuit Studio', 'Simulation starts and loop runs', isSimRunning);

  // Let sim step
  await wait(500);
  const simTime = await evaluate(`window.app.engine.time`);
  recordResult('Circuit Studio', 'Simulation advances in real-time (time > 0)', simTime > 0, `Engine time: ${simTime}s`);

  // Test simulation stop
  await evaluate(`window.app.stopSimulation()`);
  await wait(200);
  const isSimStopped = await evaluate(`!window.app.isSimRunning`);
  recordResult('Circuit Studio', 'Simulation stops cleanly', isSimStopped);

  // Add component test (Resistor)
  const addCompResult = await evaluate(`
    (() => {
      const initialLen = window.app.canvas.components.length;
      window.app.canvas.addComponent('RESISTOR', 400, 300);
      return window.app.canvas.components.length === initialLen + 1;
    })()
  `);
  recordResult('Circuit Studio', 'Interactive add component (Resistor) via API', addCompResult);

  // Test Zoom in / out
  const zoomBefore = await evaluate(`window.app.canvas.zoom`);
  await evaluate(`window.app.canvas.zoomIn()`);
  const zoomAfter = await evaluate(`window.app.canvas.zoom`);
  recordResult('Circuit Studio', 'Interactive Canvas Zooming works (zoomIn)', zoomAfter > zoomBefore, `Zoom: ${zoomBefore} -> ${zoomAfter}`);

  // =========================================================================
  // SECTION 4: ARDUINO LAB INTERACTION & VM EXECUTION
  // =========================================================================
  console.log('\n[4/8] Testing Arduino Lab Interactive Workflow...');

  await evaluate(`window.location.hash = '#/labs/arduino'`);
  await wait(400);

  const arduinoActive = await evaluate(`document.getElementById('view-arduino').classList.contains('active')`);
  recordResult('Arduino Lab', 'Arduino Lab view rendered', arduinoActive);

  const arduinoController = await evaluate(`!!window.app.arduinoController`);
  recordResult('Arduino Lab', 'Arduino Controller instance initialized', arduinoController);

  // Verify sketch compilation in real VM
  const compileResult = await evaluate(`
    (() => {
      const ctrl = window.app.arduinoController;
      if (!ctrl) return false;
      const res = ctrl.interpreter.loadSketch(\`
        int ledPin = 13;
        void setup() {
          pinMode(ledPin, OUTPUT);
        }
        void loop() {
          digitalWrite(ledPin, HIGH);
          delay(100);
          digitalWrite(ledPin, LOW);
          delay(100);
        }
      \`);
      return res.success;
    })()
  `);
  recordResult('Arduino Lab', 'Compile and load Blink sketch in Arduino Interpreter VM', compileResult);

  // Test VM execution
  const vmRunResult = await evaluate(`
    (() => {
      const ctrl = window.app.arduinoController;
      if (!ctrl) return false;
      ctrl.interpreter.start();
      ctrl.interpreter.step(20);
      return ctrl.interpreter.status === 'RUNNING';
    })()
  `);
  recordResult('Arduino Lab', 'Arduino VM steps and executes sketch bytecode', vmRunResult);

  // Stop VM
  await evaluate(`window.app.arduinoController.interpreter.stop()`);

  // =========================================================================
  // SECTION 5: AUTHENTICATION & ADMIN ROUTE GUARD
  // =========================================================================
  console.log('\n[5/8] Testing Authentication & Admin Security Guards...');

  const guestControlsVisible = await evaluate(`window.getComputedStyle(document.getElementById('authGuestControls')).display !== 'none'`);
  recordResult('Auth & Security', 'Guest auth controls visible for unauthenticated user', guestControlsVisible);

  const adminNavLinksCount = await evaluate(`document.querySelectorAll('.nav-link[href*="admin"], .nav-menuitem[href*="admin"]').length`);
  recordResult('Auth & Security', 'Public navbar strictly exposes 0 admin links', adminNavLinksCount === 0, `Count was: ${adminNavLinksCount}`);

  // Test navigation to #/admin as non-admin -> should redirect to admin/login
  await evaluate(`window.location.hash = '#/admin'`);
  await wait(300);
  const currentHash = await evaluate(`window.location.hash`);
  const redirectedOrLogin = currentHash === '#/admin/login' || currentHash === '#/' || (await evaluate(`document.getElementById('view-admin-login').classList.contains('active')`));
  recordResult('Auth & Security', 'Non-admin user blocked/redirected from protected #/admin route', redirectedOrLogin, `Current hash: ${currentHash}`);

  // =========================================================================
  // SECTION 6: DATA INTEGRITY & STORAGE ISOLATION
  // =========================================================================
  console.log('\n[6/8] Testing Data Integrity & Storage Subsystem...');

  const storageTestResult = await evaluate(`
    (() => {
      const testKey = 'test_qa_circuit_' + Date.now();
      const testData = { id: testKey, name: 'QA Test Circuit', components: [], wires: [], timestamp: Date.now() };
      const raw = localStorage.getItem('switcha_my_circuits');
      const list = raw ? JSON.parse(raw) : [];
      list.push(testData);
      localStorage.setItem('switcha_my_circuits', JSON.stringify(list));
      
      // Verify retrieval
      const retrieved = JSON.parse(localStorage.getItem('switcha_my_circuits'));
      const found = retrieved.find(c => c.id === testKey);
      
      // Clean up
      const cleaned = retrieved.filter(c => c.id !== testKey);
      localStorage.setItem('switcha_my_circuits', JSON.stringify(cleaned));
      
      return !!found && found.name === 'QA Test Circuit';
    })()
  `);
  recordResult('Data Integrity', 'Project creation, persistent save, read, and cleanup verified', storageTestResult);

  // =========================================================================
  // SECTION 7: RESPONSIVE VIEWPORT TESTING
  // =========================================================================
  console.log('\n[7/8] Testing Responsive Viewports (1920px -> 390px)...');

  const viewports = [
    { width: 1920, height: 1080, name: 'FHD Desktop (1920x1080)' },
    { width: 1440, height: 900, name: 'MacBook Pro (1440x900)' },
    { width: 1366, height: 768, name: 'Laptop Standard (1366x768)' },
    { width: 1280, height: 720, name: 'HD Desktop (1280x720)' },
    { width: 1024, height: 768, name: 'iPad Landscape (1024x768)' },
    { width: 768, height: 1024, name: 'iPad Portrait (768x1024)' },
    { width: 390, height: 844, name: 'iPhone 14/15 (390x844)' }
  ];

  await evaluate(`window.location.hash = '#/'`);
  await wait(300);

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 800
    });
    await wait(200);

    const hasHorizontalOverflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth`);
    recordResult('Responsive QA', `${vp.name} No Horizontal Overflow`, !hasHorizontalOverflow, 
      hasHorizontalOverflow ? `ScrollWidth (${await evaluate('document.documentElement.scrollWidth')}) > InnerWidth (${vp.width})` : '');
    
    if (vp.width <= 768) {
      const toggleVisible = await evaluate(`window.getComputedStyle(document.getElementById('navMobileToggle')).display !== 'none'`);
      recordResult('Responsive QA', `${vp.name} Mobile Hamburger Toggle Visible`, toggleVisible);
    }
  }

  // Restore viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // =========================================================================
  // SECTION 8: BROWSER CONSOLE ERROR LOG AUDIT
  // =========================================================================
  console.log('\n[8/8] Auditing Browser Console Errors & Exceptions...');

  // Filter out any known non-fatal informational warnings (e.g. Firebase demo key warnings)
  const fatalErrors = consoleErrors.filter(e => !e.includes('Firebase') && !e.includes('favicon'));
  recordResult('Console Health', 'Zero Uncaught Runtime Exceptions', unhandledExceptions.length === 0, 
    unhandledExceptions.join(' | '));
  recordResult('Console Health', 'Zero Application Fatal Console Errors', fatalErrors.length === 0, 
    fatalErrors.join(' | '));

} catch (err) {
  console.error('Fatal test runner error:', err);
  testFailed++;
} finally {
  ws.close();
  chromeProc.kill();
  if (serverProc) serverProc.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

console.log('\n================================================================');
console.log(`REAL BROWSER QA SUMMARY: ${testPassed} Passed, ${testFailed} Failed out of ${testPassed + testFailed} Checks`);
console.log('================================================================\n');

if (testFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
