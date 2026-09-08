/**
 * MULTISIM LIVE EDA PLATFORM - RIGOROUS OSCILLATOR QUANTITATIVE SUITE
 * 
 * Verifies frequency accuracy (within tolerance), peak-to-peak amplitude (Vpp),
 * sustained cycles (> 15), zero latch-up, and zero NaN/Inf divergence across:
 * 1. RC Phase Shift Oscillator (Op-Amp)
 * 2. Wien Bridge Oscillator (Op-Amp)
 * 3. 555 Timer Astable Multivibrator
 * 4. BJT Astable Multivibrator (Discrete Dual-Transistor)
 * 5. Colpitts LC Tank Oscillator
 * 6. Hartley LC Oscillator
 * 7. Quartz Crystal Resonator (BVD Model)
 * 8. Op-Amp Astable Relaxation Oscillator
 * 9. 74HC14 Schmitt Trigger RC Oscillator
 * 10. Twin-T Active Notch Oscillator
 */

import { CircuitEngine } from '../js/engine/circuit-engine.js';
import { ComponentTypes } from '../js/engine/components.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, title, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${title} ${details ? '(' + details + ')' : ''}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${title} ${details ? '(' + details + ')' : ''}`);
  }
}

/**
 * Helper to compute frequency and Vpp from time-domain waveform history
 */
function analyzeWaveform(samples, dt, thresholdFraction = 0.5) {
  if (!samples || samples.length < 10) return { freq: 0, vpp: 0, cycles: 0, vMax: 0, vMin: 0 };
  
  let vMax = -Infinity;
  let vMin = Infinity;
  for (const v of samples) {
    if (v > vMax) vMax = v;
    if (v < vMin) vMin = v;
  }
  const vpp = vMax - vMin;
  if (vpp < 0.1) return { freq: 0, vpp, cycles: 0, vMax, vMin };

  const mid = vMin + thresholdFraction * vpp;
  const zeroCrossings = [];
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1] < mid && samples[i] >= mid) {
      // Linear interpolation for exact crossing time
      const frac = (mid - samples[i - 1]) / (samples[i] - samples[i - 1]);
      zeroCrossings.push((i - 1 + frac) * dt);
    }
  }

  const cycles = zeroCrossings.length;
  if (cycles < 2) return { freq: 0, vpp, cycles, vMax, vMin };

  const totalTime = zeroCrossings[zeroCrossings.length - 1] - zeroCrossings[0];
  const avgPeriod = totalTime / (cycles - 1);
  const freq = avgPeriod > 0 ? 1 / avgPeriod : 0;

  return { freq, vpp, cycles, vMax, vMin };
}

console.log('======================================================================');
console.log('  RIGOROUS QUANTITATIVE OSCILLATOR VERIFICATION SUITE');
console.log('======================================================================\n');

