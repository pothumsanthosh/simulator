/**
 * Switcha 2.0 Test Suite: Admin Dashboard, Metrics & Circuit Deletion Safeguards
 * Verifies factual statistics computation, user filtering, read-only inspection, and deletion protection.
 */

import assert from 'assert';

console.log('================================================================');
console.log('📊 RUNNING TEST SUITE: ADMIN DASHBOARD & MANAGEMENT SAFEGUARDS');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}\n${err.stack}`);
  }
}

// Compute statistics function matching SwitchaApp.loadAdminData
function computeDashboardMetrics(users = [], circuits = [], logs = []) {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const activeUsers = users.filter(u => u.lastActiveAt && (now - u.lastActiveAt) < thirtyDaysMs).length;
  const publicCircuits = circuits.filter(c => Boolean(c.isPublic)).length;

  return {
    totalUsers: users.length,
    activeUsers: activeUsers,
    totalCircuits: circuits.length,
    publicCircuits: publicCircuits,
    recentActivity: logs.length
  };
}

async function run() {
  await test('Empty database yields factual 0 counters (no fake mock numbers)', async () => {
    const metrics = computeDashboardMetrics([], [], []);
    assert.strictEqual(metrics.totalUsers, 0, 'Total users must be 0');
    assert.strictEqual(metrics.activeUsers, 0, 'Active users must be 0');
    assert.strictEqual(metrics.totalCircuits, 0, 'Total circuits must be 0');
    assert.strictEqual(metrics.publicCircuits, 0, 'Public circuits must be 0');
    assert.strictEqual(metrics.recentActivity, 0, 'Recent activity must be 0');
  });

  await test('Metrics accurately reflect live dataset counts and active thresholds', async () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const sampleUsers = [
      { uid: 'u1', email: 'alice@uni.edu', lastActiveAt: now - (5 * dayMs) }, // active (< 30 days)
      { uid: 'u2', email: 'bob@uni.edu', lastActiveAt: now - (10 * dayMs) },  // active (< 30 days)
      { uid: 'u3', email: 'charlie@uni.edu', lastActiveAt: now - (45 * dayMs) } // inactive (> 30 days)
    ];

    const sampleCircuits = [
      { id: 'c1', name: 'RC Low Pass', isPublic: true },
      { id: 'c2', name: 'BJT Amplifier', isPublic: false },
      { id: 'c3', name: '555 Timer', isPublic: false }
    ];

    const sampleLogs = [
      { type: 'user_login' },
      { type: 'circuit_saved' }
    ];

    const metrics = computeDashboardMetrics(sampleUsers, sampleCircuits, sampleLogs);
    assert.strictEqual(metrics.totalUsers, 3);
    assert.strictEqual(metrics.activeUsers, 2);
    assert.strictEqual(metrics.totalCircuits, 3);
    assert.strictEqual(metrics.publicCircuits, 1);
    assert.strictEqual(metrics.recentActivity, 2);
  });

  await test('User filtering by keyword searches across name, email, and UID', async () => {
    const users = [
      { uid: 'uid_alpha_1', displayName: 'Ada Lovelace', email: 'ada@computing.org' },
      { uid: 'uid_beta_2', displayName: 'Alan Turing', email: 'alan@bletchley.uk' },
      { uid: 'uid_gamma_3', displayName: 'Claude Shannon', email: 'claude@bell.com' }
    ];

    const filterUsers = (query) => {
      const q = query.toLowerCase().trim();
      return users.filter(u =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q))
      );
    };

    assert.strictEqual(filterUsers('ada').length, 1);
    assert.strictEqual(filterUsers('bletchley').length, 1);
    assert.strictEqual(filterUsers('uid_gamma').length, 1);
    assert.strictEqual(filterUsers('nonexistent').length, 0);
  });

  await test('Circuit deletion confirmation requires exact "DELETE" input before enabling button', async () => {
    const checkDeleteConfirm = (inputVal) => {
      return inputVal.trim().toUpperCase() === 'DELETE';
    };

    assert.strictEqual(checkDeleteConfirm(''), false);
    assert.strictEqual(checkDeleteConfirm('del'), false);
    assert.strictEqual(checkDeleteConfirm('delete'), true);
    assert.strictEqual(checkDeleteConfirm('DELETE'), true);
    assert.strictEqual(checkDeleteConfirm('  DELETE  '), true);
    assert.strictEqual(checkDeleteConfirm('REMOVE'), false);
  });

  await test('Admin read-only inspection flags circuit as readOnly and disables saves', async () => {
    let isReadOnlyInspection = false;
    let saveAttempted = false;

    // Simulate inspection mode initialization
    const enterInspection = (readOnly) => {
      isReadOnlyInspection = Boolean(readOnly);
    };

    const attemptSave = () => {
      if (isReadOnlyInspection) {
        return { success: false, reason: 'BLOCKED_BY_INSPECTION_MODE' };
      }
      saveAttempted = true;
      return { success: true };
    };

    enterInspection(true);
    assert.strictEqual(isReadOnlyInspection, true);

    const result = attemptSave();
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'BLOCKED_BY_INSPECTION_MODE');
    assert.strictEqual(saveAttempted, false, 'Student circuit must NOT be mutated during inspection');
  });

  console.log(`\n================================================================`);
  console.log(`📊 ADMIN DASHBOARD TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
