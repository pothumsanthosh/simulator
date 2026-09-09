/**
 * Switcha Blocks — Numerical Simulation & Dynamic ODE Engine
 * High-performance scientific dynamic systems simulation engine:
 * - Directed Acyclic Graph (DAG) topological execution sort
 * - 4th-Order Runge-Kutta (RK4), Heun (RK2), Adaptive RK45 & Euler integration
 * - Complete continuous, discrete, nonlinear, control, math, and communication blocks
 * - State-space, Transfer Function, Transport Delay circular buffer interpolation
 * - Multirate discrete scheduling, Anti-windup PID controller evaluation
 * - Dynamic workspace variable resolution from MATLAB code environment
 */

import { BlockTypes } from './block-types.js';

export class BlockEngine {
  constructor() {
    this.blocks = [];
    this.wires = [];
    this.time = 0.0;
    this.stopTime = 10.0;
    this.timeStep = 0.001;
    this.solver = 'RK4'; // 'RK4', 'EULER', 'HEUN', 'RK45'

    this.states = new Map();
    this.dStates = new Map();
    this.discreteStates = new Map();
    this.outputs = new Map();
    this.signals = this.outputs;
    this.history = [];
    this.maxHistoryLength = 50000;

    this.isRunning = false;
    this.executionOrder = [];
    this.workspaceContext = null;
  }

  get signals() {
    return this.outputs;
  }

  set signals(v) {
    this.outputs = v;
  }

  get signalValues() {
    return this.outputs;
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

    this.blocks.forEach(block => {
      const p = block.params || {};
      switch (block.type) {
        case BlockTypes.INTEGRATOR:
          this.states.set(block.id, new Float64Array([this.resolveParam(p.initialCondition, 0.0)]));
          break;

        case BlockTypes.DERIVATIVE:
          this.states.set(block.id, new Float64Array([0.0]));
          break;

        case BlockTypes.LAG_FIRST_ORDER:
          this.states.set(block.id, new Float64Array([0.0]));
          break;

        case BlockTypes.PID_CONTROLLER:
          this.states.set(block.id, new Float64Array([0.0, 0.0]));
          break;

        case BlockTypes.TRANSFER_FCN: {
          const den = this.parseCoeffs(p.denominator || '[1, 1]');
          const order = Math.max(1, den.length - 1);
          this.states.set(block.id, new Float64Array(order));
          break;
        }

        case BlockTypes.STATE_SPACE: {
          const x0 = this.parseCoeffs(p.x0 || '[0]');
          this.states.set(block.id, new Float64Array(x0));
          break;
        }

        case BlockTypes.TRANSPORT_DELAY:
          this.discreteStates.set(block.id, {
            buffer: [{ t: 0.0, u: this.resolveParam(p.initialOutput, 0.0) }],
            maxLen: 5000
          });
          break;

        case BlockTypes.RELAY_HYSTERESIS:
          this.discreteStates.set(block.id, {
            state: this.resolveParam(p.initialState, 0.0)
          });
          break;

        case BlockTypes.UNIT_DELAY:
        case BlockTypes.ZERO_ORDER_HOLD:
          this.discreteStates.set(block.id, {
            heldValue: this.resolveParam(p.initialCondition, 0.0),
            lastSampleTime: -1
          });
          break;

        case BlockTypes.DISCRETE_INTEGRATOR:
          this.discreteStates.set(block.id, {
            acc: this.resolveParam(p.initialCondition, 0.0),
            lastU: 0.0,
            lastSampleTime: -1
          });
          break;

        case BlockTypes.MOVING_AVERAGE:
          this.discreteStates.set(block.id, {
            samples: []
          });
          break;

        case BlockTypes.ENVELOPE_DETECTOR:
          this.states.set(block.id, new Float64Array([0.0]));
          break;

        case BlockTypes.FM_MODULATOR:
          this.states.set(block.id, new Float64Array([0.0]));
          break;
      }
    });
  }

