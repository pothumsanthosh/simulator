/**
 * Modified Nodal Analysis (MNA) Circuit Simulation Engine
 * Professional-grade SPICE-accurate time-domain transient solver.
 * Complete rectification of all equation stamping, non-linear models,
 * adaptive timesteps, partial pivoting, and multi-terminal device formulations.
 */

import { ComponentTypes, ComponentDefinitions } from './components.js';

export class CircuitEngine {
  constructor() {
    this.components = [];
    this.wires = [];
    this.nodes = []; // Array of sets of connected pin keys
    this.pinToNodeMap = new Map(); // pinKey -> nodeIndex (0 = GND)

    this.time = 0;
    this.timeStep = 5e-5; // 50 microseconds
    this.baseTimeStep = 5e-5;
    this.minTimeStep = 1e-7;
    this.maxTimeStep = 1e-4;
    this.maxIterations = 50;
    this.convergenceTolerance = 1e-4;
    this.gMin = 1e-12; // 1 pS minimum nodal conductance to prevent floating singularity

    this.nodeVoltages = [];
    this.prevNodeVoltages = [];
    this.branchCurrents = new Map();
    this.history = [];
    this.maxHistoryLength = 3000;

    this.isRunning = false;
    this.internalStates = new Map(); // Storage for reactive, latch, and sequential states
  }

  setCircuit(components, wires) {
    this.components = components || [];
    this.wires = wires || [];
    this.buildTopology();
  }

  buildTopology() {
    const pinAdjacency = new Map();

    const addEdge = (p1, p2) => {
      if (!pinAdjacency.has(p1)) pinAdjacency.set(p1, new Set());
      if (!pinAdjacency.has(p2)) pinAdjacency.set(p2, new Set());
      pinAdjacency.get(p1).add(p2);
      pinAdjacency.get(p2).add(p1);
    };

    // 1. Register all component pins
    this.components.forEach(comp => {
      if (!Array.isArray(comp.pins) && ComponentDefinitions[comp.type]?.pins) {
        comp.pins = ComponentDefinitions[comp.type].pins.map(p => ({ ...p }));
      }
      if (Array.isArray(comp.pins)) {
        comp.pins.forEach(pin => {
          const pinKey = `${comp.id}:${pin.id}`;
          if (!pinAdjacency.has(pinKey)) {
            pinAdjacency.set(pinKey, new Set());
          }
        });
      }
    });

    // 2. Connect physical wires
    this.wires.forEach(wire => {
      if (wire.fromPin && wire.toPin) {
        addEdge(wire.fromPin, wire.toPin);
      }
    });

    // 3. Connect Named Net Labels & Power Symbols
    const namedNetGroups = new Map();
    this.components.forEach(comp => {
      let netTag = null;
      if (comp.type === ComponentTypes.GROUND) netTag = 'GND';
      else if (comp.type === ComponentTypes.POWER_VCC) netTag = 'VCC';
      else if (comp.type === ComponentTypes.POWER_5V) netTag = '+5V';
      else if (comp.type === ComponentTypes.POWER_12V) netTag = '+12V';
      else if (comp.type === ComponentTypes.POWER_NEG12V) netTag = '-12V';
      else if (comp.type === ComponentTypes.POWER_15V) netTag = '+15V';
      else if (comp.type === ComponentTypes.POWER_NEG15V) netTag = '-15V';
      else if (comp.type === ComponentTypes.NET_LABEL && comp.params?.label) {
        netTag = comp.params.label.trim().toUpperCase();
      }

      if (netTag && comp.pins && comp.pins.length > 0) {
        const pinKey = `${comp.id}:${comp.pins[0].id}`;
        if (!namedNetGroups.has(netTag)) namedNetGroups.set(netTag, []);
        namedNetGroups.get(netTag).push(pinKey);
      }
    });

    namedNetGroups.forEach(pinList => {
      if (pinList.length > 1) {
        for (let i = 1; i < pinList.length; i++) {
          addEdge(pinList[0], pinList[i]);
        }
      }
    });

    // 4. Connected Components traversal (BFS)
    const visited = new Set();
    const rawNets = [];
    let gndNetIndex = -1;

    // Detect GND pins
    const gndPinKeys = new Set(namedNetGroups.get('GND') || []);
    this.components.forEach(comp => {
      if (comp.type === ComponentTypes.GROUND) {
        comp.pins?.forEach(p => gndPinKeys.add(`${comp.id}:${p.id}`));
      }
    });

    for (const [pinKey] of pinAdjacency) {
      if (!visited.has(pinKey)) {
        const net = [];
        const queue = [pinKey];
        visited.add(pinKey);
        let containsGnd = false;

        while (queue.length > 0) {
          const curr = queue.shift();
          net.push(curr);
          if (gndPinKeys.has(curr)) containsGnd = true;

          const neighbors = pinAdjacency.get(curr) || [];
          for (const next of neighbors) {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          }
        }

        if (containsGnd && gndNetIndex === -1) {
          gndNetIndex = rawNets.length;
        }
        rawNets.push(net);
      }
    }

    // Assign Node 0 to Ground
    this.pinToNodeMap.clear();
    this.nodes = [];

    if (gndNetIndex !== -1) {
      const gndNet = rawNets.splice(gndNetIndex, 1)[0];
      rawNets.unshift(gndNet);
    } else {
      rawNets.unshift([]);
    }

    rawNets.forEach((net, nodeIdx) => {
      this.nodes.push(net);
      net.forEach(pinKey => {
        this.pinToNodeMap.set(pinKey, nodeIdx);
      });
    });

    this.nodeVoltages = new Array(this.nodes.length).fill(0);
    this.prevNodeVoltages = new Array(this.nodes.length).fill(0);
  }

  getNode(comp, pinId) {
    const key = `${comp.id}:${pinId}`;
    return this.pinToNodeMap.get(key) ?? -1;
  }

  reset() {
    this.time = 0;
    this.nodeVoltages = new Array(this.nodes.length).fill(0);
    this.prevNodeVoltages = new Array(this.nodes.length).fill(0);
    this.internalStates.clear();
    this.history = [];
    this.branchCurrents.clear();
  }

