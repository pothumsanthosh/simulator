/**
 * e-Samastha — Arduino IDE & Hardware Simulation Lab Controller (Production Grade)
 * 
 * Manages the embedded laboratory environment:
 * - 3-Panel Professional IDE Layout:
 *   1. Left: Component Palette & Project Templates (Collapsible)
 *   2. Center: C++ Editor with line numbers, search/replace, font sizing & error jumping
 *   3. Right: Hardware Workbench & Signal Oscilloscope
 *   4. Bottom: Multi-Tab Drawer (Compiler Console, Serial Monitor, Pin Monitor, Debug Timeline, Troubleshooter)
 * - Compiler & virtual execution scheduler (0.25x to 10x speed, single-step, pause, stop)
 * - Oscilloscope integration with 3-channel waveform sampling
 * - Live microcontroller event timeline
 * - Beginner Mode & educational diagnostic checks ("Why isn't my LED glowing?")
 * - Isolated .swino project storage & automatic offline persistence
 */

import { ArduinoBoard, BoardType } from './arduino-board.js';
import { ArduinoInterpreter } from './arduino-interpreter.js';
import { ArduinoCanvas } from './arduino-canvas.js';
import { ArduinoScope } from './arduino-scope.js';
import { ARDUINO_PRESETS } from './arduino-library.js';
import { ComponentFactory, ComponentType } from './arduino-components.js';
import { storageService } from '../services/storage-service.js';

// Pre-defined project starter templates
const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Sketch',
    desc: 'Minimal setup() and loop() skeleton',
    code: `// e-Samastha Arduino Lab - Blank Project
void setup() {
  // Put your setup code here, to run once:
  pinMode(13, OUTPUT);
}

void loop() {
  // Put your main code here, to run repeatedly:
}
`,
    components: [],
    wires: []
  },
  {
    id: 'tpl_blink',
    name: 'LED Blink',
    desc: 'Blink built-in or external LED on Pin 13',
    presetId: 'blink'
  },
  {
    id: 'tpl_button',
    name: 'Button & LED',
    desc: 'Digital input controlling LED output',
    presetId: 'button_led'
  },
  {
    id: 'tpl_analog',
    name: 'Analog Sensor Reading',
    desc: 'Read LDR or Potentiometer on ADC A0',
    presetId: 'analog_read_serial'
  },
  {
    id: 'tpl_servo',
    name: 'Servo Sweep',
    desc: 'PWM angle position control for SG90 servo',
    presetId: 'servo_sweep'
  },
  {
    id: 'tpl_lcd',
    name: '16x2 LCD Display',
    desc: 'Print text and counter on parallel/I2C LCD',
    presetId: 'lcd_display'
  },
  {
    id: 'tpl_serial',
    name: 'Serial Echo & Command',
    desc: 'Bidirectional UART terminal communication',
    presetId: 'serial_comm'
  }
];

// Component Palette categories for the left sidebar
const PALETTE_CATEGORIES = [
  {
    category: 'Basic Components',
    items: [
      { type: 'LED', name: 'Red LED', icon: '🔴' },
      { type: 'RGB_LED', name: 'RGB LED', icon: '🌈' },
      { type: 'BUTTON', name: 'Pushbutton', icon: '🔘' },
      { type: 'SWITCH', name: 'SPST Switch', icon: '🎚️' },
      { type: 'POTENTIOMETER', name: 'Potentiometer', icon: '🎛️' },
      { type: 'BUZZER', name: 'Piezo Buzzer', icon: '🔊' }
    ]
  },
  {
    category: 'Sensors',
    items: [
      { type: 'LDR', name: 'LDR Light Sensor', icon: '☀️' },
      { type: 'LM35', name: 'LM35 Temp Sensor', icon: '🌡️' },
      { type: 'DHT11', name: 'DHT11 Sensor', icon: '💧' },
      { type: 'ULTRASONIC', name: 'HC-SR04 Ultrasonic', icon: '📡' },
      { type: 'PIR_SENSOR', name: 'PIR Motion Sensor', icon: '🚶' },
      { type: 'IR_SENSOR', name: 'IR Proximity Sensor', icon: '🔦' },
      { type: 'GAS_SENSOR', name: 'MQ Gas Sensor', icon: '💨' }
    ]
  },
  {
    category: 'Displays',
    items: [
      { type: 'LCD1602', name: '16x2 LCD Display', icon: '📟' },
      { type: 'OLED12864', name: '0.96" OLED (SSD1306)', icon: '📺' },
      { type: 'SEVENSEG', name: '7-Segment Display', icon: '🔣' }
    ]
  },
  {
    category: 'Actuators & Motors',
    items: [
      { type: 'SERVO', name: 'SG90 Micro Servo', icon: '🦾' },
      { type: 'DC_MOTOR', name: 'DC Motor + Fan', icon: '🌀' },
      { type: 'RELAY', name: '5V Relay Module', icon: '🔌' }
    ]
  }
];

export class ArduinoController {
  constructor(containerElement) {
    this.container = containerElement;
    this.board = new ArduinoBoard(BoardType.UNO);
    this.interpreter = new ArduinoInterpreter(this.board);
    this.canvasController = null;
    this.scope = null;

    this.simInterval = null;
    this.simSpeed = 1.0;
    this.lastTickTime = performance.now();
    this.currentPresetId = 'blink';
    this.activeBottomTab = 'console';
    this.activeCanvasTab = 'canvas';
    this.beginnerMode = false;
    this.autoSaveTimer = null;
    this.debugEvents = [];
    this.lastSimTime = 0;

    this.initUI();
    this.initSubscribers();
    this.loadInitialSketch();
  }

