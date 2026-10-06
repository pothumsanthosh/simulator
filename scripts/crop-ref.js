import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: white; margin: 0; padding: 20px; font-family: sans-serif; }
    .crop-container { display: flex; gap: 20px; }
    canvas { border: 1px solid #ccc; image-rendering: pixelated; }
  </style>
</head>
<body>
  <h2>Reference Circuit Diagram Magnified</h2>
  <canvas id="c" width="800" height="600"></canvas>
  <script>
    const img = new Image();
    img.src = 'file:///C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/.user_uploaded/media_1791180907496.png';
    img.onload = () => {
      const cvs = document.getElementById('c');
      const ctx = cvs.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      // Crop circuit area: x: 10, y: 35, w: 140, h: 120 -> scale up 4x
      ctx.drawImage(img, 10, 35, 140, 120, 0, 0, 800, 600);
    };
  </script>
</body>
</html>
`;

fs.writeFileSync('inspect_ref.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.cwd(), '.chrome-crop-' + Date.now());
const proc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  '--remote-debugging-port=9231',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1000,800',
  'file:///' + path.resolve('inspect_ref.html').replace(/\\/g, '/')
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2000));
const res = await fetch('http://127.0.0.1:9231/json');
const tabs = await res.json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
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
const snap = await send('Page.captureScreenshot', { format: 'png' });
if (snap?.data) {
  fs.writeFileSync('ref_circuit_magnified.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved ref_circuit_magnified.png');
}

proc.kill();
try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
