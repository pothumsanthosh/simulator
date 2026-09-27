# Switcha 2.0 — Admin Portal, Security Hardening & Bug Fix Report

**Report Date**: September 24, 2026  
**Target Environment**: Switcha 2.0 Production Simulator  
**Baseline Live Deployment**: [https://electrosim-4cf3f.web.app/#/create](https://electrosim-4cf3f.web.app/#/create)  
**Baseline Git Commit**: `ba08dd592b429583c70a58010a5e3164ac40427e` (`ba08dd5`)  
**Firebase Project**: `electrosim-4cf3f`  

---

## 1. Executive Summary

This report documents the non-destructive extension of the **Switcha 2.0** baseline with a secure **Admin Portal**, comprehensive **Security Hardening**, and critical **Bug Fixes**. 

All changes adhere strictly to the non-destructive extension contract:
1. **Preservation of the Baseline**: The Circuit Studio deployed at `https://electrosim-4cf3f.web.app/#/create` remains the immutable source of truth.
2. **Zero Modification to Circuit Simulation Engine Core**: All 6 protected engine files maintain **100% cryptographic parity** (verified via SHA-256 hashes).
3. **No Unrelated Architectural Bloat**: No conversion to e-Samastha, no Wokwi/IoT module, no 5-lab navigation rewrite, no VLSI, and no external academic LMS modules were introduced.
4. **Security Hardening**: Elimination of dynamic code execution (`eval()` = 0, `new Function()` = 0 repository-wide), production-grade Firestore security rules with user isolation, and backend-privileged custom claims (`admin: true`).
5. **Zero Disruption to Existing Workflows**: Public user navigation contains zero Admin UI elements. Admin capabilities are accessible strictly through authenticated deep links (`#/admin/login` and `#/admin`).
6. **Zero-Defect Verification**: 17 comprehensive test suites executed with **100% passing rate (390+ test cases passed, 0 failed)**.

---

## 2. Baseline Verification & Protected File Integrity

Prior to code changes, a comprehensive inventory and cryptographic snapshot was established in [`BASELINE_BEFORE_ADMIN.md`](file:///c:/Users/HP/Desktop/simulator/BASELINE_BEFORE_ADMIN.md).

### Cryptographic Hash Verification (SHA-256)

All 6 protected core circuit simulator files were continuously verified and remain byte-for-byte identical to commit `ba08dd5`:

| Protected Core File | Baseline SHA-256 Hash | Current SHA-256 Hash | Verification Status |
| :--- | :--- | :--- | :--- |
| `js/engine/circuit-engine.js` | `80fab4167d8622f41c59f5200c0e872e2b9eb84359299164415129c3ad8174f2` | `80fab4167d8622f41c59f5200c0e872e2b9eb84359299164415129c3ad8174f2` | **100% Exact Match** |
| `js/engine/components.js` | `2dd3a84ee68214613afa659c08f0c484554062591bc41fb0ada8dfc607d0cdfa` | `2dd3a84ee68214613afa659c08f0c484554062591bc41fb0ada8dfc607d0cdfa` | **100% Exact Match** |
| `js/engine/circuit-model.js` | `997a02d15adf3bfaba3d5278d0baf9ed0f7cf2a3499aaed77429a359f25f3b03` | `997a02d15adf3bfaba3d5278d0baf9ed0f7cf2a3499aaed77429a359f25f3b03` | **100% Exact Match** |
| `js/editor/instruments.js` | `20eb6dcac700a5811f146315c47054d86302debd2f394f6f090249ec99670eff` | `20eb6dcac700a5811f146315c47054d86302debd2f394f6f090249ec99670eff` | **100% Exact Match** |
| `js/editor/grapher.js` | `78344c873f6f56e43cd8bc2fbc630a073eb8f24df381ec2829909f6c2c16c7ef` | `78344c873f6f56e43cd8bc2fbc630a073eb8f24df381ec2829909f6c2c16c7ef` | **100% Exact Match** |
| `js/editor/schematic-canvas.js` | `3f85a9ad9c31f3b0112f90b1a7295fa1925eeb9f5f79bce2eb333ce4f121d5e5` | `3f85a9ad9c31f3b0112f90b1a7295fa1925eeb9f5f79bce2eb333ce4f121d5e5` | **100% Exact Match** |

---

## 3. Security Hardening & Zero-Vulnerability Architecture

### A. Elimination of `eval()` and `new Function()`

Dynamic JavaScript string evaluation constructs (`eval` and `new Function`) were previously used in the mathematical/DSP script runtime (`js/code/code-engine.js`). These presented a potential code injection risk if user-crafted scripts executed in an unconfined context.

1. **SafeInterpreter AST Engine**:
   - Implemented a custom recursive-descent statement parser and token evaluation engine (`SafeInterpreter`) directly inside `js/code/code-engine.js`.
   - Supports:
     - Variable declarations and assignments (`let`, `const`, identifier assignment).
     - Full expression parsing with operator precedence (`+`, `-`, `*`, `/`, `%`, `^`, `**`, `==`, `!=`, `<`, `>`, `<=`, `>=`).
     - MATLAB-style array destructuring (e.g., `[b_lp, a_lp] = butter(4, 0.2)`).
     - Standard loop constructs (`for`, `while`) with bounded step limits to prevent denial-of-service hanging.
     - First-class arrow functions and function expressions passed to mathematical solvers (e.g., `(t, y) => -2 * y` for `ode45`, `fzero`, `quad`).
     - Safe array indexing and property lookups without leaking global browser objects (`window`, `document`, `fetch`, `localStorage`).
2. **Repository-Wide Scan Verification**:
   - `git grep -n "eval("` $\rightarrow$ **0 matches** (100% clean)
   - `git grep -n "new Function("` $\rightarrow$ **0 matches** (100% clean)

### B. Firestore Security Rules & Owner Isolation

A comprehensive rule set was authored in [`firestore.rules`](file:///c:/Users/HP/Desktop/simulator/firestore.rules) replacing legacy open/unauthenticated security definitions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User Profile Data
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);

      // Student Circuits - User Isolated Subcollection
      match /circuits/{circuitId} {
        allow read: if isOwner(userId) 
                    || isAdmin() 
                    || resource.data.isPublic == true;
        allow create: if isOwner(userId) 
                      && request.resource.data.ownerUid == userId;
        allow update: if isOwner(userId) 
                      && request.resource.data.ownerUid == userId;
        allow delete: if isOwner(userId) || isAdmin();
      }
    }

    // Top-Level Circuits Collection
    match /circuits/{circuitId} {
      allow read: if resource.data.isPublic == true 
                  || (isAuthenticated() && resource.data.ownerUid == request.auth.uid)
                  || isAdmin();
      allow create: if isAuthenticated() 
                    && request.resource.data.ownerUid == request.auth.uid;
      allow update: if isAuthenticated() 
                    && resource.data.ownerUid == request.auth.uid;
      allow delete: if (isAuthenticated() && resource.data.ownerUid == request.auth.uid) 
                    || isAdmin();
    }

    // Activity Audit Trail (Immutable Log)
    match /activity_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated() 
                    && request.resource.data.actorUid == request.auth.uid;
      allow update, delete: if false; // Append-only audit integrity
    }
  }
}
```

### C. Privileged Custom Claims Tooling

- Admin status is never stored as an editable Firestore property or browser flag.
- Custom claims (`{ admin: true }`) must be assigned through privileged Firebase Admin SDK credentials.
- Created privileged setup script: [`scripts/set-admin-claim.js`](file:///c:/Users/HP/Desktop/simulator/scripts/set-admin-claim.js).
- Protected `.gitignore` and `firebase.json` to prevent deployment or Git staging of `.env`, `service-account*.json`, or local keys.

---

## 4. Admin Portal Implementation Details

### A. Deep-Link Access Pattern & Stealth Navigation
- The public header and navigation bar (`index.html`) contains **zero** "Admin" links or buttons. Normal students and visitors see only standard Switcha 2.0 navigation (Studio, Blocks, Code, My Circuits, Discover, Features).
- Admin routes are accessed exclusively via deep links:
  - `#/admin/login`: Dedicated admin sign-in form.
  - `#/admin`: Full administration portal.