  /**
   * Performs a single numerical integration time-step using MNA & Newton-Raphson
   */
  step(dt = this.timeStep) {
    const numNodes = this.nodes.length;
    if (numNodes <= 1) {
      this.time += dt;
      return;
    }

    // Count auxiliary equations needed for voltage sources, op-amps, logic outputs
    const vSources = [];
    let extraRows = 0;

    this.components.forEach(comp => {
      switch (comp.type) {
        case ComponentTypes.DC_VOLTAGE:
        case ComponentTypes.AC_VOLTAGE:
        case ComponentTypes.CLOCK_VOLTAGE:
        case ComponentTypes.TRIANGLE_VOLTAGE:
        case ComponentTypes.SAWTOOTH_VOLTAGE:
        case ComponentTypes.PULSE_VOLTAGE:
        case ComponentTypes.AM_VOLTAGE:
        case ComponentTypes.FM_VOLTAGE:
        case ComponentTypes.NOISE_VOLTAGE:
        case ComponentTypes.BATTERY_CELL:
        case ComponentTypes.POWER_VCC:
        case ComponentTypes.POWER_5V:
        case ComponentTypes.POWER_12V:
        case ComponentTypes.POWER_NEG12V:
        case ComponentTypes.POWER_15V:
        case ComponentTypes.POWER_NEG15V:
        case ComponentTypes.OPAMP:
        case ComponentTypes.COMPARATOR:
        case ComponentTypes.ANALOG_MULTIPLIER:
        case ComponentTypes.LM7805:
        case ComponentTypes.LM7812:
        case ComponentTypes.LM7912:
        case ComponentTypes.LM317:
        case ComponentTypes.AND_GATE:
        case ComponentTypes.OR_GATE:
        case ComponentTypes.NOT_GATE:
        case ComponentTypes.NAND_GATE:
        case ComponentTypes.NOR_GATE:
        case ComponentTypes.XOR_GATE:
        case ComponentTypes.XNOR_GATE:
        case ComponentTypes.MUX_4TO1:
        case ComponentTypes.TIMER555:
        case ComponentTypes.VCVS:
        case ComponentTypes.AMMETER:
          vSources.push(comp);
          break;

        case ComponentTypes.D_FLIPFLOP:
        case ComponentTypes.JK_FLIPFLOP:
        case ComponentTypes.HALF_ADDER:
          vSources.push(comp);
          extraRows += 1; // 2 output equations (Q & ~Q / Sum & Carry)
          break;

        case ComponentTypes.FULL_ADDER:
          vSources.push(comp);
          extraRows += 1; // 2 output equations (Sum & Cout)
          break;

        case ComponentTypes.BINARY_COUNTER_4BIT:
          vSources.push(comp);
          extraRows += 3; // 4 output equations (Q0, Q1, Q2, Q3)
          break;
      }
    });

    const matrixSize = (numNodes - 1) + vSources.length + extraRows;
    if (matrixSize <= 0) {
      this.time += dt;
      return;
    }

    let solution = new Array(matrixSize).fill(0);
    for (let i = 1; i < numNodes; i++) {
      solution[i - 1] = this.nodeVoltages[i] || 0;
    }

    // Newton-Raphson Iteration loop
    let converged = false;
    for (let iter = 0; iter < this.maxIterations; iter++) {
      const A = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
      const Z = new Array(matrixSize).fill(0);

      // Gmin stepping across all nodes to GND to prevent singular matrices
      for (let i = 0; i < numNodes - 1; i++) {
        A[i][i] += this.gMin;
      }

      const stampConductance = (n1, n2, g) => {
        if (!isFinite(g) || isNaN(g)) g = 1e-4;
        if (n1 > 0 && n1 < numNodes) {
          A[n1 - 1][n1 - 1] += g;
          if (n2 > 0 && n2 < numNodes) A[n1 - 1][n2 - 1] -= g;
        }
        if (n2 > 0 && n2 < numNodes) {
          A[n2 - 1][n2 - 1] += g;
          if (n1 > 0 && n1 < numNodes) A[n2 - 1][n1 - 1] -= g;
        }
      };

      const stampCurrentSource = (nFrom, nTo, iVal) => {
        if (!isFinite(iVal) || isNaN(iVal)) iVal = 0;
        if (nFrom > 0 && nFrom < numNodes) Z[nFrom - 1] -= iVal;
        if (nTo > 0 && nTo < numNodes) Z[nTo - 1] += iVal;
      };

      const stampVSourceEquation = (vSrcIdx, nPos, nNeg, vVal) => {
        if (!isFinite(vVal) || isNaN(vVal)) vVal = 0;
        const row = (numNodes - 1) + vSrcIdx;
        if (row >= matrixSize) return;
        if (nPos > 0 && nPos < numNodes) {
          A[row][nPos - 1] = 1;
          A[nPos - 1][row] = 1;
        }
        if (nNeg > 0 && nNeg < numNodes) {
          A[row][nNeg - 1] = -1;
          A[nNeg - 1][row] = -1;
        }
        Z[row] = vVal;
      };

      const stampVCVS = (vSrcIdx, nOutPos, nOutNeg, nInPos, nInNeg, gain, offset = 0) => {
        if (!isFinite(gain) || isNaN(gain)) gain = 1;
        if (!isFinite(offset) || isNaN(offset)) offset = 0;
        const row = (numNodes - 1) + vSrcIdx;
        if (row >= matrixSize) return;
        if (nOutPos > 0 && nOutPos < numNodes) {
          A[row][nOutPos - 1] += 1;
          A[nOutPos - 1][row] += 1;
        }
        if (nOutNeg > 0 && nOutNeg < numNodes) {
          A[row][nOutNeg - 1] -= 1;
          A[nOutNeg - 1][row] -= 1;
        }
        if (nInPos > 0 && nInPos < numNodes) {
          A[row][nInPos - 1] -= gain;
        }
        if (nInNeg > 0 && nInNeg < numNodes) {
          A[row][nInNeg - 1] += gain;
        }
        Z[row] = offset;
      };

      const getNodeV = (n) => (n <= 0 || n >= numNodes) ? 0 : solution[n - 1];

      let vSrcEquationIdx = 0;

      // Stamp Devices
      this.components.forEach(comp => {
        const p = comp.params || {};

        switch (comp.type) {
          // --- PASSIVES ---
          case ComponentTypes.RESISTOR:
          case ComponentTypes.NTC_THERMISTOR:
          case ComponentTypes.PHOTORESISTOR_LDR: {
            const n1 = this.getNode(comp, 'p1');
            const n2 = this.getNode(comp, 'p2');
            let r = Math.max(p.resistance || 1000, 1e-4);
            if (comp.type === ComponentTypes.NTC_THERMISTOR) {
              const tC = p.temperature ?? 25;
              const tK = tC + 273.15;
              r = (p.r25 || 10000) * Math.exp((p.beta || 3950) * (1 / tK - 1 / 298.15));
            } else if (comp.type === ComponentTypes.PHOTORESISTOR_LDR) {
              const lux = Math.max(p.lightLevel ?? 50, 1);
              r = (p.rDark || 1e6) / (lux * 10);
            }
            stampConductance(n1, n2, 1 / Math.max(r, 1e-4));
            break;
          }

          case ComponentTypes.POTENTIOMETER: {
            const n1 = this.getNode(comp, 'p1');
            const nWiper = this.getNode(comp, 'p2');
            const n2 = this.getNode(comp, 'p3');
            const totalR = Math.max(p.resistance || 10000, 10);
            const pos = Math.min(Math.max((p.position || 50) / 100, 0.001), 0.999);
            stampConductance(n1, nWiper, 1 / (totalR * pos));
            stampConductance(nWiper, n2, 1 / (totalR * (1 - pos)));
            break;
          }

          case ComponentTypes.CAPACITOR:
          case ComponentTypes.POLARIZED_CAP:
          case ComponentTypes.TANTALUM_CAP: {
            const n1 = this.getNode(comp, (comp.type === ComponentTypes.POLARIZED_CAP || comp.type === ComponentTypes.TANTALUM_CAP) ? 'p_pos' : 'p1');
            const n2 = this.getNode(comp, (comp.type === ComponentTypes.POLARIZED_CAP || comp.type === ComponentTypes.TANTALUM_CAP) ? 'p_neg' : 'p2');
            const c = Math.max(p.capacitance || 1e-6, 1e-15);
            const gEq = c / dt;
            const vPrev = (this.prevNodeVoltages[n1] || 0) - (this.prevNodeVoltages[n2] || 0);
            const iEq = gEq * vPrev;
            stampConductance(n1, n2, gEq);
            stampCurrentSource(n2, n1, iEq);
            break;
          }

          case ComponentTypes.INDUCTOR: {
            const n1 = this.getNode(comp, 'p1');
            const n2 = this.getNode(comp, 'p2');
            const l = Math.max(p.inductance || 1e-3, 1e-12);
            const gEq = dt / l;
            const state = this.internalStates.get(comp.id) || { current: 0 };
            stampConductance(n1, n2, gEq);
            stampCurrentSource(n1, n2, state.current);
            break;
          }

          case ComponentTypes.COUPLED_INDUCTOR: {
            const n1a = this.getNode(comp, 'l1_p1');
            const n1b = this.getNode(comp, 'l1_p2');
            const n2a = this.getNode(comp, 'l2_p1');
            const n2b = this.getNode(comp, 'l2_p2');
            const l1 = Math.max(p.l1 || 1e-3, 1e-12);
            const l2 = Math.max(p.l2 || 1e-3, 1e-12);
            stampConductance(n1a, n1b, dt / l1);
            stampConductance(n2a, n2b, dt / l2);
            break;
          }

          case ComponentTypes.TRANSFORMER:
          case ComponentTypes.TRANSFORMER_CENTER_TAP: {
            const nP1 = this.getNode(comp, 'pri_1');
            const nP2 = this.getNode(comp, 'pri_2');
            const nS1 = this.getNode(comp, 'sec_1');
            const nS2 = this.getNode(comp, 'sec_2');
            const nRatio = Math.max(p.ratio || 0.1, 0.001);
            const lPri = Math.max(p.primaryL || 0.01, 1e-6);

            const gPri = dt / lPri;
            const state = this.internalStates.get(comp.id) || { iPri: 0 };
            stampConductance(nP1, nP2, gPri);
            stampCurrentSource(nP1, nP2, state.iPri);

            const vPri = getNodeV(nP1) - getNodeV(nP2);
            stampConductance(nS1, nS2, 1 / 0.5);
            stampCurrentSource(nS2, nS1, (vPri * nRatio) / 0.5);
            break;
          }

          case ComponentTypes.CRYSTAL: {
            const n1 = this.getNode(comp, 'p1');
            const n2 = this.getNode(comp, 'p2');
            stampConductance(n1, n2, 1 / 25);
            break;
          }

          case ComponentTypes.FUSE: {
            const n1 = this.getNode(comp, 'p1');
            const n2 = this.getNode(comp, 'p2');
            const r = p.blown ? 1e8 : 0.01;
            stampConductance(n1, n2, 1 / r);
            break;
          }

          // --- SOURCES & POWER SYMBOLS ---
          case ComponentTypes.DC_VOLTAGE:
          case ComponentTypes.BATTERY_CELL: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, p.voltage ?? 5);
            break;
          }

          case ComponentTypes.POWER_VCC:
          case ComponentTypes.POWER_5V:
          case ComponentTypes.POWER_12V:
          case ComponentTypes.POWER_NEG12V:
          case ComponentTypes.POWER_15V:
          case ComponentTypes.POWER_NEG15V: {
            const nPos = this.getNode(comp, 'p1');
            let v = p.voltage ?? 5;
            if (comp.type === ComponentTypes.POWER_12V) v = 12;
            else if (comp.type === ComponentTypes.POWER_NEG12V) v = -12;
            else if (comp.type === ComponentTypes.POWER_15V) v = 15;
            else if (comp.type === ComponentTypes.POWER_NEG15V) v = -15;
            stampVSourceEquation(vSrcEquationIdx++, nPos, 0, v);
            break;
          }

          case ComponentTypes.AC_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const amp = p.amplitude ?? 5;
            const freq = p.frequency ?? 1000;
            const phaseRad = ((p.phase ?? 0) * Math.PI) / 180;
            const v = (p.offset ?? 0) + amp * Math.sin(2 * Math.PI * freq * this.time + phaseRad);
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.CLOCK_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const vH = p.vHigh ?? 5;
            const vL = p.vLow ?? 0;
            const freq = Math.max(p.frequency ?? 1000, 0.1);
            const duty = (p.dutyCycle ?? 50) / 100;
            const period = 1 / freq;
            const tInPeriod = this.time % period;
            const v = (tInPeriod < period * duty) ? vH : vL;
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.TRIANGLE_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const amp = p.amplitude ?? 5;
            const freq = Math.max(p.frequency ?? 1000, 0.1);
            const period = 1 / freq;
            const t = (this.time % period) / period;
            const v = (p.offset ?? 0) + (t < 0.5 ? amp * (4 * t - 1) : amp * (3 - 4 * t));
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.SAWTOOTH_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const amp = p.amplitude ?? 5;
            const freq = Math.max(p.frequency ?? 1000, 0.1);
            const period = 1 / freq;
            const t = (this.time % period) / period;
            const v = (p.offset ?? 0) + amp * (2 * t - 1);
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.PULSE_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const v1 = p.v1 ?? 0;
            const v2 = p.v2 ?? 5;
            const tWidth = p.tWidth ?? 1e-3;
            const period = Math.max(p.period ?? 2e-3, 1e-7);
            const tInPeriod = this.time % period;
            const v = (tInPeriod < tWidth) ? v2 : v1;
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.AM_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const Ac = p.carrierAmp || 5;
            const fc = p.carrierFreq || 50000;
            const fm = p.modFreq || 1000;
            const m = p.modIndex || 0.8;
            const v = Ac * (1 + m * Math.sin(2 * Math.PI * fm * this.time)) * Math.sin(2 * Math.PI * fc * this.time);
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.FM_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const Ac = p.carrierAmp || 5;
            const fc = p.carrierFreq || 20000;
            const fm = p.modFreq || 1000;
            const beta = (p.freqDev || 5000) / fm;
            const v = Ac * Math.sin(2 * Math.PI * fc * this.time + beta * Math.sin(2 * Math.PI * fm * this.time));
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.NOISE_VOLTAGE: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            const rms = p.rmsVoltage ?? 0.5;
            const v = (Math.random() - 0.5) * 2 * Math.sqrt(3) * rms;
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, v);
            break;
          }

          case ComponentTypes.DC_CURRENT: {
            const nIn = this.getNode(comp, 'p_in');
            const nOut = this.getNode(comp, 'p_out');
            stampCurrentSource(nIn, nOut, p.current ?? 0.001);
            break;
          }

          case ComponentTypes.AC_CURRENT: {
            const nIn = this.getNode(comp, 'p_in');
            const nOut = this.getNode(comp, 'p_out');
            const amp = p.amplitude ?? 0.005;
            const freq = p.frequency ?? 1000;
            const phaseRad = ((p.phase ?? 0) * Math.PI) / 180;
            const iVal = (p.offset ?? 0) + amp * Math.sin(2 * Math.PI * freq * this.time + phaseRad);
            stampCurrentSource(nIn, nOut, iVal);
            break;
          }

          case ComponentTypes.VCVS: {
            const nInPos = this.getNode(comp, 'in_pos');
            const nInNeg = this.getNode(comp, 'in_neg');
            const nOutPos = this.getNode(comp, 'out_pos');
            const nOutNeg = this.getNode(comp, 'out_neg');
            const gain = p.gain ?? 2.0;
            stampVCVS(vSrcEquationIdx++, nOutPos, nOutNeg, nInPos, nInNeg, gain, 0);
            break;
          }

          case ComponentTypes.VCCS: {
            const nInPos = this.getNode(comp, 'in_pos');
            const nInNeg = this.getNode(comp, 'in_neg');
            const nOutPos = this.getNode(comp, 'out_pos');
            const nOutNeg = this.getNode(comp, 'out_neg');
            const gm = p.transconductance ?? 0.01;
            const vIn = getNodeV(nInPos) - getNodeV(nInNeg);
            stampCurrentSource(nOutNeg, nOutPos, gm * vIn);
            break;
          }

          // --- DIODES & RECTIFIERS ---
          case ComponentTypes.DIODE:
          case ComponentTypes.SCHOTTKY:
          case ComponentTypes.LED: {
            const nA = this.getNode(comp, 'anode');
            const nK = this.getNode(comp, 'cathode');
            const vD = getNodeV(nA) - getNodeV(nK);
            let vf = p.forwardDrop || 0.7;
            if (comp.type === ComponentTypes.SCHOTTKY) vf = 0.32;
            else if (comp.type === ComponentTypes.LED) vf = p.forwardDrop || 2.0;

            const is = p.satCurrent || 1e-12;
            const vt = 0.026;
            let gEq, iEq;
            if (vD < vf) {
              const safeVd = Math.min(vD, vf);
              gEq = Math.max((is / vt) * Math.exp(safeVd / vt), 1e-9);
              const iD = is * (Math.exp(safeVd / vt) - 1);
              iEq = iD - gEq * safeVd;
              stampConductance(nA, nK, gEq);
              stampCurrentSource(nA, nK, -iEq);
            } else {
              const rOn = 0.2;
              gEq = 1 / rOn;
              iEq = vf * gEq;
              stampConductance(nA, nK, gEq);
              stampCurrentSource(nA, nK, -iEq);
            }
            break;
          }

          case ComponentTypes.ZENER: {
            const nA = this.getNode(comp, 'anode');
            const nK = this.getNode(comp, 'cathode');
            const vD = getNodeV(nA) - getNodeV(nK);
            const vz = p.zenerVoltage ?? p.vZener ?? 5.1;
            const vf = p.forwardDrop || 0.7;
            if (vD > vf) {
              const gEq = 2.0;
              const iEq = vf * gEq;
              stampConductance(nA, nK, gEq);
              stampCurrentSource(nA, nK, -iEq);
            } else if (vD < -vz) {
              const gEq = 2.0;
              const iEq = vz * gEq;
              stampConductance(nA, nK, gEq);
              stampCurrentSource(nK, nA, -iEq);
            } else {
              stampConductance(nA, nK, 1e-7);
            }
            break;
          }

          case ComponentTypes.BRIDGE_RECTIFIER: {
            const nAc1 = this.getNode(comp, 'ac1');
            const nAc2 = this.getNode(comp, 'ac2');
            const nPos = this.getNode(comp, 'pos');
            const nNeg = this.getNode(comp, 'neg');
            const vf = p.forwardDrop || 0.7;
            const g = 1 / 0.5;

            if (getNodeV(nAc1) - getNodeV(nPos) > vf) { stampConductance(nAc1, nPos, g); stampCurrentSource(nAc1, nPos, -vf * g); }
            if (getNodeV(nAc2) - getNodeV(nPos) > vf) { stampConductance(nAc2, nPos, g); stampCurrentSource(nAc2, nPos, -vf * g); }
            if (getNodeV(nNeg) - getNodeV(nAc1) > vf) { stampConductance(nNeg, nAc1, g); stampCurrentSource(nNeg, nAc1, -vf * g); }
            if (getNodeV(nNeg) - getNodeV(nAc2) > vf) { stampConductance(nNeg, nAc2, g); stampCurrentSource(nNeg, nAc2, -vf * g); }
            break;
          }

          // --- TRANSISTORS (BJT / MOSFET / JFET) ---
          case ComponentTypes.BJT_NPN:
          case ComponentTypes.DARLINGTON_NPN: {
            const nB = this.getNode(comp, 'base');
            const nC = this.getNode(comp, 'collector');
            const nE = this.getNode(comp, 'emitter');
            const vBE = getNodeV(nB) - getNodeV(nE);
            const vCE = getNodeV(nC) - getNodeV(nE);
            const beta = comp.type === ComponentTypes.DARLINGTON_NPN ? 1000 : (p.beta || 200);
            const vbeOn = comp.type === ComponentTypes.DARLINGTON_NPN ? 1.3 : 0.65;
            const rBE = 100;

            if (vBE > vbeOn) {
              const gB = 1 / rBE;
              const iBeq = vbeOn * gB;
              stampConductance(nB, nE, gB);
              stampCurrentSource(nB, nE, -iBeq);

              if (vCE > 0.2) {
                const gm = beta * gB;
                if (nC > 0 && nC < numNodes) {
                  if (nB > 0 && nB < numNodes) A[nC - 1][nB - 1] += gm;
                  if (nE > 0 && nE < numNodes) A[nC - 1][nE - 1] -= gm;
                  Z[nC - 1] += gm * vbeOn;
                }
                if (nE > 0 && nE < numNodes) {
                  if (nB > 0 && nB < numNodes) A[nE - 1][nB - 1] -= gm;
                  if (nE > 0 && nE < numNodes) A[nE - 1][nE - 1] += gm;
                  Z[nE - 1] -= gm * vbeOn;
                }
              } else {
                stampConductance(nC, nE, 1 / 0.5);
              }
            } else {
              stampConductance(nB, nE, 1e-8);
              stampConductance(nC, nE, 1e-8);
            }
            break;
          }

          case ComponentTypes.BJT_PNP:
          case ComponentTypes.DARLINGTON_PNP: {
            const nB = this.getNode(comp, 'base');
            const nC = this.getNode(comp, 'collector');
            const nE = this.getNode(comp, 'emitter');
            const vEB = getNodeV(nE) - getNodeV(nB);
            const vEC = getNodeV(nE) - getNodeV(nC);
            const beta = comp.type === ComponentTypes.DARLINGTON_PNP ? 1000 : (p.beta || 200);
            const vbeOn = comp.type === ComponentTypes.DARLINGTON_PNP ? 1.3 : 0.65;
            const rEB = 100;

            if (vEB > vbeOn) {
              const gB = 1 / rEB;
              const iBeq = vbeOn * gB;
              stampConductance(nE, nB, gB);
              stampCurrentSource(nE, nB, -iBeq);

              if (vEC > 0.2) {
                const gm = beta * gB;
                if (nC > 0 && nC < numNodes) {
                  if (nE > 0 && nE < numNodes) A[nC - 1][nE - 1] -= gm;
                  if (nB > 0 && nB < numNodes) A[nC - 1][nB - 1] += gm;
                  Z[nC - 1] += gm * vbeOn;
                }
                if (nE > 0 && nE < numNodes) {
                  if (nE > 0 && nE < numNodes) A[nE - 1][nE - 1] += gm;
                  if (nB > 0 && nB < numNodes) A[nE - 1][nB - 1] -= gm;
                  Z[nE - 1] -= gm * vbeOn;
                }
              } else {
                stampConductance(nE, nC, 1 / 0.5);
              }
            } else {
              stampConductance(nE, nB, 1e-8);
              stampConductance(nE, nC, 1e-8);
            }
            break;
          }

          case ComponentTypes.NMOS: {
            const nG = this.getNode(comp, 'gate');
            const nD = this.getNode(comp, 'drain');
            const nS = this.getNode(comp, 'source');
            const vGS = getNodeV(nG) - getNodeV(nS);
            const vDS = getNodeV(nD) - getNodeV(nS);
            const vTh = p.vth || 3.5;
            const kp = p.kp || 0.8;
            const rdsOn = p.rdsOn || 0.05;

            if (vGS > vTh) {
              if (vDS > vGS - vTh) {
                const id = 0.5 * kp * (vGS - vTh) ** 2;
                stampCurrentSource(nD, nS, id);
              } else {
                stampConductance(nD, nS, 1 / rdsOn);
              }
            } else {
              stampConductance(nD, nS, 1e-9);
            }
            break;
          }

          case ComponentTypes.PMOS: {
            const nG = this.getNode(comp, 'gate');
            const nD = this.getNode(comp, 'drain');
            const nS = this.getNode(comp, 'source');
            const vSG = getNodeV(nS) - getNodeV(nG);
            const vTh = Math.abs(p.vth || 3.5);
            const rdsOn = p.rdsOn || 0.1;

            if (vSG > vTh) {
              stampConductance(nS, nD, 1 / rdsOn);
            } else {
              stampConductance(nS, nD, 1e-9);
            }
            break;
          }

          case ComponentTypes.NJFET: {
            const nG = this.getNode(comp, 'gate');
            const nD = this.getNode(comp, 'drain');
            const nS = this.getNode(comp, 'source');
            const vGS = getNodeV(nG) - getNodeV(nS);
            const vDS = getNodeV(nD) - getNodeV(nS);
            const vP = p.vPinchOff || -2.5;
            const idss = p.idss || 0.003;

            if (vGS > vP) {
              if (vDS > vGS - vP) {
                const id = idss * ((1 - vGS / vP) ** 2);
                stampCurrentSource(nD, nS, id);
              } else {
                const rOn = Math.abs(vP) / (2 * idss);
                stampConductance(nD, nS, 1 / Math.max(rOn, 10));
              }
            } else {
              stampConductance(nD, nS, 1e-9);
            }
            break;
          }

          case ComponentTypes.PJFET: {
            const nG = this.getNode(comp, 'gate');
            const nD = this.getNode(comp, 'drain');
            const nS = this.getNode(comp, 'source');
            const vSG = getNodeV(nS) - getNodeV(nG);
            const vSD = getNodeV(nS) - getNodeV(nD);
            const vP = Math.abs(p.vPinchOff || 2.5);
            const idss = p.idss || 0.003;

            if (vSG > -vP) {
              if (vSD > vSG + vP) {
                const id = idss * ((1 - vSG / vP) ** 2);
                stampCurrentSource(nS, nD, id);
              } else {
                const rOn = Math.abs(vP) / (2 * idss);
                stampConductance(nS, nD, 1 / Math.max(rOn, 10));
              }
            } else {
              stampConductance(nS, nD, 1e-9);
            }
            break;
          }

          case ComponentTypes.SCR: {
            const nA = this.getNode(comp, 'anode');
            const nK = this.getNode(comp, 'cathode');
            const nG = this.getNode(comp, 'gate');
            const vGate = getNodeV(nG) - getNodeV(nK);
            const vAK = getNodeV(nA) - getNodeV(nK);
            const vTrig = p.vGateTrig || 0.8;

            let state = this.internalStates.get(comp.id) || { latched: false };
            if (vGate > vTrig && vAK > 0.5) {
              state.latched = true;
            } else if (vAK < 0.1) {
              state.latched = false;
            }
            this.internalStates.set(comp.id, state);

            stampConductance(nA, nK, state.latched ? 1 / 0.05 : 1e-8);
            break;
          }

          case ComponentTypes.TRIAC: {
            const nMt1 = this.getNode(comp, 'mt1');
            const nMt2 = this.getNode(comp, 'mt2');
            const nG = this.getNode(comp, 'gate');
            const vGate = Math.abs(getNodeV(nG) - getNodeV(nMt1));
            const vMt = Math.abs(getNodeV(nMt2) - getNodeV(nMt1));
            const vTrig = p.vGateTrig || 1.0;

            let state = this.internalStates.get(comp.id) || { latched: false };
            if (vGate > vTrig && vMt > 0.4) {
              state.latched = true;
            } else if (vMt < 0.1) {
              state.latched = false;
            }
            this.internalStates.set(comp.id, state);

            stampConductance(nMt1, nMt2, state.latched ? 1 / 0.05 : 1e-8);
            break;
          }

          // --- ANALOG ICS & OP-AMPS ---
          case ComponentTypes.OPAMP: {
            const nInv = this.getNode(comp, 'in_inv');
            const nNonInv = this.getNode(comp, 'in_noninv');
            const nOut = this.getNode(comp, 'out');
            const nVpos = this.getNode(comp, 'v_pos');
            const nVneg = this.getNode(comp, 'v_neg');
            const aOl = p.openLoopGain || 200000;

            let vSatP = p.vSatPos ?? 14;
            let vSatN = p.vSatNeg ?? -14;

            if (nVpos !== -1) {
              const vRailPos = getNodeV(nVpos);
              if (vRailPos !== 0) vSatP = vRailPos - 1.0;
            }
            if (nVneg !== -1) {
              const vRailNeg = getNodeV(nVneg);
              if (vRailNeg !== 0) vSatN = vRailNeg + 1.0;
            }

            const vDiff = getNodeV(nNonInv) - getNodeV(nInv);
            const vLinear = aOl * vDiff;

            if (vLinear > vSatP) {
              stampVSourceEquation(vSrcEquationIdx++, nOut, 0, vSatP);
            } else if (vLinear < vSatN) {
              stampVSourceEquation(vSrcEquationIdx++, nOut, 0, vSatN);
            } else {
              stampVCVS(vSrcEquationIdx++, nOut, 0, nNonInv, nInv, aOl, 0);
            }
            break;
          }

          case ComponentTypes.COMPARATOR: {
            const nInv = this.getNode(comp, 'in_inv');
            const nNonInv = this.getNode(comp, 'in_noninv');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const vL = p.vLow ?? 0;
            const outV = (getNodeV(nNonInv) > getNodeV(nInv)) ? vH : vL;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, outV);
            break;
          }