  initUI() {
    // Generate preset options by category
    const categories = {};
    for (const p of ARDUINO_PRESETS) {
      const cat = p.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    }

    const presetOptgroups = Object.keys(categories).map(cat => {
      const options = categories[cat].map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      return `<optgroup label="${cat}">${options}</optgroup>`;
    }).join('');

    this.container.innerHTML = `
      <div class="arduino-lab-root">
        <!-- Top Toolbar -->
        <header class="arduino-toolbar">
          <div class="arduino-toolbar-left">
            <button id="arduino-btn-toggle-sidebar" class="arduino-btn arduino-btn-outline" title="Toggle Component Palette">
              ☰ Palette
            </button>

            <div class="arduino-logo-badge">
              <span class="arduino-icon">⚡</span>
              <span class="arduino-title">Arduino IDE & Hardware Lab</span>
            </div>
            
            <div class="arduino-board-selector-wrap">
              <label for="arduino-board-select">Board:</label>
              <select id="arduino-board-select" class="arduino-select">
                <option value="UNO" selected>Arduino Uno (ATmega328P)</option>
                <option value="NANO">Arduino Nano</option>
                <option value="MEGA">Arduino Mega 2560</option>
              </select>
            </div>

            <div class="arduino-preset-wrap">
              <label for="arduino-preset-select">Examples (25):</label>
              <select id="arduino-preset-select" class="arduino-select">
                ${presetOptgroups}
              </select>
            </div>
          </div>

          <div class="arduino-toolbar-center">
            <button id="arduino-btn-verify" class="arduino-btn arduino-btn-verify" title="Verify / Compile (Ctrl+R)">
              <span class="btn-icon">✓</span> Verify
            </button>
            <button id="arduino-btn-run" class="arduino-btn arduino-btn-run" title="Upload & Run Simulation">
              <span class="btn-icon">▶</span> Run
            </button>
            <button id="arduino-btn-pause" class="arduino-btn arduino-btn-secondary" title="Pause Simulation" disabled>
              <span class="btn-icon">⏸</span> Pause
            </button>
            <button id="arduino-btn-stop" class="arduino-btn arduino-btn-danger" title="Stop & Reset Hardware" disabled>
              <span class="btn-icon">⏹</span> Stop
            </button>
            <button id="arduino-btn-step" class="arduino-btn arduino-btn-outline" title="Single Step (10ms)">
              <span class="btn-icon">⏭</span> Step
            </button>

            <div class="arduino-speed-wrap">
              <label for="arduino-speed-select" title="Simulation Speed Multiplier">Speed:</label>
              <select id="arduino-speed-select" class="arduino-select-sm">
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1.0" selected>1.0x</option>
                <option value="2.0">2.0x</option>
                <option value="5.0">5.0x</option>
                <option value="10.0">10x</option>
              </select>
            </div>
          </div>

          <div class="arduino-toolbar-right">
            <label class="arduino-beginner-label" title="Show beginner wiring hints & diagnostics">
              <input type="checkbox" id="arduino-toggle-beginner" /> Beginner Mode
            </label>
            <span id="arduino-autosave-indicator" class="autosave-badge" title="Auto-save status">● Saved</span>
            <button id="arduino-btn-new-project" class="arduino-btn arduino-btn-outline" title="New Project from Template">
              ➕ New
            </button>
            <button id="arduino-btn-export" class="arduino-btn arduino-btn-outline" title="Export .swino project">
              💾 Export
            </button>
            <label class="arduino-btn arduino-btn-outline" style="cursor:pointer; margin-bottom:0;" title="Import .swino or .ino">
              📂 Import
              <input type="file" id="arduino-file-import" accept=".swino,.ino" style="display:none;" />
            </label>
          </div>
        </header>

        <!-- Main Body: 3-Panel Split View -->
        <main class="arduino-main-body">
          <!-- 1. Left Sidebar: Component Palette & Templates -->
          <aside id="arduino-sidebar-pane" class="arduino-sidebar-pane">
            <div class="sidebar-section-header">Project Starter Templates</div>
            <div class="template-button-list">
              ${PROJECT_TEMPLATES.map(t => `
                <button class="template-item-btn" data-template-id="${t.id}" title="${t.desc}">
                  <strong>${t.name}</strong>
                  <small>${t.desc}</small>
                </button>
              `).join('')}
            </div>

            <div class="sidebar-section-header">Component Palette (Click to Add)</div>
            <div class="palette-categories-wrap">
              ${PALETTE_CATEGORIES.map(cat => `
                <div class="palette-category-group">
                  <div class="category-title">${cat.category}</div>
                  <div class="category-grid">
                    ${cat.items.map(item => `
                      <button class="palette-item-btn" data-comp-type="${item.type}" title="Add ${item.name} to Workbench">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </aside>

          <!-- 2. Center: Code Editor Pane -->
          <section class="arduino-editor-pane">
            <div class="arduino-pane-header">
              <div class="editor-tabs">
                <button class="pane-tab active" data-editor-tab="code">sketch.ino</button>
                <button class="pane-tab" data-editor-tab="cheatsheet">API Cheat Sheet</button>
              </div>
              <div class="editor-header-actions">
                <div class="editor-search-toggle" id="arduino-btn-toggle-find" title="Find & Replace (Ctrl+F)">🔍 Find</div>
                <select id="arduino-editor-fontsize" class="arduino-select-sm" title="Editor Font Size">
                  <option value="12">12px</option>
                  <option value="13" selected>13px</option>
                  <option value="15">15px</option>
                  <option value="17">17px</option>
                </select>
                <span id="arduino-compile-status" class="arduino-compile-status">Ready</span>
              </div>
            </div>

            <!-- Find & Replace Toolbar (Collapsible) -->
            <div id="arduino-find-replace-bar" class="arduino-find-replace-bar" style="display:none;">
              <input type="text" id="arduino-find-input" placeholder="Find text..." class="arduino-input-sm" />
              <button id="arduino-btn-find-next" class="arduino-btn-xs">Find</button>
              <input type="text" id="arduino-replace-input" placeholder="Replace with..." class="arduino-input-sm" />
              <button id="arduino-btn-replace-one" class="arduino-btn-xs">Replace</button>
              <button id="arduino-btn-replace-all" class="arduino-btn-xs">All</button>
              <button id="arduino-btn-close-find" class="arduino-btn-xs-close" title="Close">×</button>
            </div>

            <!-- Error Banner (Click to jump to line) -->
            <div id="arduino-error-banner" class="arduino-error-banner" style="display:none;">
              <span id="arduino-error-banner-text">Error message</span>
              <button id="arduino-error-jump-btn" class="error-jump-btn">Jump to line</button>
            </div>

            <!-- Code Editor Wrapper -->
            <div id="arduino-editor-view-code" class="arduino-editor-wrapper">
              <div id="arduino-line-numbers" class="arduino-line-numbers"></div>
              <textarea id="arduino-code-editor" class="arduino-textarea" spellcheck="false" wrap="off"></textarea>
            </div>

            <!-- Cheat Sheet View (Alternative tab) -->
            <div id="arduino-editor-view-cheatsheet" class="arduino-cheatsheet-wrapper" style="display:none;">
              <div class="cheatsheet-content">
                <h4>Arduino Embedded C++ Quick Reference</h4>
                <div class="cheatsheet-grid">
                  <div class="cs-card">
                    <h5>Digital I/O</h5>
                    <code>pinMode(pin, INPUT | OUTPUT | INPUT_PULLUP);</code>
                    <code>digitalWrite(pin, HIGH | LOW);</code>
                    <code>int val = digitalRead(pin);</code>
                  </div>
                  <div class="cs-card">
                    <h5>Analog & PWM</h5>
                    <code>int val = analogRead(A0); // 0-1023 (10-bit)</code>
                    <code>analogWrite(pin, 0-255); // 8-bit PWM</code>
                    <code>analogReference(DEFAULT | INTERNAL | EXTERNAL);</code>
                  </div>
                  <div class="cs-card">
                    <h5>Timing & Math</h5>
                    <code>delay(ms); / delayMicroseconds(us);</code>
                    <code>unsigned long t = millis(); / micros();</code>
                    <code>map(val, inMin, inMax, outMin, outMax);</code>
                    <code>constrain(val, minVal, maxVal);</code>
                  </div>
                  <div class="cs-card">
                    <h5>Serial & Peripherals</h5>
                    <code>Serial.begin(9600);</code>
                    <code>Serial.print(msg); / Serial.println(msg);</code>
                    <code>if (Serial.available()) { char c = Serial.read(); }</code>
                    <code>tone(pin, freq, duration); / noTone(pin);</code>
                  </div>
                </div>
              </div>
            </div>

            <!-- Memory Consumption Bar -->
            <div class="arduino-memory-meter">
              <div class="mem-item">
                <span>Flash Program Storage:</span>
                <div class="meter-bar-track"><div id="meter-flash-fill" class="meter-fill" style="width: 4%;"></div></div>
                <span id="meter-flash-text">1,248 / 32,256 bytes (4%)</span>
              </div>
              <div class="mem-item">
                <span>Dynamic SRAM:</span>
                <div class="meter-bar-track"><div id="meter-sram-fill" class="meter-fill" style="width: 10%;"></div></div>
                <span id="meter-sram-text">210 / 2,048 bytes (10%)</span>
              </div>
            </div>
          </section>

          <!-- 3. Right: Hardware Workbench & Oscilloscope -->
          <section class="arduino-hardware-pane">
            <div class="arduino-pane-header">
              <div class="workbench-tabs">
                <button class="pane-tab active" data-canvas-tab="canvas">🛠️ Workbench Canvas</button>
                <button class="pane-tab" data-canvas-tab="scope">📈 Signal Oscilloscope</button>
              </div>
              <div class="canvas-controls">
                <button id="arduino-btn-clear-canvas" class="arduino-btn-xs" title="Clear all components and wires">Clear All</button>
                <button id="arduino-btn-del-selected" class="arduino-btn-xs" title="Delete selected component or wire (Del/Backspace)">Delete Selected</button>
                <span id="arduino-sim-status" class="sim-status-badge status-stopped">STOPPED</span>
              </div>
            </div>

            <!-- View 1: Workbench Canvas View -->
            <div id="arduino-view-canvas" class="arduino-canvas-container">
              <div class="arduino-canvas-wrap">
                <canvas id="arduino-hw-canvas" width="720" height="420"></canvas>
              </div>
            </div>

            <!-- View 2: Signal Oscilloscope View -->
            <div id="arduino-view-scope" class="arduino-scope-container" style="display:none;">
              <div class="scope-toolbar">
                <div class="scope-ch-select">
                  <span class="scope-badge ch1-badge">CH1:</span>
                  <select id="arduino-scope-ch1" class="arduino-select-sm">
                    <option value="13" selected>Pin 13 (LED)</option>
                    <option value="9">Pin 9 (PWM)</option>
                    <option value="A0">A0 (Analog)</option>
                  </select>
                </div>
                <div class="scope-ch-select">
                  <span class="scope-badge ch2-badge">CH2:</span>
                  <select id="arduino-scope-ch2" class="arduino-select-sm">
                    <option value="9" selected>Pin 9 (PWM)</option>
                    <option value="10">Pin 10 (PWM)</option>
                    <option value="A0">A0 (Analog)</option>
                  </select>
                </div>
                <div class="scope-ch-select">
                  <span class="scope-badge ch3-badge">CH3:</span>
                  <select id="arduino-scope-ch3" class="arduino-select-sm">
                    <option value="A0" selected>A0 (Analog)</option>
                    <option value="A1">A1 (Analog)</option>
                    <option value="2">Pin 2 (Int)</option>
                  </select>
                </div>
                <span class="scope-info-note">Live 3-Channel Signal Waveform Monitor (0 - 5.0V)</span>
              </div>
              <div class="arduino-scope-wrap">
                <canvas id="arduino-scope-canvas" width="720" height="380"></canvas>
              </div>
            </div>

            <!-- Beginner Mode Hints Bar (Visible when enabled) -->
            <div id="arduino-beginner-hints-pane" class="arduino-beginner-hints" style="display:none;">
              <div class="hints-header">💡 Beginner Wiring & Circuit Advisor</div>
              <div id="arduino-hints-content" class="hints-body">
                Connect components to 5V and GND. All digital pins default to INPUT unless configured with pinMode(pin, OUTPUT).
              </div>
            </div>

            <!-- Bottom Drawer Multi-Tab Section -->
            <div class="arduino-bottom-drawer">
              <div class="bottom-tab-bar">
                <button class="bottom-tab-btn active" data-bottom-tab="console">Console Output</button>
                <button class="bottom-tab-btn" data-bottom-tab="serial">Serial Monitor</button>
                <button class="bottom-tab-btn" data-bottom-tab="pins">Pin Monitor</button>
                <button class="bottom-tab-btn" data-bottom-tab="debug">Debug Timeline</button>
                <button class="bottom-tab-btn" data-bottom-tab="troubleshoot">Troubleshooter</button>
              </div>

              <!-- Tab 1: Console Output -->
              <div id="bottom-pane-console" class="bottom-pane-content active">
                <div id="arduino-console-log" class="console-body">e-Samastha Arduino Embedded Simulation System v2.5 Ready.</div>
              </div>

              <!-- Tab 2: Serial Monitor -->
              <div id="bottom-pane-serial" class="bottom-pane-content" style="display:none;">
                <div class="serial-options-bar">
                  <select id="arduino-baud-select" class="arduino-select-sm">
                    <option value="9600" selected>9600 baud</option>
                    <option value="19200">19200 baud</option>
                    <option value="57600">57600 baud</option>
                    <option value="115200">115200 baud</option>
                  </select>
                  <label class="serial-autoscroll-label">
                    <input type="checkbox" id="arduino-serial-autoscroll" checked /> Autoscroll
                  </label>
                  <label class="serial-autoscroll-label">
                    <input type="checkbox" id="arduino-serial-timestamps" /> Show Timestamps
                  </label>
                  <button id="arduino-btn-clear-serial" class="arduino-btn-xs">Clear</button>
                </div>
                <div id="arduino-serial-output" class="arduino-serial-output"></div>
                <div class="arduino-serial-input-row">
                  <input type="text" id="arduino-serial-input" class="arduino-input" placeholder="Type message to send to Arduino Serial (TX)..." />
                  <button id="arduino-btn-send-serial" class="arduino-btn-send">Send</button>
                </div>
              </div>

              <!-- Tab 3: Pin Monitor -->
              <div id="bottom-pane-pins" class="bottom-pane-content" style="display:none;">
                <div class="pin-mon-header-row">
                  <span class="pin-mon-legend">🟢 HIGH (5.0V) | ⚫ LOW (0.0V) | ⚡ PWM (AnalogWrite) | 📊 ADC (AnalogRead)</span>
                  <input type="text" id="arduino-pin-search" placeholder="Filter pins (e.g. 13, A0)..." class="arduino-input-xs" />
                </div>
                <div class="pin-monitor-table-wrap">
                  <table class="arduino-pin-table">
                    <thead>
                      <tr>
                        <th>Pin</th>
                        <th>Type</th>
                        <th>Mode</th>
                        <th>State</th>
                        <th>Voltage</th>
                        <th>PWM Duty</th>
                        <th>ADC (10-bit)</th>
                      </tr>
                    </thead>
                    <tbody id="arduino-pin-table-body">
                      <!-- Populated dynamically -->
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Tab 4: Debug Timeline -->
              <div id="bottom-pane-debug" class="bottom-pane-content" style="display:none;">
                <div class="debug-toolbar">
                  <span>Microcontroller Execution Event Timeline</span>
                  <button id="arduino-btn-clear-debug" class="arduino-btn-xs">Clear Timeline</button>
                </div>
                <div id="arduino-debug-timeline-body" class="debug-timeline-body">
                  <div class="debug-entry debug-system">[0.000s] Virtual ATmega328P initialized at 16MHz.</div>
                </div>
              </div>

              <!-- Tab 5: Troubleshooter ("Why isn't my LED glowing?") -->
              <div id="bottom-pane-troubleshoot" class="bottom-pane-content" style="display:none;">
                <div class="troubleshoot-header">
                  <strong>Circuit & Code Diagnostic Inspector</strong>
                  <button id="arduino-btn-run-diagnostics" class="arduino-btn-xs" style="background:#00878a; color:#fff;">Run Diagnostics</button>
                </div>
                <div id="arduino-diagnostics-results" class="diagnostics-results-body">
                  <p class="diag-intro">Click "Run Diagnostics" to scan code, pin modes, wiring, and component power states.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;

    // Cache DOM Elements
    this.els = {
      boardSelect: this.container.querySelector('#arduino-board-select'),
      presetSelect: this.container.querySelector('#arduino-preset-select'),
      btnVerify: this.container.querySelector('#arduino-btn-verify'),
      btnRun: this.container.querySelector('#arduino-btn-run'),
      btnPause: this.container.querySelector('#arduino-btn-pause'),
      btnStop: this.container.querySelector('#arduino-btn-stop'),
      btnStep: this.container.querySelector('#arduino-btn-step'),
      speedSelect: this.container.querySelector('#arduino-speed-select'),
      toggleBeginner: this.container.querySelector('#arduino-toggle-beginner'),
      autosaveIndicator: this.container.querySelector('#arduino-autosave-indicator'),
      btnNewProject: this.container.querySelector('#arduino-btn-new-project'),
      btnExport: this.container.querySelector('#arduino-btn-export'),
      fileImport: this.container.querySelector('#arduino-file-import'),
      btnToggleSidebar: this.container.querySelector('#arduino-btn-toggle-sidebar'),
      sidebarPane: this.container.querySelector('#arduino-sidebar-pane'),
      codeEditor: this.container.querySelector('#arduino-code-editor'),
      lineNumbers: this.container.querySelector('#arduino-line-numbers'),
      compileStatus: this.container.querySelector('#arduino-compile-status'),
      consoleLog: this.container.querySelector('#arduino-console-log'),
      simStatus: this.container.querySelector('#arduino-sim-status'),
      hwCanvas: this.container.querySelector('#arduino-hw-canvas'),
      scopeCanvas: this.container.querySelector('#arduino-scope-canvas'),
      pinTableBody: this.container.querySelector('#arduino-pin-table-body'),
      pinSearchInput: this.container.querySelector('#arduino-pin-search'),
      serialOutput: this.container.querySelector('#arduino-serial-output'),
      serialInput: this.container.querySelector('#arduino-serial-input'),
      btnSendSerial: this.container.querySelector('#arduino-btn-send-serial'),
      btnClearSerial: this.container.querySelector('#arduino-btn-clear-serial'),
      serialAutoScroll: this.container.querySelector('#arduino-serial-autoscroll'),
      serialTimestamps: this.container.querySelector('#arduino-serial-timestamps'),
      debugTimelineBody: this.container.querySelector('#arduino-debug-timeline-body'),
      btnClearDebug: this.container.querySelector('#arduino-btn-clear-debug'),
      hintsPane: this.container.querySelector('#arduino-beginner-hints-pane'),
      hintsContent: this.container.querySelector('#arduino-hints-content'),
      diagResults: this.container.querySelector('#arduino-diagnostics-results'),
      btnRunDiag: this.container.querySelector('#arduino-btn-run-diagnostics'),
      btnClearCanvas: this.container.querySelector('#arduino-btn-clear-canvas'),
      btnDelSelected: this.container.querySelector('#arduino-btn-del-selected'),
      errorBanner: this.container.querySelector('#arduino-error-banner'),
      errorBannerText: this.container.querySelector('#arduino-error-banner-text'),
      errorJumpBtn: this.container.querySelector('#arduino-error-jump-btn'),
      editorFontSize: this.container.querySelector('#arduino-editor-fontsize'),
      btnToggleFind: this.container.querySelector('#arduino-btn-toggle-find'),
      findReplaceBar: this.container.querySelector('#arduino-find-replace-bar'),
      findInput: this.container.querySelector('#arduino-find-input'),
      replaceInput: this.container.querySelector('#arduino-replace-input'),
      btnFindNext: this.container.querySelector('#arduino-btn-find-next'),
      btnReplaceOne: this.container.querySelector('#arduino-btn-replace-one'),
      btnReplaceAll: this.container.querySelector('#arduino-btn-replace-all'),
      btnCloseFind: this.container.querySelector('#arduino-btn-close-find'),
      meterFlashFill: this.container.querySelector('#meter-flash-fill'),
      meterFlashText: this.container.querySelector('#meter-flash-text'),
      meterSramFill: this.container.querySelector('#meter-sram-fill'),
      meterSramText: this.container.querySelector('#meter-sram-text'),
      viewCanvas: this.container.querySelector('#arduino-view-canvas'),
      viewScope: this.container.querySelector('#arduino-view-scope'),
      scopeCh1: this.container.querySelector('#arduino-scope-ch1'),
      scopeCh2: this.container.querySelector('#arduino-scope-ch2'),
      scopeCh3: this.container.querySelector('#arduino-scope-ch3')
    };

    // Instantiate Hardware Canvas & Oscilloscope
    this.canvasController = new ArduinoCanvas(this.els.hwCanvas, this.board, this.interpreter);
    this.scope = new ArduinoScope(this.els.scopeCanvas, this.board);

    // Populate Scope Channel options dynamically from board pins
    this.populateScopeChannels();

    // Bind UI actions
    this.bindEvents();
    this.updateLineNumbers();
    this.renderPinTable();
  }

  populateScopeChannels() {
    const pins = this.board.getAllPins().filter(p => !p.isPower);
    const optionsHtml = pins.map(p => `<option value="${p.id}">${p.name} ${p.isPwm ? '(PWM)' : (p.isAnalog ? '(ADC)' : '')}</option>`).join('');
    
    this.els.scopeCh1.innerHTML = optionsHtml;
    this.els.scopeCh2.innerHTML = optionsHtml;
    this.els.scopeCh3.innerHTML = optionsHtml;

    this.els.scopeCh1.value = '13';
    this.els.scopeCh2.value = '9';
    this.els.scopeCh3.value = 'A0';

    this.scope.setSelectedPin(0, '13');
    this.scope.setSelectedPin(1, '9');
    this.scope.setSelectedPin(2, 'A0');
  }

  initSubscribers() {
    // Interpreter Serial Output
    this.interpreter.onSerialOutput = (text, newline) => {
      this.appendSerialText(text, newline);
    };

    // Interpreter Error
    this.interpreter.onError = (errMsg) => {
      this.logConsole(`[RUNTIME ERROR] ${errMsg}`, 'error');
      this.setSimStatus('ERROR');
    };

    // Interpreter Status Change
    this.interpreter.onStatusChange = (status) => {
      this.setSimStatus(status);
    };

    // Board Hardware Changes -> Update Pin Table
    this.board.subscribe(() => {
      this.updatePinTable();
    });

    // Board Debug Event Stream -> Feed Debug Timeline
    this.board.subscribeDebug((event) => {
      this.handleDebugEvent(event);
    });
  }

  handleDebugEvent(event) {
    const elapsedSec = (this.lastSimTime / 1000).toFixed(3);
    const entry = document.createElement('div');
    entry.className = `debug-entry debug-${event.type.toLowerCase()}`;

    let msg = `[+${elapsedSec}s] `;
    if (event.type === 'DIGITAL_WRITE') {
      msg += `Pin ${event.pin} -> ${event.val === 1 ? 'HIGH (5.00V)' : 'LOW (0.00V)'}`;
    } else if (event.type === 'ANALOG_WRITE') {
      msg += `PWM Pin ${event.pin} -> Duty ${event.duty}/255 (${Math.round(event.duty / 255 * 100)}%)`;
    } else if (event.type === 'ANALOG_READ') {
      msg += `ADC ${event.pin} -> Read ${event.raw} (${(event.raw * 5.0 / 1023).toFixed(2)}V)`;
    } else if (event.type === 'PIN_MODE') {
      msg += `Pin ${event.pin} pinMode set to ${event.mode === 1 ? 'OUTPUT' : (event.mode === 2 ? 'INPUT_PULLUP' : 'INPUT')}`;
    } else {
      msg += `${event.type}: ${JSON.stringify(event)}`;
    }

    entry.textContent = msg;
    this.els.debugTimelineBody.appendChild(entry);

    // Limit debug buffer to 200 entries to prevent memory leak
    if (this.els.debugTimelineBody.children.length > 200) {
      this.els.debugTimelineBody.removeChild(this.els.debugTimelineBody.firstChild);
    }
    this.els.debugTimelineBody.scrollTop = this.els.debugTimelineBody.scrollHeight;
  }

  bindEvents() {
    // 1. Sidebar Toggle
    this.els.btnToggleSidebar.addEventListener('click', () => {
      const isCollapsed = this.els.sidebarPane.classList.toggle('collapsed');
      this.els.btnToggleSidebar.classList.toggle('active', !isCollapsed);
    });

    // 2. Palette Click-to-Add Components
    this.container.querySelectorAll('.palette-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-comp-type');
        const name = btn.querySelector('.item-name')?.textContent || type;
        const comp = this.canvasController.addComponent(type, name);
        this.logConsole(`Added component: ${name} to workbench. Drag to position.`, 'info');
        this.triggerAutoSave();
      });
    });

    // 3. Project Templates
    this.container.querySelectorAll('.template-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tplId = btn.getAttribute('data-template-id');
        this.loadProjectTemplate(tplId);
      });
    });

    // 4. Preset Change
    this.els.presetSelect.addEventListener('change', (e) => {
      this.loadPreset(e.target.value);
    });

    // 5. Board Selector
    this.els.boardSelect.addEventListener('change', (e) => {
      this.setBoardType(e.target.value);
    });

    // 6. Speed Selector
    this.els.speedSelect.addEventListener('change', (e) => {
      this.simSpeed = parseFloat(e.target.value) || 1.0;
      this.logConsole(`Simulation clock speed multiplier set to ${this.simSpeed}x.`);
    });

    // 7. Beginner Mode Toggle
    this.els.toggleBeginner.addEventListener('change', (e) => {
      this.beginnerMode = e.target.checked;
      this.els.hintsPane.style.display = this.beginnerMode ? 'block' : 'none';
      if (this.beginnerMode) {
        this.runDiagnostics();
      }
    });

    // 8. Editor Tabs (Code vs Cheat Sheet)
    this.container.querySelectorAll('[data-editor-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.container.querySelectorAll('[data-editor-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const which = tab.getAttribute('data-editor-tab');
        const codeView = this.container.querySelector('#arduino-editor-view-code');
        const csView = this.container.querySelector('#arduino-editor-view-cheatsheet');
        if (which === 'code') {
          codeView.style.display = 'flex';
          csView.style.display = 'none';
        } else {
          codeView.style.display = 'none';
          csView.style.display = 'block';
        }
      });
    });

    // 9. Canvas Tabs (Workbench vs Oscilloscope)
    this.container.querySelectorAll('[data-canvas-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.container.querySelectorAll('[data-canvas-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCanvasTab = tab.getAttribute('data-canvas-tab');
        if (this.activeCanvasTab === 'canvas') {
          this.els.viewCanvas.style.display = 'flex';
          this.els.viewScope.style.display = 'none';
          this.canvasController.render();
        } else {
          this.els.viewCanvas.style.display = 'none';
          this.els.viewScope.style.display = 'flex';
          this.scope.render();
        }
      });
    });

    // 10. Scope Channel Selectors
    this.els.scopeCh1.addEventListener('change', (e) => this.scope.setSelectedPin(0, e.target.value));
    this.els.scopeCh2.addEventListener('change', (e) => this.scope.setSelectedPin(1, e.target.value));
    this.els.scopeCh3.addEventListener('change', (e) => this.scope.setSelectedPin(2, e.target.value));

    // 11. Bottom Drawer Tabs
    this.container.querySelectorAll('[data-bottom-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-bottom-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-bottom-tab');
        this.activeBottomTab = tab;
        ['console', 'serial', 'pins', 'debug', 'troubleshoot'].forEach(t => {
          const pane = this.container.querySelector(`#bottom-pane-${t}`);
          if (pane) pane.style.display = (t === tab) ? 'flex' : 'none';
        });
        if (tab === 'pins') this.updatePinTable();
      });
    });

    // 12. Editor Line Numbers and Scrolling
    this.els.codeEditor.addEventListener('input', () => {
      this.updateLineNumbers();
      this.triggerAutoSave();
    });

    this.els.codeEditor.addEventListener('scroll', () => {
      this.els.lineNumbers.scrollTop = this.els.codeEditor.scrollTop;
    });

    // 13. Editor Font Size
    this.els.editorFontSize.addEventListener('change', (e) => {
      const size = `${e.target.value}px`;
      this.els.codeEditor.style.fontSize = size;
      this.els.lineNumbers.style.fontSize = size;
      this.els.codeEditor.style.lineHeight = `${parseInt(e.target.value) + 7}px`;
      this.els.lineNumbers.style.lineHeight = `${parseInt(e.target.value) + 7}px`;
      this.updateLineNumbers();
    });

    // 14. Find & Replace
    this.els.btnToggleFind.addEventListener('click', () => {
      const isOpen = this.els.findReplaceBar.style.display === 'flex';
      this.els.findReplaceBar.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) this.els.findInput.focus();
    });

    this.els.btnCloseFind.addEventListener('click', () => {
      this.els.findReplaceBar.style.display = 'none';
    });

    this.els.btnFindNext.addEventListener('click', () => this.findNext());
    this.els.btnReplaceOne.addEventListener('click', () => this.replaceOne());
    this.els.btnReplaceAll.addEventListener('click', () => this.replaceAll());

    // 15. Editor Keydown (Tab key & shortcuts)
    this.els.codeEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.els.codeEditor.selectionStart;
        const end = this.els.codeEditor.selectionEnd;
        this.els.codeEditor.value = this.els.codeEditor.value.substring(0, start) + '  ' + this.els.codeEditor.value.substring(end);
        this.els.codeEditor.selectionStart = this.els.codeEditor.selectionEnd = start + 2;
        this.updateLineNumbers();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.compileCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.els.findReplaceBar.style.display = 'flex';
        this.els.findInput.focus();
      }
    });

    // 16. Error Banner Jump-To-Line
    this.els.errorJumpBtn.addEventListener('click', () => {
      const line = parseInt(this.els.errorJumpBtn.getAttribute('data-line') || '1');
      this.jumpToLine(line);
    });

    // 17. Verify, Run, Pause, Stop, Step
    this.els.btnVerify.addEventListener('click', () => this.compileCode());
    this.els.btnRun.addEventListener('click', () => this.runSimulation());
    this.els.btnPause.addEventListener('click', () => this.pauseSimulation());
    this.els.btnStop.addEventListener('click', () => this.stopSimulation());
    this.els.btnStep.addEventListener('click', () => this.stepSimulation(10));

    // 18. Workbench Canvas Controls
    this.els.btnClearCanvas.addEventListener('click', () => {
      if (confirm('Clear all components and wiring from the workbench?')) {
        this.canvasController.clearComponentsAndWires();
        this.logConsole('Cleared workbench components and wires.');
        this.triggerAutoSave();
      }
    });

    this.els.btnDelSelected.addEventListener('click', () => {
      if (this.canvasController.selectedWireIndex >= 0) {
        this.canvasController.deleteSelectedWire();
        this.logConsole('Deleted selected wire.');
        this.triggerAutoSave();
      } else if (this.canvasController.selectedComponent) {
        const name = this.canvasController.selectedComponent.name;
        this.canvasController.deleteSelectedComponent();
        this.logConsole(`Deleted component: ${name}.`);
        this.triggerAutoSave();
      }
    });

    // 19. Serial Monitor I/O
    this.els.btnSendSerial.addEventListener('click', () => this.sendSerial());
    this.els.serialInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendSerial();
    });
    this.els.btnClearSerial.addEventListener('click', () => {
      this.els.serialOutput.innerHTML = '';
    });

    // 20. Debug Timeline Clear
    this.els.btnClearDebug.addEventListener('click', () => {
      this.els.debugTimelineBody.innerHTML = '<div class="debug-entry debug-system">Timeline cleared.</div>';
    });

    // 21. Pin Search Filter
    this.els.pinSearchInput.addEventListener('input', (e) => {
      this.filterPinTable(e.target.value.toLowerCase().trim());
    });

    // 22. New Project / Export / Import
    this.els.btnNewProject.addEventListener('click', () => {
      this.loadProjectTemplate('blank');
    });

    this.els.btnExport.addEventListener('click', () => this.exportProject());
    this.els.fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.importProject(file);
    });

    // 23. Diagnostics Run
    this.els.btnRunDiag.addEventListener('click', () => this.runDiagnostics());
  }

  loadInitialSketch() {
    try {
      const autosaved = localStorage.getItem('esamastha_arduino_autosave');
      if (autosaved) {
        const project = JSON.parse(autosaved);
        if (project && project.code) {
          this.applyProjectData(project);
          this.logConsole('Restored your autosaved sketch and workbench from local storage.', 'info');
          return;
        }
      }
    } catch (_) {}
    this.loadPreset('blink');
  }

  loadPreset(presetId) {
    const preset = ARDUINO_PRESETS.find(p => p.id === presetId) || ARDUINO_PRESETS[0];
    this.currentPresetId = preset.id;
    this.stopSimulation();

    // Set code in editor
    this.els.codeEditor.value = preset.code.trim();
    this.updateLineNumbers();
    this.updateMemoryMeters(preset.code);

    // Load components and wiring in canvas
    this.canvasController.setPreset(preset);

    this.logConsole(`Loaded Example Preset: "${preset.name}". Click 'Run' to simulate hardware.`);
    this.els.compileStatus.textContent = 'Preset Loaded';
    this.els.compileStatus.className = 'arduino-compile-status';
    this.hideErrorBanner();
    this.triggerAutoSave();
  }

  loadProjectTemplate(tplId) {
    const tpl = PROJECT_TEMPLATES.find(t => t.id === tplId) || PROJECT_TEMPLATES[0];
    if (tpl.presetId) {
      this.loadPreset(tpl.presetId);
      this.els.presetSelect.value = tpl.presetId;
    } else {
      this.stopSimulation();
      this.els.codeEditor.value = tpl.code.trim();
      this.updateLineNumbers();
      this.updateMemoryMeters(tpl.code);
      this.canvasController.clearComponentsAndWires();
      this.logConsole(`Created project from template: "${tpl.name}".`, 'info');
      this.els.compileStatus.textContent = 'Ready';
      this.els.compileStatus.className = 'arduino-compile-status';
      this.hideErrorBanner();
      this.triggerAutoSave();
    }
  }

  setBoardType(type) {
    this.board.type = type;
    this.board.reset();
    this.canvasController.computePinPositions();
    this.canvasController.requestRender();
    this.populateScopeChannels();
    this.renderPinTable();
    this.logConsole(`Switched virtual microcontroller target to Arduino ${type}.`);
  }

  compileCode() {
    const code = this.els.codeEditor.value;
    this.logConsole('Compiling sketch with e-Samastha Embedded C++ Compiler...');
    const result = this.interpreter.compile(code);

    if (result.success) {
      this.updateMemoryMeters(code);
      this.els.compileStatus.textContent = 'Compiled Successfully';
      this.els.compileStatus.className = 'arduino-compile-status success';
      this.hideErrorBanner();
      this.logConsole(`✓ Compilation Successful!\nATmega328P Flash: ${this.lastFlashBytes} bytes (${this.lastFlashPct}%). SRAM: ${this.lastSramBytes} bytes (${this.lastSramPct}%).\n0 Errors, 0 Warnings. Ready to upload.`, 'success');
      return true;
    } else {
      this.els.compileStatus.textContent = 'Compile Error';
      this.els.compileStatus.className = 'arduino-compile-status error';
      this.showErrorBanner(result.error);
      this.logConsole(`✗ ${result.error}`, 'error');
      return false;
    }
  }

  updateMemoryMeters(code) {
    const flashBytes = Math.round(code.length * 1.8 + 840);
    const sramBytes = Math.round(code.length * 0.4 + 180);
    const flashPct = Math.min(100, Math.round(flashBytes / 32256 * 100));
    const sramPct = Math.min(100, Math.round(sramBytes / 2048 * 100));

    this.lastFlashBytes = flashBytes;
    this.lastFlashPct = flashPct;
    this.lastSramBytes = sramBytes;
    this.lastSramPct = sramPct;

    this.els.meterFlashFill.style.width = `${flashPct}%`;
    this.els.meterFlashText.textContent = `${flashBytes.toLocaleString()} / 32,256 bytes (${flashPct}%)`;
    this.els.meterSramFill.style.width = `${sramPct}%`;
    this.els.meterSramText.textContent = `${sramBytes.toLocaleString()} / 2,048 bytes (${sramPct}%)`;
  }

  showErrorBanner(errorMsg) {
    this.els.errorBanner.style.display = 'flex';
    this.els.errorBannerText.textContent = errorMsg;

    const lineMatch = errorMsg.match(/\[Line (\d+)/i) || errorMsg.match(/line (\d+)/i);
    if (lineMatch) {
      const lineNum = lineMatch[1];
      this.els.errorJumpBtn.style.display = 'inline-block';
      this.els.errorJumpBtn.textContent = `Jump to line ${lineNum}`;
      this.els.errorJumpBtn.setAttribute('data-line', lineNum);
    } else {
      this.els.errorJumpBtn.style.display = 'none';
    }
  }

  hideErrorBanner() {
    this.els.errorBanner.style.display = 'none';
  }

  jumpToLine(lineNum) {
    const lines = this.els.codeEditor.value.split('\n');
    let charIndex = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      charIndex += lines[i].length + 1;
    }
    const endChar = charIndex + (lines[lineNum - 1] ? lines[lineNum - 1].length : 0);

    this.els.codeEditor.focus();
    this.els.codeEditor.setSelectionRange(charIndex, endChar);

    // Scroll editor to target line
    const lineHeight = 20;
    this.els.codeEditor.scrollTop = Math.max(0, (lineNum - 5) * lineHeight);
    this.els.lineNumbers.scrollTop = this.els.codeEditor.scrollTop;
  }

  findNext() {
    const text = this.els.findInput.value;
    if (!text) return;
    const editor = this.els.codeEditor;
    const val = editor.value;
    const start = editor.selectionEnd;
    const idx = val.indexOf(text, start);

    if (idx !== -1) {
      editor.focus();
      editor.setSelectionRange(idx, idx + text.length);
    } else {
      // Wrap around
      const wrapIdx = val.indexOf(text, 0);
      if (wrapIdx !== -1) {
        editor.focus();
        editor.setSelectionRange(wrapIdx, wrapIdx + text.length);
      }
    }
  }

  replaceOne() {
    const text = this.els.findInput.value;
    const rep = this.els.replaceInput.value;
    if (!text) return;
    const editor = this.els.codeEditor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    if (editor.value.substring(start, end) === text) {
      editor.value = editor.value.substring(0, start) + rep + editor.value.substring(end);
      editor.setSelectionRange(start, start + rep.length);
      this.updateLineNumbers();
      this.triggerAutoSave();
    }
    this.findNext();
  }

  replaceAll() {
    const text = this.els.findInput.value;
    const rep = this.els.replaceInput.value;
    if (!text) return;
    const editor = this.els.codeEditor;
    editor.value = editor.value.split(text).join(rep);
    this.updateLineNumbers();
    this.triggerAutoSave();
  }

  runSimulation() {
    if (this.interpreter.status === 'PAUSED') {
      this.interpreter.start();
      this.startSimTimer();
      return;
    }

    const code = this.els.codeEditor.value;
    const res = this.interpreter.loadSketch(code);

    if (!res.success) {
      this.compileCode();
      return;
    }

    this.els.compileStatus.textContent = 'Running';
    this.els.compileStatus.className = 'arduino-compile-status success';
    this.logConsole(`Uploading sketch to virtual ${this.board.type}...\n16MHz execution started.`, 'info');
    this.hideErrorBanner();

    this.interpreter.start();
    this.lastSimTime = 0;
    this.startSimTimer();

    if (this.beginnerMode) {
      this.runDiagnostics();
    }
  }

  startSimTimer() {
    if (this.simInterval) clearInterval(this.simInterval);

    this.els.btnRun.disabled = true;
    this.els.btnPause.disabled = false;
    this.els.btnStop.disabled = false;
    this.lastTickTime = performance.now();

    // 20ms tick timer (50 virtual scheduler ticks/sec)
    this.simInterval = setInterval(() => {
      const now = performance.now();
      const delta = (now - this.lastTickTime) * this.simSpeed;
      this.lastTickTime = now;
      this.lastSimTime += delta;

      // 1. Advance virtual MCU execution
      this.interpreter.step(delta);

      // 2. Sample signal oscilloscope channels
      this.scope.sample();

      // 3. Render active canvas view
      if (this.activeCanvasTab === 'scope') {
        this.scope.render();
      } else {
        this.canvasController.render();
      }
    }, 20);
  }

  pauseSimulation() {
    this.interpreter.pause();
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.els.btnRun.disabled = false;
    this.els.btnPause.disabled = true;
    this.logConsole('Simulation paused.', 'info');
  }

  stopSimulation() {
    this.interpreter.stop();
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.board.reset();
    this.canvasController.render();
    if (this.activeCanvasTab === 'scope') this.scope.render();
    this.updatePinTable();

    this.els.btnRun.disabled = false;
    this.els.btnPause.disabled = true;
    this.els.btnStop.disabled = true;
    this.setSimStatus('STOPPED');
    this.logConsole('Simulation stopped and virtual hardware reset.', 'info');
  }

  stepSimulation(ms = 10) {
    if (this.interpreter.status === 'STOPPED') {
      const code = this.els.codeEditor.value;
      const res = this.interpreter.loadSketch(code);
      if (!res.success) {
        this.compileCode();
        return;
      }
      this.interpreter.start();
    }
    this.interpreter.step(ms);
    this.lastSimTime += ms;
    this.scope.sample();
    if (this.activeCanvasTab === 'scope') {
      this.scope.render();
    } else {
      this.canvasController.render();
    }
    this.updatePinTable();
    this.logConsole(`Stepped simulation by ${ms}ms. Virtual millis: ${this.board.clock.millis()}`, 'info');
  }

  setSimStatus(status) {
    this.els.simStatus.textContent = status;
    this.els.simStatus.className = `sim-status-badge status-${status.toLowerCase()}`;
  }

  sendSerial() {
    const text = this.els.serialInput.value;
    if (!text) return;
    this.els.serialInput.value = '';

    // Echo to serial output pane
    const ts = this.els.serialTimestamps.checked ? `[${new Date().toLocaleTimeString()}] ` : '';
    this.appendSerialText(`${ts}> ${text}`, true, 'serial-echo');

    // Feed to MCU UART buffer
    this.interpreter.sendSerialInput(text + '\n');
  }

  appendSerialText(text, newline = false, extraClass = '') {
    const line = document.createElement('span');
    line.className = `serial-line ${extraClass}`;
    line.textContent = text + (newline ? '\n' : '');
    this.els.serialOutput.appendChild(line);

    if (this.els.serialAutoScroll.checked) {
      this.els.serialOutput.scrollTop = this.els.serialOutput.scrollHeight;
    }
  }

  logConsole(message, type = 'normal') {
    const line = document.createElement('div');
    line.className = `console-msg msg-${type}`;
    line.textContent = message;
    this.els.consoleLog.appendChild(line);
    this.els.consoleLog.scrollTop = this.els.consoleLog.scrollHeight;
  }

  updateLineNumbers() {
    const lines = this.els.codeEditor.value.split('\n');
    let numbers = '';
    for (let i = 1; i <= lines.length; i++) {
      numbers += `${i}\n`;
    }
    this.els.lineNumbers.textContent = numbers;
  }

  renderPinTable() {
    const pins = this.board.getAllPins().filter(p => !p.isPower);
    this.els.pinTableBody.innerHTML = pins.map(p => {
      const modeStr = p.mode === 1 ? 'OUTPUT' : (p.mode === 2 ? 'INPUT_PULLUP' : 'INPUT');
      const stateBadge = p.digitalValue === 1 ? '<span class="badge-high">HIGH</span>' : '<span class="badge-low">LOW</span>';
      return `
        <tr id="pin-row-${p.id}">
          <td class="pin-name">${p.name}</td>
          <td class="pin-type">${p.isAnalog ? 'Analog/ADC' : (p.isPwm ? 'Digital (PWM)' : 'Digital')}</td>
          <td class="pin-mode">${modeStr}</td>
          <td class="pin-state">${stateBadge}</td>
          <td class="pin-voltage">${p.voltage.toFixed(2)} V</td>
          <td class="pin-pwm">${p.isPwm ? p.pwmDuty : '—'}</td>
          <td class="pin-adc">${p.isAnalog ? p.rawAdc : '—'}</td>
        </tr>
      `;
    }).join('');
  }

  updatePinTable() {
    const pins = this.board.getAllPins().filter(p => !p.isPower);
    for (const p of pins) {
      const row = this.els.pinTableBody.querySelector(`#pin-row-${p.id}`);
      if (!row) continue;
      const modeStr = p.mode === 1 ? 'OUTPUT' : (p.mode === 2 ? 'INPUT_PULLUP' : 'INPUT');
      const stateBadge = p.digitalValue === 1 ? '<span class="badge-high">HIGH</span>' : '<span class="badge-low">LOW</span>';

      row.querySelector('.pin-mode').textContent = modeStr;
      row.querySelector('.pin-state').innerHTML = stateBadge;
      row.querySelector('.pin-voltage').textContent = `${p.voltage.toFixed(2)} V`;
      if (p.isPwm) row.querySelector('.pin-pwm').textContent = p.pwmDuty;
      if (p.isAnalog) row.querySelector('.pin-adc').textContent = p.rawAdc;
    }
  }

  filterPinTable(filter) {
    const rows = this.els.pinTableBody.querySelectorAll('tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = (!filter || text.includes(filter)) ? '' : 'none';
    });
  }

  runDiagnostics() {
    const issues = [];
    const comps = this.canvasController.components;
    const wires = this.canvasController.wires;

    // Check power constraints
    for (const c of comps) {
      if (c.powerState === 'MISSING_VCC') {
        issues.push({ level: 'warn', msg: `Component "${c.name}" has no VCC (5V) power rail connected.` });
      } else if (c.powerState === 'MISSING_GND') {
        issues.push({ level: 'warn', msg: `Component "${c.name}" has no GND ground rail connected.` });
      }
    }

    // Check LED connections
    const leds = comps.filter(c => c.type === 'LED' || c.type === 'RGB_LED');
    for (const led of leds) {
      const anodeWire = wires.find(w => w.from.startsWith(`${led.id}.anode`));
      const cathodeWire = wires.find(w => w.from.startsWith(`${led.id}.cathode`));

      if (!anodeWire) {
        issues.push({ level: 'warn', msg: `LED "${led.name}" anode (+) is not wired to any microcontroller pin.` });
      }
      if (!cathodeWire) {
        issues.push({ level: 'warn', msg: `LED "${led.name}" cathode (-) is not wired to GND.` });
      }
      if (anodeWire && cathodeWire) {
        const pin = this.board.getPin(anodeWire.to);
        if (pin && pin.mode !== 1) {
          issues.push({ level: 'info', msg: `Pin ${pin.name} wired to LED anode is configured as ${pin.mode === 0 ? 'INPUT' : 'INPUT_PULLUP'}. Use pinMode(${pin.name}, OUTPUT); in setup().` });
        }
      }
    }

    // Check code structure
    const code = this.els.codeEditor.value;
    if (!code.includes('void setup()') && !code.includes('void setup ()')) {
      issues.push({ level: 'error', msg: 'Missing setup() function in sketch.' });
    }
    if (!code.includes('void loop()') && !code.includes('void loop ()')) {
      issues.push({ level: 'error', msg: 'Missing loop() function in sketch.' });
    }

    // Render results
    if (issues.length === 0) {
      this.els.diagResults.innerHTML = `
        <div class="diag-item diag-pass">
          <span class="diag-icon">✓</span>
          <div>
            <strong>All Checks Passed!</strong>
            <p>Power rails, pin modes, and circuit connections look fully functional.</p>
          </div>
        </div>
      `;
    } else {
      this.els.diagResults.innerHTML = issues.map(iss => `
        <div class="diag-item diag-${iss.level}">
          <span class="diag-icon">${iss.level === 'error' ? '✗' : (iss.level === 'warn' ? '⚠️' : 'ℹ️')}</span>
          <div>${iss.msg}</div>
        </div>
      `).join('');
    }

    if (this.beginnerMode) {
      this.els.hintsContent.textContent = issues.length > 0 
        ? `Found ${issues.length} circuit tip(s): ${issues[0].msg}`
        : 'Circuit wiring and sketch structure are in good shape! Click Run to simulate.';
    }
  }

  triggerAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave();
    }, 1500);
  }

  performAutoSave() {
    const project = this.buildProjectObject('autosave');
    try {
      localStorage.setItem('esamastha_arduino_autosave', JSON.stringify(project));
      this.els.autosaveIndicator.textContent = `● Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      this.els.autosaveIndicator.classList.add('saved');
    } catch (_) {}
  }

  buildProjectObject(name = 'Untitled Arduino Project') {
    return {
      meta: {
        format: 'swino',
        version: '1.0',
        platform: 'e-Samastha Arduino Lab',
        name,
        updatedAt: new Date().toISOString()
      },
      board: this.board.type,
      code: this.els.codeEditor.value,
      components: this.canvasController.components.map(c => ({
        id: c.id,
        type: c.type,
        name: c.name,
        x: c.x,
        y: c.y,
        state: c.state
      })),
      wires: this.canvasController.wires
    };
  }

  applyProjectData(project) {
    if (project.code) {
      this.els.codeEditor.value = project.code;
      this.updateLineNumbers();
      this.updateMemoryMeters(project.code);
    }
    if (project.board) {
      this.els.boardSelect.value = project.board;
      this.setBoardType(project.board);
    }
    if (project.components) {
      this.canvasController.setPreset(project);
    }
  }

  exportProject() {
    const project = this.buildProjectObject(`Project_${Date.now()}`);
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esamastha_arduino_${Date.now()}.swino`;
    a.click();
    URL.revokeObjectURL(url);
    this.logConsole('Exported project as .swino file.', 'success');
  }

  importProject(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (file.name.endsWith('.ino')) {
          this.els.codeEditor.value = text;
          this.updateLineNumbers();
          this.updateMemoryMeters(text);
          this.logConsole(`Imported Arduino sketch "${file.name}".`, 'success');
        } else {
          const project = JSON.parse(text);
          this.applyProjectData(project);
          this.logConsole(`Imported e-Samastha Arduino Lab project "${file.name}".`, 'success');
        }
        this.triggerAutoSave();
      } catch (err) {
        this.logConsole(`Failed to import file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  destroy() {
    this.stopSimulation();
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }
}
