import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(os.tmpdir(), 'chrome-snap-admin-' + Date.now());
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--disable-extensions',
  '--remote-debugging-port=9224',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1600,1050',
  'http://localhost:3000/#/admin/login'
], { stdio: 'ignore' });

// Poll for CDP
let wsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9224/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs.find(t => t.type === 'page' && !t.url?.startsWith('chrome-extension') && t.webSocketDebuggerUrl);
    if (target) {
      wsUrl = target.webSocketDebuggerUrl;
      break;
    }
  } catch (e) {}
}

if (!wsUrl) {
  console.error('Failed to connect to CDP');
  chromeProc.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  return res.result?.value;
}

// 1. Wait for page load
await new Promise(r => setTimeout(r, 1500));

// Capture Admin Login
const snapLogin = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('snap_admin_login.png', Buffer.from(snapLogin.data, 'base64'));
console.log('Saved snap_admin_login.png');

// 2. Open Admin Dashboard and populate mock data for visual inspection
await evaluate(`
  (() => {
    window.app.switchView('admin');
    
    // Populate rich sample data
    window.app.adminUsers = [
      { uid: 'usr_prof_rao', displayName: 'Prof. K. V. Rao', email: 'kvrao@iitb.ac.in', role: 'admin', lastActiveAt: Date.now() - 3600000, createdAt: Date.now() - 86400000 * 90 },
      { uid: 'usr_ta_ananya', displayName: 'Ananya Sharma (TA)', email: 'ananya.s@univ.edu', role: 'admin', lastActiveAt: Date.now() - 7200000, createdAt: Date.now() - 86400000 * 60 },
      { uid: 'usr_std_rahul', displayName: 'Rahul Verma', email: 'rahul.v@student.edu', role: 'student', lastActiveAt: Date.now() - 14400000, createdAt: Date.now() - 86400000 * 30 },
      { uid: 'usr_std_priya', displayName: 'Priya Patel', email: 'priya.p@student.edu', role: 'student', lastActiveAt: Date.now() - 86400000 * 2, createdAt: Date.now() - 86400000 * 25 },
      { uid: 'usr_std_kiran', displayName: 'Kiran Kumar', email: 'kiran.k@student.edu', role: 'student', lastActiveAt: Date.now() - 86400000 * 12, createdAt: Date.now() - 86400000 * 15 }
    ];

    window.app.adminCircuits = [
      { id: 'c_buck_01', name: 'Simple Buck Converter (DC-DC)', ownerEmail: 'kvrao@iitb.ac.in', ownerUid: 'usr_prof_rao', isPublic: true, compCount: 14, updatedAt: Date.now() - 86400000 * 2 },
      { id: 'c_rc_shift', name: 'Op-Amp RC Phase Shift Oscillator', ownerEmail: 'ananya.s@univ.edu', ownerUid: 'usr_ta_ananya', isPublic: true, compCount: 18, updatedAt: Date.now() - 86400000 * 5 },
      { id: 'c_555_astable', name: '555 Timer Astable Multivibrator', ownerEmail: 'rahul.v@student.edu', ownerUid: 'usr_std_rahul', isPublic: false, compCount: 12, updatedAt: Date.now() - 86400000 * 1 },
      { id: 'c_bjt_amp', name: 'Common Emitter BJT Voltage Amplifier', ownerEmail: 'priya.p@student.edu', ownerUid: 'usr_std_priya', isPublic: true, compCount: 11, updatedAt: Date.now() - 86400000 * 3 },
      { id: 'c_wein_bridge', name: 'Wien Bridge Low-Distortion Oscillator', ownerEmail: 'kiran.k@student.edu', ownerUid: 'usr_std_kiran', isPublic: false, compCount: 16, updatedAt: Date.now() - 86400000 * 7 }
    ];

    window.app.adminActivityLogs = [
      { eventId: 'act_091', type: 'ADMIN_LOGIN', actorEmail: 'kvrao@iitb.ac.in', actorUid: 'usr_prof_rao', targetId: 'SESSION_START', metadata: JSON.stringify({ ip: '10.20.1.45', authMethod: 'password_claim' }), timestamp: Date.now() - 1800000 },
      { eventId: 'act_090', type: 'CIRCUIT_PUBLISH', actorEmail: 'priya.p@student.edu', actorUid: 'usr_std_priya', targetId: 'c_bjt_amp', metadata: JSON.stringify({ circuitName: 'Common Emitter BJT Voltage Amplifier' }), timestamp: Date.now() - 3600000 * 4 },
      { eventId: 'act_089', type: 'CIRCUIT_SAVE', actorEmail: 'rahul.v@student.edu', actorUid: 'usr_std_rahul', targetId: 'c_555_astable', metadata: JSON.stringify({ components: 12, wires: 15 }), timestamp: Date.now() - 86400000 * 1 },
      { eventId: 'act_088', type: 'USER_REGISTER', actorEmail: 'kiran.k@student.edu', actorUid: 'usr_std_kiran', targetId: 'usr_std_kiran', metadata: JSON.stringify({ provider: 'email' }), timestamp: Date.now() - 86400000 * 15 }
    ];

    document.getElementById('statTotalUsers').textContent = '5';
    document.getElementById('statActiveUsers').textContent = '4';
    document.getElementById('statTotalCircuits').textContent = '5';
    document.getElementById('statPublicCircuits').textContent = '3';
    document.getElementById('statRecentActivity').textContent = '4';
    document.getElementById('adminCurrentEmail').textContent = 'admin@e-samastha.edu';

    window.app.renderAdminUsers(window.app.adminUsers);
    window.app.renderAdminCircuits(window.app.adminCircuits);
    window.app.renderAdminActivity(window.app.adminActivityLogs);
  })()
`);

await new Promise(r => setTimeout(r, 600));

// Capture Tab 1: Users
const snapUsers = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('snap_admin_dashboard_users.png', Buffer.from(snapUsers.data, 'base64'));
console.log('Saved snap_admin_dashboard_users.png');

// Switch to Tab 2: Circuits
await evaluate(`
  (() => {
    document.querySelector('.admin-tab-btn[data-admin-tab="circuits"]')?.click();
  })()
`);
await new Promise(r => setTimeout(r, 400));
const snapCircuits = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('snap_admin_dashboard_circuits.png', Buffer.from(snapCircuits.data, 'base64'));
console.log('Saved snap_admin_dashboard_circuits.png');

// Switch to Tab 3: Activity
await evaluate(`
  (() => {
    document.querySelector('.admin-tab-btn[data-admin-tab="activity"]')?.click();
  })()
`);
await new Promise(r => setTimeout(r, 400));
const snapActivity = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('snap_admin_dashboard_activity.png', Buffer.from(snapActivity.data, 'base64'));
console.log('Saved snap_admin_dashboard_activity.png');

chromeProc.kill();
process.exit(0);
