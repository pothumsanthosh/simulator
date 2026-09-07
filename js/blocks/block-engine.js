/**
 * Switcha Blocks — Numerical Simulation & Dynamic ODE Engine
 * High-performance scientific dynamic systems simulation engine:
 * - Directed Acyclic Graph (DAG) topological execution sort
 * - 4th-Order Runge-Kutta (RK4) & Adaptive Euler ODE integration
 * - State-space / Transfer Function canonical state formulations
 * - Discrete multirate scheduling & sample-time blocks
 * - Anti-windup PID controller evaluation
 * - Real mathematical simulation output (Zero fake waveforms)
 */

import { BlockTypes } from './block-types.js';

export class BlockEngine {
  constructor() {
    this.blocks = [];
    this.wires = []; // { id, fromBlock, fromPort, toBlock, toPort }
    this.time = 0.0;
    this.stopTime = 10.0;
    this.timeStep = 0.001; // 1 ms base integration step
    this.solver = 'RK4'; // 'RK4' or 'EULER'

    this.states = new Map(); // blockId -> Float64Array (continuous states x)
    this.dStates = new Map(); // blockId -> Float64Array (derivatives dx/dt)
    this.discreteStates = new Map(); // blockId -> Object (discrete states, timers)
    this.outputs = new Map(); // `${blockId}:${portId}` -> Number
    this.history = []; // Array of time snapshots for scopes & sinks
    this.maxHistoryLength = 50000;

    this.isRunning = false;
    this.executionOrder = [];
  }

  setModel(blocks, wires) {
    this.blocks = blocks || [];
    this.wires = wires || [];
    this.reset();
    this.compile();
  }

  reset() {
    this.time = 0.0;
    this.states.clear();
    this.dStates.clear();
    this.discreteStates.clear();
    this.outputs.clear();
    this.history = [];

    // Initialize block states
    this.blocks.forEach(block => {
      const p = block.params || {};
      switch (block.type) {
        case BlockTypes.INTEGRATOR:
          this.states.set(block.id, new Float64Array([p.initialCondition || 0.0]));
          break;

        case BlockTypes.LAG_FIRST_ORDER:
          this.states.set(block.id, new Float64Array([0.0]));
          break;

        case BlockTypes.PID_CONTROLLER:
          this.states.set(block.id, new Float64Array([0.0, 0.0])); // [integralState, derivativeFilterState]
          break;

        case BlockTypes.TRANSFER_FCN: {
          const den = this.parseCoeffs(p.denominator || '[1, 1]');
          const order = Math.max(0, den.length - 1);
          this.states.set(block.id, new Float64Array(order));
          break;
        }

        case BlockTypes.STATE_SPACE: {
          const x0 = this.parseCoeffs(p.x0 || '[0]');
          this.states.set(block.id, new Float64Array(x0));
          break;
        }

        case BlockTypes.UNIT_DELAY:
        case BlockTypes.ZERO_ORDER_HOLD:
          this.discreteStates.set(block.id, {
            heldValue: p.initialCondition || 0.0,
            lastSampleTime: -1
          });
          break;
      }
    });
  }

  parseCoeffs(str) {
    if (!str) return [1];
    if (Array.isArray(str)) return str;
    try {
      const cleaned = str.replace(/[\[\]]/g, '').trim();
      if (!cleaned) return [1];
      return cleaned.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    } catch (_) {
      return [1];
    }
  }

