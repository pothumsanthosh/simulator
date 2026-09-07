/**
 * SWITCHA CODE — SCIENTIFIC CODE IDE, REPL CONSOLE & SCRIPT RUNTIME
 * Professional interactive MATLAB / Python NumPy style programming environment.
 */

class SwitchaCodeEditor {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        this.engine = new SwitchaCodeEngine();
        this.plotter = null;
        this.history = [];
        this.historyIdx = -1;
        this.activeScript = {
            id: 'scratch',
            name: 'untitled_script.swcode',
            content: this.getDefaultScript()
        };

        this.initDOM();
    }

    getDefaultScript() {
        return `// ==========================================================
// 🚀 SWITCHA CODE — SCIENTIFIC COMPUTING & DSP SIMULATION
// Try running this script with [Ctrl + Enter] or the Run button
// ==========================================================

// 1. Time vector & Signal Generation
const Fs = 10000;              // Sampling frequency: 10 kHz
const t = linspace(0, 0.05, 500); // 50ms duration
const f1 = 120, f2 = 800;      // Frequencies

// 2. Pure multi-tone signal + Gaussian Noise
const sig = add(sin(mul(2 * Math.PI * f1, t)), mul(0.5, cos(mul(2 * Math.PI * f2, t))));
const noisySig = awgn(sig, 12); // Add AWGN (SNR = 12 dB)

// 3. Compute 512-point Fast Fourier Transform (FFT)
const N = 512;
const X = fft(noisySig.slice(0, N));
const fAxis = linspace(0, Fs / 2, N / 2);
const magSpectrum = X.mag.slice(0, N / 2);

// 4. Multi-Pane Scientific Visualization
clf();

// Subplot 1: Time Domain Waveform
subplot(2, 1, 1);
plot(mul(t, 1000), noisySig, { color: '#00ffcc', label: 'Noisy Signal' });
hold(true);
plot(mul(t, 1000), sig, { color: '#ff007f', lineWidth: 2.5, label: 'Clean Signal' });
title('Time-Domain Signal (120 Hz + 800 Hz + AWGN)');
xlabel('Time (ms)');
ylabel('Amplitude (V)');
legend('Noisy', 'Clean');

// Subplot 2: Frequency Spectrum (FFT)
subplot(2, 1, 2);
stem(fAxis, magSpectrum, { color: '#38bdf8' });
title('Single-Sided FFT Amplitude Spectrum');
xlabel('Frequency (Hz)');
ylabel('|X(f)|');
xlim([0, 2000]);

disp("✅ Simulation finished! Total samples: " + t.length);
`;
    }

    initDOM() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'row';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#0b0f19';
        this.container.style.color = '#e2e8f0';
        this.container.style.overflow = 'hidden';

        // Left: Code Editor & REPL Console Pane (50%)
        const leftPane = document.createElement('div');
        leftPane.style.flex = '1';
        leftPane.style.display = 'flex';
        leftPane.style.flexDirection = 'column';
        leftPane.style.borderRight = '1px solid #1f2937';
        leftPane.style.minWidth = '320px';

        // Code Editor Toolbar
        const editorToolbar = document.createElement('div');
        editorToolbar.className = 'code-toolbar';
        editorToolbar.style.display = 'flex';
        editorToolbar.style.alignItems = 'center';
        editorToolbar.style.gap = '8px';
        editorToolbar.style.padding = '8px 12px';
        editorToolbar.style.backgroundColor = '#111827';
        editorToolbar.style.borderBottom = '1px solid #1f2937';
        editorToolbar.style.fontSize = '12px';

        editorToolbar.innerHTML = `
            <button id="codeBtnRun" style="background:#059669; color:#fff; border:none; padding:4px 12px; border-radius:4px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;">▶ Run Script</button>
            <button id="codeBtnClearCons" style="background:#1f2937; color:#9ca3af; border:1px solid #374151; padding:4px 8px; border-radius:4px; cursor:pointer;">Clear Console</button>
            <select id="codeTemplateSelect" style="background:#1f2937; color:#38bdf8; border:1px solid #374151; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">
                <option value="">⚡ Load Template Script...</option>
                <option value="dsp_fft">1. Signal Processing & FFT Spectrum</option>
                <option value="rc_bode">2. Transfer Function & Bode Response</option>
                <option value="qpsk_comm">3. QPSK Modulation & Constellation</option>
                <option value="ode_rlc">4. State-Space ODE45 Dynamic RLC</option>
                <option value="matrix_eig">5. Linear Algebra & Eigenvalues</option>
            </select>
            <span style="flex:1;"></span>
            <span id="codeScriptName" style="color:#94a3b8; font-family:monospace;">untitled_script.swcode</span>
            <button id="codeBtnSave" style="background:#1f2937; color:#00ffcc; border:1px solid #374151; padding:4px 8px; border-radius:4px; cursor:pointer;">💾 Save</button>
        `;
        leftPane.appendChild(editorToolbar);

        // Editor Area
        const editorArea = document.createElement('div');
        editorArea.style.flex = '3';
        editorArea.style.position = 'relative';
        editorArea.style.display = 'flex';
        editorArea.style.backgroundColor = '#0d1117';

        // Line Numbers
        const lineNumbers = document.createElement('div');
        lineNumbers.id = 'codeLineNumbers';
        lineNumbers.style.width = '42px';
        lineNumbers.style.padding = '10px 4px';
        lineNumbers.style.textAlign = 'right';
        lineNumbers.style.color = '#4b5563';
        lineNumbers.style.fontFamily = 'monospace';
        lineNumbers.style.fontSize = '13px';
        lineNumbers.style.lineHeight = '20px';
        lineNumbers.style.userSelect = 'none';
        lineNumbers.style.backgroundColor = '#0b0f19';
        lineNumbers.style.borderRight = '1px solid #1f2937';
        editorArea.appendChild(lineNumbers);

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'codeTextarea';
        textarea.style.flex = '1';
        textarea.style.padding = '10px';
        textarea.style.backgroundColor = 'transparent';
        textarea.style.color = '#e6edf3';
        textarea.style.fontFamily = '"Fira Code", "Consolas", "Courier New", monospace';
        textarea.style.fontSize = '13px';
        textarea.style.lineHeight = '20px';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.whiteSpace = 'pre';
        textarea.style.overflowWrap = 'normal';
        textarea.style.overflowX = 'auto';
        textarea.value = this.activeScript.content;
        textarea.spellcheck = false;
        editorArea.appendChild(textarea);
        leftPane.appendChild(editorArea);

        // REPL Output Console
        const consolePane = document.createElement('div');
        consolePane.style.flex = '2';
        consolePane.style.display = 'flex';
        consolePane.style.flexDirection = 'column';
        consolePane.style.borderTop = '2px solid #1f2937';
        consolePane.style.backgroundColor = '#0b0f19';

        const consoleHeader = document.createElement('div');
        consoleHeader.style.padding = '4px 10px';
        consoleHeader.style.fontSize = '11px';
        consoleHeader.style.color = '#94a3b8';
        consoleHeader.style.backgroundColor = '#111827';
        consoleHeader.style.fontWeight = '600';
        consoleHeader.textContent = '📟 REPL Interactive Output Console';
        consolePane.appendChild(consoleHeader);

        const consoleLog = document.createElement('div');
        consoleLog.id = 'codeConsoleLog';
        consoleLog.style.flex = '1';
        consoleLog.style.overflowY = 'auto';
        consoleLog.style.padding = '8px 10px';
        consoleLog.style.fontFamily = 'monospace';
        consoleLog.style.fontSize = '12px';
        consoleLog.style.lineHeight = '18px';
        consoleLog.style.color = '#38bdf8';
        consolePane.appendChild(consoleLog);

        const replInputBox = document.createElement('div');
        replInputBox.style.display = 'flex';
        replInputBox.style.borderTop = '1px solid #1f2937';
        replInputBox.style.padding = '4px 8px';
        replInputBox.style.alignItems = 'center';
        replInputBox.style.backgroundColor = '#111827';

        const replPrompt = document.createElement('span');
        replPrompt.style.color = '#00ffcc';
        replPrompt.style.fontWeight = 'bold';
        replPrompt.style.marginRight = '6px';
        replPrompt.style.fontFamily = 'monospace';
        replPrompt.textContent = '>>';
        replInputBox.appendChild(replPrompt);

        const replInput = document.createElement('input');
        replInput.id = 'codeReplInput';
        replInput.type = 'text';
        replInput.placeholder = 'Type expression or command e.g. eig([[1,2],[3,4]])';
        replInput.style.flex = '1';
        replInput.style.backgroundColor = 'transparent';
        replInput.style.border = 'none';
        replInput.style.outline = 'none';
        replInput.style.color = '#f8fafc';
        replInput.style.fontFamily = 'monospace';
        replInput.style.fontSize = '12px';
        replInputBox.appendChild(replInput);
        consolePane.appendChild(replInputBox);

        leftPane.appendChild(consolePane);
        this.container.appendChild(leftPane);

        // Right Pane: SwitchaPlot Canvas & Workspace Variables (50%)
        const rightPane = document.createElement('div');
        rightPane.style.flex = '1';
        rightPane.style.display = 'flex';
        rightPane.style.flexDirection = 'column';
        rightPane.style.minWidth = '320px';

        // Top: Plotter Container
        const plotContainer = document.createElement('div');
        plotContainer.id = 'codePlotArea';
        plotContainer.style.flex = '3';
        plotContainer.style.position = 'relative';
        plotContainer.style.width = '100%';
        plotContainer.style.height = '100%';
        rightPane.appendChild(plotContainer);

        // Bottom: Workspace Variables Table
        const varPane = document.createElement('div');
        varPane.style.flex = '1';
        varPane.style.display = 'flex';
        varPane.style.flexDirection = 'column';
        varPane.style.borderTop = '2px solid #1f2937';
        varPane.style.backgroundColor = '#0f172a';

        const varHeader = document.createElement('div');
        varHeader.style.padding = '4px 10px';
        varHeader.style.fontSize = '11px';
        varHeader.style.color = '#94a3b8';
        varHeader.style.backgroundColor = '#111827';
        varHeader.style.fontWeight = '600';
        varHeader.textContent = '📋 Workspace Variables';
        varPane.appendChild(varHeader);

        const varTableContainer = document.createElement('div');
        varTableContainer.id = 'codeVarTable';
        varTableContainer.style.flex = '1';
        varTableContainer.style.overflowY = 'auto';
        varTableContainer.style.fontSize = '11px';
        varTableContainer.style.fontFamily = 'monospace';
        varPane.appendChild(varTableContainer);

        rightPane.appendChild(varPane);
        this.container.appendChild(rightPane);

        // Instantiate SwitchaPlotter
        this.plotter = new SwitchaPlotter(plotContainer);

        // Bind Events
        this.bindEvents(textarea, lineNumbers, consoleLog, replInput);
        this.updateLineNumbers(textarea, lineNumbers);
    }

    bindEvents(textarea, lineNumbers, consoleLog, replInput) {
        textarea.addEventListener('input', () => {
            this.updateLineNumbers(textarea, lineNumbers);
            this.activeScript.content = textarea.value;
        });

        textarea.addEventListener('scroll', () => {
            lineNumbers.scrollTop = textarea.scrollTop;
        });

        // Tab key and Ctrl+Enter support
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                this.updateLineNumbers(textarea, lineNumbers);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.runScript();
            }
        });

        // Run Button
        const runBtn = this.container.querySelector('#codeBtnRun');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runScript());
        }

        // Clear Console
        const clearBtn = this.container.querySelector('#codeBtnClearCons');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                consoleLog.innerHTML = '';
            });
        }

        // Template Selector
        const tmplSelect = this.container.querySelector('#codeTemplateSelect');
        if (tmplSelect) {
            tmplSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (!val) return;
                this.loadTemplate(val);
                e.target.value = '';
            });
        }

        // Save Script
        const saveBtn = this.container.querySelector('#codeBtnSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveScript());
        }

        // REPL Input
        replInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = replInput.value.trim();
                if (cmd) {
                    this.history.push(cmd);
                    this.historyIdx = this.history.length;
                    this.executeREPL(cmd);
                    replInput.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                if (this.historyIdx > 0) {
                    this.historyIdx--;
                    replInput.value = this.history[this.historyIdx] || '';
                }
            } else if (e.key === 'ArrowDown') {
                if (this.historyIdx < this.history.length - 1) {
                    this.historyIdx++;
                    replInput.value = this.history[this.historyIdx] || '';
                } else {
                    this.historyIdx = this.history.length;
                    replInput.value = '';
                }
            }
        });
    }

    updateLineNumbers(textarea, lineNumbers) {
        const lines = textarea.value.split('\n').length;
        let numStr = '';
        for (let i = 1; i <= lines; i++) {
            numStr += i + '<br>';
        }
        lineNumbers.innerHTML = numStr;
    }

    appendConsole(text, type = 'log') {
        const consoleLog = this.container.querySelector('#codeConsoleLog');
        if (!consoleLog) return;

        const row = document.createElement('div');
        row.style.whiteSpace = 'pre-wrap';
        row.style.wordBreak = 'break-word';
        row.style.marginBottom = '2px';

        if (type === 'error') {
            row.style.color = '#ef4444';
            row.textContent = '✖ ' + text;
        } else if (type === 'cmd') {
            row.style.color = '#00ffcc';
            row.textContent = '>> ' + text;
        } else if (type === 'res') {
            row.style.color = '#a5b4fc';
            row.textContent = text;
        } else {
            row.style.color = '#e2e8f0';
            row.textContent = text;
        }

        consoleLog.appendChild(row);
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    executeREPL(cmd) {
        this.appendConsole(cmd, 'cmd');
        try {
            const res = this.engine.run(cmd, {
                plotter: this.plotter,
                onPrint: (msg) => this.appendConsole(msg, 'log'),
                onError: (err) => this.appendConsole(err, 'error')
            });

            if (res.error) {
                this.appendConsole(res.error, 'error');
            } else if (res.result !== undefined) {
                this.appendConsole(this.formatResult(res.result), 'res');
            }
            this.updateWorkspaceVariables();
        } catch (err) {
            this.appendConsole(err.message, 'error');
        }
    }

    runScript() {
        const textarea = this.container.querySelector('#codeTextarea');
        const code = textarea ? textarea.value : '';
        this.appendConsole(`▶ Executing script: ${this.activeScript.name}...`, 'cmd');

        try {
            const res = this.engine.run(code, {
                plotter: this.plotter,
                onPrint: (msg) => this.appendConsole(msg, 'log'),
                onError: (err) => this.appendConsole(err, 'error')
            });

            if (res.error) {
                this.appendConsole(res.error, 'error');
            } else {
                this.appendConsole('✔ Script executed successfully.', 'log');
            }
            this.updateWorkspaceVariables();
        } catch (err) {
            this.appendConsole(err.message, 'error');
        }
    }

    formatResult(res) {
        if (res === null) return 'null';
        if (res === undefined) return '';
        if (typeof res === 'number') return String(res);
        if (typeof res === 'string') return `"${res}"`;
        if (Array.isArray(res) || res instanceof Float64Array) {
            if (res.length > 0 && Array.isArray(res[0])) {
                // 2D Matrix display
                return res.map(row => '[' + Array.from(row).map(v => typeof v === 'number' ? v.toFixed(3) : String(v)).join(', ') + ']').join('\n');
            }
            return '[' + Array.from(res).slice(0, 20).map(v => typeof v === 'number' ? v.toFixed(3) : String(v)).join(', ') + (res.length > 20 ? ' ...]' : ']');
        }
        if (typeof res === 'object') {
            return JSON.stringify(res, null, 2);
        }
        return String(res);
    }

    updateWorkspaceVariables() {
        const varTable = this.container.querySelector('#codeVarTable');
        if (!varTable) return;

        const vars = this.engine.getWorkspaceVariables();
        if (Object.keys(vars).length === 0) {
            varTable.innerHTML = '<div style="padding:10px; color:#4b5563; text-align:center;">No variables in workspace</div>';
            return;
        }

        let html = `<table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
                <tr style="border-bottom:1px solid #1f2937; color:#94a3b8;">
                    <th style="padding:4px 8px;">Name</th>
                    <th style="padding:4px 8px;">Type</th>
                    <th style="padding:4px 8px;">Size</th>
                    <th style="padding:4px 8px;">Value</th>
                </tr>
            </thead>
            <tbody>`;

        for (const [name, val] of Object.entries(vars)) {
            let type = typeof val;
            let size = '1x1';
            let preview = '';

            if (Array.isArray(val) || val instanceof Float64Array) {
                type = 'array';
                if (Array.isArray(val[0])) {
                    size = `${val.length}x${val[0].length}`;
                    preview = `[Matrix ${size}]`;
                } else {
                    size = `1x${val.length}`;
                    preview = `[${val.slice(0, 3).map(v => typeof v === 'number' ? v.toFixed(2) : String(v)).join(', ')}${val.length > 3 ? '...' : ''}]`;
                }
            } else if (typeof val === 'number') {
                preview = Number.isInteger(val) ? String(val) : val.toFixed(4);
            } else if (typeof val === 'string') {
                preview = `"${val.slice(0, 15)}"`;
            } else {
                preview = Object.prototype.toString.call(val);
            }

            html += `<tr style="border-bottom:1px solid #111827; color:#cbd5e1;">
                <td style="padding:4px 8px; color:#00ffcc;">${name}</td>
                <td style="padding:4px 8px; color:#94a3b8;">${type}</td>
                <td style="padding:4px 8px; color:#94a3b8;">${size}</td>
                <td style="padding:4px 8px; color:#e2e8f0;">${preview}</td>
            </tr>`;
        }

        html += '</tbody></table>';
        varTable.innerHTML = html;
    }

    async saveScript() {
        const textarea = this.container.querySelector('#codeTextarea');
        const content = textarea ? textarea.value : '';
        const name = prompt('Enter script name:', this.activeScript.name) || this.activeScript.name;

        const scriptDoc = {
            id: this.activeScript.id === 'scratch' ? `script_${Date.now()}` : this.activeScript.id,
            name: name.endsWith('.swcode') ? name : name + '.swcode',
            content,
            updatedAt: Date.now()
        };

        if (window.SwitchaStorage) {
            await window.SwitchaStorage.saveScript(scriptDoc);
            this.activeScript = scriptDoc;
            const nameEl = this.container.querySelector('#codeScriptName');
            if (nameEl) nameEl.textContent = scriptDoc.name;
            this.appendConsole(`💾 Script saved locally to My Scripts: ${scriptDoc.name}`, 'log');
        }
    }

    loadTemplate(tmplId) {
        const textarea = this.container.querySelector('#codeTextarea');
        const lineNumbers = this.container.querySelector('#codeLineNumbers');
        if (!textarea) return;

        let code = '';
        if (tmplId === 'dsp_fft') {
            code = this.getDefaultScript();
        } else if (tmplId === 'rc_bode') {
            code = `// ==========================================================
// 📈 2ND-ORDER LOW-PASS FILTER BODE FREQUENCY RESPONSE
// ==========================================================
const R = 1000;    // 1 kOhm
const C = 1e-6;    // 1 uF
const fc = 1 / (2 * Math.PI * R * C); // ~159.15 Hz

disp("Cutoff Frequency fc = " + fc.toFixed(2) + " Hz");

// Frequency range from 1 Hz to 10 kHz (log-spaced)
const freq = logspace(0, 4, 300);
const magDb = [];
const phaseDeg = [];

for (let i = 0; i < freq.length; i++) {
    const f = freq[i];
    const w = 2 * Math.PI * f;
    // H(s) = 1 / (1 + j * w * R * C)
    const denomRe = 1;
    const denomIm = w * R * C;
    const mag = 1 / Math.sqrt(denomRe * denomRe + denomIm * denomIm);
    const phase = -Math.atan2(denomIm, denomRe) * (180 / Math.PI);
    
    magDb.push(20 * Math.log10(mag));
    phaseDeg.push(phase);
}

// Render Dual-Pane Bode Plot
bode(freq, magDb, phaseDeg);
disp("✅ Bode diagram plotted!");
`;
        } else if (tmplId === 'qpsk_comm') {
            code = `// ==========================================================
// 📡 QPSK DIGITAL MODULATION & AWGN CONSTELLATION
// ==========================================================
const numSymbols = 1200;
const symbols = [];
const constellationRef = [
    { re: 1, im: 1 },
    { re: -1, im: 1 },
    { re: -1, im: -1 },
    { re: 1, im: -1 }
];

// Generate random QPSK symbols + AWGN Channel Noise
const snrDb = 15;
const noiseStd = Math.sqrt(1 / (2 * Math.pow(10, snrDb / 10)));

for (let i = 0; i < numSymbols; i++) {
    const symIdx = Math.floor(Math.random() * 4);
    const ref = constellationRef[symIdx];
    
    // Add complex Gaussian noise
    const noiseI = noiseStd * (Math.random() - 0.5) * 2;
    const noiseQ = noiseStd * (Math.random() - 0.5) * 2;
    
    symbols.push({
        re: ref.re / Math.SQRT2 + noiseI,
        im: ref.im / Math.SQRT2 + noiseQ
    });
}

clf();
constellation(symbols, { title: 'QPSK Received Constellation (SNR = 15 dB)' });
disp("✅ Constellation rendered with " + numSymbols + " symbols.");
`;
        } else if (tmplId === 'ode_rlc') {
            code = `// ==========================================================
// ⚡ STATE-SPACE RLC CIRCUIT TRANSIENT DYNAMICS (ODE45)
// ==========================================================
// State vector: x[0] = Vc (Capacitor Voltage), x[1] = iL (Inductor Current)
// dVc/dt = iL / C
// diL/dt = (Vin - Vc - iL * R) / L

const R = 10;     // 10 Ohms
const L = 10e-3;  // 10 mH
const C = 100e-6; // 100 uF
const Vin = 12.0; // 12V Step Input

const rlcOde = (t, x) => {
    const Vc = x[0];
    const iL = x[1];
    return [
        iL / C,
        (Vin - Vc - iL * R) / L
    ];
};

// Solve ODE over t = [0, 0.02] with initial conditions x0 = [0, 0]
const sol = ode45(rlcOde, [0, 0.02], [0, 0], 500);

clf();
subplot(2, 1, 1);
plot(mul(sol.t, 1000), sol.y[0], { color: '#00ffcc', lineWidth: 2, label: 'Vc(t)' });
title('RLC Series Step Response: Capacitor Voltage');
xlabel('Time (ms)');
ylabel('Voltage (V)');

subplot(2, 1, 2);
plot(mul(sol.t, 1000), sol.y[1], { color: '#ffaa00', lineWidth: 2, label: 'iL(t)' });
title('Inductor Current Transient');
xlabel('Time (ms)');
ylabel('Current (A)');

disp("✅ RLC ODE integration completed.");
`;
        } else if (tmplId === 'matrix_eig') {
            code = `// ==========================================================
// 🔢 LINEAR ALGEBRA & EIGENVALUE DECOMPOSITION
// ==========================================================

// Define a symmetric system matrix A
const A = [
    [4, 1, -2],
    [1, 2, 0],
    [-2, 0, 3]
];

disp("Matrix A:");
disp(A);

const d = det(A);
disp("Determinant det(A) = " + d.toFixed(4));

const invA = inv(A);
disp("Inverse Matrix A^-1:");
disp(invA);

const eigenvalues = eig(A);
disp("Eigenvalues of A:");
disp(eigenvalues);

// Solve linear system A * x = b
const b = [5, 3, 1];
const x = linsolve(A, b);
disp("Solution x to A*x = b:");
disp(x);
`;
        }

        textarea.value = code;
        this.activeScript.content = code;
        this.updateLineNumbers(textarea, lineNumbers);
    }
}

if (typeof window !== 'undefined') {
    window.SwitchaCodeEditor = SwitchaCodeEditor;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SwitchaCodeEditor };
}
export { SwitchaCodeEditor };

