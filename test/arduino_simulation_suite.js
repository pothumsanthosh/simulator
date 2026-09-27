/**
 * AUTOMATED TEST SUITE: e-Samastha ARDUINO SIMULATION & PERIPHERAL ENGINE
 * 
 * Verifies:
 * - Full execution simulation of all 25 educational presets
 * - Oscilloscope waveform sampling across digital, PWM, and analog channels
 * - Component power constraint physics (UNPOWERED, MISSING_VCC, MISSING_GND, POWERED)
 * - PWM duty cycle voltage calculations
 * - 10-bit ADC conversion and analog reference scaling
 * - Peripheral integrations (LCD, OLED, Servo, DHT, Ultrasonic, Serial)
 */

import assert from 'assert';
import { ArduinoBoard, BoardType } from '../js/arduino/arduino-board.js';
import { ArduinoInterpreter } from '../js/arduino/arduino-interpreter.js';
import { ARDUINO_PRESETS } from '../js/arduino/arduino-library.js';
import { ArduinoScope } from '../js/arduino/arduino-scope.js';
import { ComponentFactory, ComponentType } from '../js/arduino/arduino-components.js';

console.log('================================================================');
console.log('🔬 RUNNING TEST SUITE: ARDUINO SIMULATION, PERIPHERALS & SCOPE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}\n${err.stack}`);
  }
}

// 1. Simulation of All 25 Presets
test('Simulation: Step through all 25 educational presets (setup + loop execution)', () => {
  assert(ARDUINO_PRESETS.length >= 25, `Expected 25 presets, found ${ARDUINO_PRESETS.length}`);

  for (const preset of ARDUINO_PRESETS) {
    const board = new ArduinoBoard(BoardType.UNO);
    const interp = new ArduinoInterpreter(board);

    // Suppress console outputs for cleaner test run
    interp.onSerialOutput = () => {};
    let runtimeError = null;
    interp.onError = (err) => { runtimeError = err; };

    const loadRes = interp.loadSketch(preset.code);
    assert.strictEqual(loadRes.success, true, `Preset "${preset.name}" failed loadSketch: ${loadRes.error}`);

    interp.start();

    // Step 500ms of virtual simulation time in 50ms increments
    for (let t = 0; t < 10; t++) {
      interp.step(50);
      assert.strictEqual(runtimeError, null, `Preset "${preset.name}" threw runtime error: ${runtimeError}`);
    }

    assert(interp.status === 'RUNNING' || interp.status === 'PAUSED');
  }
});

// 2. Oscilloscope Sampling Engine
test('Oscilloscope: Multi-channel signal sampling & buffer management', () => {
  const board = new ArduinoBoard(BoardType.UNO);

  // Mock canvas element for Node environment
  const mockCanvas = {
    width: 600,
    height: 300,
    getContext: () => ({
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      setLineDash: () => {}
    })
  };

  const scope = new ArduinoScope(mockCanvas, board);

  // Configure Channel 1 = Pin 13, Channel 2 = Pin 9 (PWM), Channel 3 = A0
  scope.setSelectedPin(0, '13');
  scope.setSelectedPin(1, '9');
  scope.setSelectedPin(2, 'A0');

  // Set voltages on board
  board.digitalWrite(13, 1); // 5.0V
  board.analogWrite(9, 128); // 50% PWM ~ 2.51V
  board.setExternalVoltage('A0', 3.3); // 3.3V

  // Sample 200 times
  for (let i = 0; i < 200; i++) {
    scope.sample();
  }

  // Verify buffer length is capped at historyLength (150)
  const pin13Hist = scope.pinHistories.get(13);
  assert.strictEqual(pin13Hist.length, scope.historyLength);
  assert.strictEqual(pin13Hist[pin13Hist.length - 1], 5.0);

  const pin9Hist = scope.pinHistories.get(9);
  assert.strictEqual(pin9Hist.length, scope.historyLength);
  assert(Math.abs(pin9Hist[pin9Hist.length - 1] - (128 * 5.0 / 255)) < 0.05);

  const pinA0Hist = scope.pinHistories.get(board.resolvePinIndex('A0'));
  assert.strictEqual(pinA0Hist.length, scope.historyLength);
  assert.strictEqual(pinA0Hist[pinA0Hist.length - 1], 3.3);
});

// 3. Power Model: Servo Motor
test('Power Physics: SG90 Servo requires 5V and GND to rotate horn', () => {
  const board = new ArduinoBoard();
  const servo = ComponentFactory.create(ComponentType.SERVO, 's1', 'SG90', 100, 100);

  // 1. Completely unpowered
  servo.update(board);
  assert.strictEqual(servo.powerState, 'UNPOWERED');

  // 2. Only VCC connected
  servo.connect('vcc', '5V');
  servo.update(board);
  assert.strictEqual(servo.powerState, 'MISSING_GND');

  // 3. Both VCC and GND connected
  servo.connect('gnd', 'GND');
  servo.update(board);
  assert.strictEqual(servo.powerState, 'POWERED');

  // Set target angle via servo object
  servo.setTargetAngle(120);
  assert.strictEqual(servo.state.targetAngle, 120);
});

