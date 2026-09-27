/**
 * e-Samastha — Virtual Arduino Hardware Components Library
 * 
 * Defines component models, terminals, power constraints, physical behavior,
 * and property states for the embedded laboratory workbench:
 * - Basic: LED, RGB LED, Resistor, Push Button, Switch, Potentiometer, Buzzer
 * - Sensors: LDR, LM35/TMP36, DHT11/DHT22, HC-SR04, PIR, IR, Flame, Gas
 * - Displays: 16x2 LCD, 20x4 LCD, 7-Segment, 4-Digit 7-Segment, OLED 128x64
 * - Actuators: Micro Servo SG90, DC Motor, Stepper Motor, Relay Module
 */

export const ComponentType = {
  // Basic
  LED: 'LED',
  RGB_LED: 'RGB_LED',
  RESISTOR: 'RESISTOR',
  BUTTON: 'BUTTON',
  SWITCH: 'SWITCH',
  POTENTIOMETER: 'POTENTIOMETER',
  BUZZER: 'BUZZER',

  // Sensors
  LDR: 'LDR',
  LM35: 'LM35',
  DHT11: 'DHT11',
  HC_SR04: 'ULTRASONIC',
  PIR_SENSOR: 'PIR_SENSOR',
  IR_SENSOR: 'IR_SENSOR',
  FLAME_SENSOR: 'FLAME_SENSOR',
  GAS_SENSOR: 'GAS_SENSOR',

  // Displays
  LCD1602: 'LCD1602',
  LCD2004: 'LCD2004',
  SEVENSEG: 'SEVENSEG',
  FOUR_DIGIT_SEVENSEG: 'FOUR_DIGIT_SEVENSEG',
  OLED12864: 'OLED12864',

  // Actuators
  SERVO: 'SERVO',
  DC_MOTOR: 'DC_MOTOR',
  STEPPER_MOTOR: 'STEPPER_MOTOR',
  RELAY: 'RELAY'
};

export class ArduinoComponent {
  constructor(id, type, name, x = 100, y = 100) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = 90;
    this.height = 90;
    this.terminals = [];
    this.connections = new Map(); // terminalName -> { boardPin, netId }
    this.state = {};
    this.powerState = 'POWERED'; // POWERED, MISSING_VCC, MISSING_GND, UNPOWERED
    this.requiresPower = false;
    this.init();
  }

  init() {}

  connect(terminalName, boardPin) {
    this.connections.set(terminalName, { boardPin });
  }

  disconnect(terminalName) {
    this.connections.delete(terminalName);
  }

  getConnectedPin(terminalName) {
    const conn = this.connections.get(terminalName);
    return conn ? conn.boardPin : null;
  }

  checkPower(board) {
    if (!this.requiresPower || !board) return true;
    const vccPin = this.getConnectedPin('vcc');
    const gndPin = this.getConnectedPin('gnd');

    const vccP = vccPin !== null ? board.getPin(vccPin) : null;
    const gndP = gndPin !== null ? board.getPin(gndPin) : null;

    if (!vccP && !gndP) {
      this.powerState = 'UNPOWERED';
      return false;
    }

    const hasVcc = vccP && (vccP.voltage >= 3.0 || vccP.id === '5V' || vccP.id === '3.3V');
    const hasGnd = gndP && (gndP.voltage <= 0.5 || gndP.id === 'GND');

    if (!hasVcc) {
      this.powerState = 'MISSING_VCC';
      return false;
    }
    if (!hasGnd) {
      this.powerState = 'MISSING_GND';
      return false;
    }
    this.powerState = 'POWERED';
    return true;
  }

  update(board, interpreter) {}
}

// ============================================================================
// 1. BASIC COMPONENTS
// ============================================================================

export class LedComponent extends ArduinoComponent {
  init() {
    this.width = 60;
    this.height = 70;
    this.state = {
      color: 'red', // red, green, yellow, blue, white
      brightness: 0.0,
      isOn: false
    };
    this.terminals = [
      { name: 'anode', label: 'A (+)', dx: 20, dy: 65, type: 'anode' },
      { name: 'cathode', label: 'K (-)', dx: 40, dy: 65, type: 'cathode' }
    ];
  }

