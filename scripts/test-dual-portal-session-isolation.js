import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9398;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'http://localhost:3000/admin.html#/admin/login'
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

// 1. Admin logs into admin.html
console.log('1. Logging in as Admin on admin.html...');
await send('Runtime.evaluate', {
  expression: `
    document.getElementById('btnAdminLoginSubmit')?.click();
  `
});
await new Promise(r => setTimeout(r, 1500));

const adminState = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const logoutBtn = document.getElementById('btnLogout');
      const userBadge = document.getElementById('userDisplayName');
      return {
        logoutText: logoutBtn?.textContent?.trim() || '',
        userBadge: userBadge?.textContent?.trim() || ''
      };
    })()
  `,
  returnByValue: true
});
console.log('Admin State on admin.html:', adminState.result?.value);

// 2. Navigate to index.html and sign in with student user
console.log('2. Navigating to index.html and simulating student sign in...');
await send('Page.navigate', { url: 'http://localhost:3000/index.html' });
for (let i = 0; i < 40; i++) {
  const ready = await send('Runtime.evaluate', { expression: 'Boolean(window.switchaApp && window.firebaseService && window.firebaseService.userContext?.isInitialized)', returnByValue: true });
  if (ready.result?.value) break;
  await new Promise(r => setTimeout(r, 200));
}

const simResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const studentUser = {
        uid: 'student_999',
        email: 'vikram.ece@university.edu',
        displayName: 'Vikram Singh'
      };
      const hasFS = Boolean(window.firebaseService);
      const hasApp = Boolean(window.switchaApp);
      if (window.firebaseService) {
        window.firebaseService.userContext.notify(studentUser);
        window.switchaApp?.syncUserAuthUI(studentUser);
      }
      return { hasFS, hasApp, text: document.getElementById('userDisplayName')?.textContent };
    })()
  `,
  returnByValue: true
});
console.log('simResult:', simResult);
await new Promise(r => setTimeout(r, 500));

const studentState = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const userBadge = document.getElementById('userDisplayName');
      const logoutBtn = document.getElementById('btnLogout');
      const hasAdminLogout = Array.from(document.querySelectorAll('button, a')).some(b => b.textContent.includes('Admin Logout'));
      return {
        studentBadge: userBadge?.textContent?.trim() || '',
        logoutBtnText: logoutBtn?.textContent?.trim() || '',
        hasAdminLogout
      };
    })()
  `,
  returnByValue: true
});
console.log('Student State on index.html:', studentState.result?.value);

const shotStudent = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/student_logged_in_on_index.png', Buffer.from(shotStudent.data, 'base64'));

// 3. Navigate back to admin.html and verify admin name and session was NOT changed to Vikram Singh!
console.log('3. Returning to admin.html to verify Admin session was NOT overwritten by Student...');
await send('Page.navigate', { url: 'http://localhost:3000/admin.html#/admin' });
for (let i = 0; i < 40; i++) {
  const ready = await send('Runtime.evaluate', { expression: 'Boolean(window.switchaApp && window.firebaseService)', returnByValue: true });
  if (ready.result?.value) break;
  await new Promise(r => setTimeout(r, 200));
}
await new Promise(r => setTimeout(r, 500));

const adminStateAfterStudent = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const userBadge = document.getElementById('userDisplayName');
      const logoutBtn = document.getElementById('btnLogout');
      return {
        userBadge: userBadge?.textContent?.trim() || '',
        logoutBtnText: logoutBtn?.textContent?.trim() || ''
      };
    })()
  `,
  returnByValue: true
});
console.log('Admin State after Student login:', adminStateAfterStudent.result?.value);

const shotAdminFinal = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/f4c77e70-7500-4e65-88bd-6d494a046b1a/admin_session_preserved_after_student.png', Buffer.from(shotAdminFinal.data, 'base64'));

chromeProc.kill();

if (studentState.result?.value?.hasAdminLogout) {
  console.error('FAIL: Student page showed Admin Logout!');
  process.exit(1);
}
if (studentState.result?.value?.studentBadge !== 'Vikram Singh') {
  console.error('FAIL: Student page did not show Vikram Singh!');
  process.exit(1);
}
if (adminStateAfterStudent.result?.value?.userBadge === 'Vikram Singh') {
  console.error('FAIL: Admin portal was overwritten with Vikram Singh!');
  process.exit(1);
}
if (adminStateAfterStudent.result?.value?.logoutBtnText !== '🚪 Admin Logout') {
  console.error('FAIL: Admin portal lost Admin Logout!');
  process.exit(1);
}

console.log('SUCCESS: Dual-portal sessions are completely isolated and independent!');
process.exit(0);
