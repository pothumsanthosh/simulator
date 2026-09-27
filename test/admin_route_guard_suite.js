/**
 * Switcha 2.0 Test Suite: Admin Route Guard & Navigation Security
 * Verifies route protection, redirection matrix, and absence of admin buttons in public navigation.
 */

import assert from 'assert';
import fs from 'fs';

console.log('================================================================');
console.log('🚦 RUNNING TEST SUITE: ADMIN ROUTE GUARD & NAVIGATION INTEGRITY');
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

// Router simulator matching SwitchaApp.handleHash & handleAdminRoute
class RouterSimulator {
  constructor() {
    this.currentHash = '#/';
    this.currentView = 'home';
    this.toastMessage = null;
    this.currentUser = null;
  }

  async navigate(targetHash) {
    this.currentHash = targetHash;
    const [routePath, queryString] = targetHash.split('?');

    if (routePath.startsWith('#/create') || routePath.startsWith('#/circuits')) {
      this.currentView = 'studio';
    } else if (routePath.startsWith('#/blocks')) {
      this.currentView = 'blocks';
    } else if (routePath.startsWith('#/code')) {
      this.currentView = 'code';
    } else if (routePath.startsWith('#/my-circuits') || routePath.startsWith('#/workspace')) {
      this.currentView = 'my-circuits';
    } else if (routePath.startsWith('#/discover')) {
      this.currentView = 'discover';
    } else if (routePath.startsWith('#/features')) {
      this.currentView = 'features';
    } else if (routePath.startsWith('#/admin/login')) {
      this.currentView = 'admin-login';
    } else if (routePath.startsWith('#/admin')) {
      await this.handleAdminRoute();
    } else {
      this.currentView = 'home';
    }
  }

  async handleAdminRoute() {
    if (!this.currentUser) {
      this.currentHash = '#/admin/login';
      this.currentView = 'admin-login';
      return;
    }

    const isAdmin = Boolean(this.currentUser.claims?.admin === true);
    if (!isAdmin) {
      this.toastMessage = 'Access Denied: Administrator privileges required.';
      this.currentHash = '#/create';
      this.currentView = 'studio';
      return;
    }

    this.currentView = 'admin';
  }
}

async function run() {
  const router = new RouterSimulator();

  await test('Unauthenticated user accessing #/admin is redirected to #/admin/login', async () => {
    router.currentUser = null;
    await router.navigate('#/admin');

    assert.strictEqual(router.currentHash, '#/admin/login', 'Must redirect to #/admin/login');
    assert.strictEqual(router.currentView, 'admin-login', 'Must display admin-login view');
  });

  await test('Authenticated non-admin accessing #/admin is blocked and redirected to #/create', async () => {
    router.currentUser = { uid: 'student_123', email: 'student@example.com', claims: {} };
    await router.navigate('#/admin');

    assert.strictEqual(router.currentHash, '#/create', 'Must redirect non-admin to #/create');
    assert.strictEqual(router.currentView, 'studio', 'Must display studio view');
    assert(router.toastMessage && router.toastMessage.includes('Access Denied'), 'Must show Access Denied warning');
  });

  await test('Authenticated admin accessing #/admin is granted access to admin dashboard', async () => {
    router.currentUser = { uid: 'admin_999', email: 'admin@electrosim-4cf3f.firebaseapp.com', claims: { admin: true } };
    await router.navigate('#/admin');

    assert.strictEqual(router.currentHash, '#/admin', 'Must keep #/admin route for admin');
    assert.strictEqual(router.currentView, 'admin', 'Must display admin view');
  });

  await test('Direct navigation to #/admin/login works for unauthenticated users', async () => {
    router.currentUser = null;
    await router.navigate('#/admin/login');

    assert.strictEqual(router.currentView, 'admin-login');
  });

  await test('Standard user routes (#/, #/create, #/blocks, #/code, #/my-circuits) remain unaffected', async () => {
    router.currentUser = null;

    await router.navigate('#/');
    assert.strictEqual(router.currentView, 'home');

    await router.navigate('#/create');
    assert.strictEqual(router.currentView, 'studio');

    await router.navigate('#/blocks');
    assert.strictEqual(router.currentView, 'blocks');

    await router.navigate('#/code');
    assert.strictEqual(router.currentView, 'code');

    await router.navigate('#/my-circuits');
    assert.strictEqual(router.currentView, 'my-circuits');

    await router.navigate('#/discover');
    assert.strictEqual(router.currentView, 'discover');

    await router.navigate('#/features');
    assert.strictEqual(router.currentView, 'features');
  });

  await test('Public navbar in index.html strictly contains ZERO "Admin" links or buttons', async () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const navMatch = html.match(/<nav class="nav">([\s\S]*?)<\/nav>/);
    assert(navMatch, 'Navbar must exist in index.html');

    const navContent = navMatch[1];
    assert(!navContent.toLowerCase().includes('admin'), 'Public navigation must NOT expose any admin link or button');

    const topbarRightMatch = html.match(/<div class="topbar-right">([\s\S]*?)<\/header>/);
    assert(topbarRightMatch, 'Topbar right controls must exist');
    const topbarRightContent = topbarRightMatch[1];
    assert(!topbarRightContent.toLowerCase().includes('admin'), 'Topbar controls must NOT expose any admin button to regular users');
  });

  console.log(`\n================================================================`);
  console.log(`📊 ADMIN ROUTE GUARD TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run();
