/**
 * MULTISIM LIVE EDA PLATFORM - OSCILLATOR VALIDATION SUITE
 * 
 * Verifies spontaneous startup, sustained limit cycles, and zero latch-up
 * across all major oscillator topologies created from scratch:
 * 
 * 1. Op-Amp Relaxation Oscillator (Square Wave Astable)
 * 2. Op-Amp Wien Bridge Oscillator (Sinusoid)
 * 3. Op-Amp RC Phase Shift Oscillator (3-Stage Ladder Sinusoid from scratch)
 * 4. Symmetric Dual-BJT Astable Multivibrator (Cross-coupled BJT)
 * 5. Colpitts LC Tank Oscillator (Resonant RF Tank)
 * 6. 555 Timer Astable Multivibrator (NE555 Timer IC)
 * 7. Schmitt Trigger Inverter Oscillator (74HC14 RC Relaxation)
 * 8. Quartz Crystal Resonator (Butterworth-Van Dyke BVD Companion Model)
 */

import { CircuitEngine } from '../js/engine/circuit-engine.js';
import { ComponentTypes } from '../js/engine/components.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

console.log('======================================================================');
console.log('  OSCILLATOR DYNAMICS & SPONTANEOUS STARTUP VALIDATION SUITE');
console.log('======================================================================\n');

// --------------------------------------------------------------------
// TEST 1: Op-Amp Relaxation Oscillator (Astable Multivibrator)
// --------------------------------------------------------------------
{
  console.log('[Test 1] Op-Amp Relaxation Oscillator (Square Wave Generator)');
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

  eng.setCircuit([op, r1, r2, rf, c1, gnd], wires);
  let flips = 0;
  let lastSign = 0;
  let maxV = -Infinity;
  let minV = Infinity;

  for (let i = 0; i < 2000; i++) {
    eng.step(1e-5);
    const v = eng.getPinVoltage(op, 'out');
    maxV = Math.max(maxV, v);
    minV = Math.min(minV, v);
    const s = v > 2.0 ? 1 : (v < -2.0 ? -1 : 0);
    if (s !== 0 && s !== lastSign) {
      if (lastSign !== 0) flips++;
      lastSign = s;
    }
  }

  assert(flips >= 8, 'Op-Amp Relaxation Oscillator toggles continuously', `flips: ${flips}, expected >= 8`);
  assert(maxV > 13.5 && minV < -13.5, 'Op-Amp reaches full rail-to-rail saturation swings', `max: ${maxV.toFixed(2)}V, min: ${minV.toFixed(2)}V`);
}

// --------------------------------------------------------------------
// TEST 2: Op-Amp Wien Bridge Oscillator (Sinusoid)
// --------------------------------------------------------------------
{
  console.log('\n[Test 2] Op-Amp Wien Bridge Oscillator (Sinusoidal Generator)');
  const eng = new CircuitEngine();
  const op = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  const rSer = { id: 'R_SER', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const cSer = { id: 'C_SER', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-8 } };
  const rPar = { id: 'R_PAR', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const cPar = { id: 'C_PAR', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-8 } };
  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
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
  let flips = 0;
  let lastSign = 0;

  for (let i = 0; i < 2000; i++) {
    eng.step(1e-5);
    const v = eng.getPinVoltage(op, 'out');
    const s = v > 1.0 ? 1 : (v < -1.0 ? -1 : 0);
    if (s !== 0 && s !== lastSign) {
      if (lastSign !== 0) flips++;
      lastSign = s;
    }
  }

  assert(flips >= 10, 'Wien Bridge Oscillator oscillates cleanly without latch-up', `flips: ${flips}, expected >= 10`);
}

