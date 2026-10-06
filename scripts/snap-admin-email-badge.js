import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9481;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    'https://electrosim-4cf3f.web.app/admin.html#/admin/login'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = await res.json();
      const target = tabs.find(t => t.url?.includes('electrosim-4cf3f.web.app') && t.webSocketDebuggerUrl) || tabs[0];
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
  // Submit Admin Login
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("btnAdminLoginSubmit")?.click();'
  });
  
  // Wait for admin dashboard view to become active
  for (let i = 0; i < 30; i++) {
    const isViewAdmin = await send('Runtime.evaluate', {
      expression: 'document.getElementById("view-admin")?.classList?.contains("active")',
      returnByValue: true
    });
    if (isViewAdmin?.result?.value) break;
    await new Promise(r => setTimeout(r, 300));
  }
  await new Promise(r => setTimeout(r, 1000));

  // Check badges
  const state = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          adminCurrentEmail: document.getElementById("adminCurrentEmail")?.textContent?.trim(),
          userDisplayName: document.getElementById("userDisplayName")?.textContent?.trim(),
          logoutBtn: document.getElementById("btnLogout")?.textContent?.trim()
        };
      })()
    `,
    returnByValue: true
  });
  console.log('LIVE ADMIN CONSOLE STATE:', state.result?.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_console_fixed_badge.png', Buffer.from(shot.data, 'base64'));

  chromeProc.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