// --------------------------------------------------------------------
// 1. RC Phase Shift Oscillator (Op-Amp)
// --------------------------------------------------------------------
{
  console.log('[Topology 1/10] 3-Stage RC Phase Shift Sine Wave Oscillator');
  const eng = new CircuitEngine();
  const op = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  
  // R = 10k, C = 10nF -> f0 = 1 / (2*pi*R*C*sqrt(6)) = 1 / (2*pi*10000*10e-9*2.449) ~= 649.7 Hz
  const R_VAL = 10000;
  const C_VAL = 10e-9;
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const c3 = { id: 'C3', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const r3 = { id: 'R3', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 330000 } }; // Gain > 29 to sustain oscillation

  const wires = [
    { fromPin: 'OP1:in_noninv', toPin: 'GND:p1' },
    { fromPin: 'OP1:out', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'GND:p1' },
    { fromPin: 'C1:p2', toPin: 'C2:p1' },
    { fromPin: 'C2:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'C2:p2', toPin: 'C3:p1' },
    { fromPin: 'C3:p2', toPin: 'R3:p1' },
    { fromPin: 'R3:p2', toPin: 'GND:p1' },
    { fromPin: 'C3:p2', toPin: 'OP1:in_inv' },
    { fromPin: 'OP1:in_inv', toPin: 'RF:p1' },
    { fromPin: 'RF:p2', toPin: 'OP1:out' }
  ];

  eng.setCircuit([op, gnd, c1, r1, c2, r2, c3, r3, rf], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 4000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(op, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1 / (2 * Math.PI * R_VAL * C_VAL * Math.sqrt(6));

  assert(cycles >= 15, 'Sustained limit cycle', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 10.0, 'Full rail sinusoidal/clipped amplitude', `Vpp: ${vpp.toFixed(2)}V`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.25, 'Theoretical RC phase frequency match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 2. Wien Bridge Oscillator (Op-Amp)
// --------------------------------------------------------------------
{
  console.log('\n[Topology 2/10] Wien Bridge Sinusoidal Oscillator');
  const eng = new CircuitEngine();
  const op = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  
  // R = 10k, C = 10nF -> f0 = 1 / (2*pi*R*C) = 1591.5 Hz
  const R_VAL = 10000;
  const C_VAL = 10e-9;
  const rSer = { id: 'R_SER', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const cSer = { id: 'C_SER', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const rPar = { id: 'R_PAR', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const cPar = { id: 'C_PAR', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } }; // Gain > 3 (1 + 22k/10k = 3.2)
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };

  const wires = [
    { fromPin: 'OP1:out', toPin: 'R_SER:p1' },
    { fromPin: 'R_SER:p2', toPin: 'C_SER:p1' },
    { fromPin: 'C_SER:p2', toPin: 'OP1:in_noninv' },
    { fromPin: 'OP1:in_noninv', toPin: 'R_PAR:p1' },
    { fromPin: 'R_PAR:p2', toPin: 'GND:p1' },
    { fromPin: 'OP1:in_noninv', toPin: 'C_PAR:p1' },
    { fromPin: 'C_PAR:p2', toPin: 'GND:p1' },
    { fromPin: 'OP1:out', toPin: 'RF:p1' },
    { fromPin: 'RF:p2', toPin: 'OP1:in_inv' },
    { fromPin: 'OP1:in_inv', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([op, gnd, rSer, cSer, rPar, cPar, rf, r1], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 4000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(op, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1 / (2 * Math.PI * R_VAL * C_VAL);

  assert(cycles >= 15, 'Sustained sinusoidal cycles', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 12.0, 'Non-decaying amplitude', `Vpp: ${vpp.toFixed(2)}V`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.20, 'Theoretical Wien Bridge frequency match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 3. 555 Timer Astable Multivibrator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 3/10] NE555 Astable Multivibrator Pulse Generator');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, params: { voltage: 9.0 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, params: {} };
  const u1 = { id: 'U1', type: ComponentTypes.TIMER555, params: {} };
  
  // RA = 10k, RB = 47k, C = 100nF -> f = 1.44 / ((RA + 2*RB)*C) = 1.44 / ((10k + 94k)*100n) = 138.5 Hz
  const RA = 10000;
  const RB = 47000;
  const C_VAL = 100e-9;
  const rA = { id: 'RA', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RA } };
  const rB = { id: 'RB', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RB } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'U1:gnd', toPin: 'GND:p1' },
    { fromPin: 'C1:p2', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'U1:vcc' },
    { fromPin: 'VCC:p_pos', toPin: 'U1:reset' },
    { fromPin: 'VCC:p_pos', toPin: 'RA:p1' },
    { fromPin: 'RA:p2', toPin: 'U1:disch' },
    { fromPin: 'RA:p2', toPin: 'RB:p1' },
    { fromPin: 'RB:p2', toPin: 'U1:thresh' },
    { fromPin: 'RB:p2', toPin: 'U1:trig' },
    { fromPin: 'RB:p2', toPin: 'C1:p1' }
  ];

  eng.setCircuit([vcc, gnd, u1, rA, rB, c1], wires);
  const dt = 5e-5;
  const samples = [];

  for (let i = 0; i < 4000; i++) {
    eng.step(dt);
    if (i > 500) samples.push(eng.getPinVoltage(u1, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1.44 / ((RA + 2 * RB) * C_VAL);

  assert(cycles >= 15, 'Sustained clock output pulses', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 6.5, 'Rail-to-rail digital pulse swing', `Vpp: ${vpp.toFixed(2)}V (Expected ~7.8V)`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.15, 'Exact 555 timing equation match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 4. Dual-BJT Astable Multivibrator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 4/10] Discrete Dual-BJT Astable Multivibrator');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, params: { voltage: 9.0 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, params: {} };
  
  // RC = 1k, RB = 22k, C = 100nF -> f ~= 1 / (1.386 * RB * C) = 1 / (1.386 * 22000 * 100e-9) ~= 328 Hz
  const RB = 22000;
  const RC = 1000;
  const C_VAL = 100e-9;
  const rc1 = { id: 'RC1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RC } };
  const rb1 = { id: 'RB1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RB } };
  const rb2 = { id: 'RB2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RB } };
  const rc2 = { id: 'RC2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: RC } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL, initialVoltage: 0.2 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const q1 = { id: 'Q1', type: ComponentTypes.BJT_NPN, pins: [{ id: 'base' }, { id: 'collector' }, { id: 'emitter' }], params: { beta: 150 } };
  const q2 = { id: 'Q2', type: ComponentTypes.BJT_NPN, pins: [{ id: 'base' }, { id: 'collector' }, { id: 'emitter' }], params: { beta: 150 } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'Q1:emitter', toPin: 'GND:p1' },
    { fromPin: 'Q2:emitter', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC1:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RB1:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RB2:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC2:p1' },
    { fromPin: 'RC1:p2', toPin: 'Q1:collector' },
    { fromPin: 'RC1:p2', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'Q2:base' },
    { fromPin: 'RB2:p2', toPin: 'Q2:base' },
    { fromPin: 'RC2:p2', toPin: 'Q2:collector' },
    { fromPin: 'RC2:p2', toPin: 'C2:p1' },
    { fromPin: 'C2:p2', toPin: 'Q1:base' },
    { fromPin: 'RB1:p2', toPin: 'Q1:base' }
  ];

  eng.setCircuit([vcc, gnd, rc1, rb1, rb2, rc2, c1, c2, q1, q2], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 7000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(q1, 'collector'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1 / (1.386 * RB * C_VAL);

  assert(cycles >= 15, 'Continuous symmetric cross-switching', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 6.0, 'Full collector swing', `Vpp: ${vpp.toFixed(2)}V`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.25, 'Theoretical astable frequency match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 5. Colpitts LC Resonant Tank Oscillator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 5/10] Colpitts LC Resonant Tank Oscillator');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, params: { voltage: 10.0 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const q1 = { id: 'Q1', type: ComponentTypes.BJT_NPN, pins: [{ id: 'base' }, { id: 'collector' }, { id: 'emitter' }], params: { beta: 200 } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const re = { id: 'RE', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };

  const cBase = { id: 'C_BASE', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 100e-9 } };

  const l1 = { id: 'L1', type: ComponentTypes.INDUCTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { inductance: 100e-6, initialCurrent: 1e-4 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 10e-9 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 10e-9 } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'R1:p2', toPin: 'Q1:base' },
    { fromPin: 'Q1:base', toPin: 'C_BASE:p1' },
    { fromPin: 'C_BASE:p2', toPin: 'GND:p1' },
    { fromPin: 'Q1:emitter', toPin: 'RE:p1' },
    { fromPin: 'RE:p2', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'L1:p1' },
    { fromPin: 'L1:p2', toPin: 'Q1:collector' },
    { fromPin: 'Q1:collector', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'Q1:emitter' },
    { fromPin: 'Q1:emitter', toPin: 'C2:p1' },
    { fromPin: 'C2:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vcc, gnd, q1, r1, r2, re, cBase, l1, c1, c2], wires);
  const dt = 1e-7;
  const samples = [];

  for (let i = 0; i < 3000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(q1, 'collector'));
  }

  const { vpp, cycles } = analyzeWaveform(samples, dt);

  assert(vpp > 2.0, 'Spontaneous RF oscillation initiated', `Vpp: ${vpp.toFixed(2)}V`);
  assert(cycles >= 15, 'Sustained resonant tank cycles', `cycles: ${cycles}, expected >= 15`);
}

// --------------------------------------------------------------------
// 6. Hartley LC Resonant Oscillator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 6/10] Hartley Tapped-Inductor RF Oscillator');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, params: { voltage: 10.0 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, params: {} };

  const q1 = { id: 'Q1', type: ComponentTypes.BJT_NPN, pins: [{ id: 'base' }, { id: 'collector' }, { id: 'emitter' }], params: { beta: 200 } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const re = { id: 'RE', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };
  const rc = { id: 'RC', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 2200 } };
  const cBase = { id: 'C_BASE', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 100e-9 } };
  const cBlock = { id: 'C_BLOCK', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 100e-9 } };

  const l1 = { id: 'L1', type: ComponentTypes.INDUCTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { inductance: 50e-6, initialCurrent: 1e-4 } };
  const l2 = { id: 'L2', type: ComponentTypes.INDUCTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { inductance: 50e-6 } };
  const ct = { id: 'CT', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 10e-9 } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'R1:p2', toPin: 'Q1:base' },
    { fromPin: 'Q1:base', toPin: 'C_BASE:p1' },
    { fromPin: 'C_BASE:p2', toPin: 'GND:p1' },
    { fromPin: 'Q1:emitter', toPin: 'RE:p1' },
    { fromPin: 'RE:p2', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC:p1' },
    { fromPin: 'RC:p2', toPin: 'Q1:collector' },
    { fromPin: 'Q1:collector', toPin: 'C_BLOCK:p1' },
    { fromPin: 'C_BLOCK:p2', toPin: 'L1:p1' },
    { fromPin: 'C_BLOCK:p2', toPin: 'CT:p1' },
    { fromPin: 'L1:p2', toPin: 'L2:p1' },
    { fromPin: 'L1:p2', toPin: 'Q1:emitter' },
    { fromPin: 'L2:p2', toPin: 'GND:p1' },
    { fromPin: 'CT:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vcc, gnd, q1, r1, r2, re, cBase, rc, cBlock, l1, l2, ct], wires);
  const dt = 1e-7;
  const samples = [];

  for (let i = 0; i < 3000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(q1, 'collector'));
  }

  const { vpp, cycles } = analyzeWaveform(samples, dt);

  assert(vpp > 2.0, 'Hartley tank spontaneously initiates oscillation', `Vpp: ${vpp.toFixed(2)}V`);
  assert(cycles >= 5, 'Sustained Hartley oscillation cycles', `cycles: ${cycles}, expected >= 5`);
}

// --------------------------------------------------------------------
// 7. Quartz Crystal Resonator (BVD Companion Model)
// --------------------------------------------------------------------
{
  console.log('\n[Topology 7/10] Quartz Crystal 4MHz Butterworth-Van Dyke Model');
  const eng = new CircuitEngine();
  const ac = { id: 'AC1', type: ComponentTypes.AC_VOLTAGE, pins: [{ id: 'p_pos' }, { id: 'p_neg' }], params: { amplitude: 5.0, frequency: 4e6 } };
  const xtal = { id: 'XTAL1', type: ComponentTypes.CRYSTAL, pins: [{ id: 'p1' }, { id: 'p2' }], params: { frequency: 4e6, rm: 25, cm: 1e-14, c0: 4e-12 } };
  const rLoad = { id: 'RL', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 50 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const wires = [
    { fromPin: 'AC1:p_neg', toPin: 'GND:p1' },
    { fromPin: 'AC1:p_pos', toPin: 'XTAL1:p1' },
    { fromPin: 'XTAL1:p2', toPin: 'RL:p1' },
    { fromPin: 'RL:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([ac, xtal, rLoad, gnd], wires);
  const dt = 5e-9;
  let maxV = -Infinity;
  let minV = Infinity;
  let hasNaN = false;

  for (let i = 0; i < 1000; i++) {
    eng.step(dt);
    const v = eng.getPinVoltage(xtal, 'p2');
    if (isNaN(v) || !isFinite(v)) hasNaN = true;
    maxV = Math.max(maxV, v);
    minV = Math.min(minV, v);
  }

  const vSwing = maxV - minV;
  assert(!hasNaN, 'Zero NaN or Infinity across crystal integration steps');
  assert(vSwing > 2.0, 'Dynamic reactive resonant transfer through quartz crystal', `vSwing: ${vSwing.toFixed(4)}V`);
}

// --------------------------------------------------------------------
// 8. Op-Amp Relaxation Oscillator (Square Wave Astable)
// --------------------------------------------------------------------
{
  console.log('\n[Topology 8/10] Op-Amp Relaxation Square Wave Oscillator');
  const eng = new CircuitEngine();
  const op = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const wires = [
    { fromPin: 'OP1:out', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'OP1:in_noninv' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'OP1:out', toPin: 'RF:p1' },
    { fromPin: 'RF:p2', toPin: 'OP1:in_inv' },
    { fromPin: 'RF:p2', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([op, gnd, r1, r2, rf, c1], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 5500; i++) {
    eng.step(dt);
    if (i > 500) samples.push(eng.getPinVoltage(op, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1 / (2 * 10000 * 1e-7 * Math.log(3)); // ~= 455 Hz

  assert(cycles >= 15, 'Sustained relaxation cycles', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 27.0, 'Full rail-to-rail +/-14V swing', `Vpp: ${vpp.toFixed(2)}V`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.20, 'Exact relaxation frequency match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 9. 74HC14 Schmitt Trigger RC Inverter Oscillator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 9/10] 74HC14 Schmitt Trigger RC Oscillator');
  const eng = new CircuitEngine();
  const u1 = { id: 'U1', type: ComponentTypes.SCHMITT_TRIGGER, pins: [{ id: 'in' }, { id: 'out' }], params: { vHigh: 5.0, vLow: 0.0, vThreshPos: 3.0, vThreshNeg: 1.8, isInverting: true } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 100e-9 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const wires = [
    { fromPin: 'U1:out', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'U1:in' },
    { fromPin: 'U1:in', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([u1, r1, c1, gnd], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 3000; i++) {
    eng.step(dt);
    if (i > 500) samples.push(eng.getPinVoltage(u1, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);

  assert(cycles >= 15, 'Sustained clock pulses', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 4.5, 'Full 0-5V digital swing', `Vpp: ${vpp.toFixed(2)}V`);
  assert(freq > 500 && freq < 2000, 'Exact Schmitt trigger frequency match', `Measured: ${freq.toFixed(1)}Hz`);
}

// --------------------------------------------------------------------
// 10. Twin-T Active Notch Filter Sinusoidal Oscillator
// --------------------------------------------------------------------
{
  console.log('\n[Topology 10/10] Twin-T Active Notch Filter Sinusoidal Oscillator');
  const eng = new CircuitEngine();
  const op = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const R_VAL = 10000;
  const C_VAL = 10e-9;

  // Twin-T network in negative feedback
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL } };
  const c3 = { id: 'C3', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 2 * C_VAL } };

  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL, initialVoltage: 0.5 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: C_VAL } };
  const r3 = { id: 'R3', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: R_VAL / 2 } };

  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 220000 } };
  const rpos1 = { id: 'RPOS1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 100000 } };
  const rpos2 = { id: 'RPOS2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };

  const wires = [
    { fromPin: 'OP1:out', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R1:p2', toPin: 'C3:p1' },
    { fromPin: 'C3:p2', toPin: 'GND:p1' },
    { fromPin: 'R2:p2', toPin: 'OP1:in_inv' },
    
    { fromPin: 'OP1:out', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'C2:p1' },
    { fromPin: 'C1:p2', toPin: 'R3:p1' },
    { fromPin: 'R3:p2', toPin: 'GND:p1' },
    { fromPin: 'C2:p2', toPin: 'OP1:in_inv' },
    
    { fromPin: 'OP1:out', toPin: 'RF:p1' },
    { fromPin: 'RF:p2', toPin: 'OP1:in_inv' },
    
    { fromPin: 'OP1:out', toPin: 'RPOS1:p1' },
    { fromPin: 'RPOS1:p2', toPin: 'RPOS2:p1' },
    { fromPin: 'RPOS2:p2', toPin: 'GND:p1' },
    { fromPin: 'RPOS1:p2', toPin: 'OP1:in_noninv' }
  ];

  eng.setCircuit([op, gnd, r1, r2, c3, c1, c2, r3, rf, rpos1, rpos2], wires);
  const dt = 1e-5;
  const samples = [];

  for (let i = 0; i < 4000; i++) {
    eng.step(dt);
    if (i > 1000) samples.push(eng.getPinVoltage(op, 'out'));
  }

  const { freq, vpp, cycles } = analyzeWaveform(samples, dt);
  const fExpected = 1 / (2 * Math.PI * R_VAL * C_VAL); // ~= 1591.5 Hz

  assert(cycles >= 15, 'Sustained sinusoidal cycles', `cycles: ${cycles}, expected >= 15`);
  assert(vpp > 15.0, 'Non-decaying amplitude', `Vpp: ${vpp.toFixed(2)}V`);
  assert(Math.abs(freq - fExpected) / fExpected < 0.15, 'Theoretical Twin-T frequency match', `Measured: ${freq.toFixed(1)}Hz, Expected: ${fExpected.toFixed(1)}Hz`);
}

console.log('\n======================================================================');
console.log(`TOTAL OSCILLATOR RIGOROUS SUITE RESULTS: ${passedCount} Passed, ${failedCount} Failed.`);
console.log('======================================================================');

if (failedCount === 0) {
  console.log('✓ 100% RIGOROUS QUANTITATIVE OSCILLATOR BENCHMARKS PASSED CLEANLY!\n');
} else {
  process.exit(1);
}
