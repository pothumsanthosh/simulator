import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9488;
  const tempProfile = path.join(os.tmpdir(), `chrome-inspect-test-${Date.now()}`);
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
  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER LOG:', data.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' '));
      }
    } catch (_) {}
  });
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

  // Wait for app ready
  for (let i = 0; i < 40; i++) {
    const check = await send('Runtime.evaluate', {
      expression: 'Boolean(window.switchaApp && window.firebaseService && window.firebaseService.adminContext)',
      returnByValue: true
    });
    if (check?.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('1. Authenticating as Admin...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const adminUser = {
          uid: 'admin_test_01',
          email: 'pothumsanthosh@gmail.com',
          displayName: 'Pothum Santhosh'
        };
        window.firebaseService.adminContext.notify(adminUser);
        window.switchaApp.syncAdminAuthUI(adminUser);
      })()
    `
  });

  console.log('2. Creating sample user circuit in database/cache...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const testCircuit = {
          id: 'custom_rc_filter_99',
          name: 'Active Bandpass RC Filter',
          author: 'Vikram Student',
          ownerUid: 'usr_vikram_88',
          ownerEmail: 'vikram@university.edu',
          components: [
            { id: 'c1', type: 'resistor', x: 200, y: 150, params: { r: 1000 } },
            { id: 'c2', type: 'capacitor', x: 300, y: 150, params: { c: 0.000001 } },
            { id: 'c3', type: 'ground', x: 300, y: 250, params: {} }
          ],
          wires: [
            { from: 'c1', fromTerm: 1, to: 'c2', toTerm: 0 },
            { from: 'c2', fromTerm: 1, to: 'c3', toTerm: 0 }
          ]
        };
        window.switchaApp.adminCircuits = [testCircuit];
        // Also place in localStorage for ownerUid fallback
        localStorage.setItem('switcha_circuits_usr_vikram_88', JSON.stringify([testCircuit]));
      })()
    `
  });

  console.log('3. Navigating to #/admin/studio with inspectUser & inspectCircuit params...');
  await send('Runtime.evaluate', {
    expression: `
      (async () => {
        window.location.hash = '#/admin/studio?inspectUser=usr_vikram_88&inspectCircuit=custom_rc_filter_99';
        await window.switchaApp.handleAdminStudioRoute('inspectUser=usr_vikram_88&inspectCircuit=custom_rc_filter_99');
      })()
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('4. Checking loaded circuit state in Admin Studio...');
  const studioState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const titleBreadcrumb = document.getElementById('adminStudioCircuitTitle')?.textContent?.trim();
        const nameInput = document.getElementById('adminCircuitNameInput')?.value;
        const infoSpan = document.getElementById('adminStudioInspectInfo')?.textContent?.trim();
        const bannerVisible = document.getElementById('adminStudioInspectionBanner')?.style?.display !== 'none';
        const compCount = window.switchaApp.adminCanvas?.components?.length;
        const compTypes = window.switchaApp.adminCanvas?.components?.map(c => c.type);
        const isBuckConverter = compTypes?.includes('switch') || compTypes?.includes('inductor');
        return {
          titleBreadcrumb,
          nameInput,
          infoSpan,
          bannerVisible,
          compCount,
          compTypes,
          isBuckConverter
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Studio Inspection State:', studioState?.result?.value);
  const res = studioState?.result?.value;

  if (res?.compCount !== 3) {
    console.error('FAIL: Expected 3 components from inspected circuit, got:', res?.compCount);
    chromeProc.kill();
    process.exit(1);
  }

  if (res?.isBuckConverter) {
    console.error('FAIL: Studio loaded the default Buck Converter instead of the actual inspected circuit!');
    chromeProc.kill();
    process.exit(1);
  }

  if (!res?.nameInput?.includes('Active Bandpass RC Filter')) {
    console.error('FAIL: Circuit name input did not reflect the inspected circuit name!');
    chromeProc.kill();
    process.exit(1);
  }

  if (!res?.bannerVisible) {
    console.error('FAIL: Inspection banner was not visible!');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('5. Now inspecting a second completely different circuit (BJT Amplifier)...');
  const step5Res = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const adminUser = {
          uid: 'admin_test_01',
          email: 'pothumsanthosh@gmail.com',
          displayName: 'Pothum Santhosh'
        };
        window.firebaseService.adminContext.currentUser = adminUser;

        const circuit2 = {
          id: 'custom_bjt_amp_101',
          name: 'BJT Class A Amplifier',
          author: 'Santhosh Admin',
          ownerUid: 'usr_student_02',
          ownerEmail: 'student2@school.edu',
          components: [
            { id: 'bjt1', type: 'transistor', x: 250, y: 150, params: { beta: 120 } },
            { id: 'r1', type: 'resistor', x: 250, y: 80, params: { r: 4700 } },
            { id: 'r2', type: 'resistor', x: 250, y: 220, params: { r: 1000 } },
            { id: 'vcc', type: 'dc_voltage', x: 100, y: 80, params: { v: 12 } },
            { id: 'gnd', type: 'ground', x: 100, y: 250, params: {} }
          ],
          wires: [
            { from: 'vcc', fromTerm: 1, to: 'r1', toTerm: 0 },
            { from: 'r1', fromTerm: 1, to: 'bjt1', toTerm: 0 }
          ]
        };
        window.switchaApp.adminCircuits.push(circuit2);
        localStorage.setItem('switcha_circuits_usr_student_02', JSON.stringify([circuit2]));
        
        window.location.hash = '#/admin/studio?inspectUser=usr_student_02&inspectCircuit=custom_bjt_amp_101';
        await window.switchaApp.handleAdminStudioRoute('inspectUser=usr_student_02&inspectCircuit=custom_bjt_amp_101');
        return {
          inspectedId: window.switchaApp.currentInspectedCircuit?.id,
          inspectedName: window.switchaApp.currentInspectedCircuit?.name,
          adminCircuitsCount: window.switchaApp.adminCircuits?.length,
          canvasCompCount: window.switchaApp.adminCanvas?.components?.length
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Step 5 evaluate raw result:', step5Res);
  await new Promise(r => setTimeout(r, 800));

  const studioState2 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const titleBreadcrumb = document.getElementById('adminStudioCircuitTitle')?.textContent?.trim();
        const nameInput = document.getElementById('adminCircuitNameInput')?.value;
        const compCount = window.switchaApp.adminCanvas?.components?.length;
        const compTypes = window.switchaApp.adminCanvas?.components?.map(c => c.type);
        return { titleBreadcrumb, nameInput, compCount, compTypes };
      })()
    `,
    returnByValue: true
  });
  console.log('Second Circuit Inspection State:', studioState2?.result?.value);
  const res2 = studioState2?.result?.value;

  if (res2?.compCount !== 5) {
    console.error('FAIL: Expected 5 components from second circuit, got:', res2?.compCount);
    chromeProc.kill();
    process.exit(1);
  }

  if (!res2?.nameInput?.includes('BJT Class A Amplifier')) {
    console.error('FAIL: Circuit 2 did not update the circuit name input!');
    chromeProc.kill();
    process.exit(1);
  }

  if (!res2?.compTypes?.includes('transistor')) {
    console.error('FAIL: Circuit 2 components did not load on canvas!');
    chromeProc.kill();
    process.exit(1);
  }

  chromeProc.kill();
  console.log('SUCCESS: Both circuits loaded distinctly with their actual components!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