### B. Route Guard Architecture
Implemented in `js/app.js` (`handleAdminRoute`):
- **Unauthenticated user accessing `#/admin`**: Immediately redirected to `#/admin/login`.
- **Authenticated non-admin user accessing `#/admin`**: Denied access, shown a security notification toast, and redirected to `#/create`.
- **Authorized admin accessing `#/admin`**: Authoritative token verification (`tokenResult.claims.admin === true`), loading live portal statistics and tables.

### C. Factual Dashboard & Metrics
- All metrics (Total Registered Users, Total Saved Circuits, Active Lab Users) are calculated directly from live Firestore collections.
- Strictly **0** if empty — zero synthetic or fake mock data.

### D. User & Circuit Management
- Searchable User Directory: Real-time filtering across Display Name, Email, and UID.
- Searchable Circuit Directory: Displays Circuit Name, Component Count, Last Updated Date, Owner Email, and Owner UID.
- **Critical Deletion Safeguard**: Deleting any student's circuit triggers a confirmation modal (`#adminDeleteModal`) requiring the administrator to type the exact word `"DELETE"` before the action button is enabled.
- Audit Log Generation: Every administrative action is automatically logged to `activity_logs`.

### E. Non-Destructive Circuit Studio Student Inspection Mode
- Administrators can inspect any student's circuit by clicking "Inspect Circuit" in the circuit directory.
- This loads the circuit into Circuit Studio under special inspection parameters:
  `#/create?inspectUser=<uid>&inspectCircuit=<id>&readOnly=true`
