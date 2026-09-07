/**
 * Switcha Main Application Controller
 * Routing, Component Palette, Simulation Loop, Properties Inspector,
 * My Circuits Hub, Live Network Auto-Sync, and PWA Offline Suite.
 */

import { ComponentTypes, ComponentDefinitions, ComponentCategory, formatValueWithPrefix, parseEngineeringValue } from './engine/components.js';
import { CircuitEngine } from './engine/circuit-engine.js';
import { SchematicCanvas } from './editor/schematic-canvas.js';
import { CircuitGrapher } from './editor/grapher.js';
import { CircuitLibrary } from './editor/circuit-library.js';
import { firebaseService } from './services/firebase-service.js';
import { storageService, SwitchaStorageService } from './services/storage-service.js';
import { DigitalMultimeter, LogicAnalyzer, SpectrumAnalyzer } from './editor/instruments.js';
import { BlockTypes, BlockCategory, BlockDefinitions } from './blocks/block-types.js';
import { BlockEngine, SwitchaBlocksEngine } from './blocks/block-engine.js';
import { BlockCanvas, SwitchaBlocksCanvas } from './blocks/block-canvas.js';
import { BlockScope, SwitchaBlocksScope } from './blocks/block-scope.js';
import { BlockLibrary, SwitchaBlocksLibrary } from './blocks/block-library.js';
import { SwitchaMath, CodeEngine, SwitchaCodeEngine } from './code/code-engine.js';
import { SwitchaPlot, SwitchaPlotter } from './code/code-plotter.js';
import { SwitchaCodeEditor } from './code/code-editor.js';

class SwitchaApp {
  constructor() {
    this.engine = new CircuitEngine();
    this.canvas = null;
    this.grapher = null;
    this.isSimRunning = false;
    this.simAnimFrame = null;
    this.lastTimestamp = 0;
    this.activeMyCircuitId = null;
    this._toastTimer = null;

    // Switcha Blocks Environment
    this.blocksEngine = null;
    this.blocksCanvas = null;
    this.blocksScope = null;
    this.isBlocksSimRunning = false;
    this.blocksSimAnimFrame = null;
    this.activeModelId = null;

    // Switcha Code Environment
    this.codeEditor = null;

    // Lab Instruments Suite
    this.instruments = { dmm: null, logicAnalyzer: null, spectrumAnalyzer: null };

    this.currentView = 'home';
    this.currentMode = 'split'; // 'schematic', 'split', 'grapher'
    this.currentWorkspaceTab = 'circuits'; // 'circuits', 'models', 'scripts'

    this.init();
  }

