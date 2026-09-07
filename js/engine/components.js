/**
 * Multisim Live Circuit Components & Models
 * Professional 300+ Component Catalog, Model Parameters, Pin Layouts,
 * Engineering Unit Formatter, and Parameter Schemas.
 */

export const ComponentCategory = {
  SOURCES: 'Sources & Generators',
  PASSIVES: 'Basic & Passives',
  DIODES: 'Diodes & Rectifiers',
  TRANSISTORS: 'Transistors & MOSFETs',
  POWER: 'Power & Thyristors',
  ANALOG: 'Analog & Linear ICs',
  REGULATORS: 'Voltage Regulators',
  LOGIC_GATES: 'Digital Logic Gates',
  DIGITAL_ICS: '74xx & Digital ICs',
  FLIP_FLOPS: 'Flip-Flops & Latches',
  ARITHMETIC: 'Arithmetic & ALU',
  CONTROL_BLOCKS: 'Control & Function Blocks',
  SWITCHES: 'Switches & Relays',
  ELECTROMECHANICAL: 'Electromechanical & Motors',
  OPTO_DISPLAYS: 'Opto & Displays',
  SENSORS: 'Sensors & Transducers',
  POWER_SYMBOLS: 'Power Rails & Net Labels',
  PROBES: 'Meters & Probes'
};

export const ComponentTypes = {
  // Sources
  GROUND: 'GROUND',
  DC_VOLTAGE: 'DC_VOLTAGE',
  AC_VOLTAGE: 'AC_VOLTAGE',
  CLOCK_VOLTAGE: 'CLOCK_VOLTAGE',
  TRIANGLE_VOLTAGE: 'TRIANGLE_VOLTAGE',
  SAWTOOTH_VOLTAGE: 'SAWTOOTH_VOLTAGE',
  PULSE_VOLTAGE: 'PULSE_VOLTAGE',
  TRIGGER_PULSE: 'TRIGGER_PULSE',
  AM_VOLTAGE: 'AM_VOLTAGE',
  FM_VOLTAGE: 'FM_VOLTAGE',
  NOISE_VOLTAGE: 'NOISE_VOLTAGE',
  CHIRP_VOLTAGE: 'CHIRP_VOLTAGE',
  DC_CURRENT: 'DC_CURRENT',
  AC_CURRENT: 'AC_CURRENT',
  VCVS: 'VCVS',
  VCCS: 'VCCS',
  CCVS: 'CCVS',
  CCCS: 'CCCS',
  BATTERY_CELL: 'BATTERY_CELL',
  SOLAR_CELL: 'SOLAR_CELL',
  FUNCTION_GENERATOR: 'FUNCTION_GENERATOR',

  // Passives
  RESISTOR: 'RESISTOR',
  POTENTIOMETER: 'POTENTIOMETER',
  RHEOSTAT: 'RHEOSTAT',
  RESISTOR_ARRAY_SIP: 'RESISTOR_ARRAY_SIP',
  CAPACITOR: 'CAPACITOR',
  POLARIZED_CAP: 'POLARIZED_CAP',
  TANTALUM_CAP: 'TANTALUM_CAP',
  FILM_CAP: 'FILM_CAP',
  VARIABLE_CAP: 'VARIABLE_CAP',
  SUPERCAPACITOR: 'SUPERCAPACITOR',
  INDUCTOR: 'INDUCTOR',
  VARIABLE_INDUCTOR: 'VARIABLE_INDUCTOR',
  COUPLED_INDUCTOR: 'COUPLED_INDUCTOR',
  TRANSFORMER: 'TRANSFORMER',
  TRANSFORMER_CENTER_TAP: 'TRANSFORMER_CENTER_TAP',
  AUDIO_TRANSFORMER: 'AUDIO_TRANSFORMER',
  PULSE_TRANSFORMER: 'PULSE_TRANSFORMER',
  CRYSTAL: 'CRYSTAL',
  CERAMIC_RESONATOR: 'CERAMIC_RESONATOR',
  FUSE: 'FUSE',
  POLYFUSE: 'POLYFUSE',
  NTC_THERMISTOR: 'NTC_THERMISTOR',
  PTC_THERMISTOR: 'PTC_THERMISTOR',
  VARISTOR_MOV: 'VARISTOR_MOV',
  PHOTORESISTOR_LDR: 'PHOTORESISTOR_LDR',

  // Diodes
  DIODE: 'DIODE',
  SCHOTTKY: 'SCHOTTKY',
  ZENER: 'ZENER',
  LED: 'LED',
  RGB_LED: 'RGB_LED',
  PHOTODIODE: 'PHOTODIODE',
  PIN_DIODE: 'PIN_DIODE',
  VARACTOR: 'VARACTOR',
  TVS_DIODE: 'TVS_DIODE',
  DIAC: 'DIAC',
  BRIDGE_RECTIFIER: 'BRIDGE_RECTIFIER',
  BRIDGE_RECTIFIER_3PHASE: 'BRIDGE_RECTIFIER_3PHASE',

  // Transistors
  BJT_NPN: 'BJT_NPN',
  BJT_PNP: 'BJT_PNP',
  DARLINGTON_NPN: 'DARLINGTON_NPN',
  DARLINGTON_PNP: 'DARLINGTON_PNP',
  MATCHED_PAIR_NPN: 'MATCHED_PAIR_NPN',
  PHOTOTRANSISTOR: 'PHOTOTRANSISTOR',
  NMOS: 'NMOS',
  PMOS: 'PMOS',
  NJFET: 'NJFET',
  PJFET: 'PJFET',

  // Power Semiconductors
  IGBT: 'IGBT',
  SCR: 'SCR',
  TRIAC: 'TRIAC',
  VOLTAGE_CONTROLLED_SWITCH: 'VOLTAGE_CONTROLLED_SWITCH',
  CURRENT_CONTROLLED_SWITCH: 'CURRENT_CONTROLLED_SWITCH',
  SOLID_STATE_RELAY: 'SOLID_STATE_RELAY',
  HALF_BRIDGE_MODULE: 'HALF_BRIDGE_MODULE',
  H_BRIDGE_MODULE: 'H_BRIDGE_MODULE',

  // Analog & Linear ICs
  OPAMP: 'OPAMP',
  OPAMP_DUAL: 'OPAMP_DUAL',
  COMPARATOR: 'COMPARATOR',
  COMPARATOR_QUAD: 'COMPARATOR_QUAD',
  TIMER555: 'TIMER555',
  TIMER556: 'TIMER556',
  SCHMITT_TRIGGER: 'SCHMITT_TRIGGER',
  ANALOG_MULTIPLIER: 'ANALOG_MULTIPLIER',
  ANALOG_DIVIDER: 'ANALOG_DIVIDER',
  PRECISION_RECTIFIER: 'PRECISION_RECTIFIER',
  PEAK_DETECTOR: 'PEAK_DETECTOR',
  SAMPLE_AND_HOLD: 'SAMPLE_AND_HOLD',
  ANALOG_SWITCH_4066: 'ANALOG_SWITCH_4066',
  ANALOG_MUX_4051: 'ANALOG_MUX_4051',

  // Voltage Regulators
  LM7805: 'LM7805',
  LM7809: 'LM7809',
  LM7812: 'LM7812',
  LM7815: 'LM7815',
  LM7905: 'LM7905',
  LM7912: 'LM7912',
  LM7915: 'LM7915',
  LM317: 'LM317',
  LM337: 'LM337',
  LM1117_33: 'LM1117_33',
  TL431: 'TL431',

  // Digital Logic Gates
  AND_GATE: 'AND_GATE',
  OR_GATE: 'OR_GATE',
  NOT_GATE: 'NOT_GATE',
  NAND_GATE: 'NAND_GATE',
  NOR_GATE: 'NOR_GATE',
  XOR_GATE: 'XOR_GATE',
  XNOR_GATE: 'XNOR_GATE',
  AND3_GATE: 'AND3_GATE',
  NAND3_GATE: 'NAND3_GATE',
  OR3_GATE: 'OR3_GATE',
  NOR3_GATE: 'NOR3_GATE',
  BUFFER_GATE: 'BUFFER_GATE',
  TRISTATE_BUFFER: 'TRISTATE_BUFFER',
  BUS_TRANSCEIVER_245: 'BUS_TRANSCEIVER_245',

  // 74xx & Digital ICs
  IC_7400: 'IC_7400',
  IC_7402: 'IC_7402',
  IC_7404: 'IC_7404',
  IC_7408: 'IC_7408',
  IC_7432: 'IC_7432',
  IC_7486: 'IC_7486',
  IC_74138: 'IC_74138',
  IC_74139: 'IC_74139',
  IC_74148: 'IC_74148',
  IC_74151: 'IC_74151',
  IC_74153: 'IC_74153',
  IC_74157: 'IC_74157',
  IC_74161: 'IC_74161',
  IC_74163: 'IC_74163',
  IC_74164: 'IC_74164',
  IC_74165: 'IC_74165',
  IC_74175: 'IC_74175',
  IC_74192: 'IC_74192',
  IC_74193: 'IC_74193',
  BINARY_COUNTER_4BIT: 'BINARY_COUNTER_4BIT',
  SHIFT_REGISTER_4BIT: 'SHIFT_REGISTER_4BIT',
  MUX_4TO1: 'MUX_4TO1',
  FULL_ADDER_4BIT: 'FULL_ADDER_4BIT',

  // Flip-Flops & Latches
  SR_LATCH: 'SR_LATCH',
  D_FLIPFLOP: 'D_FLIPFLOP',
  JK_FLIPFLOP: 'JK_FLIPFLOP',
  T_FLIPFLOP: 'T_FLIPFLOP',
  LATCH_8BIT_573: 'LATCH_8BIT_573',
  REGISTER_8BIT_574: 'REGISTER_8BIT_574',

  // Arithmetic & ALU
  HALF_ADDER: 'HALF_ADDER',
  FULL_ADDER: 'FULL_ADDER',
  HALF_SUBTRACTOR: 'HALF_SUBTRACTOR',
  FULL_SUBTRACTOR: 'FULL_SUBTRACTOR',
  MAG_COMPARATOR_7485: 'MAG_COMPARATOR_7485',
  ALU_4BIT_74181: 'ALU_4BIT_74181',

  // Control & Function Blocks
  PID_CONTROLLER: 'PID_CONTROLLER',
  SUMMING_JUNCTION: 'SUMMING_JUNCTION',
  TRANSFER_FUNCTION: 'TRANSFER_FUNCTION',
  LIMITER_BLOCK: 'LIMITER_BLOCK',

  // Switches & Relays
  SPST_SWITCH: 'SPST_SWITCH',
  SPDT_SWITCH: 'SPDT_SWITCH',
  DPDT_SWITCH: 'DPDT_SWITCH',
  PUSH_BUTTON: 'PUSH_BUTTON',
  PUSH_BUTTON_NC: 'PUSH_BUTTON_NC',
  DIGITAL_CONSTANT: 'DIGITAL_CONSTANT',
  DIGITAL_SWITCH: 'DIGITAL_SWITCH',
  DIP_SWITCH_4: 'DIP_SWITCH_4',
  RELAY_SPDT: 'RELAY_SPDT',
  RELAY_DPDT: 'RELAY_DPDT',

  // Annotations & Text Notes
  TEXT_LABEL: 'TEXT_LABEL',
  ANNOTATION: 'ANNOTATION',

  // Electromechanical
  DC_MOTOR: 'DC_MOTOR',
  SPEAKER: 'SPEAKER',
  BUZZER: 'BUZZER',
  LAMP: 'LAMP',
  LIGHT: 'LAMP',
  BULB: 'LAMP',

  // Opto & Displays
  OPTOCOUPLER: 'OPTOCOUPLER',
  SEVEN_SEGMENT: 'SEVEN_SEGMENT',
  SEVEN_SEG_DISPLAY: 'SEVEN_SEGMENT',
  SEVEN_SEGMENT_DUAL: 'SEVEN_SEGMENT_DUAL',
  SEVEN_SEGMENT_QUAD: 'SEVEN_SEGMENT_QUAD',
  BARGRAPH_LED: 'BARGRAPH_LED',
  HEX_DISPLAY: 'HEX_DISPLAY',

  // Aliases for Switches & Analog
  SWITCH_SPST: 'SPST_SWITCH',
  TOGGLE_SWITCH: 'SPDT_SWITCH',
  OP_AMP: 'OPAMP',

  // Sensors
  TEMP_SENSOR_LM35: 'TEMP_SENSOR_LM35',
  HALL_SENSOR: 'HALL_SENSOR',

  // Power Rails & Net Labels
  POWER_VCC: 'POWER_VCC',
  POWER_VDD: 'POWER_VDD',
  POWER_VSS: 'POWER_VSS',
  POWER_5V: 'POWER_5V',
  POWER_12V: 'POWER_12V',
  POWER_NEG12V: 'POWER_NEG12V',
  POWER_15V: 'POWER_15V',
  POWER_NEG15V: 'POWER_NEG15V',
  NET_LABEL: 'NET_LABEL',
  NODE: 'NODE',
  JUNCTION: 'JUNCTION',
  TEST_POINT: 'TEST_POINT',
  BUS_ENTRY: 'BUS_ENTRY',

  // Probes & Meters
  PROBE_V: 'PROBE_V',
  PROBE_I: 'PROBE_I',
  PROBE_DIFF: 'PROBE_DIFF',
  VOLTMETER: 'VOLTMETER',
  AMMETER: 'AMMETER',
  FREQ_COUNTER: 'FREQ_COUNTER'
};