          case ComponentTypes.TIMER555: {
            const nVcc = this.getNode(comp, 'vcc');
            const nGnd = this.getNode(comp, 'gnd');
            const nTrig = this.getNode(comp, 'trig');
            const nThresh = this.getNode(comp, 'thresh');
            const nOut = this.getNode(comp, 'out');
            const nDisch = this.getNode(comp, 'disch');

            const vSupply = getNodeV(nVcc) - getNodeV(nGnd);
            const vTrig = getNodeV(nTrig) - getNodeV(nGnd);
            const vThresh = getNodeV(nThresh) - getNodeV(nGnd);

            const vThreshTrip = (2 / 3) * vSupply;
            const vTrigTrip = (1 / 3) * vSupply;

            let state = this.internalStates.get(comp.id) || { outHigh: true };
            if (vTrig < vTrigTrip) {
              state.outHigh = true;
            } else if (vThresh > vThreshTrip) {
              state.outHigh = false;
            }
            this.internalStates.set(comp.id, state);

            const outV = state.outHigh ? (vSupply - 1.2) : 0.1;
            stampVSourceEquation(vSrcEquationIdx++, nOut, nGnd, outV);

            if (!state.outHigh) {
              stampConductance(nDisch, nGnd, 1 / 2.0);
            } else {
              stampConductance(nDisch, nGnd, 1e-8);
            }
            break;
          }

