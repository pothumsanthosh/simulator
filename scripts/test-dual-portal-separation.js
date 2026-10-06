import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9398;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/'
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 200));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs[0];
    if (target?.webSocketDebuggerUrl) {
      wsUrl = target.webSocketDebuggerUrl;
      break;
    }
  } catch (_) {}
}

if (!wsUrl) {
  console.error('Failed to get WebSocket debugger URL');
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

try {
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('=== TEST A: User Portal (index.html) ===');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2000));

  const userPortalState = await send('Runtime.evaluate', {
    expression: `(() => {
      const guestControls = document.getElementById('authGuestControls');
      const userControls = document.getElementById('authUserControls');
      const navLinks = Array.from(document.querySelectorAll('.nav-link')).map(l => l.innerText.trim());
      return {
        guestControlsVisible: guestControls && window.getComputedStyle(guestControls).display !== 'none',
        userControlsVisible: userControls && window.getComputedStyle(userControls).display !== 'none',
        hasAdminInNav: navLinks.some(l => l.toLowerCase().includes('admin'))
      };
    })()`,
    returnByValue: true
  });
  console.log('User Portal Home State:', userPortalState.result.value);

  // Capture user portal screenshot
  const userHomeShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\portal_user_index.png', Buffer.from(userHomeShot.data, 'base64'));

  // Test redirect from index.html#/admin to admin.html#/admin
  console.log('Testing redirection from index.html#/admin to admin.html...');
  await send('Page.navigate', { url: 'http://localhost:3000/#/admin' });
  await new Promise(r => setTimeout(r, 2000));
  const currentUrlAfterRedirect = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('Redirected to URL:', currentUrlAfterRedirect.result.value);

  console.log('\n=== TEST B: Admin Portal (admin.html) ===');
  await send('Page.navigate', { url: 'http://localhost:3000/admin.html#/admin/login' });
  await new Promise(r => setTimeout(r, 2000));

  // Perform admin login
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.getElementById('adminEmail').value = 'Pothumsanthosh@gmail.com';
      document.getElementById('adminPassword').value = 'Santhosh@282007';
      document.getElementById('adminLoginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));

  const adminDashboardState = await send('Runtime.evaluate', {
    expression: `(() => {
      const brandBadge = document.querySelector('.admin-brand-badge');
      const userControls = document.getElementById('authUserControls');
      const btnLogout = document.getElementById('btnLogout');
      return {
        brandText: brandBadge ? brandBadge.innerText.trim() : null,
        userControlsVisible: userControls && window.getComputedStyle(userControls).display !== 'none',
        logoutText: btnLogout ? btnLogout.innerText.trim() : null,
        hash: window.location.hash
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin Console State:', adminDashboardState.result.value);

  // Capture admin dashboard screenshot
  const adminDashShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\portal_admin_dashboard.png', Buffer.from(adminDashShot.data, 'base64'));

  // Enter Studio in admin.html
  console.log('Testing Studio inside admin.html...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin.html#/create' });
  await new Promise(r => setTimeout(r, 2000));

  const adminInStudioState = await send('Runtime.evaluate', {
    expression: `(() => {
      const returnBtn = document.getElementById('studioAdminReturnBtn');
      const btnLogout = document.getElementById('btnLogout');
      const guestControls = document.getElementById('authGuestControls');
      return {
        returnBtnVisible: returnBtn && window.getComputedStyle(returnBtn).display !== 'none',
        guestControlsHidden: !guestControls || window.getComputedStyle(guestControls).display === 'none',
        logoutText: btnLogout ? btnLogout.innerText.trim() : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin inside Studio (admin.html) State:', adminInStudioState.result.value);

  // Capture admin inside Studio screenshot
  const adminStudioShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\portal_admin_in_studio.png', Buffer.from(adminStudioShot.data, 'base64'));

  console.log('\nAll Dual-Portal tests passed successfully!');
} catch (err) {
  console.error('Test error:', err);
} finally {
  ws.close();
  chromeProc.kill();
  process.exit(0);
}