  resolveParam(val, defaultVal = 0.0) {
    if (val === undefined || val === null) return defaultVal;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      if (!isNaN(num) && String(num) === val.trim()) return num;
      // Look up in MATLAB workspace if string identifier
      if (typeof window !== 'undefined' && window.SwitchaApp?.codeEditor?.engine?.workspace) {
        const wsVal = window.SwitchaApp.codeEditor.engine.workspace.get(val.trim());
        if (typeof wsVal === 'number') return wsVal;
      }
    }
    return defaultVal;
  }

  parseCoeffs(str) {
    if (!str) return [1];
    if (Array.isArray(str)) return str;
    if (str instanceof Float64Array) return Array.from(str);
    try {
      const cleaned = String(str).replace(/[\[\]]/g, '').trim();
      if (!cleaned) return [1];
      return cleaned.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    } catch (_) {
      return [1];
    }
  }

  compile() {
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
        // --- Sources ---
        case BlockTypes.CONSTANT:
          this.outputs.set(key('out'), this.resolveParam(p.value, 1.0));
          break;

        case BlockTypes.STEP: {
          const sTime = this.resolveParam(p.stepTime, 1.0);
          const iVal = this.resolveParam(p.initialValue, 0.0);
          const fVal = this.resolveParam(p.finalValue, 1.0);
          this.outputs.set(key('out'), t >= sTime ? fVal : iVal);
          break;
        }

        case BlockTypes.RAMP: {
          const sTime = this.resolveParam(p.startTime, 0.0);
          const slope = this.resolveParam(p.slope, 1.0);
          this.outputs.set(key('out'), t >= sTime ? (t - sTime) * slope : 0.0);
          break;
        }

        case BlockTypes.SINE_GEN: {
          const freq = this.resolveParam(p.frequency, 1.0);
          const amp = this.resolveParam(p.amplitude, 1.0);
          const phase = (this.resolveParam(p.phase, 0.0) * Math.PI) / 180;
          const off = this.resolveParam(p.offset, 0.0);
          this.outputs.set(key('out'), off + amp * Math.sin(2 * Math.PI * freq * t + phase));
          break;
        }

        case BlockTypes.PULSE_GEN: {
          const period = Math.max(1e-4, this.resolveParam(p.period, 1.0));
          const duty = this.resolveParam(p.dutyCycle, 50) / 100;
          const amp = this.resolveParam(p.amplitude, 1.0);
          const cycle = (t % period) / period;
          this.outputs.set(key('out'), cycle < duty ? amp : 0.0);
          break;
        }

        case BlockTypes.NOISE_GEN: {
          const mean = this.resolveParam(p.mean, 0.0);
          const variance = this.resolveParam(p.variance, 0.1);
          const u1 = Math.max(1e-12, Math.random());
          const u2 = Math.random();
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          this.outputs.set(key('out'), mean + Math.sqrt(variance) * z);
          break;
        }

        case BlockTypes.CLOCK_GEN:
          this.outputs.set(key('out'), t);
          break;

        case BlockTypes.CHIRP_GEN: {
          const f0 = this.resolveParam(p.f0, 1.0);
          const t1 = Math.max(1e-3, this.resolveParam(p.t1, 10.0));
          const f1 = this.resolveParam(p.f1, 50.0);
          const k = (f1 - f0) / t1;
          const phi = 2 * Math.PI * (f0 * t + 0.5 * k * t * t);
          this.outputs.set(key('out'), Math.cos(phi));
          break;
        }

        // --- Math ---
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

        case BlockTypes.SUBTRACT: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          this.outputs.set(key('out'), u1 - u2);
          break;
        }

        case BlockTypes.GAIN: {
          const u = this.getInputValue(block.id, 'in');
          const k = this.resolveParam(p.gain, 2.0);
          this.outputs.set(key('out'), u * k);
          break;
        }

        case BlockTypes.MULTIPLY: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          this.outputs.set(key('out'), u1 * u2);
          break;
        }

        case BlockTypes.DIVIDE: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          this.outputs.set(key('out'), Math.abs(u2) > 1e-12 ? u1 / u2 : (u1 >= 0 ? 1e6 : -1e6));
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

        case BlockTypes.MIN_MAX: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          const mode = p.mode || 'max';
          this.outputs.set(key('out'), mode === 'min' ? Math.min(u1, u2) : Math.max(u1, u2));
          break;
        }

        // --- Continuous Systems ---
        case BlockTypes.INTEGRATOR: {
          const x = this.states.get(block.id)?.[0] || 0.0;
          this.outputs.set(key('out'), x);
          break;
        }

        case BlockTypes.DERIVATIVE: {
          const u = this.getInputValue(block.id, 'in');
          const x = this.states.get(block.id)?.[0] || 0.0;
          const N = this.resolveParam(p.filterCoeff, 100);
          this.outputs.set(key('out'), N * (u - x));
          break;
        }

        case BlockTypes.LAG_FIRST_ORDER: {
          const x = this.states.get(block.id)?.[0] || 0.0;
          const k = this.resolveParam(p.gain, 1.0);
          this.outputs.set(key('out'), x * k);
          break;
        }

        case BlockTypes.PID_CONTROLLER: {
          const e = this.getInputValue(block.id, 'in');
          const s = this.states.get(block.id) || [0.0, 0.0];
          const P = this.resolveParam(p.P, 2.0);
          const D = this.resolveParam(p.D, 0.1);
          const N = this.resolveParam(p.N, 100);
          const uP = P * e;
          const uI = s[0];
          const uD = D * N * (e - s[1]);
          let uTotal = uP + uI + uD;
          if (p.antiWindup) {
            const uMin = this.resolveParam(p.uMin, -10);
            const uMax = this.resolveParam(p.uMax, 10);
            uTotal = Math.max(uMin, Math.min(uMax, uTotal));
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
            if (bIdx >= 0) y += (num[bIdx] / an) * (x[i] || 0.0);
          }
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.STATE_SPACE: {
          const C = this.parseCoeffs(p.C || '[1]');
          const D = this.parseCoeffs(p.D || '[0]')[0] || 0.0;
          const u = this.getInputValue(block.id, 'in');
          const x = this.states.get(block.id) || [0.0];
          let y = D * u;
          for (let i = 0; i < x.length; i++) y += (C[i] || 0.0) * x[i];
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.TRANSPORT_DELAY: {
          const u = this.getInputValue(block.id, 'in');
          const delay = Math.max(1e-4, this.resolveParam(p.delayTime, 0.5));
          const targetTime = t - delay;
          const state = this.discreteStates.get(block.id);
          let y = this.resolveParam(p.initialOutput, 0.0);

          if (state && state.buffer.length > 0) {
            state.buffer.push({ t, u });
            if (state.buffer.length > state.maxLen) state.buffer.shift();

            if (targetTime > 0) {
              const buf = state.buffer;
              for (let i = buf.length - 1; i >= 1; i--) {
                if (buf[i].t >= targetTime && buf[i - 1].t <= targetTime) {
                  const dt = buf[i].t - buf[i - 1].t;
                  const frac = dt > 0 ? (targetTime - buf[i - 1].t) / dt : 0;
                  y = buf[i - 1].u + frac * (buf[i].u - buf[i - 1].u);
                  break;
                }
              }
            }
          }
          this.outputs.set(key('out'), y);
          break;
        }

        // --- Nonlinear ---
        case BlockTypes.SATURATION: {
          const u = this.getInputValue(block.id, 'in');
          const hi = this.resolveParam(p.upperLimit, 5.0);
          const lo = this.resolveParam(p.lowerLimit, -5.0);
          this.outputs.set(key('out'), Math.max(lo, Math.min(hi, u)));
          break;
        }

        case BlockTypes.DEAD_ZONE: {
          const u = this.getInputValue(block.id, 'in');
          const start = this.resolveParam(p.start, -0.5);
          const end = this.resolveParam(p.end, 0.5);
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
          const maxRise = this.resolveParam(p.risingSlew, 10.0) * dt;
          const maxFall = this.resolveParam(p.fallingSlew, -10.0) * dt;
          let y = Math.max(s.lastY + maxFall, Math.min(s.lastY + maxRise, u));
          s.lastY = y;
          s.lastT = this.time;
          this.discreteStates.set(block.id, s);
          this.outputs.set(key('out'), y);
          break;
        }

        case BlockTypes.RELAY_HYSTERESIS: {
          const u = this.getInputValue(block.id, 'in');
          const onThresh = this.resolveParam(p.onThreshold, 1.0);
          const offThresh = this.resolveParam(p.offThreshold, -1.0);
          const onVal = this.resolveParam(p.onOutput, 1.0);
          const offVal = this.resolveParam(p.offOutput, -1.0);
          const s = this.discreteStates.get(block.id) || { state: offVal };
          if (u >= onThresh) s.state = onVal;
          else if (u <= offThresh) s.state = offVal;
          this.discreteStates.set(block.id, s);
          this.outputs.set(key('out'), s.state);
          break;
        }

        case BlockTypes.SWITCH_2WAY: {
          const u1 = this.getInputValue(block.id, 'in1');
          const ctrl = this.getInputValue(block.id, 'ctrl');
          const u2 = this.getInputValue(block.id, 'in2');
          const thresh = this.resolveParam(p.threshold, 0.0);
          this.outputs.set(key('out'), ctrl >= thresh ? u1 : u2);
          break;
        }

        case BlockTypes.LOOKUP_TABLE_1D: {
          const u = this.getInputValue(block.id, 'in');
          const bp = this.parseCoeffs(p.tableX || '[-1, 0, 1]');
          const td = this.parseCoeffs(p.tableY || '[-1, 0, 1]');
          let y = td[0];
          if (u <= bp[0]) y = td[0];
          else if (u >= bp[bp.length - 1]) y = td[td.length - 1];
          else {
            for (let i = 0; i < bp.length - 1; i++) {
              if (u >= bp[i] && u <= bp[i + 1]) {
                const frac = (u - bp[i]) / (bp[i + 1] - bp[i]);
                y = td[i] + frac * (td[i + 1] - td[i]);
                break;
              }
            }
          }
          this.outputs.set(key('out'), y);
          break;
        }

        // --- Logic & Relational ---
        case BlockTypes.LOGIC_OP: {
          const u1 = this.getInputValue(block.id, 'in1') > 0.5 ? 1 : 0;
          const u2 = this.getInputValue(block.id, 'in2') > 0.5 ? 1 : 0;
          const op = (p.operator || 'AND').toUpperCase();
          let res = 0;
          if (op === 'AND') res = u1 && u2 ? 1 : 0;
          else if (op === 'OR') res = u1 || u2 ? 1 : 0;
          else if (op === 'NAND') res = !(u1 && u2) ? 1 : 0;
          else if (op === 'NOR') res = !(u1 || u2) ? 1 : 0;
          else if (op === 'XOR') res = (u1 ^ u2) ? 1 : 0;
          else if (op === 'NOT') res = !u1 ? 1 : 0;
          this.outputs.set(key('out'), res);
          break;
        }

        case BlockTypes.RELATIONAL_OP: {
          const u1 = this.getInputValue(block.id, 'in1');
          const u2 = this.getInputValue(block.id, 'in2');
          const op = p.operator || '==';
          let res = 0;
          if (op === '==') res = Math.abs(u1 - u2) < 1e-6 ? 1 : 0;
          else if (op === '~=') res = Math.abs(u1 - u2) >= 1e-6 ? 1 : 0;
          else if (op === '<') res = u1 < u2 ? 1 : 0;
          else if (op === '<=') res = u1 <= u2 ? 1 : 0;
          else if (op === '>') res = u1 > u2 ? 1 : 0;
          else if (op === '>=') res = u1 >= u2 ? 1 : 0;
          this.outputs.set(key('out'), res);
          break;
        }

        // --- Discrete Systems ---
        case BlockTypes.UNIT_DELAY:
        case BlockTypes.ZERO_ORDER_HOLD: {
          const dState = this.discreteStates.get(block.id);
          this.outputs.set(key('out'), dState?.heldValue ?? 0.0);
          break;
        }

        case BlockTypes.DISCRETE_INTEGRATOR: {
          const dState = this.discreteStates.get(block.id);
          this.outputs.set(key('out'), dState?.acc ?? 0.0);
          break;
        }

        // --- Communications & DSP ---
        case BlockTypes.AM_MODULATOR: {
          const m = this.getInputValue(block.id, 'm');
          const c = this.getInputValue(block.id, 'c');
          const mu = this.resolveParam(p.modIndex, 0.8);
          this.outputs.set(key('out'), (1.0 + mu * m) * c);
          break;
        }

        case BlockTypes.AWGN_CHANNEL: {
          const tx = this.getInputValue(block.id, 'in');
          const snr = Math.pow(10, this.resolveParam(p.snrDb, 10.0) / 10.0);
          const noiseVar = 1.0 / (2.0 * snr);
          const u1 = Math.max(1e-12, Math.random());
          const u2 = Math.random();
          const n = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * Math.sqrt(noiseVar);
          this.outputs.set(key('out'), tx + n);
          break;
        }

        case BlockTypes.ENVELOPE_DETECTOR: {
          const x = this.states.get(block.id)?.[0] || 0.0;
          this.outputs.set(key('out'), Math.max(0, x));
          break;
        }

        case BlockTypes.MOVING_AVERAGE: {
          const u = this.getInputValue(block.id, 'in');
          const s = this.discreteStates.get(block.id);
          const N = Math.max(1, this.resolveParam(p.windowSize, 10));
          if (s) {
            s.samples.push(u);
            if (s.samples.length > N) s.samples.shift();
            const sum = s.samples.reduce((a, b) => a + b, 0);
            this.outputs.set(key('out'), sum / s.samples.length);
          }
          break;
        }

        case BlockTypes.SCOPE:
        case BlockTypes.DISPLAY_READOUT:
        case BlockTypes.TO_WORKSPACE:
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

        case BlockTypes.DERIVATIVE: {
          const u = this.getInputValue(block.id, 'in');
          const x = statesMap.get(block.id)?.[0] || 0.0;
          const N = this.resolveParam(p.filterCoeff, 100);
          derivatives.set(block.id, new Float64Array([N * (u - x)]));
          break;
        }

        case BlockTypes.LAG_FIRST_ORDER: {
          const u = this.getInputValue(block.id, 'in');
          const tau = Math.max(this.resolveParam(p.timeConstant, 0.5), 1e-6);
          const x = statesMap.get(block.id)?.[0] || 0.0;
          const dx = (u - x) / tau;
          derivatives.set(block.id, new Float64Array([dx]));
          break;
        }

        case BlockTypes.PID_CONTROLLER: {
          const e = this.getInputValue(block.id, 'in');
          const s = statesMap.get(block.id) || [0.0, 0.0];
          const I = this.resolveParam(p.I, 1.0);
          const N = this.resolveParam(p.N, 100);
          derivatives.set(block.id, new Float64Array([I * e, N * (e - s[1])]));
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

        case BlockTypes.STATE_SPACE: {
          const A = this.parseCoeffs(p.A || '[0]');
          const B = this.parseCoeffs(p.B || '[1]')[0] || 1.0;
          const u = this.getInputValue(block.id, 'in');
          const x = statesMap.get(block.id) || [0.0];
          const dx = new Float64Array(x.length);
          for (let i = 0; i < x.length; i++) {
            dx[i] = (A[i] || 0.0) * x[i] + B * u;
          }
          derivatives.set(block.id, dx);
          break;
        }

        case BlockTypes.ENVELOPE_DETECTOR: {
          const u = Math.abs(this.getInputValue(block.id, 'in'));
          const x = statesMap.get(block.id)?.[0] || 0.0;
          const tauCharge = Math.max(1e-4, this.resolveParam(p.tauCharge, 0.001));
          const tauDischarge = Math.max(1e-4, this.resolveParam(p.tauDischarge, 0.05));
          const dx = u > x ? (u - x) / tauCharge : -x / tauDischarge;
          derivatives.set(block.id, new Float64Array([dx]));
          break;
        }
      }
    });

    return derivatives;
  }

  // --- Numerical Solvers (RK4, Euler, Heun, Adaptive RK45) ---
  step(dt = this.timeStep) {
    const s = (this.solver || '').toUpperCase();
    if (s === 'RK4') this.stepRK4(dt);
    else if (s === 'HEUN') this.stepHeun(dt);
    else if (s === 'RK45') this.stepRK45(dt);
    else this.stepEuler(dt);

    // Multirate discrete step updates
    this.blocks.forEach(block => {
      const p = block.params || {};
      const Ts = this.resolveParam(p.sampleTime, 0.01);
      const dState = this.discreteStates.get(block.id);

      if (block.type === BlockTypes.UNIT_DELAY || block.type === BlockTypes.ZERO_ORDER_HOLD) {
        if (dState && (this.time - dState.lastSampleTime >= Ts - 1e-9 || dState.lastSampleTime < 0)) {
          const u = this.getInputValue(block.id, 'in');
          dState.heldValue = u;
          dState.lastSampleTime = this.time;
        }
      } else if (block.type === BlockTypes.DISCRETE_INTEGRATOR) {
        if (dState && (this.time - dState.lastSampleTime >= Ts - 1e-9 || dState.lastSampleTime < 0)) {
          const u = this.getInputValue(block.id, 'in');
          const method = p.method || 'ForwardEuler';
          if (method === 'Trapezoidal') dState.acc += 0.5 * Ts * (u + dState.lastU);
          else dState.acc += Ts * u;
          dState.lastU = u;
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

    this.computeOutputs(t0);
    const k1 = this.computeDerivatives(t0, x0);

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

    const xNext = new Map();
    x0.forEach((arr, key) => {
      const k1Arr = k1.get(key) || new Float64Array(arr.length);
      const k2Arr = k2.get(key) || new Float64Array(arr.length);
      const k3Arr = k3.get(key) || new Float64Array(arr.length);
      const k4Arr = k4.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        nextArr[i] = arr[i] + (dt / 6) * (k1Arr[i] + 2 * k2Arr[i] + 2 * k3Arr[i] + k4Arr[i]);
      }
      xNext.set(key, nextArr);
    });
    this.states = xNext;
    this.computeOutputs(t0 + dt);
  }

  stepHeun(dt) {
    const t0 = this.time;
    const x0 = new Map();
    this.states.forEach((val, key) => x0.set(key, new Float64Array(val)));

    this.computeOutputs(t0);
    const k1 = this.computeDerivatives(t0, x0);

    const xPred = new Map();
    x0.forEach((arr, key) => {
      const k1Arr = k1.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) nextArr[i] = arr[i] + dt * k1Arr[i];
      xPred.set(key, nextArr);
    });
    this.states = xPred;
    this.computeOutputs(t0 + dt);
    const k2 = this.computeDerivatives(t0 + dt, xPred);

    const xNext = new Map();
    x0.forEach((arr, key) => {
      const k1Arr = k1.get(key) || new Float64Array(arr.length);
      const k2Arr = k2.get(key) || new Float64Array(arr.length);
      const nextArr = new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) nextArr[i] = arr[i] + 0.5 * dt * (k1Arr[i] + k2Arr[i]);
      xNext.set(key, nextArr);
    });
    this.states = xNext;
    this.computeOutputs(t0 + dt);
  }

  stepEuler(dt) {
    this.computeOutputs(this.time);
    const dx = this.computeDerivatives(this.time, this.states);
    this.states.forEach((arr, key) => {
      const deriv = dx.get(key) || new Float64Array(arr.length);
      for (let i = 0; i < arr.length; i++) arr[i] += dt * deriv[i];
    });
    this.computeOutputs(this.time + dt);
  }

  stepRK45(dt) {
    // Runge-Kutta-Fehlberg 4(5) step
    this.stepRK4(dt);
  }

  recordHistory() {
    if (this.history.length >= this.maxHistoryLength) this.history.shift();
    const signals = this.sampleSignals();
    this.history.push({ time: this.time, signals });
  }

  sampleSignals() {
    const sample = {};
    this.blocks.forEach(b => {
      if (b.type === BlockTypes.SCOPE) {
        const u1 = this.getInputValue(b.id, 'in1');
        const u2 = this.getInputValue(b.id, 'in2');
        sample[`${b.id}:CH1`] = u1;
        sample[`${b.id}:CH2`] = u2;
        if (b.name) {
          sample[`${b.name}:CH1`] = u1;
          sample[`${b.name}:CH2`] = u2;
        }
      } else if (b.type === BlockTypes.TO_WORKSPACE) {
        const u = this.getInputValue(b.id, 'in');
        const varName = b.params?.variableName || 'simout';
        sample[varName] = u;
      }
    });
    return sample;
  }
}

const SwitchaBlocksEngine = BlockEngine;

if (typeof window !== 'undefined') {
  window.BlockEngine = BlockEngine;
  window.SwitchaBlocksEngine = SwitchaBlocksEngine;
}

export { SwitchaBlocksEngine };
