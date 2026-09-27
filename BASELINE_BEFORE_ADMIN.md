# Switcha 2.0 — Baseline Snapshot Before Admin Portal Implementation

**Timestamp**: 2026-09-24T14:35:00+05:30  
**Baseline Source of Truth**: [https://electrosim-4cf3f.web.app/#/create](https://electrosim-4cf3f.web.app/#/create)

---

## 1. Git Repository State

- **Current Commit Hash**: `ba08dd592b429583c70a58010a5e3164ac40427e`
- **Short Hash**: `ba08dd5`
- **Branch**: `fix/phase1-phase2-platform`
- **Commit Date**: 2026-09-16 10:01:33 +0530
- **Author**: Pothum Santhosh <pothumsanthosh@users.noreply.github.com>
- **Subject**: `fix: resolve opamp relaxation latch-up, bjt astable symmetry breaking, and colpitts rf startup`
- **Working Tree Status**: Clean (`nothing to commit, working tree clean`)
- **Remote Origin**: `https://github.com/pothumsanthosh/simulator.git`

---

## 2. Tracked File Inventory (52 Files)

```text
.firebase/hosting..cache
.firebaserc
.gitignore
COMPONENT_VERIFICATION_MATRIX.md
ELECTROSIM_ERROR_AUDIT.md
FORENSIC_100_BUG_AUDIT.md
FORENSIC_QA_REPORT.md
REAL_WORLD_ADVERSARIAL_VALIDATION_REPORT.md
REAL_WORLD_BUG_ELIMINATION_REPORT.md
REAL_WORLD_BUG_REPORT.md
REAL_WORLD_FUNCTIONAL_VALIDATION.md
capacitor.config.json
css/simulator.css
css/style.css
firebase.json
icons/icon.svg
index.html
js/app.js
js/blocks/block-canvas.js
js/blocks/block-engine.js
js/blocks/block-library.js
js/blocks/block-scope.js
js/blocks/block-types.js
js/code/code-editor.js
js/code/code-engine.js
js/code/code-plotter.js
js/editor/circuit-library.js
js/editor/grapher.js
js/editor/instruments.js
js/editor/schematic-canvas.js
js/engine/circuit-engine.js
js/engine/circuit-model.js
js/engine/components.js
js/services/firebase-service.js
js/services/storage-service.js
manifest.json
package.json
server.js
sw.js
test/adversarial_human_workflow_suite.js
test/audit.js
test/blocks_engine_suite.js
test/code_engine_suite.js
test/forensic_suite.js
test/mathworks_deep_suite.js
test/oscillator_validation_suite.js
test/real_world_qa_suite.js
test/rigorous_oscillator_suite.js
test/storage_isolation_suite.js
test/suite.js
test/switcha_features_test.js
walkthrough.md
```

### Untracked Files
None (working directory is 100% clean).

---

## 3. Package & Dependency Versions

`package.json`:
- **Package Name**: `electrosim`
- **Version**: `1.0.0`
- **Description**: `ElectroSim / Switcha - Advanced Circuit Simulator`
- **Type**: `module` (Native ES Modules in modern browsers and Node 18+)
- **Scripts**:
  - `"test": "node test/suite.js"`
  - `"deploy": "firebase deploy --only hosting"`
- **Dependencies**: 0 external npm runtime dependencies (Pure zero-dependency browser ES modules + Firebase CDN `https://www.gstatic.com/firebasejs/10.8.0/`).

---

## 4. Protected Circuit Engine Files & SHA-256 Hashes

The 6 protected circuit simulator core files and their verified SHA-256 hashes:

| File Path | Verified SHA-256 Hash | Status |
| :--- | :--- | :--- |
| `js/engine/circuit-engine.js` | `80fab4167d8622f41c59f5200c0e872e2b9eb84359299164415129c3ad8174f2` | Verified Exact Match |
| `js/engine/components.js` | `2dd3a84ee68214613afa659c08f0c484554062591bc41fb0ada8dfc607d0cdfa` | Verified Exact Match |
| `js/engine/circuit-model.js` | `997a02d15adf3bfaba3d5278d0baf9ed0f7cf2a3499aaed77429a359f25f3b03` | Verified Exact Match |
| `js/editor/instruments.js` | `20eb6dcac700a5811f146315c47054d86302debd2f394f6f090249ec99670eff` | Verified Exact Match |
| `js/editor/grapher.js` | `78344c873f6f56e43cd8bc2fbc630a073eb8f24df381ec2829909f6c2c16c7ef` | Verified Exact Match |
| `js/editor/schematic-canvas.js` | `3f85a9ad9c31f3b0112f90b1a7295fa1925eeb9f5f79bce2eb333ce4f121d5e5` | Verified Exact Match |

**Result**: 6 / 6 Protected Files Verified Unchanged.

---

## 5. Firebase Configuration & Architecture

- **Project ID**: `electrosim-4cf3f`
- **Auth Domain**: `electrosim-4cf3f.firebaseapp.com`
- **Storage Bucket**: `electrosim-4cf3f.firebasestorage.app`
- **App ID**: `1:868208518205:web:800bd90fdf455227ba7654`
- **Measurement ID**: `G-G3BRPKB6SY`
- **Hosting URL**: `https://electrosim-4cf3f.web.app`

### Firebase Hosting Configuration (`firebase.json`)
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      ".firebaserc",
      "**/.*",
      "**/.git/**",
      "**/node_modules/**",
      "server.js",
      "test/**",
      "*.md",
      "**/*.md"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## 6. Existing Authentication Logic (`js/services/firebase-service.js`)

- Dynamic lazy load of modular Firebase SDK v10.8.0 from CDN:
  - `firebase-app.js`
  - `firebase-auth.js`
  - `firebase-firestore.js`
  - `firebase-analytics.js`
- Core Auth Methods:
  - `signUp(email, password, displayName)`: uses `createUserWithEmailAndPassword`, sets profile displayName.
  - `signIn(email, password)`: uses `signInWithEmailAndPassword`.
  - `signOut()`: signs out current user.
  - `onAuthStateChange(callback)`: subscribes listener to `onAuthStateChanged`.

---

## 7. Existing Firestore Database Structure

The baseline Firestore schema uses user-isolated subcollections:

```text
users/
  {uid}/
    circuits/
      {circuitId}/
        id: string
        name: string
        description: string
        author: string
        components: array
        wires: array
        presetKey: string | null
        updatedAt: number (epoch ms)
```

Operations in `firebase-service.js`:
- `saveCircuit(circuit)`: writes to `users/{uid}/circuits/{circuitId}` with merge.
- `loadUserCircuits()`: reads from `users/{uid}/circuits`.
- `deleteCircuit(circuitId)`: deletes from `users/{uid}/circuits/{circuitId}`.

---

## 8. Existing Routes in Application (`index.html` & `js/app.js`)

| Route | View Container ID | Purpose / Description |
| :--- | :--- | :--- |
| `#/` | `#view-home` | Switcha 2.0 Homepage & Portal |
| `#/create`, `#/circuits` | `#view-studio` | Circuit Simulator Studio (Schematic Editor, SPICE/MNA Engine, Grapher) |
| `#/blocks` | `#view-blocks` | Block Diagram Modeling Environment |
| `#/code` | `#view-code` | Numerical / DSP Code Environment |
| `#/my-circuits`, `#/workspace` | `#view-my-circuits` | User's Personal Saved Circuits Library |
| `#/discover` | `#view-discover` | Public, Featured, and Analog/Digital Reference Circuits |
| `#/features` | `#view-features` | Feature Showcase & Specifications |

---

## 9. Existing Verification Tests

All 12 baseline test suites pass with 100% success rate:

1. `test/suite.js` (34 passed, 0 failed)
2. `test/forensic_suite.js` (53 passed, 0 failed)
3. `test/blocks_engine_suite.js` (9 passed, 0 failed)
4. `test/code_engine_suite.js` (10 passed, 0 failed)
5. `test/storage_isolation_suite.js` (5 passed, 0 failed)
6. `test/mathworks_deep_suite.js` (12 passed, 0 failed)
7. `test/oscillator_validation_suite.js` (11 passed, 0 failed)
8. `test/rigorous_oscillator_suite.js` (29 passed, 0 failed)
9. `test/switcha_features_test.js` (5 passed, 0 failed)
10. `test/real_world_qa_suite.js` (78 passed, 0 failed)
11. `test/adversarial_human_workflow_suite.js` (94 passed, 0 failed)
12. `test/audit.js`

---

## 10. Audit Summary

The repository is verified in a clean, working state. Source files have remained untouched during this audit. The six protected files have their cryptographic hashes verified. All subsequent changes will strictly extend the system with the Admin Portal, apply necessary bug fixes, and add security hardening without modifying the protected circuit engine or changing the baseline Circuit Studio.