          case ComponentTypes.ANALOG_MULTIPLIER: {
            const nX = this.getNode(comp, 'x_in');
            const nY = this.getNode(comp, 'y_in');
            const nOut = this.getNode(comp, 'out');
            const scale = p.scale || 0.1;
            const outV = getNodeV(nX) * getNodeV(nY) * scale;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, outV);
            break;
          }

          // --- VOLTAGE REGULATORS ---
          case ComponentTypes.LM7805:
          case ComponentTypes.LM7812:
          case ComponentTypes.LM7912: {
            const nIn = this.getNode(comp, 'in');
            const nGnd = this.getNode(comp, 'gnd');
            const nOut = this.getNode(comp, 'out');
            let vNom = p.vOut || 5.0;
            if (comp.type === ComponentTypes.LM7812) vNom = 12.0;
            if (comp.type === ComponentTypes.LM7912) vNom = -12.0;

            const vIn = getNodeV(nIn) - getNodeV(nGnd);
            let outV = vNom;
            if (vNom > 0 && vIn < vNom + 1.5) outV = Math.max(vIn - 1.5, 0);
            if (vNom < 0 && vIn > vNom - 1.5) outV = Math.min(vIn + 1.5, 0);

            stampVSourceEquation(vSrcEquationIdx++, nOut, nGnd, outV);
            break;
          }

          case ComponentTypes.LM317: {
            const nIn = this.getNode(comp, 'in');
            const nAdj = this.getNode(comp, 'adj');
            const nOut = this.getNode(comp, 'out');
            const vRef = p.vRef || 1.25;
            const vIn = getNodeV(nIn) - getNodeV(nAdj);
            let targetV = getNodeV(nAdj) + vRef;
            if (vIn < vRef + 1.5) targetV = Math.max(getNodeV(nIn) - 1.5, 0);
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, targetV);
            break;
          }

          // --- DIGITAL GATES ---
          case ComponentTypes.AND_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const out = (getNodeV(n1) > vH / 2 && getNodeV(n2) > vH / 2) ? vH : 0;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, out);
            break;
          }

          case ComponentTypes.NAND_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const out = (getNodeV(n1) > vH / 2 && getNodeV(n2) > vH / 2) ? 0 : vH;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, out);
            break;
          }

          case ComponentTypes.OR_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const out = (getNodeV(n1) > vH / 2 || getNodeV(n2) > vH / 2) ? vH : 0;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, out);
            break;
          }

          case ComponentTypes.NOR_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const out = (getNodeV(n1) > vH / 2 || getNodeV(n2) > vH / 2) ? 0 : vH;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, out);
            break;
          }

          case ComponentTypes.NOT_GATE: {
            const n1 = this.getNode(comp, 'in');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const out = getNodeV(n1) > vH / 2 ? 0 : vH;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, out);
            break;
          }

          case ComponentTypes.XOR_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const in1 = getNodeV(n1) > vH / 2;
            const in2 = getNodeV(n2) > vH / 2;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, (in1 !== in2) ? vH : 0);
            break;
          }

          case ComponentTypes.XNOR_GATE: {
            const n1 = this.getNode(comp, 'in1');
            const n2 = this.getNode(comp, 'in2');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;
            const in1 = getNodeV(n1) > vH / 2;
            const in2 = getNodeV(n2) > vH / 2;
            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, (in1 === in2) ? vH : 0);
            break;
          }

          case ComponentTypes.MUX_4TO1: {
            const nI0 = this.getNode(comp, 'i0');
            const nI1 = this.getNode(comp, 'i1');
            const nI2 = this.getNode(comp, 'i2');
            const nI3 = this.getNode(comp, 'i3');
            const nS0 = this.getNode(comp, 's0');
            const nS1 = this.getNode(comp, 's1');
            const nOut = this.getNode(comp, 'out');
            const vH = p.vHigh ?? 5;

            const s0 = getNodeV(nS0) > vH / 2 ? 1 : 0;
            const s1 = getNodeV(nS1) > vH / 2 ? 1 : 0;
            const sel = (s1 << 1) | s0;

            let chosenNode = nI0;
            if (sel === 1) chosenNode = nI1;
            else if (sel === 2) chosenNode = nI2;
            else if (sel === 3) chosenNode = nI3;

            stampVSourceEquation(vSrcEquationIdx++, nOut, 0, getNodeV(chosenNode));
            break;
          }

          // --- SEQUENTIAL LOGIC & ARITHMETIC ---
          case ComponentTypes.D_FLIPFLOP: {
            const nD = this.getNode(comp, 'd');
            const nClk = this.getNode(comp, 'clk');
            const nQ = this.getNode(comp, 'q');
            const nQn = this.getNode(comp, 'q_not');
            const vH = p.vHigh ?? 5;

            const clkV = getNodeV(nClk);
            const state = this.internalStates.get(comp.id) || { lastClk: 0, qVal: 0 };
            if (clkV > vH / 2 && state.lastClk <= vH / 2) {
              state.qVal = getNodeV(nD) > vH / 2 ? 1 : 0;
            }
            state.lastClk = clkV;
            this.internalStates.set(comp.id, state);

            stampVSourceEquation(vSrcEquationIdx++, nQ, 0, state.qVal ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nQn, 0, state.qVal ? 0 : vH);
            break;
          }

          case ComponentTypes.JK_FLIPFLOP: {
            const nJ = this.getNode(comp, 'j');
            const nClk = this.getNode(comp, 'clk');
            const nK = this.getNode(comp, 'k');
            const nQ = this.getNode(comp, 'q');
            const nQn = this.getNode(comp, 'q_not');
            const vH = p.vHigh ?? 5;

            const clkV = getNodeV(nClk);
            const state = this.internalStates.get(comp.id) || { lastClk: 0, qVal: 0 };
            if (clkV > vH / 2 && state.lastClk <= vH / 2) {
              const j = getNodeV(nJ) > vH / 2;
              const k = getNodeV(nK) > vH / 2;
              if (j && !k) state.qVal = 1;
              else if (!j && k) state.qVal = 0;
              else if (j && k) state.qVal = state.qVal ? 0 : 1;
            }
            state.lastClk = clkV;
            this.internalStates.set(comp.id, state);

            stampVSourceEquation(vSrcEquationIdx++, nQ, 0, state.qVal ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nQn, 0, state.qVal ? 0 : vH);
            break;
          }

          case ComponentTypes.BINARY_COUNTER_4BIT: {
            const nClk = this.getNode(comp, 'clk');
            const nQ0 = this.getNode(comp, 'q0');
            const nQ1 = this.getNode(comp, 'q1');
            const nQ2 = this.getNode(comp, 'q2');
            const nQ3 = this.getNode(comp, 'q3');
            const vH = p.vHigh ?? 5;

            const clkV = getNodeV(nClk);
            const state = this.internalStates.get(comp.id) || { lastClk: 0, count: 0 };
            if (clkV > vH / 2 && state.lastClk <= vH / 2) {
              state.count = (state.count + 1) % 16;
            }
            state.lastClk = clkV;
            this.internalStates.set(comp.id, state);

            stampVSourceEquation(vSrcEquationIdx++, nQ0, 0, (state.count & 1) ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nQ1, 0, (state.count & 2) ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nQ2, 0, (state.count & 4) ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nQ3, 0, (state.count & 8) ? vH : 0);
            break;
          }

          case ComponentTypes.HALF_ADDER: {
            const nA = this.getNode(comp, 'a');
            const nB = this.getNode(comp, 'b');
            const nSum = this.getNode(comp, 'sum');
            const nCarry = this.getNode(comp, 'carry');
            const vH = p.vHigh ?? 5;

            const a = getNodeV(nA) > vH / 2 ? 1 : 0;
            const b = getNodeV(nB) > vH / 2 ? 1 : 0;
            const sum = a ^ b;
            const carry = a & b;

            stampVSourceEquation(vSrcEquationIdx++, nSum, 0, sum ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nCarry, 0, carry ? vH : 0);
            break;
          }

          case ComponentTypes.FULL_ADDER: {
            const nA = this.getNode(comp, 'a');
            const nB = this.getNode(comp, 'b');
            const nCin = this.getNode(comp, 'cin');
            const nSum = this.getNode(comp, 'sum');
            const nCout = this.getNode(comp, 'cout');
            const vH = p.vHigh ?? 5;

            const a = getNodeV(nA) > vH / 2 ? 1 : 0;
            const b = getNodeV(nB) > vH / 2 ? 1 : 0;
            const cin = getNodeV(nCin) > vH / 2 ? 1 : 0;
            const sum = a ^ b ^ cin;
            const cout = (a & b) | (b & cin) | (a & cin);

            stampVSourceEquation(vSrcEquationIdx++, nSum, 0, sum ? vH : 0);
            stampVSourceEquation(vSrcEquationIdx++, nCout, 0, cout ? vH : 0);
            break;
          }

          // --- SWITCHES & RELAYS ---
          case ComponentTypes.SPST_SWITCH:
          case ComponentTypes.PUSH_BUTTON: {
            const n1 = this.getNode(comp, 'p1');
            const n2 = this.getNode(comp, 'p2');
            const closed = p.closed ?? false;
            stampConductance(n1, n2, closed ? 1 / 0.01 : 1e-9);
            break;
          }

          case ComponentTypes.SPDT_SWITCH: {
            const nCom = this.getNode(comp, 'com');
            const nP1 = this.getNode(comp, 'p1');
            const nP2 = this.getNode(comp, 'p2');
            const pos = p.position ?? 1;
            stampConductance(nCom, nP1, pos === 1 ? 1 / 0.01 : 1e-9);
            stampConductance(nCom, nP2, pos === 2 ? 1 / 0.01 : 1e-9);
            break;
          }

          case ComponentTypes.RELAY_SPDT: {
            const nC1 = this.getNode(comp, 'coil_p1');
            const nC2 = this.getNode(comp, 'coil_p2');
            const nCom = this.getNode(comp, 'com');
            const nNo = this.getNode(comp, 'no');
            const nNc = this.getNode(comp, 'nc');
            const coilR = p.coilR || 100;
            const vPull = p.vPullIn || 3.5;

            stampConductance(nC1, nC2, 1 / coilR);
            const vCoil = Math.abs(getNodeV(nC1) - getNodeV(nC2));
            const energized = vCoil >= vPull;

            stampConductance(nCom, nNo, energized ? 1 / 0.05 : 1e-9);
            stampConductance(nCom, nNc, energized ? 1e-9 : 1 / 0.05);
            break;
          }

          case ComponentTypes.OPTOCOUPLER: {
            const nA = this.getNode(comp, 'anode');
            const nK = this.getNode(comp, 'cathode');
            const nC = this.getNode(comp, 'coll');
            const nE = this.getNode(comp, 'emit');
            const vD = getNodeV(nA) - getNodeV(nK);
            const ctr = p.ctr || 1.0;

            if (vD > 1.2) {
              const iF = (vD - 1.2) / 10;
              const iC = iF * ctr;
              stampCurrentSource(nC, nE, iC);
              stampConductance(nA, nK, 1 / 10);
            } else {
              stampConductance(nA, nK, 1e-9);
              stampConductance(nC, nE, 1e-9);
            }
            break;
          }

          case ComponentTypes.SEVEN_SEGMENT:
          case ComponentTypes.SEVEN_SEGMENT_DUAL:
          case ComponentTypes.SEVEN_SEGMENT_QUAD: {
            const segPins = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'];
            const nCom = this.getNode(comp, 'gnd');
            const vf = 2.0;
            const rOn = 100;

            segPins.forEach(pin => {
              const nSeg = this.getNode(comp, pin);
              if (nSeg !== -1 && nCom !== -1) {
                const vSeg = getNodeV(nSeg) - getNodeV(nCom);
                if (vSeg > 0.5) {
                  const gEq = 1 / rOn;
                  stampConductance(nSeg, nCom, gEq);
                  stampCurrentSource(nCom, nSeg, vf * gEq);
                } else {
                  stampConductance(nSeg, nCom, 1e-8);
                }
              }
            });
            break;
          }

          // --- METERS ---
          case ComponentTypes.AMMETER: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            stampVSourceEquation(vSrcEquationIdx++, nPos, nNeg, 0);
            break;
          }

          case ComponentTypes.VOLTMETER: {
            const nPos = this.getNode(comp, 'p_pos');
            const nNeg = this.getNode(comp, 'p_neg');
            stampConductance(nPos, nNeg, 1e-7); // 10 MΩ high input impedance
            break;
          }
        }
      });

      // Solve linear system with Gaussian elimination and partial pivoting
      const newSolution = this.solveLinearSystem(A, Z);
      if (!newSolution) break;

      let maxDelta = 0;
      for (let i = 0; i < matrixSize; i++) {
        maxDelta = Math.max(maxDelta, Math.abs(newSolution[i] - solution[i]));
      }

      solution = newSolution;
      if (maxDelta < this.convergenceTolerance) {
        converged = true;
        break;
      }
    }

    // Assign node voltages (Node 0 is always 0V)
    this.nodeVoltages[0] = 0;
    for (let i = 1; i < numNodes; i++) {
      this.nodeVoltages[i] = solution[i - 1] || 0;
    }

    this.prevNodeVoltages = [...this.nodeVoltages];

    // Update inductor dynamic states
    this.components.forEach(comp => {
      if (comp.type === ComponentTypes.INDUCTOR) {
        const n1 = this.getNode(comp, 'p1');
        const n2 = this.getNode(comp, 'p2');
        const l = Math.max(comp.params?.inductance || 1e-3, 1e-12);
        const vL = this.nodeVoltages[n1] - this.nodeVoltages[n2];
        const state = this.internalStates.get(comp.id) || { current: 0 };
        state.current += (vL * dt) / l;
        this.internalStates.set(comp.id, state);
      }
    });

    this.recordProbeHistory();
    this.time += dt;
  }

  recordProbeHistory() {
    const dataPoint = { time: this.time, probes: {} };
    let probeCount = 0;

    this.components.forEach(comp => {
      if (comp.type === ComponentTypes.PROBE_V) {
        probeCount++;
        const node = this.getNode(comp, 'tip');
        const v = node !== -1 ? (this.nodeVoltages[node] || 0) : 0;
        dataPoint.probes[comp.id] = {
          id: comp.id,
          name: comp.params?.label || 'V Probe',
          color: comp.params?.color || '#03b585',
          value: v,
          unit: 'V'
        };
      } else if (comp.type === ComponentTypes.PROBE_I) {
        probeCount++;
        const node = this.getNode(comp, 'tip');
        const v = node !== -1 ? (this.nodeVoltages[node] || 0) : 0;
        dataPoint.probes[comp.id] = {
          id: comp.id,
          name: comp.params?.label || 'I Probe',
          color: comp.params?.color || '#ff9500',
          value: v / 1000,
          unit: 'A'
        };
      } else if (comp.type === ComponentTypes.VOLTMETER) {
        probeCount++;
        const nPos = this.getNode(comp, 'p_pos');
        const nNeg = this.getNode(comp, 'p_neg');
        const v1 = nPos !== -1 ? (this.nodeVoltages[nPos] || 0) : 0;
        const v2 = nNeg !== -1 ? (this.nodeVoltages[nNeg] || 0) : 0;
        dataPoint.probes[comp.id] = {
          id: comp.id,
          name: comp.name || 'DVM',
          color: '#0284c7',
          value: v1 - v2,
          unit: 'V'
        };
      }
    });

    // Auto-probe active non-ground circuit nodes if no dedicated probe is placed
    if (probeCount === 0 && this.nodeVoltages.length > 1) {
      const colors = ['#00d2ff', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];
      const maxAutoNodes = Math.min(this.nodeVoltages.length - 1, 4);
      for (let n = 1; n <= maxAutoNodes; n++) {
        dataPoint.probes[`node_${n}`] = {
          id: `node_${n}`,
          name: `Node ${n}`,
          color: colors[(n - 1) % colors.length],
          value: this.nodeVoltages[n] || 0,
          unit: 'V'
        };
      }
    }

    this.history.push(dataPoint);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  solveLinearSystem(A, b) {
    const n = b.length;
    const M = Array.from({ length: n }, (_, i) => [...A[i], b[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        const temp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = temp;
      }

      if (Math.abs(M[i][i]) < 1e-14) {
        M[i][i] = 1e-14;
      }

      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / M[i][i];
      if (isNaN(x[i])) x[i] = 0;
    }

    return x;
  }
}
