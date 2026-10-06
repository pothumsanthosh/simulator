import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureCircuit() {
  const userDataDir = path.join(process.cwd(), '.chrome-snap-circuit-' + Date.now());
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    '--remote-debugging-port=9229',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'http://localhost:3000/#/create'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9229/json');
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

  await new Promise(r => setTimeout(r, 1500));

  // Load rcPhaseShiftOscillator
  await send('Runtime.evaluate', {
    expression: `
      window.app.loadCircuitPreset('rcPhaseShiftOscillator');
      window.app.setViewMode('schematic');
      setTimeout(() => {
        window.app.canvas.fitToScreen();
        window.app.canvas.render();
      }, 500);
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  if (snap?.data) {
    fs.writeFileSync('snap_circuit_rc.png', Buffer.from(snap.data, 'base64'));
    console.log('Saved screenshot to: snap_circuit_rc.png');
  }

  // Also verify canvas text drawing calls
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const comps = window.app.engine.circuit.components;
        const res = comps.filter(c => c.name.startsWith('R')).map(c => {
          return {
            name: c.name,
            rotation: c.rotation,
            params: c.params
          };
        });
        return JSON.stringify(res);
      })()
    `,
    returnByValue: true
  });
  console.log('Resistors:', evalResult.result?.value);

  proc.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

captureCircuit().catch(console.error);
