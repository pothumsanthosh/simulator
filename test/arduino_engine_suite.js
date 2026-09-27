/**
 * AUTOMATED TEST SUITE: e-Samastha ARDUINO IDE & HARDWARE SIMULATION LAB
 * Verifies ArduinoBoard GPIO & ADC models, AST Tokenizer, Parser,
 * Cooperative Virtual Machine, Peripherals, Components, and Presets.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { ArduinoBoard, PinMode, PinValue, BoardType } from '../js/arduino/arduino-board.js';
import { ArduinoTokenizer, ArduinoParser, ArduinoInterpreter } from '../js/arduino/arduino-interpreter.js';
import { ComponentFactory, LedComponent, PushbuttonComponent, PotentiometerComponent, UltrasonicComponent } from '../js/arduino/arduino-components.js';
import { ARDUINO_PRESETS } from '../js/arduino/arduino-library.js';

console.log('================================================================');
console.log('⚡ RUNNING TEST SUITE: e-Samastha ARDUINO HARDWARE SIMULATION LAB');
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

// ============================================================================
// 1. ARDUINO BOARD & HARDWARE MODEL TESTS
// ============================================================================

test('ArduinoBoard: Pin Map Initialization (UNO)', () => {
  const board = new ArduinoBoard(BoardType.UNO);
  
  // 14 Digital pins (0 - 13)
  for (let i = 0; i <= 13; i++) {
    const pin = board.getPin(i);
    assert(pin !== null, `Digital pin D${i} must exist`);
    assert.strictEqual(pin.isAnalog, false);
    assert.strictEqual(pin.mode, PinMode.INPUT);
    assert.strictEqual(pin.digitalValue, PinValue.LOW);
  }

  // Builtin LED on pin 13
  assert.strictEqual(board.getPin(13).hasBuiltinLed, true);
  assert.strictEqual(board.getPin(12).hasBuiltinLed, false);

  // PWM pins on UNO: 3, 5, 6, 9, 10, 11
  const pwmPins = [3, 5, 6, 9, 10, 11];
  for (let i = 0; i <= 13; i++) {
    const isPwmExpected = pwmPins.includes(i);
    assert.strictEqual(board.getPin(i).isPwm, isPwmExpected, `Pin ${i} PWM mismatch`);
  }

  // 6 Analog pins (A0 - A5, indices 14 - 19)
  for (let a = 0; a <= 5; a++) {
    const pin = board.getPin(`A${a}`);
    assert(pin !== null, `Analog pin A${a} must exist`);
    assert.strictEqual(pin.isAnalog, true);
    assert.strictEqual(pin.name, `A${a}`);
  }

  // Power pins
  assert.strictEqual(board.getPin('5V').voltage, 5.0);
  assert.strictEqual(board.getPin('3.3V').voltage, 3.3);
  assert.strictEqual(board.getPin('GND').voltage, 0.0);
});

test('ArduinoBoard: Pin Key Resolution', () => {
  const board = new ArduinoBoard(BoardType.UNO);
  assert.strictEqual(board.resolvePinIndex(13), 13);
  assert.strictEqual(board.resolvePinIndex('13'), 13);
  assert.strictEqual(board.resolvePinIndex('D13'), 13);
  assert.strictEqual(board.resolvePinIndex('A0'), 14);
  assert.strictEqual(board.resolvePinIndex('A5'), 19);
  assert.strictEqual(board.resolvePinIndex('GND'), 'GND');
  assert.strictEqual(board.resolvePinIndex('5V'), '5V');
});

test('ArduinoBoard: Digital Write and Read', () => {
  const board = new ArduinoBoard();
  board.setPinMode(13, PinMode.OUTPUT);
  
  board.digitalWrite(13, PinValue.HIGH);
  assert.strictEqual(board.digitalRead(13), PinValue.HIGH);
  assert.strictEqual(board.getPin(13).voltage, 5.0);

  board.digitalWrite(13, PinValue.LOW);
  assert.strictEqual(board.digitalRead(13), PinValue.LOW);
  assert.strictEqual(board.getPin(13).voltage, 0.0);
});

test('ArduinoBoard: Analog Write (PWM) & Analog Read (ADC)', () => {
  const board = new ArduinoBoard();
  
  // PWM write on pin 9
  board.setPinMode(9, PinMode.OUTPUT);
  board.analogWrite(9, 128); // ~50% duty cycle
  assert.strictEqual(board.getPin(9).pwmDuty, 128);
  assert(Math.abs(board.getPin(9).voltage - 2.51) < 0.1, `Voltage should be ~2.5V, got ${board.getPin(9).voltage}`);

  // Analog Read on A0 with external voltage
  board.setExternalVoltage('A0', 2.5);
  const adcVal = board.analogRead('A0');
  assert(Math.abs(adcVal - 512) <= 2, `ADC at 2.5V should be ~511-512, got ${adcVal}`);

  board.setExternalVoltage('A0', 5.0);
  assert.strictEqual(board.analogRead('A0'), 1023);

  board.setExternalVoltage('A0', 0.0);
  assert.strictEqual(board.analogRead('A0'), 0);
});

test('ArduinoBoard: External Stimulus & Listeners', () => {
  const board = new ArduinoBoard();
  let eventFired = false;
  let eventData = null;

  const unsub = board.subscribe((event, data) => {
    eventFired = true;
    eventData = data;
  });

  board.setExternalDigital(2, PinValue.HIGH);
  assert.strictEqual(eventFired, true);
  assert.strictEqual(board.digitalRead(2), PinValue.HIGH);

  unsub();
});

test('ArduinoBoard: Board Reset', () => {
  const board = new ArduinoBoard();
  board.setPinMode(13, PinMode.OUTPUT);
  board.digitalWrite(13, PinValue.HIGH);
  assert.strictEqual(board.digitalRead(13), PinValue.HIGH);

  board.reset();
  assert.strictEqual(board.getPin(13).mode, PinMode.INPUT);
  assert.strictEqual(board.getPin(13).digitalValue, PinValue.LOW);
});

// ============================================================================
// 2. TOKENIZER & PARSER TESTS
// ============================================================================

test('Tokenizer: Literals, Preprocessor & Operators', () => {
  const code = `
    #define LED_PIN 13
    #include <Servo.h>
    int x = 42;
    float y = 3.14;
    char c = 'A';
    String s = "Hello";
    bool b = true;
    x += 1;
  `;
  const tokenizer = new ArduinoTokenizer(code);
  const tokens = tokenizer.tokenize();

  const values = tokens.map(t => t.value);
  assert(values.includes('x'));
  assert(values.includes(42));
  assert(values.includes(3.14));
  assert(values.includes('Hello'));
  assert(values.includes('+='));
  assert.strictEqual(tokenizer.defines.get('LED_PIN'), '13');
});

test('Parser: Function & Variable Declarations', () => {
  const code = `
    int globalVar = 100;
    int add(int a, int b) {
      return a + b;
    }
    void setup() {
      pinMode(13, OUTPUT);
    }
    void loop() {
      globalVar = add(globalVar, 1);
    }
  `;
  const tokenizer = new ArduinoTokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new ArduinoParser(tokens);
  const ast = parser.parse();

  assert.strictEqual(ast.type, 'Program');
  assert.strictEqual(ast.body.length, 4);
  assert.strictEqual(ast.body[0].type, 'VariableDeclaration');
  assert.strictEqual(ast.body[1].type, 'FunctionDeclaration');
  assert.strictEqual(ast.body[1].name, 'add');
  assert.strictEqual(ast.body[1].params.length, 2);
  assert.strictEqual(ast.body[2].name, 'setup');
  assert.strictEqual(ast.body[3].name, 'loop');
});

test('Parser: Control Flow (if-else, while, for, switch-case)', () => {
  const code = `
    void testFlow() {
      if (x > 0) {
        x--;
      } else {
        x++;
      }
      while (x < 10) {
        x++;
        if (x == 5) break;
      }
      for (int i = 0; i < 5; i++) {
        x += i;
      }
      switch (x) {
        case 1: x = 10; break;
        default: x = 0;
      }
    }
  `;
  const tokenizer = new ArduinoTokenizer(code);
  const parser = new ArduinoParser(tokenizer.tokenize());
  const ast = parser.parse();

  const fn = ast.body[0];
  assert.strictEqual(fn.name, 'testFlow');
  assert.strictEqual(fn.body.body[0].type, 'IfStatement');
  assert.strictEqual(fn.body.body[1].type, 'WhileStatement');
  assert.strictEqual(fn.body.body[2].type, 'ForStatement');
  assert.strictEqual(fn.body.body[3].type, 'SwitchStatement');
});

// ============================================================================
// 3. COOPERATIVE VIRTUAL MACHINE & RUNTIME TESTS
// ============================================================================

test('Interpreter: Sequential setup() & loop() execution', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    int state = 0;
    void setup() {
      state = 1;
    }
    void loop() {
      state++;
    }
  `;

  interp.loadSketch(code);
  assert.strictEqual(interp.status, 'IDLE');
  interp.start();
  assert.strictEqual(interp.status, 'RUNNING');

  interp.step(10); // runs setup() -> state = 1
  assert.strictEqual(interp.globalScope.lookup('state'), 1);

  interp.step(10); // runs loop() iteration 1 -> state = 2
  assert.strictEqual(interp.globalScope.lookup('state'), 2);

  interp.step(10); // runs loop() iteration 2 -> state = 3
  assert.strictEqual(interp.globalScope.lookup('state'), 3);
});

test('Interpreter: Non-blocking delay() cooperative yield', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    const int pin = 13;
    void setup() {
      pinMode(pin, OUTPUT);
    }
    void loop() {
      digitalWrite(pin, HIGH);
      delay(200);
      digitalWrite(pin, LOW);
      delay(200);
    }
  `;

  interp.loadSketch(code);
  interp.start();
  interp.step(10); // setup()
  interp.step(10); // starts loop(), sets pin HIGH, hits delay(200)

  assert.strictEqual(board.getPin(13).digitalValue, PinValue.HIGH);

  // Advance 100ms (still within delay)
  interp.step(100);
  assert.strictEqual(board.getPin(13).digitalValue, PinValue.HIGH);

  // Advance 150ms (crosses delay boundary)
  interp.step(150);
  assert.strictEqual(board.getPin(13).digitalValue, PinValue.LOW);
});

test('Interpreter: Custom Function Calls & Recursion/Math', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    int compute(int val) {
      int mapped = map(val, 0, 100, 0, 1000);
      int clamped = constrain(mapped, 200, 800);
      return clamped;
    }
    int result = 0;
    void setup() {
      result = compute(50); // map(50) = 500, clamped = 500
    }
    void loop() {}
  `;

  interp.loadSketch(code);
  interp.start();
  interp.step(10);

  assert.strictEqual(interp.globalScope.lookup('result'), 500);
});

test('Interpreter: Serial Peripheral Output & Input', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const logs = [];
  interp.onSerialOutput = (text, nl) => logs.push({ text, nl });

  const code = `
    void setup() {
      Serial.begin(9600);
      Serial.println("System Ready");
    }
    void loop() {
      if (Serial.available() > 0) {
        int cmd = Serial.read();
        Serial.print("Received: ");
        Serial.println(cmd);
      }
    }
  `;

  interp.loadSketch(code);
  interp.start();
  interp.step(10); // setup()

  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].text, 'System Ready');

  // Push serial input 'A' (ASCII 65)
  interp.sendSerialInput('A');
  interp.step(10); // loop() reads 'A'

  assert.strictEqual(logs[1].text, 'Received: ');
  assert.strictEqual(logs[2].text, '65');
});

test('Interpreter: Servo Peripheral Simulation', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  const code = `
    #include <Servo.h>
    Servo s;
    void setup() {
      s.attach(9);
      s.write(45);
    }
    void loop() {}
  `;

  interp.loadSketch(code);
  interp.start();
  interp.step(10);

  const servo = interp.globalScope.lookup('s');
  assert(servo !== undefined);
  assert.strictEqual(servo.attached(), true);
  assert.strictEqual(servo.read(), 45);
  assert.strictEqual(board.getPin(9).mode, PinMode.OUTPUT);
});

test('Interpreter: LiquidCrystal Peripheral Simulation', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  let lcdDisplay = null;
  board.subscribe((event, data) => {
    if (event === 'lcdUpdate') {
      lcdDisplay = data.lines;
    }
  });

  const code = `
    #include <LiquidCrystal.h>
    LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
    void setup() {
      lcd.begin(16, 2);
      lcd.print("e-Samastha");
    }
    void loop() {}
  `;

  interp.loadSketch(code);
  interp.start();
  interp.step(10);

  assert(lcdDisplay !== null);
  assert(lcdDisplay[0].startsWith('e-Samastha'), `Expected 'e-Samastha', got '${lcdDisplay[0]}'`);
});

// ============================================================================
// 4. HARDWARE COMPONENTS & SENSORS
// ============================================================================

test('Component Models: LED Illumination via Voltage', () => {
  const board = new ArduinoBoard();
  const led = ComponentFactory.create('LED', 'led1', 'Test LED');
  led.connect('anode', 13);
  led.connect('cathode', 'GND');

  // Low voltage -> OFF
  board.digitalWrite(13, PinValue.LOW);
  led.update(board);
  assert.strictEqual(led.state.isOn, false);
  assert.strictEqual(led.state.brightness, 0.0);

  // High voltage -> ON
  board.digitalWrite(13, PinValue.HIGH);
  led.update(board);
  assert.strictEqual(led.state.isOn, true);
  assert(led.state.brightness > 0.5);
});

test('Component Models: Pushbutton Stimulus', () => {
  const board = new ArduinoBoard();
  board.setPinMode(2, PinMode.INPUT_PULLUP);
  const btn = ComponentFactory.create('BUTTON', 'btn1', 'Test Button');
  btn.connect('pin1', 2);
  btn.connect('pin2', 'GND');

  // Unpressed
  btn.setPressed(false, board);
  assert.strictEqual(board.digitalRead(2), PinValue.HIGH);

  // Pressed
  btn.setPressed(true, board);
  assert.strictEqual(board.digitalRead(2), PinValue.LOW);
});

test('Component Models: Potentiometer Voltage Ratio', () => {
  const board = new ArduinoBoard();
  const pot = ComponentFactory.create('POTENTIOMETER', 'pot1', 'Pot 10k');
  pot.connect('vcc', '5V');
  pot.connect('wiper', 'A0');
  pot.connect('gnd', 'GND');

  pot.setValue(0.5, board);
  assert.strictEqual(board.getPin('A0').voltage, 2.5);
  assert.strictEqual(board.analogRead('A0'), 512);

  pot.setValue(1.0, board);
  assert.strictEqual(board.getPin('A0').voltage, 5.0);
  assert.strictEqual(board.analogRead('A0'), 1023);
});

test('Component Models: Ultrasonic Sensor Pulse Calculation', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);
  const ultra = ComponentFactory.create('ULTRASONIC', 'ultra1', 'HC-SR04');
  ultra.connect('trig', 9);
  ultra.connect('echo', 10);

  ultra.setDistance(10, interp); // 10 cm
  const pulseFn = interp.pulseInSensors.get(10);
  assert(pulseFn !== undefined, 'Pulse provider must be registered on pin 10');
  assert.strictEqual(pulseFn(), 580); // 10 * 58us

  ultra.setDistance(50, interp); // 50 cm
  assert.strictEqual(pulseFn(), 2900); // 50 * 58us
});

// ============================================================================
// 5. ALL 10 PRESETS COMPILATION VERIFICATION
// ============================================================================

test('Preset Sketches: Verify All 25 Presets Compile Without Error', () => {
  const board = new ArduinoBoard();
  const interp = new ArduinoInterpreter(board);

  assert(ARDUINO_PRESETS.length >= 25, `Expected at least 25 presets, got ${ARDUINO_PRESETS.length}`);

  for (const preset of ARDUINO_PRESETS) {
    const result = interp.compile(preset.code);
    assert.strictEqual(result.success, true, `Preset "${preset.name}" failed compilation: ${result.error}`);
    assert(result.ast !== null, `Preset "${preset.name}" must produce valid AST`);
  }
});

// ============================================================================
// 6. ZERO EVAL & ZERO NEW FUNCTION SECURITY AUDIT
// ============================================================================

test('Security Audit: Strictly 0 eval() and 0 new Function() in Arduino Engine', () => {
  const dir = path.resolve('js/arduino');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    // Strip comments
    const stripped = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    assert(!/\beval\s*\(/.test(stripped), `Prohibited eval() detected in ${file}`);
    assert(!/new\s+Function\s*\(/.test(stripped), `Prohibited new Function() detected in ${file}`);
  }
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
}