// --------------------------------------------------------------------
// TEST 3: Op-Amp RC Phase Shift Oscillator (Created from scratch with default uncharged caps)
// --------------------------------------------------------------------
{
  console.log('\n[Test 3] Op-Amp RC Phase Shift Oscillator (Scratch Circuit with 0V Caps)');
  const eng = new CircuitEngine();
  const opamp = { id: 'OP1', type: ComponentTypes.OPAMP, pins: [{ id: 'in_inv' }, { id: 'in_noninv' }, { id: 'out' }], params: { openLoopGain: 200000, vSatPos: 12, vSatNeg: -12, vOffset: 0.002 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  
  // Default uncharged capacitors placed from palette (no user initial conditions)
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 3300 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 3300 } };
  const c3 = { id: 'C3', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const rIn = { id: 'RIN', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 3300 } };
  const rf = { id: 'RF', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 150000 } };

  const wires = [
    { fromPin: 'OP1:in_noninv', toPin: 'GND:p1' },
    { fromPin: 'OP1:out', toPin: 'RF:p1' },
    { fromPin: 'RF:p2', toPin: 'OP1:in_inv' },
    { fromPin: 'OP1:out', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'GND:p1' },
    { fromPin: 'C1:p2', toPin: 'C2:p1' },
    { fromPin: 'C2:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'C2:p2', toPin: 'C3:p1' },
    { fromPin: 'C3:p2', toPin: 'RIN:p1' },
    { fromPin: 'RIN:p2', toPin: 'OP1:in_inv' }
  ];

  eng.setCircuit([opamp, gnd, c1, r1, c2, r2, c3, rIn, rf], wires);
  let flips = 0;
  let lastSign = 0;

  for (let i = 0; i < 8000; i++) {
    eng.step(1e-5);
    const v = eng.getPinVoltage(opamp, 'out');
    const s = v > 0.5 ? 1 : (v < -0.5 ? -1 : 0);
    if (s !== 0 && s !== lastSign) {
      if (lastSign !== 0) flips++;
      lastSign = s;
    }
  }

  assert(flips >= 5, 'RC Phase Shift spontaneously starts up and oscillates from scratch', `flips: ${flips}, expected >= 5`);
}

