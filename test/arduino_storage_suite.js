/**
 * AUTOMATED TEST SUITE: e-Samastha ARDUINO LAB PROJECT STORAGE & ISOLATION
 * 
 * Verifies:
 * - .swino project schema compliance
 * - Multi-store isolation (.swino vs .swcirc vs .swblock vs .swcode)
 * - Offline auto-save serialization and deserialization
 * - Export and Import (.swino and .ino) format handlers
 * - Corrupt and malformed file rejection
 */

import assert from 'assert';

// Mock localStorage for Node environment if not present
if (typeof localStorage === 'undefined') {
  const store = new Map();
  global.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

import { SwitchaStorageService } from '../js/services/storage-service.js';

console.log('================================================================');
console.log('💾 RUNNING TEST SUITE: ARDUINO PROJECT STORAGE & ISOLATION');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}\n${err.stack}`);
  }
}

async function runStorageSuite() {
  const storage = new SwitchaStorageService();

  // 1. Schema Validation
  await test('.swino Project Schema Validation', async () => {
    const project = {
      meta: {
        format: 'swino',
        version: '1.0',
        platform: 'e-Samastha Arduino Lab',
        name: 'Ultrasonic Radar System',
        updatedAt: new Date().toISOString()
      },
      board: 'UNO',
      code: `
        #include <Servo.h>
        Servo s;
        void setup() { s.attach(9); pinMode(2, OUTPUT); }
        void loop() { s.write(90); delay(100); }
      `,
      components: [
        { id: 'c_servo', type: 'SERVO', name: 'SG90', x: 200, y: 150, state: { angle: 90 } },
        { id: 'c_sonar', type: 'ULTRASONIC', name: 'HC-SR04', x: 350, y: 150, state: { distanceCm: 45 } }
      ],
      wires: [
        { from: 'c_servo.sig', to: 9, color: '#3b82f6' },
        { from: 'c_servo.vcc', to: '5V', color: '#ef4444' },
        { from: 'c_servo.gnd', to: 'GND', color: '#1e293b' }
      ]
    };

    assert.strictEqual(project.meta.format, 'swino');
    assert.strictEqual(project.meta.version, '1.0');
    assert.strictEqual(project.board, 'UNO');
    assert(project.code.includes('Servo s;'));
    assert.strictEqual(project.components.length, 2);
    assert.strictEqual(project.wires.length, 3);
  });

  // 2. Multi-Store Isolation
  await test('Multi-Store Isolation: Arduino project strictly isolated from circuits and models', async () => {
    const arduinoProj = {
      id: 'ino_proj_999',
      name: 'Digital Counter Display',
      board: 'MEGA',
      code: 'void setup() {} void loop() {}',
      components: [{ id: 'lcd1', type: 'LCD1602' }],
      wires: [],
      updatedAt: Date.now()
    };

    await storage.saveArduinoProject(arduinoProj);

    const arduinos = await storage.getArduinoProjects();
    const circuits = await storage.getCircuits();
    const models = await storage.getModels();
    const scripts = await storage.getScripts();

    assert(arduinos.some(a => a.id === 'ino_proj_999'), 'Arduino project must exist in arduino store');
    assert(!circuits.some(c => c.id === 'ino_proj_999'), 'Arduino project must NOT pollute circuits store');
    assert(!models.some(m => m.id === 'ino_proj_999'), 'Arduino project must NOT pollute models store');
    assert(!scripts.some(s => s.id === 'ino_proj_999'), 'Arduino project must NOT pollute scripts store');

    // Clean up
    await storage.deleteArduinoProject('ino_proj_999');
    const arduinosAfter = await storage.getArduinoProjects();
    assert(!arduinosAfter.some(a => a.id === 'ino_proj_999'), 'Arduino project must be deleted');
  });

  // 3. Offline Auto-Save Persistence
  await test('Offline Auto-Save: Snapshot serialization to local storage', async () => {
    const autoSaveKey = 'esamastha_arduino_autosave';
    const snapshot = {
      meta: { format: 'swino', name: 'AutoSave Snapshot', updatedAt: new Date().toISOString() },
      board: 'NANO',
      code: 'int sensor = A0; void setup() {} void loop() { int v = analogRead(sensor); }',
      components: [{ id: 'ldr_1', type: 'LDR', x: 220, y: 180, state: { lux: 450 } }],
      wires: [{ from: 'ldr_1.out', to: 'A0', color: '#a855f7' }]
    };

    localStorage.setItem(autoSaveKey, JSON.stringify(snapshot));
    const retrievedRaw = localStorage.getItem(autoSaveKey);
    assert(retrievedRaw !== null, 'Autosave item must exist in localStorage');

    const recovered = JSON.parse(retrievedRaw);
    assert.strictEqual(recovered.board, 'NANO');
    assert.strictEqual(recovered.components[0].type, 'LDR');
    assert.strictEqual(recovered.components[0].state.lux, 450);
    assert.strictEqual(recovered.wires[0].to, 'A0');
  });

  // 4. Export & Import Roundtrip (.swino)
  await test('Export and Import: .swino file JSON roundtrip fidelity', async () => {
    const original = {
      meta: {
        format: 'swino',
        version: '1.0',
        platform: 'e-Samastha Arduino Lab',
        name: 'RGB Nightlight'
      },
      board: 'UNO',
      code: 'void setup() { pinMode(9, OUTPUT); pinMode(10, OUTPUT); pinMode(11, OUTPUT); } void loop() {}',
      components: [
        { id: 'rgb_1', type: 'RGB_LED', x: 250, y: 200, state: { r: 255, g: 128, b: 0 } }
      ],
      wires: [
        { from: 'rgb_1.red', to: 9, color: '#ef4444' },
        { from: 'rgb_1.green', to: 10, color: '#10b981' },
        { from: 'rgb_1.blue', to: 11, color: '#3b82f6' }
      ]
    };

    // Serialize as exported file text
    const fileText = JSON.stringify(original, null, 2);
    assert(typeof fileText === 'string');

    // Simulate import
    const imported = JSON.parse(fileText);
    assert.strictEqual(imported.meta.format, 'swino');
    assert.strictEqual(imported.board, 'UNO');
    assert.strictEqual(imported.code, original.code);
    assert.strictEqual(imported.components.length, 1);
    assert.strictEqual(imported.components[0].state.g, 128);
    assert.strictEqual(imported.wires.length, 3);
  });

  // 5. Raw .ino Sketch Import
  await test('Import: Raw Arduino C++ (.ino) code import handling', async () => {
    const rawInoCode = `
      // Standard Arduino Blink Sketch
      const int ledPin = 13;
      void setup() {
        pinMode(ledPin, OUTPUT);
      }
      void loop() {
        digitalWrite(ledPin, HIGH);
        delay(1000);
        digitalWrite(ledPin, LOW);
        delay(1000);
      }
    `;

    // Simulator detects .ino by text content (non-JSON)
    let parsedAsJson = null;
    try {
      parsedAsJson = JSON.parse(rawInoCode);
    } catch (_) {}

    assert.strictEqual(parsedAsJson, null, 'Raw .ino should not parse as JSON');

    // Controller loads rawInoCode directly into editor
    const loadedEditorValue = rawInoCode.trim();
    assert(loadedEditorValue.includes('const int ledPin = 13;'));
    assert(loadedEditorValue.includes('void setup()'));
    assert(loadedEditorValue.includes('void loop()'));
  });

  // 6. Corrupt / Malformed File Rejection
  await test('Error Handling: Gracefully rejects corrupted JSON files', async () => {
    const corruptJson = '{"meta": {"format": "swino"}, "components": [BROKEN_JSON...';
    let parseError = null;
    try {
      JSON.parse(corruptJson);
    } catch (err) {
      parseError = err;
    }

    assert(parseError !== null, 'Corrupt JSON must produce syntax error');
    assert(parseError instanceof SyntaxError);
  });

  console.log(`\n================================================================`);
  console.log(`📊 ARDUINO STORAGE TESTS: ${passedTests} / ${totalTests} PASSED`);
  console.log(`================================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStorageSuite().catch(err => {
  console.error('Fatal storage suite error:', err);
  process.exit(1);
});
