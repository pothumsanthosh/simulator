import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9425;
  const tempProfile = path.join(os.tmpdir(), `chrome-two-tab-${Date.now()}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-extensions',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,900',
    'http://localhost:3000/index.html'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = await res.json();
      const target = tabs.find(t => t.url?.includes('localhost:3000') && t.webSocketDebuggerUrl) || tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
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
  
  // Wait for app and firebaseService to initialize
  let ready = false;
  for (let i = 0; i < 40; i++) {
    const check = await send('Runtime.evaluate', {
      expression: 'Boolean(window.switchaApp && window.firebaseService && window.firebaseService.adminContext && window.firebaseService.userContext?.isInitialized)',
      returnByValue: true
    });
    if (check?.result?.value === true) {
      ready = true;
      break;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!ready) {
    const debugInfo = await send('Runtime.evaluate', {
      expression: '({ href: window.location.href, readyState: document.readyState, hasApp: Boolean(window.app), hasService: Boolean(window.firebaseService) })',
      returnByValue: true
    });
    console.error('App not ready in time:', debugInfo?.result?.value);
    chromeProc.kill();
    process.exit(1);
  }

  console.log('--- TEST A & B: Independent Authentication in Dual Contexts ---');
  // 1. In Tab A context: Simulate Admin Auth Context login
  const adminLoginResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const adminUser = {
          uid: 'admin_test_01',
          email: 'pothumsanthosh@gmail.com',
          displayName: 'Pothum Santhosh'
        };
        window.firebaseService.adminContext.notify(adminUser);
        window.switchaApp.syncAdminAuthUI(adminUser);
        return {
          adminUid: window.firebaseService.adminContext.currentUser?.uid,
          userUid: window.firebaseService.userContext.currentUser?.uid
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 1 (Admin Login raw):', JSON.stringify(adminLoginResult));
  console.log('Step 1 (Admin Login):', adminLoginResult?.result?.value);

  // Verification 1: Admin is logged in, User is NULL
  if (adminLoginResult.result?.value?.adminUid !== 'admin_test_01' || adminLoginResult.result?.value?.userUid !== undefined && adminLoginResult.result?.value?.userUid !== null) {
    console.error('FAIL: Admin login leaked to user context!');
    process.exit(1);
  }

  // 2. In Tab B context: User logs in with student account
  const userLoginResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const studentUser = {
          uid: 'student_test_99',
          email: 'vikram.ece@university.edu',
          displayName: 'Vikram Singh'
        };
        window.firebaseService.userContext.notify(studentUser);
        window.switchaApp.syncUserAuthUI(studentUser);
        return {
          adminUid: window.firebaseService.adminContext.currentUser?.uid,
          adminEmail: window.firebaseService.adminContext.currentUser?.email,
          userUid: window.firebaseService.userContext.currentUser?.uid,
          userDisplayName: document.getElementById('userDisplayName')?.textContent,
          logoutBtnText: document.getElementById('btnLogout')?.textContent,
          hasAdminLogoutOnUserPage: Array.from(document.querySelectorAll('#authUserControls button, #authGuestControls button')).some(b => b.textContent.includes('Admin Logout'))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 2 (User Login):', userLoginResult.result?.value);

  const s2 = userLoginResult.result?.value;
  if (s2?.adminUid !== 'admin_test_01') {
    console.error('FAIL: Student login overwrote Admin session!');
    process.exit(1);
  }
  if (s2?.userUid !== 'student_test_99') {
    console.error('FAIL: User context not logged in!');
    process.exit(1);
  }
  if (s2?.hasAdminLogoutOnUserPage) {
    console.error('FAIL: User page displayed Admin Logout button!');
    process.exit(1);
  }

  console.log('--- TEST C: Admin Logout does not affect User session ---');
  const adminLogoutResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.firebaseService.adminContext.notify(null);
        window.switchaApp.syncAdminAuthUI(null);
        return {
          adminUid: window.firebaseService.adminContext.currentUser,
          userUid: window.firebaseService.userContext.currentUser?.uid,
          userDisplayName: document.getElementById('userDisplayName')?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 3 (Admin Logout):', adminLogoutResult.result?.value);

  const s3 = adminLogoutResult.result?.value;
  if (s3?.adminUid !== null) {
    console.error('FAIL: Admin context not cleared on logout!');
    process.exit(1);
  }
  if (s3?.userUid !== 'student_test_99' || s3?.userDisplayName !== 'Vikram Singh') {
    console.error('FAIL: Admin logout terminated User session!');
    process.exit(1);
  }

  console.log('--- TEST D: User Logout does not affect Admin session ---');
  // Re-login Admin, then logout User
  const userLogoutResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.firebaseService.adminContext.notify({ uid: 'admin_test_01', email: 'pothumsanthosh@gmail.com' });
        window.firebaseService.userContext.notify(null);
        window.switchaApp.syncUserAuthUI(null);
        return {
          adminUid: window.firebaseService.adminContext.currentUser?.uid,
          userUid: window.firebaseService.userContext.currentUser,
          guestControlsVisible: !document.getElementById('authGuestControls')?.classList?.contains('hidden') && document.getElementById('authGuestControls')?.style?.display !== 'none'
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 4 (User Logout):', userLogoutResult.result?.value);

  const s4 = userLogoutResult.result?.value;
  if (s4?.adminUid !== 'admin_test_01') {
    console.error('FAIL: User logout terminated Admin session!');
    process.exit(1);
  }
  if (s4?.userUid !== null) {
    console.error('FAIL: User context not cleared on logout!');
    process.exit(1);
  }

  console.log('--- TEST E: Route Guard Prevents Unauthorized Access ---');
  const routeGuardResult = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        // Set user to regular student, admin to null
        window.firebaseService.adminContext.currentUser = null;
        window.firebaseService.userContext.currentUser = { uid: 'student_99', email: 'student@school.edu' };
        window.location.hash = '#/admin';
        await window.switchaApp.handleAdminRoute();
        return {
          hash: window.location.hash,
          view: window.switchaApp.currentView
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Step 5 (Route Guard):', routeGuardResult.result?.value);

  const s5 = routeGuardResult.result?.value;
  if (s5?.hash === '#/admin' || s5?.view === 'admin') {
    console.error('FAIL: Regular student was allowed into #/admin!');
    process.exit(1);
  }

  chromeProc.kill();
  console.log('ALL DUAL-PORTAL BROWSER INTEGRATION SCENARIOS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
