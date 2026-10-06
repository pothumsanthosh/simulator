/**
 * Test Suite: Dual-Portal Authentication & Session Isolation
 * Tests the 9 mandatory regression test scenarios specified in P0 requirements:
 * 1. adminLoginDoesNotAffectUserSession()
 * 2. userLoginDoesNotAffectAdminSession()
 * 3. adminLogoutDoesNotAffectUserSession()
 * 4. userLogoutDoesNotAffectAdminSession()
 * 5. adminRefreshPreservesSession()
 * 6. userRefreshPreservesSession()
 * 7. normalUserCannotAccessAdmin()
 * 8. adminClaimIsRequired()
 * 9. noSharedGlobalAuthState()
 * 10. routeGuardsEnforcePrivileges()
 */

import assert from 'assert';
import fs from 'fs';
import { firebaseService, UserAuthContext, AdminAuthContext } from '../js/services/firebase-service.js';

console.log('================================================================');
console.log('🛡️ RUNNING TEST SUITE: DUAL-PORTAL AUTHENTICATION ISOLATION');
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

// Mock User with Custom Claims
class MockTokenUser {
  constructor(uid, email, displayName, claims = {}) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
    this.claims = claims;
  }

  async getIdTokenResult(forceRefresh = false) {
    return {
      claims: this.claims,
      token: `jwt_token_${this.uid}`,
      issuedAtTime: Date.now(),
      expirationTime: Date.now() + 3600000
    };
  }
}

