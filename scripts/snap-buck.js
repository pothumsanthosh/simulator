import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function snapBuck() {
  const userDataDir = path.join(process.cwd(), '.chrome-snap-buck-' + Date.now());
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    '--remote-debugging-port=9232',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:3000/#/create?v=' + Date.now()
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9232/json');
  const tabs = await res.json();
  const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (evt) => {
      const d = JSON.parse(evt.data);
      if (d.id === curId) { ws.removeEventListener('message', handler); resolve(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise(r => setTimeout(r, 2500));

  await send('Runtime.evaluate', {
    expression: `
      window.app.setViewMode('schematic');
      window.app.canvas.fitToScreen();
      window.app.canvas.render();
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  if (snap?.data) {
    fs.writeFileSync('snap_buck_fixed.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved snap_buck_fixed.png');
  }

  proc.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

snapBuck().catch(console.error);
