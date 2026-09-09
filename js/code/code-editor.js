/**
 * SWITCHA CODE — SCIENTIFIC CODE IDE, REPL CONSOLE & SCRIPT RUNTIME
 * Professional interactive MATLAB / MathWorks style programming environment.
 */

import { SwitchaCodeEngine, SwitchaMath } from './code-engine.js?v=2.3';
import { SwitchaPlotter } from './code-plotter.js?v=2.3';

class SwitchaCodeEditor {
    constructor(containerId, options = {}) {
        this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        this.engine = new SwitchaCodeEngine();
        this.plotter = null;
        this.history = [];
        this.historyIdx = -1;
        this.activeScript = {
            id: 'scratch',
            name: 'untitled_script.m',
            content: this.getDefaultScript()
        };

        this.initDOM();
    }

    getDefaultScript() {
        return `% ==========================================================
% 🚀 SWITCHA CODE — SCIENTIFIC COMPUTING & DSP SIMULATION
% Professional MATLAB-compatible script environment
% Press [Ctrl + Enter] or click ▶ Run Script
% ==========================================================

% 1. Time vector & Signal Generation
Fs = 10000;                      % Sampling frequency: 10 kHz
t = 0:0.0001:0.05;              % 50 ms duration
f1 = 120; f2 = 800;             % Fundamental and harmonic frequencies

% 2. Multi-tone signal + Gaussian noise
sig = sin(2 * pi * f1 * t) + 0.5 * cos(2 * pi * f2 * t);
noisySig = awgn(sig, 12);       % Add AWGN (SNR = 12 dB)

% 3. Fast Fourier Transform (FFT)
N = 512;
X = fft(noisySig(1:N));
fAxis = linspace(0, Fs / 2, N / 2);
magSpectrum = X.mag(1:N / 2);

% 4. Multi-Pane Scientific Visualization
clf();

% Subplot 1: Time Domain Waveform
subplot(2, 1, 1);
plot(t * 1000, noisySig, { color: '#00ffcc', label: 'Noisy Signal' });
hold on;
plot(t * 1000, sig, { color: '#ff007f', lineWidth: 2.5, label: 'Clean Signal' });
title('Time-Domain Signal (120 Hz + 800 Hz + AWGN)');
xlabel('Time (ms)');
ylabel('Amplitude (V)');
legend('Noisy', 'Clean');
grid on;

% Subplot 2: Frequency Spectrum
subplot(2, 1, 2);
stem(fAxis, magSpectrum, { color: '#38bdf8' });
title('Single-Sided FFT Amplitude Spectrum');
xlabel('Frequency (Hz)');
ylabel('|X(f)|');
xlim([0, 2000]);
grid on;

disp('✅ Simulation finished successfully!');
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
                <option value="">⚡ Load MATLAB Template...</option>
                <option value="dsp_fft">1. Signal Processing & FFT Spectrum</option>
                <option value="rc_bode">2. Transfer Function, Bode & Margins</option>
                <option value="control_pendulum">3. Inverted Pendulum PID & State Feedback</option>
                <option value="qpsk_comm">4. QPSK / 16-QAM Constellation & AWGN</option>
                <option value="ode_rlc">5. State-Space ODE45 Dynamic RLC Circuit</option>
                <option value="lorenz_chaos">6. Lorenz Strange Attractor & Chaos ODE</option>
                <option value="matrix_eig">7. Linear Algebra, SVD, Cholesky & Inverses</option>
                <option value="butter_filter">8. Butterworth IIR Filter Design (Zero-Phase)</option>
                <option value="curve_fit">9. Polynomial Curve Fitting & Roots</option>
                <option value="sim_blocks">10. Simulink Co-Simulation Bridge (sim)</option>
                <option value="am_modulation">11. Amplitude Modulation (AM) & Waveforms</option>
                <option value="delta_modulation">12. Delta Modulation (DM) & Staircase Approximator</option>
            </select>
            <span style="flex:1;"></span>
            <span id="codeScriptName" style="color:#94a3b8; font-family:monospace;">untitled_script.m</span>
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

        // REPL Output Console (Command Window)
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
        consoleHeader.textContent = '📟 MATLAB Command Window (REPL)';
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
        replInput.placeholder = 'Type MATLAB command or expression e.g. A = [1 2; 3 4]; inv(A)';
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
        varHeader.textContent = '📋 Workspace Variables Explorer';
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

        this.plotter = new SwitchaPlotter(plotContainer);
        this.engine.plotter = this.plotter;

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

        const runBtn = this.container.querySelector('#codeBtnRun');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runScript());
        }

        const clearBtn = this.container.querySelector('#codeBtnClearCons');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                consoleLog.innerHTML = '';
            });
        }

        const tmplSelect = this.container.querySelector('#codeTemplateSelect');
        if (tmplSelect) {
            tmplSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (!val) return;
                this.loadTemplate(val);
                e.target.value = '';
            });
        }

        const saveBtn = this.container.querySelector('#codeBtnSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveScript());
        }

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
            this.engine.run(cmd, {
                plotter: this.plotter,
                onPrint: (msg) => this.appendConsole(msg, 'log'),
                onError: (err) => this.appendConsole(err, 'error')
            });
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

            if (!res.error) {
                this.appendConsole('✔ Script executed successfully.', 'log');
            }
            this.updateWorkspaceVariables();
        } catch (err) {
            this.appendConsole(err.message, 'error');
        }
    }

    updateWorkspaceVariables() {
        const varTable = this.container.querySelector('#codeVarTable');
        if (!varTable) return;

        const vars = this.engine.getVariablesList();
        if (vars.length === 0) {
            varTable.innerHTML = '<div style="padding:10px; color:#4b5563; text-align:center;">No variables in workspace</div>';
            return;
        }

        let html = `<table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
                <tr style="border-bottom:1px solid #1f2937; color:#94a3b8;">
                    <th style="padding:4px 8px;">Name</th>
                    <th style="padding:4px 8px;">Size</th>
                    <th style="padding:4px 8px;">Class</th>
                    <th style="padding:4px 8px;">Value Preview</th>
                </tr>
            </thead>
            <tbody>`;

        for (const v of vars) {
            html += `<tr style="border-bottom:1px solid #111827; color:#cbd5e1;">
                <td style="padding:4px 8px; color:#00ffcc; font-weight:600;">${v.name}</td>
                <td style="padding:4px 8px; color:#94a3b8;">${v.size}</td>
                <td style="padding:4px 8px; color:#a5b4fc;">${v.type}</td>
                <td style="padding:4px 8px; color:#e2e8f0;">${v.preview}</td>
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
            name: name.endsWith('.m') || name.endsWith('.swcode') ? name : name + '.m',
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
            code = `% ==========================================================
% 📈 2ND-ORDER LOW-PASS FILTER BODE & STABILITY MARGINS
% ==========================================================
% Transfer function G(s) = 25 / (s^2 + 2s + 25)
num = [25];
den = [1 2 25];
G = tf(num, den);

disp('Plant Transfer Function:');
disp(G);

% Calculate frequency response
w = logspace(-1, 2, 250);
bode(G, w);

% Calculate stability margins
margins = margin(G);
disp('Stability Margins:');
disp(margins);
`;
        } else if (tmplId === 'control_pendulum') {
            code = `% ==========================================================
% ⚖️ INVERTED PENDULUM ON A CART: CLOSED-LOOP PID BALANCE
% ==========================================================
% Plant Transfer Function (Angle Theta / Force u):
% G(s) = 1 / (s^2 - 9.8) [Unstable Open-Loop Pole at +3.13 rad/s]
G_plant = tf([1], [1 0 -9.8]);

disp('Unstable Open-Loop Plant Poles:');
disp(pzmap(G_plant));

% Tuned PID Balance Controller: C(s) = (50s^2 + 150s + 400) / (0.01s + 1)
C_pid = tf([50 150 400], [0.01 1]);

% Form Negative Feedback Loop: T(s) = G*C / (1 + G*C)
T_closed = feedback(series(C_pid, G_plant), 1);

disp('Closed-Loop Stable Transfer Function:');
disp(T_closed);

% Plot Step Response
clf();
step(T_closed);
title('Inverted Pendulum Cart: Closed-Loop Step Disturbance Rejection');
`;
        } else if (tmplId === 'qpsk_comm') {
            code = `% ==========================================================
% 📡 16-QAM MODULATION, AWGN CHANNEL & CONSTELLATION
% ==========================================================
numSymbols = 1000;
snrDb = 18;

% Generate 16-QAM Grid
qamRef = [-3, -1, 1, 3];
symbols = [];

for k = 1:numSymbols
    reIdx = randi([1 4], 1);
    imIdx = randi([1 4], 1);
    symbols = [symbols; qamRef(reIdx) + j * qamRef(imIdx)];
end

% Add AWGN Channel Noise
rxSymbols = awgn(symbols, snrDb);

clf();
scatter(rxSymbols.real, rxSymbols.imag, { color: '#00ffcc', size: 5 });
hold on;
scatter(symbols.real, symbols.imag, { color: '#ef4444', size: 8 });
title(['16-QAM Constellation Diagram (SNR = ' + num2str(snrDb) + ' dB)']);
xlabel('In-Phase (I)');
ylabel('Quadrature (Q)');
grid on;
`;
        } else if (tmplId === 'ode_rlc') {
            code = `% ==========================================================
% ⚡ STATE-SPACE RLC CIRCUIT TRANSIENT DYNAMICS (ODE45)
% ==========================================================
% State vector: x[0] = Vc (Capacitor Voltage), x[1] = iL (Inductor Current)
R = 10;          % 10 Ohms
L = 10e-3;       % 10 mH
C = 100e-6;      % 100 uF
Vin = 12.0;      % 12V Step Input

rlcOde = (t, x) => [
    x[1] / C,
    (Vin - x[0] - x[1] * R) / L
];

% Solve ODE with ODE45 over t = [0, 0.02s]
sol = ode45(rlcOde, [0 0.02], [0 0], 500);

clf();
subplot(2, 1, 1);
plot(sol.t * 1000, sol.y[0], { color: '#00ffcc', lineWidth: 2, label: 'Vc(t)' });
title('RLC Series Step Response: Capacitor Voltage');
xlabel('Time (ms)');
ylabel('Voltage (V)');
grid on;

subplot(2, 1, 2);
plot(sol.t * 1000, sol.y[1], { color: '#ffaa00', lineWidth: 2, label: 'iL(t)' });
title('Inductor Current Transient');
xlabel('Time (ms)');
ylabel('Current (A)');
grid on;
`;
        } else if (tmplId === 'lorenz_chaos') {
            code = `% ==========================================================
% 🌪️ LORENZ STRANGE ATTRACTOR & CHAOTIC DYNAMICS (ODE45)
% ==========================================================
% dx/dt = sigma * (y - x)
% dy/dt = x * (rho - z) - y
% dz/dt = x * y - beta * z
sigma = 10;
rho = 28;
beta = 8 / 3;

lorenz = (t, state) => [
    sigma * (state[1] - state[0]),
    state[0] * (rho - state[2]) - state[1],
    state[0] * state[1] - beta * state[2]
];

% Integrate over 30 seconds with initial perturbation
sol = ode45(lorenz, [0 30], [1 1 1], 2500);

clf();
subplot(2, 1, 1);
plot(sol.y[0], sol.y[2], { color: '#00ffcc', lineWidth: 1 });
title('Lorenz Attractor: X vs Z Phase Plane Butterfly Wing');
xlabel('State X');
ylabel('State Z');
grid on;

subplot(2, 1, 2);
plot(sol.y[0], sol.y[1], { color: '#ff007f', lineWidth: 1 });
title('Lorenz Attractor: X vs Y Trajectory');
xlabel('State X');
ylabel('State Y');
grid on;
`;
        } else if (tmplId === 'matrix_eig') {
            code = `% ==========================================================
% 🔢 LINEAR ALGEBRA: SVD, CHOLESKY, EIGENVALUES & INVERSE
% ==========================================================
A = [4 1 -2; 1 2 0; -2 0 3];

disp('Matrix A:');
disp(A);

detA = det(A)
invA = inv(A)
eigA = eig(A)

% Cholesky Factorization A = L * L^T
L = chol(A);
disp('Cholesky Factor L:');
disp(L);

% Solve Linear System A * x = b
b = [5; 3; 1];
x = A \\ b
`;
        } else if (tmplId === 'butter_filter') {
            code = `% ==========================================================
% 🎛️ BUTTERWORTH IIR DIGITAL FILTER DESIGN & FREQZ
% ==========================================================
Fs = 1000;              % 1 kHz Sampling Rate
Wn = 0.2;               % Normalized Cutoff Frequency (100 Hz)

% 2nd Order Lowpass Butterworth Filter
filt = butter(2, Wn, 'low');
disp('Filter Numerator b:');
disp(filt.b);
disp('Filter Denominator a:');
disp(filt.a);

% Frequency Response via freqz
resp = freqz(filt.b, filt.a, 256, Fs);

clf();
subplot(2, 1, 1);
plot(resp.f, resp.magDb, { color: '#00ffcc', lineWidth: 2 });
title('Butterworth Lowpass Filter: Magnitude Response');
xlabel('Frequency (Hz)');
ylabel('Magnitude (dB)');
grid on;

subplot(2, 1, 2);
plot(resp.f, resp.phaseDeg, { color: '#ffaa00', lineWidth: 2 });
title('Phase Response');
xlabel('Frequency (Hz)');
ylabel('Phase (degrees)');
grid on;
`;
        } else if (tmplId === 'curve_fit') {
            code = `% ==========================================================
% 📐 POLYNOMIAL LEAST-SQUARES CURVE FITTING & ROOTS
% ==========================================================
% Generate noisy cubic data
x = linspace(-2, 2, 50);
yTrue = x .^ 3 - 2 * (x .^ 2) - x + 2;
yNoisy = yTrue + randn(1, 50) * 0.3;

% Fit 3rd-order polynomial: p(x) = p1*x^3 + p2*x^2 + p3*x + p4
p = polyfit(x, yNoisy, 3);
disp('Fitted Polynomial Coefficients:');
disp(p);

% Calculate Roots
r = roots(p);
disp('Roots of Fitted Polynomial:');
disp(r);

% Evaluate Fit
xPlot = linspace(-2, 2, 150);
yFit = polyval(p, xPlot);

clf();
scatter(x, yNoisy, { color: '#00ffcc', size: 6, label: 'Data Points' });
hold on;
plot(xPlot, yFit, { color: '#ff007f', lineWidth: 2.5, label: 'Fitted Curve' });
title('Least-Squares 3rd-Order Polynomial Regression');
xlabel('x');
ylabel('y');
legend('Noisy Data', 'Fitted Polynomial');
grid on;
`;
        } else if (tmplId === 'sim_blocks') {
            code = `% ==========================================================
% 🔌 SIMULINK CO-SIMULATION BRIDGE: sim() CALL
% ==========================================================
% Run DC Motor Closed-Loop Block Diagram simulation from script!
disp('Starting Simulink Model Simulation...');

result = sim('dc_motor_pid', { stopTime: 4.0, timeStep: 0.001 });
disp('Simulink Simulation Results Object:');
disp(result);
`;
        } else if (tmplId === 'am_modulation') {
            code = `% ==========================================================
% 📻 AMPLITUDE MODULATION (AM) & WAVEFORMS
% ==========================================================
clc;
clear;
close all;

% Parameters
Am = 1;          % Message signal amplitude
Ac = 2;          % Carrier signal amplitude
fm = 100;        % Message frequency (Hz)
fc = 1000;       % Carrier frequency (Hz)
mu = 0.5;        % Modulation index

% Time vector
t = 0:0.00001:0.05;

% Message signal
m = Am * cos(2*pi*fm*t);

% Carrier signal
c = Ac * cos(2*pi*fc*t);

% AM signal
s = Ac * (1 + mu*cos(2*pi*fm*t)) .* cos(2*pi*fc*t);

% Plot message signal
subplot(3,1,1);
plot(t,m);
grid on;
title('Message Signal');
xlabel('Time (s)');
ylabel('Amplitude');

% Plot carrier signal
subplot(3,1,2);
plot(t,c);
grid on;
title('Carrier Signal');
xlabel('Time (s)');
ylabel('Amplitude');

% Plot AM signal
subplot(3,1,3);
plot(t,s);
grid on;
title('Amplitude Modulated (AM) Signal');
xlabel('Time (s)');
ylabel('Amplitude');
`;
        } else if (tmplId === 'delta_modulation') {
            code = `% ==========================================================
% 📈 DELTA MODULATION (DM) & STAIRCASE APPROXIMATION
% ==========================================================
clc;
clear;
close all;

fs = 1000;
fm = 5;
t = 0:1/fs:1;

m = sin(2*pi*fm*t);

delta = 0.1;

y = zeros(size(t));
dm = zeros(size(t));

for i = 2:length(t)
    if m(i) > y(i-1)
        dm(i) = 1;
        y(i) = y(i-1) + delta;
    else
        dm(i) = 0;
        y(i) = y(i-1) - delta;
    end
end

figure;

subplot(3,1,1);
plot(t,m);
grid on;
title('Message Signal');

subplot(3,1,2);
plot(t,y);
grid on;
title('Delta Modulated Staircase');

subplot(3,1,3);
stairs(t,dm);
grid on;
title('Delta Modulated Signal');
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