// --- Model Variant Presets ---
export const DeviceModelPresets = {
  BJT_NPN: {
    '2N3904': { beta: 200, is: 1e-14, vbe: 0.65, vceSat: 0.2 },
    '2N2222': { beta: 150, is: 2e-14, vbe: 0.68, vceSat: 0.25 },
    'BC547': { beta: 300, is: 1e-14, vbe: 0.66, vceSat: 0.15 },
    'BC548': { beta: 250, is: 1.2e-14, vbe: 0.65, vceSat: 0.18 },
    'TIP31C': { beta: 50, is: 5e-13, vbe: 0.72, vceSat: 0.4 },
    'TIP41C': { beta: 40, is: 8e-13, vbe: 0.75, vceSat: 0.5 }
  },
  BJT_PNP: {
    '2N3906': { beta: 200, is: 1e-14, vbe: 0.65, vceSat: 0.2 },
    '2N2907': { beta: 150, is: 2e-14, vbe: 0.68, vceSat: 0.25 },
    'BC557': { beta: 300, is: 1e-14, vbe: 0.66, vceSat: 0.15 },
    'BC558': { beta: 250, is: 1.2e-14, vbe: 0.65, vceSat: 0.18 },
    'TIP32C': { beta: 50, is: 5e-13, vbe: 0.72, vceSat: 0.4 },
    'TIP42C': { beta: 40, is: 8e-13, vbe: 0.75, vceSat: 0.5 }
  },
  NMOS: {
    '2N7000': { vth: 2.1, kp: 0.05, lambda: 0.01, rdsOn: 5.0 },
    'BS170': { vth: 2.0, kp: 0.08, lambda: 0.01, rdsOn: 2.5 },
    'IRF540N': { vth: 3.5, kp: 0.8, lambda: 0.005, rdsOn: 0.044 },
    'IRFZ44N': { vth: 3.0, kp: 1.2, lambda: 0.005, rdsOn: 0.0175 },
    'IRLZ44N': { vth: 2.0, kp: 1.5, lambda: 0.005, rdsOn: 0.022 }
  },
  PMOS: {
    'IRF9540': { vth: -3.5, kp: 0.6, lambda: 0.005, rdsOn: 0.117 },
    'IRF4905': { vth: -3.0, kp: 1.1, lambda: 0.005, rdsOn: 0.020 },
    'TP2104': { vth: -2.0, kp: 0.04, lambda: 0.01, rdsOn: 2.0 }
  },
  OPAMP: {
    'LM741': { openLoopGain: 200000, gbp: 1e6, slewRate: 0.5e6, rIn: 2e6, rOut: 75, vSatPos: 13.5, vSatNeg: -13.5 },
    'LM358': { openLoopGain: 100000, gbp: 1.1e6, slewRate: 0.6e6, rIn: 1e7, rOut: 50, vSatPos: 13.8, vSatNeg: -14.8 },
    'TL082': { openLoopGain: 200000, gbp: 4e6, slewRate: 13e6, rIn: 1e12, rOut: 50, vSatPos: 13.5, vSatNeg: -13.5 },
    'NE5532': { openLoopGain: 100000, gbp: 10e6, slewRate: 9e6, rIn: 1e6, rOut: 20, vSatPos: 14.0, vSatNeg: -14.0 },
    'Ideal': { openLoopGain: 1e7, gbp: 1e9, slewRate: 1e9, rIn: 1e12, rOut: 0.01, vSatPos: 15, vSatNeg: -15 }
  },
  DIODE: {
    '1N4007': { forwardDrop: 0.7, satCurrent: 1e-12, breakdownV: 1000, seriesR: 0.05 },
    '1N4148': { forwardDrop: 0.65, satCurrent: 5e-13, breakdownV: 100, seriesR: 0.2 },
    'BAT54': { forwardDrop: 0.32, satCurrent: 1e-9, breakdownV: 30, seriesR: 0.1 },
    'SS14': { forwardDrop: 0.45, satCurrent: 1e-8, breakdownV: 40, seriesR: 0.03 }
  }
};

// --- Engineering Prefix Formatter ---
export function formatValueWithPrefix(value, unit = '', precision = 2) {
  if (value === null || value === undefined || isNaN(value)) return `0 ${unit}`;
  if (value === 0) return `0 ${unit}`;

  const absVal = Math.abs(value);
  const prefixes = [
    { p: 'T', factor: 1e12 },
    { p: 'G', factor: 1e9 },
    { p: 'M', factor: 1e6 },
    { p: 'k', factor: 1e3 },
    { p: '', factor: 1 },
    { p: 'm', factor: 1e-3 },
    { p: 'µ', factor: 1e-6 },
    { p: 'n', factor: 1e-9 },
    { p: 'p', factor: 1e-12 },
    { p: 'f', factor: 1e-15 }
  ];

  for (const item of prefixes) {
    if (absVal >= item.factor * 0.999) {
      const scaled = value / item.factor;
      return `${scaled.toFixed(precision).replace(/\.?0+$/, '')} ${item.p}${unit}`;
    }
  }

  return `${value.toExponential(precision)} ${unit}`;
}

