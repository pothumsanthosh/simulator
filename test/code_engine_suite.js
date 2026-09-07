/**
 * AUTOMATED TEST SUITE: SWITCHA CODE SCIENTIFIC COMPUTING & MATH ENGINE
 * Verifies SwitchaMath matrix algebra, eigenvalues, ode45, fft, filtering, and safe sandbox execution.
 */

import assert from 'assert';
import { SwitchaMath, SwitchaCodeEngine } from '../js/code/code-engine.js';

console.log('================================================================');
console.log('💻 RUNNING TEST SUITE: SWITCHA CODE & SCIENTIFIC RUNTIME');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✔ PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✖ FAIL: ${name}`);
        console.error(`    ${err.message}\n${err.stack}`);
    }
}

// 1. Matrix & Linear Algebra Operations
test('Matrix Multiplication, Transpose, and Determinant', () => {
    const A = [
        [1, 2],
        [3, 4]
    ];
    const B = [
        [2, 0],
        [1, 2]
    ];

    const C = SwitchaMath.mul(A, B);
    assert.strictEqual(C[0][0], 4);
    assert.strictEqual(C[0][1], 4);
    assert.strictEqual(C[1][0], 10);
    assert.strictEqual(C[1][1], 8);

    const detA = SwitchaMath.det(A);
    assert(Math.abs(detA - (-2)) < 1e-6, `det(A) should be -2, got ${detA}`);

    const At = SwitchaMath.transpose(A);
    assert.strictEqual(At[0][1], 3);
    assert.strictEqual(At[1][0], 2);
});

test('Matrix Inverse and Linear System Solver (A * x = b)', () => {
    const A = [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2]
    ];
    const b = [8, -11, -3];

    const invA = SwitchaMath.inv(A);
    const I = SwitchaMath.mul(A, invA);
    assert(Math.abs(I[0][0] - 1.0) < 1e-4);
    assert(Math.abs(I[0][1]) < 1e-4);
    assert(Math.abs(I[1][1] - 1.0) < 1e-4);

    const x = SwitchaMath.linsolve(A, b);
    assert(Math.abs(x[0] - 2.0) < 1e-4, `x[0] should be 2, got ${x[0]}`);
    assert(Math.abs(x[1] - 3.0) < 1e-4, `x[1] should be 3, got ${x[1]}`);
    assert(Math.abs(x[2] - (-1.0)) < 1e-4, `x[2] should be -1, got ${x[2]}`);
});

test('Eigenvalue Decomposition of Symmetric Matrix', () => {
    const A = [
        [2, 1],
        [1, 2]
    ];
    const eigVals = SwitchaMath.eig(A);
    const sorted = Array.from(eigVals).sort((a, b) => a - b);
    assert(Math.abs(sorted[0] - 1.0) < 1e-3, `Eigenvalue 1 should be 1.0, got ${sorted[0]}`);
    assert(Math.abs(sorted[1] - 3.0) < 1e-3, `Eigenvalue 2 should be 3.0, got ${sorted[1]}`);
});

// 2. Numerical Integration & ODE45 Solvers
test('Simpson 1/3 Numerical Quadrature (quad)', () => {
    const f = (x) => x * x;
    const res = SwitchaMath.quad(f, 0, 3, 100);
    assert(Math.abs(res - 9.0) < 1e-5, `Integral of x^2 from 0 to 3 should be 9.0, got ${res}`);
});

test('ODE45 Dynamic Integration of 1st-Order Exponential Decay', () => {
    const ode = (t, y) => [-2 * y[0]];
    const sol = SwitchaMath.ode45(ode, [0, 1.0], [5.0], 200);

    const finalY = sol.y[0][sol.y[0].length - 1];
    const expected = 5.0 * Math.exp(-2.0);
    assert(Math.abs(finalY - expected) < 1e-3, `ODE45 final y (${finalY}) should be ${expected}`);
});

// 3. Signal Processing: FFT, Convolution, Digital Filtering & AWGN
test('Cooley-Tukey Radix-2 FFT and IFFT Round-Trip', () => {
    const N = 64;
    const t = SwitchaMath.linspace(0, 1, N);
    const x = t.map(v => Math.sin(2 * Math.PI * 5 * v));

    const X = SwitchaMath.fft(x);
    assert(X.mag.length === N, 'FFT magnitude length must match input length');

    let maxIdx = 0, maxVal = -1;
    for (let i = 0; i < N / 2; i++) {
        if (X.mag[i] > maxVal) {
            maxVal = X.mag[i];
            maxIdx = i;
        }
    }
    assert.strictEqual(maxIdx, 5, `FFT peak should be at bin 5, got bin ${maxIdx}`);

    const xRec = SwitchaMath.ifft(X);
    for (let i = 0; i < N; i++) {
        assert(Math.abs(x[i] - xRec[i]) < 1e-4, `IFFT reconstructed sample ${i} mismatch`);
    }
});

test('Discrete Convolution and Direct Form II Filtering', () => {
    const x = [1, 2, 3];
    const h = [0.5, 1];
    const y = SwitchaMath.conv(x, h);
    assert.strictEqual(y.length, 4);
    assert(Math.abs(y[0] - 0.5) < 1e-6);
    assert(Math.abs(y[1] - 2.0) < 1e-6);
    assert(Math.abs(y[2] - 3.5) < 1e-6);
    assert(Math.abs(y[3] - 3.0) < 1e-6);
});

test('AWGN channel generates Gaussian noise with specified SNR', () => {
    const sig = new Float64Array(1000).fill(1.0);
    const snrDb = 20;
    const noisy = SwitchaMath.awgn(sig, snrDb);

    let noiseVar = 0;
    for (let i = 0; i < noisy.length; i++) {
        const n = noisy[i] - 1.0;
        noiseVar += n * n;
    }
    noiseVar /= noisy.length;
    assert(noiseVar > 0.005 && noiseVar < 0.02, `Noise variance (${noiseVar.toFixed(4)}) should be near 0.01 for SNR=20dB`);
});

// 4. Code Runtime Sandbox Execution & Variable Workspace
test('SwitchaCodeEngine evaluates scripts and retains workspace state', () => {
    const engine = new SwitchaCodeEngine();

    const script = `
        const A = [[1, 2], [3, 4]];
        const d = det(A);
        const t = linspace(0, 10, 5);
    `;

    const res = engine.run(script);
    assert(!res.error, `Script execution returned error: ${res.error}`);

    const vars = engine.getWorkspaceVariables();
    assert('A' in vars, 'Variable A must exist in workspace');
    assert('d' in vars, 'Variable d must exist in workspace');
    assert.strictEqual(vars.d, -2, 'Variable d must equal -2');
    assert('t' in vars, 'Variable t must exist in workspace');
    assert.strictEqual(vars.t.length, 5, 'Vector t length must be 5');
});

console.log(`\n================================================================`);
console.log(`📊 CODE ENGINE TESTS: ${passedTests} / ${totalTests} PASSED`);
console.log(`================================================================\n`);

if (passedTests !== totalTests) {
    process.exit(1);
}
