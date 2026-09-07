/**
 * Switcha Blocks — Dynamic System Block Definitions
 * Deep, scalable block categories for systems & signal simulation:
 * 1. Sources (Constant, Step, Ramp, Sine, Pulse, Noise, Clock)
 * 2. Math Operations (Sum, Subtract, Multiply, Divide, Gain, Math Functions)
 * 3. Continuous Systems (Integrator 1/s, Derivative, Transfer Function, State-Space, First-Order Lag, Transport Delay)
 * 4. Discrete Systems (Unit Delay z^-1, Zero-Order Hold ZOH, Discrete Integrator, Discrete Filter)
 * 5. Control Systems (PID Controller with Anti-Windup, Saturation, Rate Limiter, Dead Zone, Relay)
 * 6. DSP & Signal Processing (FIR/IIR Filter, Moving Average, Envelope Detector, Sample & Hold)
 * 7. Communication Systems (AM/FM Modulator/Demodulator, BPSK Modulator, AWGN Channel, PRBS Source, BER Sink)
 * 8. Sinks & Visualizers (Scope, XY Grapher, Display Readout, To Workspace)
 */

export const BlockCategory = {
  SOURCES: 'Sources & Generators',
  MATH: 'Math Operations',
  CONTINUOUS: 'Continuous Systems',
  DISCRETE: 'Discrete Systems',
  CONTROL: 'Control Systems',
  DSP: 'DSP & Filtering',
  COMMUNICATION: 'Communication Systems',
  SINKS: 'Sinks & Visualizers'
};

export const BlockTypes = {
  // Sources
  CONSTANT: 'CONSTANT',
  STEP: 'STEP',
  RAMP: 'RAMP',
  SINE_GEN: 'SINE_GEN',
  PULSE_GEN: 'PULSE_GEN',
  NOISE_GEN: 'NOISE_GEN',
  CLOCK_GEN: 'CLOCK_GEN',

  // Math
  SUM: 'SUM',
  SUBTRACT: 'SUBTRACT',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  GAIN: 'GAIN',
  MATH_FUNC: 'MATH_FUNC',

  // Continuous
  INTEGRATOR: 'INTEGRATOR',
  DERIVATIVE: 'DERIVATIVE',
  TRANSFER_FCN: 'TRANSFER_FCN',
  STATE_SPACE: 'STATE_SPACE',
  LAG_FIRST_ORDER: 'LAG_FIRST_ORDER',
  TRANSPORT_DELAY: 'TRANSPORT_DELAY',

  // Discrete
  UNIT_DELAY: 'UNIT_DELAY',
  ZERO_ORDER_HOLD: 'ZERO_ORDER_HOLD',
  DISCRETE_INTEGRATOR: 'DISCRETE_INTEGRATOR',
  DISCRETE_FILTER: 'DISCRETE_FILTER',

  // Control
  PID_CONTROLLER: 'PID_CONTROLLER',
  SATURATION: 'SATURATION',
  RATE_LIMITER: 'RATE_LIMITER',
  DEAD_ZONE: 'DEAD_ZONE',
  RELAY_HYSTERESIS: 'RELAY_HYSTERESIS',

  // DSP
  FIR_FILTER: 'FIR_FILTER',
  IIR_FILTER: 'IIR_FILTER',
  MOVING_AVERAGE: 'MOVING_AVERAGE',
  ENVELOPE_DETECTOR: 'ENVELOPE_DETECTOR',

  // Communications
  AM_MODULATOR: 'AM_MODULATOR',
  AM_DEMODULATOR: 'AM_DEMODULATOR',
  FM_MODULATOR: 'FM_MODULATOR',
  FM_DEMODULATOR: 'FM_DEMODULATOR',
  BPSK_MODULATOR: 'BPSK_MODULATOR',
  AWGN_CHANNEL: 'AWGN_CHANNEL',
  PRBS_SOURCE: 'PRBS_SOURCE',
  BER_SINK: 'BER_SINK',

  // Sinks
  SCOPE: 'SCOPE',
  XY_GRAPH: 'XY_GRAPH',
  DISPLAY_READOUT: 'DISPLAY_READOUT',
  TO_WORKSPACE: 'TO_WORKSPACE'
};

