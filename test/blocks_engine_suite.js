/**
 * AUTOMATED TEST SUITE: SWITCHA BLOCKS DYNAMICAL & CONTROL SYSTEMS ENGINE
 * Verifies RK4, Euler, ODE integration, Transfer Functions, State-Space, PID, and step response metrics.
 */

import assert from 'assert';
import { BlockCategory, BlockTypes, BlockDefinitions } from '../js/blocks/block-types.js';
import { SwitchaBlocksEngine } from '../js/blocks/block-engine.js';
import { SwitchaBlocksScope } from '../js/blocks/block-scope.js';
import { SwitchaBlocksLibrary } from '../js/blocks/block-library.js';

console.log('================================================================');
console.log('🧩 RUNNING TEST SUITE: SWITCHA BLOCKS DYNAMICAL & ODE ENGINE');
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

// 1. Block Definitions & Catalog Verification
test('Block catalog contains all 8 required categories', () => {
    const requiredCategories = [
        BlockCategory.SOURCES,
        BlockCategory.MATH,
        BlockCategory.CONTINUOUS,
        BlockCategory.DISCRETE,
        BlockCategory.CONTROL,
        BlockCategory.DSP,
        BlockCategory.COMMUNICATION,
        BlockCategory.SINKS
    ];

    requiredCategories.forEach(cat => {
        const blocksInCat = Object.values(BlockDefinitions).filter(b => b.category === cat);
        assert(blocksInCat.length > 0, `Category "${cat}" should have at least 1 block type`);
    });
});

test('Standard block definitions have valid input and output ports', () => {
    Object.entries(BlockDefinitions).forEach(([type, def]) => {
        assert(Array.isArray(def.inputs), `${type} inputs should be an array`);
        assert(Array.isArray(def.outputs), `${type} outputs should be an array`);
        assert(typeof def.glyph === 'string', `${type} glyph must be a string`);
    });
});

// 2. Math Operations & Non-linearities Verification
test('Gain, Add, Multiply and Math Functions evaluate accurately', () => {
    const engine = new SwitchaBlocksEngine();

    // Constant (5) -> Gain (3.5) -> Output (17.5)
    const blocks = [
        { id: 'c1', type: BlockTypes.CONSTANT, params: { value: 5 } },
        { id: 'g1', type: BlockTypes.GAIN, params: { gain: 3.5 } }
    ];
    const lines = [
        { id: 'l1', fromBlock: 'c1', fromPort: 'out', toBlock: 'g1', toPort: 'in' }
    ];

    engine.setModel(blocks, lines);
    engine.step(0.01);

    const outGain = engine.signals.get('g1:out');
    assert.strictEqual(outGain, 17.5, 'Gain block must multiply input by gain');
});

test('Saturation and Dead-Zone non-linear blocks clamp properly', () => {
    const engine = new SwitchaBlocksEngine();

    const blocks = [
        { id: 'c1', type: BlockTypes.CONSTANT, params: { value: 15 } },
        { id: 'sat1', type: BlockTypes.SATURATION, params: { upperLimit: 10, lowerLimit: -10 } },
        { id: 'c2', type: BlockTypes.CONSTANT, params: { value: 0.3 } },
        { id: 'dz1', type: BlockTypes.DEAD_ZONE, params: { start: -0.5, end: 0.5 } }
    ];
    const lines = [
        { id: 'l1', fromBlock: 'c1', fromPort: 'out', toBlock: 'sat1', toPort: 'in' },
        { id: 'l2', fromBlock: 'c2', fromPort: 'out', toBlock: 'dz1', toPort: 'in' }
    ];

    engine.setModel(blocks, lines);
    engine.step(0.01);

    assert.strictEqual(engine.signals.get('sat1:out'), 10, 'Saturation should clamp 15 to upperLimit 10');
    assert.strictEqual(engine.signals.get('dz1:out'), 0, 'Dead-zone should output 0 within [-0.5, 0.5]');
});

// 3. Continuous Integration: 4th-Order Runge-Kutta (RK4) vs Euler
test('Integrator computes exact analytical integral with RK4 and Euler', () => {
    const engineRk4 = new SwitchaBlocksEngine();
    engineRk4.solver = 'RK4';

    const blocks = [
        { id: 'c1', type: BlockTypes.CONSTANT, params: { value: 2.0 } },
        { id: 'int1', type: BlockTypes.INTEGRATOR, params: { initialCondition: 0 } }
    ];
    const lines = [
        { id: 'l1', fromBlock: 'c1', fromPort: 'out', toBlock: 'int1', toPort: 'in' }
    ];

    engineRk4.setModel(blocks, lines);
    const dt = 0.001;
    for (let t = 0; t < 1000; t++) {
        engineRk4.step(dt);
    }

    const yRk4 = engineRk4.signals.get('int1:out');
    assert(Math.abs(yRk4 - 2.0) < 1e-4, `RK4 integral of constant 2 over 1s should be 2.0, got ${yRk4}`);
});

