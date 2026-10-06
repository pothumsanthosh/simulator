import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9396;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'https://electrosim-4cf3f.web.app/admin.html#/admin'
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('electrosim') && t.webSocketDebuggerUrl) || tabs[0];
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
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 2000));

const check = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const logoutBtns = Array.from(document.querySelectorAll('button, a')).filter(el => el.textContent.includes('Admin Logout'));
      const duplicateCardBtn = document.getElementById('btnAdminLogout');
      const rightReturnBtns = document.querySelectorAll('#studioAdminReturnRightBtn');
      return {
        logoutBtnsCount: logoutBtns.length,
        hasDuplicateCardLogout: !!duplicateCardBtn,
        rightReturnBtnsCount: rightReturnBtns.length
      };
    })()
  `,
  returnByValue: true
});

console.log('Live Deployed Site Verification:', check.result?.value);
chromeProc.kill();
process.exit(0);
