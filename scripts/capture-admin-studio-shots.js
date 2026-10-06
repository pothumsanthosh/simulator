import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9391;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/#/admin?demo=true'
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

await send('Page.enable');
await new Promise(r => setTimeout(r, 1200));

// 1. Capture Admin Dashboard Circuits Tab
await send('Runtime.evaluate', { expression: `document.querySelector('[data-admin-tab="circuits"]')?.click();` });
await new Promise(r => setTimeout(r, 600));
const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_dashboard_with_studio_link.png', Buffer.from(shot1.data, 'base64'));

// 2. Capture Dedicated Admin Circuit Studio
await send('Runtime.evaluate', { expression: `window.location.hash = '#/admin/studio?demo=true'; window.dispatchEvent(new Event('hashchange'));` });
await new Promise(r => setTimeout(r, 1200));
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_circuit_studio_clean.png', Buffer.from(shot2.data, 'base64'));

// 3. Capture Admin Circuit Studio Inspecting a Circuit
await send('Runtime.evaluate', { expression: `window.location.hash = '#/admin/studio?demo=true&inspectUser=usr_prof_rao&inspectCircuit=circ_adm_001'; window.dispatchEvent(new Event('hashchange'));` });
await new Promise(r => setTimeout(r, 1200));
const shot3 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_circuit_studio_inspect.png', Buffer.from(shot3.data, 'base64'));

console.log('All 3 Admin Studio screenshots captured!');
chromeProc.kill();
process.exit(0);
