/**
 * e-Samastha — Virtual Arduino Hardware & GPIO State Model
 * 
 * Accurately models microcontroller pins, registers, ADC, PWM channels, and power rails.
 * Full architecture support for:
 * - Arduino UNO (ATmega328P, 14 Digital, 6 Analog)
 * - Arduino Nano (ATmega328P, 14 Digital, 8 Analog)
 * - Arduino Mega 2560 (ATmega2560, 54 Digital, 16 Analog)
 * 
 * Strictly non-destructive. 0 eval() / 0 new Function().
 */

export const PinMode = {
  INPUT: 0,
  OUTPUT: 1,
  INPUT_PULLUP: 2
};

export const PinValue = {
  LOW: 0,
  HIGH: 1
};

export const BoardType = {
  UNO: 'UNO',
  NANO: 'NANO',
  MEGA: 'MEGA'
};

export class ArduinoBoard {
  constructor(boardType = BoardType.UNO) {
    this.type = boardType;
    this.pins = new Map(); // pinKey -> Pin object
    this.listeners = new Set();
    this.debugListeners = new Set();
    this.vccVoltage = 5.0;
    this.arefVoltage = 5.0;
    this.analogReferenceMode = 'DEFAULT'; // DEFAULT, INTERNAL, EXTERNAL
    this.warnings = [];
    this.initBoard();
  }