// --------------------------------------------------------------------
// TEST 4: Symmetric Dual-BJT Astable Multivibrator (Cross-coupled BJT)
// --------------------------------------------------------------------
{
  console.log('\n[Test 4] Symmetric Dual-BJT Astable Multivibrator (Symmetry-Breaking Startup)');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, pins: [{ id: 'p_pos' }, { id: 'p_neg' }], params: { voltage: 9 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  const rc1 = { id: 'RC1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };
  const rc2 = { id: 'RC2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };
  const rb1 = { id: 'RB1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
  const rb2 = { id: 'RB2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const q1 = { id: 'Q1', type: ComponentTypes.BJT_NPN, pins: [{ id: 'collector' }, { id: 'base' }, { id: 'emitter' }], params: { beta: 200 } };
  const q2 = { id: 'Q2', type: ComponentTypes.BJT_NPN, pins: [{ id: 'collector' }, { id: 'base' }, { id: 'emitter' }], params: { beta: 200 } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC1:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RB1:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RB2:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC2:p1' },
    { fromPin: 'RC1:p2', toPin: 'Q1:collector' },
    { fromPin: 'RC1:p2', toPin: 'C1:p1' },
    { fromPin: 'RC2:p2', toPin: 'Q2:collector' },
    { fromPin: 'RC2:p2', toPin: 'C2:p2' },
    { fromPin: 'RB1:p2', toPin: 'C2:p1' },
    { fromPin: 'RB1:p2', toPin: 'Q1:base' },
    { fromPin: 'RB2:p2', toPin: 'C1:p2' },
    { fromPin: 'RB2:p2', toPin: 'Q2:base' },
    { fromPin: 'Q1:emitter', toPin: 'GND:p1' },
    { fromPin: 'Q2:emitter', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vcc, gnd, rc1, rc2, rb1, rb2, c1, c2, q1, q2], wires);
  let flips = 0;
  let lastDiff = 0;

  for (let i = 0; i < 5000; i++) {
    eng.step(1e-5);
    if (i > 50) {
      const diff = eng.getPinVoltage(q1, 'collector') - eng.getPinVoltage(q2, 'collector');
      const s = diff > 2.0 ? 1 : (diff < -2.0 ? -1 : 0);
      if (s !== 0 && s !== lastDiff) {
        if (lastDiff !== 0) flips++;
        lastDiff = s;
      }
    }
  }

  assert(flips >= 20, 'Symmetric Dual-BJT Astable breaks symmetry and alternates continuously', `flips: ${flips}, expected >= 20`);
}

// --------------------------------------------------------------------
// TEST 5: Colpitts LC Tank Oscillator
// --------------------------------------------------------------------
{
  console.log('\n[Test 5] Colpitts LC Tank Oscillator (Capacitive Feedback Divider)');
  const eng = new CircuitEngine();
  const vcc = { id: 'VCC', type: ComponentTypes.DC_VOLTAGE, pins: [{ id: 'p_pos' }, { id: 'p_neg' }], params: { voltage: 12 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 22000 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 6800 } };
  const rc = { id: 'RC', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 2200 } };
  const re = { id: 'RE', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };
  const ce = { id: 'CE', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-5 } };
  const q1 = { id: 'Q1', type: ComponentTypes.BJT_NPN, pins: [{ id: 'collector' }, { id: 'base' }, { id: 'emitter' }], params: { beta: 100 } };
  const l1 = { id: 'L1', type: ComponentTypes.INDUCTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { inductance: 1e-4 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-8 } };
  const c2 = { id: 'C2', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const cc = { id: 'CC', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };

  const wires = [
    { fromPin: 'VCC:p_neg', toPin: 'GND:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'R1:p1' },
    { fromPin: 'VCC:p_pos', toPin: 'RC:p1' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R1:p2', toPin: 'Q1:base' },
    { fromPin: 'R2:p2', toPin: 'GND:p1' },
    { fromPin: 'RC:p2', toPin: 'Q1:collector' },
    { fromPin: 'Q1:collector', toPin: 'CC:p1' },
    { fromPin: 'CC:p2', toPin: 'L1:p1' },
    { fromPin: 'CC:p2', toPin: 'C1:p1' },
    { fromPin: 'L1:p2', toPin: 'GND:p1' },
    { fromPin: 'C1:p2', toPin: 'C2:p1' },
    { fromPin: 'C2:p2', toPin: 'GND:p1' },
    { fromPin: 'C1:p2', toPin: 'Q1:emitter' },
    { fromPin: 'Q1:emitter', toPin: 'RE:p1' },
    { fromPin: 'RE:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vcc, gnd, r1, r2, rc, re, q1, l1, c1, c2, cc], wires);
  const samples = [];
  for (let i = 0; i < 2000; i++) {
    eng.step(1e-7);
    if (i % 50 === 0) {
      samples.push(eng.getPinVoltage(q1, 'collector'));
    }
  }

  const vMax = Math.max(...samples);
  const vMin = Math.min(...samples);
  const vSwing = vMax - vMin;

  assert(vSwing > 1.5, 'Colpitts oscillator starts spontaneously and produces large AC swing', `Vpp: ${vSwing.toFixed(2)}V, max: ${vMax.toFixed(2)}V, min: ${vMin.toFixed(2)}V`);
}

// --------------------------------------------------------------------
// TEST 6: 555 Timer Astable Multivibrator
// --------------------------------------------------------------------
{
  console.log('\n[Test 6] 555 Timer Astable Multivibrator');
  const eng = new CircuitEngine();
  const vcc = { id: 'V1', type: ComponentTypes.DC_VOLTAGE, pins: [{ id: 'p_pos' }, { id: 'p_neg' }], params: { voltage: 9 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const r2 = { id: 'R2', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 47000 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const timer = { id: 'timer', type: ComponentTypes.TIMER555, pins: [
    { id: 'gnd' }, { id: 'trig' }, { id: 'out' }, { id: 'reset' },
    { id: 'ctrl' }, { id: 'thresh' }, { id: 'disch' }, { id: 'vcc' }
  ], params: {} };

  const wires = [
    { fromPin: 'V1:p_neg', toPin: 'GND:p1' },
    { fromPin: 'timer:gnd', toPin: 'GND:p1' },
    { fromPin: 'V1:p_pos', toPin: 'timer:vcc' },
    { fromPin: 'V1:p_pos', toPin: 'timer:reset' },
    { fromPin: 'V1:p_pos', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'timer:disch' },
    { fromPin: 'R1:p2', toPin: 'R2:p1' },
    { fromPin: 'R2:p2', toPin: 'timer:thresh' },
    { fromPin: 'R2:p2', toPin: 'timer:trig' },
    { fromPin: 'R2:p2', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vcc, gnd, r1, r2, c1, timer], wires);
  let flips = 0;
  let lastState = false;

  for (let i = 0; i < 2000; i++) {
    eng.step(1e-5);
    const isHigh = eng.getPinVoltage(timer, 'out') > 4.0;
    if (isHigh !== lastState) {
      flips++;
      lastState = isHigh;
    }
  }

  assert(flips >= 4, '555 Timer Astable Multivibrator produces continuous clock pulse train', `flips: ${flips}, expected >= 4`);
}

// --------------------------------------------------------------------
// TEST 7: Schmitt Trigger Inverter Oscillator (74HC14 RC Relaxation)
// --------------------------------------------------------------------
{
  console.log('\n[Test 7] Schmitt Trigger Inverter Oscillator (74HC14)');
  const eng = new CircuitEngine();
  const st = { id: 'ST1', type: ComponentTypes.SCHMITT_TRIGGER, pins: [{ id: 'in' }, { id: 'out' }], params: { vHigh: 5, vLow: 0, isInverting: true } };
  const r1 = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 10000 } };
  const c1 = { id: 'C1', type: ComponentTypes.CAPACITOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { capacitance: 1e-7 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const wires = [
    { fromPin: 'ST1:out', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'ST1:in' },
    { fromPin: 'ST1:in', toPin: 'C1:p1' },
    { fromPin: 'C1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([st, r1, c1, gnd], wires);
  let flips = 0;
  let lastState = false;

  for (let i = 0; i < 2000; i++) {
    eng.step(1e-5);
    const isHigh = eng.getPinVoltage(st, 'out') > 2.5;
    if (isHigh !== lastState) {
      flips++;
      lastState = isHigh;
    }
  }

  assert(flips >= 30, 'Schmitt Trigger Inverter Oscillator toggles with clean hysteresis timing', `flips: ${flips}, expected >= 30`);
}

// --------------------------------------------------------------------
// TEST 8: Quartz Crystal Resonator (Butterworth-Van Dyke BVD Model)
// --------------------------------------------------------------------
{
  console.log('\n[Test 8] Quartz Crystal Resonator (BVD Model Resonance)');
  const eng = new CircuitEngine();
  const vSrc = { id: 'V1', type: ComponentTypes.AC_VOLTAGE, pins: [{ id: 'p_pos' }, { id: 'p_neg' }], params: { amplitude: 5.0, frequency: 4e6 } };
  const rSrc = { id: 'R1', type: ComponentTypes.RESISTOR, pins: [{ id: 'p1' }, { id: 'p2' }], params: { resistance: 1000 } };
  const xtal = { id: 'XTAL1', type: ComponentTypes.CRYSTAL, pins: [{ id: 'p1' }, { id: 'p2' }], params: { frequency: 4e6, rm: 25, c0: 4e-12, cm: 1e-14 } };
  const gnd = { id: 'GND', type: ComponentTypes.GROUND, pins: [{ id: 'p1' }], params: {} };

  const wires = [
    { fromPin: 'V1:p_neg', toPin: 'GND:p1' },
    { fromPin: 'V1:p_pos', toPin: 'R1:p1' },
    { fromPin: 'R1:p2', toPin: 'XTAL1:p1' },
    { fromPin: 'XTAL1:p2', toPin: 'GND:p1' }
  ];

  eng.setCircuit([vSrc, rSrc, xtal, gnd], wires);
  let maxV = -Infinity;
  let minV = Infinity;

  // Run at 4MHz step dt = 1e-8 (10ns)
  for (let i = 0; i < 500; i++) {
    eng.step(1e-8);
    const v = eng.getPinVoltage(xtal, 'p1');
    maxV = Math.max(maxV, v);
    minV = Math.min(minV, v);
  }

  const vSwing = maxV - minV;
  assert(vSwing > 0.05, 'Quartz Crystal Resonator reacts dynamically with BVD piezoelectric companion model', `vSwing: ${vSwing.toFixed(4)}V`);
  assert(!isNaN(maxV) && isFinite(maxV), 'Crystal simulation is numerically stable with 0 NaN / 0 divergence');
}

console.log('\n======================================================================');
console.log(`OSCILLATOR VALIDATION SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ ALL OSCILLATOR CLASSES VERIFIED WORKING SPONTANEOUSLY OUT-OF-THE-BOX!\n');
}