  update(board) {
    const anodePin = this.getConnectedPin('anode');
    const cathodePin = this.getConnectedPin('cathode');

    let vAnode = 0;
    let vCathode = 0;

    if (anodePin !== null) {
      const p = board.getPin(anodePin);
      vAnode = p ? p.voltage : 0;
    }
    if (cathodePin !== null) {
      const p = board.getPin(cathodePin);
      vCathode = p ? p.voltage : 0;
    }

    const vDiff = vAnode - vCathode;
    if (vDiff > 1.8) {
      this.state.isOn = true;
      this.state.brightness = Math.min(1.0, (vDiff - 1.8) / 3.2 + 0.3);
    } else {
      this.state.isOn = false;
      this.state.brightness = 0.0;
    }
  }
}

export class RgbLedComponent extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 80;
    this.state = {
      r: 0,
      g: 0,
      b: 0,
      brightness: 0
    };
    this.terminals = [
      { name: 'r', label: 'R', dx: 15, dy: 75 },
      { name: 'cathode', label: 'GND', dx: 30, dy: 75 },
      { name: 'g', label: 'G', dx: 45, dy: 75 },
      { name: 'b', label: 'B', dx: 60, dy: 75 }
    ];
  }

  update(board) {
    const rPin = this.getConnectedPin('r');
    const gPin = this.getConnectedPin('g');
    const bPin = this.getConnectedPin('b');

    const pr = rPin !== null ? board.getPin(rPin) : null;
    const pg = gPin !== null ? board.getPin(gPin) : null;
    const pb = bPin !== null ? board.getPin(bPin) : null;

    this.state.r = pr ? (pr.pwmDuty || (pr.digitalValue ? 255 : 0)) : 0;
    this.state.g = pg ? (pg.pwmDuty || (pg.digitalValue ? 255 : 0)) : 0;
    this.state.b = pb ? (pb.pwmDuty || (pb.digitalValue ? 255 : 0)) : 0;
    this.state.brightness = Math.max(this.state.r, this.state.g, this.state.b) / 255.0;
  }
}

export class PushbuttonComponent extends ArduinoComponent {
  init() {
    this.width = 70;
    this.height = 70;
    this.state = {
      pressed: false,
      mode: 'momentary' // momentary or toggle
    };
    this.terminals = [
      { name: 'pin1', label: '1', dx: 15, dy: 35 },
      { name: 'pin2', label: '2', dx: 55, dy: 35 }
    ];
  }

  setPressed(isPressed, board) {
    this.state.pressed = isPressed;
    this.update(board);
  }

  toggle(board) {
    this.state.pressed = !this.state.pressed;
    this.update(board);
  }

  update(board) {
    if (!board) return;
    const pin1 = this.getConnectedPin('pin1');
    const pin2 = this.getConnectedPin('pin2');

    if (pin1 !== null) {
      const p = board.getPin(pin1);
      if (p) {
        if (this.state.pressed) {
          board.setExternalDigital(pin1, 0);
        } else {
          if (p.pullup) {
            board.setExternalDigital(pin1, 1);
          }
        }
      }
    }
  }
}

export class SwitchComponent extends ArduinoComponent {
  init() {
    this.width = 70;
    this.height = 70;
    this.state = { closed: false };
    this.terminals = [
      { name: 'pin1', label: '1', dx: 15, dy: 35 },
      { name: 'pin2', label: '2', dx: 55, dy: 35 }
    ];
  }

  toggle(board) {
    this.state.closed = !this.state.closed;
    this.update(board);
  }

  update(board) {
    if (!board) return;
    const pin1 = this.getConnectedPin('pin1');
    if (pin1 !== null) {
      board.setExternalDigital(pin1, this.state.closed ? 1 : 0);
    }
  }
}

export class PotentiometerComponent extends ArduinoComponent {
  init() {
    this.width = 90;
    this.height = 90;
    this.requiresPower = true;
    this.powerState = 'UNPOWERED';
    this.state = {
      ratio: 0.5,
      resistance: 10000
    };
    this.terminals = [
      { name: 'vcc', label: '5V', dx: 15, dy: 80 },
      { name: 'wiper', label: 'SIG', dx: 45, dy: 80 },
      { name: 'gnd', label: 'GND', dx: 75, dy: 80 }
    ];
  }

  setValue(ratio, board) {
    this.state.ratio = Math.max(0.0, Math.min(1.0, Number(ratio) || 0));
    this.update(board);
  }

  update(board) {
    if (!board) return;
    this.checkPower(board);
    const wiperPin = this.getConnectedPin('wiper');
    if (wiperPin !== null) {
      const voltage = this.powerState === 'POWERED' ? this.state.ratio * 5.0 : 0.0;
      board.setExternalVoltage(wiperPin, voltage);
    }
  }
}

