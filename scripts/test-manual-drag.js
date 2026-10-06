import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testManualDrag() {
  const userDataDir = path.join(process.cwd(), '.chrome-snap-drag-' + Date.now());
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    '--remote-debugging-port=9230',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:3000/#/create?preset=rcPhaseShiftOscillator'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9230/json');
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

  await new Promise(r => setTimeout(r, 1000));

  const moveRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.app.canvas.render();
        return "rendered";
      })()
    `,
    returnByValue: true
  });

  // Capture screenshot showing manually moved values
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  if (snap?.data) {
    fs.writeFileSync('snap_manual_values.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved snap_manual_values.png');
  }

  // Also test findLabelAt hit-testing
  const hitTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const comps = window.app.engine.circuit.components;
        const r4 = comps.find(c => c.name === 'R4');
        const effHeight = ((r4.rotation || 0) % 180 !== 0) ? (r4.width || 40) : (r4.height || 40);
        const vx = r4.x + (r4.valueOffset?.x || 0);
        const vy = r4.y + (effHeight / 2 + 14) + (r4.valueOffset?.y || 0);
        const hit = window.app.canvas.findLabelAt(vx, vy, 6);
        return {
          found: !!hit,
          target: hit?.target,
          text: hit?.text,
          compName: hit?.comp?.name
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Hit Test Result:', JSON.stringify(hitTest.result?.value));

  proc.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

testManualDrag().catch(console.error);
