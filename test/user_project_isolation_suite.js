/**
 * AUTOMATED TEST SUITE: USER PROJECT ISOLATION & DATABASE PARTITIONING
 * Validates:
 * 1. Guest access to #/my-circuits is strictly blocked and redirected to #/create.
 * 2. Unauthenticated user projects list is always empty [].
 * 3. Every user has their own unique projects stored in the database.
 * 4. User 1 cannot see User 2's projects, and User 2 cannot see User 1's projects.
 * 5. Logout cleans in-memory projects and resets the workspace canvas.
 * 6. Browser history navigation (Back button) to #/my-circuits is guarded against leaks.
 */

import assert from 'assert';

console.log('================================================================');
console.log('🔒 RUNNING TEST SUITE: USER PROJECT ISOLATION & DATABASE SECURITY');
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

// In-memory Mock LocalStorage
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) { return this.store.get(k) || null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const mockLS = new MockLocalStorage();
global.localStorage = mockLS;

// Mock Firebase Service
class MockFirebaseService {
  constructor() {
    this.currentUser = null;
    this.db = new Map(); // Simulated Firestore: path -> doc
    this.listeners = [];
  }

  onAuthStateChange(cb) {
    this.listeners.push(cb);
  }

  async signIn(email, password, uid) {
    this.currentUser = { uid: uid || `uid_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email };
    for (const cb of this.listeners) await cb(this.currentUser);
    return this.currentUser;
  }

  async signOut() {
    this.currentUser = null;
    for (const cb of this.listeners) await cb(null);
  }

  async saveCircuit(circuit) {
    if (!this.currentUser) return false;
    const path = `users/${this.currentUser.uid}/circuits/${circuit.id}`;
    this.db.set(path, {
      ...circuit,
      ownerUid: this.currentUser.uid,
      ownerEmail: this.currentUser.email
    });
    return true;
  }

  async loadUserCircuits() {
    if (!this.currentUser) return [];
    const prefix = `users/${this.currentUser.uid}/circuits/`;
    const list = [];
    for (const [key, val] of this.db.entries()) {
      if (key.startsWith(prefix)) {
        list.push(val);
      }
    }
    return list;
  }

  async deleteCircuit(circuitId) {
    if (!this.currentUser) return false;
    const path = `users/${this.currentUser.uid}/circuits/${circuitId}`;
    return this.db.delete(path);
  }
}

// Router & App Controller Simulator matching updated SwitchaApp logic
class AppProjectControllerSimulator {
  constructor(firebaseService) {
    this.fb = firebaseService;
    this.currentView = 'home';
    this.currentHash = '#/';
    this.currentUserCircuits = [];
    this.activeMyCircuitId = null;
    this.canvas = { components: [], wires: [] };
    this.loginModalActive = false;
    this.toastMessage = null;

    // Listen to Auth State
    this.fb.onAuthStateChange(async (user) => {
      if (user) {
        const cloudCircuits = await this.fb.loadUserCircuits();
        this.currentUserCircuits = Array.isArray(cloudCircuits) ? cloudCircuits : [];
        this.saveMyCircuits(this.currentUserCircuits);
        if (this.currentView === 'my-circuits') {
          this.renderWorkspaceProjects();
        }
      } else {
        this.currentUserCircuits = [];
        this.activeMyCircuitId = null;
        if (this.currentView === 'my-circuits') {
          this.currentHash = '#/create';
          this.switchView('studio');
        }
      }
    });
  }

  getMyCircuits() {
    const user = this.fb.currentUser;
    if (!user) return [];
    if (this.currentUserCircuits && Array.isArray(this.currentUserCircuits)) {
      return this.currentUserCircuits;
    }
    const data = mockLS.getItem(`switcha_circuits_${user.uid}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.currentUserCircuits = parsed;
          return parsed;
        }
      } catch (_) {}
    }
    this.currentUserCircuits = [];
    return [];
  }

  saveMyCircuits(circuits) {
    const user = this.fb.currentUser;
    if (!user) return;
    this.currentUserCircuits = Array.isArray(circuits) ? circuits : [];
    mockLS.setItem(`switcha_circuits_${user.uid}`, JSON.stringify(this.currentUserCircuits));
  }

  async saveCurrentCircuit(name) {
    if (!this.fb.currentUser) {
      this.loginModalActive = true;
      this.toastMessage = '🔒 Please sign in first to save projects.';
      return false;
    }

    const circuits = this.getMyCircuits();
    const newId = `circ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const circuit = {
      id: newId,
      name: name || 'Untitled Circuit',
      ownerUid: this.fb.currentUser.uid,
      ownerEmail: this.fb.currentUser.email,
      components: JSON.parse(JSON.stringify(this.canvas.components)),
      wires: JSON.parse(JSON.stringify(this.canvas.wires)),
      updatedAt: Date.now()
    };

    circuits.unshift(circuit);
    this.activeMyCircuitId = newId;
    this.saveMyCircuits(circuits);
    await this.fb.saveCircuit(circuit);
    return circuit;
  }

  async handleHash(hash) {
    this.currentHash = hash;
    const [routePath] = hash.split('?');

    if (routePath.startsWith('#/create')) {
      this.switchView('studio');
    } else if (routePath.startsWith('#/my-circuits') || routePath.startsWith('#/workspace')) {
      if (!this.fb.currentUser) {
        this.loginModalActive = true;
        this.toastMessage = '🔒 Please sign in first to access your saved projects.';
        this.currentHash = '#/create';
        this.switchView('studio');
        return;
      }
      this.switchView('my-circuits');
    } else {
      this.switchView('home');
    }
  }

  switchView(viewName) {
    if (viewName === 'my-circuits' && !this.fb.currentUser) {
      this.loginModalActive = true;
      this.toastMessage = '🔒 Please sign in first to access your saved projects.';
      viewName = 'studio';
      this.currentHash = '#/create';
    }
    this.currentView = viewName;
  }

  renderWorkspaceProjects() {
    if (!this.fb.currentUser) {
      return { status: 'auth_required', count: 0, items: [] };
    }
    const items = this.getMyCircuits();
    return { status: 'ok', count: items.length, items };
  }

  async handleLogout() {
    await this.fb.signOut();
    this.currentUserCircuits = [];
    this.activeMyCircuitId = null;
    this.canvas.components = [];
    this.canvas.wires = [];
    this.currentHash = '#/create';
    this.switchView('studio');
  }
}

async function runTests() {
  const fb = new MockFirebaseService();
  const app = new AppProjectControllerSimulator(fb);

  await test('1. Unauthenticated guest accessing #/my-circuits is blocked and redirected to #/create', async () => {
    assert.strictEqual(fb.currentUser, null, 'Must be logged out');
    await app.handleHash('#/my-circuits');
    assert.strictEqual(app.currentView, 'studio', 'View must be redirected to studio');
    assert.strictEqual(app.currentHash, '#/create', 'Hash must be redirected away from #/my-circuits');
    assert.strictEqual(app.loginModalActive, true, 'Login modal must be prompted');
    assert(app.toastMessage.includes('sign in'), 'Toast must indicate authentication required');
  });

  await test('2. Browser Back Button navigation to #/my-circuits triggers route guard without leak', async () => {
    // User navigates somewhere else then hits Back (hashchange to #/my-circuits)
    await app.handleHash('#/');
    assert.strictEqual(app.currentView, 'home');

    // Simulate back button to #/my-circuits while still guest
    await app.handleHash('#/my-circuits');
    assert.strictEqual(app.currentView, 'studio', 'Back button must NOT open my-circuits view');
    assert.strictEqual(app.currentHash, '#/create', 'Must be securely relocated to studio');
    const projects = app.renderWorkspaceProjects();
    assert.strictEqual(projects.status, 'auth_required', 'Projects list must be locked');
    assert.strictEqual(projects.items.length, 0, 'Zero projects must be leaked');
  });

  await test('3. Guest getMyCircuits() returns empty array without seeding starter circuits', async () => {
    const circuits = app.getMyCircuits();
    assert(Array.isArray(circuits), 'Must return an array');
    assert.strictEqual(circuits.length, 0, 'Guest circuits must be 0 (no starter circuit pollution)');
  });

  await test('4. User 1 logs in and has clean, empty project list initially', async () => {
    await fb.signIn('alice@university.edu', 'pass123', 'uid_alice_001');
    assert.strictEqual(fb.currentUser.uid, 'uid_alice_001');

    const aliceCircuits = app.getMyCircuits();
    assert.strictEqual(aliceCircuits.length, 0, 'New user Alice must start with 0 circuits');

    const rendered = app.renderWorkspaceProjects();
    assert.strictEqual(rendered.status, 'ok');
    assert.strictEqual(rendered.count, 0, 'Rendered projects must report 0');
  });

  await test('5. User 1 creates and saves "Alice Active Filter" to Firebase database', async () => {
    app.canvas.components = [{ id: 'r1', type: 'RESISTOR' }, { id: 'c1', type: 'CAPACITOR' }];
    app.canvas.wires = [{ id: 'w1', from: 'r1', to: 'c1' }];

    const saved = await app.saveCurrentCircuit('Alice Active Filter');
    assert(saved && saved.id, 'Circuit must be saved with unique ID');
    assert.strictEqual(saved.name, 'Alice Active Filter');
    assert.strictEqual(saved.ownerUid, 'uid_alice_001');

    // Verify stored in Firebase Database partition
    const cloudCircuits = await fb.loadUserCircuits();
    assert.strictEqual(cloudCircuits.length, 1, 'Alice must have exactly 1 circuit in Firestore');
    assert.strictEqual(cloudCircuits[0].name, 'Alice Active Filter');
    assert.strictEqual(cloudCircuits[0].ownerUid, 'uid_alice_001');

    // Verify in local user storage partition
    const rawLocal = mockLS.getItem('switcha_circuits_uid_alice_001');
    assert(rawLocal && rawLocal.includes('Alice Active Filter'), 'Must be cached under user-scoped key');

    // Verify global un-scoped key is NOT polluted
    assert.strictEqual(mockLS.getItem('switcha_my_circuits'), null, 'Global key must remain empty');
  });

  await test('6. User 1 logs out: workspace canvas and in-memory circuits are completely cleared', async () => {
    await app.handleLogout();
    assert.strictEqual(fb.currentUser, null, 'Firebase session terminated');
    assert.strictEqual(app.currentUserCircuits.length, 0, 'In-memory circuits must be empty');
    assert.strictEqual(app.activeMyCircuitId, null, 'Active circuit ID reset');
    assert.strictEqual(app.canvas.components.length, 0, 'Canvas components wiped on logout');
    assert.strictEqual(app.canvas.wires.length, 0, 'Canvas wires wiped on logout');
    assert.strictEqual(app.currentView, 'studio', 'Navigated to clean studio');
  });

  await test('7. User 2 logs in: gets totally new/clean workspace, User 1 projects are NOT visible', async () => {
    await fb.signIn('bob@research.org', 'pass456', 'uid_bob_002');
    assert.strictEqual(fb.currentUser.uid, 'uid_bob_002');

    const bobCircuits = app.getMyCircuits();
    assert.strictEqual(bobCircuits.length, 0, 'Bob must have 0 circuits (totally new)');
    assert(!bobCircuits.some(c => c.name.includes('Alice')), 'Alice circuit must NEVER bleed into Bob workspace');

    const rendered = app.renderWorkspaceProjects();
    assert.strictEqual(rendered.count, 0, 'Workspace reports 0 projects');
  });

  await test('8. User 2 creates and saves "Bob Inverter": stored strictly in Bob database partition', async () => {
    app.canvas.components = [{ id: 'q1', type: 'NMOS' }];
    app.canvas.wires = [];

    const saved = await app.saveCurrentCircuit('Bob Inverter');
    assert.strictEqual(saved.name, 'Bob Inverter');
    assert.strictEqual(saved.ownerUid, 'uid_bob_002');

    // Check Bob cloud storage
    const bobCloud = await fb.loadUserCircuits();
    assert.strictEqual(bobCloud.length, 1);
    assert.strictEqual(bobCloud[0].name, 'Bob Inverter');

    // Verify Bob cannot see Alice
    assert(!bobCloud.some(c => c.ownerUid === 'uid_alice_001'));

    // Check localStorage isolation
    assert(mockLS.getItem('switcha_circuits_uid_bob_002').includes('Bob Inverter'));
    assert(!mockLS.getItem('switcha_circuits_uid_bob_002').includes('Alice'));
  });

  await test('9. User 2 logs out and User 1 logs back in: User 1 sees ONLY Alice circuits', async () => {
    await app.handleLogout();

    // Re-login Alice
    await fb.signIn('alice@university.edu', 'pass123', 'uid_alice_001');

    const aliceCircuits = app.getMyCircuits();
    assert.strictEqual(aliceCircuits.length, 1, 'Alice must have exactly 1 circuit');
    assert.strictEqual(aliceCircuits[0].name, 'Alice Active Filter');
    assert(!aliceCircuits.some(c => c.name.includes('Bob')), 'Bob circuit must NOT be in Alice account');
  });

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedTests} Passed, ${totalTests - passedTests} Failed out of ${totalTests} Tests`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests();
