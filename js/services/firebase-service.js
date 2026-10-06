/**
 * Firebase Integration Service for ElectroSim / Switcha
 * Project: electrosim-4cf3f
 * Architecture: Isolated Dual-Context Authentication Engine
 * - UserAuthContext: Operates on dedicated User Firebase App ('[DEFAULT]')
 * - AdminAuthContext: Operates on dedicated Admin Firebase App ('esamasthaAdmin')
 * Strictly eliminates shared authentication state, token bleeding, and cross-tab overwrites.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDLXBrm_JMP_G1Rkm46cbp88Sqf5oEKWfg",
  authDomain: "electrosim-4cf3f.firebaseapp.com",
  projectId: "electrosim-4cf3f",
  storageBucket: "electrosim-4cf3f.firebasestorage.app",
  messagingSenderId: "868208518205",
  appId: "1:868208518205:web:800bd90fdf455227ba7654",
  measurementId: "G-G3BRPKB6SY"
};

/**
 * Isolated User Authentication Context
 * Manages regular student / educator sessions, project persistence, and user Firestore actions.
 */
export class UserAuthContext {
  constructor(service) {
    this.service = service;
    this.currentUser = null;
    this.isInitialized = false;
    this.listeners = [];
  }

  get auth() {
    return this.service.userAuth;
  }

  get db() {
    return this.service.userDb;
  }

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      if (this.isInitialized) {
        callback(this.currentUser);
      }
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(user) {
    this.currentUser = user;
    this.isInitialized = true;
    this.listeners.forEach(cb => {
      try { cb(user); } catch (e) { console.error('[UserAuthContext] listener error:', e); }
    });
  }

  async signIn(email, password) {
    return this.service.signInUser(email, password);
  }

  async signUp(email, password, displayName = '') {
    return this.service.signUpUser(email, password, displayName);
  }

  async signOut() {
    return this.service.signOutUser();
  }
}

/**
 * Isolated Admin Authentication Context
 * Manages elevated administrator credentials, custom claims, and admin Firestore audit / console operations.
 */
export class AdminAuthContext {
  constructor(service) {
    this.service = service;
    this.currentUser = null;
    this.isInitialized = false;
    this.listeners = [];
  }

  get auth() {
    return this.service.adminAuth;
  }

  get db() {
    return this.service.adminDb;
  }

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      if (this.isInitialized) {
        callback(this.currentUser);
      }
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(user) {
    this.currentUser = user;
    this.isInitialized = true;
    this.listeners.forEach(cb => {
      try { cb(user); } catch (e) { console.error('[AdminAuthContext] listener error:', e); }
    });
  }

  async signIn(email, password) {
    return this.service.signInAdmin(email, password);
  }

  async signOut() {
    return this.service.signOutAdmin();
  }

  async verifyAdmin(forceRefresh = false) {
    return this.service.verifyAdmin(forceRefresh);
  }
}

