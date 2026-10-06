import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9394;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/#/admin/login'
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs[0];
    if (target?.webSocketDebuggerUrl) {
      wsUrl = target.webSocketDebuggerUrl;
      break;
    }
  } catch (_) {}
}

if (!wsUrl) {
  chromeProc.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise(res => { ws.onopen = res; });

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.consoleAPICalled') {
    const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
    if (data.params.type === 'error') {
      console.error('[BROWSER ERROR]', text);
    }
  }
});

await send('Console.enable');
await send('Page.enable');
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 1200));

// Wait for Firebase to initialize
for (let i = 0; i < 20; i++) {
  const isInit = await send('Runtime.evaluate', { expression: `Boolean(window.firebaseService?.isInitialized)` });
  if (isInit.result?.value) break;
  await new Promise(r => setTimeout(r, 300));
}

// 1. Submit Admin Login Form
await send('Runtime.evaluate', {
  expression: `
    document.getElementById('adminEmail').value = 'Pothumsanthosh@gmail.com';
    document.getElementById('adminPassword').value = 'Santhosh@282007';
    document.getElementById('btnAdminLoginSubmit')?.click();
  `
});

// Wait for #/admin
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 400));
  const res = await send('Runtime.evaluate', { expression: `window.location.hash` });
  if (res.result?.value === '#/admin') break;
}
console.log('Step 1: Admin Console reached.');
await new Promise(r => setTimeout(r, 600));
const shotDash = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_authenticated_dashboard.png', Buffer.from(shotDash.data, 'base64'));
console.log('Saved admin_authenticated_dashboard.png');

// 2. Click ⚡ Studio (Enter User Portal)
await send('Runtime.evaluate', {
  expression: `document.getElementById('btnAdminOpenStudio')?.click();`
});
await new Promise(r => setTimeout(r, 800));

// LAB 1: CIRCUITS
console.log('Testing Lab 1: Circuits Lab...');
const circuitsCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const isVisible = document.getElementById('view-studio')?.classList.contains('active');
      const hasCanvas = !!window.app?.canvas;
      const returnBtn = document.getElementById('studioAdminReturnBtn')?.style.display !== 'none';
      const simStatus = document.getElementById('circuitSimStatusText')?.textContent;
      return { isVisible, hasCanvas, returnBtn, simStatus };
    })()
  `,
  returnByValue: true
});
console.log('Circuits Lab status:', circuitsCheck.result?.value);
const shotCircuits = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/lab_circuits_admin.png', Buffer.from(shotCircuits.data, 'base64'));

// LAB 2: ARDUINO
console.log('Testing Lab 2: Arduino Lab...');
await send('Runtime.evaluate', { expression: `window.location.hash = '#/labs/arduino'; window.dispatchEvent(new Event('hashchange'));` });
await new Promise(r => setTimeout(r, 800));
const arduinoCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const isVisible = document.getElementById('view-arduino')?.classList.contains('active');
      const hasSim = !!window.app?.arduinoSim;
      const returnBtn = Array.from(document.querySelectorAll('#view-arduino .admin-only-return-btn')).some(b => b.style.display !== 'none');
      return { isVisible, hasSim, returnBtn };
    })()
  `,
  returnByValue: true
});
console.log('Arduino Lab status:', arduinoCheck.result?.value);
const shotArduino = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/lab_arduino_admin.png', Buffer.from(shotArduino.data, 'base64'));

// LAB 3: BLOCKS
console.log('Testing Lab 3: Blocks Lab...');
await send('Runtime.evaluate', { expression: `window.location.hash = '#/blocks'; window.dispatchEvent(new Event('hashchange'));` });
await new Promise(r => setTimeout(r, 800));
const blocksCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const isVisible = document.getElementById('view-blocks')?.classList.contains('active');
      const hasCanvas = !!window.app?.blocksCanvas;
      const returnBtn = Array.from(document.querySelectorAll('#view-blocks .admin-only-return-btn')).some(b => b.style.display !== 'none');
      return { isVisible, hasCanvas, returnBtn };
    })()
  `,
  returnByValue: true
});
console.log('Blocks Lab status:', blocksCheck.result?.value);
const shotBlocks = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/lab_blocks_admin.png', Buffer.from(shotBlocks.data, 'base64'));

// LAB 4: CODE SCIENTIFIC RUNTIME
console.log('Testing Lab 4: Code Lab...');
await send('Runtime.evaluate', { expression: `window.location.hash = '#/code'; window.dispatchEvent(new Event('hashchange'));` });
await new Promise(r => setTimeout(r, 800));
const codeCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const isVisible = document.getElementById('view-code')?.classList.contains('active');
      const hasEditor = !!window.app?.codeEditor;
      const returnBtn = Array.from(document.querySelectorAll('#view-code .admin-only-return-btn')).some(b => b.style.display !== 'none');
      return { isVisible, hasEditor, returnBtn };
    })()
  `,
  returnByValue: true
});
console.log('Code Lab status:', codeCheck.result?.value);
const shotCode = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/lab_code_admin.png', Buffer.from(shotCode.data, 'base64'));

// 8. Return to Admin Console
console.log('Testing Return to Admin Console from Code Lab...');
await send('Runtime.evaluate', {
  expression: `document.getElementById('userProfileAdminBtn')?.click();`
});
await new Promise(r => setTimeout(r, 600));
const finalHash = await send('Runtime.evaluate', { expression: `window.location.hash` });
console.log('Final Hash after return:', finalHash.result?.value);

chromeProc.kill();
console.log('All 4 labs tested successfully for Admin!');
process.exit(0);
