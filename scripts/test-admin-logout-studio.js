import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9396;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/#/create'
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

  console.log('--- TEST 1: Check Guest / Normal User View on Studio ---');
  await send('Page.navigate', { url: 'http://localhost:3000/#/create' });
  await new Promise(r => setTimeout(r, 2000));

  const guestUIState = await send('Runtime.evaluate', {
    expression: `(() => {
      const guestControls = document.getElementById('authGuestControls');
      const userControls = document.getElementById('authUserControls');
      const returnBtns = Array.from(document.querySelectorAll('.admin-only-return-btn')).map(b => ({
        visible: b.offsetParent !== null && window.getComputedStyle(b).display !== 'none'
      }));
      return {
        guestControlsVisible: guestControls && window.getComputedStyle(guestControls).display !== 'none',
        userControlsVisible: userControls && window.getComputedStyle(userControls).display !== 'none',
        adminReturnBtnsVisible: returnBtns.some(b => b.visible)
      };
    })()`,
    returnByValue: true
  });
  console.log('Guest Studio UI State:', guestUIState.result.value);

  // Save Guest Studio screenshot
  const guestShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\studio_guest_normal.png', Buffer.from(guestShot.data, 'base64'));

  console.log('\n--- TEST 2: Admin Login and Navigate to Studio ---');
  await send('Page.navigate', { url: 'http://localhost:3000/#/admin/login' });
  await new Promise(r => setTimeout(r, 1500));

  await send('Runtime.evaluate', {
    expression: `(() => {
      document.getElementById('adminEmail').value = 'Pothumsanthosh@gmail.com';
      document.getElementById('adminPassword').value = 'Santhosh@282007';
      document.getElementById('adminLoginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));

  // Now click/navigate to Studio
  await send('Page.navigate', { url: 'http://localhost:3000/#/create' });
  await new Promise(r => setTimeout(r, 2000));

  const adminInStudioState = await send('Runtime.evaluate', {
    expression: `(() => {
      const guestControls = document.getElementById('authGuestControls');
      const userControls = document.getElementById('authUserControls');
      const btnLogout = document.getElementById('btnLogout');
      const returnBtns = Array.from(document.querySelectorAll('.admin-only-return-btn')).map(b => ({
        text: b.innerText.trim(),
        visible: b.offsetParent !== null && window.getComputedStyle(b).display !== 'none'
      }));
      return {
        guestControlsVisible: guestControls && window.getComputedStyle(guestControls).display !== 'none',
        userControlsVisible: userControls && window.getComputedStyle(userControls).display !== 'none',
        logoutButtonText: btnLogout ? btnLogout.innerText.trim() : null,
        logoutButtonClass: btnLogout ? btnLogout.className : null,
        adminReturnBtns: returnBtns
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin in Studio UI State:', adminInStudioState.result.value);

  // Save Admin in Studio screenshot
  const adminShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\studio_admin_authenticated.png', Buffer.from(adminShot.data, 'base64'));

  console.log('\n--- TEST 3: Click Admin Logout from Studio ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) btnLogout.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  const afterLogoutState = await send('Runtime.evaluate', {
    expression: `(() => {
      const guestControls = document.getElementById('authGuestControls');
      const userControls = document.getElementById('authUserControls');
      const returnBtns = Array.from(document.querySelectorAll('.admin-only-return-btn')).map(b => ({
        visible: b.offsetParent !== null && window.getComputedStyle(b).display !== 'none'
      }));
      return {
        guestControlsVisible: guestControls && window.getComputedStyle(guestControls).display !== 'none',
        userControlsVisible: userControls && window.getComputedStyle(userControls).display !== 'none',
        adminReturnBtnsVisible: returnBtns.some(b => b.visible)
      };
    })()`,
    returnByValue: true
  });
  console.log('After Admin Logout Studio UI State:', afterLogoutState.result.value);

  // Save screenshot after logout
  const postLogoutShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\f4c77e70-7500-4e65-88bd-6d494a046b1a\\studio_post_logout.png', Buffer.from(postLogoutShot.data, 'base64'));

  console.log('\nAll 3 tests completed successfully!');
} catch (err) {
  console.error('Test error:', err);
} finally {
  ws.close();
  chromeProc.kill();
  process.exit(0);
}