class FirebaseService {
  constructor() {
    this.isInitialized = false;

    // Dual-Context Instances
    this.userApp = null;
    this.userAuth = null;
    this.userDb = null;
    this.userContext = new UserAuthContext(this);

    this.adminApp = null;
    this.adminAuth = null;
    this.adminDb = null;
    this.adminContext = new AdminAuthContext(this);

    this.analytics = null;

    this.sdk = {
      initializeApp: null,
      getApp: null,
      getApps: null,
      getAuth: null,
      signInWithEmailAndPassword: null,
      createUserWithEmailAndPassword: null,
      signOut: null,
      onAuthStateChanged: null,
      updateProfile: null,
      getFirestore: null,
      collection: null,
      collectionGroup: null,
      doc: null,
      setDoc: null,
      getDoc: null,
      getDocs: null,
      deleteDoc: null,
      query: null,
      orderBy: null,
      limit: null,
      where: null,
      getAnalytics: null
    };

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // --- Convenience Getters & Setters for Backward Compatibility ---
  get app() { return this.userApp; }
  get auth() { return this.userAuth; }
  get db() { return this.userDb; }
  get currentUser() { return this.userContext.currentUser; }
  set currentUser(val) { this.userContext.currentUser = val; }
  get adminUser() { return this.adminContext.currentUser; }
  set adminUser(val) { this.adminContext.currentUser = val; }

  async init() {
    try {
      const [appMod, authMod, firestoreMod, analyticsMod] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js').catch(() => null)
      ]);

      this.sdk.initializeApp = appMod.initializeApp;
      this.sdk.getApp = appMod.getApp;
      this.sdk.getApps = appMod.getApps;
      this.sdk.getAuth = authMod.getAuth;
      this.sdk.signInWithEmailAndPassword = authMod.signInWithEmailAndPassword;
      this.sdk.createUserWithEmailAndPassword = authMod.createUserWithEmailAndPassword;
      this.sdk.signOut = authMod.signOut;
      this.sdk.onAuthStateChanged = authMod.onAuthStateChanged;
      this.sdk.updateProfile = authMod.updateProfile;

      this.sdk.getFirestore = firestoreMod.getFirestore;
      this.sdk.collection = firestoreMod.collection;
      this.sdk.collectionGroup = firestoreMod.collectionGroup;
      this.sdk.doc = firestoreMod.doc;
      this.sdk.setDoc = firestoreMod.setDoc;
      this.sdk.getDoc = firestoreMod.getDoc;
      this.sdk.getDocs = firestoreMod.getDocs;
      this.sdk.deleteDoc = firestoreMod.deleteDoc;
      this.sdk.query = firestoreMod.query;
      this.sdk.orderBy = firestoreMod.orderBy;
      this.sdk.limit = firestoreMod.limit;
      this.sdk.where = firestoreMod.where;

      if (analyticsMod) {
        this.sdk.getAnalytics = analyticsMod.getAnalytics;
      }

      // Initialize Dual App Instances with Partitioned Storage
      // 1. User App ('[DEFAULT]')
      // 2. Admin App ('esamasthaAdmin')
      const existingApps = this.sdk.getApps ? this.sdk.getApps() : [];
      let targetUserApp = existingApps.find(a => a.name === '[DEFAULT]') || null;
      let targetAdminApp = existingApps.find(a => a.name === 'esamasthaAdmin') || null;

      if (!targetUserApp) {
        targetUserApp = this.sdk.initializeApp(firebaseConfig);
      }
      if (!targetAdminApp) {
        targetAdminApp = this.sdk.initializeApp(firebaseConfig, 'esamasthaAdmin');
      }

      this.userApp = targetUserApp;
      this.userAuth = this.sdk.getAuth(this.userApp);
      this.userDb = this.sdk.getFirestore(this.userApp);

      this.adminApp = targetAdminApp;
      this.adminAuth = this.sdk.getAuth(this.adminApp);
      this.adminDb = this.sdk.getFirestore(this.adminApp);

      if (this.sdk.getAnalytics && typeof window !== 'undefined') {
        try {
          this.analytics = this.sdk.getAnalytics(this.userApp);
        } catch (_) {}
      }

      this.isInitialized = true;
      console.log('[Firebase] e-Samastha Dual-Context Auth initialized (Project: electrosim-4cf3f)');

      // User Context Auth Listener
      this.sdk.onAuthStateChanged(this.userAuth, async (user) => {
        this.userContext.notify(user);
        if (user) {
          await this.syncUserProfile(user).catch(() => {});
        }
      });

      // Admin Context Auth Listener
      this.sdk.onAuthStateChanged(this.adminAuth, async (adminUser) => {
        this.adminContext.notify(adminUser);
      });
    } catch (err) {
      console.warn('[Firebase] Firebase initialization skipped or offline:', err.message);
    }
  }

  // --- User Auth Delegation ---
  onUserAuthStateChange(callback) {
    return this.userContext.onAuthStateChanged(callback);
  }

  // Backward compatibility alias
  onAuthStateChange(callback) {
    return this.userContext.onAuthStateChanged(callback);
  }

  notifyAuthListeners(user) {
    this.userContext.notify(user);
  }

  async signInUser(email, password) {
    if (!this.isInitialized || !this.userAuth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.signInWithEmailAndPassword(this.userAuth, email, password);
    this.userContext.notify(userCredential.user);

    await this.syncUserProfile(userCredential.user).catch(() => {});
    await this.logActivity({
      type: 'user_login',
      actorUid: userCredential.user.uid,
      actorEmail: userCredential.user.email,
      targetId: userCredential.user.uid,
      metadata: {}
    }).catch(() => {});

    return userCredential.user;
  }

  async signUpUser(email, password, displayName = '') {
    if (!this.isInitialized || !this.userAuth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.createUserWithEmailAndPassword(this.userAuth, email, password);
    if (displayName && this.sdk.updateProfile) {
      await this.sdk.updateProfile(userCredential.user, { displayName });
    }
    this.userContext.notify(userCredential.user);

    await this.syncUserProfile(userCredential.user, {
      displayName: displayName || '',
      role: 'user',
      status: 'active',
      createdAt: Date.now()
    }).catch(() => {});

    await this.logActivity({
      type: 'user_signup',
      actorUid: userCredential.user.uid,
      actorEmail: userCredential.user.email,
      targetId: userCredential.user.uid,
      metadata: { displayName }
    }).catch(() => {});

    return userCredential.user;
  }

  async signOutUser() {
    if (!this.isInitialized || !this.userAuth) return;
    const user = this.userContext.currentUser;
    if (user) {
      await this.logActivity({
        type: 'user_logout',
        actorUid: user.uid,
        actorEmail: user.email,
        targetId: user.uid,
        metadata: {}
      }).catch(() => {});
    }
    await this.sdk.signOut(this.userAuth);
    this.userContext.notify(null);
  }

  // Backward compatibility alias for user operations
  async signIn(email, password) {
    return this.signInUser(email, password);
  }

  async signUp(email, password, displayName = '') {
    return this.signUpUser(email, password, displayName);
  }

  async signOut() {
    return this.signOutUser();
  }

  // --- Admin Auth Operations ---
  onAdminAuthStateChange(callback) {
    return this.adminContext.onAuthStateChanged(callback);
  }

  async signInAdmin(email, password) {
    if (!this.isInitialized || !this.adminAuth) {
      throw new Error('Firebase Admin Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.signInWithEmailAndPassword(this.adminAuth, email, password);
    this.adminContext.notify(userCredential.user);

    // Two-Layered Security: Authoritative verification of admin privileges
    const isAdmin = await this.verifyAdmin(true);
    if (!isAdmin) {
      await this.sdk.signOut(this.adminAuth);
      this.adminContext.notify(null);
      throw new Error('Access Denied: This account does not possess administrator privileges ({ admin: true } claim missing).');
    }

    await this.syncUserProfile(userCredential.user, {
      role: 'admin',
      isAdmin: true,
      adminAuthenticatedAt: Date.now()
    }).catch(() => {});

    await this.logActivity({
      type: 'admin_login',
      actorUid: userCredential.user.uid,
      actorEmail: userCredential.user.email,
      targetId: userCredential.user.uid,
      metadata: {}
    }).catch(() => {});

    return userCredential.user;
  }

  async signOutAdmin() {
    if (!this.isInitialized || !this.adminAuth) return;
    const adminUser = this.adminContext.currentUser;
    if (adminUser) {
      await this.logActivity({
        type: 'admin_logout',
        actorUid: adminUser.uid,
        actorEmail: adminUser.email,
        targetId: adminUser.uid,
        metadata: {}
      }).catch(() => {});
    }
    await this.sdk.signOut(this.adminAuth);
    this.adminContext.notify(null);
  }

  /**
   * Verify authoritative administrator authorization via Firebase custom claims.
   * Model: Firebase Authentication -> Authenticated identity -> Admin claim ({ admin: true })
   */
  async verifyAdmin(forceRefresh = false) {
    const user = this.adminContext.currentUser || this.adminAuth?.currentUser;
    if (!user) return false;

    try {
      // 1. Authoritative Firebase ID token custom claim verification
      const tokenResult = typeof user.getIdTokenResult === 'function' ? await user.getIdTokenResult(forceRefresh).catch(() => null) : null;
      if (tokenResult?.claims?.admin === true) return true;
      if (tokenResult?.claims?.admin === false) return false;

      // 2. Pre-authorized admin email check
      const authorizedAdminEmails = [
        'pothumsanthosh@gmail.com',
        'admin@e-samastha.edu',
        'admin@electrosim-4cf3f.firebaseapp.com',
        'admin@domain.com'
      ];
      if (authorizedAdminEmails.includes(user.email?.toLowerCase())) {
        return true;
      }

      // 3. Authoritative Firestore role check
      if (this.adminDb && user.uid) {
        const userRef = this.sdk.doc(this.adminDb, 'users', user.uid);
        const snap = await this.sdk.getDoc(userRef).catch(() => null);
        if (snap && snap.exists()) {
          const data = snap.data();
          if (data?.role === 'admin' || data?.isAdmin === true) {
            return true;
          }
        }
      }

      return false;
    } catch (err) {
      console.warn('[Firebase] verifyAdmin failed:', err.message);
      return false;
    }
  }

  // --- User Profiles and Registries ---
  recordLocalUser(user, extra = {}) {
    if (!user || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('esamastha_known_users');
      const users = raw ? JSON.parse(raw) : [];
      const email = user.email || '';
      const uid = user.uid || '';
      const isKnownAdmin = [
        'pothumsanthosh@gmail.com',
        'admin@e-samastha.edu',
        'admin@electrosim-4cf3f.firebaseapp.com',
        'admin@domain.com'
      ].includes(email.toLowerCase());

      const userData = {
        uid,
        email,
        displayName: user.displayName || extra.displayName || (email ? email.split('@')[0] : 'User'),
        role: extra.role || (isKnownAdmin ? 'admin' : 'user'),
        status: extra.status || 'active',
        createdAt: extra.createdAt || Date.now(),
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
        ...extra
      };

      const existingIndex = users.findIndex(u => (uid && u.uid === uid) || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...userData, lastActiveAt: Date.now() };
      } else {
        users.push(userData);
      }
      localStorage.setItem('esamastha_known_users', JSON.stringify(users));
    } catch (e) {
      console.warn('[Firebase] Failed to write local user registry:', e);
    }
  }

  async syncUserProfile(user, extra = {}) {
    if (!user) return;
    this.recordLocalUser(user, extra);

    const db = this.userDb || this.db;
    if (!this.isInitialized || !db) return;
    try {
      const userRef = this.sdk.doc(db, 'users', user.uid);
      const isKnownAdmin = [
        'pothumsanthosh@gmail.com',
        'admin@e-samastha.edu',
        'admin@electrosim-4cf3f.firebaseapp.com',
        'admin@domain.com'
      ].includes((user.email || '').toLowerCase());

      const payload = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || extra.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        role: extra.role || (isKnownAdmin ? 'admin' : 'user'),
        status: extra.status || 'active',
        createdAt: extra.createdAt || Date.now(),
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
        ...extra
      };
      await this.sdk.setDoc(userRef, payload, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Could not sync user profile to Firestore:', e.message);
    }
  }

  // --- User Circuit Operations (Scoped strictly to User Context) ---
  async saveCircuit(circuit) {
    const user = this.userContext.currentUser;
    const db = this.userDb || this.db;
    if (!this.isInitialized || !db || !user) {
      return false;
    }

    try {
      const circuitId = circuit.id || ('circuit_' + Date.now());
      const userCircuitRef = this.sdk.doc(db, 'users', user.uid, 'circuits', circuitId);

      const payload = {
        id: circuitId,
        name: circuit.name || 'Untitled Circuit',
        description: circuit.description || '',
        author: circuit.author || user.displayName || user.email || 'e-Samastha User',
        ownerUid: user.uid,
        ownerEmail: user.email || '',
        components: circuit.components || [],
        wires: circuit.wires || [],
        presetKey: circuit.presetKey || null,
        isPublic: Boolean(circuit.isPublic),
        createdAt: circuit.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await this.sdk.setDoc(userCircuitRef, payload, { merge: true });
      console.log('[Firebase] Circuit ' + payload.name + ' synced to cloud Firestore.');

      await this.logActivity({
        type: circuit.id ? 'circuit_updated' : 'circuit_created',
        actorUid: user.uid,
        actorEmail: user.email,
        targetId: circuitId,
        metadata: { circuitName: payload.name, componentCount: payload.components.length }
      }).catch(() => {});

      return true;
    } catch (e) {
      console.warn('[Firebase] Failed to save circuit to cloud Firestore:', e);
      return false;
    }
  }

  async loadUserCircuits() {
    const user = this.userContext.currentUser;
    const db = this.userDb || this.db;
    if (!this.isInitialized || !db || !user) {
      return [];
    }

    try {
      const circuitsColRef = this.sdk.collection(db, 'users', user.uid, 'circuits');
      const snapshot = await this.sdk.getDocs(circuitsColRef);
      const circuits = [];
      snapshot.forEach(docSnap => {
        circuits.push(docSnap.data());
      });
      console.log('[Firebase] Loaded ' + circuits.length + ' circuits from cloud Firestore.');
      return circuits;
    } catch (e) {
      console.warn('[Firebase] Failed to fetch circuits from cloud Firestore:', e);
      return [];
    }
  }

  async deleteCircuit(circuitId) {
    const user = this.userContext.currentUser;
    const db = this.userDb || this.db;
    if (!this.isInitialized || !db || !user) {
      return false;
    }

    try {
      const userCircuitRef = this.sdk.doc(db, 'users', user.uid, 'circuits', circuitId);
      await this.sdk.deleteDoc(userCircuitRef);
      console.log('[Firebase] Circuit ' + circuitId + ' deleted from cloud Firestore.');

      await this.logActivity({
        type: 'circuit_deleted',
        actorUid: user.uid,
        actorEmail: user.email,
        targetId: circuitId,
        metadata: {}
      }).catch(() => {});

      return true;
    } catch (e) {
      console.warn('[Firebase] Failed to delete circuit from cloud Firestore:', e);
      return false;
    }
  }

  // --- Activity Audit Logging ---
  async logActivity(event) {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const currentUser = this.adminContext.currentUser || this.userContext.currentUser;
    const payload = {
      eventId: logId,
      type: event.type || 'generic_event',
      actorUid: event.actorUid || currentUser?.uid || 'guest',
      actorEmail: event.actorEmail || currentUser?.email || '',
      targetId: event.targetId || '',
      metadata: event.metadata || {},
      timestamp: Date.now()
    };

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('esamastha_known_activity_logs');
        const logs = raw ? JSON.parse(raw) : [];
        logs.unshift(payload);
        if (logs.length > 200) logs.length = 200;
        localStorage.setItem('esamastha_known_activity_logs', JSON.stringify(logs));
      } catch (_) {}
    }

    const db = this.adminDb || this.userDb || this.db;
    if (!this.isInitialized || !db) return false;
    try {
      const logRef = this.sdk.doc(db, 'activity_logs', logId);
      await this.sdk.setDoc(logRef, payload);
      return true;
    } catch (err) {
      console.warn('[Firebase] Failed to log activity:', err.message);
      return false;
    }
  }

  async loadActivityLogs(limitCount = 50) {
    const remoteLogs = [];
    const db = this.adminDb || this.db;
    if (this.isInitialized && db) {
      try {
        const logsCol = this.sdk.collection(db, 'activity_logs');
        let q = logsCol;
        if (this.sdk.query && this.sdk.orderBy && this.sdk.limit) {
          q = this.sdk.query(logsCol, this.sdk.orderBy('timestamp', 'desc'), this.sdk.limit(limitCount));
        }
        const snap = await this.sdk.getDocs(q);
        snap.forEach(d => remoteLogs.push(d.data()));
      } catch (err) {
        console.warn('[Firebase] Failed to load activity logs:', err.message);
      }
    }

    let localLogs = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('esamastha_known_activity_logs');
        if (raw) localLogs = JSON.parse(raw);
      } catch (_) {}
    }

    const merged = new Map();
    localLogs.forEach(l => {
      const key = l.eventId || `${l.timestamp}_${l.type}`;
      merged.set(key, l);
    });
    remoteLogs.forEach(l => {
      const key = l.eventId || `${l.timestamp}_${l.type}`;
      merged.set(key, l);
    });

    const result = Array.from(merged.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limitCount);
    return result;
  }

  // --- Admin Portal Operations (Scoped strictly to Admin Context & Admin DB) ---
  async loadAllUsers() {
    const remoteUsers = [];
    const db = this.adminDb || this.db;
    if (this.isInitialized && db) {
      try {
        const usersCol = this.sdk.collection(db, 'users');
        const snap = await this.sdk.getDocs(usersCol);
        snap.forEach(d => {
          remoteUsers.push(d.data());
        });
      } catch (err) {
        console.warn('[Firebase] Failed to load all users from Firestore:', err.message);
      }
    }

    let localUsers = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('esamastha_known_users');
        if (raw) localUsers = JSON.parse(raw);

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('switcha_circuits_')) {
            const uid = key.replace('switcha_circuits_', '');
            if (uid && !localUsers.some(u => u.uid === uid) && !remoteUsers.some(u => u.uid === uid)) {
              localUsers.push({
                uid,
                email: `${uid.slice(0, 8)}@student.esamastha`,
                displayName: `Student (${uid.slice(0, 6)})`,
                role: 'user',
                status: 'active',
                createdAt: Date.now(),
                lastActiveAt: Date.now()
              });
            }
          }
        }
      } catch (_) {}
    }

    const merged = new Map();
    localUsers.forEach(u => {
      const key = u.uid || u.email;
      if (key) merged.set(key, u);
    });
    remoteUsers.forEach(u => {
      const key = u.uid || u.email;
      if (key) merged.set(key, u);
    });

    const result = Array.from(merged.values());

    if (typeof localStorage !== 'undefined' && result.length > 0) {
      try {
        localStorage.setItem('esamastha_known_users', JSON.stringify(result));
      } catch (_) {}
    }

    return result;
  }

  async loadAllCircuits() {
    const allCircuits = [];
    const db = this.adminDb || this.db;
    if (this.isInitialized && db) {
      try {
        if (this.sdk.collectionGroup) {
          const groupRef = this.sdk.collectionGroup(db, 'circuits');
          const snap = await this.sdk.getDocs(groupRef);
          snap.forEach(docSnap => {
            allCircuits.push(docSnap.data());
          });
        }
      } catch (err) {
        console.warn('[Firebase] collectionGroup query failed, falling back to users list:', err.message);
        try {
          const users = await this.loadAllUsers();
          for (const u of users) {
            if (!u.uid) continue;
            const subCol = this.sdk.collection(db, 'users', u.uid, 'circuits');
            const subSnap = await this.sdk.getDocs(subCol);
            subSnap.forEach(cs => allCircuits.push(cs.data()));
          }
        } catch (e) {
          console.warn('[Firebase] loadAllCircuits fallback failed:', e.message);
        }
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('switcha_circuits_')) {
            const ownerUid = key.replace('switcha_circuits_', '');
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach(c => {
                  if (c && c.id && !allCircuits.some(existing => existing.id === c.id)) {
                    allCircuits.push({ ...c, ownerUid: c.ownerUid || ownerUid });
                  }
                });
              }
            }
          }
        }
      } catch (_) {}
    }

    return allCircuits;
  }

  async getCircuitAdmin(ownerUid, circuitId) {
    if (!circuitId) return null;

    const db = this.adminDb || this.userDb || this.db;

    // 1. Try Firestore direct doc lookup if ownerUid is available
    if (this.isInitialized && db && ownerUid) {
      try {
        const docRef = this.sdk.doc(db, 'users', ownerUid, 'circuits', circuitId);
        const snap = await this.sdk.getDoc(docRef);
        if (snap && snap.exists()) {
          return { id: circuitId, ...snap.data() };
        }
      } catch (err) {
        console.warn('[Firebase] Direct getCircuitAdmin lookup failed:', err.message);
      }
    }

    // 2. Try Firestore collectionGroup search if ownerUid was not provided or doc lookup failed
    if (this.isInitialized && db && this.sdk.collectionGroup) {
      try {
        const groupRef = this.sdk.collectionGroup(db, 'circuits');
        const snap = await this.sdk.getDocs(groupRef);
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (data && (data.id === circuitId || docSnap.id === circuitId)) {
            return { id: circuitId, ...data };
          }
        }
      } catch (err) {
        console.warn('[Firebase] collectionGroup getCircuitAdmin query failed:', err.message);
      }
    }

    // 3. Try localStorage for ownerUid
    if (typeof localStorage !== 'undefined') {
      try {
        if (ownerUid) {
          const raw = localStorage.getItem(`switcha_circuits_${ownerUid}`);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const found = list.find(c => c && (c.id === circuitId || String(c.id) === String(circuitId)));
              if (found) return found;
            }
          }
        }

        // 4. Try scanning all localStorage switcha_circuits_* keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('switcha_circuits_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const found = list.find(c => c && (c.id === circuitId || String(c.id) === String(circuitId)));
                if (found) return found;
              }
            }
          }
        }
      } catch (_) {}
    }

    // 5. Try SwitchaStorage (IndexedDB)
    if (typeof window !== 'undefined' && window.SwitchaStorage && typeof window.SwitchaStorage.getCircuit === 'function') {
      try {
        const found = await window.SwitchaStorage.getCircuit(circuitId);
        if (found) return found;
      } catch (_) {}
    }

    return null;
  }

  async deleteCircuitAdmin(ownerUid, circuitId) {
    let deleted = false;
    const db = this.adminDb || this.db;
    const adminUser = this.adminContext.currentUser;
    if (this.isInitialized && db) {
      try {
        const circRef = this.sdk.doc(db, 'users', ownerUid, 'circuits', circuitId);
        await this.sdk.deleteDoc(circRef);
        deleted = true;

        await this.logActivity({
          type: 'admin_delete_circuit',
          actorUid: adminUser?.uid || 'admin',
          actorEmail: adminUser?.email || '',
          targetId: circuitId,
          metadata: { ownerUid, circuitId }
        }).catch(() => {});
      } catch (err) {
        console.error('[Firebase] Admin delete circuit remote failed:', err);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const key = `switcha_circuits_${ownerUid}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(c => c.id !== circuitId);
            localStorage.setItem(key, JSON.stringify(filtered));
            deleted = true;
          }
        }
      } catch (_) {}
    }

    return deleted;
  }
}

export const firebaseService = new FirebaseService();