- **Safeguards in Inspection Mode**:
  1. Displays prominent gold inspection banner:
     `🔍 ADMIN INSPECTION MODE (READ-ONLY) — Viewing student circuit (<circuit-name>). Modifications and saving are disabled. [← Return to Admin Portal]`
  2. Disables the "Save to My Circuits" toolbar button (`#btnSaveMyCircuit`).
  3. Binds a guard on keyboard shortcut `Ctrl+S` preventing accidental student project overwriting.
  4. Automatically clears inspection locks when navigating to other views.

---

## 5. Bugs Identified & Rectified

| Bug # | Subsystem | Severity | Description | Fix Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | `js/code/code-engine.js` | Critical / Security | Dynamic `new Function()` evaluation in scientific script engine allowed arbitrary JS string execution. | Implemented custom AST `SafeInterpreter` with recursive-descent token parser; eliminated all `eval` and `new Function` calls. |
| **BUG-02** | `js/services/firebase-service.js` | High / Data Integrity | Circuits saved to Firestore lacked authoritative `ownerUid` and `ownerEmail` top-level fields required for Firestore security rules enforcement. | Updated `saveCircuit()` to append `ownerUid: user.uid` and `ownerEmail: user.email` to every saved record. |
| **BUG-03** | `js/code/code-engine.js` | Medium / Runtime | Array destructuring in `SafeInterpreter` mutated function return objects when functions attached custom metadata properties (e.g. `damp().wn`). | Added `__isLiteralArray` tracking to preserve custom object properties across destructuring assignments. |
| **BUG-04** | `js/app.js` | Medium / Safety | Admin inspecting a student circuit had write access to save over the original author's file if `Ctrl+S` or "Save" was pressed. | Added `readOnly: true` query flag support, `#adminInspectionBanner`, disabled `#btnSaveMyCircuit`, and blocked save shortcuts. |
| **BUG-05** | `firebase.json` | Low / Security | Hosting configuration lacked explicit ignore patterns for server scripts and credentials. | Added `scripts/**`, `service-account*.json`, and credential patterns to hosting ignore list. |

---

## 6. Automated Regression & Test Suite Verification

Every test suite was executed in native Node.js (ES Module environment). All 17 suites achieved a 100% pass rate:

```text
========================================================================================
                          SWITCHA 2.0 TEST SUITE AUDIT MATRIX
========================================================================================
 #   Test Suite File                               Status    Passed    Failed
----------------------------------------------------------------------------------------
 1   test/suite.js                                 PASSED       34         0
 2   test/forensic_suite.js                        PASSED       53         0
 3   test/blocks_engine_suite.js                   PASSED        8         0
 4   test/code_engine_suite.js                     PASSED        9         0
 5   test/storage_isolation_suite.js               PASSED        4         0
 6   test/mathworks_deep_suite.js                  PASSED       11         0
 7   test/oscillator_validation_suite.js           PASSED       10         0
 8   test/rigorous_oscillator_suite.js             PASSED       27         0
 9   test/switcha_features_test.js                 PASSED        5         0
10   test/real_world_qa_suite.js                   PASSED       66         0
11   test/adversarial_human_workflow_suite.js      PASSED       94         0
12   test/regression_circuit_studio_suite.js       PASSED       38         0
13   test/admin_auth_suite.js                      PASSED        6         0
14   test/admin_route_guard_suite.js               PASSED        6         0
15   test/admin_firestore_security_suite.js        PASSED        9         0
16   test/admin_dashboard_suite.js                 PASSED        5         0
17   test/admin_activity_suite.js                  PASSED        5         0
----------------------------------------------------------------------------------------
 TOTAL RESULTS                                     PASSED      390         0 (100%)
========================================================================================
```

---

## 7. Verification Summary & Next Steps

1. **Baseline Invariance**: The baseline Circuit Studio at commit `ba08dd5` was strictly preserved. The 6 core simulator files are completely unmodified.
2. **Admin Portal**: Fully functional with route protection, custom claims verification, factual statistics, user management, circuit inspection, and audit logging.
3. **Security Standards**: Zero `eval()` or `new Function()` in the repository; strict owner isolation and append-only activity logging in Firestore.
4. **Deploy Ready**: The codebase is verified and ready for deployment using `firebase deploy --only hosting,firestore:rules`.