  init() {
    // 1. Initialize Canvas & Grapher
    const schematicCanvasEl = document.getElementById('schematicCanvas');
    const grapherCanvasEl = document.getElementById('grapherCanvas');

    this.canvas = new SchematicCanvas(schematicCanvasEl, this.engine);
    this.grapher = new CircuitGrapher(grapherCanvasEl, this.engine);

    // Sync Engine with Canvas
    this.canvas.onCircuitModified = (comps, wires) => {
      this.engine.setCircuit(comps, wires);
      this.grapher.render();
    };

    // Selection listener for Properties Inspector
    this.canvas.onSelectionChange = (selection) => {
      this.renderPropertiesInspector(selection);
    };

    // Placement Mode listener for UI Banner and Quick-Bar Highlighting
    this.canvas.onPlacementChange = (type) => {
      this.updatePlacementBanner(type ? ComponentDefinitions[type] : null);
    };

    // HTML5 Drag-and-Drop from Palette onto Schematic Canvas
    schematicCanvasEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    schematicCanvasEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const compType = e.dataTransfer?.getData('text/plain');
      if (compType && ComponentDefinitions[compType]) {
        const worldPos = this.canvas.screenToWorld(e.clientX, e.clientY);
        this.canvas.addComponent(compType, worldPos.x, worldPos.y);
      }
    });

    // 2. Build Component Palette Sidebar
    this.buildPalette();

    // 3. Setup UI Event Listeners, PWA, Network Sync, My Circuits & Router
    this.initPWA();
    this.initNetworkSyncMonitor();
    this.initFirebaseAuth();
    this.initMyCircuitsPage();
    this.initWorkspaceTabs();
    this.initLabInstruments();
    this.initBlocksEnvironment();
    this.initCodeEnvironment();
    this.initRouter();
    this.initToolbarControls();
    this.initModals();
    this.initFeaturedCards();
    this.initDiscoverPage();
    this.initSplitGutter();
    this.initQuickSearch();

    // 4. Populate Presets Dropdown
    this.populatePresetDropdown();

    // 5. Load initial default circuit (Buck Converter)
    this.loadCircuitPreset('buckConverter');

    // 6. Initial resize & render
    setTimeout(() => {
      this.canvas.resize();
      this.grapher.resize();
    }, 100);
  }

  // --- Toast Notification Helper ---
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('switchaToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `switcha-toast ${type} active`;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

  // --- Network Online / Offline Auto-Sync Monitor ---
  initNetworkSyncMonitor() {
    const pill = document.getElementById('networkStatusPill');
    const statusText = document.getElementById('networkStatusText');
    if (!pill || !statusText) return;

    const updateNetworkStatus = (isOnline, isInitial = false) => {
      if (isOnline) {
        pill.className = 'network-status-pill online';
        statusText.textContent = 'Online';
        pill.title = 'Network status: Online — circuits synced';
        if (!isInitial) {
          pill.classList.add('syncing');
          statusText.textContent = 'Syncing...';
          setTimeout(() => {
            pill.classList.remove('syncing');
            statusText.textContent = 'Online';
            this.showToast('🌐 Connected online — Circuits synced with cloud!', 'success');
          }, 800);
        }
      } else {
        pill.className = 'network-status-pill offline';
        statusText.textContent = 'Offline';
        pill.title = 'Network status: Offline — saving locally';
        if (!isInitial) {
          this.showToast('📴 Working offline — All changes saved locally', 'warning');
        }
      }
    };

    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));
    updateNetworkStatus(navigator.onLine, true);
  }

  // --- My Circuits Hub & Storage Management ---
  getMyCircuits() {
    // Default starter circuits
    const starterCircuits = [
      {
        id: 'circuit_starter_rc_oscillator',
        name: 'Op-Amp RC Phase Shift Sine Wave Oscillator',
        description: 'Exact Multisim 3-stage RC high-pass ladder oscillator with 741 Op-Amp (R1=33k, R2=1M, R6=33k, C1=C2=C3=0.1µF, R3=R4=R5=3.3k) generating sustained 200Hz sinusoidal oscillations.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 900000,
        presetKey: 'rcPhaseShiftOscillator',
        components: [],
        wires: []
      },
      {
        id: 'circuit_starter_sample_hold',
        name: 'Sample & Hold Amplifier Circuit',
        description: 'Precision Analog-to-Digital Converter front-end Sample & Hold circuit sampling a 1 kHz analog sine wave at 10 kHz clock rate with holding capacitor and buffered staircase waveform output.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 600000,
        presetKey: 'sampleAndHoldCircuit',
        components: [],
        wires: []
      },
      {
        id: 'circuit_starter_1',
        name: 'Interactive Switch & LED Lamp',
        description: 'Dual interactive switch setup: SPST toggle switch powering an incandescent light bulb and glowing LED indicator with 9V DC source.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 3600000,
        presetKey: 'switchSpstLamp',
        components: [
          { id: 'txt1', type: ComponentTypes.TEXT_LABEL, x: 340, y: 50, params: { text: 'INTERACTIVE SWITCH & LED LAMP', fontSize: 14, bold: true, color: '#334155' }, rotation: 0, flipX: false, flipY: false },
          { id: 'v1', type: ComponentTypes.DC_VOLTAGE, x: 120, y: 220, params: { voltage: 9 }, rotation: 0, flipX: false, flipY: false },
          { id: 'gnd1', type: ComponentTypes.GROUND, x: 120, y: 340, params: {}, rotation: 0, flipX: false, flipY: false },
          { id: 'sw1', type: ComponentTypes.SPST_SWITCH, x: 260, y: 140, params: { closed: true, name: 'Main Power' }, rotation: 0, flipX: false, flipY: false },
          { id: 'lamp1', type: ComponentTypes.LAMP, x: 420, y: 140, params: { ratedVoltage: 9, ratedPower: 2 }, rotation: 0, flipX: false, flipY: false },
          { id: 'r1', type: ComponentTypes.RESISTOR, x: 340, y: 260, params: { resistance: 330 }, rotation: 0, flipX: false, flipY: false },
          { id: 'led1', type: ComponentTypes.LED, x: 440, y: 260, params: { color: '#ff3b30' }, rotation: 0, flipX: false, flipY: false },
          { id: 'pr1', type: ComponentTypes.PROBE_V, x: 500, y: 80, params: { color: '#03b585', label: 'V_switched' }, rotation: 0, flipX: false, flipY: false }
        ],
        wires: [
          { id: 'w1', fromPin: 'v1:p_neg', toPin: 'gnd1:p1' },
          { id: 'w2', fromPin: 'v1:p_pos', toPin: 'sw1:p1' },
          { id: 'w3', fromPin: 'sw1:p2', toPin: 'lamp1:p1' },
          { id: 'w4', fromPin: 'sw1:p2', toPin: 'r1:p1' },
          { id: 'w5', fromPin: 'sw1:p2', toPin: 'pr1:tip' },
          { id: 'w6', fromPin: 'lamp1:p2', toPin: 'gnd1:p1' },
          { id: 'w7', fromPin: 'r1:p2', toPin: 'led1:anode' },
          { id: 'w8', fromPin: 'led1:cathode', toPin: 'gnd1:p1' }
        ]
      },
      {
        id: 'circuit_starter_2',
        name: '555 Timer Astable Flasher',
        description: 'Square wave pulse generator with RC timing network driving an oscillating LED indicator.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 7200000,
        presetKey: 'timer555',
        components: [],
        wires: []
      },
      {
        id: 'circuit_starter_3',
        name: 'Digital Logic Half Adder',
        description: 'XOR and AND gates computing binary SUM and CARRY from interactive input logic levels.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 14400000,
        presetKey: 'halfAdder',
        components: [],
        wires: []
      },
      {
        id: 'circuit_starter_nor_suite',
        name: 'Universal Logic: NOR Gate Equivalents',
        description: 'Complete digital logic laboratory: NOT, OR, AND, and XOR gates constructed entirely from 2-input NOR gates with DG interactive switches and LED indicators.',
        author: 'Switcha Studio',
        updatedAt: Date.now() - 1800000,
        presetKey: 'universalNorGates',
        components: [],
        wires: []
      }
    ];

    try {
      const data = localStorage.getItem('switcha_my_circuits');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure essential starter circuits like RC oscillator are present in the list
          starterCircuits.forEach(sc => {
            const hasIt = parsed.some(c => c.id === sc.id || (sc.presetKey && c.presetKey === sc.presetKey));
            if (!hasIt) parsed.push(sc);
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Switcha] Failed to read my circuits from localStorage:', e);
    }

    this.saveMyCircuits(starterCircuits);
    return starterCircuits;
  }

  saveMyCircuits(circuits) {
    try {
      localStorage.setItem('switcha_my_circuits', JSON.stringify(circuits));
    } catch (e) {
      console.warn('[Switcha] Failed to write my circuits to localStorage:', e);
    }
  }

  saveCurrentCircuitToMyCircuits(customName = null) {
    const circuits = this.getMyCircuits();
    const nameInput = document.getElementById('circuitNameInput');
    const name = customName || (nameInput ? nameInput.value.trim() : 'Untitled Circuit') || 'Untitled Circuit';

    // Clone current components and wires
    const currentComponents = JSON.parse(JSON.stringify(this.canvas.components));
    const currentWires = JSON.parse(JSON.stringify(this.canvas.wires));

    // Check if currently editing an existing circuit
    const existingIndex = this.activeMyCircuitId ? circuits.findIndex(c => c.id === this.activeMyCircuitId) : -1;

    let targetCircuit;
    if (existingIndex >= 0) {
      circuits[existingIndex].name = name;
      circuits[existingIndex].components = currentComponents;
      circuits[existingIndex].wires = currentWires;
      circuits[existingIndex].updatedAt = Date.now();
      targetCircuit = circuits[existingIndex];
    } else {
      const newId = 'circuit_' + Date.now();
      targetCircuit = {
        id: newId,
        name: name,
        description: `Custom electronic circuit with ${currentComponents.length} components and ${currentWires.length} connections.`,
        author: 'You',
        updatedAt: Date.now(),
        components: currentComponents,
        wires: currentWires
      };
      circuits.unshift(targetCircuit);
      this.activeMyCircuitId = newId;
    }

    this.saveMyCircuits(circuits);
    this.renderMyCircuits();
    this.showToast(`💾 "${name}" saved to My Circuits!`, 'success');

    // Sync to Cloud Firestore if user is authenticated
    firebaseService.saveCircuit(targetCircuit);
  }

  async loadCircuitFromMyCircuits(circuitId) {
    let circuits = this.getMyCircuits();
    let circuit = circuits.find(c => c.id === circuitId);

    if (!circuit && window.SwitchaStorage) {
      try {
        circuit = await window.SwitchaStorage.getCircuit(circuitId);
      } catch (_) {}
    }
    if (!circuit) return;

    this.activeMyCircuitId = circuit.id;

    if (circuit.presetKey && CircuitLibrary[circuit.presetKey] && (!circuit.components || circuit.components.length === 0 || circuit.id.startsWith('circuit_starter_'))) {
      this.loadCircuitPreset(circuit.presetKey);
    } else {
      this.engine.reset();
      this.canvas.saveState();
      this.canvas.components = JSON.parse(JSON.stringify(circuit.components || []));
      this.canvas.wires = JSON.parse(JSON.stringify(circuit.wires || []));
      this.engine.setCircuit(this.canvas.components, this.canvas.wires);

      const preset = circuit.presetKey ? CircuitLibrary[circuit.presetKey] : null;
      const isRcOsc = (circuit.name && circuit.name.toLowerCase().includes('rc phase shift')) || (circuit.presetKey === 'rcPhaseShiftOscillator');
      const isSH = (circuit.name && (circuit.name.toLowerCase().includes('sample') && circuit.name.toLowerCase().includes('hold'))) || (circuit.presetKey === 'sampleAndHoldCircuit');

      if (this.grapher) {
        if (circuit.timePerDiv) {
          this.grapher.setTimeScale(circuit.timePerDiv);
        } else if (preset && preset.timePerDiv) {
          this.grapher.setTimeScale(preset.timePerDiv);
        } else if (isRcOsc) {
          this.grapher.setTimeScale(0.002);
        } else if (isSH) {
          this.grapher.setTimeScale(0.0005);
        }

        if (circuit.voltsPerDiv) {
          this.grapher.setVoltScale(circuit.voltsPerDiv);
        } else if (preset && preset.voltsPerDiv) {
          this.grapher.setVoltScale(preset.voltsPerDiv);
        } else if (isRcOsc) {
          this.grapher.setVoltScale(5.0);
        } else if (isSH) {
          this.grapher.setVoltScale(2.0);
        }
      }

      const nameInput = document.getElementById('circuitNameInput');
      if (nameInput) nameInput.value = circuit.name;
      document.title = `${circuit.name} - Switcha`;

      // Automatically start simulation on loading circuit
      this.startSimulation();

      setTimeout(() => {
        this.canvas.resize();
        this.canvas.fitToScreen();
        this.grapher.resize();
        this.canvas.render();
        this.grapher.render();
      }, 50);
    }

    window.location.hash = '#/create';
    this.showToast(`⚡ Opened "${circuit.name}" in Studio`, 'info');
  }

  deleteCircuit(circuitId) {
    let circuits = this.getMyCircuits();
    const target = circuits.find(c => c.id === circuitId);
    if (!target) return;
    if (confirm(`Are you sure you want to delete "${target.name}"?`)) {
      circuits = circuits.filter(c => c.id !== circuitId);
      if (this.activeMyCircuitId === circuitId) this.activeMyCircuitId = null;
      this.saveMyCircuits(circuits);
      this.renderMyCircuits();
      firebaseService.deleteCircuit(circuitId);
      this.showToast(`🗑️ "${target.name}" deleted`, 'warning');
    }
  }

  duplicateCircuit(circuitId) {
    const circuits = this.getMyCircuits();
    const target = circuits.find(c => c.id === circuitId);
    if (!target) return;

    let components = target.components;
    let wires = target.wires;
    if (target.presetKey && CircuitLibrary[target.presetKey] && (!components || components.length === 0)) {
      const tempCanvas = {
        components: [],
        wires: [],
        addComponent(type, x, y, params, rot) {
          const comp = { id: `c_${this.components.length + 1}`, type, x, y, params: params || {}, rotation: rot || 0, flipX: false, flipY: false };
          this.components.push(comp);
          return comp;
        },
        fitToScreen() {}
      };
      CircuitLibrary[target.presetKey].load(tempCanvas);
      components = tempCanvas.components;
      wires = tempCanvas.wires;
    }

    const newCircuit = {
      id: 'circuit_' + Date.now(),
      name: `${target.name} (Copy)`,
      description: target.description,
      author: 'You',
      updatedAt: Date.now(),
      components: JSON.parse(JSON.stringify(components || [])),
      wires: JSON.parse(JSON.stringify(wires || []))
    };

    circuits.unshift(newCircuit);
    this.saveMyCircuits(circuits);
    this.renderMyCircuits();
    this.showToast(`📋 Duplicated "${target.name}"`, 'success');
  }

  renameCircuit(circuitId) {
    const circuits = this.getMyCircuits();
    const target = circuits.find(c => c.id === circuitId);
    if (!target) return;

    const newName = prompt('Enter new circuit name:', target.name);
    if (newName && newName.trim()) {
      target.name = newName.trim();
      target.updatedAt = Date.now();
      this.saveMyCircuits(circuits);
      this.renderMyCircuits();
      if (this.activeMyCircuitId === circuitId) {
        const nameInput = document.getElementById('circuitNameInput');
        if (nameInput) nameInput.value = target.name;
        document.title = `${target.name} - Switcha`;
      }
      this.showToast(`✏️ Renamed to "${target.name}"`, 'info');
    }
  }

  exportCircuitFromMyCircuits(circuitId) {
    const circuits = this.getMyCircuits();
    const target = circuits.find(c => c.id === circuitId);
    if (!target) return;

    let components = target.components;
    let wires = target.wires;
    if (target.presetKey && CircuitLibrary[target.presetKey] && (!components || components.length === 0)) {
      this.loadCircuitPreset(target.presetKey);
      components = this.canvas.components;
      wires = this.canvas.wires;
    }

    const data = {
      name: target.name,
      description: target.description,
      author: target.author,
      updatedAt: target.updatedAt,
      components: components,
      wires: wires
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${target.name.replace(/\s+/g, '_').toLowerCase()}.switcha.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  initMyCircuitsPage() {
    const newBtn = document.getElementById('btnNewMyCircuit');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this.activeMyCircuitId = null;
        this.engine.reset();
        this.canvas.saveState();
        this.canvas.components = [];
        this.canvas.wires = [];
        this.engine.setCircuit([], []);
        const nameInput = document.getElementById('circuitNameInput');
        if (nameInput) nameInput.value = 'Untitled Circuit';
        document.title = 'Untitled Circuit - Switcha';
        this.canvas.render();
        this.grapher.render();
        window.location.hash = '#/create';
        this.showToast('✨ Started a new blank circuit', 'info');
      });
    }

    const importBtn = document.getElementById('btnImportMyCircuit');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        document.getElementById('fileInputJSON')?.click();
      });
    }

    const searchInput = document.getElementById('myCircuitsSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderWorkspaceProjects(e.target.value.toLowerCase().trim());
      });
    }

    const clearBtn = document.getElementById('btnClearWorkspace');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all your saved custom circuits and reset your workspace to default presets?')) {
          await this.clearAllCustomCircuits();
        }
      });
    }

    this.renderMyCircuits();
  }

  async clearAllCustomCircuits() {
    // 1. Reset localStorage to default starter circuits
    try {
      localStorage.removeItem('switcha_my_circuits');
      localStorage.removeItem('switcha_my_models');
      localStorage.removeItem('switcha_my_scripts');
    } catch (_) {}

    // 2. Clear IndexedDB stores if available
    if (window.SwitchaStorage && window.SwitchaStorage.db) {
      try {
        const db = window.SwitchaStorage.db;
        ['circuits', 'models', 'scripts'].forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).clear();
          }
        });
      } catch (_) {}
    }

    this.activeMyCircuitId = null;
    this.activeModelId = null;

    // 3. Re-seed default starter circuits
    this.getMyCircuits();
    await this.renderWorkspaceProjects();
    this.showToast('🧹 All custom saved circuits cleared and reset to defaults!', 'success');
  }

  renderMyCircuits(filterQuery = '') {
    const grid = document.getElementById('myCircuitsGrid');
    const countEl = document.getElementById('myCircuitsCount');
    if (!grid) return;

    const circuits = this.getMyCircuits();
    const filtered = circuits.filter(c => {
      if (!filterQuery) return true;
      return (c.name || '').toLowerCase().includes(filterQuery) ||
             (c.description || '').toLowerCase().includes(filterQuery) ||
             (c.author || '').toLowerCase().includes(filterQuery);
    });

    if (countEl) {
      countEl.textContent = `${circuits.length} Circuit${circuits.length === 1 ? '' : 's'} Saved`;
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-circuits-state">
          <div class="empty-circuits-icon">🔌</div>
          <h3 class="empty-circuits-title">${filterQuery ? 'No matching circuits found' : 'No saved circuits yet'}</h3>
          <p class="empty-circuits-desc">${filterQuery ? 'Try another search query.' : 'Build switches, logic gates, and analog circuits and save them to your library.'}</p>
          <a href="#/create" class="btn btn-primary">⚡ Create Your First Circuit</a>
        </div>
      `;
      return;
    }

    filtered.forEach(c => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      const timeAgo = (timestamp) => {
        if (!timestamp) return 'Recently';
        const sec = Math.floor((Date.now() - timestamp) / 1000);
        if (sec < 60) return 'Just now';
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        const hrs = Math.floor(min / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
      };

      const presetKey = c.presetKey || 'custom';
      const numComps = c.components ? c.components.length : 0;
      const numWires = c.wires ? c.wires.length : 0;

      cardEl.innerHTML = `
        ${this.renderCircuitThumbnailSvg(presetKey, 'Saved')}
        <div class="card-body">
          <div class="my-circuit-meta">
            <span>🕒 Edited ${timeAgo(c.updatedAt)}</span>
            <span>•</span>
            <span>⚡ ${numComps} comps</span>
          </div>
          <h3 class="card-title">${c.name}</h3>
          <p class="card-desc">${c.description || 'Personal circuit schematic.'}</p>
          <div class="my-circuit-card-actions">
            <button class="btn btn-primary" style="padding: 5px 12px; font-size: 12px; font-weight: 700;" data-action="open" data-id="${c.id}">⚡ Open</button>
            <button class="btn-card-icon" title="Duplicate Circuit" data-action="duplicate" data-id="${c.id}">📋 Copy</button>
            <button class="btn-card-icon" title="Rename Circuit" data-action="rename" data-id="${c.id}">✏️ Rename</button>
            <button class="btn-card-icon" title="Export JSON" data-action="export" data-id="${c.id}">📄 JSON</button>
            <button class="btn-card-icon delete" title="Delete Circuit" data-action="delete" data-id="${c.id}">🗑️</button>
          </div>
        </div>
      `;

      cardEl.querySelector('[data-action="open"]').addEventListener('click', () => {
        this.loadCircuitFromMyCircuits(c.id);
      });
      cardEl.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
        this.duplicateCircuit(c.id);
      });
      cardEl.querySelector('[data-action="rename"]').addEventListener('click', () => {
        this.renameCircuit(c.id);
      });
      cardEl.querySelector('[data-action="export"]').addEventListener('click', () => {
        this.exportCircuitFromMyCircuits(c.id);
      });
      cardEl.querySelector('[data-action="delete"]').addEventListener('click', () => {
        this.deleteCircuit(c.id);
      });

      grid.appendChild(cardEl);
    });
  }

  // --- Workspace Multi-Store Manager (Circuits / Models / Scripts) ---
  initWorkspaceTabs() {
    document.querySelectorAll('[data-workspace-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-workspace-tab]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentWorkspaceTab = e.target.dataset.workspaceTab;
        this.renderWorkspaceProjects();
      });
    });
  }

  async renderWorkspaceProjects(filterQuery = '') {
    const grid = document.getElementById('myCircuitsGrid');
    const countEl = document.getElementById('myCircuitsCount');
    if (!grid) return;

    grid.innerHTML = '<div style="padding:20px; color:#94a3b8; text-align:center;">Loading workspace projects...</div>';

    let items = [];
    if (window.SwitchaStorage) {
      if (this.currentWorkspaceTab === 'circuits') {
        items = await window.SwitchaStorage.getCircuits();
      } else if (this.currentWorkspaceTab === 'models') {
        items = await window.SwitchaStorage.getModels();
      } else if (this.currentWorkspaceTab === 'scripts') {
        items = await window.SwitchaStorage.getScripts();
      }
    } else {
      items = this.getMyCircuits();
    }

    const filtered = items.filter(item => {
      if (!filterQuery) return true;
      return (item.name || '').toLowerCase().includes(filterQuery) ||
             (item.description || '').toLowerCase().includes(filterQuery) ||
             (item.author || '').toLowerCase().includes(filterQuery);
    });

    if (countEl) {
      const typeLabel = this.currentWorkspaceTab === 'circuits' ? 'Circuit' : (this.currentWorkspaceTab === 'models' ? 'Model' : 'Script');
      countEl.textContent = `${items.length} ${typeLabel}${items.length === 1 ? '' : 's'} Saved`;
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      const icon = this.currentWorkspaceTab === 'circuits' ? '🔌' : (this.currentWorkspaceTab === 'models' ? '🧩' : '💻');
      const actionLink = this.currentWorkspaceTab === 'circuits' ? '#/create' : (this.currentWorkspaceTab === 'models' ? '#/blocks' : '#/code');
      const actionText = this.currentWorkspaceTab === 'circuits' ? '⚡ Open Circuit Studio' : (this.currentWorkspaceTab === 'models' ? '🧩 Open Blocks Studio' : '💻 Open Code IDE');
      grid.innerHTML = `
        <div class="empty-circuits-state">
          <div class="empty-circuits-icon">${icon}</div>
          <h3 class="empty-circuits-title">${filterQuery ? 'No matching projects found' : 'No saved ' + this.currentWorkspaceTab + ' yet'}</h3>
          <p class="empty-circuits-desc">${filterQuery ? 'Try another search query.' : 'Build and save your projects offline on this device.'}</p>
          <a href="${actionLink}" class="btn btn-primary">${actionText}</a>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      const timeAgo = (timestamp) => {
        if (!timestamp) return 'Recently';
        const sec = Math.floor((Date.now() - timestamp) / 1000);
        if (sec < 60) return 'Just now';
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        const hrs = Math.floor(min / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      };

      const isCircuit = this.currentWorkspaceTab === 'circuits';
      const isModel = this.currentWorkspaceTab === 'models';
      const isScript = this.currentWorkspaceTab === 'scripts';

      const metaInfo = isCircuit ? `⚡ ${item.components?.length || 0} comps` : (isModel ? `🧩 ${item.blocks?.length || 0} blocks` : `💻 Code Script`);

      cardEl.innerHTML = `
        <div class="card-thumbnail" style="background: #0f172a; display:flex; align-items:center; justify-content:center; height:100px;">
          <span style="font-size: 36px;">${isCircuit ? '🔌' : (isModel ? '🧩' : '💻')}</span>
        </div>
        <div class="card-body">
          <div class="my-circuit-meta">
            <span>🕒 ${timeAgo(item.updatedAt)}</span>
            <span>•</span>
            <span>${metaInfo}</span>
          </div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-desc">${item.description || 'Personal saved file.'}</p>
          <div class="my-circuit-card-actions">
            <button class="btn btn-primary" style="padding: 5px 12px; font-size: 12px; font-weight: 700;" data-action="open">⚡ Open</button>
            <button class="btn-card-icon" title="Duplicate" data-action="duplicate">📋 Copy</button>
            <button class="btn-card-icon" title="Export" data-action="export">📄 Export</button>
            <button class="btn-card-icon delete" title="Delete" data-action="delete">🗑️</button>
          </div>
        </div>
      `;

      cardEl.querySelector('[data-action="open"]').addEventListener('click', () => {
        if (isCircuit) {
          this.loadCircuitFromMyCircuits(item.id);
        } else if (isModel) {
          if (this.blocksCanvas) {
            this.blocksCanvas.blocks = JSON.parse(JSON.stringify(item.blocks || []));
            this.blocksCanvas.lines = JSON.parse(JSON.stringify(item.lines || []));
            this.blocksEngine?.setModel(this.blocksCanvas.blocks, this.blocksCanvas.lines);
            const nameInput = document.getElementById('blockModelNameInput');
            if (nameInput) nameInput.value = item.name;
            this.activeModelId = item.id;
            this.blocksCanvas.fitToScreen();
          }
          window.location.hash = '#/blocks';
          this.showToast(`🧩 Opened "${item.name}" in Blocks Studio`, 'info');
        } else if (isScript) {
          if (this.codeEditor) {
            this.codeEditor.activeScript = item;
            const textarea = document.getElementById('codeTextarea');
            if (textarea) textarea.value = item.content || '';
            const nameEl = document.getElementById('codeScriptName');
            if (nameEl) nameEl.textContent = item.name;
          }
          window.location.hash = '#/code';
          this.showToast(`💻 Opened "${item.name}" in Code IDE`, 'info');
        }
      });

      cardEl.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (confirm(`Delete "${item.name}"?`)) {
          if (window.SwitchaStorage) {
            if (isCircuit) await window.SwitchaStorage.deleteCircuit(item.id);
            if (isModel) await window.SwitchaStorage.deleteModel(item.id);
            if (isScript) await window.SwitchaStorage.deleteScript(item.id);
          }
          this.renderWorkspaceProjects();
          this.showToast(`🗑️ "${item.name}" deleted`, 'warning');
        }
      });

      cardEl.querySelector('[data-action="duplicate"]').addEventListener('click', async () => {
        const copy = JSON.parse(JSON.stringify(item));
        copy.id = `${isCircuit ? 'circuit' : (isModel ? 'model' : 'script')}_${Date.now()}`;
        copy.name = `${item.name} (Copy)`;
        copy.updatedAt = Date.now();
        if (window.SwitchaStorage) {
          if (isCircuit) await window.SwitchaStorage.saveCircuit(copy);
          if (isModel) await window.SwitchaStorage.saveModel(copy);
          if (isScript) await window.SwitchaStorage.saveScript(copy);
        }
        this.renderWorkspaceProjects();
        this.showToast(`📋 Duplicated "${item.name}"`, 'success');
      });

      cardEl.querySelector('[data-action="export"]').addEventListener('click', () => {
        const ext = isCircuit ? 'swcirc' : (isModel ? 'swblock' : 'swcode');
        const content = isScript ? (item.content || '') : JSON.stringify(item, null, 2);
        const type = isScript ? 'text/plain' : 'application/json';
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name.endsWith('.' + ext) ? item.name : `${item.name}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      });

      grid.appendChild(cardEl);
    });
  }

  // --- Lab Instruments Suite ---
  initLabInstruments() {
    if (typeof DigitalMultimeter !== 'undefined') {
      this.instruments.dmm = new DigitalMultimeter('dmmModalContent', this.engine);
    }
    if (typeof LogicAnalyzer !== 'undefined') {
      this.instruments.logicAnalyzer = new LogicAnalyzer('logicAnalyzerModalContent', this.engine);
    }
    if (typeof SpectrumAnalyzer !== 'undefined') {
      this.instruments.spectrumAnalyzer = new SpectrumAnalyzer('spectrumAnalyzerModalContent', this.engine);
    }

    const btnDmm = document.getElementById('btnOpenDMM');
    if (btnDmm) {
      btnDmm.addEventListener('click', () => {
        document.getElementById('dmmModal')?.classList.add('active');
      });
    }

    const btnLa = document.getElementById('btnOpenLogicAnalyzer');
    if (btnLa) {
      btnLa.addEventListener('click', () => {
        document.getElementById('logicAnalyzerModal')?.classList.add('active');
        this.instruments.logicAnalyzer?.resize();
      });
    }

    const btnSpec = document.getElementById('btnOpenSpectrumAnalyzer');
    if (btnSpec) {
      btnSpec.addEventListener('click', () => {
        document.getElementById('spectrumAnalyzerModal')?.classList.add('active');
        this.instruments.spectrumAnalyzer?.resize();
      });
    }
  }

  // --- Switcha Blocks Dynamic Systems Environment ---
  initBlocksEnvironment() {
    const canvasEl = document.getElementById('blocksCanvas');
    const scopeContainer = document.getElementById('blocksScopeContainer');
    if (!canvasEl) return;

    if (typeof SwitchaBlocksEngine !== 'undefined') {
      this.blocksEngine = new SwitchaBlocksEngine();
    }
    if (typeof SwitchaBlocksScope !== 'undefined' && scopeContainer) {
      this.blocksScope = new SwitchaBlocksScope(scopeContainer);
    }
    if (typeof SwitchaBlocksCanvas !== 'undefined' && canvasEl && this.blocksEngine) {
      this.blocksCanvas = new SwitchaBlocksCanvas(canvasEl, this.blocksEngine);
      
      this.blocksCanvas.onModelModified = (blocks, lines) => {
        this.blocksEngine.setModel(blocks, lines);
      };

      this.blocksCanvas.onSelectionChange = (selection) => {
        this.renderBlocksPropertiesInspector(selection);
      };
    }

    this.buildBlocksPalette();
    this.initBlocksToolbarControls();
    this.initBlocksSplitGutter();

    // Load default model
    if (typeof SwitchaBlocksLibrary !== 'undefined' && this.blocksCanvas) {
      SwitchaBlocksLibrary.loadModel('dc_motor_pid', this.blocksCanvas);
      const nameInput = document.getElementById('blockModelNameInput');
      if (nameInput) nameInput.value = 'DC Motor Speed Control with PID';
    }
  }

  buildBlocksPalette() {
    const container = document.getElementById('blocksPaletteContainer');
    if (!container || typeof BlockDefinitions === 'undefined' || typeof BlockCategory === 'undefined') return;
    container.innerHTML = '';

    const groups = {};
    Object.values(BlockCategory).forEach(cat => groups[cat] = []);

    Object.values(BlockDefinitions).forEach(def => {
      if (groups[def.category]) {
        groups[def.category].push(def);
      }
    });

    Object.entries(groups).forEach(([categoryName, defs]) => {
      if (defs.length === 0) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'palette-group';

      const headerEl = document.createElement('div');
      headerEl.className = 'palette-group-header';
      headerEl.innerHTML = `<span>${categoryName}</span><span>▾</span>`;

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'palette-items-grid';

      defs.forEach(def => {
        const itemEl = document.createElement('div');
        itemEl.className = 'palette-item';
        itemEl.title = `Add ${def.name}`;
        itemEl.dataset.type = def.type;
        itemEl.setAttribute('draggable', 'true');
        itemEl.innerHTML = `
          <div class="palette-item-icon" style="font-weight:bold; font-size:11px; color:#38bdf8;">[ ${def.glyph} ]</div>
          <div class="palette-item-name">${def.name}</div>
        `;

        itemEl.addEventListener('dragstart', (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', def.type);
            e.dataTransfer.effectAllowed = 'copy';
          }
        });

        itemEl.addEventListener('click', () => {
          if (this.blocksCanvas) {
            this.blocksCanvas.addBlock(def.type, 200, 150);
          }
        });

        itemsGrid.appendChild(itemEl);
      });

      groupEl.appendChild(headerEl);
      groupEl.appendChild(itemsGrid);
      container.appendChild(groupEl);
    });

    const searchInput = document.getElementById('blocksSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        container.querySelectorAll('.palette-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
      });
    }
  }

  initBlocksToolbarControls() {
    const btnSimToggle = document.getElementById('btnBlocksSimToggle');
    const simIcon = document.getElementById('blocksSimToggleIcon');
    const simText = document.getElementById('blocksSimToggleText');

    if (btnSimToggle) {
      btnSimToggle.addEventListener('click', () => {
        this.isBlocksSimRunning = !this.isBlocksSimRunning;
        if (this.isBlocksSimRunning) {
          btnSimToggle.classList.add('running');
          if (simIcon) simIcon.textContent = '⏸';
          if (simText) simText.textContent = 'Pause Model';
          this.startBlocksSimulationLoop();
        } else {
          btnSimToggle.classList.remove('running');
          if (simIcon) simIcon.textContent = '▶';
          if (simText) simText.textContent = 'Run Model';
          this.stopBlocksSimulationLoop();
        }
      });
    }

    const btnStep = document.getElementById('btnBlocksSimStep');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        if (!this.blocksEngine) return;
        const dt = parseFloat(document.getElementById('blocksStepInput')?.value) || 0.001;
        this.blocksEngine.step(dt);
        if (this.blocksScope) {
          const sample = this.blocksEngine.sampleSignals();
          this.blocksScope.recordSample(this.blocksEngine.time, sample);
        }
        this.updateBlocksSimTimeDisplay();
        this.blocksCanvas?.render();
      });
    }

    const btnReset = document.getElementById('btnBlocksSimReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.isBlocksSimRunning = false;
        if (btnSimToggle) btnSimToggle.classList.remove('running');
        if (simIcon) simIcon.textContent = '▶';
        if (simText) simText.textContent = 'Run Model';
        this.stopBlocksSimulationLoop();
        this.blocksEngine?.reset();
        this.blocksScope?.reset();
        this.updateBlocksSimTimeDisplay();
        this.blocksCanvas?.render();
        this.showToast('⏮ Blocks simulation reset', 'info');
      });
    }

    const solverSelect = document.getElementById('blocksSolverSelect');
    if (solverSelect) {
      solverSelect.addEventListener('change', (e) => {
        if (this.blocksEngine) this.blocksEngine.solver = e.target.value;
      });
    }

    const presetSelect = document.getElementById('blocksPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && typeof SwitchaBlocksLibrary !== 'undefined' && this.blocksCanvas) {
          SwitchaBlocksLibrary.loadModel(val, this.blocksCanvas);
          const nameInput = document.getElementById('blockModelNameInput');
          if (nameInput) nameInput.value = e.target.options[e.target.selectedIndex].text.replace(/^[0-9]+\.\s*/, '');
          this.showToast(`⚡ Loaded model: ${val}`, 'info');
          e.target.value = '';
        }
      });
    }

    const btnSave = document.getElementById('btnSaveBlockModel');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const name = document.getElementById('blockModelNameInput')?.value.trim() || 'Untitled Model';
        const modelDoc = {
          id: this.activeModelId || `model_${Date.now()}`,
          name: name.endsWith('.swblock') ? name : name + '.swblock',
          blocks: JSON.parse(JSON.stringify(this.blocksCanvas?.blocks || [])),
          lines: JSON.parse(JSON.stringify(this.blocksCanvas?.lines || [])),
          updatedAt: Date.now()
        };
        if (window.SwitchaStorage) {
          await window.SwitchaStorage.saveModel(modelDoc);
          this.activeModelId = modelDoc.id;
          this.showToast(`💾 Model saved to My Models: ${modelDoc.name}`, 'success');
        }
      });
    }

    const btnExport = document.getElementById('btnBlocksExportJSON');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const name = document.getElementById('blockModelNameInput')?.value.trim() || 'model';
        const data = {
          name,
          format: 'swblock',
          version: '2.0',
          blocks: this.blocksCanvas?.blocks || [],
          lines: this.blocksCanvas?.lines || []
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_').toLowerCase()}.swblock`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const btnFit = document.getElementById('btnBlocksFit');
    if (btnFit) {
      btnFit.addEventListener('click', () => this.blocksCanvas?.fitToScreen());
    }

    const btnDel = document.getElementById('btnBlocksDelete');
    if (btnDel) {
      btnDel.addEventListener('click', () => this.blocksCanvas?.deleteSelected());
    }

    // View mode pills (Diagram, Split, Scope)
    document.querySelectorAll('[data-blocks-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-blocks-mode]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const mode = e.target.dataset.blocksMode;
        const canvasPanel = document.getElementById('blocksCanvasPanel');
        const scopePanel = document.getElementById('blocksScopePanel');
        const gutter = document.getElementById('blocksSplitGutter');

        if (mode === 'canvas') {
          if (canvasPanel) canvasPanel.style.display = 'block';
          if (gutter) gutter.style.display = 'none';
          if (scopePanel) scopePanel.style.display = 'none';
        } else if (mode === 'scope') {
          if (canvasPanel) canvasPanel.style.display = 'none';
          if (gutter) gutter.style.display = 'none';
          if (scopePanel) {
            scopePanel.style.display = 'flex';
            scopePanel.style.height = '100%';
          }
        } else {
          if (canvasPanel) {
            canvasPanel.style.display = 'block';
            canvasPanel.style.flex = '1';
          }
          if (gutter) gutter.style.display = 'flex';
          if (scopePanel) {
            scopePanel.style.display = 'flex';
            scopePanel.style.height = '280px';
          }
        }
        setTimeout(() => {
          this.blocksCanvas?.resize();
          this.blocksScope?.resize();
        }, 50);
      });
    });
  }

  initBlocksSplitGutter() {
    const gutter = document.getElementById('blocksSplitGutter');
    const scopePanel = document.getElementById('blocksScopePanel');
    if (!gutter || !scopePanel) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    gutter.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      startHeight = scopePanel.offsetHeight;
      document.body.style.cursor = 'row-resize';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dy = startY - e.clientY;
      const newHeight = Math.max(120, Math.min(window.innerHeight - 200, startHeight + dy));
      scopePanel.style.height = `${newHeight}px`;
      this.blocksCanvas?.resize();
      this.blocksScope?.resize();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
      }
    });
  }

  startBlocksSimulationLoop() {
    const loop = () => {
      if (!this.isBlocksSimRunning || !this.blocksEngine) return;

      const dt = parseFloat(document.getElementById('blocksStepInput')?.value) || 0.001;
      const subSteps = Math.max(1, Math.min(50, Math.round(0.016 / dt)));
      for (let i = 0; i < subSteps; i++) {
        this.blocksEngine.step(dt);
        if (this.blocksScope) {
          const sample = this.blocksEngine.sampleSignals();
          this.blocksScope.recordSample(this.blocksEngine.time, sample);
        }
      }

      this.updateBlocksSimTimeDisplay();
      this.blocksCanvas?.render();

      this.blocksSimAnimFrame = requestAnimationFrame(loop);
    };

    this.blocksSimAnimFrame = requestAnimationFrame(loop);
  }

  stopBlocksSimulationLoop() {
    if (this.blocksSimAnimFrame) {
      cancelAnimationFrame(this.blocksSimAnimFrame);
      this.blocksSimAnimFrame = null;
    }
  }

  updateBlocksSimTimeDisplay() {
    const display = document.getElementById('blocksSimTimeDisplay');
    if (display && this.blocksEngine) {
      display.textContent = `t: ${this.blocksEngine.time.toFixed(3)} s`;
    }
  }

  renderBlocksPropertiesInspector(selection) {
    const container = document.getElementById('blocksPropertiesContent');
    if (!container) return;

    if (selection && selection.type === 'block' && selection.item) {
      const block = selection.item;
      const def = BlockDefinitions[block.type];

      let paramsHtml = '';
      if (block.params) {
        for (const [key, val] of Object.entries(block.params)) {
          paramsHtml += `
            <div class="property-group">
              <label class="property-label">${key}</label>
              <input type="text" class="property-input block-param-input" data-key="${key}" value="${Array.isArray(val) ? '[' + val.join(', ') + ']' : val}" style="background:#1e293b; color:#f8fafc; border:1px solid #334155; padding:4px 8px; border-radius:4px; width:100%; font-family:monospace;"/>
            </div>
          `;
        }
      }

      container.innerHTML = `
        <div class="property-group">
          <label class="property-label">Block Name</label>
          <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">${block.name} (${block.type})</div>
        </div>
        <div class="property-group">
          <label class="property-label">Category</label>
          <div style="font-size: 12px; color: #94a3b8;">${def?.category || 'General'}</div>
        </div>
        ${paramsHtml}
      `;

      container.querySelectorAll('.block-param-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const key = e.target.dataset.key;
          let val = e.target.value.trim();
          if (val.startsWith('[') && val.endsWith(']')) {
            try {
              block.params[key] = JSON.parse(val);
            } catch (_) {
              block.params[key] = val.slice(1, -1).split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
            }
          } else if (!isNaN(parseFloat(val))) {
            block.params[key] = parseFloat(val);
          } else {
            block.params[key] = val;
          }
          this.blocksEngine?.setModel(this.blocksCanvas.blocks, this.blocksCanvas.lines);
          this.blocksCanvas?.render();
        });
      });
    } else {
      container.innerHTML = '<p class="no-selection-msg">Select a block on the diagram to configure its mathematical parameters.</p>';
    }
  }

  // --- Switcha Code Scientific Runtime ---
  initCodeEnvironment() {
    const container = document.getElementById('codeEnvironmentContainer');
    if (container && typeof SwitchaCodeEditor !== 'undefined') {
      this.codeEditor = new SwitchaCodeEditor(container);
    }
  }

  populatePresetDropdown() {
    const select = document.getElementById('circuitPresetSelect');
    if (!select) return;
    select.innerHTML = '';

    Object.entries(CircuitLibrary).forEach(([key, circ]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = circ.name;
      select.appendChild(opt);
    });
  }

  // --- Router & Views ---
  initRouter() {
    const handleHash = () => {
      const hash = window.location.hash || '#/';
      if (hash.startsWith('#/create') || hash.startsWith('#/circuits')) {
        this.switchView('studio');
      } else if (hash.startsWith('#/blocks')) {
        this.switchView('blocks');
      } else if (hash.startsWith('#/code')) {
        this.switchView('code');
      } else if (hash.startsWith('#/my-circuits') || hash.startsWith('#/workspace')) {
        this.switchView('my-circuits');
      } else if (hash.startsWith('#/discover')) {
        this.switchView('discover');
      } else if (hash.startsWith('#/features')) {
        this.switchView('features');
      } else {
        this.switchView('home');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(`view-${viewName}`);
    if (targetPage) targetPage.classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (viewName === 'studio') document.getElementById('nav-circuits-env')?.classList.add('active');
    if (viewName === 'blocks') document.getElementById('nav-blocks-env')?.classList.add('active');
    if (viewName === 'code') document.getElementById('nav-code-env')?.classList.add('active');
    if (viewName === 'my-circuits') document.getElementById('nav-my-circuits')?.classList.add('active');
    if (viewName === 'features') document.getElementById('nav-features')?.classList.add('active');
    if (viewName === 'discover') document.getElementById('nav-circuits')?.classList.add('active');

    if (viewName === 'my-circuits') {
      this.renderWorkspaceProjects();
    }

    if (viewName === 'studio') {
      setTimeout(() => {
        this.canvas?.resize();
        this.grapher?.resize();
      }, 50);
    }

    if (viewName === 'blocks') {
      setTimeout(() => {
        this.blocksCanvas?.resize();
        this.blocksScope?.resize();
      }, 50);
    }

    if (viewName === 'code') {
      setTimeout(() => {
        this.codeEditor?.plotter?.resizeCanvas();
      }, 50);
    }
  }

  // --- Component Palette ---
  buildPalette() {
    const container = document.getElementById('paletteContainer');
    if (!container) return;
    container.innerHTML = '';

    const groups = {};
    Object.values(ComponentCategory).forEach(cat => groups[cat] = []);

    Object.values(ComponentDefinitions).forEach(def => {
      if (groups[def.category]) {
        groups[def.category].push(def);
      }
    });

    Object.entries(groups).forEach(([categoryName, defs]) => {
      if (defs.length === 0) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'palette-group';

      const headerEl = document.createElement('div');
      headerEl.className = 'palette-group-header';
      headerEl.innerHTML = `<span>${categoryName}</span><span>▾</span>`;

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'palette-items-grid';

      defs.forEach(def => {
        const itemEl = document.createElement('div');
        itemEl.className = 'palette-item';
        itemEl.title = `Add ${def.name}`;
        itemEl.dataset.type = def.type;
        itemEl.setAttribute('draggable', 'true');
        itemEl.innerHTML = `
          <div class="palette-item-icon">${this.getComponentMiniIcon(def.type)}</div>
          <div class="palette-item-name">${def.name.split('(')[0].trim()}</div>
        `;

        // HTML5 Drag and Drop for Desktop Mouse
        itemEl.addEventListener('dragstart', (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', def.type);
            e.dataTransfer.effectAllowed = 'copy';
          }
        });

        // Unified Touch & Pointer Dragging for Bare Hands, Stylus & Mouse
        let isTracking = false;
        let startX = 0;
        let startY = 0;
        let touchGhost = null;

        const onPointerDown = (e) => {
          if (e.button && e.button !== 0) return;
          isTracking = true;
          startX = e.clientX;
          startY = e.clientY;
          let hasMoved = false;

          const onPointerMove = (moveEv) => {
            if (!isTracking) return;
            const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);
            if (!hasMoved && dist > 8) {
              hasMoved = true;
              touchGhost = document.createElement('div');
              touchGhost.className = 'touch-drag-ghost';
              touchGhost.innerHTML = `
                <div class="touch-ghost-icon">${this.getComponentMiniIcon(def.type)}</div>
                <div class="touch-ghost-name">${def.name.split('(')[0].trim()}</div>
              `;
              document.body.appendChild(touchGhost);
            }

            if (hasMoved && touchGhost) {
              touchGhost.style.left = `${moveEv.clientX}px`;
              touchGhost.style.top = `${moveEv.clientY}px`;

              const canvasRect = this.canvas.canvas.getBoundingClientRect();
              if (
                moveEv.clientX >= canvasRect.left &&
                moveEv.clientX <= canvasRect.right &&
                moveEv.clientY >= canvasRect.top &&
                moveEv.clientY <= canvasRect.bottom
              ) {
                const worldPos = this.canvas.screenToWorld(moveEv.clientX, moveEv.clientY);
                this.canvas.mode = 'PLACE';
                this.canvas.placementComponentType = def.type;
                this.canvas.placementHoverPos = worldPos;
                this.canvas.render();
              }
            }
          };

          const onPointerUp = (upEv) => {
            if (!isTracking) return;
            isTracking = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            if (touchGhost) {
              touchGhost.remove();
              touchGhost = null;
            }

            if (hasMoved) {
              const canvasRect = this.canvas.canvas.getBoundingClientRect();
              if (
                upEv.clientX >= canvasRect.left &&
                upEv.clientX <= canvasRect.right &&
                upEv.clientY >= canvasRect.top &&
                upEv.clientY <= canvasRect.bottom
              ) {
                const worldPos = this.canvas.screenToWorld(upEv.clientX, upEv.clientY);
                this.canvas.mode = 'SELECT';
                this.canvas.placementComponentType = null;
                this.canvas.placementHoverPos = null;
                const newComp = this.canvas.addComponent(def.type, worldPos.x, worldPos.y);
                if (newComp) {
                  this.canvas.selectComponent(newComp);
                }
                this.switchView('studio');
                this.updatePlacementBanner();
                return;
              }
              this.canvas.mode = 'SELECT';
              this.canvas.placementComponentType = null;
              this.canvas.placementHoverPos = null;
              this.canvas.render();
              this.updatePlacementBanner();
              return;
            }

            // Quick Tap / Click without drag -> Enter Placement Mode
            if (this.canvas.mode === 'PLACE' && this.canvas.placementComponentType === def.type) {
              this.canvas.cancelAction();
            } else {
              this.canvas.setPlacementMode(def.type);
            }
            this.switchView('studio');
            this.updatePlacementBanner(def);
          };

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
          window.addEventListener('pointercancel', onPointerUp);
        };

        itemEl.addEventListener('pointerdown', onPointerDown);

        itemsGrid.appendChild(itemEl);
      });

      // Accordion toggle
      headerEl.addEventListener('click', () => {
        const isHidden = itemsGrid.style.display === 'none';
        itemsGrid.style.display = isHidden ? 'grid' : 'none';
        headerEl.querySelector('span:last-child').textContent = isHidden ? '▾' : '▸';
      });

      groupEl.appendChild(headerEl);
      groupEl.appendChild(itemsGrid);
      container.appendChild(groupEl);
    });

    // Palette Search Filter (Auto-expands matching categories and searches aliases)
    const searchInput = document.getElementById('paletteSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const groups = document.querySelectorAll('.palette-group');

        groups.forEach(group => {
          const items = group.querySelectorAll('.palette-item');
          const grid = group.querySelector('.palette-items-grid');
          const arrow = group.querySelector('.palette-group-header span:last-child');
          let matchCount = 0;

          items.forEach(item => {
            const type = (item.dataset.type || '').toLowerCase();
            const text = (item.textContent || '').toLowerCase();
            const def = ComponentDefinitions[item.dataset.type];
            const fullName = (def?.name || '').toLowerCase();
            const category = (def?.category || '').toLowerCase();
            const prefix = (def?.prefix || '').toLowerCase();

            // Check if query matches text, type, name, category, or aliases
            let isMatch = !query || text.includes(query) || type.includes(query) || fullName.includes(query) || category.includes(query) || prefix.includes(query);
            
            // Aliases for Node / Junction
            if (!isMatch && (type === 'node' || type === 'junction')) {
              if ('node'.includes(query) || 'junction'.includes(query) || 'wire'.includes(query) || 'hub'.includes(query) || 'connection'.includes(query) || 'dot'.includes(query) || 'tie'.includes(query)) {
                isMatch = true;
              }
            }

            // Aliases for Trigger / Pulse / Clock / Timing / Switches
            if (!isMatch) {
              if (type.includes('pulse') || type.includes('clock') || type.includes('timer') || type.includes('schmitt') || type.includes('latch') || type.includes('flipflop') || type.includes('button') || type.includes('triac') || type.includes('diac') || type.includes('scr')) {
                if ('trigger'.includes(query) || 'pulse'.includes(query) || 'clock'.includes(query) || 'timer'.includes(query) || 'oneshot'.includes(query) || 'square'.includes(query) || 'signal'.includes(query)) {
                  isMatch = true;
                }
              }
            }

            item.style.display = isMatch ? 'flex' : 'none';
            if (isMatch) matchCount++;
          });

          if (query) {
            if (matchCount > 0) {
              group.style.display = 'block';
              if (grid) grid.style.display = 'grid';
              if (arrow) arrow.textContent = '▾';
            } else {
              group.style.display = 'none';
            }
          } else {
            group.style.display = 'block';
            if (grid) grid.style.display = 'grid';
            if (arrow) arrow.textContent = '▾';
          }
        });
      });
    }
  }

  getComponentMiniIcon(type) {
    switch (type) {
      // 1. Sources
      case ComponentTypes.GROUND:
        return `<svg viewBox="0 0 24 24"><path d="M12,4 L12,12 M6,12 L18,12 M8,15 L16,15 M10,18 L14,18" stroke="#03b585" stroke-width="2" fill="none"/></svg>`;
      case ComponentTypes.DC_VOLTAGE:
      case ComponentTypes.BATTERY_CELL:
      case ComponentTypes.SOLAR_CELL:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#03b585" stroke-width="2" fill="none"/><text x="12" y="15" font-size="7.5" text-anchor="middle" fill="#e11d48" font-weight="bold">DC</text></svg>`;
      case ComponentTypes.AC_VOLTAGE:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#03b585" stroke-width="2" fill="none"/><path d="M7,12 Q9.5,8 12,12 Q14.5,16 17,12" stroke="#0284c7" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.FUNCTION_GENERATOR:
        return `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#0284c7" stroke-width="1.8" fill="#f0f9ff"/><path d="M5,12 Q7,7 9,12 Q11,17 13,12" stroke="#0284c7" stroke-width="1.5" fill="none"/><circle cx="17" cy="8" r="1.5" fill="#ef4444"/><circle cx="17" cy="12" r="1.5" fill="#64748b"/><circle cx="17" cy="16" r="1.5" fill="#3b82f6"/></svg>`;
      case ComponentTypes.CLOCK_VOLTAGE:
      case ComponentTypes.PULSE_VOLTAGE:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#03b585" stroke-width="2" fill="none"/><path d="M7,14 L7,9 L12,9 L12,15 L17,15 L17,10" stroke="#0284c7" stroke-width="1.5" fill="none"/></svg>`;
      case ComponentTypes.TRIGGER_PULSE:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#10b981" stroke="#047857" stroke-width="1.5"/><path d="M13,6 L8,13 L12,13 L11,18 L16,11 L12,11 Z" fill="#ffffff"/></svg>`;
      case ComponentTypes.TRIANGLE_VOLTAGE:
      case ComponentTypes.SAWTOOTH_VOLTAGE:
      case ComponentTypes.AM_VOLTAGE:
      case ComponentTypes.FM_VOLTAGE:
      case ComponentTypes.CHIRP_VOLTAGE:
      case ComponentTypes.NOISE_VOLTAGE:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#03b585" stroke-width="2" fill="none"/><path d="M6,14 L9,9 L12,14 L15,9 L18,14" stroke="#f59e0b" stroke-width="1.5" fill="none"/></svg>`;
      case ComponentTypes.DC_CURRENT:
      case ComponentTypes.AC_CURRENT:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#0284c7" stroke-width="2" fill="none"/><path d="M12,17 L12,7 M9,10 L12,7 L15,10" stroke="#0284c7" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.VCVS:
      case ComponentTypes.VCCS:
      case ComponentTypes.CCVS:
      case ComponentTypes.CCCS:
        return `<svg viewBox="0 0 24 24"><polygon points="12,4 20,12 12,20 4,12" stroke="#0284c7" stroke-width="1.8" fill="none"/><text x="12" y="15" font-size="7" text-anchor="middle" fill="#0284c7" font-weight="bold">E</text></svg>`;

      // 2. Passives
      case ComponentTypes.RESISTOR:
      case ComponentTypes.RESISTOR_ARRAY_SIP:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L5,12 L7,7 L10,17 L14,7 L17,17 L19,12 L22,12" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.POTENTIOMETER:
      case ComponentTypes.RHEOSTAT:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L6,12 L8,8 L11,16 L14,8 L16,16 L18,12 L22,12" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><path d="M12,4 L12,9 M9,7 L12,9 L15,7" stroke="#e11d48" stroke-width="1.4" fill="none"/></svg>`;
      case ComponentTypes.CAPACITOR:
      case ComponentTypes.FILM_CAP:
      case ComponentTypes.VARIABLE_CAP:
      case ComponentTypes.SUPERCAPACITOR:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L9,12 M9,5 L9,19 M15,5 L15,19 M15,12 L22,12" stroke="#2b2d2f" stroke-width="2" fill="none"/></svg>`;
      case ComponentTypes.POLARIZED_CAP:
      case ComponentTypes.TANTALUM_CAP:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L9,12 M9,5 L9,19 M15,5 Q11,12 15,19 M15,12 L22,12" stroke="#2b2d2f" stroke-width="2" fill="none"/><text x="5" y="8" font-size="7" fill="#e11d48" font-weight="bold">+</text></svg>`;
      case ComponentTypes.INDUCTOR:
      case ComponentTypes.VARIABLE_INDUCTOR:
      case ComponentTypes.COUPLED_INDUCTOR:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L5,12 C5,8 8,8 8,12 C8,8 12,8 12,12 C12,8 16,8 16,12 C16,8 19,8 19,12 L22,12" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.TRANSFORMER:
      case ComponentTypes.TRANSFORMER_CENTER_TAP:
      case ComponentTypes.AUDIO_TRANSFORMER:
      case ComponentTypes.PULSE_TRANSFORMER:
        return `<svg viewBox="0 0 24 24"><path d="M4,4 C4,8 7,8 7,12 C7,16 4,16 4,20 M20,4 C20,8 17,8 17,12 C17,16 20,16 20,20" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><line x1="11" y1="4" x2="11" y2="20" stroke="#64748b" stroke-width="1.2"/><line x1="13" y1="4" x2="13" y2="20" stroke="#64748b" stroke-width="1.2"/></svg>`;
      case ComponentTypes.CRYSTAL:
      case ComponentTypes.CERAMIC_RESONATOR:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L8,12 M8,6 L8,18 M16,6 L16,18 M16,12 L22,12" stroke="#2b2d2f" stroke-width="1.8" fill="none"/><rect x="10" y="7" width="4" height="10" fill="#cbd5e1" stroke="#2b2d2f" stroke-width="1.2"/></svg>`;
      case ComponentTypes.FUSE:
      case ComponentTypes.POLYFUSE:
        return `<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="6" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><line x1="2" y1="12" x2="22" y2="12" stroke="#2b2d2f" stroke-width="1.5"/></svg>`;
      case ComponentTypes.NTC_THERMISTOR:
      case ComponentTypes.PTC_THERMISTOR:
      case ComponentTypes.VARISTOR_MOV:
      case ComponentTypes.PHOTORESISTOR_LDR:
        return `<svg viewBox="0 0 24 24"><path d="M2,12 L6,12 L8,8 L11,16 L13,8 L16,16 L18,12 L22,12" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><path d="M6,18 L18,6 M15,6 L18,6" stroke="#0284c7" stroke-width="1.2" fill="none"/></svg>`;

      // 3. Diodes & Rectifiers
      case ComponentTypes.DIODE:
      case ComponentTypes.SCHOTTKY:
      case ComponentTypes.PHOTO_DIODE:
      case ComponentTypes.VARACTOR:
        return `<svg viewBox="0 0 24 24"><polygon points="6,6 16,12 6,18" fill="#e11d48"/><line x1="16" y1="6" x2="16" y2="18" stroke="#2b2d2f" stroke-width="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="#2b2d2f" stroke-width="1.8"/><line x1="16" y1="12" x2="22" y2="12" stroke="#2b2d2f" stroke-width="1.8"/></svg>`;
      case ComponentTypes.ZENER:
        return `<svg viewBox="0 0 24 24"><polygon points="6,6 16,12 6,18" fill="#e11d48"/><path d="M14,6 L16,6 L16,18 L18,18" stroke="#2b2d2f" stroke-width="1.8" fill="none"/><line x1="2" y1="12" x2="6" y2="12" stroke="#2b2d2f" stroke-width="1.8"/><line x1="16" y1="12" x2="22" y2="12" stroke="#2b2d2f" stroke-width="1.8"/></svg>`;
      case ComponentTypes.LED:
        return `<svg viewBox="0 0 24 24"><polygon points="5,7 13,12 5,17" fill="#ff3b30"/><line x1="13" y1="7" x2="13" y2="17" stroke="#2b2d2f" stroke-width="1.8"/><line x1="2" y1="12" x2="5" y2="12" stroke="#2b2d2f" stroke-width="1.5"/><line x1="13" y1="12" x2="20" y2="12" stroke="#2b2d2f" stroke-width="1.5"/><path d="M11,5 L16,2 M14,7 L19,4" stroke="#ff3b30" stroke-width="1.2" stroke-linecap="round"/></svg>`;
      case ComponentTypes.BRIDGE_RECTIFIER:
        return `<svg viewBox="0 0 24 24"><polygon points="12,3 21,12 12,21 3,12" stroke="#f59e0b" stroke-width="1.8" fill="none"/><polygon points="9,9 15,12 9,15" fill="#e11d48"/><line x1="15" y1="9" x2="15" y2="15" stroke="#2b2d2f" stroke-width="1.5"/></svg>`;

      // 4. Transistors & MOSFETs
      case ComponentTypes.BJT_NPN:
      case ComponentTypes.DARLINGTON_NPN:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><line x1="9" y1="7" x2="9" y2="17" stroke="#2b2d2f" stroke-width="2"/><line x1="3" y1="12" x2="9" y2="12" stroke="#2b2d2f" stroke-width="1.5"/><line x1="9" y1="9" x2="17" y2="5" stroke="#2b2d2f" stroke-width="1.5"/><line x1="9" y1="15" x2="17" y2="19" stroke="#2b2d2f" stroke-width="1.5"/><polygon points="14,16 17,19 13,19" fill="#2b2d2f"/></svg>`;
      case ComponentTypes.BJT_PNP:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><line x1="9" y1="7" x2="9" y2="17" stroke="#2b2d2f" stroke-width="2"/><line x1="3" y1="12" x2="9" y2="12" stroke="#2b2d2f" stroke-width="1.5"/><line x1="9" y1="9" x2="17" y2="5" stroke="#2b2d2f" stroke-width="1.5"/><line x1="9" y1="15" x2="17" y2="19" stroke="#2b2d2f" stroke-width="1.5"/><polygon points="12,12 10,14 13,15" fill="#2b2d2f"/></svg>`;
      case ComponentTypes.NMOS:
      case ComponentTypes.PMOS:
      case ComponentTypes.NJFET:
      case ComponentTypes.PJFET:
        return `<svg viewBox="0 0 24 24"><line x1="3" y1="15" x2="9" y2="15" stroke="#2b2d2f" stroke-width="1.5"/><line x1="9" y1="6" x2="9" y2="18" stroke="#2b2d2f" stroke-width="2"/><path d="M12,6 L18,6 L18,3 M12,18 L18,18 L18,21 M12,12 L18,12" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><polygon points="12,12 16,10 16,14" fill="#0284c7"/></svg>`;

      // 5. Power & Thyristors
      case ComponentTypes.SCR:
      case ComponentTypes.TRIAC:
      case ComponentTypes.DIAC:
      case ComponentTypes.IGBT:
        return `<svg viewBox="0 0 24 24"><polygon points="6,6 16,12 6,18" stroke="#2b2d2f" stroke-width="1.5" fill="#f8fafc"/><line x1="16" y1="6" x2="16" y2="18" stroke="#2b2d2f" stroke-width="2"/><path d="M11,15 L16,21" stroke="#e11d48" stroke-width="1.5"/></svg>`;
      case ComponentTypes.VOLTAGE_CONTROLLED_SWITCH:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="16" stroke="#64748b" stroke-dasharray="2,2" fill="none"/><line x1="14" y1="6" x2="14" y2="10" stroke="#2b2d2f" stroke-width="1.5"/><line x1="14" y1="18" x2="14" y2="14" stroke="#2b2d2f" stroke-width="1.5"/><line x1="14" y1="14" x2="20" y2="8" stroke="#0284c7" stroke-width="1.8"/></svg>`;
      case ComponentTypes.OPTOCOUPLER:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><polygon points="6,9 10,12 6,15" fill="#ff3b30"/><line x1="15" y1="7" x2="15" y2="17" stroke="#2b2d2f" stroke-width="1.5"/></svg>`;

      // 6. Analog & Linear ICs
      case ComponentTypes.OPAMP:
        return `<svg viewBox="0 0 24 24"><polygon points="4,3 21,12 4,21" fill="none" stroke="#2b2d2f" stroke-width="1.8"/><line x1="12" y1="1" x2="12" y2="7.5" stroke="#64748b" stroke-width="1.2"/><line x1="12" y1="23" x2="12" y2="16.5" stroke="#64748b" stroke-width="1.2"/><text x="7" y="9" font-size="7" fill="#0f172a" font-weight="bold">-</text><text x="7" y="18" font-size="7" fill="#0f172a" font-weight="bold">+</text></svg>`;
      case ComponentTypes.SAMPLE_AND_HOLD:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#f0fdf4" stroke="#03b585" stroke-width="1.5"/><text x="12" y="14" font-size="6" text-anchor="middle" font-weight="bold" fill="#03b585">S&H</text></svg>`;
      case ComponentTypes.ANALOG_SWITCH_4066:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/><text x="12" y="14" font-size="5" text-anchor="middle" font-weight="bold" fill="#1d4ed8">4066</text></svg>`;
      case ComponentTypes.COMPARATOR:
        return `<svg viewBox="0 0 24 24"><polygon points="4,4 20,12 4,20" fill="none" stroke="#0284c7" stroke-width="1.8"/><text x="7" y="10" font-size="6" fill="#0284c7" font-weight="bold">-</text><text x="7" y="17" font-size="6" fill="#0284c7" font-weight="bold">+</text></svg>`;
      case ComponentTypes.TIMER555:
      case ComponentTypes.TIMER556:
        return `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="#f8fafc" stroke="#2b2d2f" stroke-width="1.6"/><text x="12" y="14" font-size="6.5" text-anchor="middle" font-weight="bold" fill="#0284c7">555</text></svg>`;
      case ComponentTypes.ANALOG_MULTIPLIER:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#2b2d2f" stroke-width="1.8" fill="none"/><text x="12" y="15" font-size="9" text-anchor="middle" font-weight="bold" fill="#03b585">✕</text></svg>`;

      // 7. Voltage Regulators
      case ComponentTypes.LM7805:
      case ComponentTypes.LM7812:
      case ComponentTypes.LM7912:
      case ComponentTypes.LM317:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="#eff6ff" stroke="#0284c7" stroke-width="1.5"/><text x="12" y="14" font-size="5.5" text-anchor="middle" font-weight="bold" fill="#0284c7">REG</text></svg>`;

      // 8. Digital Logic Gates
      case ComponentTypes.AND_GATE:
      case ComponentTypes.AND3_GATE:
      case ComponentTypes.IC_7408:
        return `<svg viewBox="0 0 24 24"><path d="M4,5 L11,5 C16,5 19,8 19,12 C19,16 16,19 11,19 L4,19 Z" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.NAND_GATE:
      case ComponentTypes.NAND3_GATE:
      case ComponentTypes.IC_7400:
        return `<svg viewBox="0 0 24 24"><path d="M3,5 L9,5 C14,5 17,8 17,12 C17,16 14,19 9,19 L3,19 Z" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><circle cx="19" cy="12" r="2" stroke="#2b2d2f" stroke-width="1.4" fill="none"/></svg>`;
      case ComponentTypes.OR_GATE:
      case ComponentTypes.OR3_GATE:
      case ComponentTypes.IC_7432:
        return `<svg viewBox="0 0 24 24"><path d="M3,5 Q10,5 20,12 Q10,19 3,19 Q7,12 3,5 Z" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.NOR_GATE:
      case ComponentTypes.NOR3_GATE:
      case ComponentTypes.IC_7402:
        return `<svg viewBox="0 0 24 24"><path d="M3,5 Q9,5 17,12 Q9,19 3,19 Q6,12 3,5 Z" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><circle cx="19" cy="12" r="2" stroke="#2b2d2f" stroke-width="1.4" fill="none"/></svg>`;
      case ComponentTypes.XOR_GATE:
      case ComponentTypes.IC_7486:
        return `<svg viewBox="0 0 24 24"><path d="M5,5 Q11,5 20,12 Q11,19 5,19 Q9,12 5,5 Z" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><path d="M2,5 Q6,12 2,19" stroke="#2b2d2f" stroke-width="1.6" fill="none"/></svg>`;
      case ComponentTypes.XNOR_GATE:
        return `<svg viewBox="0 0 24 24"><path d="M5,5 Q10,5 17,12 Q10,19 5,19 Q8,12 5,5 Z" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><path d="M2,5 Q5,12 2,19" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><circle cx="19" cy="12" r="2" stroke="#2b2d2f" stroke-width="1.3" fill="none"/></svg>`;
      case ComponentTypes.NOT_GATE:
      case ComponentTypes.IC_7404:
      case ComponentTypes.BUFFER_GATE:
      case ComponentTypes.SCHMITT_TRIGGER:
        return `<svg viewBox="0 0 24 24"><polygon points="4,5 16,12 4,19" fill="none" stroke="#2b2d2f" stroke-width="1.8"/><circle cx="18" cy="12" r="2" stroke="#2b2d2f" stroke-width="1.5" fill="none"/></svg>`;

      // 9. Digital ICs & Flip-Flops
      case ComponentTypes.D_FLIPFLOP:
      case ComponentTypes.JK_FLIPFLOP:
      case ComponentTypes.SR_LATCH:
      case ComponentTypes.T_FLIPFLOP:
      case ComponentTypes.BINARY_COUNTER_4BIT:
      case ComponentTypes.HALF_ADDER:
      case ComponentTypes.FULL_ADDER:
      case ComponentTypes.MUX_4TO1:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#f8fafc" stroke="#2b2d2f" stroke-width="1.6"/><text x="12" y="14" font-size="6" text-anchor="middle" font-weight="bold" fill="#0284c7">LOGIC</text></svg>`;

      // 10. Switches & Relays
      case ComponentTypes.DIGITAL_CONSTANT:
      case ComponentTypes.DIGITAL_SWITCH:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="1.6"/><rect x="7" y="7" width="10" height="10" rx="1.5" fill="#1e293b" stroke="#38bdf8" stroke-width="1"/><text x="12" y="15" font-size="8" text-anchor="middle" font-weight="900" fill="#38bdf8">1</text></svg>`;
      case ComponentTypes.TEXT_LABEL:
      case ComponentTypes.ANNOTATION:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2 2"/><text x="12" y="16" font-size="11" text-anchor="middle" font-weight="900" fill="#334155">T</text></svg>`;
      case ComponentTypes.SPST_SWITCH:
      case ComponentTypes.SPDT_SWITCH:
      case ComponentTypes.PUSH_BUTTON:
      case ComponentTypes.PUSH_BUTTON_NC:
      case ComponentTypes.RELAY_SPDT:
        return `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="#2b2d2f"/><circle cx="19" cy="12" r="2" fill="#2b2d2f"/><line x1="5" y1="12" x2="16" y2="6" stroke="#2b2d2f" stroke-width="2"/></svg>`;

      // 11. Electromechanical & Motors
      case ComponentTypes.LAMP:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="7" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.6"/><path d="M10,18 L14,18 M11,20 L13,20" stroke="#64748b" stroke-width="1.5"/><path d="M9,9 L15,13 M9,13 L15,9" stroke="#f59e0b" stroke-width="1.4"/></svg>`;
      case ComponentTypes.DC_MOTOR:
      case ComponentTypes.STEPPER_MOTOR:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#2b2d2f" stroke-width="1.8" fill="#f8fafc"/><text x="12" y="15" font-size="8" text-anchor="middle" font-weight="bold" fill="#0284c7">M</text></svg>`;
      case ComponentTypes.BUZZER:
      case ComponentTypes.SPEAKER:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#2b2d2f" stroke-width="1.8" fill="#f8fafc"/><path d="M9,9 L9,15 M12,7 L12,17 M15,9 L15,15" stroke="#e11d48" stroke-width="1.5"/></svg>`;

      // 12. Opto & Displays
      case ComponentTypes.SEVEN_SEGMENT:
      case ComponentTypes.LED_BAR_GRAPH:
        return `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="#0f172a" stroke="#475569" stroke-width="1.5"/><text x="12" y="16" font-size="12" text-anchor="middle" font-weight="bold" fill="#ff3b30">8</text></svg>`;

      // 13. Sensors & Controls
      case ComponentTypes.LM35_TEMP:
      case ComponentTypes.HALL_EFFECT:
      case ComponentTypes.LOAD_CELL:
      case ComponentTypes.PID_CONTROLLER:
      case ComponentTypes.INTEGRATOR_BLOCK:
      case ComponentTypes.DIFFERENTIATOR_BLOCK:
      case ComponentTypes.GAIN_BLOCK:
      case ComponentTypes.SUMMING_BLOCK:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/><text x="12" y="14" font-size="7" text-anchor="middle" font-weight="bold" fill="#059669">∫</text></svg>`;

      // 14. Power Symbols
      case ComponentTypes.POWER_VCC:
      case ComponentTypes.POWER_5V:
      case ComponentTypes.POWER_12V:
      case ComponentTypes.POWER_NEG12V:
      case ComponentTypes.POWER_15V:
      case ComponentTypes.POWER_NEG15V:
      case ComponentTypes.NET_LABEL:
        return `<svg viewBox="0 0 24 24"><path d="M12,18 L12,8 M8,12 L12,6 L16,12" stroke="#e11d48" stroke-width="2" fill="none"/><text x="12" y="22" font-size="5" text-anchor="middle" font-weight="bold" fill="#e11d48">VCC</text></svg>`;

      case ComponentTypes.NODE:
      case ComponentTypes.JUNCTION:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#0f172a" stroke="#0284c7" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="7" stroke="#0284c7" stroke-width="1.5"/><line x1="12" y1="17" x2="12" y2="22" stroke="#0284c7" stroke-width="1.5"/><line x1="2" y1="12" x2="7" y2="12" stroke="#0284c7" stroke-width="1.5"/><line x1="17" y1="12" x2="22" y2="12" stroke="#0284c7" stroke-width="1.5"/></svg>`;

      // 15. Probes & Meters
      case ComponentTypes.PROBE_V:
        return `<svg viewBox="0 0 24 24"><path d="M12,20 L6,10 L6,4 L18,4 L18,10 Z" fill="#03b585"/><text x="12" y="10" font-size="7" fill="#fff" text-anchor="middle" font-weight="bold">V</text></svg>`;
      case ComponentTypes.PROBE_I:
        return `<svg viewBox="0 0 24 24"><path d="M12,20 L6,10 L6,4 L18,4 L18,10 Z" fill="#ff9500"/><text x="12" y="10" font-size="7" fill="#fff" text-anchor="middle" font-weight="bold">I</text></svg>`;
      case ComponentTypes.VOLTMETER:
      case ComponentTypes.AMMETER:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#0284c7" stroke-width="1.8" fill="#ffffff"/><text x="12" y="15" font-size="8" text-anchor="middle" font-weight="bold" fill="#0284c7">V</text></svg>`;

      default:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#0284c7" stroke-width="1.5" fill="#f8fafc"/><text x="12" y="14" font-size="6" text-anchor="middle" fill="#0284c7" font-weight="bold">IC</text></svg>`;
    }
  }

  // --- Toolbar & Simulation Controls ---
  initToolbarControls() {
    const btnSimToggle = document.getElementById('btnSimToggle');
    const simIcon = document.getElementById('simToggleIcon');
    const simText = document.getElementById('simToggleText');

    btnSimToggle.addEventListener('click', () => {
      if (this.isSimRunning) {
        this.stopSimulation();
      } else {
        this.startSimulation();
      }
    });

    document.getElementById('btnSimReset').addEventListener('click', () => {
      this.engine.reset();
      this.updateSimTimeDisplay();
      this.canvas.render();
      this.grapher.render();
    });

    document.getElementById('circuitPresetSelect').addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadCircuitPreset(e.target.value);
      }
    });

    document.getElementById('btnAddNodeToolbar')?.addEventListener('click', () => {
      this.canvas.setPlacementMode(ComponentTypes.NODE);
    });
    document.getElementById('btnAddNode')?.addEventListener('click', () => {
      this.canvas.setPlacementMode(ComponentTypes.NODE);
    });
    document.getElementById('btnAddTextToolbar')?.addEventListener('click', () => {
      this.canvas.setPlacementMode(ComponentTypes.TEXT_LABEL);
      this.updatePlacementBanner(ComponentDefinitions[ComponentTypes.TEXT_LABEL]);
    });
    document.getElementById('btnAddTextFloating')?.addEventListener('click', () => {
      this.canvas.setPlacementMode(ComponentTypes.TEXT_LABEL);
      this.updatePlacementBanner(ComponentDefinitions[ComponentTypes.TEXT_LABEL]);
    });

    // Quick Component Ribbon Buttons (Touch & Mouse Placement Mode)
    document.querySelectorAll('.quick-comp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        if (type && ComponentDefinitions[type]) {
          if (this.canvas.mode === 'PLACE' && this.canvas.placementComponentType === type) {
            this.canvas.cancelAction();
          } else {
            this.canvas.setPlacementMode(type);
          }
          this.updatePlacementBanner(ComponentDefinitions[type]);
        }
      });
    });

    // Placement Mode Banner Cancel Button
    document.getElementById('btnCancelPlacement')?.addEventListener('click', () => {
      this.canvas.cancelAction();
      this.updatePlacementBanner();
    });

    document.getElementById('btnSelectAll')?.addEventListener('click', () => this.canvas.selectAll());
    document.getElementById('btnSelectAllFloating')?.addEventListener('click', () => this.canvas.selectAll());
    document.getElementById('btnCut')?.addEventListener('click', () => this.canvas.cutSelection());
    document.getElementById('btnCopy')?.addEventListener('click', () => this.canvas.copySelection());
    document.getElementById('btnPaste')?.addEventListener('click', () => this.canvas.pasteSelection());
    document.getElementById('btnDelete')?.addEventListener('click', () => this.canvas.removeSelected());
    document.getElementById('btnDeleteFloating')?.addEventListener('click', () => this.canvas.removeSelected());

    document.getElementById('btnUndo').addEventListener('click', () => this.canvas.undo());
    document.getElementById('btnRedo').addEventListener('click', () => this.canvas.redo());

    document.getElementById('btnRotate').addEventListener('click', () => this.canvas.rotateSelected(90));
    document.getElementById('btnFlipH')?.addEventListener('click', () => this.canvas.flipSelected('x'));
    document.getElementById('btnFlipV')?.addEventListener('click', () => this.canvas.flipSelected('y'));
    document.getElementById('btnFitScreen').addEventListener('click', () => this.canvas.fitToScreen());

    document.getElementById('btnZoomIn').addEventListener('click', () => this.canvas.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => this.canvas.zoomOut());
    document.getElementById('btnZoomReset').addEventListener('click', () => this.canvas.resetZoom());

    const toggleNodesHandler = () => {
      const isShown = this.canvas.toggleNodeNumbers();
      const btn1 = document.getElementById('btnToggleNodes');
      const btn2 = document.getElementById('btnToggleNodesToolbar');
      if (btn1) btn1.classList.toggle('active', isShown);
      if (btn2) btn2.classList.toggle('active', isShown);
    };
    document.getElementById('btnToggleNodes')?.addEventListener('click', toggleNodesHandler);
    document.getElementById('btnToggleNodesToolbar')?.addEventListener('click', toggleNodesHandler);

    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setViewMode(btn.dataset.mode);
      });
    });

    document.getElementById('btnToggleCursors').addEventListener('click', () => {
      const isShown = this.grapher.toggleCursors();
      const btn = document.getElementById('btnToggleCursors');
      if (btn) btn.classList.toggle('active', isShown);
    });

    // Cursor Mode Select (Time, Voltage, Dual)
    const cursorModeSelect = document.getElementById('cursorModeSelect');
    if (cursorModeSelect) {
      cursorModeSelect.addEventListener('change', (e) => {
        this.grapher.setCursorMode(e.target.value);
        const btn = document.getElementById('btnToggleCursors');
        if (btn) btn.classList.add('active');
      });
    }

    // CRO Quick Parameters Panel Toggle
    document.getElementById('btnQuickParams')?.addEventListener('click', () => {
      this.grapher.toggleQuickPanel();
    });
    document.getElementById('btnCloseQuickPanel')?.addEventListener('click', () => {
      this.grapher.toggleQuickPanel();
    });

    // Quick Snap Cursors to Waveform Peaks & Cycle
    document.getElementById('btnSnapCursorPeak')?.addEventListener('click', () => this.grapher.snapCursorToPeak());
    document.getElementById('btnSnapCursorValley')?.addEventListener('click', () => this.grapher.snapCursorToValley());
    document.getElementById('btnSnapCursorPeriod')?.addEventListener('click', () => this.grapher.snapCursorToPeriod());
    
    // Time/Div Manual Text Input and Preset Selector
    const timeInput = document.getElementById('timeScaleInput');
    const timeSelect = document.getElementById('timeScaleSelect');
    if (timeInput) {
      const applyTime = () => this.grapher.setTimeScale(timeInput.value);
      timeInput.addEventListener('change', applyTime);
      timeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyTime(); timeInput.blur(); } });
    }
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        this.grapher.setTimeScale(parseFloat(e.target.value));
        if (timeInput) timeInput.value = formatValueWithPrefix(parseFloat(e.target.value), 's');
      });
    }

    // Volts/Div Manual Text Input and Preset Selector
    const voltInput = document.getElementById('voltScaleInput');
    const voltSelect = document.getElementById('voltScaleSelect');
    if (voltInput) {
      const applyVolt = () => this.grapher.setVoltScale(voltInput.value);
      voltInput.addEventListener('change', applyVolt);
      voltInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyVolt(); voltInput.blur(); } });
    }
    if (voltSelect) {
      voltSelect.addEventListener('change', (e) => {
        this.grapher.setVoltScale(e.target.value);
        if (voltInput) voltInput.value = e.target.value === 'auto' ? 'Auto' : formatValueWithPrefix(parseFloat(e.target.value), 'V');
      });
    }

    document.getElementById('btnGraphResetView')?.addEventListener('click', () => this.grapher.resetView());
    document.getElementById('btnGraphTheme')?.addEventListener('click', (e) => {
      const newTheme = this.grapher.toggleTheme();
      e.target.textContent = `Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`;
    });
    document.getElementById('btnExportCSV').addEventListener('click', () => this.grapher.exportCSV());
    document.getElementById('btnExportPlotPNG').addEventListener('click', () => this.grapher.exportPNG());

    document.getElementById('btnSaveMyCircuit')?.addEventListener('click', () => {
      this.saveCurrentCircuitToMyCircuits();
    });

    document.getElementById('circuitNameInput').addEventListener('change', (e) => {
      document.title = `${e.target.value} - Switcha`;
    });

    // Global keyboard shortcuts (Ctrl+S to Save)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.saveCurrentCircuitToMyCircuits();
      }
    });

    // --- Responsive Sidebar & Topbar Handlers ---
    const announcementCloseBtn = document.getElementById('btnCloseAnnouncement');
    if (announcementCloseBtn) {
      announcementCloseBtn.addEventListener('click', () => {
        document.body.classList.add('announcement-hidden');
        const announcement = document.getElementById('topAnnouncement');
        if (announcement) announcement.classList.add('hidden');
        setTimeout(() => {
          this.canvas.resize();
          this.grapher.resize();
        }, 220);
      });
    }

    const togglePaletteHandler = () => {
      const sidebar = document.getElementById('paletteSidebar');
      const btn = document.getElementById('btnTogglePalette');
      if (sidebar) {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        if (btn) btn.classList.toggle('active', !isCollapsed);
        setTimeout(() => {
          this.canvas.resize();
          this.grapher.resize();
        }, 220);
      }
    };
    document.getElementById('btnTogglePalette')?.addEventListener('click', togglePaletteHandler);
    document.getElementById('btnCollapsePalette')?.addEventListener('click', togglePaletteHandler);

    const togglePropertiesHandler = () => {
      const sidebar = document.getElementById('propertiesSidebar');
      const btn = document.getElementById('btnToggleProperties');
      if (sidebar) {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        if (btn) btn.classList.toggle('active', !isCollapsed);
        setTimeout(() => {
          this.canvas.resize();
          this.grapher.resize();
        }, 220);
      }
    };
    document.getElementById('btnToggleProperties')?.addEventListener('click', togglePropertiesHandler);
    document.getElementById('btnCloseProperties')?.addEventListener('click', togglePropertiesHandler);
  }

  initQuickSearch() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const searchInput = document.getElementById('paletteSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  setViewMode(mode) {
    this.currentMode = mode;
    const canvasPanel = document.getElementById('canvasPanel');
    const splitGutter = document.getElementById('splitGutter');
    const grapherPanel = document.getElementById('grapherPanel');

    if (mode === 'schematic') {
      canvasPanel.style.display = 'block';
      canvasPanel.style.flex = '1';
      splitGutter.style.display = 'none';
      grapherPanel.style.display = 'none';
    } else if (mode === 'grapher') {
      canvasPanel.style.display = 'none';
      splitGutter.style.display = 'none';
      grapherPanel.style.display = 'flex';
      grapherPanel.style.height = '100%';
    } else {
      canvasPanel.style.display = 'block';
      canvasPanel.style.flex = '1';
      splitGutter.style.display = 'flex';
      grapherPanel.style.display = 'flex';
      grapherPanel.style.height = '280px';
    }

    setTimeout(() => {
      this.canvas.resize();
      this.grapher.resize();
    }, 50);
  }

  updatePlacementBanner(def = null) {
    const banner = document.getElementById('placementBanner');
    const textEl = document.getElementById('placementBannerText');
    if (!banner) return;
    if (this.canvas.mode === 'PLACE' && this.canvas.placementComponentType) {
      const type = this.canvas.placementComponentType;
      const compDef = def || ComponentDefinitions[type];
      const name = compDef ? compDef.name.split('(')[0].trim() : type;
      if (textEl) textEl.textContent = `Placing ${name} — Tap or click anywhere on canvas to place (or drag to position)`;
      banner.style.display = 'flex';
      document.querySelectorAll('.quick-comp-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
      });
    } else {
      banner.style.display = 'none';
      document.querySelectorAll('.quick-comp-btn').forEach(b => b.classList.remove('active'));
    }
  }

  initSplitGutter() {
    const gutter = document.getElementById('splitGutter');
    const grapherPanel = document.getElementById('grapherPanel');
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    gutter.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      startHeight = grapherPanel.offsetHeight;
      document.body.style.cursor = 'row-resize';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dy = startY - e.clientY;
      const newHeight = Math.max(120, Math.min(window.innerHeight - 200, startHeight + dy));
      grapherPanel.style.height = `${newHeight}px`;
      this.canvas.resize();
      this.grapher.resize();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
      }
    });
  }

  // --- Simulation Execution Loop ---
  startSimulationLoop() {
    this.lastTimestamp = performance.now();
    const loop = () => {
      if (!this.isSimRunning) return;

      const now = performance.now();
      const wallDeltaSec = Math.min((now - (this.lastTimestamp || now)) / 1000, 0.05);
      this.lastTimestamp = now;

      const adaptiveDt = this.engine.getAdaptiveTimeStep(this.grapher?.timePerDiv);
      // Target simulation time tracks wall-clock delta seconds (real-time 1:1 progression)
      // while scaling with the oscilloscope timebase when observing high frequencies
      const targetSimTime = Math.max(adaptiveDt * 20, Math.min(wallDeltaSec || 0.016, (this.grapher?.timePerDiv || 0.001) * 10));
      const steps = Math.max(20, Math.min(500, Math.round(targetSimTime / adaptiveDt)));

      for (let i = 0; i < steps; i++) {
        this.engine.step(adaptiveDt);
      }

      // Sample lab instruments
      if (this.instruments.dmm) this.instruments.dmm.update(this.engine);
      if (this.instruments.logicAnalyzer) this.instruments.logicAnalyzer.recordSample(this.engine.time, this.engine);
      if (this.instruments.spectrumAnalyzer) this.instruments.spectrumAnalyzer.update(this.engine);

      this.updateSimTimeDisplay();
      this.updateAcousticSynthesizer();
      this.canvas.render();
      this.grapher.render();

      this.simAnimFrame = requestAnimationFrame(loop);
    };

    this.simAnimFrame = requestAnimationFrame(loop);
  }

  startSimulation() {
    if (!this.isSimRunning) {
      this.isSimRunning = true;
      const btnSimToggle = document.getElementById('btnSimToggle');
      const simIcon = document.getElementById('simToggleIcon');
      const simText = document.getElementById('simToggleText');
      if (btnSimToggle) btnSimToggle.classList.add('running');
      if (simIcon) simIcon.textContent = '⏸';
      if (simText) simText.textContent = 'Pause Simulation';
      this.startSimulationLoop();
    }
  }

  stopSimulation() {
    if (this.isSimRunning) {
      this.isSimRunning = false;
      const btnSimToggle = document.getElementById('btnSimToggle');
      const simIcon = document.getElementById('simToggleIcon');
      const simText = document.getElementById('simToggleText');
      if (btnSimToggle) btnSimToggle.classList.remove('running');
      if (simIcon) simIcon.textContent = '▶';
      if (simText) simText.textContent = 'Run Simulation';
      this.stopSimulationLoop();
    }
  }

  stopSimulationLoop() {
    if (this.simAnimFrame) {
      cancelAnimationFrame(this.simAnimFrame);
      this.simAnimFrame = null;
    }
    this.stopAcousticSynthesizer();
  }

  updateAcousticSynthesizer() {
    if (!this.isSimRunning || !this.engine || !this.canvas) {
      this.stopAcousticSynthesizer();
      return;
    }

    let activeBuzzerMaxV = 0;
    this.canvas.components.forEach(comp => {
      if (comp.type === ComponentTypes.BUZZER || comp.type === ComponentTypes.SPEAKER) {
        const n1 = this.engine.getNode(comp, 'p1');
        const n2 = this.engine.getNode(comp, 'p2');
        const v1 = n1 !== -1 ? (this.engine.nodeVoltages[n1] || 0) : 0;
        const v2 = n2 !== -1 ? (this.engine.nodeVoltages[n2] || 0) : 0;
        const v = Math.abs(v1 - v2);
        if (v > activeBuzzerMaxV) activeBuzzerMaxV = v;
      }
    });

    if (activeBuzzerMaxV >= 1.5) {
      if (!this.audioCtx && (typeof window !== 'undefined')) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          try { this.audioCtx = new AudioContextClass(); } catch (_) {}
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.audioCtx && !this.buzzerOscillator) {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2400, this.audioCtx.currentTime); // Standard 2.4kHz piezo frequency
          gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime); // Comfortable volume
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          this.buzzerOscillator = osc;
          this.buzzerGain = gain;
        } catch (_) {}
      }
    } else {
      this.stopAcousticSynthesizer();
    }
  }

  stopAcousticSynthesizer() {
    if (this.buzzerOscillator) {
      try { this.buzzerOscillator.stop(); } catch (_) {}
      this.buzzerOscillator = null;
      this.buzzerGain = null;
    }
  }

  updateSimTimeDisplay() {
    const timeSec = this.engine.time;
    const timeDisplay = document.getElementById('simTimeDisplay');
    if (timeDisplay) {
      timeDisplay.textContent = `t: ${formatValueWithPrefix(timeSec, 's')}`;
    }
  }

  // --- Properties Inspector ---
  renderPropertiesInspector(selection) {
    const container = document.getElementById('propertiesContent');
    if (!container) return;

    if (selection && selection.type === 'wire' && selection.item) {
      const wire = selection.item;
      const nodeId = this.engine?.pinToNodeMap?.get(wire.fromPin);
      const volt = (nodeId !== undefined && this.engine.nodeVoltages) ? this.engine.nodeVoltages[nodeId] : null;
      const voltStr = volt !== null && !isNaN(volt) && isFinite(volt) ? formatValueWithPrefix(volt, 'V') : '0.00 V';

      container.innerHTML = `
        <div class="property-group">
          <label class="property-label">Connection Type</label>
          <div style="font-size: 14px; font-weight: 700; color: #007aff;">Wire ${wire.id}</div>
        </div>
        <div class="property-group">
          <label class="property-label">SPICE Electrical Node</label>
          <div style="font-size: 16px; font-weight: 700; color: ${nodeId === 0 ? '#10b981' : '#6366f1'};">
            Node ${nodeId === 0 ? '0 (Ground Reference)' : (nodeId !== undefined ? nodeId : 'Unconnected')}
          </div>
        </div>
        <div class="property-group">
          <label class="property-label">Live Node Voltage</label>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${voltStr}</div>
        </div>
        <div class="property-group">
          <label class="property-label">From Terminal</label>
          <div style="font-size: 12px; color: var(--text-muted); font-family: monospace;">${wire.fromPin}</div>
        </div>
        <div class="property-group">
          <label class="property-label">To Terminal</label>
          <div style="font-size: 12px; color: var(--text-muted); font-family: monospace;">${wire.toPin}</div>
        </div>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color);"/>
        <button class="btn btn-outline" id="btnPropDeleteWire" style="color: #e11d48; width: 100%;" title="Delete Wire (Del)">🗑 Delete Wire</button>
      `;

      document.getElementById('btnPropDeleteWire')?.addEventListener('click', () => {
        this.canvas.wires = this.canvas.wires.filter(w => w.id !== wire.id);
        this.canvas.selectWire(null);
        this.canvas.notifyModified();
        this.canvas.render();
      });
      return;
    }

    if (!selection || selection.type !== 'component' || !selection.item) {
      container.innerHTML = `<p class="no-selection-msg">Select a component or wire on the schematic to inspect and edit its parameters.</p>`;
      return;
    }

    const comp = selection.item;
    const def = ComponentDefinitions[comp.type];
    if (!def) return;

    if (comp.type === ComponentTypes.NODE || comp.type === ComponentTypes.JUNCTION) {
      const pinKey = `${comp.id}:p1`;
      const nodeId = this.engine?.pinToNodeMap?.get(pinKey);
      const volt = (nodeId !== undefined && this.engine.nodeVoltages) ? this.engine.nodeVoltages[nodeId] : null;
      const voltStr = volt !== null && !isNaN(volt) && isFinite(volt) ? formatValueWithPrefix(volt, 'V') : '0.00 V';
      const connectedWires = this.canvas.wires.filter(w => w.fromPin === pinKey || w.toPin === pinKey);

      container.innerHTML = `
        <div class="property-group">
          <label class="property-label">Connection Node</label>
          <div style="font-size: 15px; font-weight: 700; color: #0284c7;">${comp.name} (Multi-Wire Hub)</div>
        </div>
        <div class="property-group">
          <label class="property-label">SPICE Electrical Node</label>
          <div style="font-size: 16px; font-weight: 700; color: ${nodeId === 0 ? '#10b981' : '#6366f1'};">
            Node ${nodeId === 0 ? '0 (Ground Reference)' : (nodeId !== undefined ? nodeId : 'Unconnected')}
          </div>
        </div>
        <div class="property-group">
          <label class="property-label">Live Node Voltage</label>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${voltStr}</div>
        </div>
        <div class="property-group">
          <label class="property-label">Connected Branches</label>
          <div style="font-size: 13px; font-weight: 600; color: #334155;">${connectedWires.length} wires connected</div>
        </div>
        <div class="property-group">
          <label class="property-label">Custom Net Label (Optional)</label>
          <input type="text" class="property-input prop-param-input" data-key="label" value="${comp.params?.label || ''}" placeholder="e.g. V_MID, CLK, DATA"/>
        </div>
        <button class="btn btn-primary" id="btnPropWireFromNode" style="width: 100%; margin-top: 10px; font-size: 12px; font-weight: 700;" title="Click to draw a wire branch from this node (W)">
          ⚡ Draw Wire from this Node
        </button>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color);"/>
        <button class="btn btn-outline" id="btnPropDeleteNode" style="color: #e11d48; width: 100%;" title="Delete Node (Del)">🗑 Delete Node</button>
      `;

      document.getElementById('btnPropWireFromNode')?.addEventListener('click', () => {
        this.canvas.startWiringFromComponent(comp);
      });

      document.getElementById('btnPropDeleteNode')?.addEventListener('click', () => {
        this.canvas.removeComponent(comp);
      });

      container.querySelectorAll('.prop-param-input').forEach(input => {
        input.addEventListener('input', () => {
          comp.params[input.dataset.key] = input.value;
          this.canvas.notifyModified();
          this.canvas.render();
        });
      });
      return;
    }

    let html = `
      <div class="property-group">
        <label class="property-label">Component Reference</label>
        <input type="text" class="form-control" id="propNameInput" value="${comp.name}"/>
      </div>
      <div class="property-group">
        <label class="property-label">Type</label>
        <div style="font-size: 13px; font-weight: 600; color: #03b585;">${def.name}</div>
      </div>
    `;

    const isInteractiveTrigger =
      comp.type === ComponentTypes.PULSE_VOLTAGE ||
      comp.type === ComponentTypes.TRIGGER_PULSE ||
      comp.type === ComponentTypes.PUSH_BUTTON ||
      comp.type === ComponentTypes.PUSH_BUTTON_NC ||
      comp.type === ComponentTypes.SPST_SWITCH ||
      comp.type === ComponentTypes.SPDT_SWITCH;

    if (isInteractiveTrigger) {
      let btnLabel = '⚡ Fire Trigger Pulse';
      if (comp.type === ComponentTypes.PUSH_BUTTON || comp.type === ComponentTypes.PUSH_BUTTON_NC) {
        btnLabel = '🔘 Press Push Button (Momentary Pulse)';
      } else if (comp.type === ComponentTypes.SPST_SWITCH || comp.type === ComponentTypes.SPDT_SWITCH) {
        btnLabel = '🔌 Toggle Switch State';
      }

      html += `
        <div class="property-group" style="margin-top: 10px;">
          <button class="btn btn-primary" id="btnFireTriggerPulse" style="width: 100%; padding: 10px; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #0284c7, #06b6d4); box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);" title="Trigger / Toggle Component Pulse (Click or Spacebar)">
            ${btnLabel} <span style="opacity: 0.8; font-size: 11px;">(Space)</span>
          </button>
        </div>
      `;
    }

    if (def.paramSchema && def.paramSchema.length > 0) {
      html += `<hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color);"/>`;

      def.paramSchema.forEach(schema => {
        const currentVal = comp.params[schema.key] ?? schema.default;
        if (schema.type === 'number') {
          let displayVal = currentVal;
          if (typeof currentVal === 'number') {
            displayVal = formatValueWithPrefix(currentVal, '').trim();
          }
          html += `
            <div class="property-group">
              <label class="property-label">${schema.label}</label>
              <div class="property-input-row">
                <input type="text" class="property-input prop-param-input" data-key="${schema.key}" data-type="number" value="${displayVal}"/>
                <span class="property-unit">${schema.unit || ''}</span>
              </div>
            </div>
          `;
        } else if (schema.type === 'range') {
          html += `
            <div class="property-group">
              <label class="property-label">${schema.label}: <span id="val_${schema.key}">${currentVal}</span>%</label>
              <input type="range" class="prop-param-input" data-key="${schema.key}" value="${currentVal}" min="${schema.min || 0}" max="${schema.max || 100}" step="${schema.step || 1}" style="width: 100%;"/>
            </div>
          `;
        } else if (schema.type === 'boolean') {
          html += `
            <div class="property-group">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                <input type="checkbox" class="prop-param-input" data-key="${schema.key}" ${currentVal ? 'checked' : ''}/>
                ${schema.label}
              </label>
            </div>
          `;
        } else if (schema.type === 'select') {
          html += `
            <div class="property-group">
              <label class="property-label">${schema.label}</label>
              <select class="form-control prop-param-input" data-key="${schema.key}">
                ${schema.options.map(opt => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
          `;
        } else if (schema.type === 'string') {
          html += `
            <div class="property-group">
              <label class="property-label">${schema.label}</label>
              <input type="text" class="property-input prop-param-input" data-key="${schema.key}" value="${currentVal}"/>
            </div>
          `;
        }
      });
    }

    // Complete IC Architecture & Pinout Table
    if (comp.pins && comp.pins.length > 0) {
      html += `
        <div class="property-group" style="margin-top: 14px;">
          <label class="property-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>IC Pinout & Architecture</span>
            <span style="font-size: 10.5px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${def.package || `${comp.pins.length}-Pin`}</span>
          </label>
          ${def.description ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.35;">${def.description}</p>` : ''}
          <div style="border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; background: #ffffff; margin-top: 4px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid var(--border-color); color: #475569; font-weight: 700;">
                  <th style="padding: 4px 6px;">Pin</th>
                  <th style="padding: 4px 6px;">Name</th>
                  <th style="padding: 4px 6px;">Role</th>
                  <th style="padding: 4px 6px; text-align: right;">Live V</th>
                </tr>
              </thead>
              <tbody>
                ${comp.pins.map(pin => {
                  const pinKey = `${comp.id}:${pin.id}`;
                  const nodeId = this.engine?.pinToNodeMap?.get(pinKey);
                  const volt = (nodeId !== undefined && this.engine.nodeVoltages) ? this.engine.nodeVoltages[nodeId] : null;
                  const voltStr = volt !== null && !isNaN(volt) && isFinite(volt) ? formatValueWithPrefix(volt, 'V') : '—';
                  const pinNum = pin.num || (pin.name && pin.name.match(/\((\d+)\)/) ? RegExp.$1 : (pin.id.replace('p', '') || '•'));
                  const pinNameClean = (pin.name || pin.id).replace(/\s*\(\d+\)/, '');
                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 4px 6px; font-family: monospace; font-weight: 700; color: #0284c7;">#${pinNum}</td>
                      <td style="padding: 4px 6px; font-weight: 700; color: #1e293b;">${pinNameClean}</td>
                      <td style="padding: 4px 6px; color: #64748b; font-size: 10px;">${pin.desc || pin.id}</td>
                      <td style="padding: 4px 6px; text-align: right; font-family: monospace; font-weight: 700; color: ${nodeId === 0 ? '#10b981' : '#0f172a'}; font-size: 10.5px;">${voltStr}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    html += `
      <div style="margin-top: 10px; padding: 8px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 11px; color: #166534; display: flex; align-items: center; gap: 6px;">
        <span>🎯</span>
        <span><strong>Tip:</strong> Drag to pan canvas. <strong>Double-click</strong> component to drag & move.</span>
      </div>
    `;

    html += `
      <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <button class="btn btn-outline" id="btnPropRotate" title="Rotate 90° (R)">↻ Rotate</button>
        <button class="btn btn-outline" id="btnPropFlipH" title="Flip Horizontal (H)">⇄ Flip H</button>
        <button class="btn btn-outline" id="btnPropFlipV" title="Flip Vertical (V)">⇅ Flip V</button>
        <button class="btn btn-outline" id="btnPropDelete" style="color: #e11d48;" title="Delete (Del)">🗑 Delete</button>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('propNameInput')?.addEventListener('input', (e) => {
      comp.name = e.target.value;
      this.canvas.notifyModified();
      this.canvas.render();
    });

    container.querySelectorAll('.prop-param-input').forEach(input => {
      const key = input.dataset.key;
      const handleUpdate = () => {
        let val;
        if (input.type === 'checkbox') {
          val = input.checked;
        } else if (input.type === 'range') {
          val = parseFloat(input.value);
        } else if (input.dataset.type === 'number') {
          val = parseEngineeringValue(input.value);
        } else {
          const isNum = typeof comp.params[key] === 'number';
          val = isNum ? parseEngineeringValue(input.value) : input.value;
        }

        if (typeof val === 'number') {
          if (!isNaN(val)) {
            comp.params[key] = val;
            const displayLabel = document.getElementById(`val_${key}`);
            if (displayLabel) displayLabel.textContent = val;
            this.canvas.notifyModified();
            this.canvas.render();
            this.grapher.render();
          }
        } else {
          comp.params[key] = val;
          this.canvas.notifyModified();
          this.canvas.render();
          this.grapher.render();
        }
      };

      input.addEventListener('input', handleUpdate);
      input.addEventListener('change', handleUpdate);
    });

    document.getElementById('btnFireTriggerPulse')?.addEventListener('click', () => {
      this.canvas.triggerComponentPulse(comp);
      const btn = document.getElementById('btnFireTriggerPulse');
      if (btn) {
        const origText = btn.innerHTML;
        btn.innerHTML = '⚡ Pulse Fired!';
        btn.style.background = '#10b981';
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = origText;
            btn.style.background = 'linear-gradient(135deg, #0284c7, #06b6d4)';
          }
        }, 400);
      }
    });

    document.getElementById('btnPropRotate')?.addEventListener('click', () => this.canvas.rotateSelected(90));
    document.getElementById('btnPropFlipH')?.addEventListener('click', () => this.canvas.flipSelected('x'));
    document.getElementById('btnPropFlipV')?.addEventListener('click', () => this.canvas.flipSelected('y'));
    document.getElementById('btnPropDelete')?.addEventListener('click', () => this.canvas.removeComponent(comp));
  }

  // --- Preset Circuits ---
  loadCircuitPreset(presetKey) {
    const preset = CircuitLibrary[presetKey];
    if (!preset) return;

    this.engine.reset();
    preset.load(this.canvas);
    this.engine.setCircuit(this.canvas.components, this.canvas.wires);

    if (preset.timePerDiv && this.grapher) {
      this.grapher.setTimeScale(preset.timePerDiv);
    }
    if (preset.voltsPerDiv && this.grapher) {
      this.grapher.setVoltScale(preset.voltsPerDiv);
    }

    const nameInput = document.getElementById('circuitNameInput');
    if (nameInput) nameInput.value = preset.name;
    const select = document.getElementById('circuitPresetSelect');
    if (select) select.value = presetKey;
    document.title = `${preset.name} - Switcha`;

    // Auto-start simulation so waveforms run live immediately upon loading preset
    this.startSimulation();

    setTimeout(() => {
      this.canvas.resize();
      this.canvas.fitToScreen();
      this.grapher.resize();
      this.canvas.render();
      this.grapher.render();
    }, 50);
  }

  // --- Progressive Web App (PWA) Offline & Install Handler ---
  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('[Switcha] Service Worker registered successfully:', reg.scope);
        }).catch((err) => {
          console.warn('[Switcha] Service Worker registration failed:', err);
        });
      });
    }

    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBtns = [
        document.getElementById('btnNavInstall'),
        document.getElementById('btnHeroInstall'),
        document.getElementById('footerInstallLink')
      ];
      installBtns.forEach(btn => {
        if (btn) btn.style.display = 'inline-flex';
      });
    });

    const triggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[Switcha] User accepted PWA installation');
          }
          deferredPrompt = null;
        });
      } else {
        document.getElementById('installModal')?.classList.add('active');
      }
    };

    document.getElementById('btnNavInstall')?.addEventListener('click', triggerInstall);
    document.getElementById('btnHeroInstall')?.addEventListener('click', triggerInstall);
    document.getElementById('footerInstallLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      triggerInstall();
    });
    document.getElementById('btnTriggerInstallPrompt')?.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        alert('To install Switcha on iOS/Safari, tap the Share icon ⎋ and select "Add to Home Screen ⊕". On desktop browsers, click the ⊕ icon in your address bar.');
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[Switcha] App was successfully installed!');
      const installBtn = document.getElementById('btnNavInstall');
      if (installBtn) installBtn.textContent = '✓ App Installed';
    });
  }

  // --- Featured Circuits on Homepage ---
  initFeaturedCards() {
    const grid = document.getElementById('featured-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const featuredKeys = ['buckConverter', 'timer555', 'opAmpAmplifier', 'bridgeRectifier', 'classABAmplifier', 'binaryCounter7Seg'];
    featuredKeys.forEach(key => {
      const c = CircuitLibrary[key];
      if (!c) return;

      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.innerHTML = `
        ${this.renderCircuitThumbnailSvg(key, 'Featured')}
        <div class="card-body">
          <div class="card-author-row">
            <div class="card-avatar">${c.author.substr(0, 2).toUpperCase()}</div>
            <div class="card-author-info">
              <div class="card-author-name">${c.author}</div>
              <div class="card-author-date">Verified Circuit</div>
            </div>
          </div>
          <h3 class="card-title">${c.name}</h3>
          <p class="card-desc">${c.description}</p>
          <div class="card-stats">
            <span class="card-stat-item">★ ${c.stats.stars}</span>
            <span class="card-stat-item">⎘ ${c.stats.copies}</span>
            <span class="card-stat-item">👁 ${c.stats.views.toLocaleString()}</span>
          </div>
          <button class="btn btn-primary card-action-btn" data-key="${key}">⚡ Simulate Circuit</button>
        </div>
      `;

      cardEl.querySelector('button').addEventListener('click', () => {
        this.loadCircuitPreset(key);
        window.location.hash = '#/create';
      });

      grid.appendChild(cardEl);
    });
  }

  // --- Rich Electronic Schematic SVG Generator for Discover & Featured Cards ---
  renderCircuitThumbnailSvg(key, badge = 'Public') {
    const badgeHtml = badge ? `<span class="card-badge">${badge}</span>` : '';
    
    const gridDef = `
      <defs>
        <pattern id="thumb_grid_${key}" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(203, 213, 225, 0.45)" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="280" height="160" fill="#f8fafc"/>
      <rect width="280" height="160" fill="url(#thumb_grid_${key})"/>
    `;

    let innerContent = '';

    switch (key) {
      case 'switchSpstLamp':
        innerContent = `
          <!-- 9V DC Source -->
          <circle cx="45" cy="80" r="14" fill="#eff6ff" stroke="#0284c7" stroke-width="2"/>
          <text x="45" y="83" font-size="8.5" text-anchor="middle" font-weight="bold" fill="#0284c7">+9V</text>
          <line x1="45" y1="66" x2="45" y2="40" stroke="#0284c7" stroke-width="2"/>
          <line x1="45" y1="40" x2="90" y2="40" stroke="#1e293b" stroke-width="2"/>
          <!-- SPST Switch -->
          <circle cx="90" cy="40" r="3" fill="#1e293b"/>
          <line x1="90" y1="40" x2="125" y2="28" stroke="#03b585" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="130" cy="40" r="3" fill="#1e293b"/>
          <line x1="130" y1="40" x2="175" y2="40" stroke="#1e293b" stroke-width="2"/>
          <circle cx="175" cy="40" r="3" fill="#1e293b"/>
          <!-- Light Bulb (Lamp) -->
          <circle cx="215" cy="40" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
          <line x1="207" y1="32" x2="223" y2="48" stroke="#ca8a04" stroke-width="2"/>
          <line x1="207" y1="48" x2="223" y2="32" stroke="#ca8a04" stroke-width="2"/>
          <line x1="175" y1="40" x2="201" y2="40" stroke="#1e293b" stroke-width="2"/>
          <line x1="229" y1="40" x2="250" y2="40" stroke="#1e293b" stroke-width="2"/>
          <line x1="250" y1="40" x2="250" y2="120" stroke="#1e293b" stroke-width="2"/>
          <!-- LED Indicator Branch -->
          <line x1="175" y1="40" x2="175" y2="75" stroke="#1e293b" stroke-width="2"/>
          <polyline points="175,75 175,80 170,84 180,89 170,94 180,99 175,103 175,108" fill="none" stroke="#d97706" stroke-width="1.8"/>
          <polygon points="168,116 182,116 175,126" fill="#ef4444" stroke="#ef4444" stroke-width="1.2"/>
          <line x1="168" y1="126" x2="182" y2="126" stroke="#ef4444" stroke-width="2"/>
          <line x1="175" y1="126" x2="175" y2="140" stroke="#1e293b" stroke-width="2"/>
          <line x1="175" y1="140" x2="250" y2="140" stroke="#1e293b" stroke-width="2"/>
          <line x1="250" y1="120" x2="250" y2="140" stroke="#1e293b" stroke-width="2"/>
          <!-- Ground Return -->
          <line x1="45" y1="94" x2="45" y2="140" stroke="#1e293b" stroke-width="2"/>
          <line x1="45" y1="140" x2="250" y2="140" stroke="#1e293b" stroke-width="2"/>
          <circle cx="145" cy="140" r="3" fill="#1e293b"/>
          <line x1="145" y1="140" x2="145" y2="150" stroke="#1e293b" stroke-width="2"/>
          <line x1="137" y1="150" x2="153" y2="150" stroke="#1e293b" stroke-width="2"/>
          <line x1="140" y1="154" x2="150" y2="154" stroke="#1e293b" stroke-width="1.8"/>
        `;
        break;

      case 'buckConverter':
        innerContent = `
          <!-- DC In (12V) -->
          <circle cx="40" cy="80" r="15" fill="#eff6ff" stroke="#0284c7" stroke-width="2"/>
          <text x="40" y="83" font-size="9" text-anchor="middle" font-weight="bold" fill="#0284c7">+12V</text>
          <line x1="40" y1="65" x2="40" y2="40" stroke="#0284c7" stroke-width="2"/>
          <line x1="40" y1="40" x2="80" y2="40" stroke="#1e293b" stroke-width="2"/>
          <!-- Switch / Clock -->
          <rect x="80" y="30" width="28" height="20" rx="3" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
          <polyline points="84,45 90,35 96,45 102,35" fill="none" stroke="#6366f1" stroke-width="1.8"/>
          <!-- Node 1 -->
          <line x1="108" y1="40" x2="135" y2="40" stroke="#1e293b" stroke-width="2"/>
          <circle cx="135" cy="40" r="3.5" fill="#1e293b"/>
          <!-- Inductor (L1) -->
          <path d="M135,40 Q141,24 147,40 Q153,24 159,40 Q165,24 171,40 Q177,24 183,40" fill="none" stroke="#03b585" stroke-width="2.5" stroke-linecap="round"/>
          <text x="159" y="20" font-size="8.5" text-anchor="middle" font-weight="bold" fill="#03b585">L1 220µH</text>
          <!-- Diode (D1) -->
          <line x1="135" y1="40" x2="135" y2="70" stroke="#1e293b" stroke-width="2"/>
          <polygon points="127,85 143,85 135,70" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"/>
          <line x1="125" y1="70" x2="145" y2="70" stroke="#ef4444" stroke-width="2.5"/>
          <line x1="135" y1="85" x2="135" y2="120" stroke="#1e293b" stroke-width="2"/>
          <!-- Node 2 Out -->
          <line x1="183" y1="40" x2="215" y2="40" stroke="#1e293b" stroke-width="2"/>
          <circle cx="215" cy="40" r="3.5" fill="#1e293b"/>
          <!-- Cap (C1) -->
          <line x1="215" y1="40" x2="215" y2="65" stroke="#1e293b" stroke-width="2"/>
          <line x1="205" y1="65" x2="225" y2="65" stroke="#0284c7" stroke-width="2.5"/>
          <line x1="205" y1="73" x2="225" y2="73" stroke="#0284c7" stroke-width="2.5"/>
          <line x1="215" y1="73" x2="215" y2="120" stroke="#1e293b" stroke-width="2"/>
          <!-- Load Resistor (RL) -->
          <line x1="215" y1="40" x2="250" y2="40" stroke="#1e293b" stroke-width="2"/>
          <polyline points="250,40 250,55 245,60 255,68 245,76 255,84 245,92 250,97 250,120" fill="none" stroke="#d97706" stroke-width="2"/>
          <!-- Ground Line -->
          <line x1="40" y1="95" x2="40" y2="120" stroke="#1e293b" stroke-width="2"/>
          <line x1="40" y1="120" x2="250" y2="120" stroke="#1e293b" stroke-width="2"/>
          <circle cx="135" cy="120" r="3.5" fill="#1e293b"/>
          <circle cx="215" cy="120" r="3.5" fill="#1e293b"/>
          <line x1="125" y1="128" x2="145" y2="128" stroke="#1e293b" stroke-width="2.5"/>
          <line x1="130" y1="133" x2="140" y2="133" stroke="#1e293b" stroke-width="2"/>
          <line x1="133" y1="138" x2="137" y2="138" stroke="#1e293b" stroke-width="1.5"/>
          <line x1="135" y1="120" x2="135" y2="128" stroke="#1e293b" stroke-width="2"/>
          <!-- Output Probe Tag -->
          <rect x="195" y="10" width="75" height="18" rx="4" fill="#03b585" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
          <text x="232" y="23" font-size="8.5" text-anchor="middle" font-weight="bold" fill="#ffffff">V_out: 5.0V DC</text>
        `;
        break;

      case 'timer555':
        innerContent = `
          <!-- 555 Timer Astable Schematic -->
          <rect x="95" y="35" width="90" height="90" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
          <text x="140" y="80" font-size="11.5" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="0.5px">555 TIMER</text>
          <circle cx="106" cy="46" r="3" fill="#64748b"/>
          <text x="105" y="60" font-size="8" fill="#94a3b8">8:VCC</text>
          <text x="105" y="80" font-size="8" fill="#94a3b8">7:DIS</text>
          <text x="105" y="100" font-size="8" fill="#94a3b8">6:THR</text>
          <text x="105" y="115" font-size="8" fill="#94a3b8">2:TRG</text>
          <text x="175" y="60" font-size="8" fill="#94a3b8" text-anchor="end">4:RST</text>
          <text x="175" y="80" font-size="8" fill="#38bdf8" font-weight="bold" text-anchor="end">3:OUT</text>
          <text x="175" y="115" font-size="8" fill="#94a3b8" text-anchor="end">1:GND</text>
          <polyline points="45,45 55,45 60,40 68,50 76,40 84,50 92,45 95,45" fill="none" stroke="#d97706" stroke-width="2"/>
          <text x="70" y="32" font-size="8" font-weight="bold" fill="#d97706" text-anchor="middle">RA 10k</text>
          <line x1="185" y1="75" x2="205" y2="75" stroke="#1e293b" stroke-width="2"/>
          <polyline points="205,75 210,75 214,70 220,80 226,70 232,80 236,75 242,75" fill="none" stroke="#d97706" stroke-width="1.8"/>
          <polygon points="242,67 254,75 242,83" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"/>
          <line x1="254" y1="67" x2="254" y2="83" stroke="#ef4444" stroke-width="2"/>
          <line x1="248" y1="63" x2="255" y2="55" stroke="#ef4444" stroke-width="1.5"/>
          <line x1="254" y1="63" x2="261" y2="55" stroke="#ef4444" stroke-width="1.5"/>
          <line x1="254" y1="75" x2="265" y2="75" stroke="#1e293b" stroke-width="2"/>
          <line x1="265" y1="75" x2="265" y2="130" stroke="#1e293b" stroke-width="2"/>
          <rect x="185" y="105" width="85" height="24" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <polyline points="190,122 205,122 205,112 225,112 225,122 245,122 245,112 265,112" fill="none" stroke="#03b585" stroke-width="2"/>
        `;
        break;

      case 'classABAmplifier':
        innerContent = `
          <!-- Class-AB Audio Amplifier Schematic -->
          <line x1="40" y1="25" x2="240" y2="25" stroke="#ef4444" stroke-width="2"/>
          <text x="45" y="18" font-size="9" font-weight="bold" fill="#ef4444">+15V VCC</text>
          <line x1="40" y1="135" x2="240" y2="135" stroke="#0284c7" stroke-width="2"/>
          <text x="45" y="150" font-size="9" font-weight="bold" fill="#0284c7">-15V VEE</text>
          <circle cx="130" cy="50" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <line x1="122" y1="42" x2="122" y2="58" stroke="#1e293b" stroke-width="2.5"/>
          <line x1="110" y1="50" x2="122" y2="50" stroke="#1e293b" stroke-width="2"/>
          <line x1="122" y1="45" x2="135" y2="35" stroke="#1e293b" stroke-width="2"/>
          <line x1="135" y1="35" x2="135" y2="25" stroke="#1e293b" stroke-width="2"/>
          <line x1="122" y1="55" x2="135" y2="65" stroke="#1e293b" stroke-width="2"/>
          <polygon points="132,60 137,67 129,66" fill="#1e293b"/>
          <text x="150" y="48" font-size="8.5" font-weight="bold" fill="#1e293b">Q1 NPN</text>
          <polygon points="106,62 114,62 110,70" fill="#f59e0b"/>
          <polygon points="106,78 114,78 110,86" fill="#f59e0b"/>
          <line x1="110" y1="50" x2="110" y2="98" stroke="#1e293b" stroke-width="2"/>
          <circle cx="130" cy="110" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <line x1="122" y1="102" x2="122" y2="118" stroke="#1e293b" stroke-width="2.5"/>
          <line x1="110" y1="110" x2="122" y2="110" stroke="#1e293b" stroke-width="2"/>
          <line x1="122" y1="115" x2="135" y2="125" stroke="#1e293b" stroke-width="2"/>
          <line x1="135" y1="125" x2="135" y2="135" stroke="#1e293b" stroke-width="2"/>
          <line x1="122" y1="105" x2="135" y2="95" stroke="#1e293b" stroke-width="2"/>
          <polygon points="124,103 129,97 131,104" fill="#1e293b"/>
          <text x="150" y="118" font-size="8.5" font-weight="bold" fill="#1e293b">Q2 PNP</text>
          <line x1="135" y1="65" x2="135" y2="95" stroke="#1e293b" stroke-width="2"/>
          <circle cx="135" cy="80" r="3.5" fill="#1e293b"/>
          <line x1="135" y1="80" x2="190" y2="80" stroke="#1e293b" stroke-width="2"/>
          <polygon points="190,72 202,72 214,60 214,100 202,88 190,88" fill="#03b585" stroke="#0f172a" stroke-width="1.8"/>
          <path d="M218,72 Q224,80 218,88 M222,66 Q232,80 222,94" fill="none" stroke="#03b585" stroke-width="2" stroke-linecap="round"/>
          <text x="202" y="114" font-size="8.5" font-weight="bold" fill="#03b585" text-anchor="middle">8Ω Hi-Fi</text>
        `;
        break;

      case 'binaryCounter7Seg':
        innerContent = `
          <!-- 4-Bit Counter with 7-Segment Display -->
          <rect x="25" y="40" width="85" height="80" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="67" y="65" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">74LS90</text>
          <text x="67" y="78" font-size="8" fill="#94a3b8" text-anchor="middle">4-BIT COUNTER</text>
          <text x="35" y="98" font-size="8" font-weight="bold" fill="#10b981">CLK ∿</text>
          <text x="95" y="60" font-size="8" fill="#94a3b8">QA</text>
          <text x="95" y="75" font-size="8" fill="#94a3b8">QB</text>
          <text x="95" y="90" font-size="8" fill="#94a3b8">QC</text>
          <text x="95" y="105" font-size="8" fill="#94a3b8">QD</text>
          <path d="M110,57 H155 L165,60" fill="none" stroke="#6366f1" stroke-width="2"/>
          <path d="M110,72 H155 L165,75" fill="none" stroke="#6366f1" stroke-width="2"/>
          <path d="M110,87 H155 L165,90" fill="none" stroke="#6366f1" stroke-width="2"/>
          <path d="M110,102 H155 L165,105" fill="none" stroke="#6366f1" stroke-width="2"/>
          <rect x="175" y="30" width="80" height="100" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="2.5" filter="drop-shadow(0 4px 12px rgba(16,185,129,0.25))"/>
          <rect x="195" y="42" width="40" height="7" rx="2" fill="#10b981"/>
          <rect x="190" y="47" width="7" height="30" rx="2" fill="#10b981"/>
          <rect x="233" y="47" width="7" height="30" rx="2" fill="#1e293b"/>
          <rect x="195" y="74" width="40" height="7" rx="2" fill="#10b981"/>
          <rect x="233" y="79" width="7" height="30" rx="2" fill="#10b981"/>
          <rect x="190" y="79" width="7" height="30" rx="2" fill="#1e293b"/>
          <rect x="195" y="107" width="40" height="7" rx="2" fill="#10b981"/>
          <circle cx="248" cy="111" r="3.5" fill="#10b981"/>
          <text x="215" y="125" font-size="8" font-weight="bold" fill="#10b981" text-anchor="middle">DECIMAL: 5</text>
        `;
        break;

      case 'butterworthFilter':
        innerContent = `
          <!-- Butterworth Sallen-Key Filter -->
          <polygon points="120,40 180,75 120,110" fill="#f8fafc" stroke="#03b585" stroke-width="2.5"/>
          <text x="135" y="60" font-size="14" font-weight="bold" fill="#ef4444">-</text>
          <text x="135" y="95" font-size="14" font-weight="bold" fill="#0284c7">+</text>
          <line x1="180" y1="75" x2="250" y2="75" stroke="#1e293b" stroke-width="2"/>
          <circle cx="215" cy="75" r="3.5" fill="#1e293b"/>
          <path d="M215,75 V28 H100 V55 H120" fill="none" stroke="#6366f1" stroke-width="2"/>
          <polyline points="40,90 60,90 65,85 73,95 81,85 89,95 95,90 120,90" fill="none" stroke="#d97706" stroke-width="2"/>
          <text x="75" y="78" font-size="8" font-weight="bold" fill="#d97706" text-anchor="middle">R1, R2</text>
          <rect x="25" y="110" width="85" height="36" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
          <path d="M30,122 H65 Q75,122 80,132 L95,142" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
          <text x="67" y="142" font-size="7.5" font-weight="bold" fill="#94a3b8" text-anchor="middle">fc = 1.0 kHz (-3dB)</text>
        `;
        break;

      case 'amTransceiver':
        innerContent = `
          <!-- AM Modulator & Envelope Demodulator -->
          <circle cx="75" cy="75" r="24" fill="#ffffff" stroke="#6366f1" stroke-width="2.5"/>
          <line x1="60" y1="60" x2="90" y2="90" stroke="#6366f1" stroke-width="2.5"/>
          <line x1="60" y1="90" x2="90" y2="60" stroke="#6366f1" stroke-width="2.5"/>
          <text x="75" y="42" font-size="8" font-weight="bold" fill="#6366f1" text-anchor="middle">Audio + Carrier</text>
          <line x1="99" y1="75" x2="135" y2="75" stroke="#1e293b" stroke-width="2"/>
          <polygon points="135,67 150,75 135,83" fill="#ef4444" stroke="#ef4444" stroke-width="1.5"/>
          <line x1="150" y1="67" x2="150" y2="83" stroke="#ef4444" stroke-width="2"/>
          <line x1="150" y1="75" x2="190" y2="75" stroke="#1e293b" stroke-width="2"/>
          <circle cx="190" cy="75" r="3.5" fill="#1e293b"/>
          <line x1="190" y1="75" x2="190" y2="115" stroke="#1e293b" stroke-width="2"/>
          <line x1="180" y1="115" x2="200" y2="115" stroke="#0284c7" stroke-width="2"/>
          <rect x="180" y="25" width="85" height="42" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <path d="M185,46 Q195,30 205,46 T225,46 T245,46 T260,46" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="222" y="62" font-size="7.5" font-weight="bold" fill="#03b585" text-anchor="middle">Recovered Audio</text>
        `;
        break;

      case 'opAmpAmplifier':
        innerContent = `
          <!-- Non-Inverting Op-Amp Amplifier -->
          <polygon points="110,40 175,75 110,110" fill="#ffffff" stroke="#0284c7" stroke-width="2.5"/>
          <text x="124" y="60" font-size="14" font-weight="bold" fill="#ef4444">-</text>
          <text x="124" y="98" font-size="14" font-weight="bold" fill="#0284c7">+</text>
          <circle cx="45" cy="92" r="14" fill="#eff6ff" stroke="#0284c7" stroke-width="2"/>
          <path d="M38,92 Q41,84 45,92 T52,92" fill="none" stroke="#0284c7" stroke-width="2"/>
          <line x1="59" y1="92" x2="110" y2="92" stroke="#1e293b" stroke-width="2"/>
          <text x="45" y="120" font-size="8" font-weight="bold" fill="#0284c7" text-anchor="middle">100mV AC</text>
          <line x1="175" y1="75" x2="245" y2="75" stroke="#1e293b" stroke-width="2"/>
          <circle cx="210" cy="75" r="3.5" fill="#1e293b"/>
          <path d="M210,75 V28 H95 V55 H110" fill="none" stroke="#d97706" stroke-width="2"/>
          <text x="150" y="22" font-size="8" font-weight="bold" fill="#d97706" text-anchor="middle">Rf = 100kΩ</text>
          <rect x="200" y="100" width="70" height="22" rx="4" fill="#03b585"/>
          <text x="235" y="115" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">Gain: +11x</text>
        `;
        break;

      case 'bridgeRectifier':
        innerContent = `
          <!-- Full-Wave Bridge Rectifier -->
          <polygon points="110,40 150,75 110,110 70,75" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
          <polygon points="85,60 95,50 85,45" fill="#f59e0b"/>
          <polygon points="125,50 135,60 135,45" fill="#f59e0b"/>
          <polygon points="85,90 95,100 85,105" fill="#f59e0b"/>
          <polygon points="125,100 135,90 135,105" fill="#f59e0b"/>
          <line x1="30" y1="55" x2="70" y2="75" stroke="#0284c7" stroke-width="2"/>
          <line x1="30" y1="95" x2="110" y2="110" stroke="#0284c7" stroke-width="2"/>
          <text x="35" y="45" font-size="8" font-weight="bold" fill="#0284c7">120V AC</text>
          <line x1="110" y1="40" x2="190" y2="40" stroke="#ef4444" stroke-width="2"/>
          <line x1="150" y1="75" x2="190" y2="75" stroke="#1e293b" stroke-width="2"/>
          <rect x="195" y="45" width="75" height="45" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <path d="M200,80 Q208,60 216,80 Q224,60 232,80 Q240,60 248,80 Q256,60 264,80" fill="none" stroke="#f59e0b" stroke-width="2"/>
          <text x="232" y="56" font-size="7.5" font-weight="bold" fill="#03b585" text-anchor="middle">Full-Wave DC</text>
        `;
        break;

      case 'halfAdder':
        innerContent = `
          <!-- Digital Logic: Half Adder -->
          <text x="25" y="55" font-size="10" font-weight="bold" fill="#6366f1">A: 1</text>
          <text x="25" y="105" font-size="10" font-weight="bold" fill="#6366f1">B: 1</text>
          <path d="M60,40 Q75,40 90,55 Q75,70 60,70 Q70,55 60,40" fill="#f8fafc" stroke="#0284c7" stroke-width="2"/>
          <path d="M54,40 Q64,55 54,70" fill="none" stroke="#0284c7" stroke-width="2"/>
          <line x1="90" y1="55" x2="180" y2="55" stroke="#1e293b" stroke-width="2"/>
          <text x="75" y="58" font-size="8" font-weight="bold" fill="#0284c7">XOR</text>
          <path d="M60,90 H80 A15,15 0 0,1 80,120 H60 Z" fill="#f8fafc" stroke="#03b585" stroke-width="2"/>
          <line x1="95" y1="105" x2="180" y2="105" stroke="#1e293b" stroke-width="2"/>
          <text x="72" y="108" font-size="8" font-weight="bold" fill="#03b585">AND</text>
          <rect x="185" y="42" width="80" height="24" rx="4" fill="#0284c7"/>
          <text x="225" y="58" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">Sum (S) = 0</text>
          <rect x="185" y="92" width="80" height="24" rx="4" fill="#03b585"/>
          <text x="225" y="108" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">Carry (C) = 1</text>
        `;
        break;

      case 'universalNorGates':
        innerContent = `
          <!-- Universal NOR Gates Logic Suite -->
          <text x="140" y="22" font-size="9" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="0.5px">UNIVERSAL NOR LOGIC GATES</text>
          <rect x="25" y="42" width="34" height="24" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="1.5"/>
          <rect x="28" y="45" width="28" height="18" rx="2" fill="#1e293b"/>
          <text x="42" y="58" font-size="10" font-weight="900" fill="#38bdf8" text-anchor="middle">1</text>
          <text x="42" y="38" font-size="7.5" font-weight="bold" fill="#64748b" text-anchor="middle">DG1</text>
          <line x1="59" y1="54" x2="85" y2="54" stroke="#1e293b" stroke-width="2"/>
          <circle cx="85" cy="54" r="2.5" fill="#1e293b"/>
          <line x1="85" y1="54" x2="105" y2="48" stroke="#1e293b" stroke-width="1.8"/>
          <line x1="85" y1="54" x2="105" y2="60" stroke="#1e293b" stroke-width="1.8"/>
          <path d="M105,42 Q115,42 125,54 Q115,66 105,66 Q108,54 105,42 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
          <circle cx="128" cy="54" r="2.5" stroke="#1e293b" stroke-width="1.4" fill="#ffffff"/>
          <text x="116" y="56" font-size="6.5" font-weight="bold" fill="#0284c7" text-anchor="middle">NOR</text>
          <line x1="131" y1="54" x2="175" y2="54" stroke="#1e293b" stroke-width="2"/>
          <polygon points="175,47 187,54 175,61" fill="#ef4444" stroke="#ef4444" stroke-width="1.2"/>
          <line x1="187" y1="47" x2="187" y2="61" stroke="#ef4444" stroke-width="2"/>
          <text x="181" y="42" font-size="7.5" font-weight="bold" fill="#ef4444" text-anchor="middle">LED1</text>
          <line x1="187" y1="54" x2="205" y2="54" stroke="#1e293b" stroke-width="2"/>
          <line x1="205" y1="54" x2="205" y2="65" stroke="#1e293b" stroke-width="2"/>
          <line x1="198" y1="65" x2="212" y2="65" stroke="#1e293b" stroke-width="2"/>
          <rect x="25" y="85" width="115" height="18" rx="3" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
          <text x="82" y="97" font-size="7" font-weight="bold" fill="#1e40af" text-anchor="middle">NOT / OR / AND / XOR</text>
          <rect x="150" y="85" width="115" height="60" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
          <text x="207" y="100" font-size="8" font-weight="bold" fill="#38bdf8" text-anchor="middle">4-NOR XOR Equivalent</text>
          <path d="M165,115 Q172,115 180,123 Q172,131 165,131 Q167,123 165,115 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2"/>
          <circle cx="182" cy="123" r="1.8" stroke="#38bdf8" stroke-width="1" fill="#0f172a"/>
          <line x1="184" y1="123" x2="200" y2="123" stroke="#38bdf8" stroke-width="1.5"/>
          <circle cx="215" cy="123" r="8" fill="#10b981" filter="drop-shadow(0 0 6px rgba(16,185,129,0.8))"/>
          <text x="215" y="126" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">Y</text>
          <text x="245" y="126" font-size="8" font-weight="bold" fill="#10b981">A ⊕ B</text>
        `;
        break;

      case 'rcFilter':
        innerContent = `
          <!-- RC Low-Pass Filter -->
          <circle cx="45" cy="80" r="16" fill="#eff6ff" stroke="#0284c7" stroke-width="2"/>
          <path d="M38,80 Q41,72 45,80 T52,80" fill="none" stroke="#0284c7" stroke-width="2"/>
          <line x1="61" y1="80" x2="95" y2="80" stroke="#1e293b" stroke-width="2"/>
          <polyline points="95,80 100,80 105,73 115,87 125,73 135,87 140,80 145,80" fill="none" stroke="#d97706" stroke-width="2.5"/>
          <text x="120" y="65" font-size="9" font-weight="bold" fill="#d97706" text-anchor="middle">R = 1.0 kΩ</text>
          <line x1="145" y1="80" x2="185" y2="80" stroke="#1e293b" stroke-width="2"/>
          <circle cx="185" cy="80" r="3.5" fill="#1e293b"/>
          <line x1="185" y1="80" x2="185" y2="105" stroke="#1e293b" stroke-width="2"/>
          <line x1="175" y1="105" x2="195" y2="105" stroke="#03b585" stroke-width="2.5"/>
          <line x1="175" y1="112" x2="195" y2="112" stroke="#03b585" stroke-width="2.5"/>
          <text x="215" y="112" font-size="8" font-weight="bold" fill="#03b585">C = 1.0µF</text>
          <line x1="185" y1="80" x2="225" y2="80" stroke="#1e293b" stroke-width="2"/>
          <circle cx="225" cy="80" r="5" fill="#ef4444"/>
          <rect x="200" y="35" width="70" height="22" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.2"/>
          <text x="235" y="49" font-size="8" font-weight="bold" fill="#38bdf8" text-anchor="middle">τ = 1.00 ms</text>
        `;
        break;

      case 'bjtDifferentialPair':
        innerContent = `
          <!-- BJT Differential Pair Amplifier -->
          <circle cx="85" cy="70" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <circle cx="175" cy="70" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <line x1="85" y1="56" x2="85" y2="30" stroke="#1e293b" stroke-width="2"/>
          <line x1="175" y1="56" x2="175" y2="30" stroke="#1e293b" stroke-width="2"/>
          <line x1="85" y1="84" x2="130" y2="110" stroke="#1e293b" stroke-width="2"/>
          <line x1="175" y1="84" x2="130" y2="110" stroke="#1e293b" stroke-width="2"/>
          <circle cx="130" cy="110" r="3.5" fill="#1e293b"/>
          <circle cx="130" cy="130" r="10" fill="#f8fafc" stroke="#6366f1" stroke-width="1.8"/>
          <text x="130" y="133" font-size="8" font-weight="bold" fill="#6366f1" text-anchor="middle">I_EE</text>
          <text x="85" y="22" font-size="8" font-weight="bold" fill="#ef4444" text-anchor="middle">V_out1</text>
          <text x="175" y="22" font-size="8" font-weight="bold" fill="#ef4444" text-anchor="middle">V_out2</text>
        `;
        break;

      case 'rcLadderStress':
        innerContent = `
          <!-- High-Density R-C Ladder Stress Benchmark -->
          <line x1="30" y1="50" x2="250" y2="50" stroke="#1e293b" stroke-width="2"/>
          <line x1="30" y1="120" x2="250" y2="120" stroke="#1e293b" stroke-width="2"/>
          <circle cx="70" cy="50" r="3" fill="#1e293b"/>
          <line x1="70" y1="50" x2="70" y2="120" stroke="#03b585" stroke-width="2" stroke-dasharray="3 3"/>
          <circle cx="110" cy="50" r="3" fill="#1e293b"/>
          <line x1="110" y1="50" x2="110" y2="120" stroke="#03b585" stroke-width="2" stroke-dasharray="3 3"/>
          <circle cx="150" cy="50" r="3" fill="#1e293b"/>
          <line x1="150" y1="50" x2="150" y2="120" stroke="#03b585" stroke-width="2" stroke-dasharray="3 3"/>
          <circle cx="190" cy="50" r="3" fill="#1e293b"/>
          <line x1="190" y1="50" x2="190" y2="120" stroke="#03b585" stroke-width="2" stroke-dasharray="3 3"/>
          <circle cx="230" cy="50" r="3" fill="#1e293b"/>
          <line x1="230" y1="50" x2="230" y2="120" stroke="#03b585" stroke-width="2" stroke-dasharray="3 3"/>
          <rect x="75" y="75" width="130" height="26" rx="4" fill="#0f172a" stroke="#6366f1" stroke-width="1.5"/>
          <text x="140" y="91" font-size="8.5" font-weight="bold" fill="#38bdf8" text-anchor="middle">53 Comps / 77 Wires</text>
        `;
        break;

      case 'rcPhaseShiftOscillator':
        innerContent = `
          <!-- Op-Amp RC Phase Shift Oscillator -->
          <polygon points="120,40 180,75 120,110" fill="#ffffff" stroke="#0284c7" stroke-width="2.2"/>
          <text x="133" y="60" font-size="13" font-weight="bold" fill="#ef4444">-</text>
          <text x="133" y="96" font-size="13" font-weight="bold" fill="#0284c7">+</text>
          <line x1="180" y1="75" x2="250" y2="75" stroke="#1e293b" stroke-width="2"/>
          <circle cx="215" cy="75" r="3.5" fill="#1e293b"/>
          <path d="M215,75 V25 H105 V55 H120" fill="none" stroke="#d97706" stroke-width="2"/>
          <text x="160" y="20" font-size="8" font-weight="bold" fill="#d97706" text-anchor="middle">Rf = 1.0 MΩ</text>
          <!-- 3-Stage High-Pass RC Ladder -->
          <line x1="250" y1="75" x2="250" y2="125" stroke="#1e293b" stroke-width="2"/>
          <line x1="250" y1="125" x2="35" y2="125" stroke="#1e293b" stroke-width="2"/>
          <line x1="35" y1="125" x2="35" y2="55" stroke="#1e293b" stroke-width="2"/>
          <line x1="35" y1="55" x2="105" y2="55" stroke="#1e293b" stroke-width="2"/>
          <text x="65" y="48" font-size="7.5" font-weight="bold" fill="#03b585">3x RC 60°</text>
          <rect x="180" y="95" width="85" height="38" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <path d="M185,114 Q192,100 200,114 T215,114 T230,114 T245,114 T260,114" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
          <text x="222" y="128" font-size="7.5" font-weight="bold" fill="#03b585" text-anchor="middle">200 Hz Sine Wave</text>
        `;
        break;

      case 'sampleAndHoldCircuit':
        innerContent = `
          <!-- Sample & Hold Amplifier Circuit -->
          <circle cx="45" cy="65" r="14" fill="#eff6ff" stroke="#007aff" stroke-width="2"/>
          <path d="M38,65 Q41,57 45,65 T52,65" fill="none" stroke="#007aff" stroke-width="2"/>
          <text x="45" y="92" font-size="7.5" font-weight="bold" fill="#007aff" text-anchor="middle">1 kHz Sine</text>
          <line x1="59" y1="65" x2="100" y2="65" stroke="#1e293b" stroke-width="2"/>
          <!-- LF398 IC Box -->
          <rect x="100" y="45" width="65" height="40" rx="4" fill="#1e293b" stroke="#0284c7" stroke-width="2"/>
          <text x="132" y="65" font-size="8.5" font-weight="900" fill="#38bdf8" text-anchor="middle">LF398</text>
          <text x="132" y="77" font-size="7" font-weight="bold" fill="#94a3b8" text-anchor="middle">S&amp;H IC</text>
          <line x1="132" y1="20" x2="132" y2="45" stroke="#ff9500" stroke-width="2"/>
          <text x="132" y="15" font-size="7.5" font-weight="bold" fill="#ff9500" text-anchor="middle">10 kHz CLK</text>
          <line x1="165" y1="65" x2="195" y2="65" stroke="#1e293b" stroke-width="2"/>
          <circle cx="195" cy="65" r="3.5" fill="#1e293b"/>
          <line x1="195" y1="65" x2="195" y2="95" stroke="#1e293b" stroke-width="2"/>
          <line x1="185" y1="95" x2="205" y2="95" stroke="#0284c7" stroke-width="2.5"/>
          <line x1="185" y1="102" x2="205" y2="102" stroke="#0284c7" stroke-width="2.5"/>
          <text x="225" y="102" font-size="7.5" font-weight="bold" fill="#0284c7">CH 10nF</text>
          <!-- Staircase Output Waveform -->
          <rect x="180" y="25" width="90" height="48" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <polyline points="185,55 195,55 195,45 208,45 208,38 222,38 222,43 238,43 238,52 252,52 252,60 265,60" fill="none" stroke="#03b585" stroke-width="2"/>
          <text x="225" y="67" font-size="7.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Staircase Output</text>
        `;
        break;

      case 'askModulationDemodulation':
        innerContent = `
          <!-- ASK Modulation & Demodulation -->
          <rect x="25" y="30" width="60" height="30" rx="4" fill="#eff6ff" stroke="#6366f1" stroke-width="1.8"/>
          <text x="55" y="48" font-size="8" font-weight="bold" fill="#6366f1" text-anchor="middle">Bitstream</text>
          <line x1="85" y1="45" x2="115" y2="45" stroke="#1e293b" stroke-width="2"/>
          <circle cx="130" cy="45" r="15" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
          <text x="130" y="48" font-size="8" font-weight="bold" fill="#0284c7" text-anchor="middle">MOD</text>
          <rect x="160" y="25" width="105" height="40" rx="4" fill="#0f172a" stroke="#03b585" stroke-width="1.5"/>
          <path d="M165,45 Q170,35 175,45 T185,45 H205 Q210,35 215,45 T225,45 Q230,35 235,45 T245,45 H260" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
          <rect x="90" y="95" width="100" height="35" rx="4" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
          <text x="140" y="116" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Envelope Demodulator</text>
        `;
        break;

      default:
        innerContent = `
          <!-- Default Electronic Schematic -->
          <rect x="50" y="45" width="80" height="70" rx="6" fill="#ffffff" stroke="#03b585" stroke-width="2"/>
          <polyline points="70,80 80,80 85,72 95,88 105,72 110,80 120,80" fill="none" stroke="#d97706" stroke-width="2"/>
          <line x1="130" y1="80" x2="180" y2="80" stroke="#1e293b" stroke-width="2"/>
          <polygon points="180,65 210,80 180,95" fill="#f8fafc" stroke="#0284c7" stroke-width="2"/>
          <circle cx="210" cy="80" r="4" fill="#ef4444"/>
        `;
        break;
    }

    return `
      <div class="card-thumbnail">
        ${badgeHtml}
        <svg viewBox="0 0 280 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          ${gridDef}
          ${innerContent}
        </svg>
      </div>
    `;
  }

  // --- Discover Page Population ---
  initDiscoverPage() {
    const grid = document.getElementById('discoverCardsGrid');
    if (!grid) return;

    const circuits = Object.entries(CircuitLibrary).map(([key, data]) => ({ key, ...data }));

    const renderCards = (filter = 'all', query = '') => {
      grid.innerHTML = '';
      const filtered = circuits.filter(c => {
        const matchesQuery = !query || c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.author.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' ||
          (filter === 'analog' && (c.id.includes('opamp') || c.id.includes('timer') || c.id.includes('diff') || c.id.includes('audio') || c.id.includes('transceiver'))) ||
          (filter === 'digital' && (c.id.includes('adder') || c.id.includes('counter') || c.id.includes('ask') || c.id.includes('nor') || c.id.includes('gate') || c.id.includes('logic'))) ||
          (filter === 'power' && (c.id.includes('buck') || c.id.includes('bridge') || c.id.includes('boost'))) ||
          (filter === 'filters' && c.id.includes('filter'));
        return matchesQuery && matchesFilter;
      });

      filtered.forEach(c => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
          ${this.renderCircuitThumbnailSvg(c.key, 'Public')}
          <div class="card-body">
            <div class="card-author-row">
              <div class="card-avatar">${c.author.substr(0, 2).toUpperCase()}</div>
              <div class="card-author-info">
                <div class="card-author-name">${c.author}</div>
                <div class="card-author-date">Verified Circuit</div>
              </div>
            </div>
            <h3 class="card-title">${c.name}</h3>
            <p class="card-desc">${c.description}</p>
            <div class="card-stats">
              <span class="card-stat-item">★ ${c.stats.stars}</span>
              <span class="card-stat-item">⎘ ${c.stats.copies}</span>
              <span class="card-stat-item">👁 ${c.stats.views.toLocaleString()}</span>
            </div>
            <button class="btn btn-primary card-action-btn" data-key="${c.key}">⚡ Open in Simulator</button>
          </div>
        `;

        cardEl.querySelector('button').addEventListener('click', () => {
          this.loadCircuitPreset(c.key);
          window.location.hash = '#/create';
        });

        grid.appendChild(cardEl);
      });
    };

    renderCards();

    const searchInput = document.getElementById('discoverSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeTab = document.querySelector('.filter-tab.active')?.dataset.filter || 'all';
        renderCards(activeTab, e.target.value.toLowerCase());
      });
    }

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        renderCards(tab.dataset.filter, query);
      });
    });

    document.querySelectorAll('.btn-open-circuit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const circuitKey = e.target.dataset.circuit;
        this.loadCircuitPreset(circuitKey);
        window.location.hash = '#/create';
      });
    });
  }

  // --- Modals & Exports ---
  initModals() {
    const openModal = (id) => document.getElementById(id)?.classList.add('active');
    const closeModal = (id) => document.getElementById(id)?.classList.remove('active');

    document.getElementById('btnOpenLogin')?.addEventListener('click', () => openModal('loginModal'));
    document.getElementById('btnOpenSignup')?.addEventListener('click', () => openModal('signupModal'));
    document.getElementById('nav-shortcuts')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('shortcutsModal');
    });

    document.getElementById('btnExportMenu')?.addEventListener('click', () => openModal('exportModal'));

    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || e.target.classList.contains('modal-close')) {
          el.closest('.modal-overlay')?.classList.remove('active');
        }
      });
    });

    // Native JSON Project Import
    document.getElementById('btnImportJSON')?.addEventListener('click', () => {
      document.getElementById('fileInputJSON')?.click();
    });

    document.getElementById('fileInputJSON')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.components && Array.isArray(data.components)) {
            this.canvas.saveState();
            this.canvas.components = data.components;
            this.canvas.wires = data.wires || [];
            if (data.name) {
              const nameInput = document.getElementById('circuitNameInput');
              if (nameInput) nameInput.value = data.name;
              document.title = `${data.name} - Switcha`;
            }
            this.engine.reset();
            this.engine.setCircuit(this.canvas.components, this.canvas.wires);
            this.canvas.fitToScreen();
            this.canvas.render();
            this.grapher.render();
            closeModal('exportModal');
            this.showToast(`📂 Imported "${data.name || 'Circuit'}"`, 'success');
          } else {
            alert('Invalid circuit file format: missing components array.');
          }
        } catch (err) {
          alert('Failed to parse circuit JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // Native JSON Project Export
    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
      const data = {
        name: document.getElementById('circuitNameInput').value,
        components: this.canvas.components,
        wires: this.canvas.wires
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, '_').toLowerCase()}.switcha.json`;
      a.click();
      URL.revokeObjectURL(url);
      closeModal('exportModal');
      this.showToast('📄 Circuit JSON exported', 'info');
    });

    // Schematic PNG Canvas Export
    document.getElementById('btnExportSchematicPNG')?.addEventListener('click', () => {
      const dataUrl = this.canvas.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `switcha_schematic_${Date.now()}.png`;
      a.click();
      closeModal('exportModal');
      this.showToast('🖼️ Schematic image downloaded', 'info');
    });

    // CSV Waveform Export
    document.getElementById('btnExportCSVModal')?.addEventListener('click', () => {
      this.grapher.exportCSV();
      closeModal('exportModal');
      this.showToast('📊 CSV waveform exported', 'info');
    });
  }

  // --- Firebase Authentication & Cloud Sync ---
  initFirebaseAuth() {
    const guestControls = document.getElementById('authGuestControls');
    const userControls = document.getElementById('authUserControls');
    const userDisplayName = document.getElementById('userDisplayName');
    const loginErrorAlert = document.getElementById('loginErrorAlert');
    const signupErrorAlert = document.getElementById('signupErrorAlert');

    firebaseService.onAuthStateChange(async (user) => {
      if (user) {
        if (guestControls) guestControls.style.display = 'none';
        if (userControls) userControls.style.display = 'inline-flex';
        if (userDisplayName) {
          userDisplayName.textContent = user.displayName || user.email.split('@')[0];
          userDisplayName.parentElement.title = `Logged in as ${user.email} (Firebase Cloud Synced)`;
        }

        // Merge and restore circuits from cloud
        try {
          const cloudCircuits = await firebaseService.loadUserCircuits();
          if (cloudCircuits && cloudCircuits.length > 0) {
            const localCircuits = this.getMyCircuits();
            const merged = [...cloudCircuits];
            localCircuits.forEach(lc => {
              if (!merged.some(mc => mc.id === lc.id)) {
                merged.push(lc);
                firebaseService.saveCircuit(lc);
              }
            });
            this.saveMyCircuits(merged);
            this.renderMyCircuits();
          }
        } catch (_) {}
      } else {
        if (guestControls) guestControls.style.display = 'inline-flex';
        if (userControls) userControls.style.display = 'none';
      }
    });

    // Login Form Submit (Firebase Auth)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const btnSubmit = document.getElementById('btnLoginSubmit');
        if (loginErrorAlert) loginErrorAlert.style.display = 'none';

        if (!email || !password) return;

        try {
          if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Logging in...'; }
          const user = await firebaseService.signIn(email, password);
          document.getElementById('loginModal')?.classList.remove('active');
          loginForm.reset();
          this.showToast(`👋 Welcome back, ${user.displayName || user.email}!`, 'success');
        } catch (err) {
          if (loginErrorAlert) {
            loginErrorAlert.textContent = err.message.replace('Firebase: ', '');
            loginErrorAlert.style.display = 'block';
          } else {
            alert(err.message);
          }
        } finally {
          if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Log in'; }
        }
      });
    }

    // Sign Up Form Submit (Firebase Auth)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName')?.value.trim();
        const email = document.getElementById('signupEmail')?.value.trim();
        const password = document.getElementById('signupPassword')?.value;
        const btnSubmit = document.getElementById('btnSignupSubmit');
        if (signupErrorAlert) signupErrorAlert.style.display = 'none';

        if (!email || !password) return;

        try {
          if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Creating Account...'; }
          const user = await firebaseService.signUp(email, password, name);
          document.getElementById('signupModal')?.classList.remove('active');
          signupForm.reset();
          this.showToast(`🎉 Account created! Welcome, ${user.displayName || user.email}!`, 'success');
        } catch (err) {
          if (signupErrorAlert) {
            signupErrorAlert.textContent = err.message.replace('Firebase: ', '');
            signupErrorAlert.style.display = 'block';
          } else {
            alert(err.message);
          }
        } finally {
          if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Create Account'; }
        }
      });
    }

    // Logout Button
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
      await firebaseService.signOut();
      this.showToast('👋 Logged out of ElectroSim', 'info');
    });
  }
}

// Start Application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SwitchaApp();
});