export const BlockDefinitions = {
  // --- 1. SOURCES ---
  [BlockTypes.CONSTANT]: {
    type: BlockTypes.CONSTANT,
    name: 'Constant Value',
    category: BlockCategory.SOURCES,
    width: 50, height: 40,
    inputs: [],
    outputs: [{ id: 'out', label: 'y', x: 25, y: 0, dir: 'right' }],
    params: { value: 1.0 },
    paramSchema: [{ key: 'value', label: 'Constant Value (C)', type: 'number', default: 1.0 }]
  },
  [BlockTypes.STEP]: {
    type: BlockTypes.STEP,
    name: 'Step Input',
    category: BlockCategory.SOURCES,
    width: 55, height: 45,
    inputs: [],
    outputs: [{ id: 'out', label: 'y', x: 27, y: 0, dir: 'right' }],
    params: { stepTime: 1.0, initialValue: 0.0, finalValue: 1.0 },
    paramSchema: [
      { key: 'stepTime', label: 'Step Time (s)', type: 'number', default: 1.0 },
      { key: 'initialValue', label: 'Initial Value', type: 'number', default: 0.0 },
      { key: 'finalValue', label: 'Final Value', type: 'number', default: 1.0 }
    ]
  },
  [BlockTypes.RAMP]: {
    type: BlockTypes.RAMP,
    name: 'Ramp Generator',
    category: BlockCategory.SOURCES,
    width: 55, height: 45,
    inputs: [],
    outputs: [{ id: 'out', label: 'y', x: 27, y: 0, dir: 'right' }],
    params: { slope: 1.0, startTime: 0.0, initialOutput: 0.0 },
    paramSchema: [
      { key: 'slope', label: 'Slope (dy/dt)', type: 'number', default: 1.0 },
      { key: 'startTime', label: 'Start Time (s)', type: 'number', default: 0.0 }
    ]
  },
  [BlockTypes.SINE_GEN]: {
    type: BlockTypes.SINE_GEN,
    name: 'Sine Wave Source',
    category: BlockCategory.SOURCES,
    width: 60, height: 50,
    inputs: [],
    outputs: [{ id: 'out', label: 'y', x: 30, y: 0, dir: 'right' }],
    params: { amplitude: 1.0, frequency: 1.0, phase: 0.0, offset: 0.0 },
    paramSchema: [
      { key: 'amplitude', label: 'Amplitude (A)', type: 'number', default: 1.0 },
      { key: 'frequency', label: 'Frequency (Hz)', type: 'number', default: 1.0 },
      { key: 'phase', label: 'Phase Angle (°)', type: 'number', default: 0.0 },
      { key: 'offset', label: 'DC Offset', type: 'number', default: 0.0 }
    ]
  },
  [BlockTypes.NOISE_GEN]: {
    type: BlockTypes.NOISE_GEN,
    name: 'Gaussian White Noise',
    category: BlockCategory.SOURCES,
    width: 60, height: 45,
    inputs: [],
    outputs: [{ id: 'out', label: 'y', x: 30, y: 0, dir: 'right' }],
    params: { mean: 0.0, variance: 0.1, seed: 12345 },
    paramSchema: [
      { key: 'mean', label: 'Mean Value (μ)', type: 'number', default: 0.0 },
      { key: 'variance', label: 'Variance (σ²)', type: 'number', default: 0.1 }
    ]
  },

  // --- 2. MATH OPERATIONS ---
  [BlockTypes.SUM]: {
    type: BlockTypes.SUM,
    name: 'Sum / Difference (Σ)',
    category: BlockCategory.MATH,
    width: 45, height: 45,
    inputs: [
      { id: 'in1', label: '+', x: -22, y: -12, dir: 'left', sign: '+' },
      { id: 'in2', label: '-', x: -22, y: 12, dir: 'left', sign: '-' }
    ],
    outputs: [{ id: 'out', label: 'Σ', x: 22, y: 0, dir: 'right' }],
    params: { signs: '+-' },
    paramSchema: [{ key: 'signs', label: 'Port Signs (e.g. ++, +-, ++-)', type: 'string', default: '+-' }]
  },
  [BlockTypes.GAIN]: {
    type: BlockTypes.GAIN,
    name: 'Proportional Gain (K)',
    category: BlockCategory.MATH,
    width: 50, height: 40,
    inputs: [{ id: 'in', label: 'u', x: -25, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 25, y: 0, dir: 'right' }],
    params: { gain: 2.0 },
    paramSchema: [{ key: 'gain', label: 'Gain Value (K)', type: 'number', default: 2.0 }]
  },
  [BlockTypes.MULTIPLY]: {
    type: BlockTypes.MULTIPLY,
    name: 'Product (u1 × u2)',
    category: BlockCategory.MATH,
    width: 45, height: 45,
    inputs: [
      { id: 'in1', label: 'u1', x: -22, y: -12, dir: 'left' },
      { id: 'in2', label: 'u2', x: -22, y: 12, dir: 'left' }
    ],
    outputs: [{ id: 'out', label: 'y', x: 22, y: 0, dir: 'right' }],
    params: {},
    paramSchema: []
  },
  [BlockTypes.MATH_FUNC]: {
    type: BlockTypes.MATH_FUNC,
    name: 'Math Function',
    category: BlockCategory.MATH,
    width: 60, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -30, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 30, y: 0, dir: 'right' }],
    params: { func: 'abs' },
    paramSchema: [
      { key: 'func', label: 'Function', type: 'select', options: ['abs', 'sqrt', 'exp', 'log', 'sin', 'cos', 'square', 'sign'], default: 'abs' }
    ]
  },

  // --- 3. CONTINUOUS SYSTEMS ---
  [BlockTypes.INTEGRATOR]: {
    type: BlockTypes.INTEGRATOR,
    name: 'Continuous Integrator (1/s)',
    category: BlockCategory.CONTINUOUS,
    width: 55, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -27, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: '∫', x: 27, y: 0, dir: 'right' }],
    params: { initialCondition: 0.0, limitOutput: false, upperLimit: 10, lowerLimit: -10 },
    paramSchema: [
      { key: 'initialCondition', label: 'Initial Condition x(0)', type: 'number', default: 0.0 },
      { key: 'limitOutput', label: 'Enable Output Clamping', type: 'boolean', default: false }
    ]
  },
  [BlockTypes.DERIVATIVE]: {
    type: BlockTypes.DERIVATIVE,
    name: 'Derivative (s)',
    category: BlockCategory.CONTINUOUS,
    width: 55, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -27, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'du/dt', x: 27, y: 0, dir: 'right' }],
    params: { timeConstant: 0.001 },
    paramSchema: [{ key: 'timeConstant', label: 'Filter Time Constant (s)', type: 'number', default: 0.001 }]
  },
  [BlockTypes.TRANSFER_FCN]: {
    type: BlockTypes.TRANSFER_FCN,
    name: 'Continuous Transfer Function G(s)',
    category: BlockCategory.CONTINUOUS,
    width: 90, height: 55,
    inputs: [{ id: 'in', label: 'u', x: -45, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 45, y: 0, dir: 'right' }],
    params: { numerator: '[1]', denominator: '[1, 2, 1]' }, // e.g. 1 / (s^2 + 2s + 1)
    paramSchema: [
      { key: 'numerator', label: 'Numerator Coefficients [b_m, ..., b0]', type: 'string', default: '[1]' },
      { key: 'denominator', label: 'Denominator Coefficients [a_n, ..., a0]', type: 'string', default: '[1, 2, 1]' }
    ]
  },
  [BlockTypes.STATE_SPACE]: {
    type: BlockTypes.STATE_SPACE,
    name: 'State-Space Model (A,B,C,D)',
    category: BlockCategory.CONTINUOUS,
    width: 85, height: 60,
    inputs: [{ id: 'in', label: 'u', x: -42, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 42, y: 0, dir: 'right' }],
    params: { A: '[-2]', B: '[1]', C: '[1]', D: '[0]', x0: '[0]' },
    paramSchema: [
      { key: 'A', label: 'Matrix A (State)', type: 'string', default: '[-2]' },
      { key: 'B', label: 'Matrix B (Input)', type: 'string', default: '[1]' },
      { key: 'C', label: 'Matrix C (Output)', type: 'string', default: '[1]' },
      { key: 'D', label: 'Matrix D (Feedthrough)', type: 'string', default: '[0]' }
    ]
  },
  [BlockTypes.LAG_FIRST_ORDER]: {
    type: BlockTypes.LAG_FIRST_ORDER,
    name: 'First-Order Lag (1/(τs+1))',
    category: BlockCategory.CONTINUOUS,
    width: 75, height: 50,
    inputs: [{ id: 'in', label: 'u', x: -37, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 37, y: 0, dir: 'right' }],
    params: { timeConstant: 0.5, gain: 1.0 },
    paramSchema: [
      { key: 'timeConstant', label: 'Time Constant τ (s)', type: 'number', default: 0.5 },
      { key: 'gain', label: 'DC Gain (K)', type: 'number', default: 1.0 }
    ]
  },

  // --- 4. DISCRETE SYSTEMS ---
  [BlockTypes.UNIT_DELAY]: {
    type: BlockTypes.UNIT_DELAY,
    name: 'Unit Delay (z^-1)',
    category: BlockCategory.DISCRETE,
    width: 55, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -27, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'z^-1', x: 27, y: 0, dir: 'right' }],
    params: { sampleTime: 0.01, initialCondition: 0.0 },
    paramSchema: [
      { key: 'sampleTime', label: 'Sample Time Ts (s)', type: 'number', default: 0.01 },
      { key: 'initialCondition', label: 'Initial State', type: 'number', default: 0.0 }
    ]
  },
  [BlockTypes.ZERO_ORDER_HOLD]: {
    type: BlockTypes.ZERO_ORDER_HOLD,
    name: 'Zero-Order Hold (ZOH)',
    category: BlockCategory.DISCRETE,
    width: 60, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -30, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'ZOH', x: 30, y: 0, dir: 'right' }],
    params: { sampleTime: 0.01 },
    paramSchema: [{ key: 'sampleTime', label: 'Sample Period Ts (s)', type: 'number', default: 0.01 }]
  },

  // --- 5. CONTROL SYSTEMS ---
  [BlockTypes.PID_CONTROLLER]: {
    type: BlockTypes.PID_CONTROLLER,
    name: 'PID Controller with Filtered D',
    category: BlockCategory.CONTROL,
    width: 80, height: 55,
    inputs: [{ id: 'in', label: 'e', x: -40, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'u', x: 40, y: 0, dir: 'right' }],
    params: { P: 2.0, I: 1.0, D: 0.1, N: 100, antiWindup: true, uMax: 10, uMin: -10 },
    paramSchema: [
      { key: 'P', label: 'Proportional Gain (Kp)', type: 'number', default: 2.0 },
      { key: 'I', label: 'Integral Gain (Ki)', type: 'number', default: 1.0 },
      { key: 'D', label: 'Derivative Gain (Kd)', type: 'number', default: 0.1 },
      { key: 'N', label: 'Derivative Filter Divisor (N)', type: 'number', default: 100 },
      { key: 'antiWindup', label: 'Enable Anti-Windup Clamping', type: 'boolean', default: true }
    ]
  },
  [BlockTypes.SATURATION]: {
    type: BlockTypes.SATURATION,
    name: 'Saturation Limiter',
    category: BlockCategory.CONTROL,
    width: 55, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -27, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'sat', x: 27, y: 0, dir: 'right' }],
    params: { upperLimit: 5.0, lowerLimit: -5.0 },
    paramSchema: [
      { key: 'upperLimit', label: 'Upper Limit', type: 'number', default: 5.0 },
      { key: 'lowerLimit', label: 'Lower Limit', type: 'number', default: -5.0 }
    ]
  },
  [BlockTypes.RATE_LIMITER]: {
    type: BlockTypes.RATE_LIMITER,
    name: 'Rate Limiter',
    category: BlockCategory.CONTROL,
    width: 60, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -30, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 30, y: 0, dir: 'right' }],
    params: { risingSlew: 10.0, fallingSlew: -10.0 },
    paramSchema: [
      { key: 'risingSlew', label: 'Rising Slew Rate (du/dt)', type: 'number', default: 10.0 },
      { key: 'fallingSlew', label: 'Falling Slew Rate', type: 'number', default: -10.0 }
    ]
  },
  [BlockTypes.DEAD_ZONE]: {
    type: BlockTypes.DEAD_ZONE,
    name: 'Dead Zone',
    category: BlockCategory.CONTROL,
    width: 55, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -27, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 27, y: 0, dir: 'right' }],
    params: { start: -0.5, end: 0.5 },
    paramSchema: [
      { key: 'start', label: 'Dead Zone Start', type: 'number', default: -0.5 },
      { key: 'end', label: 'Dead Zone End', type: 'number', default: 0.5 }
    ]
  },

  // --- 6. DSP & FILTERING ---
  [BlockTypes.FIR_FILTER]: {
    type: BlockTypes.FIR_FILTER,
    name: 'Discrete FIR Filter',
    category: BlockCategory.DSP,
    width: 75, height: 50,
    inputs: [{ id: 'in', label: 'x', x: -37, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 37, y: 0, dir: 'right' }],
    params: { coefficients: '[0.2, 0.2, 0.2, 0.2, 0.2]' },
    paramSchema: [{ key: 'coefficients', label: 'Taps / Impulse Response [b0, ..., bM]', type: 'string', default: '[0.2, 0.2, 0.2, 0.2, 0.2]' }]
  },
  [BlockTypes.IIR_FILTER]: {
    type: BlockTypes.IIR_FILTER,
    name: 'Discrete IIR Filter',
    category: BlockCategory.DSP,
    width: 75, height: 50,
    inputs: [{ id: 'in', label: 'x', x: -37, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'y', x: 37, y: 0, dir: 'right' }],
    params: { num: '[0.05, 0.05]', den: '[1.0, -0.9]' },
    paramSchema: [
      { key: 'num', label: 'Numerator B(z)', type: 'string', default: '[0.05, 0.05]' },
      { key: 'den', label: 'Denominator A(z)', type: 'string', default: '[1.0, -0.9]' }
    ]
  },
  [BlockTypes.MOVING_AVERAGE]: {
    type: BlockTypes.MOVING_AVERAGE,
    name: 'Moving Average Filter',
    category: BlockCategory.DSP,
    width: 70, height: 45,
    inputs: [{ id: 'in', label: 'in', x: -35, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'avg', x: 35, y: 0, dir: 'right' }],
    params: { windowSize: 10 },
    paramSchema: [{ key: 'windowSize', label: 'Window Size N', type: 'number', default: 10 }]
  },

  // --- 7. COMMUNICATIONS ---
  [BlockTypes.AM_MODULATOR]: {
    type: BlockTypes.AM_MODULATOR,
    name: 'AM Modulator',
    category: BlockCategory.COMMUNICATION,
    width: 75, height: 50,
    inputs: [
      { id: 'm', label: 'm(t)', x: -37, y: -12, dir: 'left' },
      { id: 'c', label: 'c(t)', x: -37, y: 12, dir: 'left' }
    ],
    outputs: [{ id: 'out', label: 's(t)', x: 37, y: 0, dir: 'right' }],
    params: { modIndex: 0.8, carrierAmp: 1.0 },
    paramSchema: [{ key: 'modIndex', label: 'Modulation Index (μ)', type: 'number', default: 0.8 }]
  },
  [BlockTypes.AWGN_CHANNEL]: {
    type: BlockTypes.AWGN_CHANNEL,
    name: 'AWGN Noise Channel',
    category: BlockCategory.COMMUNICATION,
    width: 70, height: 50,
    inputs: [{ id: 'in', label: 'tx', x: -35, y: 0, dir: 'left' }],
    outputs: [{ id: 'out', label: 'rx', x: 35, y: 0, dir: 'right' }],
    params: { snrDb: 10.0 },
    paramSchema: [{ key: 'snrDb', label: 'Signal-to-Noise Ratio (SNR dB)', type: 'number', default: 10.0 }]
  },

  // --- 8. SINKS & VISUALIZERS ---
  [BlockTypes.SCOPE]: {
    type: BlockTypes.SCOPE,
    name: 'Multi-Input Time Scope',
    category: BlockCategory.SINKS,
    width: 60, height: 50,
    inputs: [
      { id: 'in1', label: 'CH1', x: -30, y: -12, dir: 'left' },
      { id: 'in2', label: 'CH2', x: -30, y: 12, dir: 'left' }
    ],
    outputs: [],
    params: { timeSpan: 5.0, autoScale: true, title: 'Scope Display' },
    paramSchema: [
      { key: 'timeSpan', label: 'Time Span (s)', type: 'number', default: 5.0 },
      { key: 'autoScale', label: 'Auto Scale Y', type: 'boolean', default: true }
    ]
  },
  [BlockTypes.DISPLAY_READOUT]: {
    type: BlockTypes.DISPLAY_READOUT,
    name: 'Digital Display Value',
    category: BlockCategory.SINKS,
    width: 65, height: 40,
    inputs: [{ id: 'in', label: 'in', x: -32, y: 0, dir: 'left' }],
    outputs: [],
    params: { format: '%.3f' },
    paramSchema: [{ key: 'format', label: 'Format String', type: 'string', default: '%.3f' }]
  },
  [BlockTypes.TO_WORKSPACE]: {
    type: BlockTypes.TO_WORKSPACE,
    name: 'To Workspace (Data Log)',
    category: BlockCategory.SINKS,
    width: 75, height: 45,
    inputs: [{ id: 'in', label: 'u', x: -37, y: 0, dir: 'left' }],
    outputs: [],
    params: { variableName: 'simout', maxSamples: 10000 },
    paramSchema: [{ key: 'variableName', label: 'Export Variable Name', type: 'string', default: 'simout' }]
  }
};

