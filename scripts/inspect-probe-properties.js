import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9396;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/#/create'
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
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 2000));

// Select the first voltage probe on canvas
const probeInfo = await send('Runtime.evaluate', {
  expression: `
    const probe = window.app.canvas.components.find(c => c.type === 'PROBE_V' || c.type === 'PROBE_I');
    if (probe) {
      window.app.canvas.selectComponent(probe);
      ({ id: probe.id, name: probe.name, params: probe.params });
    } else {
      null;
    }
  `,
  returnByValue: true
});

console.log('Selected probe:', probeInfo.result?.value);
await new Promise(r => setTimeout(r, 600));

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/probe_properties_inspector.png', Buffer.from(shot.data, 'base64'));
console.log('Saved probe_properties_inspector.png');

chromeProc.kill();
process.exit(0);
