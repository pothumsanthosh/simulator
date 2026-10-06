import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), 'chrome-snap-nav-' + Date.now());
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  '--remote-debugging-port=9225',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1366,768',
  'http://localhost:3000/#/create'
], { stdio: 'ignore' });

// Poll for CDP
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9225/json');
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

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
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

// Wait for load and preset
await new Promise(r => setTimeout(r, 2000));

// Capture top area / whole page
const snap = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('snap_navbar_fixed.png', Buffer.from(snap.data, 'base64'));
console.log('Saved snap_navbar_fixed.png');

chromeProc.kill();
process.exit(0);
