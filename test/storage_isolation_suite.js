/**
 * AUTOMATED TEST SUITE: STORAGE MULTI-STORE ISOLATION & OFFLINE PERSISTENCE
 * Verifies strict separation between Circuits (.swcirc), Models (.swblock), and Scripts (.swcode).
 */

import assert from 'assert';

// Mock localStorage for node environment
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
console.log('📁 RUNNING TEST SUITE: MULTI-STORE ISOLATION & OFFLINE PERSISTENCE');
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

async function runAsyncTests() {
    const storage = new SwitchaStorageService();

    await test('Saving Circuit only writes to Circuits store and does not pollute Models or Scripts', async () => {
        const testCirc = {
            id: 'test_circ_101',
            name: 'Buck Converter Test',
            components: [{ id: 'c1', type: 'RESISTOR' }],
            wires: [],
            updatedAt: Date.now()
        };

        await storage.saveCircuit(testCirc);

        const circuits = await storage.getCircuits();
        const models = await storage.getModels();
        const scripts = await storage.getScripts();

        assert(circuits.some(c => c.id === 'test_circ_101'), 'Circuit must be saved in circuits store');
        assert(!models.some(m => m.id === 'test_circ_101'), 'Circuit must NOT be in models store');
        assert(!scripts.some(s => s.id === 'test_circ_101'), 'Circuit must NOT be in scripts store');
    });

    await test('Saving Model only writes to Models store and does not pollute Circuits or Scripts', async () => {
        const testModel = {
            id: 'test_model_202',
            name: 'DC Motor Model.swblock',
            blocks: [{ id: 'b1', type: 'PID' }],
            lines: [],
            updatedAt: Date.now()
        };

        await storage.saveModel(testModel);

        const circuits = await storage.getCircuits();
        const models = await storage.getModels();
        const scripts = await storage.getScripts();

        assert(models.some(m => m.id === 'test_model_202'), 'Model must be saved in models store');
        assert(!circuits.some(c => c.id === 'test_model_202'), 'Model must NOT be in circuits store');
        assert(!scripts.some(s => s.id === 'test_model_202'), 'Model must NOT be in scripts store');
    });

    await test('Saving Script only writes to Scripts store and does not pollute Circuits or Models', async () => {
        const testScript = {
            id: 'test_script_303',
            name: 'fft_analysis.swcode',
            content: 'const x = [1, 2, 3]; const X = fft(x);',
            updatedAt: Date.now()
        };

        await storage.saveScript(testScript);

        const circuits = await storage.getCircuits();
        const models = await storage.getModels();
        const scripts = await storage.getScripts();

        assert(scripts.some(s => s.id === 'test_script_303'), 'Script must be saved in scripts store');
        assert(!circuits.some(c => c.id === 'test_script_303'), 'Script must NOT be in circuits store');
        assert(!models.some(m => m.id === 'test_script_303'), 'Script must NOT be in models store');
    });

    await test('Deletion is isolated to target store only', async () => {
        await storage.deleteCircuit('test_circ_101');
        const circuits = await storage.getCircuits();
        const models = await storage.getModels();
        const scripts = await storage.getScripts();

        assert(!circuits.some(c => c.id === 'test_circ_101'), 'Circuit must be deleted');
        assert(models.some(m => m.id === 'test_model_202'), 'Model must remain untouched');
        assert(scripts.some(s => s.id === 'test_script_303'), 'Script must remain untouched');
    });

    console.log(`\n================================================================`);
    console.log(`📊 STORAGE ISOLATION TESTS: ${passedTests} / ${totalTests} PASSED`);
    console.log(`================================================================\n`);

    if (passedTests !== totalTests) {
        process.exit(1);
    }
}

runAsyncTests().catch(err => {
    console.error('Fatal storage test error:', err);
    process.exit(1);
});
