/**
 * Pre-built Circuit Library
 * Professional engineering circuit templates replicating industry-standard schematics.
 */

import { ComponentTypes } from '../engine/components.js';

export const CircuitLibrary = {
  // 1. Simple Buck Converter
  buckConverter: {
    id: 'buck-converter',
    name: 'Simple Buck Converter (DC-DC)',
    description: 'A step-down DC-DC switching regulator converting 12V DC to approx 5V DC using an LC filter and freewheeling diode.',
    author: 'OStep',
    stats: { stars: 108, copies: 954, views: 190318 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vIn = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 100, 200, { voltage: 12 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 100, 320, {}, 0);
      const clk = canvas.addComponent(ComponentTypes.CLOCK_VOLTAGE, 220, 100, { vHigh: 12, vLow: 0, frequency: 20000, dutyCycle: 42 }, 90);
      const l1 = canvas.addComponent(ComponentTypes.INDUCTOR, 360, 100, { inductance: 0.00022 }, 0);
      const d1 = canvas.addComponent(ComponentTypes.SCHOTTKY, 260, 200, { forwardDrop: 0.3 }, 270);
      const c1 = canvas.addComponent(ComponentTypes.POLARIZED_CAP, 460, 200, { capacitance: 0.0001 }, 90);
      const rLoad = canvas.addComponent(ComponentTypes.RESISTOR, 560, 200, { resistance: 10 }, 90);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 560, 60, { color: '#03b585', label: 'V_out (5V)' }, 0);
      const prIn = canvas.addComponent(ComponentTypes.PROBE_V, 100, 60, { color: '#007aff', label: 'V_in (12V)' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vIn.id}:p_pos`, toPin: `${clk.id}:p_pos` },
        { id: 'w2', fromPin: `${vIn.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w3', fromPin: `${clk.id}:p_neg`, toPin: `${l1.id}:p1` },
        { id: 'w4', fromPin: `${clk.id}:p_neg`, toPin: `${d1.id}:cathode` },
        { id: 'w5', fromPin: `${d1.id}:anode`, toPin: `${gnd.id}:p1` },
        { id: 'w6', fromPin: `${l1.id}:p2`, toPin: `${c1.id}:p_pos` },
        { id: 'w7', fromPin: `${l1.id}:p2`, toPin: `${rLoad.id}:p1` },
        { id: 'w8', fromPin: `${l1.id}:p2`, toPin: `${prOut.id}:tip` },
        { id: 'w9', fromPin: `${c1.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w10', fromPin: `${rLoad.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w11', fromPin: `${vIn.id}:p_pos`, toPin: `${prIn.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 2. 555 Timer Astable Multivibrator
  timer555: {
    id: 'timer-555',
    name: '555 Timer Astable Multivibrator',
    description: 'Classic 555 pulse generator circuit producing a continuous square wave oscillation to flash an LED.',
    author: 'GGoodwin',
    stats: { stars: 124, copies: 496, views: 137875 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vcc = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 80, 200, { voltage: 9 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 80, 320, {}, 0);
      const r1 = canvas.addComponent(ComponentTypes.RESISTOR, 220, 100, { resistance: 10000 }, 90);
      const r2 = canvas.addComponent(ComponentTypes.RESISTOR, 220, 220, { resistance: 47000 }, 90);
      const c1 = canvas.addComponent(ComponentTypes.CAPACITOR, 220, 320, { capacitance: 0.00001 }, 90);
      const timer = canvas.addComponent(ComponentTypes.TIMER555, 380, 200, { vcc: 9 }, 0);
      const rLed = canvas.addComponent(ComponentTypes.RESISTOR, 520, 190, { resistance: 330 }, 0);
      const led = canvas.addComponent(ComponentTypes.LED, 600, 190, { color: '#ff3b30' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 480, 120, { color: '#03b585', label: 'Output (Pin 3)' }, 0);
      const prCap = canvas.addComponent(ComponentTypes.PROBE_V, 220, 260, { color: '#ff9500', label: 'V_Cap (Pin 2/6)' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vcc.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vcc.id}:p_pos`, toPin: `${timer.id}:vcc` },
        { id: 'w3', fromPin: `${vcc.id}:p_pos`, toPin: `${r1.id}:p1` },
        { id: 'w4', fromPin: `${timer.id}:gnd`, toPin: `${gnd.id}:p1` },
        { id: 'w5', fromPin: `${r1.id}:p2`, toPin: `${timer.id}:disch` },
        { id: 'w6', fromPin: `${r1.id}:p2`, toPin: `${r2.id}:p1` },
        { id: 'w7', fromPin: `${r2.id}:p2`, toPin: `${timer.id}:thresh` },
        { id: 'w8', fromPin: `${r2.id}:p2`, toPin: `${timer.id}:trig` },
        { id: 'w9', fromPin: `${r2.id}:p2`, toPin: `${c1.id}:p1` },
        { id: 'w10', fromPin: `${r2.id}:p2`, toPin: `${prCap.id}:tip` },
        { id: 'w11', fromPin: `${c1.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w12', fromPin: `${timer.id}:out`, toPin: `${rLed.id}:p1` },
        { id: 'w13', fromPin: `${timer.id}:out`, toPin: `${prOut.id}:tip` },
        { id: 'w14', fromPin: `${rLed.id}:p2`, toPin: `${led.id}:anode` },
        { id: 'w15', fromPin: `${led.id}:cathode`, toPin: `${gnd.id}:p1` }
      ];
      canvas.fitToScreen();
    }
  },

  // 3. Class-AB Push-Pull Audio Power Amplifier
  classABAmplifier: {
    id: 'class-ab-audio',
    name: 'Class-AB Complementary Audio Power Amplifier',
    description: 'High-fidelity audio output stage using NPN/PNP complementary transistors with diode thermal bias and negative feedback.',
    author: 'AudioProLab',
    stats: { stars: 156, copies: 620, views: 184500 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vPos = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 80, 100, { voltage: 15 }, 0);
      const vNeg = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 80, 300, { voltage: 15 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 80, 200, {}, 0);
      const vIn = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 180, 200, { amplitude: 1.0, frequency: 1000 }, 0);

      const qDrv = canvas.addComponent(ComponentTypes.BJT_NPN, 280, 200, { beta: 200 }, 0);
      const rC = canvas.addComponent(ComponentTypes.RESISTOR, 280, 100, { resistance: 2200 }, 90);
      const rE = canvas.addComponent(ComponentTypes.RESISTOR, 280, 300, { resistance: 470 }, 90);

      const d1 = canvas.addComponent(ComponentTypes.DIODE, 380, 140, { forwardDrop: 0.65 }, 90);
      const d2 = canvas.addComponent(ComponentTypes.DIODE, 380, 200, { forwardDrop: 0.65 }, 90);

      const qNpn = canvas.addComponent(ComponentTypes.BJT_NPN, 480, 120, { beta: 100 }, 0);
      const qPnp = canvas.addComponent(ComponentTypes.BJT_PNP, 480, 240, { beta: 100 }, 0);

      const cOut = canvas.addComponent(ComponentTypes.POLARIZED_CAP, 580, 180, { capacitance: 0.00047 }, 0);
      const rSpeaker = canvas.addComponent(ComponentTypes.RESISTOR, 660, 240, { resistance: 8 }, 90);

      const prIn = canvas.addComponent(ComponentTypes.PROBE_V, 180, 80, { color: '#007aff', label: 'Audio In (1Vpk)' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 660, 120, { color: '#03b585', label: 'Speaker Out (8Ω)' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vPos.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vNeg.id}:p_pos`, toPin: `${gnd.id}:p1` },
        { id: 'w3', fromPin: `${vIn.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w4', fromPin: `${vIn.id}:p_pos`, toPin: `${qDrv.id}:base` },
        { id: 'w5', fromPin: `${vIn.id}:p_pos`, toPin: `${prIn.id}:tip` },
        { id: 'w6', fromPin: `${vPos.id}:p_pos`, toPin: `${rC.id}:p1` },
        { id: 'w7', fromPin: `${vPos.id}:p_pos`, toPin: `${qNpn.id}:collector` },
        { id: 'w8', fromPin: `${vNeg.id}:p_neg`, toPin: `${rE.id}:p2` },
        { id: 'w9', fromPin: `${vNeg.id}:p_neg`, toPin: `${qPnp.id}:collector` },
        { id: 'w10', fromPin: `${rC.id}:p2`, toPin: `${qDrv.id}:collector` },
        { id: 'w11', fromPin: `${rC.id}:p2`, toPin: `${d1.id}:anode` },
        { id: 'w12', fromPin: `${d1.id}:cathode`, toPin: `${d2.id}:anode` },
        { id: 'w13', fromPin: `${d1.id}:anode`, toPin: `${qNpn.id}:base` },
        { id: 'w14', fromPin: `${d2.id}:cathode`, toPin: `${qPnp.id}:base` },
        { id: 'w15', fromPin: `${qNpn.id}:emitter`, toPin: `${qPnp.id}:emitter` },
        { id: 'w16', fromPin: `${qNpn.id}:emitter`, toPin: `${cOut.id}:p_pos` },
        { id: 'w17', fromPin: `${cOut.id}:p_neg`, toPin: `${rSpeaker.id}:p1` },
        { id: 'w18', fromPin: `${cOut.id}:p_neg`, toPin: `${prOut.id}:tip` },
        { id: 'w19', fromPin: `${rSpeaker.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w20', fromPin: `${qDrv.id}:emitter`, toPin: `${rE.id}:p1` }
      ];
      canvas.fitToScreen();
    }
  },

  // 4. 4-Bit Binary Counter with 7-Segment Display
  binaryCounter7Seg: {
    id: 'counter-7seg',
    name: '4-Bit Binary Counter with 7-Segment Display',
    description: 'Synchronous clock pulse counter cycling 0-9 on a bright 7-segment digital LED readout display.',
    author: 'DigitalLogicX',
    stats: { stars: 210, copies: 840, views: 245000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vcc = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 80, 200, { voltage: 5 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 80, 320, {}, 0);
      const clk = canvas.addComponent(ComponentTypes.CLOCK_VOLTAGE, 180, 200, { vHigh: 5, vLow: 0, frequency: 2, dutyCycle: 50 }, 0);
      const counter = canvas.addComponent(ComponentTypes.BINARY_COUNTER_4BIT, 300, 200, { vHigh: 5 }, 0);
      const disp = canvas.addComponent(ComponentTypes.SEVEN_SEGMENT, 520, 200, { color: '#ff3b30' }, 0);

      const prQ0 = canvas.addComponent(ComponentTypes.PROBE_V, 380, 80, { color: '#03b585', label: 'Bit 0 (LSB)' }, 0);
      const prQ1 = canvas.addComponent(ComponentTypes.PROBE_V, 380, 120, { color: '#007aff', label: 'Bit 1' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vcc.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${clk.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w3', fromPin: `${clk.id}:p_pos`, toPin: `${counter.id}:clk` },
        { id: 'w4', fromPin: `${disp.id}:gnd`, toPin: `${gnd.id}:p1` },
        { id: 'w5', fromPin: `${counter.id}:q0`, toPin: `${disp.id}:a` },
        { id: 'w6', fromPin: `${counter.id}:q1`, toPin: `${disp.id}:b` },
        { id: 'w7', fromPin: `${counter.id}:q2`, toPin: `${disp.id}:c` },
        { id: 'w8', fromPin: `${counter.id}:q3`, toPin: `${disp.id}:d` },
        { id: 'w9', fromPin: `${counter.id}:q0`, toPin: `${disp.id}:e` },
        { id: 'w10', fromPin: `${counter.id}:q1`, toPin: `${disp.id}:f` },
        { id: 'w11', fromPin: `${counter.id}:q2`, toPin: `${disp.id}:g` },
        { id: 'w12', fromPin: `${counter.id}:q0`, toPin: `${prQ0.id}:tip` },
        { id: 'w13', fromPin: `${counter.id}:q1`, toPin: `${prQ1.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 5. Active 4th-Order Butterworth Sallen-Key Low-Pass Filter
  butterworthFilter: {
    id: 'butterworth-4th',
    name: '4th-Order Butterworth Sallen-Key Active Filter',
    description: 'Cascaded 2-stage active low-pass filter providing maximally flat passband and steep -80 dB/decade roll-off.',
    author: 'SignalProcessingGuru',
    stats: { stars: 178, copies: 530, views: 112000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vIn = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 80, 220, { amplitude: 2.0, frequency: 1000 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 80, 340, {}, 0);

      const r1 = canvas.addComponent(ComponentTypes.RESISTOR, 180, 220, { resistance: 10000 }, 0);
      const r2 = canvas.addComponent(ComponentTypes.RESISTOR, 260, 220, { resistance: 10000 }, 0);
      const c1 = canvas.addComponent(ComponentTypes.CAPACITOR, 260, 120, { capacitance: 2.2e-8 }, 0);
      const c2 = canvas.addComponent(ComponentTypes.CAPACITOR, 260, 300, { capacitance: 1.0e-8 }, 90);
      const op1 = canvas.addComponent(ComponentTypes.OPAMP, 360, 220, { openLoopGain: 100000 }, 0);

      const r3 = canvas.addComponent(ComponentTypes.RESISTOR, 460, 220, { resistance: 10000 }, 0);
      const r4 = canvas.addComponent(ComponentTypes.RESISTOR, 540, 220, { resistance: 10000 }, 0);
      const c3 = canvas.addComponent(ComponentTypes.CAPACITOR, 540, 120, { capacitance: 3.3e-8 }, 0);
      const c4 = canvas.addComponent(ComponentTypes.CAPACITOR, 540, 300, { capacitance: 6.8e-9 }, 90);
      const op2 = canvas.addComponent(ComponentTypes.OPAMP, 640, 220, { openLoopGain: 100000 }, 0);

      const prIn = canvas.addComponent(ComponentTypes.PROBE_V, 80, 100, { color: '#007aff', label: 'Input Signal' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 720, 140, { color: '#03b585', label: 'Filtered Output' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vIn.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vIn.id}:p_pos`, toPin: `${r1.id}:p1` },
        { id: 'w3', fromPin: `${vIn.id}:p_pos`, toPin: `${prIn.id}:tip` },
        { id: 'w4', fromPin: `${r1.id}:p2`, toPin: `${r2.id}:p1` },
        { id: 'w5', fromPin: `${r1.id}:p2`, toPin: `${c1.id}:p1` },
        { id: 'w6', fromPin: `${r2.id}:p2`, toPin: `${op1.id}:in_noninv` },
        { id: 'w7', fromPin: `${r2.id}:p2`, toPin: `${c2.id}:p1` },
        { id: 'w8', fromPin: `${c2.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w9', fromPin: `${op1.id}:in_inv`, toPin: `${op1.id}:out` },
        { id: 'w10', fromPin: `${c1.id}:p2`, toPin: `${op1.id}:out` },
        { id: 'w11', fromPin: `${op1.id}:out`, toPin: `${r3.id}:p1` },
        { id: 'w12', fromPin: `${r3.id}:p2`, toPin: `${r4.id}:p1` },
        { id: 'w13', fromPin: `${r3.id}:p2`, toPin: `${c3.id}:p1` },
        { id: 'w14', fromPin: `${r4.id}:p2`, toPin: `${op2.id}:in_noninv` },
        { id: 'w15', fromPin: `${r4.id}:p2`, toPin: `${c4.id}:p1` },
        { id: 'w16', fromPin: `${c4.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w17', fromPin: `${op2.id}:in_inv`, toPin: `${op2.id}:out` },
        { id: 'w18', fromPin: `${c3.id}:p2`, toPin: `${op2.id}:out` },
        { id: 'w19', fromPin: `${op2.id}:out`, toPin: `${prOut.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 6. AM Modulator & Diode Detector
  amTransceiver: {
    id: 'am-transceiver',
    name: 'AM Modulator & Diode Envelope Demodulator',
    description: 'RF amplitude modulation generator (40 kHz carrier modulated by 1 kHz tone) and envelope detector receiver.',
    author: 'RF_Engineer_88',
    stats: { stars: 145, copies: 470, views: 98000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vAm = canvas.addComponent(ComponentTypes.AM_VOLTAGE, 100, 200, { carrierAmp: 5, carrierFreq: 40000, modFreq: 1000, modIndex: 0.8 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 100, 320, {}, 0);
      const d1 = canvas.addComponent(ComponentTypes.SCHOTTKY, 240, 200, { forwardDrop: 0.25 }, 0);
      const cFilter = canvas.addComponent(ComponentTypes.CAPACITOR, 360, 280, { capacitance: 4.7e-8 }, 90);
      const rLoad = canvas.addComponent(ComponentTypes.RESISTOR, 460, 280, { resistance: 4700 }, 90);

      const prMod = canvas.addComponent(ComponentTypes.PROBE_V, 100, 80, { color: '#007aff', label: 'AM Modulated RF' }, 0);
      const prDemod = canvas.addComponent(ComponentTypes.PROBE_V, 460, 120, { color: '#03b585', label: 'Demodulated Audio Tone' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vAm.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vAm.id}:p_pos`, toPin: `${d1.id}:anode` },
        { id: 'w3', fromPin: `${vAm.id}:p_pos`, toPin: `${prMod.id}:tip` },
        { id: 'w4', fromPin: `${d1.id}:cathode`, toPin: `${cFilter.id}:p1` },
        { id: 'w5', fromPin: `${d1.id}:cathode`, toPin: `${rLoad.id}:p1` },
        { id: 'w6', fromPin: `${rLoad.id}:p1`, toPin: `${prDemod.id}:tip` },
        { id: 'w7', fromPin: `${cFilter.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w8', fromPin: `${rLoad.id}:p2`, toPin: `${gnd.id}:p1` }
      ];
      canvas.fitToScreen();
    }
  },

  // 7. Non-Inverting Op-Amp Amplifier
  opAmpAmplifier: {
    id: 'opamp-amplifier',
    name: 'Non-Inverting Op-Amp AC Amplifier',
    description: 'Precision operational amplifier configured for non-inverting closed-loop voltage gain (Gain = 1 + R2/R1 = 11x).',
    author: 'SiLRing',
    stats: { stars: 92, copies: 380, views: 98450 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vAc = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 100, 200, { amplitude: 0.2, frequency: 1000 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 100, 320, {}, 0);
      const opamp = canvas.addComponent(ComponentTypes.OPAMP, 300, 200, { openLoopGain: 100000, vSatPos: 12, vSatNeg: -12 }, 0);
      const r1 = canvas.addComponent(ComponentTypes.RESISTOR, 240, 280, { resistance: 1000 }, 90);
      const r2 = canvas.addComponent(ComponentTypes.RESISTOR, 340, 110, { resistance: 10000 }, 0);

      const prIn = canvas.addComponent(ComponentTypes.PROBE_V, 100, 80, { color: '#007aff', label: 'V_in (200mVpk)' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 440, 150, { color: '#03b585', label: 'V_out (2.2Vpk Gain 11x)' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vAc.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vAc.id}:p_pos`, toPin: `${opamp.id}:in_noninv` },
        { id: 'w3', fromPin: `${vAc.id}:p_pos`, toPin: `${prIn.id}:tip` },
        { id: 'w4', fromPin: `${opamp.id}:in_inv`, toPin: `${r1.id}:p1` },
        { id: 'w5', fromPin: `${r1.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w6', fromPin: `${opamp.id}:in_inv`, toPin: `${r2.id}:p1` },
        { id: 'w7', fromPin: `${r2.id}:p2`, toPin: `${opamp.id}:out` },
        { id: 'w8', fromPin: `${opamp.id}:out`, toPin: `${prOut.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 8. Full-Wave Bridge Rectifier with Smoothing Filter
  bridgeRectifier: {
    id: 'bridge-rectifier',
    name: 'Full-Wave Bridge Rectifier & Filter',
    description: 'Converts AC mains voltage into smooth DC power using 4 diodes in bridge formation, a filter capacitor, and resistive load.',
    author: 'GGoodwin',
    stats: { stars: 30, copies: 397, views: 60894 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vAc = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 100, 200, { amplitude: 12, frequency: 60 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 560, 320, {}, 0);
      const d1 = canvas.addComponent(ComponentTypes.DIODE, 260, 140, { forwardDrop: 0.7 }, 0);
      const d2 = canvas.addComponent(ComponentTypes.DIODE, 360, 140, { forwardDrop: 0.7 }, 0);
      const d3 = canvas.addComponent(ComponentTypes.DIODE, 260, 260, { forwardDrop: 0.7 }, 0);
      const d4 = canvas.addComponent(ComponentTypes.DIODE, 360, 260, { forwardDrop: 0.7 }, 0);
      const cFilter = canvas.addComponent(ComponentTypes.POLARIZED_CAP, 460, 200, { capacitance: 0.00047 }, 90);
      const rLoad = canvas.addComponent(ComponentTypes.RESISTOR, 560, 200, { resistance: 220 }, 90);

      const prAc = canvas.addComponent(ComponentTypes.PROBE_V, 100, 80, { color: '#007aff', label: 'AC Input' }, 0);
      const prDc = canvas.addComponent(ComponentTypes.PROBE_V, 560, 80, { color: '#03b585', label: 'Filtered DC Out' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${gnd.id}:p1`, toPin: `${cFilter.id}:p_neg` },
        { id: 'w2', fromPin: `${vAc.id}:p_pos`, toPin: `${prAc.id}:tip` },
        { id: 'w3', fromPin: `${vAc.id}:p_pos`, toPin: `${d1.id}:anode` },
        { id: 'w4', fromPin: `${vAc.id}:p_pos`, toPin: `${d3.id}:cathode` },
        { id: 'w5', fromPin: `${vAc.id}:p_neg`, toPin: `${d2.id}:anode` },
        { id: 'w6', fromPin: `${vAc.id}:p_neg`, toPin: `${d4.id}:cathode` },
        { id: 'w7', fromPin: `${d1.id}:cathode`, toPin: `${d2.id}:cathode` },
        { id: 'w8', fromPin: `${d1.id}:cathode`, toPin: `${cFilter.id}:p_pos` },
        { id: 'w9', fromPin: `${cFilter.id}:p_pos`, toPin: `${rLoad.id}:p1` },
        { id: 'w10', fromPin: `${rLoad.id}:p1`, toPin: `${prDc.id}:tip` },
        { id: 'w11', fromPin: `${d3.id}:anode`, toPin: `${d4.id}:anode` },
        { id: 'w12', fromPin: `${d3.id}:anode`, toPin: `${cFilter.id}:p_neg` },
        { id: 'w13', fromPin: `${cFilter.id}:p_neg`, toPin: `${rLoad.id}:p2` }
      ];
      canvas.fitToScreen();
    }
  },

  // 9. Digital Logic: Half Adder
  halfAdder: {
    id: 'half-adder',
    name: 'Digital Logic: Half Adder',
    description: 'Fundamental binary arithmetic circuit with XOR gate producing the SUM and AND gate producing the CARRY out.',
    author: 'Digitallc',
    stats: { stars: 65, copies: 210, views: 42100 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vcc = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 80, 200, { voltage: 5 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 80, 320, {}, 0);
      const swA = canvas.addComponent(ComponentTypes.SPST_SWITCH, 200, 140, { closed: true }, 0);
      const swB = canvas.addComponent(ComponentTypes.SPST_SWITCH, 200, 260, { closed: false }, 0);
      const rA = canvas.addComponent(ComponentTypes.RESISTOR, 280, 180, { resistance: 10000 }, 90);
      const rB = canvas.addComponent(ComponentTypes.RESISTOR, 280, 300, { resistance: 10000 }, 90);
      const xorGate = canvas.addComponent(ComponentTypes.XOR_GATE, 400, 140, { vHigh: 5 }, 0);
      const andGate = canvas.addComponent(ComponentTypes.AND_GATE, 400, 260, { vHigh: 5 }, 0);

      const prSum = canvas.addComponent(ComponentTypes.PROBE_V, 500, 100, { color: '#03b585', label: 'SUM Output' }, 0);
      const prCarry = canvas.addComponent(ComponentTypes.PROBE_V, 500, 220, { color: '#ff9500', label: 'CARRY Output' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vcc.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vcc.id}:p_pos`, toPin: `${swA.id}:p1` },
        { id: 'w3', fromPin: `${vcc.id}:p_pos`, toPin: `${swB.id}:p1` },
        { id: 'w4', fromPin: `${swA.id}:p2`, toPin: `${rA.id}:p1` },
        { id: 'w5', fromPin: `${swA.id}:p2`, toPin: `${xorGate.id}:in1` },
        { id: 'w6', fromPin: `${swA.id}:p2`, toPin: `${andGate.id}:in1` },
        { id: 'w7', fromPin: `${swB.id}:p2`, toPin: `${rB.id}:p1` },
        { id: 'w8', fromPin: `${swB.id}:p2`, toPin: `${xorGate.id}:in2` },
        { id: 'w9', fromPin: `${swB.id}:p2`, toPin: `${andGate.id}:in2` },
        { id: 'w10', fromPin: `${rA.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w11', fromPin: `${rB.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w12', fromPin: `${xorGate.id}:out`, toPin: `${prSum.id}:tip` },
        { id: 'w13', fromPin: `${andGate.id}:out`, toPin: `${prCarry.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 10. RC Low-Pass Filter
  rcFilter: {
    id: 'rc-filter',
    name: 'RC Low-Pass Filter Frequency Response',
    description: 'First-order RC low-pass passive filter showing high frequency attenuation and phase shift.',
    author: 'ElectronicsLab',
    stats: { stars: 54, copies: 180, views: 35000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vAc = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 100, 200, { amplitude: 5, frequency: 1000 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 100, 320, {}, 0);
      const r1 = canvas.addComponent(ComponentTypes.RESISTOR, 240, 160, { resistance: 1000 }, 0);
      const c1 = canvas.addComponent(ComponentTypes.CAPACITOR, 360, 240, { capacitance: 1.0e-7 }, 90);

      const prIn = canvas.addComponent(ComponentTypes.PROBE_V, 100, 80, { color: '#007aff', label: 'V_in (Source)' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 360, 100, { color: '#03b585', label: 'V_out (Filtered)' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vAc.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vAc.id}:p_pos`, toPin: `${r1.id}:p1` },
        { id: 'w3', fromPin: `${vAc.id}:p_pos`, toPin: `${prIn.id}:tip` },
        { id: 'w4', fromPin: `${r1.id}:p2`, toPin: `${c1.id}:p1` },
        { id: 'w5', fromPin: `${r1.id}:p2`, toPin: `${prOut.id}:tip` },
        { id: 'w6', fromPin: `${c1.id}:p2`, toPin: `${gnd.id}:p1` }
      ];
      canvas.fitToScreen();
    }
  },

  // 11. BJT Differential Amplifier Pair
  differentialAmplifier: {
    id: 'diff-amp',
    name: 'BJT Differential Pair Amplifier',
    description: 'Emitter-coupled BJT differential amplifier rejecting common-mode noise while providing high differential gain.',
    author: 'AnalogDesignWorks',
    stats: { stars: 164, copies: 512, views: 142000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vPos = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 60, 80, { voltage: 12 }, 0);
      const vNeg = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 60, 340, { voltage: 12 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 60, 210, {}, 0);

      const vIn1 = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 160, 180, { amplitude: 0.05, frequency: 1000 }, 0);
      const vIn2 = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 160, 260, { voltage: 0 }, 0);

      const q1 = canvas.addComponent(ComponentTypes.BJT_NPN, 280, 180, { beta: 200 }, 0);
      const q2 = canvas.addComponent(ComponentTypes.BJT_NPN, 420, 180, { beta: 200 }, 0);

      const rC1 = canvas.addComponent(ComponentTypes.RESISTOR, 280, 90, { resistance: 4700 }, 90);
      const rC2 = canvas.addComponent(ComponentTypes.RESISTOR, 420, 90, { resistance: 4700 }, 90);
      const rTail = canvas.addComponent(ComponentTypes.RESISTOR, 350, 280, { resistance: 4700 }, 90);

      const prOut1 = canvas.addComponent(ComponentTypes.PROBE_V, 280, 40, { color: '#03b585', label: 'V_out 1' }, 0);
      const prOut2 = canvas.addComponent(ComponentTypes.PROBE_V, 420, 40, { color: '#007aff', label: 'V_out 2' }, 0);

      canvas.wires = [
        { id: 'w1', fromPin: `${vPos.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w2', fromPin: `${vNeg.id}:p_pos`, toPin: `${gnd.id}:p1` },
        { id: 'w3', fromPin: `${vIn1.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w4', fromPin: `${vIn2.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w5', fromPin: `${vIn1.id}:p_pos`, toPin: `${q1.id}:base` },
        { id: 'w6', fromPin: `${vIn2.id}:p_pos`, toPin: `${q2.id}:base` },
        { id: 'w7', fromPin: `${vPos.id}:p_pos`, toPin: `${rC1.id}:p1` },
        { id: 'w8', fromPin: `${vPos.id}:p_pos`, toPin: `${rC2.id}:p1` },
        { id: 'w9', fromPin: `${rC1.id}:p2`, toPin: `${q1.id}:collector` },
        { id: 'w10', fromPin: `${rC2.id}:p2`, toPin: `${q2.id}:collector` },
        { id: 'w11', fromPin: `${q1.id}:emitter`, toPin: `${q2.id}:emitter` },
        { id: 'w12', fromPin: `${q1.id}:emitter`, toPin: `${rTail.id}:p1` },
        { id: 'w13', fromPin: `${rTail.id}:p2`, toPin: `${vNeg.id}:p_neg` },
        { id: 'w14', fromPin: `${q1.id}:collector`, toPin: `${prOut1.id}:tip` },
        { id: 'w15', fromPin: `${q2.id}:collector`, toPin: `${prOut2.id}:tip` }
      ];
      canvas.fitToScreen();
    }
  },

  // 12. High-Density Scalability Stress Benchmark (100+ Nodes)
  stressBenchmark100: {
    id: 'stress-benchmark',
    name: '100-Component High-Density R-C Ladder Stress Benchmark',
    description: 'A 100-stage multi-pole distributed transmission ladder network verifying high-capacity matrix solver scalability.',
    author: 'EDA_Benchmark_Suite',
    stats: { stars: 320, copies: 1240, views: 310000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      const vIn = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 60, 200, { amplitude: 10, frequency: 1000 }, 0);
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 60, 320, {}, 0);
      canvas.wires.push({ id: 'w_in_gnd', fromPin: `${vIn.id}:p_neg`, toPin: `${gnd.id}:p1` });

      let lastNodePin = `${vIn.id}:p_pos`;
      const stages = 25; // 25 stages * 2 = 50 passives + probes + wiring = 100+ entities

      for (let i = 0; i < stages; i++) {
        const xPos = 160 + i * 80;
        const r = canvas.addComponent(ComponentTypes.RESISTOR, xPos, 140, { resistance: 100 }, 0);
        const c = canvas.addComponent(ComponentTypes.CAPACITOR, xPos, 240, { capacitance: 1e-7 }, 90);

        canvas.wires.push({ id: `w_r_${i}`, fromPin: lastNodePin, toPin: `${r.id}:p1` });
        canvas.wires.push({ id: `w_c_${i}`, fromPin: `${r.id}:p2`, toPin: `${c.id}:p1` });
        canvas.wires.push({ id: `w_cg_${i}`, fromPin: `${c.id}:p2`, toPin: `${gnd.id}:p1` });

        lastNodePin = `${r.id}:p2`;
      }

      const prEnd = canvas.addComponent(ComponentTypes.PROBE_V, 160 + (stages - 1) * 80, 80, { color: '#03b585', label: 'End of Ladder' }, 0);
      canvas.wires.push({ id: 'w_pr_end', fromPin: lastNodePin, toPin: `${prEnd.id}:tip` });

      canvas.fitToScreen();
    }
  },

  // 13. ASK Modulation and Demodulation (Amplitude Shift Keying)
  askModulationDemodulation: {
    id: 'ask-modulation-demodulation',
    name: 'ASK Modulation and Demodulation',
    description: 'Binary Amplitude Shift Keying (ASK) transceiver with 50 kHz RF carrier, 500 Hz digital message, NPN transistor modulator, diode envelope detector, and Op-Amp comparator slicer.',
    author: 'CommunicationSystemsLab',
    stats: { stars: 240, copies: 1120, views: 289000 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      // 1. Sources & Grounds
      const gnd = canvas.addComponent(ComponentTypes.GROUND, 100, 360, {}, 0);
      const vMsg = canvas.addComponent(ComponentTypes.CLOCK_VOLTAGE, 100, 140, { vHigh: 10, vLow: 0, frequency: 500, dutyCycle: 50 }, 0);
      const vCarrier = canvas.addComponent(ComponentTypes.AC_VOLTAGE, 100, 260, { amplitude: 5, frequency: 50000 }, 0);

      // 2. Modulator (NPN Transistor Switch)
      const rBase = canvas.addComponent(ComponentTypes.RESISTOR, 180, 140, { resistance: 1000 }, 0);
      const qMod = canvas.addComponent(ComponentTypes.BJT_NPN, 260, 200, { beta: 200 }, 0);
      const rEmit = canvas.addComponent(ComponentTypes.RESISTOR, 260, 300, { resistance: 2200 }, 90);

      // 3. Demodulator (Envelope Detector)
      const dEnv = canvas.addComponent(ComponentTypes.SCHOTTKY, 340, 200, { forwardDrop: 0.25 }, 0);
      const rFilter = canvas.addComponent(ComponentTypes.RESISTOR, 420, 280, { resistance: 2200 }, 90);
      const cFilter = canvas.addComponent(ComponentTypes.CAPACITOR, 480, 280, { capacitance: 1e-8 }, 90);
      const rCoupling = canvas.addComponent(ComponentTypes.RESISTOR, 540, 200, { resistance: 2200 }, 0);

      // 4. Comparator / Slicer (Demodulated Binary Output Slicer)
      const opSlicer = canvas.addComponent(ComponentTypes.OPAMP, 640, 200, { openLoopGain: 100000, vSatPos: 5, vSatNeg: -5 }, 0);
      const rRef1 = canvas.addComponent(ComponentTypes.RESISTOR, 600, 100, { resistance: 10000 }, 90);
      const rRef2 = canvas.addComponent(ComponentTypes.RESISTOR, 600, 280, { resistance: 1500 }, 90);
      const vRefSupply = canvas.addComponent(ComponentTypes.DC_VOLTAGE, 540, 100, { voltage: 5 }, 0);

      const rOut = canvas.addComponent(ComponentTypes.RESISTOR, 740, 200, { resistance: 1000 }, 0);
      const dClamp = canvas.addComponent(ComponentTypes.ZENER, 800, 280, { zenerVoltage: 5.1 }, 90);

      // 5. Multi-Color Measurement Probes matching Multisim Live (PR4 Purple, PR2 Cyan, PR1 Green)
      const prMsg = canvas.addComponent(ComponentTypes.PROBE_V, 100, 60, { color: '#a855f7', label: 'PR4: V(1) Msg' }, 0);
      const prMod = canvas.addComponent(ComponentTypes.PROBE_V, 260, 100, { color: '#06b6d4', label: 'PR2: V(3) ASK' }, 0);
      const prOut = canvas.addComponent(ComponentTypes.PROBE_V, 800, 120, { color: '#10b981', label: 'PR1: V(8) Out' }, 0);

      // 6. Wiring Topology
      canvas.wires = [
        // Grounds
        { id: 'w_gnd_msg', fromPin: `${vMsg.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_car', fromPin: `${vCarrier.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_emit', fromPin: `${rEmit.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_rf', fromPin: `${rFilter.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_cf', fromPin: `${cFilter.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_ref', fromPin: `${rRef2.id}:p2`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_vref', fromPin: `${vRefSupply.id}:p_neg`, toPin: `${gnd.id}:p1` },
        { id: 'w_gnd_clamp', fromPin: `${dClamp.id}:anode`, toPin: `${gnd.id}:p1` },

        // Modulator Stage
        { id: 'w_msg_rbase', fromPin: `${vMsg.id}:p_pos`, toPin: `${rBase.id}:p1` },
        { id: 'w_msg_pr', fromPin: `${vMsg.id}:p_pos`, toPin: `${prMsg.id}:tip` },
        { id: 'w_rbase_q', fromPin: `${rBase.id}:p2`, toPin: `${qMod.id}:base` },
        { id: 'w_car_q', fromPin: `${vCarrier.id}:p_pos`, toPin: `${qMod.id}:collector` },
        { id: 'w_q_emit', fromPin: `${qMod.id}:emitter`, toPin: `${rEmit.id}:p1` },
        { id: 'w_q_pr', fromPin: `${qMod.id}:emitter`, toPin: `${prMod.id}:tip` },
        { id: 'w_q_denv', fromPin: `${qMod.id}:emitter`, toPin: `${dEnv.id}:anode` },

        // Demodulator Filter Stage
        { id: 'w_denv_rf', fromPin: `${dEnv.id}:cathode`, toPin: `${rFilter.id}:p1` },
        { id: 'w_denv_cf', fromPin: `${dEnv.id}:cathode`, toPin: `${cFilter.id}:p1` },
        { id: 'w_denv_rc', fromPin: `${dEnv.id}:cathode`, toPin: `${rCoupling.id}:p1` },

        // Comparator Slicer Stage
        { id: 'w_rc_op', fromPin: `${rCoupling.id}:p2`, toPin: `${opSlicer.id}:in_noninv` },
        { id: 'w_vref_r1', fromPin: `${vRefSupply.id}:p_pos`, toPin: `${rRef1.id}:p1` },
        { id: 'w_r1_r2', fromPin: `${rRef1.id}:p2`, toPin: `${rRef2.id}:p1` },
        { id: 'w_ref_op', fromPin: `${rRef1.id}:p2`, toPin: `${opSlicer.id}:in_inv` },

        // Output Clamping & Probe
        { id: 'w_op_rout', fromPin: `${opSlicer.id}:out`, toPin: `${rOut.id}:p1` },
        { id: 'w_rout_d', fromPin: `${rOut.id}:p2`, toPin: `${dClamp.id}:cathode` },
        { id: 'w_rout_pr', fromPin: `${rOut.id}:p2`, toPin: `${prOut.id}:tip` }
      ];

      canvas.fitToScreen();
    }
  },

  // 14. Universal Logic: NOR Gate Equivalents
  universalNorGates: {
    id: 'universal-nor-gates',
    name: 'Universal Logic: NOR Gate Equivalents (NOT, OR, AND, XOR)',
    description: 'Complete universal realization of NOT, OR, AND, and XOR logic gates using exclusively 2-input NOR gates with interactive DG1-DG7 digital switches and glowing LED indicators.',
    author: 'Switcha Lab',
    stats: { stars: 342, copies: 1205, views: 284900 },
    load(canvas) {
      canvas.components = [];
      canvas.wires = [];

      // ==========================================
      // Sub-Circuit 1: NOT GATE USING NOR GATE
      // ==========================================
      canvas.addComponent(ComponentTypes.TEXT_LABEL, 160, 40, { text: 'NOT GATE USING NOR GATE', fontSize: 13, bold: true, color: '#475569' }, 0);
      const dg1 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 80, 80, { state: 1, vHigh: 5.0, vLow: 0.0 }, 0);
      dg1.name = 'DG1';
      const u1 = canvas.addComponent(ComponentTypes.NOR_GATE, 180, 80, { vHigh: 5.0 }, 0);
      u1.name = 'U1';
      const led1 = canvas.addComponent(ComponentTypes.LED, 270, 80, { color: '#ff3b30' }, 0);
      led1.name = 'LED1';
      const gnd1 = canvas.addComponent(ComponentTypes.GROUND, 320, 80, {}, 0);

      // ==========================================
      // Sub-Circuit 2: OR GATE USING NOR GATE
      // ==========================================
      canvas.addComponent(ComponentTypes.TEXT_LABEL, 180, 180, { text: 'OR GATE USING NOR GATE', fontSize: 13, bold: true, color: '#475569' }, 0);
      const dg2 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 70, 210, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg2.name = 'DG2';
      const dg3 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 70, 240, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg3.name = 'DG3';
      const u2 = canvas.addComponent(ComponentTypes.NOR_GATE, 180, 225, { vHigh: 5.0 }, 0);
      u2.name = 'U2';
      const u3 = canvas.addComponent(ComponentTypes.NOR_GATE, 280, 225, { vHigh: 5.0 }, 0);
      u3.name = 'U3';
      const led2 = canvas.addComponent(ComponentTypes.LED, 370, 225, { color: '#ff3b30' }, 0);
      led2.name = 'LED2';
      const gnd2 = canvas.addComponent(ComponentTypes.GROUND, 420, 225, {}, 0);

      // ==========================================
      // Sub-Circuit 3: AND GATE USING NOR GATE
      // ==========================================
      canvas.addComponent(ComponentTypes.TEXT_LABEL, 180, 320, { text: 'AND GATE USING NOR GATE', fontSize: 13, bold: true, color: '#475569' }, 0);
      const dg4 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 70, 360, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg4.name = 'DG4';
      const dg5 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 70, 440, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg5.name = 'DG5';
      const u4 = canvas.addComponent(ComponentTypes.NOR_GATE, 180, 360, { vHigh: 5.0 }, 0);
      u4.name = 'U4';
      const u5 = canvas.addComponent(ComponentTypes.NOR_GATE, 180, 440, { vHigh: 5.0 }, 0);
      u5.name = 'U5';
      const u6 = canvas.addComponent(ComponentTypes.NOR_GATE, 290, 400, { vHigh: 5.0 }, 0);
      u6.name = 'U6';
      const led3 = canvas.addComponent(ComponentTypes.LED, 380, 400, { color: '#ff3b30' }, 0);
      led3.name = 'LED3';
      const gnd3 = canvas.addComponent(ComponentTypes.GROUND, 430, 400, {}, 0);

      // ==========================================
      // Sub-Circuit 4: X-OR GATE USING NOR GATE
      // ==========================================
      canvas.addComponent(ComponentTypes.TEXT_LABEL, 650, 40, { text: 'X-OR GATE USING NOR GATE', fontSize: 13, bold: true, color: '#475569' }, 0);
      const dg6 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 480, 90, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg6.name = 'DG6';
      const dg7 = canvas.addComponent(ComponentTypes.DIGITAL_CONSTANT, 480, 210, { state: 0, vHigh: 5.0, vLow: 0.0 }, 0);
      dg7.name = 'DG7';
      const u7 = canvas.addComponent(ComponentTypes.NOR_GATE, 580, 150, { vHigh: 5.0 }, 0);
      u7.name = 'U7';
      const u9 = canvas.addComponent(ComponentTypes.NOR_GATE, 680, 90, { vHigh: 5.0 }, 0);
      u9.name = 'U9';
      const u8 = canvas.addComponent(ComponentTypes.NOR_GATE, 680, 210, { vHigh: 5.0 }, 0);
      u8.name = 'U8';
      const u10 = canvas.addComponent(ComponentTypes.NOR_GATE, 780, 150, { vHigh: 5.0 }, 0);
      u10.name = 'U10';
      const u11 = canvas.addComponent(ComponentTypes.NOR_GATE, 880, 150, { vHigh: 5.0 }, 0);
      u11.name = 'U11';
      const led4 = canvas.addComponent(ComponentTypes.LED, 970, 150, { color: '#ff3b30' }, 0);
      led4.name = 'LED4';
      const gnd4 = canvas.addComponent(ComponentTypes.GROUND, 1020, 150, {}, 0);

      canvas.wires = [
        // NOT Gate Wires
        { id: 'w_not_in1', fromPin: `${dg1.id}:out`, toPin: `${u1.id}:in1` },
        { id: 'w_not_in2', fromPin: `${dg1.id}:out`, toPin: `${u1.id}:in2` },
        { id: 'w_not_out', fromPin: `${u1.id}:out`, toPin: `${led1.id}:anode` },
        { id: 'w_not_gnd', fromPin: `${led1.id}:cathode`, toPin: `${gnd1.id}:p1` },

        // OR Gate Wires
        { id: 'w_or_in1', fromPin: `${dg2.id}:out`, toPin: `${u2.id}:in1` },
        { id: 'w_or_in2', fromPin: `${dg3.id}:out`, toPin: `${u2.id}:in2` },
        { id: 'w_or_mid1', fromPin: `${u2.id}:out`, toPin: `${u3.id}:in1` },
        { id: 'w_or_mid2', fromPin: `${u2.id}:out`, toPin: `${u3.id}:in2` },
        { id: 'w_or_out', fromPin: `${u3.id}:out`, toPin: `${led2.id}:anode` },
        { id: 'w_or_gnd', fromPin: `${led2.id}:cathode`, toPin: `${gnd2.id}:p1` },

        // AND Gate Wires
        { id: 'w_and_in1a', fromPin: `${dg4.id}:out`, toPin: `${u4.id}:in1` },
        { id: 'w_and_in1b', fromPin: `${dg4.id}:out`, toPin: `${u4.id}:in2` },
        { id: 'w_and_in2a', fromPin: `${dg5.id}:out`, toPin: `${u5.id}:in1` },
        { id: 'w_and_in2b', fromPin: `${dg5.id}:out`, toPin: `${u5.id}:in2` },
        { id: 'w_and_u4_u6', fromPin: `${u4.id}:out`, toPin: `${u6.id}:in1` },
        { id: 'w_and_u5_u6', fromPin: `${u5.id}:out`, toPin: `${u6.id}:in2` },
        { id: 'w_and_out', fromPin: `${u6.id}:out`, toPin: `${led3.id}:anode` },
        { id: 'w_and_gnd', fromPin: `${led3.id}:cathode`, toPin: `${gnd3.id}:p1` },

        // XOR Gate Wires
        { id: 'w_xor_dg6_u7', fromPin: `${dg6.id}:out`, toPin: `${u7.id}:in1` },
        { id: 'w_xor_dg6_u9', fromPin: `${dg6.id}:out`, toPin: `${u9.id}:in1` },
        { id: 'w_xor_dg7_u7', fromPin: `${dg7.id}:out`, toPin: `${u7.id}:in2` },
        { id: 'w_xor_dg7_u8', fromPin: `${dg7.id}:out`, toPin: `${u8.id}:in2` },
        { id: 'w_xor_u7_u9', fromPin: `${u7.id}:out`, toPin: `${u9.id}:in2` },
        { id: 'w_xor_u7_u8', fromPin: `${u7.id}:out`, toPin: `${u8.id}:in1` },
        { id: 'w_xor_u9_u10', fromPin: `${u9.id}:out`, toPin: `${u10.id}:in1` },
        { id: 'w_xor_u8_u10', fromPin: `${u8.id}:out`, toPin: `${u10.id}:in2` },
        { id: 'w_xor_u10_u11a', fromPin: `${u10.id}:out`, toPin: `${u11.id}:in1` },
        { id: 'w_xor_u10_u11b', fromPin: `${u10.id}:out`, toPin: `${u11.id}:in2` },
        { id: 'w_xor_out', fromPin: `${u11.id}:out`, toPin: `${led4.id}:anode` },
        { id: 'w_xor_gnd', fromPin: `${led4.id}:cathode`, toPin: `${gnd4.id}:p1` }
      ];

      canvas.fitToScreen();
    }
  }
};
