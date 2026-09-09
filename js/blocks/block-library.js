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

  // 4. First-Order Thermal Process with Transport Delay
  thermalDelay: {
    id: 'thermal-delay',
    name: 'Thermal Process with Dead-Time Transport Delay',
    description: 'Closed-loop PI temperature control of a thermal process G(s) = 1.2/(2.5s + 1) with 0.8s pipeline transport delay.',
    category: 'Process Control',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const setpoint = canvas.addBlock(BlockTypes.STEP, 100, 200, { stepTime: 1.0, initialValue: 20.0, finalValue: 60.0 });
      setpoint.name = 'Target Temp (60°C)';

      const sum = canvas.addBlock(BlockTypes.SUM, 220, 200, { signs: '+-' });
      sum.name = 'Error';

      const pid = canvas.addBlock(BlockTypes.PID_CONTROLLER, 350, 200, { P: 1.5, I: 0.8, D: 0.2, N: 20, antiWindup: true, uMax: 100, uMin: 0 });
      pid.name = 'Heater PI Controller';

      const plant = canvas.addBlock(BlockTypes.LAG_FIRST_ORDER, 500, 200, { gain: 1.2, timeConstant: 2.5 });
      plant.name = 'Thermal Chamber Lag';

      const delay = canvas.addBlock(BlockTypes.TRANSPORT_DELAY, 640, 200, { delayTime: 0.8, initialOutput: 20.0 });
      delay.name = 'Pipeline Delay (0.8s)';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 780, 200, { timeSpan: 12.0, title: 'Temperature Response' });
      scope.name = 'Temp Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: setpoint.id, fromPort: 'out', toBlock: sum.id, toPort: 'in1' },
        { id: 'w2', fromBlock: setpoint.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w3', fromBlock: sum.id, fromPort: 'out', toBlock: pid.id, toPort: 'in' },
        { id: 'w4', fromBlock: pid.id, fromPort: 'out', toBlock: plant.id, toPort: 'in' },
        { id: 'w5', fromBlock: plant.id, fromPort: 'out', toBlock: delay.id, toPort: 'in' },
        { id: 'w6', fromBlock: delay.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' },
        { id: 'w7', fromBlock: delay.id, fromPort: 'out', toBlock: sum.id, toPort: 'in2' }
      ];
    }
  },

  // 5. Inverted Pendulum Stabilizing Control
  invertedPendulum: {
    id: 'inverted-pendulum',
    name: 'Inverted Pendulum Balancing Control',
    description: 'Stabilizing an unstable inverted pendulum plant G(s) = 1/(s² - 9.8) using a tuned feedback PID controller.',
    category: 'Robotics & Control',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const dist = canvas.addBlock(BlockTypes.STEP, 100, 200, { stepTime: 0.5, initialValue: 0.0, finalValue: 0.1 });
      dist.name = 'Torque Disturbance';

      const sum = canvas.addBlock(BlockTypes.SUM, 220, 200, { signs: '+-' });
      sum.name = 'Balancing Error';

      const pid = canvas.addBlock(BlockTypes.PID_CONTROLLER, 360, 200, { P: 35.0, I: 4.0, D: 8.5, N: 100 });
      pid.name = 'Stabilizing PD Controller';

      const plant = canvas.addBlock(BlockTypes.TRANSFER_FCN, 520, 200, { numerator: '[1]', denominator: '[1, 0, -9.8]' });
      plant.name = 'Unstable Pendulum G(s)';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 680, 200, { timeSpan: 5.0, title: 'Pendulum Angle θ(t)' });
      scope.name = 'Angle Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: dist.id, fromPort: 'out', toBlock: sum.id, toPort: 'in1' },
        { id: 'w2', fromBlock: sum.id, fromPort: 'out', toBlock: pid.id, toPort: 'in' },
        { id: 'w3', fromBlock: pid.id, fromPort: 'out', toBlock: plant.id, toPort: 'in' },
        { id: 'w4', fromBlock: plant.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w5', fromBlock: plant.id, fromPort: 'out', toBlock: sum.id, toPort: 'in2' }
      ];
    }
  },

  // 6. Van der Pol Nonlinear Relaxation Oscillator
  vanDerPolOscillator: {
    id: 'van-der-pol',
    name: 'Van der Pol Nonlinear Limit Cycle Oscillator',
    description: 'Famous nonlinear relaxation oscillator exhibiting self-excited limit cycles and phase space trajectories.',
    category: 'Nonlinear Dynamics',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const int1 = canvas.addBlock(BlockTypes.INTEGRATOR, 480, 180, { initialCondition: 0.0 });
      int1.name = 'Velocity Integrator (dx/dt)';

      const int2 = canvas.addBlock(BlockTypes.INTEGRATOR, 620, 180, { initialCondition: 0.5 });
      int2.name = 'Position Integrator x(t)';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 760, 200, { timeSpan: 20.0, title: 'Phase Trajectory x vs dx/dt' });
      scope.name = 'Van der Pol Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: int1.id, fromPort: 'out', toBlock: int2.id, toPort: 'in' },
        { id: 'w2', fromBlock: int2.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w3', fromBlock: int1.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' }
      ];
    }
  },

  // 7. Discontinuous Bouncing Ball
  bouncingBall: {
    id: 'bouncing-ball',
    name: 'Bouncing Ball with Ground Impact Dynamics',
    description: 'Kinematic simulation of a ball falling under gravity (-9.81 m/s²) with bounded ground contact.',
    category: 'Hybrid Dynamics',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const gravity = canvas.addBlock(BlockTypes.CONSTANT, 100, 180, { value: -9.81 });
      gravity.name = 'Gravity g (-9.81 m/s²)';

      const vInt = canvas.addBlock(BlockTypes.INTEGRATOR, 260, 180, { initialCondition: 0.0 });
      vInt.name = 'Velocity Integrator v(t)';

      const hInt = canvas.addBlock(BlockTypes.INTEGRATOR, 420, 180, { initialCondition: 10.0, limitOutput: true, lowerLimit: 0.0, upperLimit: 100 });
      hInt.name = 'Height Integrator h(t)';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 580, 200, { timeSpan: 6.0, title: 'Ball Trajectory h(t)' });
      scope.name = 'Trajectory Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: gravity.id, fromPort: 'out', toBlock: vInt.id, toPort: 'in' },
        { id: 'w2', fromBlock: vInt.id, fromPort: 'out', toBlock: hInt.id, toPort: 'in' },
        { id: 'w3', fromBlock: hInt.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w4', fromBlock: vInt.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' }
      ];
    }
  },

  // 8. Switching DC-DC Buck Regulator
  buckConverter: {
    id: 'buck-converter',
    name: 'Switching DC-DC Buck Regulator (12V to 5V)',
    description: 'Power electronics DC-DC step-down switching regulator converting 12V pulse train into smooth 5.0V output.',
    category: 'Power Electronics',
    load(canvas) {
      canvas.blocks = [];
      canvas.wires = [];

      const pwm = canvas.addBlock(BlockTypes.PULSE_GEN, 100, 180, { period: 0.01, dutyCycle: 41.7, amplitude: 12.0 });
      pwm.name = '12V PWM Switch';

      const lcFilter = canvas.addBlock(BlockTypes.TRANSFER_FCN, 320, 180, { numerator: '[15625]', denominator: '[1, 175, 15625]' });
      lcFilter.name = 'LC Low-Pass Filter';

      const scope = canvas.addBlock(BlockTypes.SCOPE, 500, 200, { timeSpan: 0.1, title: 'Buck Converter Output 5.0V' });
      scope.name = 'Regulator Scope';

      canvas.wires = [
        { id: 'w1', fromBlock: pwm.id, fromPort: 'out', toBlock: lcFilter.id, toPort: 'in' },
        { id: 'w2', fromBlock: pwm.id, fromPort: 'out', toBlock: scope.id, toPort: 'in1' },
        { id: 'w3', fromBlock: lcFilter.id, fromPort: 'out', toBlock: scope.id, toPort: 'in2' }
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
      'dcMotorPid': this.dcMotorPid,
      'mass_spring_damper': this.massSpringDamper,
      'massSpringDamper': this.massSpringDamper,
      'am_radio_channel': this.amCommunicationSystem,
      'amCommunicationSystem': this.amCommunicationSystem,
      'am_comm_system': this.amCommunicationSystem,
      'thermal_delay': this.thermalDelay,
      'thermalDelay': this.thermalDelay,
      'inverted_pendulum': this.invertedPendulum,
      'invertedPendulum': this.invertedPendulum,
      'van_der_pol': this.vanDerPolOscillator,
      'vanDerPolOscillator': this.vanDerPolOscillator,
      'bouncing_ball': this.bouncingBall,
      'bouncingBall': this.bouncingBall,
      'buck_converter': this.buckConverter,
      'buckConverter': this.buckConverter
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

