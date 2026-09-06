/**
 * Multisim Live Main Application Controller
 * Routing, Component Palette, Simulation Loop, Properties Inspector,
 * SPICE Netlist Exporter, JSON Project Persistence, and UI Bindings.
 */

import { ComponentTypes, ComponentDefinitions, ComponentCategory, formatValueWithPrefix, parseEngineeringValue } from './engine/components.js';
import { CircuitEngine } from './engine/circuit-engine.js';
import { SchematicCanvas } from './editor/schematic-canvas.js';
import { CircuitGrapher } from './editor/grapher.js';
import { CircuitLibrary } from './editor/circuit-library.js';

class MultisimApp {
  constructor() {
    this.engine = new CircuitEngine();
    this.canvas = null;
    this.grapher = null;
    this.isSimRunning = false;
    this.simAnimFrame = null;
    this.lastTimestamp = 0;

    this.currentView = 'home';
    this.currentMode = 'split'; // 'schematic', 'split', 'grapher'

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

    // 2. Build Component Palette Sidebar
    this.buildPalette();

    // 3. Setup UI Event Listeners & Router
    this.initRouter();
    this.initToolbarControls();
    this.initModals();
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
      if (hash.startsWith('#/create')) {
        this.switchView('studio');
      } else if (hash.startsWith('#/discover')) {
        this.switchView('discover');
      } else if (hash.startsWith('#/features')) {
        this.switchView('features');
      } else if (hash.startsWith('#/pricing')) {
        this.switchView('pricing');
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
    if (viewName === 'features') document.getElementById('nav-features')?.classList.add('active');
    if (viewName === 'pricing') document.getElementById('nav-pricing')?.classList.add('active');
    if (viewName === 'discover') document.getElementById('nav-circuits')?.classList.add('active');

    if (viewName === 'studio') {
      setTimeout(() => {
        this.canvas.resize();
        this.grapher.resize();
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
        itemEl.innerHTML = `
          <div class="palette-item-icon">${this.getComponentMiniIcon(def.type)}</div>
          <div class="palette-item-name">${def.name.split('(')[0].trim()}</div>
        `;

        itemEl.addEventListener('click', () => {
          const centerWorld = this.canvas.screenToWorld(
            this.canvas.displayWidth / 2 + (Math.random() * 40 - 20),
            this.canvas.displayHeight / 2 + (Math.random() * 40 - 20)
          );
          this.canvas.addComponent(def.type, centerWorld.x, centerWorld.y);
          this.switchView('studio');
          if (window.location.hash !== '#/create') {
            window.location.hash = '#/create';
          }
        });

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

    // Palette Search Filter
    const searchInput = document.getElementById('paletteSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.palette-item').forEach(item => {
          const name = item.textContent.toLowerCase();
          item.style.display = name.includes(query) ? 'flex' : 'none';
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
      case ComponentTypes.CLOCK_VOLTAGE:
      case ComponentTypes.PULSE_VOLTAGE:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#03b585" stroke-width="2" fill="none"/><path d="M7,14 L7,9 L12,9 L12,15 L17,15 L17,10" stroke="#0284c7" stroke-width="1.5" fill="none"/></svg>`;
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
      case ComponentTypes.OPTOCOUPLER:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#2b2d2f" stroke-width="1.5" fill="none"/><polygon points="6,9 10,12 6,15" fill="#ff3b30"/><line x1="15" y1="7" x2="15" y2="17" stroke="#2b2d2f" stroke-width="1.5"/></svg>`;

      // 6. Analog & Linear ICs
      case ComponentTypes.OPAMP:
        return `<svg viewBox="0 0 24 24"><polygon points="4,3 21,12 4,21" fill="none" stroke="#2b2d2f" stroke-width="1.8"/><line x1="12" y1="1" x2="12" y2="7.5" stroke="#64748b" stroke-width="1.2"/><line x1="12" y1="23" x2="12" y2="16.5" stroke="#64748b" stroke-width="1.2"/><text x="7" y="9" font-size="7" fill="#0f172a" font-weight="bold">-</text><text x="7" y="18" font-size="7" fill="#0f172a" font-weight="bold">+</text></svg>`;
      case ComponentTypes.COMPARATOR:
        return `<svg viewBox="0 0 24 24"><polygon points="4,4 20,12 4,20" fill="none" stroke="#0284c7" stroke-width="1.8"/><text x="7" y="10" font-size="6" fill="#0284c7" font-weight="bold">-</text><text x="7" y="17" font-size="6" fill="#0284c7" font-weight="bold">+</text></svg>`;
      case ComponentTypes.TIMER555:
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
      case ComponentTypes.IC_7408:
        return `<svg viewBox="0 0 24 24"><path d="M4,5 L11,5 C16,5 19,8 19,12 C19,16 16,19 11,19 L4,19 Z" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.NAND_GATE:
      case ComponentTypes.IC_7400:
        return `<svg viewBox="0 0 24 24"><path d="M3,5 L9,5 C14,5 17,8 17,12 C17,16 14,19 9,19 L3,19 Z" stroke="#2b2d2f" stroke-width="1.6" fill="none"/><circle cx="19" cy="12" r="2" stroke="#2b2d2f" stroke-width="1.4" fill="none"/></svg>`;
      case ComponentTypes.OR_GATE:
      case ComponentTypes.IC_7432:
        return `<svg viewBox="0 0 24 24"><path d="M3,5 Q10,5 20,12 Q10,19 3,19 Q7,12 3,5 Z" stroke="#2b2d2f" stroke-width="1.8" fill="none"/></svg>`;
      case ComponentTypes.NOR_GATE:
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
      case ComponentTypes.D_FLIP_FLOP:
      case ComponentTypes.JK_FLIP_FLOP:
      case ComponentTypes.SR_LATCH:
      case ComponentTypes.T_FLIP_FLOP:
      case ComponentTypes.DECODER_BCD_7SEG:
      case ComponentTypes.BINARY_COUNTER_4BIT:
      case ComponentTypes.SHIFT_REGISTER_8BIT:
      case ComponentTypes.HALF_ADDER:
      case ComponentTypes.FULL_ADDER:
      case ComponentTypes.ALU_4BIT:
        return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#f8fafc" stroke="#2b2d2f" stroke-width="1.6"/><text x="12" y="14" font-size="6" text-anchor="middle" font-weight="bold" fill="#0284c7">LOGIC</text></svg>`;

      // 10. Switches & Relays
      case ComponentTypes.SPST_SWITCH:
      case ComponentTypes.SPDT_SWITCH:
      case ComponentTypes.PUSH_BUTTON:
      case ComponentTypes.RELAY_SPDT:
        return `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="#2b2d2f"/><circle cx="19" cy="12" r="2" fill="#2b2d2f"/><line x1="5" y1="12" x2="16" y2="6" stroke="#2b2d2f" stroke-width="2"/></svg>`;

      // 11. Electromechanical & Motors
      case ComponentTypes.DC_MOTOR:
      case ComponentTypes.STEPPER_MOTOR:
      case ComponentTypes.BUZZER:
      case ComponentTypes.SPEAKER:
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="#2b2d2f" stroke-width="1.8" fill="none"/><text x="12" y="15" font-size="8" text-anchor="middle" font-weight="bold" fill="#e11d48">M</text></svg>`;

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
      this.isSimRunning = !this.isSimRunning;
      if (this.isSimRunning) {
        btnSimToggle.classList.add('running');
        simIcon.textContent = '⏸';
        simText.textContent = 'Pause Simulation';
        this.startSimulationLoop();
      } else {
        btnSimToggle.classList.remove('running');
        simIcon.textContent = '▶';
        simText.textContent = 'Run Simulation';
        this.stopSimulationLoop();
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

    document.getElementById('btnUndo').addEventListener('click', () => this.canvas.undo());
    document.getElementById('btnRedo').addEventListener('click', () => this.canvas.redo());

    document.getElementById('btnRotate').addEventListener('click', () => this.canvas.rotateSelected(90));
    document.getElementById('btnFlipH')?.addEventListener('click', () => this.canvas.flipSelected('x'));
    document.getElementById('btnFlipV')?.addEventListener('click', () => this.canvas.flipSelected('y'));
    document.getElementById('btnDelete').addEventListener('click', () => this.canvas.removeSelected());
    document.getElementById('btnFitScreen').addEventListener('click', () => this.canvas.fitToScreen());

    document.getElementById('btnZoomIn').addEventListener('click', () => this.canvas.zoomIn());
    document.getElementById('btnZoomOut').addEventListener('click', () => this.canvas.zoomOut());
    document.getElementById('btnZoomReset').addEventListener('click', () => this.canvas.resetZoom());

    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setViewMode(btn.dataset.mode);
      });
    });

    document.getElementById('btnToggleCursors').addEventListener('click', () => this.grapher.toggleCursors());
    document.getElementById('timeScaleSelect').addEventListener('change', (e) => this.grapher.setTimeScale(parseFloat(e.target.value)));
    document.getElementById('voltScaleSelect')?.addEventListener('change', (e) => this.grapher.setVoltScale(e.target.value));
    document.getElementById('btnGraphTheme')?.addEventListener('click', (e) => {
      const newTheme = this.grapher.toggleTheme();
      e.target.textContent = `Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`;
    });
    document.getElementById('btnExportCSV').addEventListener('click', () => this.grapher.exportCSV());
    document.getElementById('btnExportPlotPNG').addEventListener('click', () => this.grapher.exportPNG());

    document.getElementById('circuitNameInput').addEventListener('change', (e) => {
      document.title = `${e.target.value} - Multisim Live`;
    });
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

      const stepsPerFrame = 20; // 20 steps * 50us = 1ms simulated per animation frame
      for (let i = 0; i < stepsPerFrame; i++) {
        this.engine.step(5e-5);
      }

      this.updateSimTimeDisplay();
      this.canvas.render();
      this.grapher.render();

      this.simAnimFrame = requestAnimationFrame(loop);
    };

    this.simAnimFrame = requestAnimationFrame(loop);
  }

  stopSimulationLoop() {
    if (this.simAnimFrame) {
      cancelAnimationFrame(this.simAnimFrame);
      this.simAnimFrame = null;
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

    if (!selection || selection.type !== 'component' || !selection.item) {
      container.innerHTML = `<p class="no-selection-msg">Select a component on the schematic to inspect and edit its parameters.</p>`;
      return;
    }

    const comp = selection.item;
    const def = ComponentDefinitions[comp.type];
    if (!def) return;

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

    html += `
      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
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

    const nameInput = document.getElementById('circuitNameInput');
    if (nameInput) nameInput.value = preset.name;
    const select = document.getElementById('circuitPresetSelect');
    if (select) select.value = presetKey;
    document.title = `${preset.name} - Multisim Live`;

    setTimeout(() => {
      this.canvas.resize();
      this.canvas.fitToScreen();
      this.grapher.resize();
      this.canvas.render();
      this.grapher.render();
    }, 50);
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
          (filter === 'analog' && (c.id.includes('opamp') || c.id.includes('timer') || c.id.includes('diff'))) ||
          (filter === 'digital' && (c.id.includes('adder') || c.id.includes('counter'))) ||
          (filter === 'power' && (c.id.includes('buck') || c.id.includes('bridge') || c.id.includes('boost'))) ||
          (filter === 'filters' && c.id.includes('filter'));
        return matchesQuery && matchesFilter;
      });

      filtered.forEach(c => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
          <div class="card-thumbnail">
            <span class="card-badge">Public</span>
            <svg viewBox="0 0 100 60" width="140" height="84">
              <rect x="20" y="15" width="60" height="30" fill="#f8fafc" stroke="#57b685" stroke-width="2" rx="4"/>
              <text x="50" y="34" font-size="8" text-anchor="middle" fill="#1e293b" font-weight="bold">${c.name.split('(')[0].trim()}</text>
            </svg>
          </div>
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
              document.title = `${data.name} - Multisim Live`;
            }
            this.engine.reset();
            this.engine.setCircuit(this.canvas.components, this.canvas.wires);
            this.canvas.fitToScreen();
            this.canvas.render();
            this.grapher.render();
            closeModal('exportModal');
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
      a.download = `${data.name.replace(/\s+/g, '_').toLowerCase()}.multisim.json`;
      a.click();
      URL.revokeObjectURL(url);
      closeModal('exportModal');
    });

    // Schematic PNG Canvas Export
    document.getElementById('btnExportSchematicPNG')?.addEventListener('click', () => {
      const dataUrl = this.canvas.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `multisim_schematic_${Date.now()}.png`;
      a.click();
      closeModal('exportModal');
    });

    // CSV Waveform Export
    document.getElementById('btnExportCSVModal')?.addEventListener('click', () => {
      this.grapher.exportCSV();
      closeModal('exportModal');
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Logged in successfully!');
      closeModal('loginModal');
    });

    document.getElementById('signupForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Welcome to Multisim Live! Your free account is created.');
      closeModal('signupModal');
    });
  }
}

// Start Application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MultisimApp();
});
