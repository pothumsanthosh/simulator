/**
 * Firebase Integration Service for ElectroSim / Switcha
 * Project: electrosim-4cf3f
 * Provides Firebase Authentication, Cloud Firestore circuit synchronization,
 * and Analytics with offline-first resilience.
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
      doc: null,
      setDoc: null,
      getDoc: null,
      getDocs: null,
      deleteDoc: null,
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
      this.sdk.getAuth = authMod.getAuth;
      this.sdk.signInWithEmailAndPassword = authMod.signInWithEmailAndPassword;
      this.sdk.createUserWithEmailAndPassword = authMod.createUserWithEmailAndPassword;
      this.sdk.signOut = authMod.signOut;
      this.sdk.onAuthStateChanged = authMod.onAuthStateChanged;
      this.sdk.updateProfile = authMod.updateProfile;

      this.sdk.getFirestore = firestoreMod.getFirestore;
      this.sdk.collection = firestoreMod.collection;
      this.sdk.doc = firestoreMod.doc;
      this.sdk.setDoc = firestoreMod.setDoc;
      this.sdk.getDoc = firestoreMod.getDoc;
      this.sdk.getDocs = firestoreMod.getDocs;
      this.sdk.deleteDoc = firestoreMod.deleteDoc;

      if (analyticsMod) {
        this.sdk.getAnalytics = analyticsMod.getAnalytics;
      }

      this.app = this.sdk.initializeApp(firebaseConfig);
      this.auth = this.sdk.getAuth(this.app);
      this.db = this.sdk.getFirestore(this.app);

      if (this.sdk.getAnalytics && typeof window !== 'undefined') {
        try {
          this.analytics = this.sdk.getAnalytics(this.app);
        } catch (_) {}
      }

      this.isInitialized = true;
      console.log('[Firebase] ElectroSim Firebase initialized successfully (Project: electrosim-4cf3f)');

      this.sdk.onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
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

  async signUp(email, password, displayName = '') {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName && this.sdk.updateProfile) {
      await this.sdk.updateProfile(userCredential.user, { displayName });
    }
    this.currentUser = userCredential.user;
    return userCredential.user;
  }

  async signIn(email, password) {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase Auth is not available. Please check your internet connection.');
    }
    const userCredential = await this.sdk.signInWithEmailAndPassword(this.auth, email, password);
    this.currentUser = userCredential.user;
    return userCredential.user;
  }

  async signOut() {
    if (!this.isInitialized || !this.auth) return;
    await this.sdk.signOut(this.auth);
    this.currentUser = null;
  }

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
        author: circuit.author || this.currentUser.displayName || this.currentUser.email || 'ElectroSim User',
        components: circuit.components || [],
        wires: circuit.wires || [],
        presetKey: circuit.presetKey || null,
        updatedAt: Date.now()
      };

      await this.sdk.setDoc(userCircuitRef, payload, { merge: true });
      console.log('[Firebase] Circuit ' + payload.name + ' synced to cloud Firestore.');
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
      return true;
    } catch (e) {
      console.warn('[Firebase] Failed to delete circuit from cloud Firestore:', e);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
