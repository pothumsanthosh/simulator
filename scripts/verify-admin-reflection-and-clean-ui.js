import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9395;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/admin.html#/admin'
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs[0];
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

// 1. Simulate two registered users in localStorage before loading
await send('Runtime.evaluate', {
  expression: `
    const users = [
      { uid: 'student_101', email: 'rahul.ece@institution.edu', displayName: 'Rahul Sharma', role: 'user', status: 'active', createdAt: Date.now() - 86400000, lastActiveAt: Date.now() - 3600000 },
      { uid: 'student_102', email: 'priya.vlsi@institution.edu', displayName: 'Priya Patel', role: 'user', status: 'active', createdAt: Date.now() - 172800000, lastActiveAt: Date.now() - 7200000 }
    ];
    localStorage.setItem('esamastha_known_users', JSON.stringify(users));
    sessionStorage.setItem('esamastha_authenticated_admin_uid', 'admin_santhosh');
    window.location.reload();
  `
});

await new Promise(r => setTimeout(r, 1200));

// 2. Check counts and table on Admin Dashboard
const checkDashboard = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const totalUsers = document.getElementById('statTotalUsers')?.textContent;
      const rows = document.querySelectorAll('#adminUsersTableBody tr');
      const logoutButtons = Array.from(document.querySelectorAll('button, a')).filter(el => el.textContent.includes('Admin Logout'));
      const adminConsoleButtons = Array.from(document.querySelectorAll('button, a')).filter(el => el.textContent.includes('Admin Console'));
      const hasDuplicateLogout = !!document.getElementById('btnAdminLogout');
      
      return {
        totalUsers,
        rowCount: rows.length,
        logoutButtonsCount: logoutButtons.length,
        adminConsoleButtonsCount: adminConsoleButtons.length,
        hasDuplicateLogout
      };
    })()
  `,
  returnByValue: true
});

console.log('Admin Dashboard Verification:', checkDashboard.result?.value);

const shotDashboard = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_dashboard_users_reflected.png', Buffer.from(shotDashboard.data, 'base64'));

// 3. Navigate to Circuit Studio (admin.html#/create)
await send('Runtime.evaluate', {
  expression: `window.location.hash = '#/create';`
});
await new Promise(r => setTimeout(r, 600));

const checkStudio = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const returnBtns = Array.from(document.querySelectorAll('.admin-only-return-btn')).filter(b => b.offsetParent !== null);
      const rightReturnBtn = document.getElementById('studioAdminReturnRightBtn');
      const logoutBtns = Array.from(document.querySelectorAll('button, a')).filter(el => el.textContent.includes('Admin Logout'));
      return {
        returnBtnsCount: returnBtns.length,
        hasRightReturnBtn: !!rightReturnBtn,
        logoutBtnsCount: logoutBtns.length
      };
    })()
  `,
  returnByValue: true
});

console.log('Circuit Studio Verification:', checkStudio.result?.value);

const shotStudio = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_studio_clean_single_buttons.png', Buffer.from(shotStudio.data, 'base64'));

chromeProc.kill();
console.log('Verification completed successfully!');
process.exit(0);