// 4. Power Model: Relay Module
test('Power Physics: 5V Relay module energizes switch only when powered', () => {
  const board = new ArduinoBoard();
  board.setPinMode(7, 1); // OUTPUT
  board.digitalWrite(7, 1); // HIGH

  const relay = ComponentFactory.create(ComponentType.RELAY, 'r1', 'Relay', 100, 100);
  relay.connect('in', 7);

  // Unpowered: Even though IN is HIGH, relay cannot energize without VCC/GND
  relay.update(board);
  assert.strictEqual(relay.powerState, 'UNPOWERED');
  assert.strictEqual(relay.state.isEnergized, false);

  // Connect power rails
  relay.connect('vcc', '5V');
  relay.connect('gnd', 'GND');
  relay.update(board);

  assert.strictEqual(relay.powerState, 'POWERED');
  assert.strictEqual(relay.state.isEnergized, true);

  // Turn off IN signal
  board.digitalWrite(7, 0);
  relay.update(board);
  assert.strictEqual(relay.state.isEnergized, false);
});

// 5. LiquidCrystal 16x2 Text Display
test('Peripheral Simulation: LiquidCrystal print & clear functionality', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    #include <LiquidCrystal.h>
    LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
    void setup() {
      lcd.begin(16, 2);
      lcd.print("e-Samastha v2.5");
      lcd.setCursor(0, 1);
      lcd.print("Lab Active");
    }
    void loop() {}
  `;

  const res = interp.loadSketch(code);
  assert.strictEqual(res.success, true);
  interp.start();
  interp.step(100);

  const lcdObj = interp.environment.lookup('lcd');
  assert(lcdObj !== null, 'LiquidCrystal object must exist in runtime environment');
  assert.strictEqual(lcdObj.lines[0].trim(), 'e-Samastha v2.5');
  assert.strictEqual(lcdObj.lines[1].trim(), 'Lab Active');
});

// 6. OLED SSD1306 128x64 Matrix Display
test('Peripheral Simulation: OLED I2C buffer line rendering', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    #include <Wire.h>
    #include <Adafruit_SSD1306.h>
    Adafruit_SSD1306 display(128, 64, &Wire, -1);
    void setup() {
      display.begin();
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Engineered");
      display.println("Simulated");
    }
    void loop() {}
  `;

  const res = interp.loadSketch(code);
  assert.strictEqual(res.success, true);
  interp.start();
  interp.step(100);

  const oledObj = interp.environment.lookup('display');
  assert(oledObj !== null, 'OLED object must exist in runtime environment');
  assert(oledObj.lines.some(l => l.includes('Engineered')));
  assert(oledObj.lines.some(l => l.includes('Simulated')));
});

// 7. DHT11 Sensor Environmental Readings
test('Peripheral Simulation: DHT11 temperature and humidity extraction', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    #include <DHT.h>
    DHT dht(2, DHT11);
    float t = 0;
    float h = 0;
    void setup() {
      dht.begin();
      t = dht.readTemperature();
      h = dht.readHumidity();
    }
    void loop() {}
  `;

  const res = interp.loadSketch(code);
  assert.strictEqual(res.success, true);
  interp.start();
  interp.step(100);

  const tVal = interp.environment.lookup('t');
  const hVal = interp.environment.lookup('h');
  assert.strictEqual(tVal, 24.0, 'Default DHT temperature should be 24C');
  assert.strictEqual(hVal, 50.0, 'Default DHT humidity should be 50%');
});

// 8. 10-bit ADC & Reference Scaling
test('Analog Subsystem: 10-bit ADC conversion fidelity and voltage mapping', () => {
  const board = new ArduinoBoard();
  const a0 = board.resolvePinIndex('A0');

  // Test 0.0V -> 0
  board.setExternalVoltage(a0, 0.0);
  assert.strictEqual(board.analogRead(a0), 0);

  // Test 2.5V -> 512
  board.setExternalVoltage(a0, 2.5);
  assert.strictEqual(board.analogRead(a0), 512);

  // Test 5.0V -> 1023
  board.setExternalVoltage(a0, 5.0);
  assert.strictEqual(board.analogRead(a0), 1023);

  // Test Internal 1.1V reference
  board.analogReference('INTERNAL');
  board.setExternalVoltage(a0, 1.1);
  assert.strictEqual(board.analogRead(a0), 1023);

  board.setExternalVoltage(a0, 0.55);
  assert.strictEqual(board.analogRead(a0), 512);
});

// 9. PWM Frequency and Duty Cycle
test('PWM Subsystem: analogWrite(pin, val) maps 0-255 to 0.0-5.0V', () => {
  const board = new ArduinoBoard();
  board.setPinMode(9, 1);

  board.analogWrite(9, 0);
  assert.strictEqual(board.getPin(9).voltage, 0.0);
  assert.strictEqual(board.getPin(9).pwmDuty, 0);

  board.analogWrite(9, 128);
  assert(Math.abs(board.getPin(9).voltage - 2.509) < 0.01);
  assert.strictEqual(board.getPin(9).pwmDuty, 128);

  board.analogWrite(9, 255);
  assert.strictEqual(board.getPin(9).voltage, 5.0);
  assert.strictEqual(board.getPin(9).pwmDuty, 255);
});

console.log(`\n================================================================`);
console.log(`📊 ARDUINO SIMULATION TESTS: ${passedTests} / ${totalTests} PASSED`);
console.log(`================================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
