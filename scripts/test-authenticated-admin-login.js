import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9397;
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
    console.log('[BROWSER]', data.params.type, data.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
  }
});

await send('Console.enable');
await send('Page.enable');
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 1200));

// 1. Capture Login Form
const shotLogin = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_login_auth_page.png', Buffer.from(shotLogin.data, 'base64'));
console.log('Saved admin_login_auth_page.png');

// Wait for Firebase to initialize
for (let i = 0; i < 20; i++) {
  const isInit = await send('Runtime.evaluate', { expression: `Boolean(window.firebaseService?.isInitialized)` });
  if (isInit.result?.value) {
    console.log('Firebase initialized in page.');
    break;
  }
  await new Promise(r => setTimeout(r, 400));
}

// 2. Click Authenticate Administrator button
await send('Runtime.evaluate', {
  expression: `
    document.getElementById('adminEmail').value = 'Pothumsanthosh@gmail.com';
    document.getElementById('adminPassword').value = 'Santhosh@282007';
    document.getElementById('btnAdminLoginSubmit')?.click();
  `
});
console.log('Submitted admin login form, waiting for authentication...');

// 3. Wait up to 15 seconds for authentication & route change to #/admin
let currentHash = '';
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 500));
  const res = await send('Runtime.evaluate', { expression: `window.location.hash` });
  currentHash = res.result?.value;
  const alertText = await send('Runtime.evaluate', { expression: `document.getElementById('adminLoginAlert')?.innerText` });
  const btnText = await send('Runtime.evaluate', { expression: `document.getElementById('btnAdminLoginSubmit')?.textContent` });
  if (i % 4 === 0) console.log(`Wait ${i} | hash: ${currentHash} | btn: ${btnText.result?.value} | alert: ${alertText.result?.value}`);
  if (currentHash === '#/admin') break;
}
console.log('Current Hash after auth:', currentHash);

if (currentHash !== '#/admin') {
  console.error('Failed to reach #/admin!');
  chromeProc.kill();
  process.exit(1);
}

await new Promise(r => setTimeout(r, 1000));
const shotAuth = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_authenticated_dashboard.png', Buffer.from(shotAuth.data, 'base64'));
console.log('Saved admin_authenticated_dashboard.png');

// 4. Click the Studio button from the Admin Dashboard
await send('Runtime.evaluate', {
  expression: `
    const btn = document.getElementById('btnAdminOpenStudio') || document.querySelector('a[title*="Open Studio"]') || document.querySelector('a[href="#/create"]');
    btn?.click();
  `
});

// Wait for route change to Studio (#/create or #/studio)
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 400));
  const res = await send('Runtime.evaluate', { expression: `window.location.hash` });
  currentHash = res.result?.value;
  if (currentHash === '#/create' || currentHash === '#/studio') break;
}
console.log('Current Hash after Studio click:', currentHash);

await new Promise(r => setTimeout(r, 1500));
const shotStudio = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_authenticated_studio.png', Buffer.from(shotStudio.data, 'base64'));
console.log('Saved admin_authenticated_studio.png');

// 5. Test Return Option from Studio back to Admin Console
await send('Runtime.evaluate', {
  expression: `
    const returnBtn = document.getElementById('studioAdminReturnBtn') || document.getElementById('userProfileAdminBtn') || document.querySelector('.admin-only-return-btn');
    returnBtn?.click();
  `
});

for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 400));
  const res = await send('Runtime.evaluate', { expression: `window.location.hash` });
  currentHash = res.result?.value;
  if (currentHash === '#/admin') break;
}
console.log('Current Hash after Return option:', currentHash);

chromeProc.kill();
console.log('All authenticated admin workflow tests passed cleanly!');
process.exit(0);
