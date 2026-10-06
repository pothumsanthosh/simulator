/**
 * Test Suite: Admin User Reflection and Duplicate Button Elimination
 * Verifies that:
 * 1. Multiple registered/signed-in users are reflected in Admin Console (users table & total stat)
 * 2. Duplicate "Admin Logout" buttons are completely removed (topbar logout is single source)
 * 3. Duplicate "Admin Console" buttons are removed across Admin dashboard and all lab breadcrumbs
 */

import assert from 'assert';
import fs from 'fs';
import { firebaseService } from '../js/services/firebase-service.js';

console.log('================================================================');
console.log('🧪 RUNNING TEST SUITE: ADMIN USER REFLECTION & CLEANUP');
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

// Minimal in-memory localStorage polyfill for node testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(i) { return Object.keys(this.store)[i] || null; }
}

globalThis.localStorage = new MockLocalStorage();

async function run() {
  await test('User registration records to multi-source persistence registry', async () => {
    localStorage.clear();

    const user1 = { uid: 'usr_001', email: 'alice@institution.edu', displayName: 'Alice' };
    const user2 = { uid: 'usr_002', email: 'bob@institution.edu', displayName: 'Bob' };

    firebaseService.recordLocalUser(user1, { role: 'user', status: 'active', createdAt: Date.now() });
    firebaseService.recordLocalUser(user2, { role: 'user', status: 'active', createdAt: Date.now() });

    const raw = localStorage.getItem('esamastha_known_users');
    assert(raw, 'Local user registry must exist in localStorage');
    const users = JSON.parse(raw);
    assert.strictEqual(users.length, 2, 'Must contain 2 registered users');
    assert.strictEqual(users[0].email, 'alice@institution.edu');
    assert.strictEqual(users[1].email, 'bob@institution.edu');
  });

  await test('loadAllUsers returns all registered users even when offline/local', async () => {
    const loadedUsers = await firebaseService.loadAllUsers();
    assert(Array.isArray(loadedUsers), 'Must return an array');
    assert(loadedUsers.length >= 2, 'Must return at least the 2 registered users');

    const emails = loadedUsers.map(u => u.email);
    assert(emails.includes('alice@institution.edu'), 'Must include Alice');
    assert(emails.includes('bob@institution.edu'), 'Must include Bob');
  });

  await test('Admin HTML has ZERO duplicate btnAdminLogout buttons', async () => {
    const adminHtml = fs.readFileSync('admin.html', 'utf8');
    assert(!adminHtml.includes('id="btnAdminLogout"'), 'btnAdminLogout must not exist in admin.html');
    assert(adminHtml.includes('id="btnLogout"'), 'Authoritative #btnLogout must exist in admin.html');
  });

  await test('Index HTML has ZERO duplicate btnAdminLogout buttons', async () => {
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    assert(!indexHtml.includes('id="btnAdminLogout"'), 'btnAdminLogout must not exist in index.html');
    assert(indexHtml.includes('id="btnLogout"'), 'Authoritative #btnLogout must exist in index.html');
  });

  await test('Lab breadcrumbs have ZERO duplicate right-side return buttons', async () => {
    const adminHtml = fs.readFileSync('admin.html', 'utf8');
    assert(!adminHtml.includes('id="studioAdminReturnRightBtn"'), 'studioAdminReturnRightBtn must not exist in admin.html');

    const indexHtml = fs.readFileSync('index.html', 'utf8');
    assert(!indexHtml.includes('id="studioAdminReturnRightBtn"'), 'studioAdminReturnRightBtn must not exist in index.html');
  });

  await test('Firestore security rules allow authorized admin emails in isAdmin()', async () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    assert(rules.includes('pothumsanthosh@gmail.com'), 'Rules must authorize pothumsanthosh@gmail.com');
    assert(rules.includes('request.auth.token.admin == true'), 'Rules must maintain token.admin support');
  });

  console.log(`\n================================================================`);
  console.log(`📊 CLEANUP TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