  initBoard() {
    this.pins.clear();
    this.warnings = [];

    if (this.type === BoardType.UNO) {
      // UNO: 14 Digital Pins (0 to 13)
      for (let i = 0; i <= 13; i++) {
        const isPwm = [3, 5, 6, 9, 10, 11].includes(i);
        const hasLed = (i === 13);
        this.pins.set(i, {
          id: i,
          name: `D${i}`,
          isAnalog: false,
          isPwm: isPwm,
          hasBuiltinLed: hasLed,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0, // 0 - 255
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      // 6 Analog Pins (A0 to A5 -> 14 to 19)
      for (let a = 0; a <= 5; a++) {
        const pinNum = 14 + a;
        this.pins.set(pinNum, {
          id: pinNum,
          name: `A${a}`,
          alias: `A${a}`,
          isAnalog: true,
          isPwm: false,
          hasBuiltinLed: false,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0,
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      // Power and Ground Pins
      this.pins.set('GND', { id: 'GND', name: 'GND', isPower: true, voltage: 0.0 });
      this.pins.set('5V', { id: '5V', name: '5V', isPower: true, voltage: 5.0 });
      this.pins.set('3.3V', { id: '3.3V', name: '3.3V', isPower: true, voltage: 3.3 });
      this.pins.set('VIN', { id: 'VIN', name: 'VIN', isPower: true, voltage: 9.0 });
      this.pins.set('AREF', { id: 'AREF', name: 'AREF', isPower: true, voltage: 5.0 });
      this.pins.set('RESET', { id: 'RESET', name: 'RESET', isPower: true, voltage: 5.0 });

    } else if (this.type === BoardType.NANO) {
      // Nano: 14 Digital Pins (0 to 13)
      for (let i = 0; i <= 13; i++) {
        const isPwm = [3, 5, 6, 9, 10, 11].includes(i);
        this.pins.set(i, {
          id: i,
          name: `D${i}`,
          isAnalog: false,
          isPwm: isPwm,
          hasBuiltinLed: i === 13,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0,
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      // Nano: 8 Analog Pins (A0 to A7 -> 14 to 21)
      for (let a = 0; a <= 7; a++) {
        const pinNum = 14 + a;
        this.pins.set(pinNum, {
          id: pinNum,
          name: `A${a}`,
          alias: `A${a}`,
          isAnalog: true,
          isPwm: false,
          hasBuiltinLed: false,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0,
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      this.pins.set('GND', { id: 'GND', name: 'GND', isPower: true, voltage: 0.0 });
      this.pins.set('5V', { id: '5V', name: '5V', isPower: true, voltage: 5.0 });
      this.pins.set('3.3V', { id: '3.3V', name: '3.3V', isPower: true, voltage: 3.3 });
      this.pins.set('VIN', { id: 'VIN', name: 'VIN', isPower: true, voltage: 9.0 });
      this.pins.set('AREF', { id: 'AREF', name: 'AREF', isPower: true, voltage: 5.0 });
      this.pins.set('RESET', { id: 'RESET', name: 'RESET', isPower: true, voltage: 5.0 });

    } else if (this.type === BoardType.MEGA) {
      // Mega 2560: 54 Digital Pins (0 to 53)
      for (let i = 0; i <= 53; i++) {
        const isPwm = (i >= 2 && i <= 13) || (i >= 44 && i <= 46);
        this.pins.set(i, {
          id: i,
          name: `D${i}`,
          isAnalog: false,
          isPwm: isPwm,
          hasBuiltinLed: i === 13,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0,
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      // Mega 2560: 16 Analog Pins (A0 to A15 -> 54 to 69)
      for (let a = 0; a <= 15; a++) {
        const pinNum = 54 + a;
        this.pins.set(pinNum, {
          id: pinNum,
          name: `A${a}`,
          alias: `A${a}`,
          isAnalog: true,
          isPwm: false,
          hasBuiltinLed: false,
          mode: PinMode.INPUT,
          digitalValue: PinValue.LOW,
          pwmDuty: 0,
          voltage: 0.0,
          rawAdc: 0,
          pullup: false,
          lastUpdated: Date.now()
        });
      }

      this.pins.set('GND', { id: 'GND', name: 'GND', isPower: true, voltage: 0.0 });
      this.pins.set('5V', { id: '5V', name: '5V', isPower: true, voltage: 5.0 });
      this.pins.set('3.3V', { id: '3.3V', name: '3.3V', isPower: true, voltage: 3.3 });
      this.pins.set('VIN', { id: 'VIN', name: 'VIN', isPower: true, voltage: 9.0 });
      this.pins.set('AREF', { id: 'AREF', name: 'AREF', isPower: true, voltage: 5.0 });
      this.pins.set('RESET', { id: 'RESET', name: 'RESET', isPower: true, voltage: 5.0 });
    }
  }

  resolvePinIndex(pin) {
    if (typeof pin === 'number') return pin;
    if (typeof pin === 'string') {
      const upper = pin.trim().toUpperCase();
      if (['GND', '5V', '3.3V', 'AREF', 'RESET', 'VIN'].includes(upper)) {
        return upper;
      }
      if (upper.startsWith('A')) {
        const idx = parseInt(upper.substring(1), 10);
        if (!isNaN(idx)) {
          return (this.type === BoardType.MEGA) ? 54 + idx : 14 + idx;
        }
      }
      if (upper.startsWith('D')) {
        const idx = parseInt(upper.substring(1), 10);
        if (!isNaN(idx)) return idx;
      }
      const num = parseInt(pin, 10);
      if (!isNaN(num)) return num;
    }
    return pin;
  }

  getPin(pin) {
    const key = this.resolvePinIndex(pin);
    return this.pins.get(key) || null;
  }

  setPinMode(pin, mode) {
    const p = this.getPin(pin);
    if (!p || p.isPower) return;
    p.mode = mode;
    p.pullup = (mode === PinMode.INPUT_PULLUP);
    if (p.pullup && p.digitalValue === PinValue.LOW) {
      p.digitalValue = PinValue.HIGH;
      p.voltage = this.vccVoltage;
    }
    p.lastUpdated = Date.now();
    const modeName = mode === PinMode.OUTPUT ? 'OUTPUT' : (mode === PinMode.INPUT_PULLUP ? 'INPUT_PULLUP' : 'INPUT');
    this.emitDebug(`pinMode(${p.name}, ${modeName})`);
    this.notify('pinMode', { pin: p.id, mode });
  }

  digitalWrite(pin, value) {
    const p = this.getPin(pin);
    if (!p || p.isPower) return;

    if (p.mode === PinMode.INPUT) {
      // In ATmega, writing HIGH to INPUT enables internal pullup resistor
      if (value === PinValue.HIGH || value === 1 || value === true || value === 'HIGH') {
        p.pullup = true;
        p.digitalValue = PinValue.HIGH;
        p.voltage = this.vccVoltage;
      } else {
        p.pullup = false;
        p.digitalValue = PinValue.LOW;
        p.voltage = 0.0;
      }
      this.warnings.push(`Warning: digitalWrite(${p.name}) called while pin is in INPUT mode (toggled pull-up).`);
    } else {
      const normVal = (value === PinValue.HIGH || value === true || value === 1 || value === 'HIGH') ? PinValue.HIGH : PinValue.LOW;
      p.digitalValue = normVal;
      p.voltage = normVal === PinValue.HIGH ? this.vccVoltage : 0.0;
      p.pwmDuty = normVal === PinValue.HIGH ? 255 : 0;
    }

    p.lastUpdated = Date.now();
    this.emitDebug(`digitalWrite(${p.name}, ${p.digitalValue === 1 ? 'HIGH' : 'LOW'}) [${p.voltage.toFixed(2)}V]`);
    this.notify('digitalWrite', { pin: p.id, value: p.digitalValue, voltage: p.voltage, pwm: p.pwmDuty });
  }

  digitalRead(pin) {
    const p = this.getPin(pin);
    if (!p) return PinValue.LOW;
    if (p.isPower) return p.voltage > 2.5 ? PinValue.HIGH : PinValue.LOW;
    if (p.mode === PinMode.INPUT_PULLUP && p.digitalValue === undefined) {
      return PinValue.HIGH;
    }
    this.emitDebug(`digitalRead(${p.name}) -> ${p.digitalValue === 1 ? 'HIGH' : 'LOW'}`);
    return p.digitalValue;
  }

  analogWrite(pin, duty) {
    const p = this.getPin(pin);
    if (!p || p.isPower) return;

    const clampedDuty = Math.max(0, Math.min(255, Math.round(duty || 0)));
    p.pwmDuty = clampedDuty;
    p.voltage = (clampedDuty / 255.0) * this.vccVoltage;
    p.digitalValue = clampedDuty >= 128 ? PinValue.HIGH : PinValue.LOW;
    p.lastUpdated = Date.now();

    if (!p.isPwm) {
      this.warnings.push(`Notice: Pin ${p.name} is not hardware PWM-capable. Simulated as digital threshold.`);
    }

    this.emitDebug(`analogWrite(${p.name}, ${clampedDuty}) [${Math.round(clampedDuty/255*100)}% PWM, ${p.voltage.toFixed(2)}V]`);
    this.notify('analogWrite', { pin: p.id, pwmDuty: clampedDuty, voltage: p.voltage });
  }

  analogRead(pin) {
    const p = this.getPin(pin);
    if (!p) return 0;

    if (!p.isAnalog) {
      this.warnings.push(`Warning: analogRead() attempted on non-analog pin ${p.name}. Returning 0.`);
      return 0;
    }

    // 10-bit ADC conversion: 0 - 5V maps to 0 - 1023
    const ratio = Math.max(0, Math.min(1.0, p.voltage / this.arefVoltage));
    p.rawAdc = Math.round(ratio * 1023);
    p.lastUpdated = Date.now();

    this.emitDebug(`analogRead(${p.name}) -> ${p.rawAdc} (${p.voltage.toFixed(2)}V)`);
    return p.rawAdc;
  }

  setAnalogReference(type) {
    this.analogReferenceMode = type;
    if (type === 'INTERNAL' || type === 'INTERNAL1V1') {
      this.arefVoltage = 1.1;
    } else if (type === 'INTERNAL2V56') {
      this.arefVoltage = 2.56;
    } else {
      this.arefVoltage = 5.0;
    }
    this.emitDebug(`analogReference(${type}) -> AREF = ${this.arefVoltage}V`);
  }

  analogReference(type) {
    return this.setAnalogReference(type);
  }

  // --- External Sensor & Hardware Input Simulation ---
  setExternalVoltage(pin, voltage) {
    const p = this.getPin(pin);
    if (!p || p.isPower) return;
    const clamped = Math.max(0, Math.min(5.0, Number(voltage) || 0));
    p.voltage = clamped;
    p.rawAdc = Math.round((clamped / this.arefVoltage) * 1023);
    p.digitalValue = clamped >= 2.5 ? PinValue.HIGH : PinValue.LOW;
    p.lastUpdated = Date.now();
    this.notify('externalVoltage', { pin: p.id, voltage: clamped, adc: p.rawAdc });
  }

  setExternalDigital(pin, highOrLow) {
    const p = this.getPin(pin);
    if (!p || p.isPower) return;
    const val = highOrLow ? PinValue.HIGH : PinValue.LOW;
    p.digitalValue = val;
    p.voltage = val === PinValue.HIGH ? this.vccVoltage : 0.0;
    p.rawAdc = val === PinValue.HIGH ? 1023 : 0;
    p.lastUpdated = Date.now();
    this.notify('externalDigital', { pin: p.id, value: val, voltage: p.voltage });
  }

  reset() {
    this.initBoard();
    this.notify('reset', {});
    this.emitDebug('Microcontroller reset executed. All pins restored to default high-impedance INPUT.');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeDebug(listener) {
    this.debugListeners.add(listener);
    return () => this.debugListeners.delete(listener);
  }

  emitDebug(message) {
    if (this.debugListeners.size === 0) return;
    const timestamp = new Date().toISOString().substring(11, 23);
    for (const l of this.debugListeners) {
      try {
        l({ timestamp, message });
      } catch (_) {}
    }
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Error in ArduinoBoard listener:', err);
      }
    }
  }

  getAllPins() {
    return Array.from(this.pins.values());
  }

  getDigitalPins() {
    return Array.from(this.pins.values()).filter(p => !p.isPower && !p.isAnalog);
  }

  getAnalogPins() {
    return Array.from(this.pins.values()).filter(p => !p.isPower && p.isAnalog);
  }

  getPwmPins() {
    return Array.from(this.pins.values()).filter(p => p.isPwm);
  }
}