export class BuzzerComponent extends ArduinoComponent {
  init() {
    this.width = 70;
    this.height = 70;
    this.state = {
      isPlaying: false,
      frequency: 0
    };
    this.terminals = [
      { name: 'pos', label: '(+)', dx: 25, dy: 65 },
      { name: 'neg', label: '(-)', dx: 45, dy: 65 }
    ];
  }

  setTone(freq) {
    this.state.isPlaying = freq > 0;
    this.state.frequency = freq;
  }

  update(board) {
    const posPin = this.getConnectedPin('pos');
    if (posPin !== null && board) {
      const p = board.getPin(posPin);
      if (p && p.digitalValue === 1 && !this.state.isPlaying) {
        this.state.isPlaying = true;
        this.state.frequency = 1000;
      } else if (p && p.digitalValue === 0 && this.state.frequency === 1000) {
        this.state.isPlaying = false;
        this.state.frequency = 0;
      }
    }
  }
}

// ============================================================================
// 2. SENSORS
// ============================================================================

export class LdrComponent extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 80;
    this.state = {
      lux: 500, // 0 (dark) to 1000 (bright)
      ratio: 0.5
    };
    this.terminals = [
      { name: 'vcc', label: '5V', dx: 20, dy: 75 },
      { name: 'sig', label: 'SIG', dx: 40, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 60, dy: 75 }
    ];
  }

  setLux(lux, board) {
    this.state.lux = Math.max(0, Math.min(1000, Number(lux) || 0));
    this.state.ratio = this.state.lux / 1000.0;
    this.update(board);
  }

  update(board) {
    if (!board) return;
    const sigPin = this.getConnectedPin('sig');
    if (sigPin !== null) {
      const voltage = this.state.ratio * 5.0;
      board.setExternalVoltage(sigPin, voltage);
    }
  }
}

export class Lm35Component extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 80;
    this.state = {
      tempC: 25.0 // -40C to 125C
    };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 75 },
      { name: 'vout', label: 'VOUT', dx: 40, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 60, dy: 75 }
    ];
  }

  setTemp(degC, board) {
    this.state.tempC = Math.max(-40, Math.min(125, Number(degC) || 0));
    this.update(board);
  }

  update(board) {
    if (!board) return;
    const voutPin = this.getConnectedPin('vout');
    if (voutPin !== null) {
      // LM35 outputs 10mV / °C. At 25°C = 0.25V
      const voltage = Math.max(0, Math.min(5.0, this.state.tempC * 0.01));
      board.setExternalVoltage(voutPin, voltage);
    }
  }
}

export class Dht11Component extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 90;
    this.requiresPower = true;
    this.state = {
      temperature: 24,
      humidity: 50
    };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 85 },
      { name: 'data', label: 'DATA', dx: 40, dy: 85 },
      { name: 'gnd', label: 'GND', dx: 60, dy: 85 }
    ];
  }

  setValues(temp, hum) {
    this.state.temperature = temp;
    this.state.humidity = hum;
  }

  update(board) {
    this.checkPower(board);
  }
}

export class UltrasonicComponent extends ArduinoComponent {
  init() {
    this.width = 120;
    this.height = 80;
    this.requiresPower = true;
    this.state = {
      distanceCm: 25
    };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 75 },
      { name: 'trig', label: 'TRIG', dx: 45, dy: 75 },
      { name: 'echo', label: 'ECHO', dx: 70, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 95, dy: 75 }
    ];
  }

  setDistance(cm, interpreter) {
    this.state.distanceCm = Math.max(2, Math.min(400, Number(cm) || 2));
    this.update(null, interpreter);
  }

  update(board, interpreter) {
    if (board) this.checkPower(board);
    if (!interpreter) return;
    const echoPin = this.getConnectedPin('echo');
    if (echoPin !== null) {
      interpreter.registerPulseSensor(echoPin, () => Math.round(this.state.distanceCm * 58));
    }
  }
}

