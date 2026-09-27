/**
 * Switcha 2.0 Test Suite: Firestore Security Rules & Access Matrix
 * Evaluates simulated Firestore Security Rules against Guest, User A, User B, and Admin.
 */

import assert from 'assert';
import fs from 'fs';

console.log('================================================================');
console.log('🔒 RUNNING TEST SUITE: FIRESTORE SECURITY RULES & OWNER ISOLATION');
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

// Security Rules Evaluator matching firestore.rules logic
class RulesEvaluator {
  evaluateCircuitRead({ auth, docOwnerId, isPublic }) {
    const isAuthenticated = auth !== null;
    const isAdmin = isAuthenticated && auth.token?.admin === true;
    const isOwner = isAuthenticated && auth.uid === docOwnerId;
    return isOwner || isAdmin || isPublic === true;
  }

  evaluateCircuitCreate({ auth, docOwnerId, payloadOwnerUid }) {
    const isAuthenticated = auth !== null;
    const isOwner = isAuthenticated && auth.uid === docOwnerId;
    return isOwner && payloadOwnerUid === docOwnerId;
  }

  evaluateCircuitUpdate({ auth, docOwnerId, payloadOwnerUid }) {
    const isAuthenticated = auth !== null;
    const isAdmin = isAuthenticated && auth.token?.admin === true;
    const isOwner = isAuthenticated && auth.uid === docOwnerId;
    return (isOwner && payloadOwnerUid === docOwnerId) || isAdmin;
  }

  evaluateCircuitDelete({ auth, docOwnerId }) {
    const isAuthenticated = auth !== null;
    const isAdmin = isAuthenticated && auth.token?.admin === true;
    const isOwner = isAuthenticated && auth.uid === docOwnerId;
    return isOwner || isAdmin;
  }

  evaluateLogRead({ auth }) {
    const isAuthenticated = auth !== null;
    const isAdmin = isAuthenticated && auth.token?.admin === true;
    return isAdmin;
  }

  evaluateLogCreate({ auth, logActorUid }) {
    const isAuthenticated = auth !== null;
    return isAuthenticated && logActorUid === auth.uid;
  }

  evaluateLogMutation() {
    return false; // Immutable audit trail
  }
}

async function run() {
  const evaluator = new RulesEvaluator();

  const guest = null;
  const userA = { uid: 'user_a_111', token: {} };
  const userB = { uid: 'user_b_222', token: {} };
  const admin = { uid: 'admin_333', token: { admin: true } };

  await test('Guest cannot read private circuits of User A', async () => {
    const allowed = evaluator.evaluateCircuitRead({ auth: guest, docOwnerId: 'user_a_111', isPublic: false });
    assert.strictEqual(allowed, false, 'Guest must NOT read private circuit');
  });

  await test('Guest CAN read circuit explicitly marked isPublic == true', async () => {
    const allowed = evaluator.evaluateCircuitRead({ auth: guest, docOwnerId: 'user_a_111', isPublic: true });
    assert.strictEqual(allowed, true, 'Guest should read public circuit');
  });

  await test('User B cannot read private circuits of User A (Owner Isolation)', async () => {
    const allowed = evaluator.evaluateCircuitRead({ auth: userB, docOwnerId: 'user_a_111', isPublic: false });
    assert.strictEqual(allowed, false, 'User B must NOT read User A private circuit');
  });

  await test('User A CAN read their own private circuits', async () => {
    const allowed = evaluator.evaluateCircuitRead({ auth: userA, docOwnerId: 'user_a_111', isPublic: false });
    assert.strictEqual(allowed, true, 'User A must read their own circuit');
  });

  await test('Admin CAN read private circuits of any user for inspection', async () => {
    const allowed = evaluator.evaluateCircuitRead({ auth: admin, docOwnerId: 'user_a_111', isPublic: false });
    assert.strictEqual(allowed, true, 'Admin must be permitted to read circuit for inspection');
  });

  await test('User B cannot create a circuit in User A path or with forged ownerUid', async () => {
    // User B attempts to write to users/user_a_111/circuits
    const allowedPath = evaluator.evaluateCircuitCreate({ auth: userB, docOwnerId: 'user_a_111', payloadOwnerUid: 'user_b_222' });
    assert.strictEqual(allowedPath, false, 'User B cannot write to User A collection');

    // User A creates with matching ownerUid
    const allowedOwner = evaluator.evaluateCircuitCreate({ auth: userA, docOwnerId: 'user_a_111', payloadOwnerUid: 'user_a_111' });
    assert.strictEqual(allowedOwner, true, 'User A can write to their collection with ownerUid');
  });

  await test('User B cannot delete User A circuit, but Admin CAN delete any circuit', async () => {
    const userBDelete = evaluator.evaluateCircuitDelete({ auth: userB, docOwnerId: 'user_a_111' });
    assert.strictEqual(userBDelete, false, 'User B cannot delete User A circuit');

    const adminDelete = evaluator.evaluateCircuitDelete({ auth: admin, docOwnerId: 'user_a_111' });
    assert.strictEqual(adminDelete, true, 'Admin can delete any circuit');
  });

  await test('Activity audit logs: only Admin can read; authenticated users can write their own events; update/delete is impossible', async () => {
    // Guest cannot read logs
    assert.strictEqual(evaluator.evaluateLogRead({ auth: guest }), false);
    // User A cannot read logs
    assert.strictEqual(evaluator.evaluateLogRead({ auth: userA }), false);
    // Admin CAN read logs
    assert.strictEqual(evaluator.evaluateLogRead({ auth: admin }), true);

    // User A writes own event
    assert.strictEqual(evaluator.evaluateLogCreate({ auth: userA, logActorUid: 'user_a_111' }), true);
    // User A cannot forge event with actorUid of User B
    assert.strictEqual(evaluator.evaluateLogCreate({ auth: userA, logActorUid: 'user_b_222' }), false);

    // Immutability: update or delete is always false
    assert.strictEqual(evaluator.evaluateLogMutation(), false);
  });

  await test('firestore.rules file exists, is valid, and does not contain wildcard public read/write', async () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    assert(rules.includes("rules_version = '2';"), 'Rules must declare rules_version');
    assert(rules.includes('request.auth.token.admin == true'), 'Rules must enforce custom claims admin == true');
    assert(!rules.includes('allow read, write: if true;'), 'Rules must NEVER contain wildcard public read/write');
    assert(!rules.includes('allow write: if true;'), 'Rules must NEVER allow public unauthenticated writes');
  });

  console.log(`\n================================================================`);
  console.log(`📊 FIRESTORE SECURITY TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