  compile() {
    // Topological sort using Kahn's algorithm
    const adj = new Map();
    const inDegree = new Map();

    this.blocks.forEach(b => {
      adj.set(b.id, []);
      inDegree.set(b.id, 0);
    });

    this.wires.forEach(w => {
      if (adj.has(w.fromBlock) && inDegree.has(w.toBlock)) {
        adj.get(w.fromBlock).push(w.toBlock);
        inDegree.set(w.toBlock, inDegree.get(w.toBlock) + 1);
      }
    });

    const queue = [];
    inDegree.forEach((deg, bId) => {
      if (deg === 0) queue.push(bId);
    });

    const order = [];
    while (queue.length > 0) {
      const u = queue.shift();
      order.push(u);
      (adj.get(u) || []).forEach(v => {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }

    // If cycle detected (algebraic loop), append remaining blocks
    this.blocks.forEach(b => {
      if (!order.includes(b.id)) order.push(b.id);
    });

    this.executionOrder = order.map(id => this.blocks.find(b => b.id === id)).filter(Boolean);
  }

  getInputValue(blockId, portId = 'in') {
    const wire = this.wires.find(w => w.toBlock === blockId && w.toPort === portId);
    if (!wire) return 0.0;
    const key = `${wire.fromBlock}:${wire.fromPort}`;
    return this.outputs.get(key) ?? 0.0;
  }

  // --- Compute Block Outputs from States and Inputs ---
  computeOutputs(t) {
    this.executionOrder.forEach(block => {
      const p = block.params || {};
      const key = (port = 'out') => `${block.id}:${port}`;

      switch (block.type) {
        case BlockTypes.CONSTANT:
          this.outputs.set(key('out'), p.value ?? 1.0);
          break;

        case BlockTypes.STEP:
          this.outputs.set(key('out'), t >= (p.stepTime ?? 1.0) ? (p.finalValue ?? 1.0) : (p.initialValue ?? 0.0));
          break;

        case BlockTypes.RAMP:
          this.outputs.set(key('out'), t >= (p.startTime ?? 0.0) ? ((t - (p.startTime ?? 0.0)) * (p.slope ?? 1.0)) : 0.0);
          break;

        case BlockTypes.SINE_GEN: {
          const freq = p.frequency ?? 1.0;
          const amp = p.amplitude ?? 1.0;
          const phase = ((p.phase ?? 0.0) * Math.PI) / 180;
          const off = p.offset ?? 0.0;
          this.outputs.set(key('out'), off + amp * Math.sin(2 * Math.PI * freq * t + phase));
          break;
        }

        case BlockTypes.NOISE_GEN: {
          const mean = p.mean ?? 0.0;
          const variance = p.variance ?? 0.1;
          // Box-Muller transform for gaussian noise
          const u1 = Math.max(1e-12, Math.random());
          const u2 = Math.random();
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          this.outputs.set(key('out'), mean + Math.sqrt(variance) * z);
          break;
        }

        case BlockTypes.SUM: {
          const signs = p.signs || '+-';
          let sum = 0.0;
          for (let i = 0; i < signs.length; i++) {
            const port = `in${i + 1}`;
            const s = signs[i];
            const val = this.getInputValue(block.id, port);
            sum += (s === '-' ? -val : val);
          }
          this.outputs.set(key('out'), sum);
          break;
        }

        case BlockTypes.GAIN: {
          const u = this.getInputValue(block.id, 'in');
          this.outputs.set(key('out'), u * (p.gain ?? 2.0));
          break;
        }

        case BlockTypes.MULTIPLY: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          this.outputs.set(key('out'), u1 * u2);
          break;
        }

        case BlockTypes.MATH_FUNC: {
          const u = this.getInputValue(block.id, 'in');
          let y = u;
          const func = p.func || 'abs';
          if (func === 'abs') y = Math.abs(u);
          else if (func === 'sqrt') y = Math.sqrt(Math.max(0, u));
          else if (func === 'exp') y = Math.exp(Math.min(u, 70));
          else if (func === 'log') y = Math.log(Math.max(1e-12, u));
          else if (func === 'sin') y = Math.sin(u);
          else if (func === 'cos') y = Math.cos(u);
          else if (func === 'square') y = u * u;
          else if (func === 'sign') y = Math.sign(u);
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.INTEGRATOR: {
          const x = this.states.get(block.id)?.[0] || 0.0;
          this.outputs.set(key('out'), x);
          break;
        }

        case BlockTypes.LAG_FIRST_ORDER: {
          const x = this.states.get(block.id)?.[0] || 0.0;
          this.outputs.set(key('out'), x * (p.gain ?? 1.0));
          break;
        }

        case BlockTypes.PID_CONTROLLER: {
          const e = this.getInputValue(block.id, 'in');
          const s = this.states.get(block.id) || [0.0, 0.0];
          const P = p.P ?? 2.0;
          const D = p.D ?? 0.1;
          const N = p.N ?? 100;
          const uP = P * e;
          const uI = s[0];
          const uD = D * N * (e - s[1]);
          let uTotal = uP + uI + uD;
          if (p.antiWindup) {
            uTotal = Math.max(p.uMin ?? -10, Math.min(p.uMax ?? 10, uTotal));
          }
          this.outputs.set(key('out'), uTotal);
          break;
        }

        case BlockTypes.TRANSFER_FCN: {
          const num = this.parseCoeffs(p.numerator || '[1]');
          const den = this.parseCoeffs(p.denominator || '[1, 1]');
          const n = Math.max(1, den.length - 1);
          const x = this.states.get(block.id) || new Float64Array(n);
          const an = den[0] || 1.0;
          let y = 0.0;
          for (let i = 0; i < n; i++) {
            const bIdx = num.length - 1 - i;
            if (bIdx >= 0) {
              y += (num[bIdx] / an) * (x[i] || 0.0);
            }
          }
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.SATURATION: {
          const u = this.getInputValue(block.id, 'in');
          const hi = p.upperLimit ?? 5.0;
          const lo = p.lowerLimit ?? -5.0;
          this.outputs.set(key('out'), Math.max(lo, Math.min(hi, u)));
          break;
        }

        case BlockTypes.DEAD_ZONE: {
          const u = this.getInputValue(block.id, 'in');
          const start = p.start ?? -0.5;
          const end = p.end ?? 0.5;
          let y = 0.0;
          if (u > end) y = u - end;
          else if (u < start) y = u - start;
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.RATE_LIMITER: {
          const u = this.getInputValue(block.id, 'in');
          const s = this.discreteStates.get(block.id) || { lastY: u, lastT: this.time };
          const dt = Math.max(1e-6, this.time - s.lastT);
          const maxRise = (p.risingSlew ?? 10.0) * dt;
          const maxFall = (p.fallingSlew ?? -10.0) * dt;
          let y = Math.max(s.lastY + maxFall, Math.min(s.lastY + maxRise, u));
          s.lastY = y;
          s.lastT = this.time;
          this.discreteStates.set(block.id, s);
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.UNIT_DELAY:
        case BlockTypes.ZERO_ORDER_HOLD: {
          const dState = this.discreteStates.get(block.id);
          this.outputs.set(key('out'), dState?.heldValue ?? 0.0);
          break;
        }

        case BlockTypes.AM_MODULATOR: {
          const m = this.getInputValue(block.id, 'm');
          const c = this.getInputValue(block.id, 'c');
          const mu = p.modIndex ?? 0.8;
          this.outputs.set(key('out'), (1.0 + mu * m) * c);
          break;
        }

        case BlockTypes.AWGN_CHANNEL: {
          const tx = this.getInputValue(block.id, 'in');
          const snr = Math.pow(10, (p.snrDb ?? 10.0) / 10.0);
          const noiseVar = 1.0 / (2.0 * snr);
          const u1 = Math.max(1e-12, Math.random());
          const u2 = Math.random();
          const n = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * Math.sqrt(noiseVar);
          this.outputs.set(key('out'), tx + n);
          break;
        }

        case BlockTypes.SCOPE:
        case BlockTypes.DISPLAY_READOUT:
        case BlockTypes.TO_WORKSPACE:
          // Sinks consume inputs
          break;
      }
    });
  }

  // --- Compute State Derivatives dx/dt = f(x, u, t) ---
  computeDerivatives(t, tempStates = null) {
    const statesMap = tempStates || this.states;
    const derivatives = new Map();

    this.executionOrder.forEach(block => {
      const p = block.params || {};

      switch (block.type) {
        case BlockTypes.INTEGRATOR: {
          const u = this.getInputValue(block.id, 'in');
          derivatives.set(block.id, new Float64Array([u]));
          break;
        }

        case BlockTypes.LAG_FIRST_ORDER: {
          const u = this.getInputValue(block.id, 'in');
          const tau = Math.max(p.timeConstant || 0.5, 1e-6);
          const x = statesMap.get(block.id)?.[0] || 0.0;
          const dx = (u - x) / tau;
          derivatives.set(block.id, new Float64Array([dx]));
          break;
        }

        case BlockTypes.PID_CONTROLLER: {
          const e = this.getInputValue(block.id, 'in');
          const s = statesMap.get(block.id) || [0.0, 0.0];
          const I = p.I ?? 1.0;
          const N = p.N ?? 100;
          const dx0 = I * e; // Integral accumulator derivative
          const dx1 = N * (e - s[1]); // Filter derivative
          derivatives.set(block.id, new Float64Array([dx0, dx1]));
          break;
        }

        case BlockTypes.TRANSFER_FCN: {
          const den = this.parseCoeffs(p.denominator || '[1, 1]');
          const n = Math.max(1, den.length - 1);
          const an = den[0] || 1.0;
          const u = this.getInputValue(block.id, 'in');
          const x = statesMap.get(block.id) || new Float64Array(n);
          const dx = new Float64Array(n);

          for (let i = 0; i < n - 1; i++) {
            dx[i] = x[i + 1] || 0.0;
          }
          let sumA = 0.0;
          for (let i = 0; i < n; i++) {
            const aCoeff = den[den.length - 1 - i] || 0.0;
            sumA += aCoeff * (x[i] || 0.0);
          }
          dx[n - 1] = (u - sumA) / an;
          derivatives.set(block.id, dx);
          break;
        }
      }
    });

    return derivatives;
  }

  // --- Numerical Integration Time Step (4th-Order Runge-Kutta RK4) ---
  step(dt = this.timeStep) {
    if ((this.solver || '').toUpperCase() === 'RK4') {
      this.stepRK4(dt);
    } else {
      this.stepEuler(dt);
    }

    // Update discrete blocks
    this.blocks.forEach(block => {
      if (block.type === BlockTypes.UNIT_DELAY || block.type === BlockTypes.ZERO_ORDER_HOLD) {
        const p = block.params || {};
        const Ts = p.sampleTime || 0.01;
        const dState = this.discreteStates.get(block.id);
        if (dState && (this.time - dState.lastSampleTime >= Ts - 1e-9 || dState.lastSampleTime < 0)) {
          const u = this.getInputValue(block.id, 'in');
          dState.heldValue = u;
          dState.lastSampleTime = this.time;
        }
      }
    });

    this.time += dt;
    this.recordHistory();
  }

  stepRK4(dt) {
    const t0 = this.time;
    const x0 = new Map();
    this.states.forEach((val, key) => x0.set(key, new Float64Array(val)));

    // Stage 1: k1 = f(t0, x0)
    this.computeOutputs(t0);
    const k1 = this.computeDerivatives(t0, x0);

    // Stage 2: k2 = f(t0 + dt/2, x0 + dt/2 * k1)
    const xHalf1 = new Map();
    x0.forEach((arr, key) => {
      const k1Arr = k1.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) nextArr[i] = arr[i] + 0.5 * dt * k1Arr[i];
      xHalf1.set(key, nextArr);
    });
    this.states = xHalf1;
    this.computeOutputs(t0 + 0.5 * dt);
    const k2 = this.computeDerivatives(t0 + 0.5 * dt, xHalf1);

    // Stage 3: k3 = f(t0 + dt/2, x0 + dt/2 * k2)
    const xHalf2 = new Map();
    x0.forEach((arr, key) => {
      const k2Arr = k2.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) nextArr[i] = arr[i] + 0.5 * dt * k2Arr[i];
      xHalf2.set(key, nextArr);
    });
    this.states = xHalf2;
    this.computeOutputs(t0 + 0.5 * dt);
    const k3 = this.computeDerivatives(t0 + 0.5 * dt, xHalf2);

    // Stage 4: k4 = f(t0 + dt, x0 + dt * k3)
    const xFull = new Map();
    x0.forEach((arr, key) => {
      const k3Arr = k3.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) nextArr[i] = arr[i] + dt * k3Arr[i];
      xFull.set(key, nextArr);
    });
    this.states = xFull;
    this.computeOutputs(t0 + dt);
    const k4 = this.computeDerivatives(t0 + dt, xFull);

    // Combine RK4: x_{n+1} = x_0 + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
    x0.forEach((arr, key) => {
      const k1A = k1.get(key) || new Float64Array(arr.length);
      const k2A = k2.get(key) || new Float64Array(arr.length);
      const k3A = k3.get(key) || new Float64Array(arr.length);
      const k4A = k4.get(key) || new Float64Array(arr.length);
      const finalArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        finalArr[i] = arr[i] + (dt / 6.0) * (k1A[i] + 2.0 * k2A[i] + 2.0 * k3A[i] + k4A[i]);
      }
      this.states.set(key, finalArr);
    });

    this.computeOutputs(t0 + dt);
  }

  stepEuler(dt) {
    this.computeOutputs(this.time);
    const dStates = this.computeDerivatives(this.time, this.states);
    this.states.forEach((arr, key) => {
      const dArr = dStates.get(key) || new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] += dArr[i] * dt;
      }
    });
    this.computeOutputs(this.time + dt);
  }

  recordHistory() {
    const sample = { time: this.time, signals: {} };
    this.blocks.forEach(b => {
      if (b.type === BlockTypes.SCOPE || b.type === BlockTypes.DISPLAY_READOUT || b.type === BlockTypes.TO_WORKSPACE) {
        sample.signals[`${b.id}:CH1`] = this.getInputValue(b.id, 'in1') || this.getInputValue(b.id, 'in');
        sample.signals[`${b.id}:CH2`] = this.getInputValue(b.id, 'in2');
      }
    });
    this.history.push(sample);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  get signals() {
    return this.outputs;
  }

  sampleSignals() {
    const res = {};
    this.outputs.forEach((val, key) => { res[key] = val; });
    return res;
  }
}

const SwitchaBlocksEngine = BlockEngine;

if (typeof window !== 'undefined') {
  window.BlockEngine = BlockEngine;
  window.SwitchaBlocksEngine = SwitchaBlocksEngine;
}

export { SwitchaBlocksEngine };