export class PirComponent extends ArduinoComponent {
  init() {
    this.width = 90;
    this.height = 80;
    this.requiresPower = true;
    this.state = {
      motionDetected: false
    };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 75 },
      { name: 'out', label: 'OUT', dx: 45, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 70, dy: 75 }
    ];
  }

  triggerMotion(board) {
    this.state.motionDetected = true;
    this.update(board);
    setTimeout(() => {
      this.state.motionDetected = false;
      this.update(board);
    }, 2000);
  }

  update(board) {
    if (!board) return;
    this.checkPower(board);
    const outPin = this.getConnectedPin('out');
    if (outPin !== null) {
      const active = this.powerState === 'POWERED' && this.state.motionDetected;
      board.setExternalDigital(outPin, active ? 1 : 0);
    }
  }
}

export class IrComponent extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 80;
    this.requiresPower = true;
    this.state = { obstacle: false };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 75 },
      { name: 'out', label: 'OUT', dx: 40, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 60, dy: 75 }
    ];
  }

  setObstacle(detected, board) {
    this.state.obstacle = detected;
    this.update(board);
  }

  update(board) {
    if (!board) return;
    this.checkPower(board);
    const outPin = this.getConnectedPin('out');
    if (outPin !== null) {
      // Active LOW when obstacle detected
      const val = (this.powerState === 'POWERED' && this.state.obstacle) ? 0 : 1;
      board.setExternalDigital(outPin, val);
    }
  }
}

export class GasSensorComponent extends ArduinoComponent {
  init() {
    this.width = 90;
    this.height = 90;
    this.requiresPower = true;
    this.state = { ppm: 150 }; // 0 to 1000 ppm
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 80 },
      { name: 'ao', label: 'AO', dx: 40, dy: 80 },
      { name: 'do', label: 'DO', dx: 60, dy: 80 },
      { name: 'gnd', label: 'GND', dx: 80, dy: 80 }
    ];
  }

  setPpm(ppm, board) {
    this.state.ppm = Math.max(0, Math.min(1000, Number(ppm) || 0));
    this.update(board);
  }

  update(board) {
    if (!board) return;
    this.checkPower(board);
    const aoPin = this.getConnectedPin('ao');
    const doPin = this.getConnectedPin('do');

    if (aoPin !== null) {
      const v = (this.state.ppm / 1000.0) * 5.0;
      board.setExternalVoltage(aoPin, v);
    }
    if (doPin !== null) {
      board.setExternalDigital(doPin, this.state.ppm > 400 ? 1 : 0);
    }
  }
}

// ============================================================================
// 3. DISPLAYS
// ============================================================================

export class Lcd1602Component extends ArduinoComponent {
  init() {
    this.width = 240;
    this.height = 110;
    this.requiresPower = true;
    this.state = {
      lines: ['                ', '                '],
      cols: 16,
      rows: 2,
      backlight: true
    };
    this.terminals = [
      { name: 'vss', label: 'GND', dx: 15, dy: 100 },
      { name: 'vdd', label: 'VCC', dx: 30, dy: 100 },
      { name: 'rs', label: 'RS', dx: 60, dy: 100 },
      { name: 'e', label: 'E', dx: 90, dy: 100 },
      { name: 'd4', label: 'D4', dx: 105, dy: 100 },
      { name: 'd5', label: 'D5', dx: 120, dy: 100 },
      { name: 'd6', label: 'D6', dx: 135, dy: 100 },
      { name: 'd7', label: 'D7', dx: 150, dy: 100 }
    ];
  }

  setText(lines) {
    if (Array.isArray(lines)) {
      this.state.lines = lines.map(l => (l || '').padEnd(16, ' ').substring(0, 16));
    }
  }

  update(board) {
    if (board) this.checkPower(board);
  }
}

export class OledComponent extends ArduinoComponent {
  init() {
    this.width = 140;
    this.height = 100;
    this.requiresPower = true;
    this.state = {
      lines: ['e-Samastha OLED', '128x64 Active']
    };
    this.terminals = [
      { name: 'gnd', label: 'GND', dx: 25, dy: 90 },
      { name: 'vcc', label: 'VCC', dx: 55, dy: 90 },
      { name: 'scl', label: 'SCL', dx: 85, dy: 90 },
      { name: 'sda', label: 'SDA', dx: 115, dy: 90 }
    ];
  }

  setLines(lines) {
    this.state.lines = lines || [];
  }

  update(board) {
    if (board) this.checkPower(board);
  }
}

