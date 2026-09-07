/**
 * Switcha Blocks — Pre-Built Benchmark Models Library
 * Engineering reference block diagrams:
 * 1. DC Motor Speed Closed-Loop PID Control
 * 2. 2nd-Order Mass-Spring-Damper Underdamped Step Response
 * 3. AM Radio Modulation over AWGN Noise Channel
 * 4. First-Order Thermal Process with Transport Delay
 */

import { BlockTypes } from './block-types.js';

export const BlockLibrary = {
  // 1. DC Motor Speed Closed-Loop PID Control
  dcMotorPid: {
    id: 'dc-motor-pid',
    name: 'DC Motor Speed Closed-Loop PID Control',
    description: 'Negative feedback speed control of a DC motor plant G(s) = 2/(0.5s + 1) driven by a tuned PID Controller with setpoint step.',
    category: 'Control Systems',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      // Step Setpoint (r = 10 rad/s at t = 1.0s)
      const setpoint = canvas.addBlock(BlockTypes.STEP, 100, 200, { stepTime: 1.0, initialValue: 0.0, finalValue: 10.0 });
      setpoint.name = 'Speed Setpoint';

      // Error Comparator (Sum: r - y)
      const sum = canvas.addBlock(BlockTypes.SUM, 220, 200, { signs: '+-' });
      sum.name = 'Error Comparator';

      // PID Controller (P=2.5, I=3.0, D=0.15)
      const pid = canvas.addBlock(BlockTypes.PID_CONTROLLER, 360, 200, { P: 2.5, I: 3.0, D: 0.15, N: 50, antiWindup: true, uMax: 24, uMin: -24 });
      pid.name = 'PID Controller';

      // Plant Transfer Function G(s) = 2 / (0.5s + 1)
      const plant = canvas.addBlock(BlockTypes.TRANSFER_FCN, 520, 200, { numerator: '[2]', denominator: '[0.5, 1]' });
      plant.name = 'DC Motor Plant';

      // Multi-Input Scope (CH1: Setpoint, CH2: Motor Speed Output)
      const scope = canvas.addBlock(BlockTypes.SCOPE, 680, 200, { timeSpan: 5.0, title: 'Motor Speed vs Setpoint' });
      scope.name = 'Speed Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: setpoint.id, fromPort: 'out', toBlock: sum.id, toPort: 'in1' },
        { id: 'w2', fromBlock: setpoint.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w3', fromBlock: sum.id, fromPort: 'out', toBlock: pid.id, toPort: 'in' },
        { id: 'w4', fromBlock: pid.id, fromPort: 'out', toBlock: plant.id, toPort: 'in' },
        { id: 'w5', fromBlock: plant.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' },
        // Feedback wire from plant output back to sum in2
        { id: 'w6', fromBlock: plant.id, fromPort: 'out', toBlock: sum.id, toPort: 'in2' }
      ];
    }
  },

  // 2. 2nd-Order Mass-Spring-Damper Underdamped Step Response
  massSpringDamper: {
    id: 'mass-spring-damper',
    name: '2nd-Order Harmonic Oscillator Step Response',
    description: 'Standard 2nd-order dynamic system G(s) = ωn² / (s² + 2ζωn s + ωn²) demonstrating underdamped oscillation and overshoot.',
    category: 'Mechanical Systems',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const step = canvas.addBlock(BlockTypes.STEP, 120, 200, { stepTime: 0.5, initialValue: 0.0, finalValue: 1.0 });
      step.name = 'Force Step F(t)';

      // G(s) = 25 / (s^2 + 2s + 25) => wn = 5 rad/s, zeta = 0.2 (underdamped)
      const plant = canvas.addBlock(BlockTypes.TRANSFER_FCN, 320, 200, { numerator: '[25]', denominator: '[1, 2, 25]' });
      plant.name = '2nd-Order Plant G(s)';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 500, 200, { timeSpan: 6.0, title: 'Displacement x(t)' });
      scope.name = 'Oscilloscope';

      canvas.wires = [
        { id: 'w1', fromBlock: step.id, fromPort: 'out', toBlock: plant.id, toPort: 'in' },
        { id: 'w2', fromBlock: step.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w3', fromBlock: plant.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' }
      ];
    }
  },

  // 3. AM Radio Modulation & AWGN Noise Channel
  amCommunicationSystem: {
    id: 'am-comm-system',
    name: 'AM Radio Transmission over AWGN Noise Channel',
    description: 'Complete analog communication link: Modulating message signal m(t), 100Hz RF carrier c(t), AM Modulator, AWGN Noise Channel, and Receiver Scope.',
    category: 'Communication Systems',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const msg = canvas.addBlock(BlockTypes.SINE_GEN, 100, 140, { frequency: 5.0, amplitude: 1.0 });
      msg.name = 'Message Audio m(t)';

      const carrier = canvas.addBlock(BlockTypes.SINE_GEN, 100, 260, { frequency: 50.0, amplitude: 2.0 });
      carrier.name = 'RF Carrier c(t)';

      const amMod = canvas.addBlock(BlockTypes.AM_MODULATOR, 280, 200, { modIndex: 0.8 });
      amMod.name = 'AM Modulator';

      const awgn = canvas.addBlock(BlockTypes.AWGN_CHANNEL, 440, 200, { snrDb: 15.0 });
      awgn.name = 'Wireless AWGN Channel';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 600, 200, { timeSpan: 1.0, title: 'AM Transmit & Noisy Received Signals' });
      scope.name = 'Comm Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: msg.id, fromPort: 'out', toBlock: amMod.id, toPort: 'm' },
        { id: 'w2', fromBlock: carrier.id, fromPort: 'out', toBlock: amMod.id, toPort: 'c' },
        { id: 'w3', fromBlock: amMod.id, fromPort: 'out', toBlock: awgn.id, toPort: 'in' },
        { id: 'w4', fromBlock: amMod.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w5', fromBlock: awgn.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' }
      ];
    }
  },

  loadModel(key, canvas) {
    if (this[key] && typeof this[key].load === 'function') {
      this[key].load(canvas);
      return;
    }
    const map = {
      'dc_motor_pid': this.dcMotorPid,
      'mass_spring_damper': this.massSpringDamper,
      'am_radio_channel': this.amRadioChannel
    };
    if (map[key] && typeof map[key].load === 'function') {
      map[key].load(canvas);
    }
  }
};

const SwitchaBlocksLibrary = BlockLibrary;

if (typeof window !== 'undefined') {
  window.BlockLibrary = BlockLibrary;
  window.SwitchaBlocksLibrary = SwitchaBlocksLibrary;
}

export { SwitchaBlocksLibrary };

