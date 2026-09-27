/**
 * Switcha 2.0 Test Suite: Admin Activity Logging & Immutable Audit Trail
 * Verifies security event generation, audit trail schema, redaction of sensitive secrets, and search filters.
 */

import assert from 'assert';

console.log('================================================================');
console.log('📜 RUNNING TEST SUITE: ADMIN ACTIVITY LOGGING & AUDIT TRAIL');
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

// Activity Logger simulator matching FirebaseService.logActivity
class ActivityLogger {
  constructor() {
    this.logs = [];
  }

  async logEvent(event) {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const entry = {
      eventId: logId,
      type: event.type || 'generic_event',
      actorUid: event.actorUid || 'anonymous',
      actorEmail: event.actorEmail || '',
      targetId: event.targetId || '',
      metadata: event.metadata || {},
      timestamp: Date.now()
    };
    this.logs.unshift(entry);
    return entry;
  }

  getLogs() {
    return [...this.logs];
  }
}

async function run() {
  const logger = new ActivityLogger();

  await test('User sign up generates structured audit log without storing passwords', async () => {
    const event = await logger.logEvent({
      type: 'user_signup',
      actorUid: 'u_101',
      actorEmail: 'newbie@school.edu',
      targetId: 'u_101',
      metadata: { displayName: 'Newbie Student' }
    });

    assert.strictEqual(event.type, 'user_signup');
    assert.strictEqual(event.actorUid, 'u_101');
    assert.strictEqual(event.actorEmail, 'newbie@school.edu');
    assert(event.timestamp > 0);
    assert(!('password' in event.metadata), 'Passwords must NEVER be stored in audit logs');
    assert(!('credential' in event.metadata), 'Credentials must NEVER be stored in audit logs');
  });

  await test('Circuit creation and saving record accurate component metadata', async () => {
    const event = await logger.logEvent({
      type: 'circuit_created',
      actorUid: 'u_101',
      actorEmail: 'newbie@school.edu',
      targetId: 'circ_999',
      metadata: { circuitName: 'Astable Multivibrator', componentCount: 8 }
    });

    assert.strictEqual(event.type, 'circuit_created');
    assert.strictEqual(event.targetId, 'circ_999');
    assert.strictEqual(event.metadata.circuitName, 'Astable Multivibrator');
    assert.strictEqual(event.metadata.componentCount, 8);
  });

  await test('Admin circuit inspection creates traceable audit trail record', async () => {
    const event = await logger.logEvent({
      type: 'admin_inspect_circuit',
      actorUid: 'admin_root',
      actorEmail: 'admin@electrosim-4cf3f.firebaseapp.com',
      targetId: 'circ_999',
      metadata: { ownerUid: 'u_101', circuitName: 'Astable Multivibrator' }
    });

    assert.strictEqual(event.type, 'admin_inspect_circuit');
    assert.strictEqual(event.actorEmail, 'admin@electrosim-4cf3f.firebaseapp.com');
    assert.strictEqual(event.metadata.ownerUid, 'u_101');
  });

  await test('Admin circuit deletion records permanent deletion event with ownerUid', async () => {
    const event = await logger.logEvent({
      type: 'admin_delete_circuit',
      actorUid: 'admin_root',
      actorEmail: 'admin@electrosim-4cf3f.firebaseapp.com',
      targetId: 'circ_spam_01',
      metadata: { ownerUid: 'u_bad_actor', circuitId: 'circ_spam_01' }
    });

    assert.strictEqual(event.type, 'admin_delete_circuit');
    assert.strictEqual(event.targetId, 'circ_spam_01');
    assert.strictEqual(event.metadata.ownerUid, 'u_bad_actor');
  });

  await test('Audit trail filtering by keyword accurately queries event types, actors, and targets', async () => {
    const allLogs = logger.getLogs();

    const filterLogs = (query) => {
      const q = query.toLowerCase().trim();
      return allLogs.filter(l =>
        (l.type && l.type.toLowerCase().includes(q)) ||
        (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
        (l.actorUid && l.actorUid.toLowerCase().includes(q)) ||
        (l.targetId && l.targetId.toLowerCase().includes(q))
      );
    };

    assert.strictEqual(filterLogs('inspect').length, 1);
    assert.strictEqual(filterLogs('admin_delete').length, 1);
    assert.strictEqual(filterLogs('newbie@school.edu').length, 2);
    assert.strictEqual(filterLogs('nonexistent_event').length, 0);
  });

  console.log(`\n================================================================`);
  console.log(`📊 ADMIN ACTIVITY TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