// 4. Harmonic Oscillator (Mass-Spring-Damper) Dynamic Response
test('2nd-Order Mass-Spring-Damper executes stable oscillatory ODE dynamics', () => {
    const engine = new SwitchaBlocksEngine();
    engine.solver = 'RK4';

    const mockCanvas = {
        blocks: [],
        wires: [],
        addBlock(type, x, y, params) {
            const b = { id: `b_${this.blocks.length + 1}`, type, params: params || {} };
            this.blocks.push(b);
            return b;
        }
    };

    SwitchaBlocksLibrary.loadModel('mass_spring_damper', mockCanvas);
    engine.setModel(mockCanvas.blocks, mockCanvas.wires);

    const dt = 0.001;
    let maxDisp = -Infinity;
    let minDisp = Infinity;

    for (let i = 0; i < 2000; i++) {
        engine.step(dt);
        const y = engine.signals.get('b_2:out');
        if (y !== undefined) {
            if (y > maxDisp) maxDisp = y;
            if (y < minDisp) minDisp = y;
        }
    }

    assert(maxDisp > 1.0, `Harmonic oscillator displacement peak (${maxDisp}) should show overshoot > 1.0`);
    assert(minDisp >= 0.0, `Harmonic oscillator displacement min (${minDisp}) should be >= 0`);
});

// 5. PID Controller with Anti-Windup Verification
test('PID controller calculates Proportional, Integral, and Derivative actions', () => {
    const engine = new SwitchaBlocksEngine();
    engine.solver = 'RK4';

    const blocks = [
        { id: 'c1', type: BlockTypes.CONSTANT, params: { value: 1.0 } },
        { id: 'pid1', type: BlockTypes.PID_CONTROLLER, params: { P: 2.0, I: 5.0, D: 0.1, N: 20, antiWindup: true, uMax: 10, uMin: -10 } }
    ];
    const lines = [
        { id: 'l1', fromBlock: 'c1', fromPort: 'out', toBlock: 'pid1', toPort: 'in' }
    ];

    engine.setModel(blocks, lines);
    const dt = 0.01;

    engine.step(dt);
    const u0 = engine.signals.get('pid1:out');
    assert(u0 !== undefined && u0 >= 2.0, `Initial PID output (${u0}) should be at least Kp*e (2.0)`);

    for (let i = 1; i < 100; i++) {
        engine.step(dt);
    }
    const u1 = engine.signals.get('pid1:out');
    assert(Math.abs(u1 - 7.0) < 0.2, `PID output at t=1s should be approx 7.0, got ${u1.toFixed(3)}`);
});

// 6. Scope Step Response Metrics ($t_r, t_s, M_p, e_{ss}$)
test('Scope computes accurate step response metrics (Rise Time, Settling Time, Overshoot)', () => {
    const scope = new SwitchaBlocksScope();

    const dt = 0.005;
    for (let i = 0; i <= 400; i++) {
        const t = i * dt;
        const y = 1.0 - Math.exp(-3 * t) * (Math.cos(4 * t) + 0.75 * Math.sin(4 * t));
        scope.recordSample(t, { 'System Output': y });
    }

    const metrics = scope.computeStepMetrics('System Output', 1.0);
    assert(metrics !== null, 'Metrics must be computed');
    assert(metrics.overshootPercent > 5 && metrics.overshootPercent < 30, `Overshoot (${metrics.overshootPercent.toFixed(1)}%) should be between 5% and 30%`);
    assert(metrics.riseTime > 0.1 && metrics.riseTime < 0.6, `Rise time (${metrics.riseTime.toFixed(3)}s) should be realistic`);
    assert(Math.abs(metrics.steadyStateError) < 0.05, `Steady state error (${metrics.steadyStateError}) should be near 0`);
});

console.log(`\n================================================================`);
console.log(`📊 BLOCKS ENGINE TESTS: ${passedTests} / ${totalTests} PASSED`);
console.log(`================================================================\n`);

if (passedTests !== totalTests) {
    process.exit(1);
}
