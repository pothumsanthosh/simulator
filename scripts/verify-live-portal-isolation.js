import { spawn } from 'child_process';
import fs from 'fs';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9399;
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
  // 1. Click admin demo login
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("btnAdminLoginSubmit")?.click();'
  });
  await new Promise(r => setTimeout(r, 2500));

  const adminState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          logoutText: document.getElementById("btnLogout")?.textContent?.trim() || "",
          userBadge: document.getElementById("userDisplayName")?.textContent?.trim() || ""
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Production Admin State on admin.html:', adminState.result?.value);

  // 2. Navigate to user portal https://electrosim-4cf3f.web.app/index.html
  await send('Page.navigate', { url: 'https://electrosim-4cf3f.web.app/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const userPortalGuestState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const guestDiv = document.getElementById("guestAuthButtons");
        return {
          isGuestVisible: !guestDiv?.classList.contains("hidden"),
          hasAdminLogout: Array.from(document.querySelectorAll("button, a")).some(b => b.textContent.includes("Admin Logout"))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Production User Portal Guest State on index.html:', userPortalGuestState.result?.value);

  chromeProc.kill();
  console.log('Production verification completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
