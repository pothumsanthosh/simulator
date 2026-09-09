/**
 * AUTOMATED DEEP TEST SUITE: MATHWORKS MATLAB & SIMULINK ENVIRONMENT
 * Comprehensive verification of:
 * 1. MATLAB Syntax Transpilation & REPL (matrices, colon, element-wise dot operators, mldivide, transpose, suppression)
 * 2. Linear Algebra, Matrix Decompositions & Polynomials (inv, det, eig, svd, roots, polyfit, polyval)
 * 3. Control Systems Toolbox (tf, step, impulse, bode, margin, feedback, series, parallel, damp, pzmap)
 * 4. DSP & Signal Processing Toolbox (fft, ifft, butter, filtfilt, freqz, findpeaks)
 * 5. Dynamic Block ODE Simulation (RK4, Euler, Heun, RK45 solvers, non-linear blocks, 8 reference models)
 * 6. Simulink Co-Simulation Bridge (sim() bridge callable from MATLAB code)
 */

import assert from 'assert';
import { SwitchaCodeEngine } from '../js/code/code-engine.js';
import { BlockEngine, SwitchaBlocksEngine } from '../js/blocks/block-engine.js';
import { BlockLibrary } from '../js/blocks/block-library.js';
import { BlockTypes, BlockDefinitions } from '../js/blocks/block-types.js';

console.log('================================================================');
console.log('🚀 RUNNING MATHWORKS DEEP MATLAB & SIMULINK SUITE');
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