BlockCategory.COMM = BlockCategory.COMMUNICATION;

Object.values(BlockDefinitions).forEach(def => {
  if (!def.glyph) {
    if (def.type === BlockTypes.CONSTANT) def.glyph = 'C';
    else if (def.type === BlockTypes.STEP) def.glyph = '┌─';
    else if (def.type === BlockTypes.RAMP) def.glyph = '◢';
    else if (def.type === BlockTypes.SINE_GEN) def.glyph = '∿';
    else if (def.type === BlockTypes.SUM) def.glyph = '+';
    else if (def.type === BlockTypes.GAIN) def.glyph = 'K';
    else if (def.type === BlockTypes.INTEGRATOR) def.glyph = '1/s';
    else if (def.type === BlockTypes.DERIVATIVE) def.glyph = 'du/dt';
    else if (def.type === BlockTypes.TRANSFER_FCN) def.glyph = 'G(s)';
    else if (def.type === BlockTypes.PID_CONTROLLER) def.glyph = 'PID';
    else if (def.type === BlockTypes.SATURATION) def.glyph = '⧎';
    else if (def.type === BlockTypes.SCOPE) def.glyph = 'CRO';
    else def.glyph = def.name.slice(0, 4);
  }
});

if (typeof window !== 'undefined') {
  window.BlockCategory = BlockCategory;
  window.BlockTypes = BlockTypes;
  window.BlockDefinitions = BlockDefinitions;
}