export function parseEngineeringValue(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const s = str.toString().trim();
  const match = s.match(/^([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s*([a-zA-Zµu]?)/);
  if (!match) return parseFloat(str) || 0;

  const num = parseFloat(match[1]);
  const prefix = match[2];
  const factors = {
    'T': 1e12, 'G': 1e9, 'M': 1e6, 'k': 1e3, 'K': 1e3,
    'm': 1e-3, 'u': 1e-6, 'µ': 1e-6, 'n': 1e-9, 'p': 1e-12, 'f': 1e-15
  };

  return num * (factors[prefix] || 1);
}

// --- Complete Component Definitions Registry (300+ Model Capable) ---
export const ComponentDefinitions = {
  // =================== 1. SOURCES ===================
  [ComponentTypes.GROUND]: {
    name: 'Ground (0V Reference)',
    type: ComponentTypes.GROUND,
    category: ComponentCategory.SOURCES,
    prefix: 'GND',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "GND (1)",
            "num": 1,
            "x": 0,
            "y": -15,
            "dir": "top",
            "desc": "Ground Reference (0V)"
      }
    ],
    params: {}, paramSchema: []
  },
  [ComponentTypes.DC_VOLTAGE]: {
    name: 'DC Voltage Source',
    type: ComponentTypes.DC_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_DC',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Positive Terminal (+)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Negative Terminal (-)"
      }
    ],
    params: { voltage: 5 },
    paramSchema: [{ key: 'voltage', label: 'Voltage', type: 'number', unit: 'V', default: 5, step: 0.1 }]
  },
  [ComponentTypes.AC_VOLTAGE]: {
    name: 'AC Sine Voltage Source',
    type: ComponentTypes.AC_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_AC',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "AC Live Terminal (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "AC Neutral Terminal (Pin 2)"
      }
    ],
    params: { amplitude: 5, frequency: 1000, offset: 0, phase: 0 },
    paramSchema: [
      { key: 'amplitude', label: 'Peak Amplitude', type: 'number', unit: 'V', default: 5, step: 0.1 },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000, step: 10 },
      { key: 'offset', label: 'DC Offset', type: 'number', unit: 'V', default: 0, step: 0.1 },
      { key: 'phase', label: 'Phase Angle', type: 'number', unit: '°', default: 0, step: 5 }
    ]
  },
  [ComponentTypes.CLOCK_VOLTAGE]: {
    name: 'Digital Clock Pulse Source',
    type: ComponentTypes.CLOCK_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_CLK',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Clock Pulse Output (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Clock Return (Pin 2)"
      }
    ],
    params: { vHigh: 5, vLow: 0, frequency: 1000, dutyCycle: 50 },
    paramSchema: [
      { key: 'vHigh', label: 'High Voltage', type: 'number', unit: 'V', default: 5 },
      { key: 'vLow', label: 'Low Voltage', type: 'number', unit: 'V', default: 0 },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000 },
      { key: 'dutyCycle', label: 'Duty Cycle', type: 'range', min: 1, max: 99, default: 50 }
    ]
  },
  [ComponentTypes.TRIANGLE_VOLTAGE]: {
    name: 'Triangle Wave Generator',
    type: ComponentTypes.TRIANGLE_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_TRI',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Triangle Wave Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Signal Return (Pin 2)"
      }
    ],
    params: { amplitude: 5, frequency: 1000, offset: 0 },
    paramSchema: [
      { key: 'amplitude', label: 'Peak Amplitude', type: 'number', unit: 'V', default: 5 },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000 },
      { key: 'offset', label: 'DC Offset', type: 'number', unit: 'V', default: 0 }
    ]
  },
  [ComponentTypes.SAWTOOTH_VOLTAGE]: {
    name: 'Sawtooth Wave Generator',
    type: ComponentTypes.SAWTOOTH_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_SAW',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Sawtooth Wave Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Signal Return (Pin 2)"
      }
    ],
    params: { amplitude: 5, frequency: 1000, offset: 0 },
    paramSchema: [
      { key: 'amplitude', label: 'Peak Amplitude', type: 'number', unit: 'V', default: 5 },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000 }
    ]
  },
  [ComponentTypes.PULSE_VOLTAGE]: {
    name: 'Pulse Voltage Generator',
    type: ComponentTypes.PULSE_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_PULSE',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Pulse Output (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Pulse Return (Pin 2)"
      }
    ],
    params: { v1: 0, v2: 5, tDelay: 0, tRise: 1e-6, tFall: 1e-6, tWidth: 1e-3, period: 2e-3 },
    paramSchema: [
      { key: 'v1', label: 'Initial Voltage', type: 'number', unit: 'V', default: 0 },
      { key: 'v2', label: 'Pulsed Voltage', type: 'number', unit: 'V', default: 5 },
      { key: 'tDelay', label: 'Delay Time (TD)', type: 'number', unit: 's', default: 0 },
      { key: 'tRise', label: 'Rise Time (TR)', type: 'number', unit: 's', default: 1e-6 },
      { key: 'tFall', label: 'Fall Time (TF)', type: 'number', unit: 's', default: 1e-6 },
      { key: 'tWidth', label: 'Pulse Width (PW)', type: 'number', unit: 's', default: 1e-3 },
      { key: 'period', label: 'Period (PER / 0 for single pulse)', type: 'number', unit: 's', default: 2e-3 }
    ]
  },
  [ComponentTypes.TRIGGER_PULSE]: {
    name: 'Manual Trigger Pulse Button',
    type: ComponentTypes.TRIGGER_PULSE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_TRIG',
    width: 50, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Trigger Pulse Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Trigger Return (Pin 2)"
      }
    ],
    params: { vHigh: 5, vLow: 0, pulseWidth: 1e-3, tRise: 1e-6, tFall: 1e-6 },
    paramSchema: [
      { key: 'vHigh', label: 'Pulsed Voltage (V)', type: 'number', unit: 'V', default: 5 },
      { key: 'vLow', label: 'Rest Voltage (V)', type: 'number', unit: 'V', default: 0 },
      { key: 'pulseWidth', label: 'Pulse Width (PW)', type: 'number', unit: 's', default: 1e-3 }
    ]
  },
  [ComponentTypes.AM_VOLTAGE]: {
    name: 'AM Modulated RF Source',
    type: ComponentTypes.AM_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_AM',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "AM Modulated Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "RF Return (Pin 2)"
      }
    ],
    params: { carrierAmp: 5, carrierFreq: 50000, modFreq: 1000, modIndex: 0.8 },
    paramSchema: [
      { key: 'carrierAmp', label: 'Carrier Amp', type: 'number', unit: 'V', default: 5 },
      { key: 'carrierFreq', label: 'Carrier Freq', type: 'number', unit: 'Hz', default: 50000 },
      { key: 'modFreq', label: 'Modulating Freq', type: 'number', unit: 'Hz', default: 1000 },
      { key: 'modIndex', label: 'Modulation Index', type: 'number', unit: '', default: 0.8, step: 0.05 }
    ]
  },
  [ComponentTypes.FM_VOLTAGE]: {
    name: 'FM Modulated Source',
    type: ComponentTypes.FM_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_FM',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "FM Modulated Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "RF Return (Pin 2)"
      }
    ],
    params: { carrierAmp: 5, carrierFreq: 20000, modFreq: 1000, freqDev: 5000 },
    paramSchema: [
      { key: 'carrierAmp', label: 'Carrier Amp', type: 'number', unit: 'V', default: 5 },
      { key: 'carrierFreq', label: 'Carrier Freq', type: 'number', unit: 'Hz', default: 20000 },
      { key: 'modFreq', label: 'Modulating Freq', type: 'number', unit: 'Hz', default: 1000 }
    ]
  },
  [ComponentTypes.NOISE_VOLTAGE]: {
    name: 'White Noise Source',
    type: ComponentTypes.NOISE_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_NOISE',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Noise Source Out (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Noise Return (Pin 2)"
      }
    ],
    params: { rmsVoltage: 0.5 },
    paramSchema: [{ key: 'rmsVoltage', label: 'RMS Noise', type: 'number', unit: 'V', default: 0.5 }]
  },
  [ComponentTypes.DC_CURRENT]: {
    name: 'DC Current Source',
    type: ComponentTypes.DC_CURRENT,
    category: ComponentCategory.SOURCES,
    prefix: 'I_DC',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_in",
            "name": "IN (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "Current Inflow (Pin 1)"
      },
      {
            "id": "p_out",
            "name": "OUT (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "Current Outflow (Pin 2)"
      }
    ],
    params: { current: 0.001 },
    paramSchema: [{ key: 'current', label: 'DC Current', type: 'number', unit: 'A', default: 0.001, step: 0.0001 }]
  },
  [ComponentTypes.AC_CURRENT]: {
    name: 'AC Current Source',
    type: ComponentTypes.AC_CURRENT,
    category: ComponentCategory.SOURCES,
    prefix: 'I_AC',
    width: 40, height: 60,
    pins: [
      {
            "id": "p_in",
            "name": "IN (1)",
            "num": 1,
            "x": 0,
            "y": -30,
            "dir": "top",
            "desc": "AC Inflow (Pin 1)"
      },
      {
            "id": "p_out",
            "name": "OUT (2)",
            "num": 2,
            "x": 0,
            "y": 30,
            "dir": "bottom",
            "desc": "AC Outflow (Pin 2)"
      }
    ],
    params: { amplitude: 0.005, frequency: 1000 },
    paramSchema: [
      { key: 'amplitude', label: 'Peak Current', type: 'number', unit: 'A', default: 0.005 },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000 }
    ]
  },
  [ComponentTypes.VCVS]: {
    name: 'Voltage-Controlled Voltage Source (VCVS)',
    type: ComponentTypes.VCVS,
    category: ComponentCategory.SOURCES,
    prefix: 'E_VCVS',
    width: 50, height: 60,
    pins: [
      {
            "id": "in_pos",
            "name": "IN+ (1)",
            "num": 1,
            "x": -30,
            "y": -15,
            "dir": "left",
            "desc": "Control Input (+) (Pin 1)"
      },
      {
            "id": "in_neg",
            "name": "IN- (2)",
            "num": 2,
            "x": -30,
            "y": 15,
            "dir": "left",
            "desc": "Control Input (-) (Pin 2)"
      },
      {
            "id": "out_pos",
            "name": "OUT+ (3)",
            "num": 3,
            "x": 30,
            "y": -15,
            "dir": "right",
            "desc": "Controlled Output (+) (Pin 3)"
      },
      {
            "id": "out_neg",
            "name": "OUT- (4)",
            "num": 4,
            "x": 30,
            "y": 15,
            "dir": "right",
            "desc": "Controlled Output (-) (Pin 4)"
      }
    ],
    params: { gain: 2.0 },
    paramSchema: [{ key: 'gain', label: 'Voltage Gain (V/V)', type: 'number', unit: '', default: 2.0 }]
  },
  [ComponentTypes.VCCS]: {
    name: 'Voltage-Controlled Current Source (VCCS)',
    type: ComponentTypes.VCCS,
    category: ComponentCategory.SOURCES,
    prefix: 'G_VCCS',
    width: 50, height: 60,
    pins: [
      {
            "id": "in_pos",
            "name": "IN+ (1)",
            "num": 1,
            "x": -30,
            "y": -15,
            "dir": "left",
            "desc": "Control Input (+) (Pin 1)"
      },
      {
            "id": "in_neg",
            "name": "IN- (2)",
            "num": 2,
            "x": -30,
            "y": 15,
            "dir": "left",
            "desc": "Control Input (-) (Pin 2)"
      },
      {
            "id": "out_pos",
            "name": "OUT+ (3)",
            "num": 3,
            "x": 30,
            "y": -15,
            "dir": "right",
            "desc": "Controlled Current (+) (Pin 3)"
      },
      {
            "id": "out_neg",
            "name": "OUT- (4)",
            "num": 4,
            "x": 30,
            "y": 15,
            "dir": "right",
            "desc": "Controlled Current (-) (Pin 4)"
      }
    ],
    params: { transconductance: 0.01 },
    paramSchema: [{ key: 'transconductance', label: 'Transconductance (A/V)', type: 'number', unit: 'S', default: 0.01 }]
  },
  [ComponentTypes.BATTERY_CELL]: {
    name: 'Battery Cell',
    type: ComponentTypes.BATTERY_CELL,
    category: ComponentCategory.SOURCES,
    prefix: 'BAT',
    width: 40, height: 50,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": 0,
            "y": -25,
            "dir": "top",
            "desc": "Positive Electrode (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 0,
            "y": 25,
            "dir": "bottom",
            "desc": "Negative Electrode (Pin 2)"
      }
    ],
    params: { voltage: 3.7, internalR: 0.05 },
    paramSchema: [
      { key: 'voltage', label: 'Cell Voltage', type: 'number', unit: 'V', default: 3.7 },
      { key: 'internalR', label: 'Internal Resistance', type: 'number', unit: 'Ω', default: 0.05 }
    ]
  },
  [ComponentTypes.FUNCTION_GENERATOR]: {
    name: 'Function Generator (XFG1)',
    type: ComponentTypes.FUNCTION_GENERATOR,
    category: ComponentCategory.SOURCES,
    prefix: 'XFG',
    package: 'Virtual Instrument',
    description: 'Multi-waveform laboratory signal generator producing Sine, Triangle, Square, and Sawtooth waveforms with variable frequency, amplitude, offset, duty cycle, and phase.',
    width: 70, height: 60,
    pins: [
      {
        id: 'p_pos',
        name: '+ (1)',
        num: 1,
        x: 35,
        y: -15,
        dir: 'right',
        desc: 'Positive Signal Output (+)'
      },
      {
        id: 'com',
        name: 'COM (2)',
        num: 2,
        x: 35,
        y: 0,
        dir: 'right',
        desc: 'Common Ground Reference (COM)'
      },
      {
        id: 'p_neg',
        name: '- (3)',
        num: 3,
        x: 35,
        y: 15,
        dir: 'right',
        desc: 'Inverted Signal Output (-)'
      }
    ],
    params: { waveform: 'sine', frequency: 1000, amplitude: 5, offset: 0, dutyCycle: 50, phase: 0 },
    paramSchema: [
      { key: 'waveform', label: 'Waveform Function', type: 'select', options: ['sine', 'triangle', 'square', 'sawtooth'], default: 'sine' },
      { key: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', default: 1000, step: 10 },
      { key: 'amplitude', label: 'Peak Amplitude (Vp)', type: 'number', unit: 'V', default: 5, step: 0.1 },
      { key: 'offset', label: 'DC Offset Voltage', type: 'number', unit: 'V', default: 0, step: 0.1 },
      { key: 'dutyCycle', label: 'Duty Cycle', type: 'range', min: 1, max: 99, default: 50 },
      { key: 'phase', label: 'Phase Angle', type: 'number', unit: '°', default: 0, step: 5 }
    ]
  },

  // =================== 2. PASSIVES ===================
  [ComponentTypes.RESISTOR]: {
    name: 'Resistor',
    type: ComponentTypes.RESISTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'R',
    width: 60, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Terminal 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "Terminal 2"
      }
    ],
    params: { resistance: 1000 },
    paramSchema: [{ key: 'resistance', label: 'Resistance', type: 'number', unit: 'Ω', default: 1000, step: 10 }]
  },
  [ComponentTypes.POTENTIOMETER]: {
    name: 'Potentiometer',
    type: ComponentTypes.POTENTIOMETER,
    category: ComponentCategory.PASSIVES,
    prefix: 'POT',
    width: 60, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "End Terminal 1"
      },
      {
            "id": "p2",
            "name": "W (2)",
            "num": 2,
            "x": 0,
            "y": -20,
            "dir": "top",
            "desc": "Wiper Contact (Pin 2)"
      },
      {
            "id": "p3",
            "name": "3",
            "num": 3,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "End Terminal 2"
      }
    ],
    params: { resistance: 10000, position: 50 },
    paramSchema: [
      { key: 'resistance', label: 'Total Resistance', type: 'number', unit: 'Ω', default: 10000 },
      { key: 'position', label: 'Wiper Position', type: 'range', min: 1, max: 99, default: 50 }
    ]
  },
  [ComponentTypes.CAPACITOR]: {
    name: 'Capacitor (Ceramic/Film)',
    type: ComponentTypes.CAPACITOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'C',
    width: 40, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Plate 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Plate 2"
      }
    ],
    params: { capacitance: 1e-7 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 1e-7, step: 1e-9 }]
  },
  [ComponentTypes.POLARIZED_CAP]: {
    name: 'Electrolytic Polarized Capacitor',
    type: ComponentTypes.POLARIZED_CAP,
    category: ComponentCategory.PASSIVES,
    prefix: 'C_POL',
    width: 40, height: 40,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Anode Lead (+) (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Cathode Lead (-) (Pin 2)"
      }
    ],
    params: { capacitance: 1e-4 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 1e-4, step: 1e-6 }]
  },
  [ComponentTypes.TANTALUM_CAP]: {
    name: 'Tantalum Capacitor',
    type: ComponentTypes.TANTALUM_CAP,
    category: ComponentCategory.PASSIVES,
    prefix: 'C_TAN',
    width: 40, height: 40,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Tantalum Anode (+) (Pin 1)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Tantalum Cathode (-) (Pin 2)"
      }
    ],
    params: { capacitance: 2.2e-5, esr: 0.1 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 2.2e-5 }]
  },
  [ComponentTypes.INDUCTOR]: {
    name: 'Inductor',
    type: ComponentTypes.INDUCTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'L',
    width: 60, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Coil Terminal 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "Coil Terminal 2"
      }
    ],
    params: { inductance: 1e-3 },
    paramSchema: [{ key: 'inductance', label: 'Inductance', type: 'number', unit: 'H', default: 1e-3, step: 1e-4 }]
  },
  [ComponentTypes.COUPLED_INDUCTOR]: {
    name: 'Coupled Inductor Pair',
    type: ComponentTypes.COUPLED_INDUCTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'L_CUP',
    width: 60, height: 50,
    pins: [
      {
            "id": "l1_p1",
            "name": "L1+ (1)",
            "num": 1,
            "x": -30,
            "y": -15,
            "dir": "left",
            "desc": "Primary Inductor Dot (Pin 1)"
      },
      {
            "id": "l1_p2",
            "name": "L1- (2)",
            "num": 2,
            "x": -30,
            "y": 15,
            "dir": "left",
            "desc": "Primary Inductor Return (Pin 2)"
      },
      {
            "id": "l2_p1",
            "name": "L2+ (3)",
            "num": 3,
            "x": 30,
            "y": -15,
            "dir": "right",
            "desc": "Secondary Inductor Dot (Pin 3)"
      },
      {
            "id": "l2_p2",
            "name": "L2- (4)",
            "num": 4,
            "x": 30,
            "y": 15,
            "dir": "right",
            "desc": "Secondary Inductor Return (Pin 4)"
      }
    ],
    params: { l1: 1e-3, l2: 1e-3, k: 0.98 },
    paramSchema: [
      { key: 'l1', label: 'Inductance L1', type: 'number', unit: 'H', default: 1e-3 },
      { key: 'l2', label: 'Inductance L2', type: 'number', unit: 'H', default: 1e-3 },
      { key: 'k', label: 'Coupling Factor k', type: 'number', unit: '', default: 0.98, min: 0.01, max: 1.0 }
    ]
  },
  [ComponentTypes.TRANSFORMER]: {
    name: 'Transformer (Step Up/Down)',
    type: ComponentTypes.TRANSFORMER,
    category: ComponentCategory.PASSIVES,
    prefix: 'XFMR',
    width: 60, height: 60,
    pins: [
      {
            "id": "pri_1",
            "name": "P1 (1)",
            "num": 1,
            "x": -30,
            "y": -20,
            "dir": "left",
            "desc": "Primary Winding (+) (Pin 1)"
      },
      {
            "id": "pri_2",
            "name": "P2 (2)",
            "num": 2,
            "x": -30,
            "y": 20,
            "dir": "left",
            "desc": "Primary Winding (-) (Pin 2)"
      },
      {
            "id": "sec_1",
            "name": "S1 (3)",
            "num": 3,
            "x": 30,
            "y": -20,
            "dir": "right",
            "desc": "Secondary Winding (+) (Pin 3)"
      },
      {
            "id": "sec_2",
            "name": "S2 (4)",
            "num": 4,
            "x": 30,
            "y": 20,
            "dir": "right",
            "desc": "Secondary Winding (-) (Pin 4)"
      }
    ],
    params: { ratio: 0.1, primaryL: 0.01 },
    paramSchema: [
      { key: 'ratio', label: 'Turns Ratio (Ns/Np)', type: 'number', unit: '', default: 0.1, step: 0.01 },
      { key: 'primaryL', label: 'Primary Inductance', type: 'number', unit: 'H', default: 0.01 }
    ]
  },
  [ComponentTypes.TRANSFORMER_CENTER_TAP]: {
    name: 'Center-Tapped Transformer',
    type: ComponentTypes.TRANSFORMER_CENTER_TAP,
    category: ComponentCategory.PASSIVES,
    prefix: 'XFMR_CT',
    width: 60, height: 70,
    pins: [
      {
            "id": "pri_1",
            "name": "P1 (1)",
            "num": 1,
            "x": -30,
            "y": -20,
            "dir": "left",
            "desc": "Primary Winding (+) (Pin 1)"
      },
      {
            "id": "pri_2",
            "name": "P2 (2)",
            "num": 2,
            "x": -30,
            "y": 20,
            "dir": "left",
            "desc": "Primary Winding (-) (Pin 2)"
      },
      {
            "id": "sec_1",
            "name": "S1 (3)",
            "num": 3,
            "x": 30,
            "y": -20,
            "dir": "right",
            "desc": "Secondary Upper (+) (Pin 3)"
      },
      {
            "id": "sec_ct",
            "name": "CT (4)",
            "num": 4,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "Center Tap Neutral (Pin 4)"
      },
      {
            "id": "sec_2",
            "name": "S2 (5)",
            "num": 5,
            "x": 30,
            "y": 20,
            "dir": "right",
            "desc": "Secondary Lower (-) (Pin 5)"
      }
    ],
    params: { ratio: 0.2, primaryL: 0.01 },
    paramSchema: [{ key: 'ratio', label: 'Turns Ratio', type: 'number', default: 0.2 }]
  },
  [ComponentTypes.CRYSTAL]: {
    name: 'Quartz Crystal Resonator',
    type: ComponentTypes.CRYSTAL,
    category: ComponentCategory.PASSIVES,
    prefix: 'XTAL',
    width: 50, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Crystal Electrode 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Crystal Electrode 2"
      }
    ],
    params: { frequency: 4e6 },
    paramSchema: [{ key: 'frequency', label: 'Resonant Frequency', type: 'number', unit: 'Hz', default: 4e6 }]
  },
  [ComponentTypes.FUSE]: {
    name: 'Protective Fuse',
    type: ComponentTypes.FUSE,
    category: ComponentCategory.PASSIVES,
    prefix: 'FUSE',
    width: 50, height: 20,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Fuse Lead 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Fuse Lead 2"
      }
    ],
    params: { currentRating: 1.0, blown: false },
    paramSchema: [
      { key: 'currentRating', label: 'Current Rating', type: 'number', unit: 'A', default: 1.0 },
      { key: 'blown', label: 'Blown', type: 'boolean', default: false }
    ]
  },
  [ComponentTypes.NTC_THERMISTOR]: {
    name: 'NTC Thermistor',
    type: ComponentTypes.NTC_THERMISTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'TH_NTC',
    width: 50, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Thermistor Lead 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "Thermistor Lead 2"
      }
    ],
    params: { r25: 10000, beta: 3950, temperature: 25 },
    paramSchema: [
      { key: 'r25', label: 'R at 25°C', type: 'number', unit: 'Ω', default: 10000 },
      { key: 'temperature', label: 'Ambient Temp', type: 'number', unit: '°C', default: 25 }
    ]
  },
  [ComponentTypes.PHOTORESISTOR_LDR]: {
    name: 'Photoresistor (LDR)',
    type: ComponentTypes.PHOTORESISTOR_LDR,
    category: ComponentCategory.PASSIVES,
    prefix: 'LDR',
    width: 50, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "LDR Cell Terminal 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "LDR Cell Terminal 2"
      }
    ],
    params: { lightLevel: 50, rDark: 1e6, rLight: 500 },
    paramSchema: [
      { key: 'lightLevel', label: 'Illumination', type: 'range', min: 0, max: 100, default: 50 }
    ]
  },

  // =================== 3. DIODES & RECTIFIERS ===================
  [ComponentTypes.DIODE]: {
    name: 'Silicon Diode (1N4007)',
    type: ComponentTypes.DIODE,
    category: ComponentCategory.DIODES,
    prefix: 'D',
    width: 40, height: 30,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Diode Anode (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Diode Cathode (Pin 2)"
      }
    ],
    params: { model: '1N4007', forwardDrop: 0.7, satCurrent: 1e-12 },
    paramSchema: [
      { key: 'model', label: 'Part Model', type: 'select', options: ['1N4007', '1N4148', '1N4001', '1N4004', '1N914'], default: '1N4007' },
      { key: 'forwardDrop', label: 'Forward Voltage Drop', type: 'number', unit: 'V', default: 0.7, step: 0.05 }
    ]
  },
  [ComponentTypes.SCHOTTKY]: {
    name: 'Schottky Fast Diode (BAT54)',
    type: ComponentTypes.SCHOTTKY,
    category: ComponentCategory.DIODES,
    prefix: 'D_SCH',
    width: 40, height: 30,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Schottky Anode (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Schottky Cathode (Pin 2)"
      }
    ],
    params: { model: 'BAT54', forwardDrop: 0.32 },
    paramSchema: [{ key: 'forwardDrop', label: 'Forward Drop', type: 'number', unit: 'V', default: 0.32 }]
  },
  [ComponentTypes.ZENER]: {
    name: 'Zener Voltage Regulator Diode',
    type: ComponentTypes.ZENER,
    category: ComponentCategory.DIODES,
    prefix: 'D_ZEN',
    width: 40, height: 30,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Zener Anode (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Zener Cathode (Pin 2)"
      }
    ],
    params: { zenerVoltage: 5.1, forwardDrop: 0.7 },
    paramSchema: [
      { key: 'zenerVoltage', label: 'Zener Breakdown Voltage (Vz)', type: 'number', unit: 'V', default: 5.1, step: 0.1 }
    ]
  },
  [ComponentTypes.LED]: {
    name: 'Radiant LED Indicator',
    type: ComponentTypes.LED,
    category: ComponentCategory.DIODES,
    prefix: 'LED',
    width: 40, height: 30,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "LED Anode (+) (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "LED Cathode (-) (Pin 2)"
      }
    ],
    params: { color: '#ff3b30', forwardDrop: 2.0 },
    paramSchema: [
      { key: 'color', label: 'Emission Color', type: 'select', options: ['#ff3b30', '#03b585', '#007aff', '#ff9500', '#ffffff'], default: '#ff3b30' },
      { key: 'forwardDrop', label: 'Forward Voltage (Vf)', type: 'number', unit: 'V', default: 2.0 }
    ]
  },
  [ComponentTypes.BRIDGE_RECTIFIER]: {
    name: 'Full-Wave Bridge Rectifier (1-Phase)',
    type: ComponentTypes.BRIDGE_RECTIFIER,
    category: ComponentCategory.DIODES,
    prefix: 'BR',
    width: 50, height: 50,
    pins: [
      {
            "id": "ac1",
            "name": "AC1 (1)",
            "num": 1,
            "x": -30,
            "y": -15,
            "dir": "left",
            "desc": "AC Input Phase 1 (Pin 1)"
      },
      {
            "id": "ac2",
            "name": "AC2 (2)",
            "num": 2,
            "x": -30,
            "y": 15,
            "dir": "left",
            "desc": "AC Input Phase 2 (Pin 2)"
      },
      {
            "id": "pos",
            "name": "+ (3)",
            "num": 3,
            "x": 30,
            "y": -15,
            "dir": "right",
            "desc": "Rectified DC Positive (Pin 3)"
      },
      {
            "id": "neg",
            "name": "- (4)",
            "num": 4,
            "x": 30,
            "y": 15,
            "dir": "right",
            "desc": "Rectified DC Negative (Pin 4)"
      }
    ],
    params: { forwardDrop: 0.7 },
    paramSchema: [{ key: 'forwardDrop', label: 'Diode Vf', type: 'number', unit: 'V', default: 0.7 }]
  },

  // =================== 4. TRANSISTORS & MOSFETS ===================
  [ComponentTypes.BJT_NPN]: {
    name: 'NPN Bipolar Transistor',
    type: ComponentTypes.BJT_NPN,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'Q_NPN',
    width: 40, height: 50,
    pins: [
      {
            "id": "base",
            "name": "B (1)",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Base (Pin 1)"
      },
      {
            "id": "collector",
            "name": "C (2)",
            "num": 2,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "Collector (Pin 2)"
      },
      {
            "id": "emitter",
            "name": "E (3)",
            "num": 3,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "Emitter (Pin 3)"
      }
    ],
    params: { model: '2N3904', beta: 200, vbe: 0.65 },
    paramSchema: [
      { key: 'model', label: 'Transistor Model', type: 'select', options: ['2N3904', '2N2222', 'BC547', 'BC548', 'TIP31C', 'TIP41C'], default: '2N3904' },
      { key: 'beta', label: 'Current Gain (hFE / Beta)', type: 'number', unit: '', default: 200, step: 10 }
    ]
  },
  [ComponentTypes.BJT_PNP]: {
    name: 'PNP Bipolar Transistor',
    type: ComponentTypes.BJT_PNP,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'Q_PNP',
    width: 40, height: 50,
    pins: [
      {
            "id": "base",
            "name": "B (1)",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Base (Pin 1)"
      },
      {
            "id": "collector",
            "name": "C (2)",
            "num": 2,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "Collector (Pin 2)"
      },
      {
            "id": "emitter",
            "name": "E (3)",
            "num": 3,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "Emitter (Pin 3)"
      }
    ],
    params: { model: '2N3906', beta: 200, vbe: 0.65 },
    paramSchema: [
      { key: 'model', label: 'Transistor Model', type: 'select', options: ['2N3906', '2N2907', 'BC557', 'BC558', 'TIP32C', 'TIP42C'], default: '2N3906' },
      { key: 'beta', label: 'Current Gain (hFE / Beta)', type: 'number', unit: '', default: 200 }
    ]
  },
  [ComponentTypes.DARLINGTON_NPN]: {
    name: 'Darlington NPN Pair (TIP120)',
    type: ComponentTypes.DARLINGTON_NPN,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'Q_DARL',
    width: 40, height: 50,
    pins: [
      {
            "id": "base",
            "name": "B (1)",
            "num": 1,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Darlington Base (Pin 1)"
      },
      {
            "id": "collector",
            "name": "C (2)",
            "num": 2,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "Darlington Collector (Pin 2)"
      },
      {
            "id": "emitter",
            "name": "E (3)",
            "num": 3,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "Darlington Emitter (Pin 3)"
      }
    ],
    params: { beta: 1000, vbe: 1.3 },
    paramSchema: [{ key: 'beta', label: 'Darlington Beta', type: 'number', unit: '', default: 1000 }]
  },
  [ComponentTypes.NMOS]: {
    name: 'N-Channel MOSFET (IRF540N / 2N7000)',
    type: ComponentTypes.NMOS,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'M_NMOS',
    width: 40, height: 50,
    pins: [
      {
            "id": "gate",
            "name": "G (1)",
            "num": 1,
            "x": -30,
            "y": 10,
            "dir": "left",
            "desc": "Gate (Pin 1)"
      },
      {
            "id": "drain",
            "name": "D (2)",
            "num": 2,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "Drain (Pin 2)"
      },
      {
            "id": "source",
            "name": "S (3)",
            "num": 3,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "Source (Pin 3)"
      }
    ],
    params: { model: 'IRF540N', vth: 3.5, kp: 0.8, rdsOn: 0.044 },
    paramSchema: [
      { key: 'model', label: 'MOSFET Model', type: 'select', options: ['IRF540N', 'IRFZ44N', 'IRLZ44N', '2N7000', 'BS170'], default: 'IRF540N' },
      { key: 'vth', label: 'Threshold Voltage (Vth)', type: 'number', unit: 'V', default: 3.5 },
      { key: 'rdsOn', label: 'R_DS(on)', type: 'number', unit: 'Ω', default: 0.044 }
    ]
  },
  [ComponentTypes.PMOS]: {
    name: 'P-Channel MOSFET (IRF9540)',
    type: ComponentTypes.PMOS,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'M_PMOS',
    width: 40, height: 50,
    pins: [
      {
            "id": "gate",
            "name": "G (1)",
            "num": 1,
            "x": -30,
            "y": -10,
            "dir": "left",
            "desc": "Gate (Pin 1)"
      },
      {
            "id": "drain",
            "name": "D (2)",
            "num": 2,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "Drain (Pin 2)"
      },
      {
            "id": "source",
            "name": "S (3)",
            "num": 3,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "Source (Pin 3)"
      }
    ],
    params: { model: 'IRF9540', vth: -3.5, kp: 0.6, rdsOn: 0.117 },
    paramSchema: [
      { key: 'model', label: 'MOSFET Model', type: 'select', options: ['IRF9540', 'IRF4905', 'TP2104'], default: 'IRF9540' },
      { key: 'vth', label: 'Threshold Voltage (Vth)', type: 'number', unit: 'V', default: -3.5 }
    ]
  },
  [ComponentTypes.NJFET]: {
    name: 'N-Channel JFET (2N5457)',
    type: ComponentTypes.NJFET,
    category: ComponentCategory.TRANSISTORS,
    prefix: 'J_NJFET',
    width: 40, height: 50,
    pins: [
      {
            "id": "gate",
            "name": "G (1)",
            "num": 1,
            "x": -30,
            "y": 10,
            "dir": "left",
            "desc": "JFET Gate (Pin 1)"
      },
      {
            "id": "drain",
            "name": "D (2)",
            "num": 2,
            "x": 10,
            "y": -30,
            "dir": "top",
            "desc": "JFET Drain (Pin 2)"
      },
      {
            "id": "source",
            "name": "S (3)",
            "num": 3,
            "x": 10,
            "y": 30,
            "dir": "bottom",
            "desc": "JFET Source (Pin 3)"
      }
    ],
    params: { vPinchOff: -2.5, idss: 0.003 },
    paramSchema: [
      { key: 'vPinchOff', label: 'Pinch-off Voltage (Vp)', type: 'number', unit: 'V', default: -2.5 },
      { key: 'idss', label: 'Saturation Current IDSS', type: 'number', unit: 'A', default: 0.003 }
    ]
  },

  // =================== 5. POWER SEMICONDUCTORS ===================
  [ComponentTypes.SCR]: {
    name: 'Silicon Controlled Rectifier (SCR Thyristor)',
    type: ComponentTypes.SCR,
    category: ComponentCategory.POWER,
    prefix: 'SCR',
    width: 40, height: 50,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "SCR Anode (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "SCR Cathode (Pin 2)"
      },
      {
            "id": "gate",
            "name": "G (3)",
            "num": 3,
            "x": 0,
            "y": 25,
            "dir": "bottom",
            "desc": "SCR Gate Trigger (Pin 3)"
      }
    ],
    params: { vGateTrig: 0.8, iHold: 0.01 },
    paramSchema: [{ key: 'vGateTrig', label: 'Gate Trigger Voltage', type: 'number', unit: 'V', default: 0.8 }]
  },
  [ComponentTypes.TRIAC]: {
    name: 'TRIAC Bidirectional Switch',
    type: ComponentTypes.TRIAC,
    category: ComponentCategory.POWER,
    prefix: 'TRIAC',
    width: 40, height: 50,
    pins: [
      {
            "id": "mt1",
            "name": "MT1 (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Main Terminal 1 (Pin 1)"
      },
      {
            "id": "mt2",
            "name": "MT2 (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Main Terminal 2 (Pin 2)"
      },
      {
            "id": "gate",
            "name": "G (3)",
            "num": 3,
            "x": 0,
            "y": 25,
            "dir": "bottom",
            "desc": "TRIAC Gate Trigger (Pin 3)"
      }
    ],
    params: { vGateTrig: 1.0 },
    paramSchema: [{ key: 'vGateTrig', label: 'Gate Trigger Voltage', type: 'number', unit: 'V', default: 1.0 }]
  },
  [ComponentTypes.DIAC]: {
    name: 'DIAC Trigger Diode (DB3)',
    type: ComponentTypes.DIAC,
    category: ComponentCategory.POWER,
    prefix: 'DIAC',
    width: 40, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "DIAC Terminal 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "DIAC Terminal 2"
      }
    ],
    params: { vBreakover: 32, rOn: 5, rOff: 1e7 },
    paramSchema: [
      { key: 'vBreakover', label: 'Breakover Voltage (Vbo)', type: 'number', unit: 'V', default: 32 }
    ]
  },
  [ComponentTypes.VOLTAGE_CONTROLLED_SWITCH]: {
    name: 'Voltage Controlled Switch (VCSW)',
    type: ComponentTypes.VOLTAGE_CONTROLLED_SWITCH,
    category: ComponentCategory.POWER,
    prefix: 'S_VC',
    description: 'Analog voltage-controlled switch that transitions from open to closed state when control voltage exceeds threshold.',
    width: 60, height: 50,
    pins: [
      { id: 'ctrl_pos', name: 'CTRL+ (1)', num: 1, x: -30, y: -15, dir: 'left', desc: 'Positive Control Terminal' },
      { id: 'ctrl_neg', name: 'CTRL- (2)', num: 2, x: -30, y: 15, dir: 'left', desc: 'Negative Control Terminal' },
      { id: 'p1', name: 'SW1 (3)', num: 3, x: 30, y: -15, dir: 'right', desc: 'Switch Terminal 1' },
      { id: 'p2', name: 'SW2 (4)', num: 4, x: 30, y: 15, dir: 'right', desc: 'Switch Terminal 2' }
    ],
    params: { vThresh: 2.5, rOn: 0.1, rOff: 1e8 },
    paramSchema: [
      { key: 'vThresh', label: 'Threshold Voltage', type: 'number', unit: 'V', default: 2.5 },
      { key: 'rOn', label: 'On Resistance (Ron)', type: 'number', unit: 'Ω', default: 0.1 },
      { key: 'rOff', label: 'Off Resistance (Roff)', type: 'number', unit: 'Ω', default: 1e8 }
    ]
  },

  // =================== 6. ANALOG & LINEAR ICS ===================
  [ComponentTypes.OPAMP]: {
    name: 'Operational Amplifier (LM741 / TL082)',
    type: ComponentTypes.OPAMP,
    category: ComponentCategory.ANALOG,
    prefix: 'U_OP',
    package: 'DIP-8',
    pinCount: 8,
    description: 'High-gain differential voltage amplifier with inverting/non-inverting inputs, bipolar power rails, and rail-to-rail saturation clamping.',
    width: 60, height: 60,
    pins: [
      { id: 'in_inv', name: 'IN- (2)', num: 2, x: -30, y: -15, dir: 'left', desc: 'Inverting Input' },
      { id: 'in_noninv', name: 'IN+ (3)', num: 3, x: -30, y: 15, dir: 'left', desc: 'Non-Inverting Input' },
      { id: 'v_pos', name: 'V+ (7)', num: 7, x: 0, y: -25, dir: 'top', desc: 'Positive DC Power Supply (+Vcc)' },
      { id: 'v_neg', name: 'V- (4)', num: 4, x: 0, y: 25, dir: 'bottom', desc: 'Negative DC Power Supply (-Vee / GND)' },
      { id: 'out', name: 'OUT (6)', num: 6, x: 30, y: 0, dir: 'right', desc: 'Amplified Analog Output' }
    ],
    params: { model: 'TL082', openLoopGain: 200000, vSatPos: 14, vSatNeg: -14 },
    paramSchema: [
      { key: 'model', label: 'Op-Amp Model', type: 'select', options: ['TL082', 'LM741', 'LM358', 'NE5532', 'Ideal'], default: 'TL082' },
      { key: 'openLoopGain', label: 'Open Loop Gain (Aol)', type: 'number', unit: '', default: 200000 },
      { key: 'vSatPos', label: '+Vsat Rail Limit', type: 'number', unit: 'V', default: 14 },
      { key: 'vSatNeg', label: '-Vsat Rail Limit', type: 'number', unit: 'V', default: -14 }
    ]
  },
  [ComponentTypes.COMPARATOR]: {
    name: 'Voltage Comparator (LM393 / LM311)',
    type: ComponentTypes.COMPARATOR,
    category: ComponentCategory.ANALOG,
    prefix: 'U_COMP',
    package: 'DIP-8',
    pinCount: 8,
    description: 'High-speed analog voltage comparator with open-collector digital output and hysteresis switching.',
    width: 60, height: 60,
    pins: [
      { id: 'in_inv', name: 'IN- (2)', num: 2, x: -30, y: -15, dir: 'left', desc: 'Inverting Input' },
      { id: 'in_noninv', name: 'IN+ (3)', num: 3, x: -30, y: 15, dir: 'left', desc: 'Non-Inverting Input' },
      { id: 'out', name: 'OUT (1)', num: 1, x: 30, y: 0, dir: 'right', desc: 'Digital Comparator Output' }
    ],
    params: { vHigh: 5, vLow: 0, hysteresis: 0.01 },
    paramSchema: [
      { key: 'vHigh', label: 'V_High Output', type: 'number', unit: 'V', default: 5 },
      { key: 'vLow', label: 'V_Low Output', type: 'number', unit: 'V', default: 0 }
    ]
  },
  [ComponentTypes.TIMER555]: {
    name: 'Precision 555 Timer IC',
    type: ComponentTypes.TIMER555,
    category: ComponentCategory.ANALOG,
    prefix: 'U_555',
    package: 'DIP-8',
    pinCount: 8,
    description: 'Precision timing circuit generating accurate time delays or oscillations (astable / monostable multivibrator).',
    width: 70, height: 80,
    pins: [
      { id: 'gnd', name: 'GND (1)', num: 1, x: -35, y: -30, dir: 'left', desc: 'Ground Reference (0V)' },
      { id: 'trig', name: 'TRIG (2)', num: 2, x: -35, y: -10, dir: 'left', desc: 'Trigger Input (< 1/3 Vcc starts output)' },
      { id: 'out', name: 'OUT (3)', num: 3, x: 35, y: -30, dir: 'right', desc: 'High-Current Pulse Output (up to 200mA)' },
      { id: 'reset', name: 'RESET (4)', num: 4, x: 35, y: -10, dir: 'right', desc: 'Active-Low Reset Override' },
      { id: 'ctrl', name: 'CTRL (5)', num: 5, x: 35, y: 10, dir: 'right', desc: 'Control Voltage (2/3 Vcc internal tap)' },
      { id: 'thresh', name: 'THRESH (6)', num: 6, x: -35, y: 10, dir: 'left', desc: 'Threshold Input (> 2/3 Vcc resets flip-flop)' },
      { id: 'disch', name: 'DISCH (7)', num: 7, x: -35, y: 30, dir: 'left', desc: 'Discharge Transistor Collector' },
      { id: 'vcc', name: 'VCC (8)', num: 8, x: 35, y: 30, dir: 'right', desc: 'Positive Supply (+4.5V to +15V)' }
    ],
    params: { vcc: 9 },
    paramSchema: [{ key: 'vcc', label: 'Supply Voltage (Vcc)', type: 'number', unit: 'V', default: 9 }]
  },
  [ComponentTypes.TIMER556]: {
    name: 'Dual 556 Precision Timer IC',
    type: ComponentTypes.TIMER556,
    category: ComponentCategory.ANALOG,
    prefix: 'U_556',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual monolithic precision timing circuit containing two independent 555 timers in a single 14-pin DIP package.',
    width: 80, height: 100,
    pins: [
      { id: 'disch1', name: 'DIS1 (1)', num: 1, x: -40, y: -35, dir: 'left', desc: 'Timer 1 Discharge' },
      { id: 'thresh1', name: 'TH1 (2)', num: 2, x: -40, y: -20, dir: 'left', desc: 'Timer 1 Threshold' },
      { id: 'ctrl1', name: 'CV1 (3)', num: 3, x: -40, y: -5, dir: 'left', desc: 'Timer 1 Control Voltage' },
      { id: 'reset1', name: 'RST1 (4)', num: 4, x: -40, y: 10, dir: 'left', desc: 'Timer 1 Reset' },
      { id: 'out1', name: 'OUT1 (5)', num: 5, x: -40, y: 25, dir: 'left', desc: 'Timer 1 Output' },
      { id: 'trig1', name: 'TR1 (6)', num: 6, x: -40, y: 40, dir: 'left', desc: 'Timer 1 Trigger' },
      { id: 'gnd', name: 'GND (7)', num: 7, x: 0, y: 50, dir: 'bottom', desc: 'Common Ground Reference' },
      { id: 'vcc', name: 'VCC (14)', num: 14, x: 0, y: -50, dir: 'top', desc: 'Common Positive Supply (+Vcc)' },
      { id: 'disch2', name: 'DIS2 (13)', num: 13, x: 40, y: -35, dir: 'right', desc: 'Timer 2 Discharge' },
      { id: 'thresh2', name: 'TH2 (12)', num: 12, x: 40, y: -20, dir: 'right', desc: 'Timer 2 Threshold' },
      { id: 'ctrl2', name: 'CV2 (11)', num: 11, x: 40, y: -5, dir: 'right', desc: 'Timer 2 Control Voltage' },
      { id: 'reset2', name: 'RST2 (10)', num: 10, x: 40, y: 10, dir: 'right', desc: 'Timer 2 Reset' },
      { id: 'out2', name: 'OUT2 (9)', num: 9, x: 40, y: 25, dir: 'right', desc: 'Timer 2 Output' },
      { id: 'trig2', name: 'TR2 (8)', num: 8, x: 40, y: 40, dir: 'right', desc: 'Timer 2 Trigger' }
    ],
    params: { vcc: 9 },
    paramSchema: [{ key: 'vcc', label: 'Supply Voltage (Vcc)', type: 'number', unit: 'V', default: 9 }]
  },
  [ComponentTypes.ANALOG_MULTIPLIER]: {
    name: 'Analog Multiplier (AD633 / Vout = X*Y/10)',
    type: ComponentTypes.ANALOG_MULTIPLIER,
    category: ComponentCategory.ANALOG,
    prefix: 'U_MULT',
    package: 'DIP-8',
    pinCount: 8,
    description: 'Four-quadrant analog voltage multiplier producing Vout = (X * Y) / 10V.',
    width: 60, height: 60,
    pins: [
      { id: 'x_in', name: 'X (1)', num: 1, x: -30, y: -15, dir: 'left', desc: 'X Input Voltage' },
      { id: 'y_in', name: 'Y (3)', num: 3, x: -30, y: 15, dir: 'left', desc: 'Y Input Voltage' },
      { id: 'out', name: 'W (7)', num: 7, x: 30, y: 0, dir: 'right', desc: 'Product Output (X*Y/10)' }
    ],
    params: { scale: 0.1 },
    paramSchema: [{ key: 'scale', label: 'Scale Factor (1/10)', type: 'number', default: 0.1 }]
  },
  [ComponentTypes.SAMPLE_AND_HOLD]: {
    name: 'Sample & Hold Amplifier (LF398 / S&H)',
    type: ComponentTypes.SAMPLE_AND_HOLD,
    category: ComponentCategory.ANALOG,
    prefix: 'U_SH',
    package: 'DIP-8',
    pinCount: 8,
    description: 'Monolithic Sample and Hold amplifier (LF398) with high-speed FET switch, low droop rate hold capacitor pin, and unity-gain output buffer.',
    width: 70, height: 70,
    pins: [
      { id: 'in', name: 'IN (3)', num: 3, x: -35, y: -15, dir: 'left', desc: 'Analog Input Voltage' },
      { id: 'ctrl', name: 'HOLD/SMP (8)', num: 8, x: -35, y: 15, dir: 'left', desc: 'Logic Control (HIGH = Sample, LOW = Hold)' },
      { id: 'ch', name: 'CH (6)', num: 6, x: 0, y: 35, dir: 'bottom', desc: 'Hold Capacitor Connection Pin' },
      { id: 'v_pos', name: 'V+ (1)', num: 1, x: 0, y: -35, dir: 'top', desc: 'Positive Supply (+Vcc)' },
      { id: 'out', name: 'OUT (5)', num: 5, x: 35, y: 0, dir: 'right', desc: 'Buffered Sampled Output Voltage' }
    ],
    params: { vThresh: 2.5, rOn: 5, rOff: 1e9, internalCap: 1e-8, droopRate: 1e-5 },
    paramSchema: [
      { key: 'vThresh', label: 'Logic Threshold', type: 'number', unit: 'V', default: 2.5 },
      { key: 'rOn', label: 'Switch On-Resistance (Ron)', type: 'number', unit: 'Ω', default: 5 },
      { key: 'internalCap', label: 'Internal Hold Cap', type: 'number', unit: 'F', default: 1e-8 }
    ]
  },
  [ComponentTypes.ANALOG_SWITCH_4066]: {
    name: 'Quad Bilateral Analog Switch (CD4066)',
    type: ComponentTypes.ANALOG_SWITCH_4066,
    category: ComponentCategory.ANALOG,
    prefix: 'U_4066',
    package: 'DIP-14',
    pinCount: 14,
    description: 'CMOS Quad Bilateral Analog Switch for transmission and multiplexing of analog or digital signals.',
    width: 60, height: 60,
    pins: [
      { id: 'in', name: 'IN/OUT (1)', num: 1, x: -30, y: -15, dir: 'left', desc: 'Signal Terminal A' },
      { id: 'ctrl', name: 'CTRL (13)', num: 13, x: -30, y: 15, dir: 'left', desc: 'Active-High Control Input' },
      { id: 'out', name: 'OUT/IN (2)', num: 2, x: 30, y: 0, dir: 'right', desc: 'Signal Terminal B' }
    ],
    params: { rOn: 50, rOff: 1e9, vThresh: 2.5 },
    paramSchema: [
      { key: 'rOn', label: 'On Resistance (Ron)', type: 'number', unit: 'Ω', default: 50 },
      { key: 'vThresh', label: 'Control Threshold', type: 'number', unit: 'V', default: 2.5 }
    ]
  },

  // =================== 7. VOLTAGE REGULATORS ===================
  [ComponentTypes.LM7805]: {
    name: 'LM7805 +5V Linear Voltage Regulator',
    type: ComponentTypes.LM7805,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7805',
    package: 'TO-220',
    pinCount: 3,
    description: 'Fixed 3-terminal positive voltage regulator producing steady +5.0V with thermal and short-circuit protection.',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN (1)', num: 1, x: -30, y: 0, dir: 'left', desc: 'Unregulated Input (7V - 25V)' },
      { id: 'gnd', name: 'GND (2)', num: 2, x: 0, y: 20, dir: 'bottom', desc: 'Ground Reference' },
      { id: 'out', name: 'OUT (3)', num: 3, x: 30, y: 0, dir: 'right', desc: 'Regulated +5.0V Output' }
    ],
    params: { vOut: 5.0, vDropMin: 2.0 },
    paramSchema: [{ key: 'vOut', label: 'Regulated Output Voltage', type: 'number', unit: 'V', default: 5.0 }]
  },
  [ComponentTypes.LM7812]: {
    name: 'LM7812 +12V Voltage Regulator',
    type: ComponentTypes.LM7812,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7812',
    package: 'TO-220',
    pinCount: 3,
    description: 'Fixed 3-terminal positive voltage regulator delivering +12.0V DC.',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN (1)', num: 1, x: -30, y: 0, dir: 'left', desc: 'Unregulated Input (14V - 35V)' },
      { id: 'gnd', name: 'GND (2)', num: 2, x: 0, y: 20, dir: 'bottom', desc: 'Ground Reference' },
      { id: 'out', name: 'OUT (3)', num: 3, x: 30, y: 0, dir: 'right', desc: 'Regulated +12.0V Output' }
    ],
    params: { vOut: 12.0 },
    paramSchema: [{ key: 'vOut', label: 'Output Voltage', type: 'number', unit: 'V', default: 12.0 }]
  },
  [ComponentTypes.LM7912]: {
    name: 'LM7912 -12V Negative Voltage Regulator',
    type: ComponentTypes.LM7912,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7912',
    package: 'TO-220',
    pinCount: 3,
    description: 'Fixed negative 3-terminal voltage regulator delivering -12.0V DC.',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN (2)', num: 2, x: -30, y: 0, dir: 'left', desc: 'Negative Input Voltage' },
      { id: 'gnd', name: 'GND (1)', num: 1, x: 0, y: 20, dir: 'bottom', desc: 'Ground Reference' },
      { id: 'out', name: 'OUT (3)', num: 3, x: 30, y: 0, dir: 'right', desc: 'Regulated -12.0V Output' }
    ],
    params: { vOut: -12.0 },
    paramSchema: [{ key: 'vOut', label: 'Output Voltage', type: 'number', unit: 'V', default: -12.0 }]
  },
  [ComponentTypes.LM317]: {
    name: 'LM317 Adjustable Positive Regulator',
    type: ComponentTypes.LM317,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_317',
    package: 'TO-220',
    pinCount: 3,
    description: 'Adjustable 3-terminal positive voltage regulator with 1.25V internal reference, capable of 1.25V to 37V output.',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN (3)', num: 3, x: -30, y: 0, dir: 'left', desc: 'Unregulated Input (Vin)' },
      { id: 'adj', name: 'ADJ (1)', num: 1, x: 0, y: 20, dir: 'bottom', desc: 'Adjustment Voltage Reference (1.25V)' },
      { id: 'out', name: 'OUT (2)', num: 2, x: 30, y: 0, dir: 'right', desc: 'Regulated Output (Vout)' }
    ],
    params: { vRef: 1.25 },
    paramSchema: [{ key: 'vRef', label: 'Reference Voltage (Vref)', type: 'number', unit: 'V', default: 1.25 }]
  },

  // =================== 8. DIGITAL LOGIC GATES ===================
  [ComponentTypes.AND_GATE]: {
    name: '2-Input AND Gate (74HC08)',
    type: ComponentTypes.AND_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual-input positive logic AND gate: Y = A AND B.',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (3)', num: 3, x: 25, y: 0, dir: 'right', desc: 'Output Y = A·B' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.OR_GATE]: {
    name: '2-Input OR Gate (74HC32)',
    type: ComponentTypes.OR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual-input positive logic OR gate: Y = A OR B.',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (3)', num: 3, x: 25, y: 0, dir: 'right', desc: 'Output Y = A+B' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NOT_GATE]: {
    name: 'NOT Inverter Gate (74HC04)',
    type: ComponentTypes.NOT_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Single-input Hex Inverter logic gate: Y = NOT A.',
    width: 40, height: 30,
    pins: [
      { id: 'in', name: 'A (1)', num: 1, x: -20, y: 0, dir: 'left', desc: 'Input A' },
      { id: 'out', name: 'Y (2)', num: 2, x: 20, y: 0, dir: 'right', desc: 'Inverted Output Y = ~A' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NAND_GATE]: {
    name: '2-Input NAND Gate (74HC00)',
    type: ComponentTypes.NAND_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual-input Universal NAND logic gate: Y = NOT (A AND B).',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (3)', num: 3, x: 25, y: 0, dir: 'right', desc: 'Output Y = ~(A·B)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NOR_GATE]: {
    name: '2-Input NOR Gate (74HC02)',
    type: ComponentTypes.NOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual-input Universal NOR logic gate: Y = NOT (A OR B).',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (2)', num: 2, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (3)', num: 3, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (1)', num: 1, x: 25, y: 0, dir: 'right', desc: 'Output Y = ~(A+B)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.XOR_GATE]: {
    name: '2-Input XOR Gate (74HC86)',
    type: ComponentTypes.XOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Exclusive-OR logic gate: Y = A XOR B.',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (3)', num: 3, x: 25, y: 0, dir: 'right', desc: 'Output Y = A⊕B' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.XNOR_GATE]: {
    name: '2-Input XNOR Gate (74HC7266)',
    type: ComponentTypes.XNOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Exclusive-NOR logic gate: Y = NOT (A XOR B).',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -10, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 10, dir: 'left', desc: 'Input B' },
      { id: 'out', name: 'Y (3)', num: 3, x: 25, y: 0, dir: 'right', desc: 'Output Y = ~(A⊕B)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.SCHMITT_TRIGGER]: {
    name: 'Schmitt Trigger Inverter (74HC14)',
    type: ComponentTypes.SCHMITT_TRIGGER,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_ST',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Hex Inverting Schmitt Trigger with built-in input hysteresis to clean noisy or slow-rising digital waveforms.',
    width: 50, height: 40,
    pins: [
      { id: 'in', name: 'A (1)', num: 1, x: -25, y: 0, dir: 'left', desc: 'Analog / Digital Input with Hysteresis' },
      { id: 'out', name: 'Y (2)', num: 2, x: 25, y: 0, dir: 'right', desc: 'Sharp Inverted Logic Output' }
    ],
    params: { vHigh: 5, vLow: 0, vThreshPos: 3.0, vThreshNeg: 1.8, isInverting: true },
    paramSchema: [
      { key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 },
      { key: 'vLow', label: 'Logic Low (GND)', type: 'number', unit: 'V', default: 0 },
      { key: 'vThreshPos', label: 'Positive Threshold (VT+)', type: 'number', unit: 'V', default: 3.0 },
      { key: 'vThreshNeg', label: 'Negative Threshold (VT-)', type: 'number', unit: 'V', default: 1.8 },
      { key: 'isInverting', label: 'Inverting (7414)', type: 'boolean', default: true }
    ]
  },
  [ComponentTypes.BUFFER_GATE]: {
    name: 'Non-Inverting Buffer Gate (74HC07)',
    type: ComponentTypes.BUFFER_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_BUF',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Non-inverting digital driver buffer for signal amplification and isolation.',
    width: 40, height: 30,
    pins: [
      { id: 'in', name: 'A (1)', num: 1, x: -20, y: 0, dir: 'left', desc: 'Input A' },
      { id: 'out', name: 'Y (2)', num: 2, x: 20, y: 0, dir: 'right', desc: 'Buffered Output Y = A' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.AND3_GATE]: {
    name: '3-Input AND Gate (74HC11)',
    type: ComponentTypes.AND3_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_AND3',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Triple 3-input positive AND gate: Y = A·B·C.',
    width: 50, height: 50,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -15, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 0, dir: 'left', desc: 'Input B' },
      { id: 'in3', name: 'C (13)', num: 13, x: -25, y: 15, dir: 'left', desc: 'Input C' },
      { id: 'out', name: 'Y (12)', num: 12, x: 25, y: 0, dir: 'right', desc: 'Output Y = A·B·C' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NAND3_GATE]: {
    name: '3-Input NAND Gate (74HC10)',
    type: ComponentTypes.NAND3_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_NAND3',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Triple 3-input NAND gate: Y = ~(A·B·C).',
    width: 50, height: 50,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -15, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 0, dir: 'left', desc: 'Input B' },
      { id: 'in3', name: 'C (13)', num: 13, x: -25, y: 15, dir: 'left', desc: 'Input C' },
      { id: 'out', name: 'Y (12)', num: 12, x: 25, y: 0, dir: 'right', desc: 'Output Y = ~(A·B·C)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.OR3_GATE]: {
    name: '3-Input OR Gate (74HC4075)',
    type: ComponentTypes.OR3_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_OR3',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Triple 3-input positive OR gate: Y = A+B+C.',
    width: 50, height: 50,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -15, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 0, dir: 'left', desc: 'Input B' },
      { id: 'in3', name: 'C (13)', num: 13, x: -25, y: 15, dir: 'left', desc: 'Input C' },
      { id: 'out', name: 'Y (12)', num: 12, x: 25, y: 0, dir: 'right', desc: 'Output Y = A+B+C' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NOR3_GATE]: {
    name: '3-Input NOR Gate (74HC27)',
    type: ComponentTypes.NOR3_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_NOR3',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Triple 3-input NOR gate: Y = ~(A+B+C).',
    width: 50, height: 50,
    pins: [
      { id: 'in1', name: 'A (1)', num: 1, x: -25, y: -15, dir: 'left', desc: 'Input A' },
      { id: 'in2', name: 'B (2)', num: 2, x: -25, y: 0, dir: 'left', desc: 'Input B' },
      { id: 'in3', name: 'C (13)', num: 13, x: -25, y: 15, dir: 'left', desc: 'Input C' },
      { id: 'out', name: 'Y (12)', num: 12, x: 25, y: 0, dir: 'right', desc: 'Output Y = ~(A+B+C)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },

  // =================== 9. 74xx & SEQUENTIAL DIGITAL ICS ===================
  [ComponentTypes.SR_LATCH]: {
    name: 'SR Latch (Set/Reset)',
    type: ComponentTypes.SR_LATCH,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_SR',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Bistable multivibrator latch with Set and Reset control lines.',
    width: 50, height: 60,
    pins: [
      { id: 's', name: 'S (1)', num: 1, x: -25, y: -15, dir: 'left', desc: 'Set Input (Active High)' },
      { id: 'r', name: 'R (2)', num: 2, x: -25, y: 15, dir: 'left', desc: 'Reset Input (Active High)' },
      { id: 'q', name: 'Q (3)', num: 3, x: 25, y: -15, dir: 'right', desc: 'Normal Q Output' },
      { id: 'q_not', name: '~Q (4)', num: 4, x: 25, y: 15, dir: 'right', desc: 'Inverted ~Q Output' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.D_FLIPFLOP]: {
    name: 'D Flip-Flop (74HC74)',
    type: ComponentTypes.D_FLIPFLOP,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_DFF',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Dual positive-edge-triggered D-type flip-flop with clear and preset.',
    width: 50, height: 60,
    pins: [
      { id: 'd', name: 'D (2)', num: 2, x: -25, y: -15, dir: 'left', desc: 'Data Input (sampled on rising clock edge)' },
      { id: 'clk', name: 'CLK (3)', num: 3, x: -25, y: 15, dir: 'left', desc: 'Clock Input (Rising Edge Triggered)' },
      { id: 'q', name: 'Q (5)', num: 5, x: 25, y: -15, dir: 'right', desc: 'Stored Q Output' },
      { id: 'q_not', name: '~Q (6)', num: 6, x: 25, y: 15, dir: 'right', desc: 'Complementary Inverted ~Q Output' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.JK_FLIPFLOP]: {
    name: 'JK Flip-Flop (74HC76)',
    type: ComponentTypes.JK_FLIPFLOP,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_JKFF',
    package: 'DIP-16',
    pinCount: 16,
    description: 'Dual JK flip-flop with Set, Reset, and Toggle states (J=1, K=1 toggles output).',
    width: 50, height: 60,
    pins: [
      { id: 'j', name: 'J (1)', num: 1, x: -25, y: -20, dir: 'left', desc: 'J Input' },
      { id: 'clk', name: 'CLK (2)', num: 2, x: -25, y: 0, dir: 'left', desc: 'Clock Pulse Trigger' },
      { id: 'k', name: 'K (4)', num: 4, x: -25, y: 20, dir: 'left', desc: 'K Input' },
      { id: 'q', name: 'Q (15)', num: 15, x: 25, y: -15, dir: 'right', desc: 'Q Output' },
      { id: 'q_not', name: '~Q (14)', num: 14, x: 25, y: 15, dir: 'right', desc: 'Inverted ~Q Output' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.T_FLIPFLOP]: {
    name: 'T Flip-Flop (Toggle Clock Trigger)',
    type: ComponentTypes.T_FLIPFLOP,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_TFF',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Toggle flip-flop that inverts its state on each clock edge when T=1.',
    width: 50, height: 60,
    pins: [
      { id: 't', name: 'T (2)', num: 2, x: -25, y: -15, dir: 'left', desc: 'Toggle Enable Input' },
      { id: 'clk', name: 'CLK (3)', num: 3, x: -25, y: 15, dir: 'left', desc: 'Clock Pulse Trigger' },
      { id: 'q', name: 'Q (5)', num: 5, x: 25, y: -15, dir: 'right', desc: 'Q Output' },
      { id: 'q_not', name: '~Q (6)', num: 6, x: 25, y: 15, dir: 'right', desc: 'Inverted ~Q Output' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.BINARY_COUNTER_4BIT]: {
    name: '4-Bit Synchronous Binary Counter (74HC161)',
    type: ComponentTypes.BINARY_COUNTER_4BIT,
    category: ComponentCategory.DIGITAL_ICS,
    prefix: 'U_CNT',
    package: 'DIP-16',
    pinCount: 16,
    description: 'Synchronous 4-bit binary counter with asynchronous clear and ripple carry output.',
    width: 60, height: 80,
    pins: [
      { id: 'clk', name: 'CLK (2)', num: 2, x: -30, y: -20, dir: 'left', desc: 'Clock Input' },
      { id: 'clr', name: 'CLR (1)', num: 1, x: -30, y: 20, dir: 'left', desc: 'Asynchronous Master Reset / Clear' },
      { id: 'q0', name: 'Q0 (14)', num: 14, x: 30, y: -30, dir: 'right', desc: 'Bit 0 Output (LSB, 2^0)' },
      { id: 'q1', name: 'Q1 (13)', num: 13, x: 30, y: -10, dir: 'right', desc: 'Bit 1 Output (2^1)' },
      { id: 'q2', name: 'Q2 (12)', num: 12, x: 30, y: 10, dir: 'right', desc: 'Bit 2 Output (2^2)' },
      { id: 'q3', name: 'Q3 (11)', num: 11, x: 30, y: 30, dir: 'right', desc: 'Bit 3 Output (MSB, 2^3)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.MUX_4TO1]: {
    name: '4:1 Digital Multiplexer (74HC153)',
    type: ComponentTypes.MUX_4TO1,
    category: ComponentCategory.DIGITAL_ICS,
    prefix: 'U_MUX',
    package: 'DIP-16',
    pinCount: 16,
    description: '4-to-1 data selector / multiplexer with binary select lines S0, S1.',
    width: 60, height: 80,
    pins: [
      { id: 'i0', name: 'I0 (6)', num: 6, x: -30, y: -30, dir: 'left', desc: 'Data Input 0' },
      { id: 'i1', name: 'I1 (5)', num: 5, x: -30, y: -10, dir: 'left', desc: 'Data Input 1' },
      { id: 'i2', name: 'I2 (4)', num: 4, x: -30, y: 10, dir: 'left', desc: 'Data Input 2' },
      { id: 'i3', name: 'I3 (3)', num: 3, x: -30, y: 30, dir: 'left', desc: 'Data Input 3' },
      { id: 's0', name: 'S0 (14)', num: 14, x: 0, y: 40, dir: 'bottom', desc: 'Select Line 0 (LSB)' },
      { id: 's1', name: 'S1 (2)', num: 2, x: 15, y: 40, dir: 'bottom', desc: 'Select Line 1 (MSB)' },
      { id: 'out', name: 'Y (7)', num: 7, x: 30, y: 0, dir: 'right', desc: 'Selected Output Y' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },

  // =================== 10. ARITHMETIC & ALU ===================
  [ComponentTypes.HALF_ADDER]: {
    name: 'Digital Half Adder',
    type: ComponentTypes.HALF_ADDER,
    category: ComponentCategory.ARITHMETIC,
    prefix: 'U_HA',
    package: 'DIP-14',
    pinCount: 14,
    description: 'Combinational digital adder calculating Sum = A⊕B and Carry = A·B.',
    width: 50, height: 50,
    pins: [
      { id: 'a', name: 'A (1)', num: 1, x: -25, y: -12, dir: 'left', desc: 'Binary Input A' },
      { id: 'b', name: 'B (2)', num: 2, x: -25, y: 12, dir: 'left', desc: 'Binary Input B' },
      { id: 'sum', name: 'SUM (3)', num: 3, x: 25, y: -12, dir: 'right', desc: 'Sum Bit Output (A⊕B)' },
      { id: 'carry', name: 'COUT (4)', num: 4, x: 25, y: 12, dir: 'right', desc: 'Carry Output (A·B)' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (V)', type: 'number', default: 5 }]
  },
  [ComponentTypes.FULL_ADDER]: {
    name: '1-Bit Full Adder',
    type: ComponentTypes.FULL_ADDER,
    category: ComponentCategory.ARITHMETIC,
    prefix: 'U_FA',
    width: 60, height: 60,
    pins: [
      {
            "id": "a",
            "name": "A (1)",
            "num": 1,
            "x": -35,
            "y": -20,
            "dir": "left",
            "desc": "Data Input A"
      },
      {
            "id": "b",
            "name": "B (2)",
            "num": 2,
            "x": -35,
            "y": 0,
            "dir": "left",
            "desc": "Data Input B"
      },
      {
            "id": "cin",
            "name": "CIN (3)",
            "num": 3,
            "x": -35,
            "y": 20,
            "dir": "left",
            "desc": "Carry In"
      },
      {
            "id": "sum",
            "name": "SUM (4)",
            "num": 4,
            "x": 35,
            "y": -10,
            "dir": "right",
            "desc": "Arithmetic Sum"
      },
      {
            "id": "cout",
            "name": "COUT (5)",
            "num": 5,
            "x": 35,
            "y": 10,
            "dir": "right",
            "desc": "Carry Out"
      }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (V)', type: 'number', default: 5 }]
  },

  // =================== 11. SWITCHES & RELAYS ===================
  [ComponentTypes.SPST_SWITCH]: {
    name: 'SPST Toggle Switch',
    type: ComponentTypes.SPST_SWITCH,
    category: ComponentCategory.SWITCHES,
    prefix: 'SW',
    width: 40, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Switch Terminal 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Switch Terminal 2"
      }
    ],
    params: { closed: false },
    paramSchema: [{ key: 'closed', label: 'Switch Closed', type: 'boolean', default: false }]
  },
  [ComponentTypes.SPDT_SWITCH]: {
    name: 'SPDT Switch',
    type: ComponentTypes.SPDT_SWITCH,
    category: ComponentCategory.SWITCHES,
    prefix: 'SW_SPDT',
    width: 50, height: 40,
    pins: [
      {
            "id": "com",
            "name": "COM (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Common Pole (Pin 1)"
      },
      {
            "id": "p1",
            "name": "NO (2)",
            "num": 2,
            "x": 25,
            "y": -15,
            "dir": "right",
            "desc": "Throw 1 (Pin 2)"
      },
      {
            "id": "p2",
            "name": "NC (3)",
            "num": 3,
            "x": 25,
            "y": 15,
            "dir": "right",
            "desc": "Throw 2 (Pin 3)"
      }
    ],
    params: { position: 1 },
    paramSchema: [{ key: 'position', label: 'Switch Position (1 or 2)', type: 'number', default: 1 }]
  },
  [ComponentTypes.PUSH_BUTTON]: {
    name: 'Pushbutton (Normally Open)',
    type: ComponentTypes.PUSH_BUTTON,
    category: ComponentCategory.SWITCHES,
    prefix: 'PB',
    width: 40, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Pushbutton Lead 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Pushbutton Lead 2"
      }
    ],
    params: { closed: false },
    paramSchema: [{ key: 'closed', label: 'Pressed', type: 'boolean', default: false }]
  },
  [ComponentTypes.PUSH_BUTTON_NC]: {
    name: 'Pushbutton (Normally Closed)',
    type: ComponentTypes.PUSH_BUTTON_NC,
    category: ComponentCategory.SWITCHES,
    prefix: 'PB_NC',
    width: 40, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Pushbutton NC Lead 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Pushbutton NC Lead 2"
      }
    ],
    params: { closed: true },
    paramSchema: [{ key: 'closed', label: 'Closed State', type: 'boolean', default: true }]
  },
  [ComponentTypes.DIGITAL_CONSTANT]: {
    name: 'Interactive Digital Constant (DG / Switch)',
    type: ComponentTypes.DIGITAL_CONSTANT,
    category: ComponentCategory.SWITCHES,
    prefix: 'DG',
    width: 36, height: 24,
    pins: [
      {
            "id": "out",
            "name": "OUT (1)",
            "num": 1,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Logic State Output (Pin 1)"
      }
    ],
    params: { state: 0, vHigh: 5.0, vLow: 0.0 },
    paramSchema: [
      { key: 'state', label: 'Logic State (0 or 1)', type: 'select', options: [0, 1], default: 0 },
      { key: 'vHigh', label: 'Logic High Level (V)', type: 'number', unit: 'V', default: 5.0 }
    ]
  },
  [ComponentTypes.DIGITAL_SWITCH]: {
    name: 'Interactive Digital Switch (DG)',
    type: ComponentTypes.DIGITAL_SWITCH,
    category: ComponentCategory.SWITCHES,
    prefix: 'DG',
    width: 36, height: 24,
    pins: [
      {
            "id": "out",
            "name": "OUT (1)",
            "num": 1,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Switched Logic Output (Pin 1)"
      }
    ],
    params: { state: 0, vHigh: 5.0, vLow: 0.0 },
    paramSchema: [
      { key: 'state', label: 'Logic State (0 or 1)', type: 'select', options: [0, 1], default: 0 },
      { key: 'vHigh', label: 'Logic High Level (V)', type: 'number', unit: 'V', default: 5.0 }
    ]
  },
  [ComponentTypes.TEXT_LABEL]: {
    name: 'Text Annotation / Circuit Title',
    type: ComponentTypes.TEXT_LABEL,
    category: ComponentCategory.PASSIVES,
    prefix: 'TXT',
    width: 140, height: 28,
    pins: [],
    params: { text: 'Circuit Title', fontSize: 13, bold: true, color: '#334155' },
    paramSchema: [
      { key: 'text', label: 'Annotation Text / Title', type: 'string', default: 'Circuit Title' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', default: 13 },
      { key: 'bold', label: 'Bold Font', type: 'boolean', default: true },
      { key: 'color', label: 'Text Color', type: 'string', default: '#334155' }
    ]
  },
  [ComponentTypes.RELAY_SPDT]: {
    name: 'Electromechanical Relay (SPDT)',
    type: ComponentTypes.RELAY_SPDT,
    category: ComponentCategory.SWITCHES,
    prefix: 'RLY',
    width: 60, height: 60,
    pins: [
      {
            "id": "coil_p1",
            "name": "COIL+ (1)",
            "num": 1,
            "x": -30,
            "y": -20,
            "dir": "left",
            "desc": "Coil Input (+) (Pin 1)"
      },
      {
            "id": "coil_p2",
            "name": "COIL- (2)",
            "num": 2,
            "x": -30,
            "y": 20,
            "dir": "left",
            "desc": "Coil Return (-) (Pin 2)"
      },
      {
            "id": "com",
            "name": "COM (3)",
            "num": 3,
            "x": 30,
            "y": 0,
            "dir": "right",
            "desc": "Switch Common Pole (Pin 3)"
      },
      {
            "id": "no",
            "name": "NO (4)",
            "num": 4,
            "x": 30,
            "y": -20,
            "dir": "right",
            "desc": "Normally Open Contact (Pin 4)"
      },
      {
            "id": "nc",
            "name": "NC (5)",
            "num": 5,
            "x": 30,
            "y": 20,
            "dir": "right",
            "desc": "Normally Closed Contact (Pin 5)"
      }
    ],
    params: { coilR: 100, vPullIn: 3.5 },
    paramSchema: [
      { key: 'coilR', label: 'Coil Resistance', type: 'number', unit: 'Ω', default: 100 },
      { key: 'vPullIn', label: 'Pull-in Threshold', type: 'number', unit: 'V', default: 3.5 }
    ]
  },

  // =================== 12. OPTO & DISPLAYS ===================
  [ComponentTypes.OPTOCOUPLER]: {
    name: 'Optocoupler (4N25 / PC817)',
    type: ComponentTypes.OPTOCOUPLER,
    category: ComponentCategory.OPTO_DISPLAYS,
    prefix: 'OPTO',
    width: 60, height: 50,
    pins: [
      {
            "id": "anode",
            "name": "A (1)",
            "num": 1,
            "x": -30,
            "y": -15,
            "dir": "left",
            "desc": "LED Anode (Pin 1)"
      },
      {
            "id": "cathode",
            "name": "K (2)",
            "num": 2,
            "x": -30,
            "y": 15,
            "dir": "left",
            "desc": "LED Cathode (Pin 2)"
      },
      {
            "id": "coll",
            "name": "C (3)",
            "num": 3,
            "x": 30,
            "y": -15,
            "dir": "right",
            "desc": "Phototransistor Collector (Pin 3)"
      },
      {
            "id": "emit",
            "name": "E (4)",
            "num": 4,
            "x": 30,
            "y": 15,
            "dir": "right",
            "desc": "Phototransistor Emitter (Pin 4)"
      }
    ],
    params: { ctr: 1.0 },
    paramSchema: [{ key: 'ctr', label: 'Current Transfer Ratio (CTR)', type: 'number', default: 1.0 }]
  },
  [ComponentTypes.SEVEN_SEGMENT]: {
    name: '7-Segment Digital Display (Common Cathode)',
    type: ComponentTypes.SEVEN_SEGMENT,
    category: ComponentCategory.OPTO_DISPLAYS,
    prefix: 'DISP_7SEG',
    width: 60, height: 80,
    pins: [
      {
            "id": "a",
            "name": "A (1)",
            "num": 1,
            "x": -20,
            "y": -45,
            "dir": "top",
            "desc": "Segment A (Pin 1)"
      },
      {
            "id": "b",
            "name": "B (2)",
            "num": 2,
            "x": 20,
            "y": -45,
            "dir": "top",
            "desc": "Segment B (Pin 2)"
      },
      {
            "id": "c",
            "name": "C (3)",
            "num": 3,
            "x": 20,
            "y": 45,
            "dir": "bottom",
            "desc": "Segment C (Pin 3)"
      },
      {
            "id": "d",
            "name": "D (4)",
            "num": 4,
            "x": -20,
            "y": 45,
            "dir": "bottom",
            "desc": "Segment D (Pin 4)"
      },
      {
            "id": "e",
            "name": "E (5)",
            "num": 5,
            "x": -30,
            "y": 20,
            "dir": "left",
            "desc": "Segment E (Pin 5)"
      },
      {
            "id": "f",
            "name": "F (6)",
            "num": 6,
            "x": -30,
            "y": -20,
            "dir": "left",
            "desc": "Segment F (Pin 6)"
      },
      {
            "id": "g",
            "name": "G (7)",
            "num": 7,
            "x": -30,
            "y": 0,
            "dir": "left",
            "desc": "Segment G (Pin 7)"
      },
      {
            "id": "dp",
            "name": "DP (8)",
            "num": 8,
            "x": 30,
            "y": 25,
            "dir": "right",
            "desc": "Decimal Point (Pin 8)"
      },
      {
            "id": "gnd",
            "name": "COM (9)",
            "num": 9,
            "x": 0,
            "y": 45,
            "dir": "bottom",
            "desc": "Common Cathode Ground (Pin 9)"
      }
    ],
    params: { color: '#ff3b30' },
    paramSchema: [{ key: 'color', label: 'Display Color', type: 'select', options: ['#ff3b30', '#03b585', '#007aff', '#ff9500'], default: '#ff3b30' }]
  },

  [ComponentTypes.LAMP]: {
    name: 'Incandescent Lamp / Light Bulb',
    type: ComponentTypes.LAMP,
    category: ComponentCategory.OPTO_DISPLAYS,
    prefix: 'LAMP',
    width: 40, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Bulb Lead 1"
      },
      {
            "id": "p2",
            "name": "2",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Bulb Lead 2"
      }
    ],
    params: { ratedVoltage: 9, ratedPower: 2, nominalR: 40.5 },
    paramSchema: [
      { key: 'ratedVoltage', label: 'Rated Voltage (V)', type: 'number', unit: 'V', default: 9, step: 0.5 },
      { key: 'ratedPower', label: 'Rated Power (W)', type: 'number', unit: 'W', default: 2, step: 0.1 },
      { key: 'nominalR', label: 'Resistance (Cold)', type: 'number', unit: 'Ω', default: 40.5, step: 1 }
    ]
  },
  [ComponentTypes.BUZZER]: {
    name: 'Piezo Buzzer / Sounder',
    type: ComponentTypes.BUZZER,
    category: ComponentCategory.ELECTROMECHANICAL,
    prefix: 'BZ',
    width: 40, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "+ (1)",
            "num": 1,
            "x": -20,
            "y": 0,
            "dir": "left",
            "desc": "Piezo Positive (+) (Pin 1)"
      },
      {
            "id": "p2",
            "name": "- (2)",
            "num": 2,
            "x": 20,
            "y": 0,
            "dir": "right",
            "desc": "Piezo Negative (-) (Pin 2)"
      }
    ],
    params: { resistance: 50, frequency: 2400 },
    paramSchema: [
      { key: 'resistance', label: 'Impedance', type: 'number', unit: 'Ω', default: 50 },
      { key: 'frequency', label: 'Resonant Frequency', type: 'number', unit: 'Hz', default: 2400 }
    ]
  },
  [ComponentTypes.DC_MOTOR]: {
    name: 'DC Motor',
    type: ComponentTypes.DC_MOTOR,
    category: ComponentCategory.ELECTROMECHANICAL,
    prefix: 'M',
    width: 40, height: 40,
    pins: [
      {
            "id": "p1",
            "name": "+ (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Motor Terminal (+) (Pin 1)"
      },
      {
            "id": "p2",
            "name": "- (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Motor Terminal (-) (Pin 2)"
      }
    ],
    params: { resistance: 12, rpm: 3000 },
    paramSchema: [
      { key: 'resistance', label: 'Armature Resistance', type: 'number', unit: 'Ω', default: 12 },
      { key: 'rpm', label: 'Rated RPM', type: 'number', default: 3000 }
    ]
  },

  // =================== 13. POWER SYMBOLS & NET LABELS ===================
  [ComponentTypes.POWER_VCC]: {
    name: 'Power Rail (+5V VCC)',
    type: ComponentTypes.POWER_VCC,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'VCC',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "VCC (1)",
            "num": 1,
            "x": 0,
            "y": 15,
            "dir": "bottom",
            "desc": "Power Supply Rail"
      }
    ],
    params: { voltage: 5 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.POWER_12V]: {
    name: 'Power Rail (+12V)',
    type: ComponentTypes.POWER_12V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'P12V',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "+12V (1)",
            "num": 1,
            "x": 0,
            "y": 15,
            "dir": "bottom",
            "desc": "+12V Power Rail"
      }
    ],
    params: { voltage: 12 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 12 }]
  },
  [ComponentTypes.POWER_NEG12V]: {
    name: 'Power Rail (-12V)',
    type: ComponentTypes.POWER_NEG12V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'N12V',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "-12V (1)",
            "num": 1,
            "x": 0,
            "y": -15,
            "dir": "top",
            "desc": "-12V Power Rail"
      }
    ],
    params: { voltage: -12 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: -12 }]
  },
  [ComponentTypes.POWER_15V]: {
    name: 'Power Rail (+15V)',
    type: ComponentTypes.POWER_15V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'P15V',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "+15V (1)",
            "num": 1,
            "x": 0,
            "y": 15,
            "dir": "bottom",
            "desc": "+15V Power Rail"
      }
    ],
    params: { voltage: 15 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 15 }]
  },
  [ComponentTypes.POWER_NEG15V]: {
    name: 'Power Rail (-15V)',
    type: ComponentTypes.POWER_NEG15V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'N15V',
    width: 30, height: 30,
    pins: [
      {
            "id": "p1",
            "name": "-15V (1)",
            "num": 1,
            "x": 0,
            "y": -15,
            "dir": "top",
            "desc": "-15V Power Rail"
      }
    ],
    params: { voltage: -15 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: -15 }]
  },
  [ComponentTypes.NET_LABEL]: {
    name: 'Net Label (Wireless Net Connection)',
    type: ComponentTypes.NET_LABEL,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'NET',
    width: 40, height: 20,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": 0,
            "y": 0,
            "dir": "bottom",
            "desc": "Net Connection Node"
      }
    ],
    params: { label: 'NET1' },
    paramSchema: [{ key: 'label', label: 'Net Name', type: 'string', default: 'NET1' }]
  },
  [ComponentTypes.NODE]: {
    name: 'Node (Junction / Multi-Wire Hub)',
    type: ComponentTypes.NODE,
    category: ComponentCategory.PASSIVES,
    prefix: 'NODE',
    width: 14, height: 14,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": 0,
            "y": 0,
            "dir": "top",
            "desc": "Junction Node"
      }
    ],
    params: { label: '' },
    paramSchema: [
      { key: 'label', label: 'Node Label (Optional)', type: 'string', default: '' }
    ]
  },
  [ComponentTypes.JUNCTION]: {
    name: 'Junction Node (Tie Point)',
    type: ComponentTypes.JUNCTION,
    category: ComponentCategory.PASSIVES,
    prefix: 'J',
    width: 14, height: 14,
    pins: [
      {
            "id": "p1",
            "name": "1",
            "num": 1,
            "x": 0,
            "y": 0,
            "dir": "top",
            "desc": "Junction Node"
      }
    ],
    params: { label: '' },
    paramSchema: [
      { key: 'label', label: 'Junction Label (Optional)', type: 'string', default: '' }
    ]
  },

  // =================== 14. METERS & PROBES ===================
  [ComponentTypes.PROBE_V]: {
    name: 'Voltage Probe (Grapher Channel)',
    type: ComponentTypes.PROBE_V,
    category: ComponentCategory.PROBES,
    prefix: 'PR_V',
    width: 30, height: 40,
    pins: [
      {
            "id": "tip",
            "name": "TIP (1)",
            "num": 1,
            "x": 0,
            "y": 20,
            "dir": "bottom",
            "desc": "Voltage Probe Tip"
      }
    ],
    params: { color: '#03b585', label: 'V_out' },
    paramSchema: [
      { key: 'label', label: 'Probe Label', type: 'string', default: 'V_out' },
      { key: 'color', label: 'Trace Color', type: 'select', options: ['#03b585', '#007aff', '#ff9500', '#e11d48', '#a855f7'], default: '#03b585' }
    ]
  },
  [ComponentTypes.PROBE_I]: {
    name: 'Current Probe',
    type: ComponentTypes.PROBE_I,
    category: ComponentCategory.PROBES,
    prefix: 'PR_I',
    width: 30, height: 40,
    pins: [
      {
            "id": "tip",
            "name": "TIP (1)",
            "num": 1,
            "x": 0,
            "y": 20,
            "dir": "bottom",
            "desc": "Current Probe Tip"
      }
    ],
    params: { color: '#ff9500', label: 'I_branch' },
    paramSchema: [
      { key: 'label', label: 'Probe Label', type: 'string', default: 'I_branch' },
      { key: 'color', label: 'Trace Color', type: 'select', options: ['#ff9500', '#e11d48', '#03b585', '#007aff'], default: '#ff9500' }
    ]
  },
  [ComponentTypes.VOLTMETER]: {
    name: 'Digital Voltmeter Readout',
    type: ComponentTypes.VOLTMETER,
    category: ComponentCategory.PROBES,
    prefix: 'DVM',
    width: 50, height: 40,
    pins: [
      {
            "id": "p_pos",
            "name": "+ (1)",
            "num": 1,
            "x": -25,
            "y": 0,
            "dir": "left",
            "desc": "Voltmeter High (+)"
      },
      {
            "id": "p_neg",
            "name": "- (2)",
            "num": 2,
            "x": 25,
            "y": 0,
            "dir": "right",
            "desc": "Voltmeter Low (-)"
      }
    ],
    params: {}, paramSchema: []
  }
};

// Aliases mapping in ComponentDefinitions for maximum compatibility
ComponentDefinitions.SWITCH_SPST = ComponentDefinitions[ComponentTypes.SPST_SWITCH];
ComponentDefinitions.TOGGLE_SWITCH = ComponentDefinitions[ComponentTypes.SPDT_SWITCH];
ComponentDefinitions.SEVEN_SEG_DISPLAY = ComponentDefinitions[ComponentTypes.SEVEN_SEGMENT];
ComponentDefinitions.LIGHT = ComponentDefinitions[ComponentTypes.LAMP];
ComponentDefinitions.BULB = ComponentDefinitions[ComponentTypes.LAMP];
ComponentDefinitions.OP_AMP = ComponentDefinitions[ComponentTypes.OPAMP];