export class SevenSegComponent extends ArduinoComponent {
  init() {
    this.width = 70;
    this.height = 95;
    this.state = {
      digit: 0,
      segments: { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, dp: 0 }
    };
    this.terminals = [
      { name: 'a', label: 'a', dx: 15, dy: 10 },
      { name: 'b', label: 'b', dx: 30, dy: 10 },
      { name: 'com1', label: 'COM', dx: 45, dy: 10 },
      { name: 'f', label: 'f', dx: 60, dy: 10 },
      { name: 'g', label: 'g', dx: 15, dy: 90 },
      { name: 'c', label: 'c', dx: 30, dy: 90 },
      { name: 'dp', label: 'dp', dx: 45, dy: 90 },
      { name: 'd', label: 'd', dx: 60, dy: 90 }
    ];
  }

  update(board) {
    if (!board) return;
    const segMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'];
    for (const s of segMap) {
      const pin = this.getConnectedPin(s);
      if (pin !== null) {
        const p = board.getPin(pin);
        this.state.segments[s] = p ? p.digitalValue : 0;
      }
    }
  }
}

// ============================================================================
// 4. ACTUATORS
// ============================================================================

export class ServoComponent extends ArduinoComponent {
  init() {
    this.width = 110;
    this.height = 90;
    this.requiresPower = true;
    this.state = {
      angle: 90,
      targetAngle: 90
    };
    this.terminals = [
      { name: 'gnd', label: 'GND', dx: 25, dy: 80 },
      { name: 'vcc', label: '5V', dx: 55, dy: 80 },
      { name: 'signal', label: 'SIG', dx: 85, dy: 80 }
    ];
  }

  setAngle(angle) {
    this.state.angle = Math.max(0, Math.min(180, Math.round(angle)));
  }

  setTargetAngle(angle) {
    this.state.targetAngle = Math.max(0, Math.min(180, Math.round(angle)));
    this.setAngle(angle);
  }

  update(board) {
    if (board) this.checkPower(board);
  }
}

export class DcMotorComponent extends ArduinoComponent {
  init() {
    this.width = 90;
    this.height = 90;
    this.state = {
      speedRpm: 0,
      rotationAngle: 0
    };
    this.terminals = [
      { name: 'pos', label: '(+)', dx: 25, dy: 80 },
      { name: 'neg', label: '(-)', dx: 65, dy: 80 }
    ];
  }

  update(board) {
    if (!board) return;
    const posPin = this.getConnectedPin('pos');
    const negPin = this.getConnectedPin('neg');

    let vPos = 0;
    let vNeg = 0;
    if (posPin !== null) {
      const p = board.getPin(posPin);
      vPos = p ? p.voltage : 0;
    }
    if (negPin !== null) {
      const p = board.getPin(negPin);
      vNeg = p ? p.voltage : 0;
    }

    const vDiff = Math.max(0, vPos - vNeg);
    this.state.speedRpm = Math.round((vDiff / 5.0) * 3000);
    this.state.rotationAngle = (this.state.rotationAngle + (this.state.speedRpm / 60) * 6) % 360;
  }
}

export class RelayComponent extends ArduinoComponent {
  init() {
    this.width = 100;
    this.height = 90;
    this.requiresPower = true;
    this.state = { isEnergized: false };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 80 },
      { name: 'in', label: 'IN', dx: 50, dy: 80 },
      { name: 'gnd', label: 'GND', dx: 80, dy: 80 },
      { name: 'com', label: 'COM', dx: 25, dy: 15 },
      { name: 'no', label: 'NO', dx: 50, dy: 15 },
      { name: 'nc', label: 'NC', dx: 75, dy: 15 }
    ];
  }

  update(board) {
    if (!board) return;
    this.checkPower(board);
    const inPin = this.getConnectedPin('in');
    if (inPin !== null) {
      const p = board.getPin(inPin);
      this.state.isEnergized = this.powerState === 'POWERED' && p && p.digitalValue === 1;
    }
  }
}

export class ResistorComponent extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 40;
    this.state = {
      resistance: 220
    };
    this.terminals = [
      { name: 't1', label: '1', dx: 10, dy: 20 },
      { name: 't2', label: '2', dx: 70, dy: 20 }
    ];
  }
}

export class FlameSensorComponent extends ArduinoComponent {
  init() {
    this.width = 80;
    this.height = 80;
    this.requiresPower = true;
    this.state = { flameDetected: false };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 75 },
      { name: 'do', label: 'DO', dx: 40, dy: 75 },
      { name: 'gnd', label: 'GND', dx: 60, dy: 75 }
    ];
  }
}

export class Lcd2004Component extends Lcd1602Component {
  init() {
    super.init();
    this.width = 160;
    this.height = 120;
    this.state.rows = 4;
    this.state.cols = 20;
    this.state.lines = [
      '                    ',
      '                    ',
      '                    ',
      '                    '
    ];
  }
}