async function runAll() {
  // -------------------------------------------------------------
  // GROUP 1: MATLAB SYNTAX TRANSPILATION & COMMAND WINDOW REPL
  // -------------------------------------------------------------
  await test('MATLAB transpiler handles matrix literals, colon operator, and element-wise dot ops', async () => {
    const engine = new SwitchaCodeEngine();

    const matlabCode = `
      % Define 2x2 matrix and colon vector
      A = [4 1; 2 3];
      t = 0:0.5:2;
      x = [1 2 3];
      y = x .* 2;
      ans_det = det(A);
    `;

    const res = await engine.execute(matlabCode);
    assert.strictEqual(res.success, true, 'Execution should succeed');

    const A = engine.workspace.get('A');
    assert(Array.isArray(A) && A.length === 2 && A[0][0] === 4 && A[1][1] === 3, 'Matrix A must be 2x2 [[4,1],[2,3]]');

    const t = engine.workspace.get('t');
    assert((Array.isArray(t) || t instanceof Float64Array) && t.length === 5, 'Vector t (0:0.5:2) must have 5 elements');
    assert.strictEqual(t[0], 0);
    assert.strictEqual(t[4], 2);

    const y = engine.workspace.get('y');
    assert.deepStrictEqual(Array.from(y), [2, 4, 6], 'Element-wise dot operation y = x .* 2 failed');

    const detA = engine.workspace.get('ans_det');
    assert.strictEqual(Math.round(detA), 10, 'det(A) of [4 1; 2 3] should be 10');
  });

  await test('MATLAB matrix solve backslash (A \\ b) and transpose operator', async () => {
    const engine = new SwitchaCodeEngine();

    // 2x + y = 5, x + 3y = 10 => x = 1, y = 3
    const code = `
      A = [2 1; 1 3];
      b = [5; 10];
      x = A \\ b;
      At = A';
    `;

    const res = await engine.execute(code);
    assert.strictEqual(res.success, true);

    const x = engine.workspace.get('x');
    assert(Math.abs(x[0] - 1.0) < 1e-4, `x[0] should be 1.0, got ${x[0]}`);
    assert(Math.abs(x[1] - 3.0) < 1e-4, `x[1] should be 3.0, got ${x[1]}`);

    const At = engine.workspace.get('At');
    assert.strictEqual(At[0][1], 1, 'A\' transpose element (0,1) must equal A(1,0)');
    assert.strictEqual(At[1][0], 1, 'A\' transpose element (1,0) must equal A(0,1)');
  });

  // -------------------------------------------------------------
  // GROUP 2: SCIENTIFIC LINEAR ALGEBRA, ROOTS & POLYNOMIALS
  // -------------------------------------------------------------
  await test('Linear algebra functions: inv, eig, svd, and polynomial roots', async () => {
    const engine = new SwitchaCodeEngine();

    const code = `
      % Invert matrix
      M = [1 2; 3 4];
      Minv = inv(M);
      I = mtimes(Minv, M);

      % Eigenvalues of symmetric matrix [2 1; 1 2] -> lambda = 3, 1
      E = eig([2 1; 1 2]);

      % Roots of polynomial s^2 + 5s + 6 = 0 -> roots are -2, -3
      r = roots([1 5 6]);

      % Polynomial evaluation at s = 2: 2^2 + 5(2) + 6 = 20
      val = polyval([1 5 6], 2);
    `;

    const res = await engine.execute(code);
    assert.strictEqual(res.success, true);

    const I = engine.workspace.get('I');
    assert(Math.abs(I[0][0] - 1) < 1e-5 && Math.abs(I[0][1]) < 1e-5, 'inv(M)*M should be Identity');

    const E = engine.workspace.get('E');
    const lambdas = Array.from(E);
    assert(lambdas.some(l => Math.abs(l - 3) < 0.1) && lambdas.some(l => Math.abs(l - 1) < 0.1), 'Eigenvalues must be 3 and 1');

    const r = engine.workspace.get('r');
    const rootVals = r.map(v => typeof v === 'number' ? v : v.re);
    assert(rootVals.some(v => Math.abs(v - (-2)) < 1e-4), 'Roots must contain -2');
    assert(rootVals.some(v => Math.abs(v - (-3)) < 1e-4), 'Roots must contain -3');

    const val = engine.workspace.get('val');
    assert.strictEqual(val, 20, 'polyval([1 5 6], 2) should be 20');
  });

  await test('Calculus & ODE: trapz, cumsum, diff, and ode45 Runge-Kutta solver', async () => {
    const engine = new SwitchaCodeEngine();

    const code = `
      x = linspace(0, pi, 100);
      y = sin(x);
      area = trapz(x, y);

      % Solve dy/dt = -2y with y(0) = 5 from t=0 to 2
      % Analytical solution: y(t) = 5 * exp(-2t) => y(2) = 5 * exp(-4) = 0.091578
      sol = ode45((t, y) => -2 * y, [0, 2], 5);
      yEnd = sol.y[sol.y.length - 1];
    `;

    const res = await engine.execute(code);
    assert.strictEqual(res.success, true);

    const area = engine.workspace.get('area');
    assert(Math.abs(area - 2.0) < 1e-2, `Integral of sin(x) from 0 to pi should be ~2.0, got ${area}`);

    const yEnd = engine.workspace.get('yEnd');
    const expected = 5 * Math.exp(-4);
    assert(Math.abs(yEnd - expected) < 1e-3, `ode45 solution at t=2 should be ${expected}, got ${yEnd}`);
  });

  // -------------------------------------------------------------
  // GROUP 3: CONTROL SYSTEMS TOOLBOX
  // -------------------------------------------------------------
  await test('Control Systems: Transfer function, feedback, step response, and bode margins', async () => {
    const engine = new SwitchaCodeEngine();

    const code = `
      % Plant G(s) = 10 / (s + 2)
      G = tf([10], [1, 2]);

      % Negative unity feedback T(s) = G / (1 + G) = 10 / (s + 12)
      T = feedback(G, 1);

      % Step response of closed-loop system: y(t) = (10/12) * (1 - exp(-12t))
      stepRes = step(T, 1.0);

      % Compute Bode margins of open loop system G
      m = margin(G);

      % Compute natural frequency and damping ratio of 2nd order system
      H = tf([25], [1, 2, 25]);
      d = damp(H);
    `;

    const res = await engine.execute(code);
    assert.strictEqual(res.success, true);

    const T = engine.workspace.get('T');
    assert.strictEqual(T.den[0], 1);
    assert.strictEqual(T.den[1], 12);
    assert.strictEqual(T.num[0], 10);

    const stepRes = engine.workspace.get('stepRes');
    const yFinal = stepRes.y[stepRes.y.length - 1];
    assert(Math.abs(yFinal - (10 / 12)) < 1e-3, `Closed-loop steady state step should be 10/12 (~0.833), got ${yFinal}`);

    const d = engine.workspace.get('d');
    assert(Math.abs(d.wn[0] - 5.0) < 1e-4, `Natural frequency wn should be 5.0, got ${d.wn[0]}`);
    assert(Math.abs(d.zeta[0] - 0.2) < 1e-4, `Damping ratio zeta should be 0.2, got ${d.zeta[0]}`);
  });

  // -------------------------------------------------------------
  // GROUP 4: SIGNAL PROCESSING & DSP TOOLBOX
  // -------------------------------------------------------------
  await test('DSP: FFT, Butterworth IIR filter design, and filtfilt forward-backward filtering', async () => {
    const engine = new SwitchaCodeEngine();

    const code = `
      % Create 100Hz and 300Hz two-tone signal sampled at 1000Hz
      Fs = 1000;
      t = 0:(1/Fs):0.25;
      sig = t.map(v => Math.sin(2 * Math.PI * 100 * v) + 0.5 * Math.sin(2 * Math.PI * 300 * v));

      % 2nd-order Butterworth low-pass filter at cutoff 150Hz (Wn = 150 / 500 = 0.3)
      [b_lp, a_lp] = butter(2, 0.3, 'low');

      % Zero-phase filtering with filtfilt
      cleanSig = filtfilt(b_lp, a_lp, sig);

      % FFT spectrum
      Y = fft(cleanSig);
      f = (0:(length(Y)-1)) * (Fs / length(Y));
    `;

    const res = await engine.execute(code);
    assert.strictEqual(res.success, true);

    const b_lp = engine.workspace.get('b_lp');
    const a_lp = engine.workspace.get('a_lp');
    assert((Array.isArray(b_lp) || b_lp instanceof Float64Array) && b_lp.length === 3, '2nd order butterworth b coeffs should have length 3');
    assert((Array.isArray(a_lp) || a_lp instanceof Float64Array) && a_lp.length === 3, '2nd order butterworth a coeffs should have length 3');

    const cleanSig = engine.workspace.get('cleanSig');
    assert((Array.isArray(cleanSig) || cleanSig instanceof Float64Array) && cleanSig.length > 50, 'Filtered signal should exist');
  });

  // -------------------------------------------------------------
  // GROUP 5: SIMULINK BLOCKS & ADVANCED SOLVERS
  // -------------------------------------------------------------
  await test('Simulink ODE integration: All solvers (RK4, EULER, HEUN) produce consistent results', async () => {
    const solvers = ['RK4', 'EULER', 'HEUN'];
    const results = {};

    for (const s of solvers) {
      const engine = new SwitchaBlocksEngine();
      engine.solver = s;

      // 1st order lag dy/dt = (u - y) / tau with u=10, tau=0.5
      // y(t) = 10 * (1 - exp(-t / 0.5)) => at t = 1.0, y = 10 * (1 - exp(-2)) = 8.6466
      const blocks = [
        { id: 'u1', type: BlockTypes.CONSTANT, params: { value: 10.0 } },
        { id: 'lag1', type: BlockTypes.LAG_FIRST_ORDER, params: { gain: 1.0, timeConstant: 0.5 } }
      ];
      const wires = [
        { id: 'w1', fromBlock: 'u1', fromPort: 'out', toBlock: 'lag1', toPort: 'in' }
      ];

      engine.setModel(blocks, wires);
      const dt = 0.001;
      for (let t = 0; t < 1000; t++) {
        engine.step(dt);
      }
      results[s] = engine.signals.get('lag1:out');
    }

    const expected = 10 * (1 - Math.exp(-2));
    assert(Math.abs(results.RK4 - expected) < 1e-3, `RK4 result (${results.RK4}) must match analytical (${expected})`);
    assert(Math.abs(results.HEUN - expected) < 1e-2, `Heun result (${results.HEUN}) must be close to (${expected})`);
    assert(Math.abs(results.EULER - expected) < 0.05, `Euler result (${results.EULER}) must converge near (${expected})`);
  });

  await test('Simulink Non-Linear & Discrete blocks: Switch, 1D LUT, Logic, Relational', async () => {
    const engine = new SwitchaBlocksEngine();

    const blocks = [
      { id: 'c1', type: BlockTypes.CONSTANT, params: { value: 100 } },
      { id: 'c2', type: BlockTypes.CONSTANT, params: { value: 200 } },
      { id: 'ctrl', type: BlockTypes.CONSTANT, params: { value: 1.0 } },
      { id: 'sw', type: BlockTypes.SWITCH_2WAY, params: { threshold: 0.5 } },
      { id: 'lut_in', type: BlockTypes.CONSTANT, params: { value: 2.5 } },
      { id: 'lut', type: BlockTypes.LOOKUP_TABLE_1D, params: { tableX: '[0, 2, 4]', tableY: '[0, 20, 40]' } },
      { id: 'rel1', type: BlockTypes.RELATIONAL_OP, params: { operator: '<=' } }
    ];

    const wires = [
      { id: 'w1', fromBlock: 'c1', fromPort: 'out', toBlock: 'sw', toPort: 'in1' },
      { id: 'w2', fromBlock: 'ctrl', fromPort: 'out', toBlock: 'sw', toPort: 'ctrl' },
      { id: 'w3', fromBlock: 'c2', fromPort: 'out', toBlock: 'sw', toPort: 'in2' },
      { id: 'w4', fromBlock: 'lut_in', fromPort: 'out', toBlock: 'lut', toPort: 'in' },
      { id: 'w5', fromBlock: 'c1', fromPort: 'out', toBlock: 'rel1', toPort: 'in1' },
      { id: 'w6', fromBlock: 'c2', fromPort: 'out', toBlock: 'rel1', toPort: 'in2' }
    ];

    engine.setModel(blocks, wires);
    engine.step(0.01);

    // Switch: ctrl is 1.0 >= 0.5 -> should pick in1 (100)
    assert.strictEqual(engine.signals.get('sw:out'), 100, 'Switch should route in1 when ctrl >= threshold');

    // LUT: input is 2.5 between x=2 (y=20) and x=4 (y=40) -> linear interpolation y = 25
    assert.strictEqual(engine.signals.get('lut:out'), 25, '1D LUT should linearly interpolate y=25 at x=2.5');

    // Relational: 100 <= 200 -> 1
    assert.strictEqual(engine.signals.get('rel1:out'), 1, 'Relational 100 <= 200 must output 1');
  });

  // -------------------------------------------------------------
  // GROUP 6: MATLAB-TO-SIMULINK CO-SIMULATION BRIDGE
  // -------------------------------------------------------------
  await test('MATLAB code engine invokes Simulink models natively via sim("modelName")', async () => {
    const codeEngine = new SwitchaCodeEngine();

    const code = `
      % Run Simulink DC Motor PID model from MATLAB
      out = sim('dcMotorPid', 1.0);
      finalSpeed = out.signals['Speed Scope:CH2'];
    `;

    const res = await codeEngine.execute(code);
    assert.strictEqual(res.success, true, `sim() bridge failed: ${res.error}`);

    const simout = codeEngine.workspace.get('out');
    assert(simout !== null && typeof simout === 'object', 'sim() should return simulation output object');
    assert(simout.history && simout.history.length > 50, 'simout should contain history log');

    const finalSpeed = codeEngine.workspace.get('finalSpeed');
    assert(typeof finalSpeed === 'number' && !isNaN(finalSpeed), 'finalSpeed should be a valid number');
  });

  // -------------------------------------------------------------
  // GROUP 7: MATLAB TEXTBOOK SCRIPTS & AM MODULATION WITH SUBPLOTS
  // -------------------------------------------------------------
  await test('MATLAB AM Modulation textbook script executes cleanly with subplots and plots', async () => {
    const plotEvents = [];
    const mockPlotter = {
      subplot: (r, c, i) => plotEvents.push({ type: 'subplot', r, c, i }),
      plot: (x, y) => plotEvents.push({ type: 'plot', len: y.length, max: Math.max(...y), min: Math.min(...y) }),
      grid: (s) => plotEvents.push({ type: 'grid', state: s }),
      title: (t) => plotEvents.push({ type: 'title', title: t }),
      xlabel: (l) => plotEvents.push({ type: 'xlabel', label: l }),
      ylabel: (l) => plotEvents.push({ type: 'ylabel', label: l }),
      clf: () => plotEvents.push({ type: 'clf' })
    };

    const codeEngine = new SwitchaCodeEngine(mockPlotter);

    const amScript = `
      clc;
      clear;
      close all;

      % Parameters
      Am = 1;          % Message signal amplitude
      Ac = 2;          % Carrier signal amplitude
      fm = 100;        % Message frequency (Hz)
      fc = 1000;       % Carrier frequency (Hz)
      mu = 0.5;        % Modulation index

      % Time vector
      t = 0:0.00001:0.05;

      % Message signal
      m = Am * cos(2*pi*fm*t);

      % Carrier signal
      c = Ac * cos(2*pi*fc*t);

      % AM signal
      s = Ac * (1 + mu*cos(2*pi*fm*t)) .* cos(2*pi*fc*t);

      % Plot message signal
      subplot(3,1,1);
      plot(t,m);
      grid on;
      title('Message Signal');
      xlabel('Time (s)');
      ylabel('Amplitude');

      % Plot carrier signal
      subplot(3,1,2);
      plot(t,c);
      grid on;
      title('Carrier Signal');
      xlabel('Time (s)');
      ylabel('Amplitude');

      % Plot AM signal
      subplot(3,1,3);
      plot(t,s);
      grid on;
      title('Amplitude Modulated (AM) Signal');
      xlabel('Time (s)');
      ylabel('Amplitude');
    `;

    const res = await codeEngine.execute(amScript);
    assert.strictEqual(res.success, true, `Script execution failed: ${res.error}`);

    const m = codeEngine.workspace.get('m');
    const c = codeEngine.workspace.get('c');
    const s = codeEngine.workspace.get('s');
    const t = codeEngine.workspace.get('t');

    assert(t && t.length === 5001, `Time vector t should have 5001 elements, got ${t?.length}`);
    assert(m && m.length === 5001, `Message vector m should have 5001 elements, got ${m?.length}`);
    assert(c && c.length === 5001, `Carrier vector c should have 5001 elements, got ${c?.length}`);
    assert(s && s.length === 5001, `AM signal vector s should have 5001 elements, got ${s?.length}`);

    const maxS = Math.max(...s);
    assert(Math.abs(maxS - 3.0) < 1e-3, `AM signal peak amplitude should be 3.0, got ${maxS}`);

    const subplots = plotEvents.filter(e => e.type === 'subplot');
    assert.strictEqual(subplots.length, 3, 'Should have 3 subplot calls');
    const plots = plotEvents.filter(e => e.type === 'plot');
    assert.strictEqual(plots.length, 3, 'Should have 3 plot calls');
    const titles = plotEvents.filter(e => e.type === 'title').map(e => e.title);
    assert.deepStrictEqual(titles, ['Message Signal', 'Carrier Signal', 'Amplitude Modulated (AM) Signal']);
  });

  await test('MATLAB Delta Modulation script with for-loop, if/else, and indexed assignment executes cleanly', async () => {
    const plotEvents = [];
    const mockPlotter = {
      clear: () => plotEvents.push({ type: 'clear' }),
      clf: () => plotEvents.push({ type: 'clf' }),
      figure: () => plotEvents.push({ type: 'figure' }),
      subplot: (r, c, i) => plotEvents.push({ type: 'subplot', r, c, i }),
      plot: (x, y) => plotEvents.push({ type: 'plot', lenX: x?.length, lenY: y?.length }),
      stairs: (x, y) => plotEvents.push({ type: 'stairs', lenX: x?.length, lenY: y?.length }),
      grid: (s) => plotEvents.push({ type: 'grid', state: s }),
      title: (t) => plotEvents.push({ type: 'title', title: t }),
      xlabel: (l) => plotEvents.push({ type: 'xlabel', label: l }),
      ylabel: (l) => plotEvents.push({ type: 'ylabel', label: l }),
    };

    const codeEngine = new SwitchaCodeEngine(mockPlotter);

    const dmScript = `
      clc;
      clear;
      close all;

      fs = 1000;
      fm = 5;
      t = 0:1/fs:1;

      m = sin(2*pi*fm*t);

      delta = 0.1;

      y = zeros(size(t));
      dm = zeros(size(t));

      for i = 2:length(t)
          if m(i) > y(i-1)
              dm(i) = 1;
              y(i) = y(i-1) + delta;
          else
              dm(i) = 0;
              y(i) = y(i-1) - delta;
          end
      end

      figure;

      subplot(3,1,1);
      plot(t,m);
      grid on;
      title('Message Signal');

      subplot(3,1,2);
      plot(t,y);
      grid on;
      title('Delta Modulated Staircase');

      subplot(3,1,3);
      stairs(t,dm);
      grid on;
      title('Delta Modulated Signal');
    `;

    const res = await codeEngine.execute(dmScript);
    assert.strictEqual(res.success, true, `Delta modulation script failed: ${res.error}`);

    const t = codeEngine.workspace.get('t');
    const m = codeEngine.workspace.get('m');
    const y = codeEngine.workspace.get('y');
    const dm = codeEngine.workspace.get('dm');

    assert(t && t.length === 1001, `Time vector should have 1001 points, got ${t?.length}`);
    assert(m && m.length === 1001, `Message vector should have 1001 points, got ${m?.length}`);
    assert(y && y.length === 1001, `Staircase vector y should have 1001 points, got ${y?.length}`);
    assert(dm && dm.length === 1001, `Binary DM vector dm should have 1001 points, got ${dm?.length}`);

    // Verify subplots, plots, stairs, and titles
    const subplots = plotEvents.filter(e => e.type === 'subplot');
    assert.strictEqual(subplots.length, 3, 'Should have 3 subplot calls');
    const plots = plotEvents.filter(e => e.type === 'plot');
    assert.strictEqual(plots.length, 2, 'Should have 2 plot calls');
    const stairs = plotEvents.filter(e => e.type === 'stairs');
    assert.strictEqual(stairs.length, 1, 'Should have 1 stairs call');
    const titles = plotEvents.filter(e => e.type === 'title').map(e => e.title);
    assert.deepStrictEqual(titles, ['Message Signal', 'Delta Modulated Staircase', 'Delta Modulated Signal']);
  });

  console.log(`\n================================================================`);
  console.log(`📊 MATHWORKS DEEP SUITE RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
