import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9410;
  const tempProfile = path.join(os.tmpdir(), `chrome-diag-${Date.now()}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,900',
    'http://localhost:3000/admin.html#/admin/login'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = await res.json();
      const target = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target?.webSocketDebuggerUrl) {
        wsUrl = target.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    console.error('Failed to attach to Chrome');
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

  // Check admin.html
  const adminInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          appName: window.firebaseService?.app?.name,
          pathname: window.location.pathname,
          hash: window.location.hash,
          isAdminPortalFile: window.switchaApp?.isAdminPortalFile,
          currentUser: window.firebaseService?.currentUser?.email
        };
      })()
    `,
    returnByValue: true
  });
  console.log('admin.html state:', adminInfo.result?.value);

  // Navigate to index.html
  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  const indexInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          appName: window.firebaseService?.app?.name,
          pathname: window.location.pathname,
          hash: window.location.hash,
          isAdminPortalFile: window.switchaApp?.isAdminPortalFile,
          currentUser: window.firebaseService?.currentUser?.email,
          authGuestDisplay: document.getElementById('authGuestControls')?.style?.display,
          authUserDisplay: document.getElementById('authUserControls')?.style?.display,
          userDisplayName: document.getElementById('userDisplayName')?.textContent,
          logoutBtnText: document.getElementById('btnLogout')?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log('index.html state:', indexInfo.result?.value);

  chromeProc.kill();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
