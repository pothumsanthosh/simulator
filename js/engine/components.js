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
  DIP_SWITCH_4: 'DIP_SWITCH_4',
  RELAY_SPDT: 'RELAY_SPDT',
  RELAY_DPDT: 'RELAY_DPDT',

  // Electromechanical
  DC_MOTOR: 'DC_MOTOR',
  SPEAKER: 'SPEAKER',
  BUZZER: 'BUZZER',
  LAMP: 'LAMP',

  // Opto & Displays
  OPTOCOUPLER: 'OPTOCOUPLER',
  SEVEN_SEGMENT: 'SEVEN_SEGMENT',
  SEVEN_SEGMENT_DUAL: 'SEVEN_SEGMENT_DUAL',
  SEVEN_SEGMENT_QUAD: 'SEVEN_SEGMENT_QUAD',
  BARGRAPH_LED: 'BARGRAPH_LED',
  HEX_DISPLAY: 'HEX_DISPLAY',

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
    pins: [{ id: 'p1', name: 'GND', x: 0, y: -15, dir: 'top' }],
    params: {}, paramSchema: []
  },
  [ComponentTypes.DC_VOLTAGE]: {
    name: 'DC Voltage Source',
    type: ComponentTypes.DC_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_DC',
    width: 40, height: 60,
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
    params: { voltage: 5 },
    paramSchema: [{ key: 'voltage', label: 'Voltage', type: 'number', unit: 'V', default: 5, step: 0.1 }]
  },
  [ComponentTypes.AC_VOLTAGE]: {
    name: 'AC Sine Voltage Source',
    type: ComponentTypes.AC_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_AC',
    width: 40, height: 60,
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
    params: { v1: 0, v2: 5, tDelay: 0, tRise: 1e-6, tFall: 1e-6, tWidth: 1e-3, period: 2e-3 },
    paramSchema: [
      { key: 'v1', label: 'Initial Voltage', type: 'number', unit: 'V', default: 0 },
      { key: 'v2', label: 'Pulsed Voltage', type: 'number', unit: 'V', default: 5 },
      { key: 'tWidth', label: 'Pulse Width', type: 'number', unit: 's', default: 1e-3 },
      { key: 'period', label: 'Period', type: 'number', unit: 's', default: 2e-3 }
    ]
  },
  [ComponentTypes.AM_VOLTAGE]: {
    name: 'AM Modulated RF Source',
    type: ComponentTypes.AM_VOLTAGE,
    category: ComponentCategory.SOURCES,
    prefix: 'V_AM',
    width: 40, height: 60,
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -30, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 30, dir: 'bottom' }],
    params: { rmsVoltage: 0.5 },
    paramSchema: [{ key: 'rmsVoltage', label: 'RMS Noise', type: 'number', unit: 'V', default: 0.5 }]
  },
  [ComponentTypes.DC_CURRENT]: {
    name: 'DC Current Source',
    type: ComponentTypes.DC_CURRENT,
    category: ComponentCategory.SOURCES,
    prefix: 'I_DC',
    width: 40, height: 60,
    pins: [{ id: 'p_in', name: 'In', x: 0, y: -30, dir: 'top' }, { id: 'p_out', name: 'Out', x: 0, y: 30, dir: 'bottom' }],
    params: { current: 0.001 },
    paramSchema: [{ key: 'current', label: 'DC Current', type: 'number', unit: 'A', default: 0.001, step: 0.0001 }]
  },
  [ComponentTypes.AC_CURRENT]: {
    name: 'AC Current Source',
    type: ComponentTypes.AC_CURRENT,
    category: ComponentCategory.SOURCES,
    prefix: 'I_AC',
    width: 40, height: 60,
    pins: [{ id: 'p_in', name: 'In', x: 0, y: -30, dir: 'top' }, { id: 'p_out', name: 'Out', x: 0, y: 30, dir: 'bottom' }],
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
      { id: 'in_pos', name: 'IN+', x: -25, y: -15, dir: 'left' },
      { id: 'in_neg', name: 'IN-', x: -25, y: 15, dir: 'left' },
      { id: 'out_pos', name: 'OUT+', x: 25, y: -15, dir: 'right' },
      { id: 'out_neg', name: 'OUT-', x: 25, y: 15, dir: 'right' }
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
      { id: 'in_pos', name: 'IN+', x: -25, y: -15, dir: 'left' },
      { id: 'in_neg', name: 'IN-', x: -25, y: 15, dir: 'left' },
      { id: 'out_pos', name: 'OUT+', x: 25, y: -15, dir: 'right' },
      { id: 'out_neg', name: 'OUT-', x: 25, y: 15, dir: 'right' }
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
    pins: [{ id: 'p_pos', name: '+', x: 0, y: -25, dir: 'top' }, { id: 'p_neg', name: '-', x: 0, y: 25, dir: 'bottom' }],
    params: { voltage: 3.7, internalR: 0.05 },
    paramSchema: [
      { key: 'voltage', label: 'Cell Voltage', type: 'number', unit: 'V', default: 3.7 },
      { key: 'internalR', label: 'Internal Resistance', type: 'number', unit: 'Ω', default: 0.05 }
    ]
  },

  // =================== 2. PASSIVES ===================
  [ComponentTypes.RESISTOR]: {
    name: 'Resistor',
    type: ComponentTypes.RESISTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'R',
    width: 60, height: 30,
    pins: [{ id: 'p1', name: '1', x: -30, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 30, y: 0, dir: 'right' }],
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
      { id: 'p1', name: '1', x: -30, y: 0, dir: 'left' },
      { id: 'p2', name: 'Wiper', x: 0, y: -20, dir: 'top' },
      { id: 'p3', name: '2', x: 30, y: 0, dir: 'right' }
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
    pins: [{ id: 'p1', name: '1', x: -20, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 20, y: 0, dir: 'right' }],
    params: { capacitance: 1e-7 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 1e-7, step: 1e-9 }]
  },
  [ComponentTypes.POLARIZED_CAP]: {
    name: 'Electrolytic Polarized Capacitor',
    type: ComponentTypes.POLARIZED_CAP,
    category: ComponentCategory.PASSIVES,
    prefix: 'C_POL',
    width: 40, height: 40,
    pins: [{ id: 'p_pos', name: '+', x: -20, y: 0, dir: 'left' }, { id: 'p_neg', name: '-', x: 20, y: 0, dir: 'right' }],
    params: { capacitance: 1e-4 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 1e-4, step: 1e-6 }]
  },
  [ComponentTypes.TANTALUM_CAP]: {
    name: 'Tantalum Capacitor',
    type: ComponentTypes.TANTALUM_CAP,
    category: ComponentCategory.PASSIVES,
    prefix: 'C_TAN',
    width: 40, height: 40,
    pins: [{ id: 'p_pos', name: '+', x: -20, y: 0, dir: 'left' }, { id: 'p_neg', name: '-', x: 20, y: 0, dir: 'right' }],
    params: { capacitance: 2.2e-5, esr: 0.1 },
    paramSchema: [{ key: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', default: 2.2e-5 }]
  },
  [ComponentTypes.INDUCTOR]: {
    name: 'Inductor',
    type: ComponentTypes.INDUCTOR,
    category: ComponentCategory.PASSIVES,
    prefix: 'L',
    width: 60, height: 30,
    pins: [{ id: 'p1', name: '1', x: -30, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 30, y: 0, dir: 'right' }],
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
      { id: 'l1_p1', name: 'L1+', x: -30, y: -15, dir: 'left' },
      { id: 'l1_p2', name: 'L1-', x: 30, y: -15, dir: 'right' },
      { id: 'l2_p1', name: 'L2+', x: -30, y: 15, dir: 'left' },
      { id: 'l2_p2', name: 'L2-', x: 30, y: 15, dir: 'right' }
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
      { id: 'pri_1', name: 'Pri 1', x: -30, y: -20, dir: 'left' },
      { id: 'pri_2', name: 'Pri 2', x: -30, y: 20, dir: 'left' },
      { id: 'sec_1', name: 'Sec 1', x: 30, y: -20, dir: 'right' },
      { id: 'sec_2', name: 'Sec 2', x: 30, y: 20, dir: 'right' }
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
      { id: 'pri_1', name: 'Pri 1', x: -30, y: -20, dir: 'left' },
      { id: 'pri_2', name: 'Pri 2', x: -30, y: 20, dir: 'left' },
      { id: 'sec_1', name: 'Sec 1', x: 30, y: -25, dir: 'right' },
      { id: 'sec_ct', name: 'Center Tap', x: 30, y: 0, dir: 'right' },
      { id: 'sec_2', name: 'Sec 2', x: 30, y: 25, dir: 'right' }
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
    pins: [{ id: 'p1', name: '1', x: -25, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 25, y: 0, dir: 'right' }],
    params: { frequency: 4e6 },
    paramSchema: [{ key: 'frequency', label: 'Resonant Frequency', type: 'number', unit: 'Hz', default: 4e6 }]
  },
  [ComponentTypes.FUSE]: {
    name: 'Protective Fuse',
    type: ComponentTypes.FUSE,
    category: ComponentCategory.PASSIVES,
    prefix: 'FUSE',
    width: 50, height: 20,
    pins: [{ id: 'p1', name: '1', x: -25, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 25, y: 0, dir: 'right' }],
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
    pins: [{ id: 'p1', name: '1', x: -25, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 25, y: 0, dir: 'right' }],
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
    pins: [{ id: 'p1', name: '1', x: -25, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 25, y: 0, dir: 'right' }],
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
    pins: [{ id: 'anode', name: 'A', x: -20, y: 0, dir: 'left' }, { id: 'cathode', name: 'K', x: 20, y: 0, dir: 'right' }],
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
    pins: [{ id: 'anode', name: 'A', x: -20, y: 0, dir: 'left' }, { id: 'cathode', name: 'K', x: 20, y: 0, dir: 'right' }],
    params: { model: 'BAT54', forwardDrop: 0.32 },
    paramSchema: [{ key: 'forwardDrop', label: 'Forward Drop', type: 'number', unit: 'V', default: 0.32 }]
  },
  [ComponentTypes.ZENER]: {
    name: 'Zener Voltage Regulator Diode',
    type: ComponentTypes.ZENER,
    category: ComponentCategory.DIODES,
    prefix: 'D_ZEN',
    width: 40, height: 30,
    pins: [{ id: 'anode', name: 'A', x: -20, y: 0, dir: 'left' }, { id: 'cathode', name: 'K', x: 20, y: 0, dir: 'right' }],
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
    pins: [{ id: 'anode', name: 'A', x: -20, y: 0, dir: 'left' }, { id: 'cathode', name: 'K', x: 20, y: 0, dir: 'right' }],
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
      { id: 'ac1', name: 'AC 1', x: -25, y: -15, dir: 'left' },
      { id: 'ac2', name: 'AC 2', x: -25, y: 15, dir: 'left' },
      { id: 'pos', name: '+ (DC)', x: 25, y: -15, dir: 'right' },
      { id: 'neg', name: '- (DC)', x: 25, y: 15, dir: 'right' }
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
      { id: 'base', name: 'B', x: -20, y: 0, dir: 'left' },
      { id: 'collector', name: 'C', x: 15, y: -25, dir: 'top' },
      { id: 'emitter', name: 'E', x: 15, y: 25, dir: 'bottom' }
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
      { id: 'base', name: 'B', x: -20, y: 0, dir: 'left' },
      { id: 'collector', name: 'C', x: 15, y: 25, dir: 'bottom' },
      { id: 'emitter', name: 'E', x: 15, y: -25, dir: 'top' }
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
      { id: 'base', name: 'B', x: -20, y: 0, dir: 'left' },
      { id: 'collector', name: 'C', x: 15, y: -25, dir: 'top' },
      { id: 'emitter', name: 'E', x: 15, y: 25, dir: 'bottom' }
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
      { id: 'gate', name: 'G', x: -20, y: 10, dir: 'left' },
      { id: 'drain', name: 'D', x: 15, y: -25, dir: 'top' },
      { id: 'source', name: 'S', x: 15, y: 25, dir: 'bottom' }
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
      { id: 'gate', name: 'G', x: -20, y: -10, dir: 'left' },
      { id: 'drain', name: 'D', x: 15, y: 25, dir: 'bottom' },
      { id: 'source', name: 'S', x: 15, y: -25, dir: 'top' }
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
      { id: 'gate', name: 'G', x: -20, y: 10, dir: 'left' },
      { id: 'drain', name: 'D', x: 15, y: -25, dir: 'top' },
      { id: 'source', name: 'S', x: 15, y: 25, dir: 'bottom' }
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
      { id: 'anode', name: 'A', x: -20, y: -15, dir: 'left' },
      { id: 'cathode', name: 'K', x: 20, y: -15, dir: 'right' },
      { id: 'gate', name: 'G', x: -10, y: 25, dir: 'bottom' }
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
      { id: 'mt1', name: 'MT1', x: 0, y: -25, dir: 'top' },
      { id: 'mt2', name: 'MT2', x: 0, y: 25, dir: 'bottom' },
      { id: 'gate', name: 'G', x: 20, y: 10, dir: 'right' }
    ],
    params: { vGateTrig: 1.0 },
    paramSchema: [{ key: 'vGateTrig', label: 'Gate Trigger Voltage', type: 'number', unit: 'V', default: 1.0 }]
  },

  // =================== 6. ANALOG & LINEAR ICS ===================
  [ComponentTypes.OPAMP]: {
    name: 'Operational Amplifier (LM741 / TL082)',
    type: ComponentTypes.OPAMP,
    category: ComponentCategory.ANALOG,
    prefix: 'U_OP',
    width: 60, height: 60,
    pins: [
      { id: 'in_inv', name: 'IN-', x: -30, y: -15, dir: 'left' },
      { id: 'in_noninv', name: 'IN+', x: -30, y: 15, dir: 'left' },
      { id: 'v_pos', name: 'V+', x: 0, y: -25, dir: 'top' },
      { id: 'v_neg', name: 'V-', x: 0, y: 25, dir: 'bottom' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
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
    width: 60, height: 60,
    pins: [
      { id: 'in_inv', name: 'IN-', x: -30, y: -15, dir: 'left' },
      { id: 'in_noninv', name: 'IN+', x: -30, y: 15, dir: 'left' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
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
    width: 70, height: 80,
    pins: [
      { id: 'gnd', name: 'GND (1)', x: -35, y: -30, dir: 'left' },
      { id: 'trig', name: 'TRIG (2)', x: -35, y: -10, dir: 'left' },
      { id: 'out', name: 'OUT (3)', x: 35, y: -30, dir: 'right' },
      { id: 'reset', name: 'RESET (4)', x: 35, y: -10, dir: 'right' },
      { id: 'ctrl', name: 'CTRL (5)', x: 35, y: 10, dir: 'right' },
      { id: 'thresh', name: 'THRESH (6)', x: -35, y: 10, dir: 'left' },
      { id: 'disch', name: 'DISCH (7)', x: -35, y: 30, dir: 'left' },
      { id: 'vcc', name: 'VCC (8)', x: 35, y: 30, dir: 'right' }
    ],
    params: { vcc: 9 },
    paramSchema: [{ key: 'vcc', label: 'Supply Voltage (Vcc)', type: 'number', unit: 'V', default: 9 }]
  },
  [ComponentTypes.ANALOG_MULTIPLIER]: {
    name: 'Analog Multiplier (AD633 / Vout = X*Y/10)',
    type: ComponentTypes.ANALOG_MULTIPLIER,
    category: ComponentCategory.ANALOG,
    prefix: 'U_MULT',
    width: 60, height: 60,
    pins: [
      { id: 'x_in', name: 'X', x: -30, y: -15, dir: 'left' },
      { id: 'y_in', name: 'Y', x: -30, y: 15, dir: 'left' },
      { id: 'out', name: 'W', x: 30, y: 0, dir: 'right' }
    ],
    params: { scale: 0.1 },
    paramSchema: [{ key: 'scale', label: 'Scale Factor (1/10)', type: 'number', default: 0.1 }]
  },

  // =================== 7. VOLTAGE REGULATORS ===================
  [ComponentTypes.LM7805]: {
    name: 'LM7805 +5V Linear Voltage Regulator',
    type: ComponentTypes.LM7805,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7805',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN', x: -30, y: 0, dir: 'left' },
      { id: 'gnd', name: 'GND', x: 0, y: 20, dir: 'bottom' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
    ],
    params: { vOut: 5.0, vDropMin: 2.0 },
    paramSchema: [{ key: 'vOut', label: 'Regulated Output Voltage', type: 'number', unit: 'V', default: 5.0 }]
  },
  [ComponentTypes.LM7812]: {
    name: 'LM7812 +12V Voltage Regulator',
    type: ComponentTypes.LM7812,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7812',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN', x: -30, y: 0, dir: 'left' },
      { id: 'gnd', name: 'GND', x: 0, y: 20, dir: 'bottom' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
    ],
    params: { vOut: 12.0 },
    paramSchema: [{ key: 'vOut', label: 'Output Voltage', type: 'number', unit: 'V', default: 12.0 }]
  },
  [ComponentTypes.LM7912]: {
    name: 'LM7912 -12V Negative Voltage Regulator',
    type: ComponentTypes.LM7912,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_7912',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN', x: -30, y: 0, dir: 'left' },
      { id: 'gnd', name: 'GND', x: 0, y: 20, dir: 'bottom' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
    ],
    params: { vOut: -12.0 },
    paramSchema: [{ key: 'vOut', label: 'Output Voltage', type: 'number', unit: 'V', default: -12.0 }]
  },
  [ComponentTypes.LM317]: {
    name: 'LM317 Adjustable Positive Regulator',
    type: ComponentTypes.LM317,
    category: ComponentCategory.REGULATORS,
    prefix: 'REG_317',
    width: 60, height: 40,
    pins: [
      { id: 'in', name: 'IN', x: -30, y: 0, dir: 'left' },
      { id: 'adj', name: 'ADJ', x: 0, y: 20, dir: 'bottom' },
      { id: 'out', name: 'OUT', x: 30, y: 0, dir: 'right' }
    ],
    params: { vRef: 1.25 },
    paramSchema: [{ key: 'vRef', label: 'Reference Voltage (Vref)', type: 'number', unit: 'V', default: 1.25 }]
  },

  // =================== 8. DIGITAL LOGIC GATES ===================
  [ComponentTypes.AND_GATE]: {
    name: '2-Input AND Gate',
    type: ComponentTypes.AND_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_AND',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.OR_GATE]: {
    name: '2-Input OR Gate',
    type: ComponentTypes.OR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_OR',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NOT_GATE]: {
    name: 'NOT Inverter Gate',
    type: ComponentTypes.NOT_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_NOT',
    width: 40, height: 30,
    pins: [
      { id: 'in', name: 'A', x: -20, y: 0, dir: 'left' },
      { id: 'out', name: 'Y', x: 20, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NAND_GATE]: {
    name: '2-Input NAND Gate',
    type: ComponentTypes.NAND_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_NAND',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.NOR_GATE]: {
    name: '2-Input NOR Gate',
    type: ComponentTypes.NOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_NOR',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.XOR_GATE]: {
    name: '2-Input XOR Gate',
    type: ComponentTypes.XOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_XOR',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.XNOR_GATE]: {
    name: '2-Input XNOR Gate',
    type: ComponentTypes.XNOR_GATE,
    category: ComponentCategory.LOGIC_GATES,
    prefix: 'U_XNOR',
    width: 50, height: 40,
    pins: [
      { id: 'in1', name: 'A', x: -25, y: -10, dir: 'left' },
      { id: 'in2', name: 'B', x: -25, y: 10, dir: 'left' },
      { id: 'out', name: 'Y', x: 25, y: 0, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Logic High (Vcc)', type: 'number', unit: 'V', default: 5 }]
  },

  // =================== 9. 74xx & SEQUENTIAL DIGITAL ICS ===================
  [ComponentTypes.D_FLIPFLOP]: {
    name: 'D Flip-Flop (74HC74)',
    type: ComponentTypes.D_FLIPFLOP,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_DFF',
    width: 50, height: 60,
    pins: [
      { id: 'd', name: 'D', x: -25, y: -15, dir: 'left' },
      { id: 'clk', name: 'CLK', x: -25, y: 15, dir: 'left' },
      { id: 'q', name: 'Q', x: 25, y: -15, dir: 'right' },
      { id: 'q_not', name: '~Q', x: 25, y: 15, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.JK_FLIPFLOP]: {
    name: 'JK Flip-Flop (74HC76)',
    type: ComponentTypes.JK_FLIPFLOP,
    category: ComponentCategory.FLIP_FLOPS,
    prefix: 'U_JKFF',
    width: 50, height: 60,
    pins: [
      { id: 'j', name: 'J', x: -25, y: -20, dir: 'left' },
      { id: 'clk', name: 'CLK', x: -25, y: 0, dir: 'left' },
      { id: 'k', name: 'K', x: -25, y: 20, dir: 'left' },
      { id: 'q', name: 'Q', x: 25, y: -15, dir: 'right' },
      { id: 'q_not', name: '~Q', x: 25, y: 15, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.BINARY_COUNTER_4BIT]: {
    name: '4-Bit Synchronous Binary Counter (74HC161)',
    type: ComponentTypes.BINARY_COUNTER_4BIT,
    category: ComponentCategory.DIGITAL_ICS,
    prefix: 'U_CNT',
    width: 60, height: 80,
    pins: [
      { id: 'clk', name: 'CLK', x: -30, y: -20, dir: 'left' },
      { id: 'clr', name: 'CLR', x: -30, y: 20, dir: 'left' },
      { id: 'q0', name: 'Q0', x: 30, y: -30, dir: 'right' },
      { id: 'q1', name: 'Q1', x: 30, y: -10, dir: 'right' },
      { id: 'q2', name: 'Q2', x: 30, y: 10, dir: 'right' },
      { id: 'q3', name: 'Q3', x: 30, y: 30, dir: 'right' }
    ],
    params: { vHigh: 5 },
    paramSchema: [{ key: 'vHigh', label: 'Output High Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.MUX_4TO1]: {
    name: '4:1 Digital Multiplexer (74HC153)',
    type: ComponentTypes.MUX_4TO1,
    category: ComponentCategory.DIGITAL_ICS,
    prefix: 'U_MUX',
    width: 60, height: 80,
    pins: [
      { id: 'i0', name: 'I0', x: -30, y: -30, dir: 'left' },
      { id: 'i1', name: 'I1', x: -30, y: -10, dir: 'left' },
      { id: 'i2', name: 'I2', x: -30, y: 10, dir: 'left' },
      { id: 'i3', name: 'I3', x: -30, y: 30, dir: 'left' },
      { id: 's0', name: 'S0', x: 0, y: 40, dir: 'bottom' },
      { id: 's1', name: 'S1', x: 15, y: 40, dir: 'bottom' },
      { id: 'out', name: 'Y', x: 30, y: 0, dir: 'right' }
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
    width: 50, height: 50,
    pins: [
      { id: 'a', name: 'A', x: -25, y: -12, dir: 'left' },
      { id: 'b', name: 'B', x: -25, y: 12, dir: 'left' },
      { id: 'sum', name: 'SUM', x: 25, y: -12, dir: 'right' },
      { id: 'carry', name: 'COUT', x: 25, y: 12, dir: 'right' }
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
      { id: 'a', name: 'A', x: -30, y: -20, dir: 'left' },
      { id: 'b', name: 'B', x: -30, y: 0, dir: 'left' },
      { id: 'cin', name: 'CIN', x: -30, y: 20, dir: 'left' },
      { id: 'sum', name: 'SUM', x: 30, y: -15, dir: 'right' },
      { id: 'cout', name: 'COUT', x: 30, y: 15, dir: 'right' }
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
    pins: [{ id: 'p1', name: '1', x: -20, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 20, y: 0, dir: 'right' }],
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
      { id: 'com', name: 'COM', x: -25, y: 0, dir: 'left' },
      { id: 'p1', name: 'NO', x: 25, y: -15, dir: 'right' },
      { id: 'p2', name: 'NC', x: 25, y: 15, dir: 'right' }
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
    pins: [{ id: 'p1', name: '1', x: -20, y: 0, dir: 'left' }, { id: 'p2', name: '2', x: 20, y: 0, dir: 'right' }],
    params: { closed: false },
    paramSchema: [{ key: 'closed', label: 'Pressed', type: 'boolean', default: false }]
  },
  [ComponentTypes.RELAY_SPDT]: {
    name: 'Electromechanical Relay (SPDT)',
    type: ComponentTypes.RELAY_SPDT,
    category: ComponentCategory.SWITCHES,
    prefix: 'RLY',
    width: 60, height: 60,
    pins: [
      { id: 'coil_p1', name: 'Coil +', x: -30, y: -15, dir: 'left' },
      { id: 'coil_p2', name: 'Coil -', x: -30, y: 15, dir: 'left' },
      { id: 'com', name: 'COM', x: 30, y: 0, dir: 'right' },
      { id: 'no', name: 'NO', x: 30, y: -20, dir: 'right' },
      { id: 'nc', name: 'NC', x: 30, y: 20, dir: 'right' }
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
      { id: 'anode', name: 'A', x: -30, y: -15, dir: 'left' },
      { id: 'cathode', name: 'K', x: -30, y: 15, dir: 'left' },
      { id: 'coll', name: 'C', x: 30, y: -15, dir: 'right' },
      { id: 'emit', name: 'E', x: 30, y: 15, dir: 'right' }
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
      { id: 'a', name: 'A', x: -30, y: -30, dir: 'left' },
      { id: 'b', name: 'B', x: -30, y: -15, dir: 'left' },
      { id: 'c', name: 'C', x: -30, y: 0, dir: 'left' },
      { id: 'd', name: 'D', x: -30, y: 15, dir: 'left' },
      { id: 'e', name: 'E', x: 30, y: -30, dir: 'right' },
      { id: 'f', name: 'F', x: 30, y: -15, dir: 'right' },
      { id: 'g', name: 'G', x: 30, y: 0, dir: 'right' },
      { id: 'dp', name: 'DP', x: 30, y: 15, dir: 'right' },
      { id: 'gnd', name: 'GND', x: 0, y: 40, dir: 'bottom' }
    ],
    params: { color: '#ff3b30' },
    paramSchema: [{ key: 'color', label: 'Display Color', type: 'select', options: ['#ff3b30', '#03b585', '#007aff', '#ff9500'], default: '#ff3b30' }]
  },

  // =================== 13. POWER SYMBOLS & NET LABELS ===================
  [ComponentTypes.POWER_VCC]: {
    name: 'Power Rail (+5V VCC)',
    type: ComponentTypes.POWER_VCC,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'VCC',
    width: 30, height: 30,
    pins: [{ id: 'p1', name: 'VCC', x: 0, y: 15, dir: 'bottom' }],
    params: { voltage: 5 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 5 }]
  },
  [ComponentTypes.POWER_12V]: {
    name: 'Power Rail (+12V)',
    type: ComponentTypes.POWER_12V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'P12V',
    width: 30, height: 30,
    pins: [{ id: 'p1', name: '+12V', x: 0, y: 15, dir: 'bottom' }],
    params: { voltage: 12 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 12 }]
  },
  [ComponentTypes.POWER_NEG12V]: {
    name: 'Power Rail (-12V)',
    type: ComponentTypes.POWER_NEG12V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'N12V',
    width: 30, height: 30,
    pins: [{ id: 'p1', name: '-12V', x: 0, y: -15, dir: 'top' }],
    params: { voltage: -12 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: -12 }]
  },
  [ComponentTypes.POWER_15V]: {
    name: 'Power Rail (+15V)',
    type: ComponentTypes.POWER_15V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'P15V',
    width: 30, height: 30,
    pins: [{ id: 'p1', name: '+15V', x: 0, y: 15, dir: 'bottom' }],
    params: { voltage: 15 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: 15 }]
  },
  [ComponentTypes.POWER_NEG15V]: {
    name: 'Power Rail (-15V)',
    type: ComponentTypes.POWER_NEG15V,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'N15V',
    width: 30, height: 30,
    pins: [{ id: 'p1', name: '-15V', x: 0, y: -15, dir: 'top' }],
    params: { voltage: -15 },
    paramSchema: [{ key: 'voltage', label: 'Rail Voltage', type: 'number', unit: 'V', default: -15 }]
  },
  [ComponentTypes.NET_LABEL]: {
    name: 'Net Label (Wireless Net Connection)',
    type: ComponentTypes.NET_LABEL,
    category: ComponentCategory.POWER_SYMBOLS,
    prefix: 'NET',
    width: 40, height: 20,
    pins: [{ id: 'p1', name: 'PIN', x: 0, y: 10, dir: 'bottom' }],
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
      { id: 'p1', name: 'N', x: 0, y: 0, dir: 'all' }
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
      { id: 'p1', name: 'J', x: 0, y: 0, dir: 'all' }
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
    pins: [{ id: 'tip', name: 'Tip', x: 0, y: 20, dir: 'bottom' }],
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
    pins: [{ id: 'tip', name: 'Tip', x: 0, y: 20, dir: 'bottom' }],
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
      { id: 'p_pos', name: '+', x: -25, y: 0, dir: 'left' },
      { id: 'p_neg', name: '-', x: 25, y: 0, dir: 'right' }
    ],
    params: {}, paramSchema: []
  }
};