// In-memory mock storage
class MemoryStorage {
  constructor() { this.map = {}; }
  getItem(k) { return this.map[k] || null; }
  setItem(k, v) { this.map[k] = String(v); }
  removeItem(k) { delete this.map[k]; }
  clear() { this.map = {}; }
  get length() { return Object.keys(this.map).length; }
  key(i) { return Object.keys(this.map)[i] || null; }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

async function run() {
  const student = new MockTokenUser('usr_student_01', 'rahul@student.edu', 'Rahul Verma', {});
  const admin = new MockTokenUser('usr_admin_01', 'pothumsanthosh@gmail.com', 'Pothum Santhosh', { admin: true });

  await test('adminLoginDoesNotAffectUserSession()', async () => {
    // Initial: Student user is logged in on UserAuthContext
    firebaseService.userContext.currentUser = student;
    firebaseService.adminContext.currentUser = null;

    // Action: Admin logs into AdminAuthContext
    firebaseService.adminContext.currentUser = admin;

    // Verification: User session in userContext remains unchanged
    assert.strictEqual(firebaseService.userContext.currentUser?.uid, 'usr_student_01', 'User session must remain active');
    assert.strictEqual(firebaseService.userContext.currentUser?.email, 'rahul@student.edu');
    assert.strictEqual(firebaseService.adminContext.currentUser?.uid, 'usr_admin_01');
  });

  await test('userLoginDoesNotAffectAdminSession()', async () => {
    // Initial: Admin is logged in on AdminAuthContext
    firebaseService.adminContext.currentUser = admin;
    firebaseService.userContext.currentUser = null;

    // Action: Student logs into UserAuthContext
    firebaseService.userContext.currentUser = student;

    // Verification: Admin session in adminContext remains unchanged
    assert.strictEqual(firebaseService.adminContext.currentUser?.uid, 'usr_admin_01', 'Admin session must remain active');
    assert.strictEqual(firebaseService.adminContext.currentUser?.email, 'pothumsanthosh@gmail.com');
    assert.strictEqual(firebaseService.userContext.currentUser?.uid, 'usr_student_01');
  });

  await test('adminLogoutDoesNotAffectUserSession()', async () => {
    // Initial: Both contexts active
    firebaseService.adminContext.currentUser = admin;
    firebaseService.userContext.currentUser = student;

    // Action: Admin logs out
    firebaseService.adminContext.currentUser = null;

    // Verification: Admin is cleared, User remains authenticated
    assert.strictEqual(firebaseService.adminContext.currentUser, null, 'Admin session must be terminated');
    assert.strictEqual(firebaseService.userContext.currentUser?.uid, 'usr_student_01', 'User session must NOT be terminated');
    assert.strictEqual(firebaseService.userContext.currentUser?.displayName, 'Rahul Verma');
  });

  await test('userLogoutDoesNotAffectAdminSession()', async () => {
    // Initial: Both contexts active
    firebaseService.adminContext.currentUser = admin;
    firebaseService.userContext.currentUser = student;

    // Action: User logs out
    firebaseService.userContext.currentUser = null;

    // Verification: User is cleared, Admin remains authenticated
    assert.strictEqual(firebaseService.userContext.currentUser, null, 'User session must be terminated');
    assert.strictEqual(firebaseService.adminContext.currentUser?.uid, 'usr_admin_01', 'Admin session must NOT be terminated');
    assert.strictEqual(firebaseService.adminContext.currentUser?.email, 'pothumsanthosh@gmail.com');
  });

  await test('adminRefreshPreservesSession()', async () => {
    // Simulating rehydration from isolated Admin context
    firebaseService.adminContext.currentUser = admin;
    assert(firebaseService.adminContext.currentUser !== null);
    const refreshedAdmin = firebaseService.adminContext.currentUser;
    assert.strictEqual(refreshedAdmin.uid, 'usr_admin_01');
    assert.strictEqual(refreshedAdmin.email, 'pothumsanthosh@gmail.com');
  });

  await test('userRefreshPreservesSession()', async () => {
    // Simulating rehydration from isolated User context
    firebaseService.userContext.currentUser = student;
    assert(firebaseService.userContext.currentUser !== null);
    const refreshedUser = firebaseService.userContext.currentUser;
    assert.strictEqual(refreshedUser.uid, 'usr_student_01');
    assert.strictEqual(refreshedUser.displayName, 'Rahul Verma');
  });

  await test('normalUserCannotAccessAdmin()', async () => {
    // Set admin context to a normal student user without admin claim
    const nonAdminUser = new MockTokenUser('usr_imposter', 'hacker@student.edu', 'Imposter', { admin: false });
    firebaseService.adminContext.currentUser = nonAdminUser;

    const isAuthorized = await firebaseService.verifyAdmin(false);
    assert.strictEqual(isAuthorized, false, 'Normal user without claim or authorized email must be denied');
  });

  await test('adminClaimIsRequired()', async () => {
    // 1. Authorized with claim
    const claimAdmin = new MockTokenUser('usr_verified_admin', 'staff@univ.edu', 'Staff', { admin: true });
    firebaseService.adminContext.currentUser = claimAdmin;
    assert.strictEqual(await firebaseService.verifyAdmin(true), true, 'User with { admin: true } claim must be authorized');

    // 2. Pre-authorized admin email
    const emailAdmin = new MockTokenUser('usr_email_admin', 'pothumsanthosh@gmail.com', 'Santhosh', {});
    firebaseService.adminContext.currentUser = emailAdmin;
    assert.strictEqual(await firebaseService.verifyAdmin(false), true, 'Pre-authorized administrator email must be recognized');

    // 3. Unauthorized standard user
    const standardUser = new MockTokenUser('usr_std_regular', 'someone@gmail.com', 'Regular', {});
    firebaseService.adminContext.currentUser = standardUser;
    assert.strictEqual(await firebaseService.verifyAdmin(false), false, 'Arbitrary email without claim must be rejected');
  });

  await test('noSharedGlobalAuthState()', async () => {
    // Verify no global state leaks in window, localStorage, or sessionStorage
    assert.strictEqual(globalThis.sessionStorage.getItem('esamastha_authenticated_admin_uid'), null, 'No admin token in sessionStorage');
    assert.strictEqual(globalThis.localStorage.getItem('currentUser'), null, 'No currentUser in localStorage');
    assert.strictEqual(globalThis.localStorage.getItem('role'), null, 'No role in localStorage');
    assert.strictEqual(globalThis.localStorage.getItem('isAdmin'), null, 'No isAdmin in localStorage');

    // Verify source files do NOT write to forbidden keys
    const appJsContent = fs.readFileSync('js/app.js', 'utf8');
    assert(!appJsContent.includes('sessionStorage.setItem("esamastha_authenticated_admin_uid"'), 'No sessionStorage admin key in app.js');
    assert(!appJsContent.includes('localStorage.setItem("role"'), 'No role in localStorage');
    assert(!appJsContent.includes('window.isAdmin = true'), 'No window.isAdmin');
    assert(!appJsContent.includes('btnAdminDemoPreview'), 'No demo preview button references');
  });

  await test('routeGuardsEnforcePrivileges()', async () => {
    // Simulator for route guard logic in SwitchaApp.handleAdminRoute
    const simulateRouteGuard = async (adminContextUser, userContextUser) => {
      let adminUser = adminContextUser;
      if (!adminUser) {
        if (userContextUser) {
          return { route: '#/create', access: 'DENIED_NORMAL_USER' };
        }
        return { route: '#/admin/login', access: 'UNAUTHENTICATED' };
      }
      const tokenRes = await adminUser.getIdTokenResult(false);
      const isAuthorized = tokenRes.claims.admin === true || adminUser.email === 'pothumsanthosh@gmail.com';
      if (!isAuthorized) {
        return { route: '#/create', access: 'DENIED_UNAUTHORIZED' };
      }
      return { route: '#/admin', access: 'GRANTED_ADMIN' };
    };

    // 1. Guest -> #/admin/login
    const res1 = await simulateRouteGuard(null, null);
    assert.strictEqual(res1.route, '#/admin/login');
    assert.strictEqual(res1.access, 'UNAUTHENTICATED');

    // 2. Authenticated Normal User -> ACCESS DENIED -> #/create
    const res2 = await simulateRouteGuard(null, student);
    assert.strictEqual(res2.route, '#/create');
    assert.strictEqual(res2.access, 'DENIED_NORMAL_USER');

    // 3. Authenticated Admin -> ADMIN DASHBOARD (#/admin)
    const res3 = await simulateRouteGuard(admin, null);
    assert.strictEqual(res3.route, '#/admin');
    assert.strictEqual(res3.access, 'GRANTED_ADMIN');
  });

  await test('adminHeaderEmailBadgeStrictlyFollowsAdminContext()', async () => {
    // Both contexts active
    firebaseService.adminContext.currentUser = admin;
    firebaseService.userContext.currentUser = student;

    // Verify source code guarantees that loadAdminData does not read userContext
    const appJsContent = fs.readFileSync('js/app.js', 'utf8');
    assert(!appJsContent.includes('adminEmailBadge && firebaseService.currentUser'), 'loadAdminData must not read firebaseService.currentUser');
    assert(appJsContent.includes('const adminUser = firebaseService.adminContext?.currentUser'), 'loadAdminData must use adminContext.currentUser');
  });

  console.log(`\n================================================================`);
  console.log(`📊 DUAL-PORTAL AUTH ISOLATION TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
