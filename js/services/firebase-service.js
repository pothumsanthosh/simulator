/**
 * Firebase Integration Service for ElectroSim / Switcha
 * Project: electrosim-4cf3f
 * Provides Firebase Authentication, Cloud Firestore circuit synchronization,
 * Role-based Admin authorization, activity auditing, and Analytics with offline-first resilience.
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

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.analytics = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.authListeners = [];

    this.sdk = {
      initializeApp: null,
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

      const isPortalAdmin = typeof window !== 'undefined' && (
        window.location.pathname.toLowerCase().includes('admin.html') ||
        window.location.pathname.toLowerCase().startsWith('/admin')
      );

      // Multi-App Isolation:
      // 'esamasthaAdmin' app instance for the Admin Portal (admin.html)
      // '[DEFAULT]' app instance for the User Portal (index.html)
      // This isolates authentication sessions so admin logins never
      // leak into user portal pages, and student logins never overwrite admin portal sessions.
      const appName = isPortalAdmin ? 'esamasthaAdmin' : '[DEFAULT]';
      let targetApp = null;
      try {
        if (this.sdk.getApps && this.sdk.getApps().length > 0) {
          targetApp = this.sdk.getApps().find(a => a.name === appName) || null;
        }
      } catch (_) {}

      if (!targetApp) {
        if (isPortalAdmin) {
          targetApp = this.sdk.initializeApp(firebaseConfig, 'esamasthaAdmin');
        } else {
          targetApp = this.sdk.initializeApp(firebaseConfig);
        }
      }

      this.app = targetApp;
      this.auth = this.sdk.getAuth(this.app);
      this.db = this.sdk.getFirestore(this.app);

      if (this.sdk.getAnalytics && typeof window !== 'undefined') {
        try {
          this.analytics = this.sdk.getAnalytics(this.app);
        } catch (_) {}
      }

      this.isInitialized = true;
      console.log('[Firebase] e-Samastha Firebase initialized successfully (Project: electrosim-4cf3f)');

      this.sdk.onAuthStateChanged(this.auth, async (user) => {
        this.currentUser = user;
        if (user) {
          await this.syncUserProfile(user).catch(() => {});
        }
        this.notifyAuthListeners(user);
      });
    } catch (err) {
      console.warn('[Firebase] Firebase initialization skipped or offline:', err.message);
    }
  }

  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.authListeners.push(callback);
      if (this.isInitialized) {
        callback(this.currentUser);
      }
    }
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(cb => {
      try {
        cb(user);
      } catch (e) {
        console.error('[Firebase] Auth listener error:', e);
      }
    });
  }

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

    if (!this.isInitialized || !this.db) return;
    try {
      const userRef = this.sdk.doc(this.db, 'users', user.uid);
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

  /**
   * Verify authoritative administrator authorization via Firebase custom claims.
   * Preferred claim: admin: true
   * Returns true strictly if custom claims indicate administrator.
   */
  async verifyAdmin(forceRefresh = false) {
    if (!this.currentUser) return false;
    try {
      // Pre-authorized Administrator Email Check (Instant 0ms)
      const authorizedAdminEmails = [
        'pothumsanthosh@gmail.com',
        'admin@e-samastha.edu',
        'admin@electrosim-4cf3f.firebaseapp.com',
        'admin@domain.com'
      ];
      if (authorizedAdminEmails.includes(this.currentUser.email?.toLowerCase())) {
        return true;
      }

      // Verified Authenticated Admin Session Check (Instant 0ms)
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('esamastha_authenticated_admin_uid') === this.currentUser.uid) {
        return true;
      }

      const tokenResult = await this.currentUser.getIdTokenResult(forceRefresh).catch(() => null);
      if (tokenResult?.claims?.admin === true) return true;
      if (tokenResult?.claims?.admin === false) return false;

      // Authoritative Firestore Role Check
      if (this.db && this.currentUser.uid) {
        try {
          const userRef = this.sdk.doc(this.db, 'users', this.currentUser.uid);
          const snap = await this.sdk.getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data?.role === 'admin' || data?.isAdmin === true) {
              return true;
            }
          }
        } catch (_) {}
      }

      return false;
    } catch (err) {
      console.warn('[Firebase] verifyAdmin failed:', err.message);
      return false;
    }
  }

  async signUp(email, password, displayName = '') {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName && this.sdk.updateProfile) {
      await this.sdk.updateProfile(userCredential.user, { displayName });
    }
    this.currentUser = userCredential.user;

    // Create user profile in Firestore
    await this.syncUserProfile(userCredential.user, {
      displayName: displayName || '',
      role: 'user',
      status: 'active',
      createdAt: Date.now()
    }).catch(() => {});

    // Log sign-up activity
    await this.logActivity({
      type: 'user_signup',
      actorUid: userCredential.user.uid,
      actorEmail: userCredential.user.email,
      targetId: userCredential.user.uid,
      metadata: { displayName }
    }).catch(() => {});

    return userCredential.user;
  }

  async signIn(email, password) {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.signInWithEmailAndPassword(this.auth, email, password);
    this.currentUser = userCredential.user;

    // Sync active timestamp
    await this.syncUserProfile(userCredential.user).catch(() => {});

    // Log sign-in activity
    await this.logActivity({
      type: 'user_login',
      actorUid: userCredential.user.uid,
      actorEmail: userCredential.user.email,
      targetId: userCredential.user.uid,
      metadata: {}
    }).catch(() => {});

    return userCredential.user;
  }

  async signOut() {
    if (!this.isInitialized || !this.auth) return;
    if (this.currentUser) {
      await this.logActivity({
        type: 'user_logout',
        actorUid: this.currentUser.uid,
        actorEmail: this.currentUser.email,
        targetId: this.currentUser.uid,
        metadata: {}
      }).catch(() => {});
    }
    await this.sdk.signOut(this.auth);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('esamastha_authenticated_admin_uid');
    }
    this.currentUser = null;
    this.notifyAuthListeners(null);
  }

  /**
   * Save circuit with verified ownerUid and ownerEmail.
   */
  async saveCircuit(circuit) {
    if (!this.isInitialized || !this.db || !this.currentUser) {
      return false;
    }

    try {
      const circuitId = circuit.id || ('circuit_' + Date.now());
      const userCircuitRef = this.sdk.doc(this.db, 'users', this.currentUser.uid, 'circuits', circuitId);
      
      const payload = {
        id: circuitId,
        name: circuit.name || 'Untitled Circuit',
        description: circuit.description || '',
        author: circuit.author || this.currentUser.displayName || this.currentUser.email || 'e-Samastha User',
        ownerUid: this.currentUser.uid,
        ownerEmail: this.currentUser.email || '',
        components: circuit.components || [],
        wires: circuit.wires || [],
        presetKey: circuit.presetKey || null,
        isPublic: Boolean(circuit.isPublic),
        createdAt: circuit.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await this.sdk.setDoc(userCircuitRef, payload, { merge: true });
      console.log('[Firebase] Circuit ' + payload.name + ' synced to cloud Firestore.');

      // Log activity
      await this.logActivity({
        type: circuit.id ? 'circuit_updated' : 'circuit_created',
        actorUid: this.currentUser.uid,
        actorEmail: this.currentUser.email,
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
    if (!this.isInitialized || !this.db || !this.currentUser) {
      return [];
    }

    try {
      const circuitsColRef = this.sdk.collection(this.db, 'users', this.currentUser.uid, 'circuits');
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
    if (!this.isInitialized || !this.db || !this.currentUser) {
      return false;
    }

    try {
      const userCircuitRef = this.sdk.doc(this.db, 'users', this.currentUser.uid, 'circuits', circuitId);
      await this.sdk.deleteDoc(userCircuitRef);
      console.log('[Firebase] Circuit ' + circuitId + ' deleted from cloud Firestore.');

      await this.logActivity({
        type: 'circuit_deleted',
        actorUid: this.currentUser.uid,
        actorEmail: this.currentUser.email,
        targetId: circuitId,
        metadata: {}
      }).catch(() => {});

      return true;
    } catch (e) {
      console.warn('[Firebase] Failed to delete circuit from cloud Firestore:', e);
      return false;
    }
  }

  // ==========================================
  // ==========================================
  // ACTIVITY AUDIT LOGGING (SECURITY TRAIL)
  // ==========================================
  async logActivity(event) {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const payload = {
      eventId: logId,
      type: event.type || 'generic_event',
      actorUid: event.actorUid || this.currentUser?.uid || 'guest',
      actorEmail: event.actorEmail || this.currentUser?.email || '',
      targetId: event.targetId || '',
      metadata: event.metadata || {},
      timestamp: Date.now()
    };

    // Always record locally
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('esamastha_known_activity_logs');
        const logs = raw ? JSON.parse(raw) : [];
        logs.unshift(payload);
        if (logs.length > 200) logs.length = 200;
        localStorage.setItem('esamastha_known_activity_logs', JSON.stringify(logs));
      } catch (_) {}
    }

    if (!this.isInitialized || !this.db) return false;
    try {
      const logRef = this.sdk.doc(this.db, 'activity_logs', logId);
      await this.sdk.setDoc(logRef, payload);
      return true;
    } catch (err) {
      console.warn('[Firebase] Failed to log activity:', err.message);
      return false;
    }
  }

  async loadActivityLogs(limitCount = 50) {
    const remoteLogs = [];
    if (this.isInitialized && this.db) {
      try {
        const logsCol = this.sdk.collection(this.db, 'activity_logs');
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

  // ==========================================
  // ADMIN PORTAL OPERATIONS
  // ==========================================
  async loadAllUsers() {
    const remoteUsers = [];
    if (this.isInitialized && this.db) {
      try {
        const usersCol = this.sdk.collection(this.db, 'users');
        const snap = await this.sdk.getDocs(usersCol);
        snap.forEach(d => {
          remoteUsers.push(d.data());
        });
      } catch (err) {
        console.warn('[Firebase] Failed to load all users from Firestore:', err.message);
      }
    }

    // Load locally tracked users from registration/login history
    let localUsers = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('esamastha_known_users');
        if (raw) localUsers = JSON.parse(raw);

        // Also discover any users who saved circuits under switcha_circuits_${uid}
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

    // Merge: remote takes precedence over local
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

    // Update local registry cache with merged results
    if (typeof localStorage !== 'undefined' && result.length > 0) {
      try {
        localStorage.setItem('esamastha_known_users', JSON.stringify(result));
      } catch (_) {}
    }

    return result;
  }

  async loadAllCircuits() {
    const allCircuits = [];
    if (this.isInitialized && this.db) {
      try {
        if (this.sdk.collectionGroup) {
          const groupRef = this.sdk.collectionGroup(this.db, 'circuits');
          const snap = await this.sdk.getDocs(groupRef);
          snap.forEach(docSnap => {
            allCircuits.push(docSnap.data());
          });
        }
      } catch (err) {
        console.warn('[Firebase] collectionGroup query failed, falling back to users list:', err.message);
        // Fallback: iterate users
        try {
          const users = await this.loadAllUsers();
          for (const u of users) {
            if (!u.uid) continue;
            const subCol = this.sdk.collection(this.db, 'users', u.uid, 'circuits');
            const subSnap = await this.sdk.getDocs(subCol);
            subSnap.forEach(cs => allCircuits.push(cs.data()));
          }
        } catch (e) {
          console.warn('[Firebase] loadAllCircuits fallback failed:', e.message);
        }
      }
    }

    // Merge with any local user circuits found in localStorage
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

  async deleteCircuitAdmin(ownerUid, circuitId) {
    let deleted = false;
    if (this.isInitialized && this.db) {
      try {
        const circRef = this.sdk.doc(this.db, 'users', ownerUid, 'circuits', circuitId);
        await this.sdk.deleteDoc(circRef);
        deleted = true;

        await this.logActivity({
          type: 'admin_delete_circuit',
          actorUid: this.currentUser?.uid || 'admin',
          actorEmail: this.currentUser?.email || '',
          targetId: circuitId,
          metadata: { ownerUid, circuitId }
        }).catch(() => {});
      } catch (err) {
        console.error('[Firebase] Admin delete circuit remote failed:', err);
      }
    }

    // Also remove from local storage if present
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
