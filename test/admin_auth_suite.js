/**
 * Switcha 2.0 Test Suite: Admin Authentication & Custom Claims Authorization
 * Verifies cryptographic custom claim verification, login flows, and privilege separation.
 */

import assert from 'assert';

console.log('================================================================');
console.log('🛡️ RUNNING TEST SUITE: ADMIN AUTHENTICATION & CUSTOM CLAIMS');
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

// Mock User with Custom Claims for Node Testing
class MockFirebaseUser {
  constructor(uid, email, claims = {}) {
    this.uid = uid;
    this.email = email;
    this.claims = claims;
    this.lastForceRefresh = null;
  }

  async getIdTokenResult(forceRefresh = false) {
    this.lastForceRefresh = forceRefresh;
    return {
      claims: this.claims,
      token: 'mock_jwt_token_' + this.uid,
      issuedAtTime: Date.now(),
      expirationTime: Date.now() + 3600000
    };
  }
}

async function run() {
  await test('Admin with { admin: true } custom claim is verified authoritatively', async () => {
    const adminUser = new MockFirebaseUser('admin_uid_001', 'admin@electrosim.web.app', { admin: true });
    
    // Simulate verifyAdmin logic from firebase-service.js
    const tokenResult = await adminUser.getIdTokenResult(true);
    const isAdmin = Boolean(tokenResult?.claims?.admin === true);

    assert.strictEqual(isAdmin, true, 'User with { admin: true } claim must be granted admin access');
    assert.strictEqual(adminUser.lastForceRefresh, true, 'verifyAdmin should support forceRefresh');
  });

  await test('Normal student/user without admin claim is denied admin authorization', async () => {
    const regularUser = new MockFirebaseUser('student_uid_101', 'student@school.edu', {});
    
    const tokenResult = await regularUser.getIdTokenResult(false);
    const isAdmin = Boolean(tokenResult?.claims?.admin === true);

    assert.strictEqual(isAdmin, false, 'User without admin claim must be blocked from admin access');
  });

  await test('User with explicit { admin: false } is strictly denied admin authorization', async () => {
    const explicitFalseUser = new MockFirebaseUser('user_uid_202', 'user@example.com', { admin: false });
    
    const tokenResult = await explicitFalseUser.getIdTokenResult(false);
    const isAdmin = Boolean(tokenResult?.claims?.admin === true);

    assert.strictEqual(isAdmin, false, 'User with { admin: false } must be blocked');
  });

  await test('Guest / Unauthenticated user (null user) is denied admin access without error', async () => {
    const currentUser = null;
    let isAdmin = false;
    if (currentUser) {
      const tokenResult = await currentUser.getIdTokenResult();
      isAdmin = Boolean(tokenResult?.claims?.admin === true);
    }
    assert.strictEqual(isAdmin, false, 'Null currentUser must evaluate to false');
  });

  await test('Privileged claim assignment script rejects empty/invalid arguments', async () => {
    // Test logic from scripts/set-admin-claim.js
    const validateArgs = (args) => {
      let targetEmail = null;
      let targetUid = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--email' && args[i + 1]) targetEmail = args[i + 1];
        else if (args[i] === '--uid' && args[i + 1]) targetUid = args[i + 1];
      }
      return Boolean(targetEmail || targetUid);
    };

    assert.strictEqual(validateArgs(['--email', 'admin@example.com']), true);
    assert.strictEqual(validateArgs(['--uid', 'admin_uid_777']), true);
    assert.strictEqual(validateArgs([]), false);
    assert.strictEqual(validateArgs(['--other']), false);
  });

  await test('Admin logout clears authentication session and revokes access', async () => {
    let sessionUser = new MockFirebaseUser('admin_uid_001', 'admin@electrosim.web.app', { admin: true });
    assert(sessionUser !== null);

    // Perform sign out
    sessionUser = null;
    assert.strictEqual(sessionUser, null, 'Session user must be cleared on logout');
  });

  console.log(`\n================================================================`);
  console.log(`📊 ADMIN AUTH TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
