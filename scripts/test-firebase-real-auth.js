import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9415;
  const tempProfile = path.join(os.tmpdir(), `chrome-test-tabs-${Date.now()}`);
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

  // In admin tab: test creating a user or signing in
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const auth = window.firebaseService.auth;
          const userCred = await window.firebaseService.sdk.signInAnonymously(auth);
          return { success: true, app: auth.app.name, uid: userCred.user.uid };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Admin tab sign-in result:', evalResult.result?.value);

  // Now navigate to index.html in the same browser session
  await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  const indexResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const auth = window.firebaseService?.auth;
        return {
          app: auth?.app?.name,
          currentUser: auth?.currentUser?.uid || null,
          hasAdminLogout: Array.from(document.querySelectorAll('button, a')).some(b => b.textContent.includes('Admin Logout')),
          guestVisible: document.getElementById('authGuestControls')?.style?.display
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Index page state after Admin signed in:', indexResult.result?.value);

  chromeProc.kill();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