export class FourDigitSevenSegComponent extends ArduinoComponent {
  init() {
    this.width = 140;
    this.height = 70;
    this.state = { text: '0000' };
    this.terminals = [
      { name: 'vcc', label: 'VCC', dx: 20, dy: 65 },
      { name: 'clk', label: 'CLK', dx: 55, dy: 65 },
      { name: 'dio', label: 'DIO', dx: 85, dy: 65 },
      { name: 'gnd', label: 'GND', dx: 120, dy: 65 }
    ];
  }
}

export class StepperMotorComponent extends ArduinoComponent {
  init() {
    this.width = 100;
    this.height = 100;
    this.requiresPower = true;
    this.state = { steps: 0, speedRpm: 15 };
    this.terminals = [
      { name: 'in1', label: '1', dx: 20, dy: 90 },
      { name: 'in2', label: '2', dx: 40, dy: 90 },
      { name: 'in3', label: '3', dx: 60, dy: 90 },
      { name: 'in4', label: '4', dx: 80, dy: 90 }
    ];
  }
}

// ============================================================================
// COMPONENT FACTORY
// ============================================================================

export class ComponentFactory {
  static create(type, id, name, x = 100, y = 100) {
    switch (type) {
      case ComponentType.LED:
        return new LedComponent(id, type, name || 'LED', x, y);
      case ComponentType.RGB_LED:
        return new RgbLedComponent(id, type, name || 'RGB LED', x, y);
      case ComponentType.RESISTOR:
        return new ResistorComponent(id, type, name || 'Resistor', x, y);
      case ComponentType.BUTTON:
        return new PushbuttonComponent(id, type, name || 'Pushbutton', x, y);
      case ComponentType.SWITCH:
        return new SwitchComponent(id, type, name || 'SPST Switch', x, y);
      case ComponentType.POTENTIOMETER:
        return new PotentiometerComponent(id, type, name || 'Potentiometer', x, y);
      case ComponentType.BUZZER:
        return new BuzzerComponent(id, type, name || 'Piezo Buzzer', x, y);
      case ComponentType.LDR:
        return new LdrComponent(id, type, name || 'LDR Sensor', x, y);
      case ComponentType.LM35:
        return new Lm35Component(id, type, name || 'LM35 Temp Sensor', x, y);
      case ComponentType.DHT11:
        return new Dht11Component(id, type, name || 'DHT11 Sensor', x, y);
      case ComponentType.HC_SR04:
        return new UltrasonicComponent(id, type, name || 'HC-SR04 Sensor', x, y);
      case ComponentType.PIR_SENSOR:
        return new PirComponent(id, type, name || 'PIR Motion Sensor', x, y);
      case ComponentType.IR_SENSOR:
        return new IrComponent(id, type, name || 'IR Sensor', x, y);
      case ComponentType.FLAME_SENSOR:
        return new FlameSensorComponent(id, type, name || 'Flame Sensor', x, y);
      case ComponentType.GAS_SENSOR:
        return new GasSensorComponent(id, type, name || 'MQ Gas Sensor', x, y);
      case ComponentType.LCD1602:
        return new Lcd1602Component(id, type, name || '16x2 LCD', x, y);
      case ComponentType.LCD2004:
        return new Lcd2004Component(id, type, name || '20x4 LCD', x, y);
      case ComponentType.OLED12864:
        return new OledComponent(id, type, name || 'OLED 128x64', x, y);
      case ComponentType.SEVENSEG:
        return new SevenSegComponent(id, type, name || '7-Segment', x, y);
      case ComponentType.FOUR_DIGIT_SEVENSEG:
        return new FourDigitSevenSegComponent(id, type, name || '4-Digit 7-Segment', x, y);
      case ComponentType.SERVO:
        return new ServoComponent(id, type, name || 'Servo Motor', x, y);
      case ComponentType.DC_MOTOR:
        return new DcMotorComponent(id, type, name || 'DC Motor', x, y);
      case ComponentType.STEPPER_MOTOR:
        return new StepperMotorComponent(id, type, name || 'Stepper Motor', x, y);
      case ComponentType.RELAY:
        return new RelayComponent(id, type, name || 'Relay Module', x, y);
      default:
        return new LedComponent(id, ComponentType.LED, name || 'LED', x, y);
    }
  }
}
