/**
 * High-Performance Interactive Schematic Canvas
 * Professional IEEE/ANSI vector symbols, centroid group rotation,
 * normalized marquee multi-selection, DPR scaling, subpixel canvas clearing,
 * and robust wiring hit-testing.
 */

import { ComponentTypes, ComponentDefinitions, formatValueWithPrefix } from '../engine/components.js';

export const CanvasState = {
  IDLE: 'IDLE',
  SELECTING: 'SELECTING',
  DRAGGING_COMPONENT: 'DRAGGING_COMPONENT',
  PANNING_CANVAS: 'PANNING_CANVAS',
  WIRING: 'WIRING',
  PLACING_COMPONENT: 'PLACING_COMPONENT',
  PINCHING: 'PINCHING'
};

export class SchematicCanvas {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.engine = engine;

    // Viewport & Transforms
    this.zoom = 1.0;
    this.minZoom = 0.25;
    this.maxZoom = 4.0;
    this.panX = 120;
    this.panY = 120;
    this.gridSize = 20;

    // Schematic Entities
    this.components = [];
    this.wires = [];

    // Selection State
    this.selectedComponent = null;
    this.selectedComponents = new Set();
    this.selectedWire = null;
    this.hoveredPin = null;
    this.hoveredComponent = null;
    this.showNodeNumbers = true;

    // Interaction Modes & State Machine
    this.state = CanvasState.IDLE;
    this.mode = 'SELECT';
    this.placementComponentType = null;

    // Wiring State
    this.wiringStartPin = null;
    this.wiringCurrentPos = null;

    // Dragging & Panning & Multi-touch Gestures (Bare Hands)
    this.drag = {
      active: false,
      pointerId: null,
      startWorld: null,
      initialPositions: new Map(),
      moved: false
    };
    this.dragStartScreen = { x: 0, y: 0 };
    this.isPanning = false;
    this.isPinching = false;
    this.isBoxSelecting = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.boxSelectStart = { x: 0, y: 0 };
    this.boxSelectCurrent = { x: 0, y: 0 };
    this.activePointers = new Map();
    this.initialPinchDist = 0;
    this.initialPinchZoom = 1.0;
    this.initialPinchPan = { x: 0, y: 0 };
    this.hoveredTargetPin = null;
    this.lastTapTime = 0;
    this.lastTapPos = { x: 0, y: 0 };

    // Clipboard & Monotonic Counter
    this.clipboard = null;
    this.idCounter = 1000;

    // Undo / Redo Stacks
    this.undoStack = [];
    this.redoStack = [];

    // Callbacks
    this.onSelectionChange = null;
    this.onCircuitModified = null;

    this.initEvents();
    this.resize();
  }

  generateUniqueId(prefix) {
    this.idCounter++;
    return `${prefix}_${Date.now().toString(36)}_${this.idCounter}`;
  }

  resize() {
    if (!this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.displayWidth = this.displayWidth || 800;
      this.displayHeight = this.displayHeight || 600;
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // Single-Source Pointer Events on Canvas (Desktop Mouse, Touchscreen & Stylus)
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerCancel(e));

    window.addEventListener('blur', () => {
      this.activePointers.clear();
      this.drag.active = false;
      this.drag.pointerId = null;
      this.drag.startWorld = null;
      this.drag.initialPositions.clear();
      this.drag.moved = false;
      this.isPanning = false;
      this.isPinching = false;
      this.isBoxSelecting = false;
      this.state = CanvasState.IDLE;
    });

    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.cancelAction();
    });

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  // --- Coordinate Transformations ---
  screenToWorld(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;
    return {
      x: (mouseX - this.panX) / this.zoom,
      y: (mouseY - this.panY) / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.panX,
      y: worldY * this.zoom + this.panY
    };
  }

  snapToGrid(val) {
    return Math.round(val / this.gridSize) * this.gridSize;
  }

  snapPos(pos) {
    return {
      x: this.snapToGrid(pos.x),
      y: this.snapToGrid(pos.y)
    };
  }

  // --- Component Management ---
  addComponent(type, worldX, worldY, params = {}, rotation = 0) {
    this.saveState();
    const def = ComponentDefinitions[type];
    if (!def) return null;

    const id = this.generateUniqueId(def.prefix);
    const comp = {
      id,
      name: `${def.prefix}${this.components.filter(c => c.type === type).length + 1}`,
      type,
      x: this.snapToGrid(worldX),
      y: this.snapToGrid(worldY),
      rotation: rotation || 0,
      width: def.width,
      height: def.height,
      pins: JSON.parse(JSON.stringify(def.pins)),
      params: { ...(def.params || {}), ...params }
    };

    this.components.push(comp);
    this.selectComponent(comp);
    this.notifyModified();
    this.render();
    return comp;
  }

  setPlacementMode(type) {
    this.mode = 'PLACE';
    this.placementComponentType = type;
    this.placementHoverPos = null;
    this.canvas.style.cursor = 'crosshair';
    if (this.onPlacementChange) this.onPlacementChange(type);
    this.render();
  }

  startWiringFromComponent(comp) {
    if (!comp || !comp.pins || comp.pins.length === 0) return;
    const pin = comp.pins[0];
    this.wiringStartPin = {
      comp,
      pin,
      pinKey: `${comp.id}:${pin.id}`,
      pos: this.getPinWorldPos(comp, pin)
    };
    this.wiringCurrentPos = this.wiringStartPin.pos;
    this.canvas.style.cursor = 'crosshair';
    this.render();
  }

  toggleNodeNumbers() {
    this.showNodeNumbers = !this.showNodeNumbers;
    this.render();
    return this.showNodeNumbers;
  }

  removeComponent(comp) {
    if (!comp) return;
    this.saveState();
    this.wires = this.wires.filter(w => !w.fromPin.startsWith(`${comp.id}:`) && !w.toPin.startsWith(`${comp.id}:`));
    this.components = this.components.filter(c => c.id !== comp.id);
    this.selectedComponents.delete(comp);
    if (this.selectedComponent === comp) {
      this.selectedComponent = this.selectedComponents.size > 0 ? Array.from(this.selectedComponents)[0] : null;
    }
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'component', item: this.selectedComponent, group: Array.from(this.selectedComponents) });
    }
    this.notifyModified();
    this.render();
  }

  removeSelected() {
    this.saveState();
    if (this.selectedComponents.size > 0) {
      const idsToDelete = new Set(Array.from(this.selectedComponents).map(c => c.id));
      this.wires = this.wires.filter(w => {
        const fromId = w.fromPin.split(':')[0];
        const toId = w.toPin.split(':')[0];
        return !idsToDelete.has(fromId) && !idsToDelete.has(toId);
      });
      this.components = this.components.filter(c => !idsToDelete.has(c.id));
      this.selectedComponents.clear();
      this.selectedComponent = null;
    }
    if (this.selectedWire) {
      this.wires = this.wires.filter(w => w.id !== this.selectedWire.id);
      this.selectedWire = null;
    }
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'component', item: null, group: [] });
    }
    this.notifyModified();
    this.render();
  }

  // Centroid-Based Group Rotation
  rotateSelected(direction = 90) {
    if (this.selectedComponents.size === 0 && !this.selectedComponent) return;
    this.saveState();

    const targets = this.selectedComponents.size > 0 ? Array.from(this.selectedComponents) : [this.selectedComponent];

    if (targets.length === 1) {
      // Single component: rotate in place
      targets[0].rotation = (targets[0].rotation + direction + 360) % 360;
    } else {
      // Multiple components: rotate around group bounding centroid
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      targets.forEach(c => {
        minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
      });
      const cX = this.snapToGrid((minX + maxX) / 2);
      const cY = this.snapToGrid((minY + maxY) / 2);

      const rad = (direction * Math.PI) / 180;
      const cos = Math.round(Math.cos(rad));
      const sin = Math.round(Math.sin(rad));

      targets.forEach(c => {
        const relX = c.x - cX;
        const relY = c.y - cY;
        c.x = this.snapToGrid(cX + (relX * cos - relY * sin));
        c.y = this.snapToGrid(cY + (relX * sin + relY * cos));
        c.rotation = (c.rotation + direction + 360) % 360;
      });
    }

    this.notifyModified();
    this.render();
  }

  flipSelected(axis = 'x') {
    if (!this.selectedComponent && this.selectedComponents.size === 0) return;
    this.saveState();
    const targets = this.selectedComponents.size > 0 ? Array.from(this.selectedComponents) : [this.selectedComponent];

    if (targets.length === 1) {
      const c = targets[0];
      if (axis === 'x') {
        c.flipX = !c.flipX;
      } else {
        c.flipY = !c.flipY;
      }
    } else {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      targets.forEach(c => {
        minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
      });
      const cX = this.snapToGrid((minX + maxX) / 2);
      const cY = this.snapToGrid((minY + maxY) / 2);

      targets.forEach(c => {
        if (axis === 'x') {
          c.x = this.snapToGrid(2 * cX - c.x);
          c.flipX = !c.flipX;
        } else {
          c.y = this.snapToGrid(2 * cY - c.y);
          c.flipY = !c.flipY;
        }
      });
    }

    this.notifyModified();
    this.render();
  }

  // --- Pin Positions & Hit Testing ---
  getPinWorldPos(comp, pin) {
    const px = pin.x * (comp.flipX ? -1 : 1);
    const py = pin.y * (comp.flipY ? -1 : 1);
    const rad = ((comp.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: comp.x + (px * cos - py * sin),
      y: comp.y + (px * sin + py * cos)
    };
  }

  getPinEffectiveDir(comp, pin) {
    if (!pin.dir) return 'right';
    let dir = pin.dir;
    if (comp.flipX) {
      if (dir === 'left') dir = 'right';
      else if (dir === 'right') dir = 'left';
    }
    if (comp.flipY) {
      if (dir === 'top') dir = 'bottom';
      else if (dir === 'bottom') dir = 'top';
    }
    const rot = ((comp.rotation || 0) % 360 + 360) % 360;
    const dirs = ['right', 'bottom', 'left', 'top'];
    const idx = dirs.indexOf(dir);
    if (idx === -1) return dir;
    const shift = Math.round(rot / 90) % 4;
    return dirs[(idx + shift) % 4];
  }

  findPinAt(worldX, worldY, radius = 12) {
    for (const comp of this.components) {
      if (!comp.pins) continue;
      for (const pin of comp.pins) {
        const pinPos = this.getPinWorldPos(comp, pin);
        const dist = Math.hypot(worldX - pinPos.x, worldY - pinPos.y);
        if (dist <= radius) {
          return { comp, pin, pinKey: `${comp.id}:${pin.id}`, pos: pinPos };
        }
      }
    }
    return null;
  }

  findComponentAt(worldX, worldY, padding = 16) {
    for (let i = this.components.length - 1; i >= 0; i--) {
      const comp = this.components[i];
      const rad = -((comp.rotation || 0) * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = worldX - comp.x;
      const dy = worldY - comp.y;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const hw = Math.max(((comp.width || 40) / 2) + padding, 22);
      const hh = Math.max(((comp.height || 40) / 2) + padding, 22);
      if (Math.abs(localX) <= hw && Math.abs(localY) <= hh) {
        return comp;
      }
    }
    return null;
  }

  findWireAt(worldX, worldY, threshold = 6) {
    for (const wire of this.wires) {
      const points = this.getWireWaypoints(wire);
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (this.pointToSegmentDistance(worldX, worldY, p1.x, p1.y, p2.x, p2.y) <= threshold) {
          return wire;
        }
      }
    }
    return null;
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  getWireWaypoints(wire) {
    const [fromCompId, fromPinId] = wire.fromPin.split(':');
    const [toCompId, toPinId] = wire.toPin.split(':');

    const fromComp = this.components.find(c => c.id === fromCompId);
    const toComp = this.components.find(c => c.id === toCompId);
    if (!fromComp || !toComp) return [];

    const fromPin = fromComp.pins?.find(p => p.id === fromPinId);
    const toPin = toComp.pins?.find(p => p.id === toPinId);
    if (!fromPin || !toPin) return [];

    const p1 = this.getPinWorldPos(fromComp, fromPin);
    const p2 = this.getPinWorldPos(toComp, toPin);

    // Manhattan Orthogonal Routing
    if (Math.abs(p1.x - p2.x) < 2 || Math.abs(p1.y - p2.y) < 2) {
      return [p1, p2];
    }

    const d1 = this.getPinEffectiveDir(fromComp, fromPin);
    const d2 = this.getPinEffectiveDir(toComp, toPin);
    const isVert1 = (d1 === 'top' || d1 === 'bottom');
    const isVert2 = (d2 === 'top' || d2 === 'bottom');

    if (isVert1 && isVert2) {
      const midY = Math.round((p1.y + p2.y) / 2 / this.gridSize) * this.gridSize;
      return [
        p1,
        { x: p1.x, y: midY },
        { x: p2.x, y: midY },
        p2
      ];
    }

    if (isVert1 && !isVert2) {
      return [
        p1,
        { x: p1.x, y: p2.y },
        p2
      ];
    }

    if (!isVert1 && isVert2) {
      return [
        p1,
        { x: p2.x, y: p1.y },
        p2
      ];
    }

    const midX = Math.round((p1.x + p2.x) / 2 / this.gridSize) * this.gridSize;
    return [
      p1,
      { x: midX, y: p1.y },
      { x: midX, y: p2.y },
      p2
    ];
  }

  // --- Unified Pointer & Multi-Touch Gesture Handlers (Bare Hands & Mouse) ---
  handlePointerDown(e) {
    if (e.cancelable) e.preventDefault();
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Single touch resets pinch state
    if (this.activePointers.size === 1) {
      this.isPinching = false;
    }

    // Multi-Touch (Bare Hands Two-Finger Pinch Zoom & Pan)
    if (this.activePointers.size === 2 && e.pointerType === 'touch') {
      this.isPinching = true;
      this.drag.active = false;
      this.isPanning = false;
      this.isBoxSelecting = false;
      this.wiringStartPin = null;
      this.wiringCurrentPos = null;
      this.hoveredTargetPin = null;
      this.state = CanvasState.PINCHING;
      const pts = Array.from(this.activePointers.values());
      this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.initialPinchZoom = this.zoom;
      this.initialPinchCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      this.initialPinchPan = { x: this.panX, y: this.panY };
      this.render();
      return;
    }

    // Double-tap detection for touchscreens
    const now = Date.now();
    if (now - this.lastTapTime < 300 && Math.hypot(e.clientX - this.lastTapPos.x, e.clientY - this.lastTapPos.y) < 25) {
      this.handleDoubleClick(e);
      this.lastTapTime = 0;
      return;
    }
    this.lastTapTime = now;
    this.lastTapPos = { x: e.clientX, y: e.clientY };

    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    // Middle-click or Alt+LeftClick: Pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      this.state = CanvasState.PANNING_CANVAS;
      this.isPanning = true;
      this.drag.active = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      return;
    }

    if (e.button === 0 || e.pointerType === 'touch' || e.pointerType === 'pen' || e.button === undefined) {
      // 1. Placement Mode
      if (this.mode === 'PLACE' && this.placementComponentType) {
        this.state = CanvasState.PLACING_COMPONENT;
        const sx = this.snapToGrid(worldPos.x);
        const sy = this.snapToGrid(worldPos.y);

        if (this.placementComponentType === ComponentTypes.NODE || this.placementComponentType === ComponentTypes.JUNCTION) {
          const wireHit = this.findWireAt(worldPos.x, worldPos.y, 12);
          if (wireHit) {
            this.saveState();
            const newNode = this.addComponent(this.placementComponentType, sx, sy);
            if (newNode) {
              const nodePinKey = `${newNode.id}:p1`;
              const origFrom = wireHit.fromPin;
              const origTo = wireHit.toPin;
              this.wires = this.wires.filter(w => w.id !== wireHit.id);
              this.wires.push({ id: this.generateUniqueId('W'), fromPin: origFrom, toPin: nodePinKey });
              this.wires.push({ id: this.generateUniqueId('W'), fromPin: nodePinKey, toPin: origTo });
            }
            if (!e.shiftKey) {
              this.mode = 'SELECT';
              this.placementComponentType = null;
              this.placementHoverPos = null;
              this.canvas.style.cursor = 'default';
              if (this.onPlacementChange) this.onPlacementChange(null);
            }
            this.notifyModified();
            this.render();
            return;
          }
        }

        const newComp = this.addComponent(this.placementComponentType, sx, sy);
        if (!e.shiftKey) {
          this.mode = 'SELECT';
          this.placementComponentType = null;
          this.placementHoverPos = null;
          this.canvas.style.cursor = 'default';
          if (this.onPlacementChange) this.onPlacementChange(null);
        }
        if (newComp) {
          this.drag.active = true;
          this.drag.pointerId = e.pointerId;
          this.drag.startWorld = { x: worldPos.x, y: worldPos.y };
          this.dragStartScreen = { x: e.clientX, y: e.clientY };
          this.drag.initialPositions.clear();
          this.drag.initialPositions.set(newComp.id, { x: newComp.x, y: newComp.y });
          this.drag.moved = false;
          this.isPanning = false;
          this.isBoxSelecting = false;
          this.state = CanvasState.DRAGGING_COMPONENT;
          try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
        }
        return;
      }

      // 2. Wiring in progress: Target pin or wire click
      if (this.wiringStartPin) {
        const pinHit = this.findPinAt(worldPos.x, worldPos.y, 14);
        if (pinHit && pinHit.pinKey !== this.wiringStartPin.pinKey) {
          const from = this.wiringStartPin.pinKey;
          const to = pinHit.pinKey;
          const exists = this.wires.some(w => (w.fromPin === from && w.toPin === to) || (w.fromPin === to && w.toPin === from));
          if (!exists) {
            this.saveState();
            this.wires.push({
              id: this.generateUniqueId('W'),
              fromPin: from,
              toPin: to
            });
          }
          this.wiringStartPin = null;
          this.wiringCurrentPos = null;
          this.hoveredTargetPin = null;
          this.state = CanvasState.IDLE;
          this.notifyModified();
          this.render();
          return;
        }

        const wireHit = this.findWireAt(worldPos.x, worldPos.y, 10);
        if (wireHit && wireHit.fromPin !== this.wiringStartPin.pinKey && wireHit.toPin !== this.wiringStartPin.pinKey) {
          this.saveState();
          const sx = this.snapToGrid(worldPos.x);
          const sy = this.snapToGrid(worldPos.y);
          const newNode = this.addComponent(ComponentTypes.NODE, sx, sy);
          const nodePinKey = `${newNode.id}:p1`;
          const origFrom = wireHit.fromPin;
          const origTo = wireHit.toPin;
          const from = this.wiringStartPin.pinKey;

          this.wires = this.wires.filter(w => w.id !== wireHit.id);
          this.wires.push({ id: this.generateUniqueId('W'), fromPin: origFrom, toPin: nodePinKey });
          this.wires.push({ id: this.generateUniqueId('W'), fromPin: nodePinKey, toPin: origTo });
          this.wires.push({ id: this.generateUniqueId('W'), fromPin: from, toPin: nodePinKey });

          this.wiringStartPin = null;
          this.wiringCurrentPos = null;
          this.hoveredTargetPin = null;
          this.state = CanvasState.IDLE;
          this.notifyModified();
          this.render();
          return;
        }

        this.wiringStartPin = null;
        this.wiringCurrentPos = null;
        this.hoveredTargetPin = null;
        this.state = CanvasState.IDLE;
        this.render();
        return;
      }

      // 3. Pin Click to Start / Extend Wiring (HIGHEST PRIORITY: clicking terminal starts wire extension)
      const pinHit = this.findPinAt(worldPos.x, worldPos.y, 14);
      if (pinHit) {
        this.drag.active = false;
        this.isPanning = false;
        this.isBoxSelecting = false;
        this.state = CanvasState.WIRING;
        this.wiringStartPin = pinHit;
        this.wiringCurrentPos = pinHit.pos;
        this.canvas.style.cursor = 'crosshair';
        this.render();
        return;
      }

      // 4. Component Selection & Direct Dragging (When clicking inside component body)
      const compHit = this.findComponentAt(worldPos.x, worldPos.y, 10);
      if (compHit) {
        console.log('COMPONENT DOWN', compHit?.id);

        // Trigger or toggle interactive components immediately on click
        if (
          compHit.type === ComponentTypes.PULSE_VOLTAGE ||
          compHit.type === ComponentTypes.TRIGGER_PULSE ||
          compHit.type === ComponentTypes.PUSH_BUTTON ||
          compHit.type === ComponentTypes.PUSH_BUTTON_NC ||
          compHit.type === ComponentTypes.SPST_SWITCH ||
          compHit.type === ComponentTypes.SPDT_SWITCH
        ) {
          this.triggerComponentPulse(compHit);
        }

        // Select component
        if (!e.shiftKey) {
          if (!this.selectedComponents.has(compHit)) {
            this.selectedComponents.clear();
          }
        }

        this.selectedComponents.add(compHit);
        this.selectedComponent = compHit;
        this.selectedWire = null;

        // Start drag
        this.drag.active = true;
        this.drag.pointerId = e.pointerId;
        this.drag.startWorld = {
          x: worldPos.x,
          y: worldPos.y
        };
        this.dragStartScreen = {
          x: e.clientX,
          y: e.clientY
        };

        this.drag.initialPositions.clear();

        this.selectedComponents.forEach(component => {
          this.drag.initialPositions.set(component.id, {
            x: component.x,
            y: component.y
          });
        });

        this.drag.moved = false;

        this.state = CanvasState.DRAGGING_COMPONENT;

        this.isPanning = false;
        this.isBoxSelecting = false;

        try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}

        if (this.onSelectionChange) {
          this.onSelectionChange({ type: 'component', item: this.selectedComponent, group: Array.from(this.selectedComponents) });
        }

        this.render();

        return;
      }

      // 5. Wire Click
      const wireHit = this.findWireAt(worldPos.x, worldPos.y, 8);
      if (wireHit) {
        this.drag.active = false;
        this.isPanning = false;
        this.state = CanvasState.IDLE;
        this.selectWire(wireHit);
        return;
      }

      // 6. Empty Canvas Click -> Area Drag (Marquee Box Selection)
      this.drag.active = false;
      this.isPanning = false;
      this.isBoxSelecting = true;
      this.state = CanvasState.SELECTING;
      this.boxSelectStart = worldPos;
      this.boxSelectCurrent = worldPos;

      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        this.selectedComponents.clear();
        this.selectedComponent = null;
        this.selectWire(null);
        if (this.onSelectionChange) {
          this.onSelectionChange({ type: 'component', item: null, group: [] });
        }
      }
      this.render();
    }
  }

  handleMouseDown(e) {
    this.handlePointerDown(e);
  }

  handlePointerMove(e) {
    if (e.cancelable) e.preventDefault();
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-Finger Pinch Zoom & Pan (Bare Hands)
    if (this.isPinching && this.activePointers.size >= 2) {
      const pts = Array.from(this.activePointers.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.initialPinchDist > 5 && currentDist > 5) {
        const factor = currentDist / this.initialPinchDist;
        const newZoom = Math.min(Math.max(this.initialPinchZoom * factor, this.minZoom), this.maxZoom);
        const rect = this.canvas.getBoundingClientRect();
        const centerScreenX = (pts[0].x + pts[1].x) / 2 - rect.left;
        const centerScreenY = (pts[0].y + pts[1].y) / 2 - rect.top;

        this.panX = centerScreenX - (centerScreenX - this.initialPinchPan.x) * (newZoom / this.initialPinchZoom);
        this.panY = centerScreenY - (centerScreenY - this.initialPinchPan.y) * (newZoom / this.initialPinchZoom);
        this.zoom = newZoom;
        this.render();
      }
      return;
    }

    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    // HIGHEST PRIORITY: Authoritative Component Dragging
    if (
      this.drag.active &&
      e.pointerId === this.drag.pointerId
    ) {
      console.log('DRAG MOVE', this.drag.active, e.pointerId, this.drag.pointerId);

      const dx = worldPos.x - this.drag.startWorld.x;
      const dy = worldPos.y - this.drag.startWorld.y;

      const screenDX = e.clientX - this.dragStartScreen.x;
      const screenDY = e.clientY - this.dragStartScreen.y;

      const distance = Math.hypot(screenDX, screenDY);

      // Small movement threshold
      if (distance > 2) {
        if (!this.drag.moved) {
          // Save undo state ONCE
          this.saveState();
          this.drag.moved = true;
        }

        this.selectedComponents.forEach(component => {
          const initial = this.drag.initialPositions.get(component.id);
          if (!initial) return;

          component.x = this.snapToGrid(initial.x + dx);
          component.y = this.snapToGrid(initial.y + dy);
          console.log('NEW POSITION', component.x, component.y);
        });

        this.render();
      }

      return;
    }

    // Placement Mode Hover Ghost Tracking
    if (this.mode === 'PLACE' && this.placementComponentType) {
      this.placementHoverPos = worldPos;
      this.render();
      return;
    }

    if (this.isPanning) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.panX += dx;
      this.panY += dy;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.render();
      return;
    }

    if (this.isBoxSelecting) {
      this.boxSelectCurrent = worldPos;
      this.render();
      return;
    }

    if (this.wiringStartPin) {
      const targetPinHit = this.findPinAt(worldPos.x, worldPos.y, 16);
      if (targetPinHit && targetPinHit.pinKey !== this.wiringStartPin.pinKey) {
        this.wiringCurrentPos = targetPinHit.pos;
        this.hoveredTargetPin = targetPinHit;
      } else {
        this.wiringCurrentPos = this.snapPos(worldPos);
        this.hoveredTargetPin = null;
      }
      this.render();
      return;
    }

    const pinHit = this.findPinAt(worldPos.x, worldPos.y, 14);
    const compHit = this.findComponentAt(worldPos.x, worldPos.y);

    if (pinHit !== this.hoveredPin || compHit !== this.hoveredComponent) {
      this.hoveredPin = pinHit;
      this.hoveredComponent = compHit;
      this.canvas.style.cursor = pinHit ? 'crosshair' : (compHit ? 'grab' : 'default');
      this.render();
    }
  }

  handleMouseMove(e) {
    this.handlePointerMove(e);
  }

  handlePointerUp(e) {
    this.activePointers.delete(e.pointerId);

    // HIGHEST PRIORITY: Authoritative Component Drag Release
    if (
      this.drag.active &&
      e.pointerId === this.drag.pointerId
    ) {
      const moved = this.drag.moved;

      this.drag.active = false;
      this.drag.pointerId = null;
      this.drag.startWorld = null;
      this.drag.initialPositions.clear();

      this.state = CanvasState.IDLE;

      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (error) {
        // Ignore if pointer capture already released
      }

      if (moved) {
        this.notifyModified();
      }

      this.render();

      return;
    }

    try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}

    this.isPinching = false;
    this.isPanning = false;

    // Drag-to-Connect Wiring Support (Pin-to-Pin and Pin-to-Wire)
    if (this.wiringStartPin) {
      const worldPos = this.screenToWorld(e.clientX, e.clientY);
      const pinHit = this.findPinAt(worldPos.x, worldPos.y, 16);
      if (pinHit && pinHit.pinKey !== this.wiringStartPin.pinKey) {
        const from = this.wiringStartPin.pinKey;
        const to = pinHit.pinKey;
        const exists = this.wires.some(w => (w.fromPin === from && w.toPin === to) || (w.fromPin === to && w.toPin === from));
        if (!exists) {
          this.saveState();
          this.wires.push({
            id: this.generateUniqueId('W'),
            fromPin: from,
            toPin: to
          });
        }
        this.wiringStartPin = null;
        this.wiringCurrentPos = null;
        this.hoveredTargetPin = null;
        this.state = CanvasState.IDLE;
        this.notifyModified();
        this.render();
        return;
      }

      const wireHit = this.findWireAt(worldPos.x, worldPos.y, 12);
      if (wireHit && wireHit.fromPin !== this.wiringStartPin.pinKey && wireHit.toPin !== this.wiringStartPin.pinKey) {
        this.saveState();
        const sx = this.snapToGrid(worldPos.x);
        const sy = this.snapToGrid(worldPos.y);
        const newNode = this.addComponent(ComponentTypes.NODE, sx, sy);
        const nodePinKey = `${newNode.id}:p1`;
        const origFrom = wireHit.fromPin;
        const origTo = wireHit.toPin;
        const from = this.wiringStartPin.pinKey;

        this.wires = this.wires.filter(w => w.id !== wireHit.id);
        this.wires.push({ id: this.generateUniqueId('W'), fromPin: origFrom, toPin: nodePinKey });
        this.wires.push({ id: this.generateUniqueId('W'), fromPin: nodePinKey, toPin: origTo });
        this.wires.push({ id: this.generateUniqueId('W'), fromPin: from, toPin: nodePinKey });

        this.wiringStartPin = null;
        this.wiringCurrentPos = null;
        this.hoveredTargetPin = null;
        this.state = CanvasState.IDLE;
        this.notifyModified();
        this.render();
        return;
      }
    }

    this.state = CanvasState.IDLE;

    if (this.isBoxSelecting) {
      this.isBoxSelecting = false;
      const minX = Math.min(this.boxSelectStart.x, this.boxSelectCurrent.x);
      const maxX = Math.max(this.boxSelectStart.x, this.boxSelectCurrent.x);
      const minY = Math.min(this.boxSelectStart.y, this.boxSelectCurrent.y);
      const maxY = Math.max(this.boxSelectStart.y, this.boxSelectCurrent.y);
      const dragDist = Math.hypot(this.boxSelectCurrent.x - this.boxSelectStart.x, this.boxSelectCurrent.y - this.boxSelectStart.y);

      if (dragDist > 5) {
        this.components.forEach(c => {
          const hw = (c.width || 40) / 2;
          const hh = (c.height || 40) / 2;
          const compLeft = c.x - hw;
          const compRight = c.x + hw;
          const compTop = c.y - hh;
          const compBottom = c.y + hh;

          // Check if component intersects or is contained in selection box
          if (compRight >= minX && compLeft <= maxX && compBottom >= minY && compTop <= maxY) {
            this.selectedComponents.add(c);
          }
        });

        this.selectedComponent = this.selectedComponents.size > 0 ? Array.from(this.selectedComponents)[0] : null;
        if (this.onSelectionChange) {
          this.onSelectionChange({
            type: 'component',
            item: this.selectedComponent,
            group: Array.from(this.selectedComponents)
          });
        }
      } else {
        // Simple click without drag on empty space: ensure selection is cleared
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          this.selectedComponents.clear();
          this.selectedComponent = null;
          this.selectWire(null);
          if (this.onSelectionChange) {
            this.onSelectionChange({ type: 'component', item: null, group: [] });
          }
        }
      }

      this.state = CanvasState.IDLE;
      this.render();
      return;
    }
  }

  handlePointerCancel(e) {
    this.activePointers.delete(e.pointerId);

    if (
      this.drag.active &&
      e.pointerId === this.drag.pointerId
    ) {
      if (this.drag.moved) {
        this.selectedComponents.forEach(component => {
          const initial = this.drag.initialPositions.get(component.id);
          if (initial) {
            component.x = initial.x;
            component.y = initial.y;
          }
        });
        this.undo();
      }

      this.drag.active = false;
      this.drag.pointerId = null;
      this.drag.startWorld = null;
      this.drag.initialPositions.clear();
      this.drag.moved = false;

      this.state = CanvasState.IDLE;

      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (error) {}

      this.render();
      return;
    }

    try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    this.isPanning = false;
    this.isPinching = false;
    this.isBoxSelecting = false;
    this.wiringStartPin = null;
    this.wiringCurrentPos = null;
    this.hoveredTargetPin = null;
    this.state = CanvasState.IDLE;
    this.render();
  }

  handleMouseUp(e) {
    this.handlePointerUp(e);
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(Math.max(this.zoom * zoomFactor, this.minZoom), this.maxZoom);

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
    this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;

    this.render();
  }

  handleDoubleClick(e) {
    const worldPos = this.screenToWorld(e.clientX, e.clientY);
    const comp = this.findComponentAt(worldPos.x, worldPos.y);
    if (comp) {
      this.selectComponent(comp);
      setTimeout(() => {
        const firstInput = document.querySelector('#propertiesContent input.prop-param-input, #propertiesContent #propNameInput');
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }, 50);
    }
  }

  handleKeyDown(e) {
    const activeEl = document.activeElement;
    if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.rotateSelected(90);
    } else if (!isCtrlOrCmd && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      this.flipSelected('x');
    } else if (!isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      this.flipSelected('y');
    } else if (!isCtrlOrCmd && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      this.toggleNodeNumbers();
    } else if (!isCtrlOrCmd && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault();
      this.setPlacementMode(ComponentTypes.NODE);
    } else if (!isCtrlOrCmd && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      if (this.selectedComponent) {
        this.startWiringFromComponent(this.selectedComponent);
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      if (this.selectedComponent) {
        const comp = this.selectedComponent;
        if (
          comp.type === ComponentTypes.PULSE_VOLTAGE ||
          comp.type === ComponentTypes.TRIGGER_PULSE ||
          comp.type === ComponentTypes.PUSH_BUTTON ||
          comp.type === ComponentTypes.PUSH_BUTTON_NC ||
          comp.type === ComponentTypes.SPST_SWITCH ||
          comp.type === ComponentTypes.SPDT_SWITCH
        ) {
          e.preventDefault();
          this.triggerComponentPulse(comp);
        }
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.removeSelected();
    } else if (e.key === 'Escape') {
      this.cancelAction();
    } else if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    } else if (isCtrlOrCmd && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      this.selectAll();
    } else if (isCtrlOrCmd && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      this.cutSelection();
    } else if (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
      e.preventDefault();
      this.redo();
    } else if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      this.copySelection();
    } else if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      this.pasteSelection();
    } else if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      this.duplicateSelection(40, 40);
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const step = e.shiftKey ? this.gridSize * 5 : this.gridSize;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      if (this.selectedComponents.size > 0) {
        this.saveState();
        this.selectedComponents.forEach(c => {
          c.x += dx; c.y += dy;
        });
        this.notifyModified();
        this.render();
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      document.getElementById('btnSimToggle')?.click();
    }
  }

  selectAll() {
    this.selectedComponents.clear();
    this.components.forEach(c => this.selectedComponents.add(c));
    this.selectedComponent = this.components.length > 0 ? this.components[0] : null;
    this.selectedWire = null;
    if (this.onSelectionChange) {
      this.onSelectionChange({
        type: 'component',
        item: this.selectedComponent,
        group: Array.from(this.selectedComponents)
      });
    }
    this.render();
    return Array.from(this.selectedComponents);
  }

  cutSelection() {
    if (this.selectedComponents.size === 0 && !this.selectedWire) return;
    this.copySelection();
    this.removeSelected();
  }

  copySelection() {
    if (this.selectedComponents.size === 0) return;
    const selectedList = Array.from(this.selectedComponents);
    const selectedIds = new Set(selectedList.map(c => c.id));

    // Preserve internal wires connecting selected components together
    const internalWires = this.wires.filter(w => {
      const fromId = w.fromPin.split(':')[0];
      const toId = w.toPin.split(':')[0];
      return selectedIds.has(fromId) && selectedIds.has(toId);
    });

    this.clipboard = {
      components: selectedList.map(c => JSON.parse(JSON.stringify(c))),
      wires: internalWires.map(w => JSON.parse(JSON.stringify(w)))
    };
  }

  pasteSelection(offsetDx = 40, offsetDy = 40) {
    if (!this.clipboard) return;
    const compsToPaste = Array.isArray(this.clipboard) ? this.clipboard : this.clipboard.components;
    const wiresToPaste = Array.isArray(this.clipboard) ? [] : (this.clipboard.wires || []);

    if (!compsToPaste || compsToPaste.length === 0) return;
    this.saveState();
    this.selectedComponents.clear();

    const idMap = new Map();

    compsToPaste.forEach(origComp => {
      const def = ComponentDefinitions[origComp.type];
      const prefix = def ? def.prefix : (origComp.id ? origComp.id.replace(/[0-9]/g, '') : 'C');
      const newId = this.generateUniqueId(prefix);
      idMap.set(origComp.id, newId);

      const count = this.components.filter(c => c.type === origComp.type).length + 1;
      const newComp = {
        ...origComp,
        id: newId,
        name: def ? `${def.prefix}${count}` : origComp.name,
        x: this.snapToGrid(origComp.x + offsetDx),
        y: this.snapToGrid(origComp.y + offsetDy),
        pins: JSON.parse(JSON.stringify(origComp.pins || []))
      };

      this.components.push(newComp);
      this.selectedComponents.add(newComp);
    });

    // Reconstruct internal connecting wires with new cloned pin IDs
    wiresToPaste.forEach(origWire => {
      const [fromCompId, fromPinId] = origWire.fromPin.split(':');
      const [toCompId, toPinId] = origWire.toPin.split(':');
      const newFromCompId = idMap.get(fromCompId);
      const newToCompId = idMap.get(toCompId);
      if (newFromCompId && newToCompId) {
        this.wires.push({
          id: this.generateUniqueId('W'),
          fromPin: `${newFromCompId}:${fromPinId}`,
          toPin: `${newToCompId}:${toPinId}`
        });
      }
    });

    this.selectedComponent = Array.from(this.selectedComponents)[0] || null;
    this.selectedWire = null;
    if (this.onSelectionChange) {
      this.onSelectionChange({
        type: 'component',
        item: this.selectedComponent,
        group: Array.from(this.selectedComponents)
      });
    }
    this.notifyModified();
    this.render();
  }

  duplicateSelection(offsetDx = 40, offsetDy = 40) {
    this.copySelection();
    this.pasteSelection(offsetDx, offsetDy);
  }

  cancelAction() {
    this.wiringStartPin = null;
    this.wiringCurrentPos = null;
    this.hoveredTargetPin = null;
    this.mode = 'SELECT';
    this.placementComponentType = null;
    this.placementHoverPos = null;
    this.drag.active = false;
    this.drag.pointerId = null;
    this.drag.startWorld = null;
    this.drag.initialPositions.clear();
    this.drag.moved = false;
    this.isPanning = false;
    this.isPinching = false;
    this.isBoxSelecting = false;
    this.state = CanvasState.IDLE;
    this.canvas.style.cursor = 'default';
    if (this.onPlacementChange) this.onPlacementChange(null);
    this.render();
  }

  selectComponent(comp) {
    this.selectedComponents.clear();
    if (comp) this.selectedComponents.add(comp);
    this.selectedComponent = comp;
    this.selectedWire = null;
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'component', item: comp, group: comp ? [comp] : [] });
    }
    this.render();
  }

  selectWire(wire) {
    this.selectedWire = wire;
    if (wire) {
      this.selectedComponent = null;
      this.selectedComponents.clear();
    }
    if (this.onSelectionChange) this.onSelectionChange({ type: 'wire', item: wire });
    this.render();
  }

  saveState() {
    this.undoStack.push({
      components: JSON.parse(JSON.stringify(this.components)),
      wires: JSON.parse(JSON.stringify(this.wires))
    });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push({
      components: JSON.parse(JSON.stringify(this.components)),
      wires: JSON.parse(JSON.stringify(this.wires))
    });
    const state = this.undoStack.pop();
    this.components = state.components;
    this.wires = state.wires;
    this.selectedComponents.clear();
    this.selectedComponent = null;
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'component', item: null, group: [] });
    }
    this.notifyModified();
    this.render();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push({
      components: JSON.parse(JSON.stringify(this.components)),
      wires: JSON.parse(JSON.stringify(this.wires))
    });
    const state = this.redoStack.pop();
    this.components = state.components;
    this.wires = state.wires;
    this.selectedComponents.clear();
    this.selectedComponent = null;
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'component', item: null, group: [] });
    }
    this.notifyModified();
    this.render();
  }

  notifyModified() {
    if (this.onCircuitModified) this.onCircuitModified(this.components, this.wires);
  }

  triggerComponentPulse(comp) {
    if (!comp) return;
    comp.params = comp.params || {};

    if (comp.type === ComponentTypes.PULSE_VOLTAGE || comp.type === ComponentTypes.TRIGGER_PULSE) {
      const now = this.engine ? this.engine.time : 0;
      comp.params.lastTriggerTime = now;
      comp.pulseAnimation = { startTime: performance.now(), duration: 450 };
    } else if (comp.type === ComponentTypes.PUSH_BUTTON || comp.type === ComponentTypes.PUSH_BUTTON_NC) {
      const defaultState = (comp.type === ComponentTypes.PUSH_BUTTON_NC);
      comp.params.closed = !defaultState;
      comp.pulseAnimation = { startTime: performance.now(), duration: 300 };
      setTimeout(() => {
        comp.params.closed = defaultState;
        this.notifyModified();
        this.render();
      }, 150);
    } else if (comp.type === ComponentTypes.SPST_SWITCH) {
      comp.params.closed = !comp.params.closed;
      comp.pulseAnimation = { startTime: performance.now(), duration: 250 };
    } else if (comp.type === ComponentTypes.SPDT_SWITCH) {
      comp.params.position = comp.params.position === 1 ? 2 : 1;
      comp.pulseAnimation = { startTime: performance.now(), duration: 250 };
    }

    this.notifyModified();
    this.render();

    if (this.onPulseTriggered) {
      this.onPulseTriggered(comp);
    }
  }

  fitToScreen() {
    if (this.canvas.parentElement) {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
      }
    }

    const dw = this.displayWidth || 800;
    const dh = this.displayHeight || 600;

    if (this.components.length === 0 && this.wires.length === 0) {
      this.zoom = 1.0;
      this.panX = dw / 2;
      this.panY = dh / 2;
      this.render();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.components.forEach(c => {
      const w = c.width || 40;
      const h = c.height || 40;
      minX = Math.min(minX, c.x - w / 2 - 20);
      minY = Math.min(minY, c.y - h / 2 - 20);
      maxX = Math.max(maxX, c.x + w / 2 + 20);
      maxY = Math.max(maxY, c.y + h / 2 + 20);

      // Also include pins in bounding box
      if (Array.isArray(c.pins)) {
        c.pins.forEach(p => {
          if (p.x !== undefined && p.y !== undefined) {
            minX = Math.min(minX, p.x - 10);
            minY = Math.min(minY, p.y - 10);
            maxX = Math.max(maxX, p.x + 10);
            maxY = Math.max(maxY, p.y + 10);
          }
        });
      }
    });

    // Also include wires and waypoints
    this.wires.forEach(w => {
      if (w.x1 !== undefined && w.y1 !== undefined) {
        minX = Math.min(minX, w.x1);
        minY = Math.min(minY, w.y1);
        maxX = Math.max(maxX, w.x1);
        maxY = Math.max(maxY, w.y1);
      }
      if (w.x2 !== undefined && w.y2 !== undefined) {
        minX = Math.min(minX, w.x2);
        minY = Math.min(minY, w.y2);
        maxX = Math.max(maxX, w.x2);
        maxY = Math.max(maxY, w.y2);
      }
      if (Array.isArray(w.waypoints)) {
        w.waypoints.forEach(wp => {
          minX = Math.min(minX, wp.x);
          minY = Math.min(minY, wp.y);
          maxX = Math.max(maxX, wp.x);
          maxY = Math.max(maxY, wp.y);
        });
      }
    });

    if (!isFinite(minX) || !isFinite(maxX)) {
      this.zoom = 1.0;
      this.panX = dw / 2;
      this.panY = dh / 2;
      this.render();
      return;
    }

    const padding = 70;
    const circuitW = Math.max(maxX - minX + padding * 2, 80);
    const circuitH = Math.max(maxY - minY + padding * 2, 80);

    const zoomX = dw / circuitW;
    const zoomY = dh / circuitH;
    this.zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.25), 2.2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.panX = dw / 2 - centerX * this.zoom;
    this.panY = dh / 2 - centerY * this.zoom;

    this.render();
  }

  zoomIn(factor = 1.2) {
    this.zoomBy(factor);
  }

  zoomOut(factor = 1.2) {
    this.zoomBy(1 / factor);
  }

  zoomBy(factor, screenX = (this.displayWidth || 800) / 2, screenY = (this.displayHeight || 600) / 2) {
    const oldZoom = this.zoom;
    const newZoom = Math.min(Math.max(oldZoom * factor, this.minZoom), this.maxZoom);
    if (newZoom === oldZoom) return;
    this.panX = screenX - (screenX - this.panX) * (newZoom / oldZoom);
    this.panY = screenY - (screenY - this.panY) * (newZoom / oldZoom);
    this.zoom = newZoom;
    this.render();
  }

  resetZoom(screenX = (this.displayWidth || 800) / 2, screenY = (this.displayHeight || 600) / 2) {
    const oldZoom = this.zoom;
    const newZoom = 1.0;
    this.panX = screenX - (screenX - this.panX) * (newZoom / oldZoom);
    this.panY = screenY - (screenY - this.panY) * (newZoom / oldZoom);
    this.zoom = newZoom;
    this.render();
  }

  // --- Rendering Pipeline ---
  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    if (!w || !h || w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Grid
    this.renderGrid(ctx, w, h);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Viewport Culling Bounds
    const vMin = this.screenToWorld(0, 0);
    const vMax = this.screenToWorld(w, h);
    const margin = 100;
    const vpLeft = vMin.x - margin;
    const vpTop = vMin.y - margin;
    const vpRight = vMax.x + margin;
    const vpBottom = vMax.y + margin;

    // 2. Draw Wires & Junctions
    this.renderWires(ctx, vpLeft, vpTop, vpRight, vpBottom);

    // 3. Draw Wiring In-Progress Line
    if (this.wiringStartPin && this.wiringCurrentPos) {
      ctx.save();
      ctx.strokeStyle = '#03b585';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const p1 = this.wiringStartPin.pos;
      const p2 = this.wiringCurrentPos;
      const midX = (p1.x + p2.x) / 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(midX, p1.y);
      ctx.lineTo(midX, p2.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Components
    this.components.forEach(comp => {
      const maxDim = Math.max(comp.width || 40, comp.height || 40) / 2;
      if (comp.x + maxDim >= vpLeft && comp.x - maxDim <= vpRight && comp.y + maxDim >= vpTop && comp.y - maxDim <= vpBottom) {
        this.renderComponent(ctx, comp);
      }
    });

    // 5. Draw Pins
    this.renderPins(ctx, vpLeft, vpTop, vpRight, vpBottom);

    // 5.5 Draw Placement Mode Ghost Preview (Follows Bare Hands / Mouse Cursor)
    if (this.mode === 'PLACE' && this.placementComponentType && this.placementHoverPos) {
      const def = ComponentDefinitions[this.placementComponentType];
      if (def) {
        const sx = this.snapToGrid(this.placementHoverPos.x);
        const sy = this.snapToGrid(this.placementHoverPos.y);
        ctx.save();
        ctx.globalAlpha = 0.65;
        // Snap target halo
        ctx.beginPath();
        const r = Math.max((def.width || 40) / 2, (def.height || 40) / 2) + 8;
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.fill();
        ctx.stroke();

        // Temporary component ghost
        const tempComp = {
          id: '__preview__',
          type: this.placementComponentType,
          x: sx,
          y: sy,
          rotation: 0,
          width: def.width,
          height: def.height,
          pins: def.pins,
          params: def.params || {}
        };
        this.renderComponent(ctx, tempComp);
        ctx.restore();
      }
    }

    // 6. Draw Marquee Selection Box (Normalized)
    if (this.isBoxSelecting) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 122, 255, 0.12)';
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      const bx = Math.min(this.boxSelectStart.x, this.boxSelectCurrent.x);
      const by = Math.min(this.boxSelectStart.y, this.boxSelectCurrent.y);
      const bw = Math.abs(this.boxSelectCurrent.x - this.boxSelectStart.x);
      const bh = Math.abs(this.boxSelectCurrent.y - this.boxSelectStart.y);
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    }

    ctx.restore();
  }

  renderGrid(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const scaledGrid = this.gridSize * this.zoom;
    if (scaledGrid < 6) return;

    ctx.fillStyle = '#e2e8f0';
    let startX = this.panX % scaledGrid;
    if (startX > 0) startX -= scaledGrid;
    let startY = this.panY % scaledGrid;
    if (startY > 0) startY -= scaledGrid;

    for (let x = startX; x < w; x += scaledGrid) {
      for (let y = startY; y < h; y += scaledGrid) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    const majorGrid = scaledGrid * 5;
    if (majorGrid >= 30) {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      let mStartX = this.panX % majorGrid;
      if (mStartX > 0) mStartX -= majorGrid;
      let mStartY = this.panY % majorGrid;
      if (mStartY > 0) mStartY -= majorGrid;

      for (let x = mStartX; x < w; x += majorGrid) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = mStartY; y < h; y += majorGrid) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
  }

  renderWires(ctx, vpLeft, vpTop, vpRight, vpBottom) {
    const junctionCounts = new Map();

    this.wires.forEach(wire => {
      const waypoints = this.getWireWaypoints(wire);
      if (waypoints.length === 0) return;

      const isSelected = this.selectedWire === wire;

      ctx.save();
      ctx.strokeStyle = isSelected ? '#007aff' : '#2b2d2f';
      ctx.lineWidth = isSelected ? 3.5 : 2.0;
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();
      ctx.restore();

      waypoints.forEach(pt => {
        const key = `${Math.round(pt.x)},${Math.round(pt.y)}`;
        junctionCounts.set(key, (junctionCounts.get(key) || 0) + 1);
      });
    });

    ctx.fillStyle = '#2b2d2f';
    junctionCounts.forEach((count, key) => {
      if (count >= 3) {
        const [jx, jy] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(jx, jy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 2.2 Render Node Numbers & Live Voltage Badges (Show Node Option)
    if (this.showNodeNumbers && this.engine && this.engine.pinToNodeMap) {
      const renderedNets = new Set();
      this.wires.forEach(wire => {
        const nodeId = this.engine.pinToNodeMap.get(wire.fromPin);
        if (nodeId === undefined || renderedNets.has(nodeId)) return;
        renderedNets.add(nodeId);

        const waypoints = this.getWireWaypoints(wire);
        if (waypoints.length < 2) return;

        // Midpoint of the primary wire span
        let bestSeg = { p1: waypoints[0], p2: waypoints[1], len: Math.hypot(waypoints[1].x - waypoints[0].x, waypoints[1].y - waypoints[0].y) };
        for (let i = 1; i < waypoints.length - 1; i++) {
          const l = Math.hypot(waypoints[i + 1].x - waypoints[i].x, waypoints[i + 1].y - waypoints[i].y);
          if (l > bestSeg.len) {
            bestSeg = { p1: waypoints[i], p2: waypoints[i + 1], len: l };
          }
        }

        const midX = (bestSeg.p1.x + bestSeg.p2.x) / 2;
        const midY = (bestSeg.p1.y + bestSeg.p2.y) / 2;
        const isSelected = this.selectedWire === wire;

        const label = nodeId === 0 ? '0 (GND)' : `${nodeId}`;
        let voltStr = '';
        if (this.engine.nodeVoltages && this.engine.nodeVoltages[nodeId] !== undefined) {
          const v = this.engine.nodeVoltages[nodeId];
          if (!isNaN(v) && isFinite(v)) {
            voltStr = formatValueWithPrefix(v, 'V');
          }
        }

        const displayText = isSelected && voltStr ? `Node ${label}: ${voltStr}` : `${label}`;

        ctx.save();
        ctx.font = 'bold 8.5px "Roboto Mono", monospace';
        const textWidth = ctx.measureText(displayText).width;
        const padX = 4;
        const boxW = textWidth + padX * 2;
        const boxH = 14;

        // Draw pill badge
        ctx.fillStyle = isSelected ? '#eff6ff' : (nodeId === 0 ? '#ecfdf5' : '#f8fafc');
        ctx.strokeStyle = isSelected ? '#3b82f6' : (nodeId === 0 ? '#10b981' : '#94a3b8');
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        const rx = midX - boxW / 2;
        const ry = midY - boxH / 2 - 8;
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, boxW, boxH, 3);
        } else {
          ctx.rect(rx, ry, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#1d4ed8' : (nodeId === 0 ? '#047857' : '#334155');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, midX, ry + boxH / 2);
        ctx.restore();
      });
    }
  }

  renderPins(ctx, vpLeft, vpTop, vpRight, vpBottom) {
    this.components.forEach(comp => {
      if (!comp.pins) return;
      comp.pins.forEach(pin => {
        const pos = this.getPinWorldPos(comp, pin);
        if (pos.x < vpLeft || pos.x > vpRight || pos.y < vpTop || pos.y > vpBottom) return;

        const pinKey = `${comp.id}:${pin.id}`;
        const isHovered = this.hoveredPin && this.hoveredPin.pinKey === pinKey;
        const isWiringSource = this.wiringStartPin && this.wiringStartPin.pinKey === pinKey;
        const isWiringTarget = this.hoveredTargetPin && this.hoveredTargetPin.pinKey === pinKey;

        ctx.save();
        if (isWiringSource) {
          ctx.fillStyle = '#ff9500';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (isWiringTarget) {
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (isHovered) {
          ctx.fillStyle = '#03b585';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = '#718096';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    });
  }

  // --- Professional IEEE / ANSI Vector Symbols ---
  renderComponent(ctx, comp) {
    ctx.save();
    ctx.translate(comp.x, comp.y);
    ctx.rotate((comp.rotation * Math.PI) / 180);

    const isSelected = this.selectedComponents.has(comp) || this.selectedComponent === comp;
    const isHovered = this.hoveredComponent === comp;

    if (isSelected) {
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(0, 122, 255, 0.08)';
      const hw = comp.width / 2 + 5;
      const hh = comp.height / 2 + 5;
      ctx.strokeRect(-hw, -hh, comp.width + 10, comp.height + 10);
      ctx.fillRect(-hw, -hh, comp.width + 10, comp.height + 10);
    } else if (isHovered) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.0;
      const hw = comp.width / 2 + 4;
      const hh = comp.height / 2 + 4;
      ctx.strokeRect(-hw, -hh, comp.width + 8, comp.height + 8);
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.0;
    ctx.fillStyle = '#ffffff';

    if (comp.flipX || comp.flipY) {
      ctx.scale(comp.flipX ? -1 : 1, comp.flipY ? -1 : 1);
    }

    if (comp.pulseAnimation) {
      const elapsed = performance.now() - comp.pulseAnimation.startTime;
      const prog = Math.min(elapsed / comp.pulseAnimation.duration, 1.0);
      if (prog < 1.0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 20 + prog * 24, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${1 - prog})`;
        ctx.lineWidth = 3.5 * (1 - prog);
        ctx.stroke();
        ctx.fillStyle = `rgba(6, 182, 212, ${(1 - prog) * 0.25})`;
        ctx.fill();
        ctx.restore();
        requestAnimationFrame(() => this.render());
      } else {
        comp.pulseAnimation = null;
      }
    }

    this.drawSymbol(ctx, comp);

    ctx.restore();
    this.renderLabels(ctx, comp);
  }

  drawSymbol(ctx, comp) {
    const p = comp.params || {};

    switch (comp.type) {
      case ComponentTypes.GROUND: {
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(0, 0);
        ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
        ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
        ctx.moveTo(-4, 10); ctx.lineTo(4, 10);
        ctx.stroke();
        break;
      }

      case ComponentTypes.POWER_VCC:
      case ComponentTypes.POWER_5V:
      case ComponentTypes.POWER_12V:
      case ComponentTypes.POWER_15V: {
        ctx.beginPath();
        ctx.moveTo(0, 15); ctx.lineTo(0, 0);
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
        ctx.moveTo(0, 0); ctx.lineTo(0, -10);
        ctx.stroke();
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        const label = comp.type === ComponentTypes.POWER_VCC ? 'VCC' : comp.type.replace('POWER_', '+');
        ctx.fillText(label, 0, -12);
        break;
      }

      case ComponentTypes.POWER_NEG12V:
      case ComponentTypes.POWER_NEG15V: {
        ctx.beginPath();
        ctx.moveTo(0, -15); ctx.lineTo(0, 0);
        ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type.replace('POWER_NEG', '-'), 0, 12);
        break;
      }

      case ComponentTypes.NET_LABEL: {
        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(0, 0);
        ctx.lineTo(20, 0); ctx.lineTo(26, -6); ctx.lineTo(20, -12); ctx.lineTo(0, -12);
        ctx.closePath();
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(p.label || 'NET', 3, -4);
        break;
      }

      case ComponentTypes.NODE:
      case ComponentTypes.JUNCTION: {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        break;
      }

      case ComponentTypes.DC_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#e11d48';
        ctx.textAlign = 'center';
        ctx.fillText('+', 0, -5);
        ctx.fillStyle = '#0f172a';
        ctx.fillText('-', 0, 12);
        break;
      }

      case ComponentTypes.AC_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(-10, 0);
        ctx.bezierCurveTo(-5, -10, 0, -10, 0, 0);
        ctx.bezierCurveTo(0, 10, 5, 10, 10, 0);
        ctx.stroke();
        break;
      }

      case ComponentTypes.CLOCK_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(-10, 5); ctx.lineTo(-10, -5); ctx.lineTo(0, -5); ctx.lineTo(0, 5); ctx.lineTo(10, 5); ctx.lineTo(10, -5);
        ctx.stroke();
        break;
      }

      case ComponentTypes.TRIANGLE_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(-10, 6); ctx.lineTo(0, -8); ctx.lineTo(10, 6);
        ctx.stroke();
        break;
      }

      case ComponentTypes.SAWTOOTH_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(-10, 6); ctx.lineTo(5, -8); ctx.lineTo(5, 6);
        ctx.stroke();
        break;
      }

      case ComponentTypes.CLOCK_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        // Clock pulse icon
        ctx.moveTo(-10, 5); ctx.lineTo(-10, -5); ctx.lineTo(-3, -5); ctx.lineTo(-3, 5); ctx.lineTo(4, 5); ctx.lineTo(4, -5); ctx.lineTo(10, -5);
        ctx.stroke();
        break;
      }

      case ComponentTypes.PULSE_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(-10, 6); ctx.lineTo(-10, -6); ctx.lineTo(-2, -6); ctx.lineTo(-2, 6); ctx.lineTo(10, 6);
        ctx.stroke();
        break;
      }

      case ComponentTypes.TRIGGER_PULSE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#f0fdf4';
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.stroke();

        // Inner trigger button circle
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#047857';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        break;
      }

      case ComponentTypes.AM_VOLTAGE:
      case ComponentTypes.FM_VOLTAGE:
      case ComponentTypes.NOISE_VOLTAGE: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type.replace('_VOLTAGE', ''), 0, 3);
        break;
      }

      case ComponentTypes.DC_CURRENT:
      case ComponentTypes.AC_CURRENT: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -18);
        ctx.moveTo(0, 18); ctx.lineTo(0, 30);
        ctx.moveTo(0, 8); ctx.lineTo(0, -8);
        ctx.moveTo(-4, -2); ctx.lineTo(0, -8); ctx.lineTo(4, -2);
        ctx.stroke();
        if (comp.type === ComponentTypes.AC_CURRENT) {
          ctx.font = 'bold 8px sans-serif';
          ctx.fillStyle = '#0284c7';
          ctx.fillText('AC', 8, 4);
        }
        break;
      }

      case ComponentTypes.VCVS:
      case ComponentTypes.VCCS: {
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(20, 0); ctx.lineTo(0, 20); ctx.lineTo(-20, 0);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-25, -15); ctx.lineTo(-12, -15);
        ctx.moveTo(-25, 15); ctx.lineTo(-12, 15);
        ctx.moveTo(25, -15); ctx.lineTo(12, -15);
        ctx.moveTo(25, 15); ctx.lineTo(12, 15);
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type === ComponentTypes.VCVS ? 'E' : 'G', 0, 3);
        break;
      }

      case ComponentTypes.BATTERY_CELL: {
        ctx.beginPath();
        ctx.moveTo(0, -25); ctx.lineTo(0, -8);
        ctx.moveTo(0, 8); ctx.lineTo(0, 25);
        ctx.moveTo(-16, -8); ctx.lineTo(16, -8);
        ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
        ctx.moveTo(-16, 8); ctx.lineTo(16, 8);
        ctx.stroke();
        break;
      }

      case ComponentTypes.RESISTOR: {
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(-20, 0);
        ctx.lineTo(-16, -8); ctx.lineTo(-8, 8); ctx.lineTo(0, -8); ctx.lineTo(8, 8); ctx.lineTo(16, -8); ctx.lineTo(20, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
        break;
      }

      case ComponentTypes.POTENTIOMETER: {
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(-20, 0);
        ctx.lineTo(-16, -8); ctx.lineTo(-8, 8); ctx.lineTo(0, -8); ctx.lineTo(8, 8); ctx.lineTo(16, -8); ctx.lineTo(20, 0);
        ctx.lineTo(30, 0);
        ctx.moveTo(0, -20); ctx.lineTo(0, -8);
        ctx.lineTo(-3, -12); ctx.moveTo(0, -8); ctx.lineTo(3, -12);
        ctx.stroke();
        break;
      }

      case ComponentTypes.CAPACITOR: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-6, 0);
        ctx.moveTo(6, 0); ctx.lineTo(20, 0);
        ctx.moveTo(-6, -14); ctx.lineTo(-6, 14);
        ctx.moveTo(6, -14); ctx.lineTo(6, 14);
        ctx.stroke();
        break;
      }

      case ComponentTypes.POLARIZED_CAP: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-6, 0);
        ctx.moveTo(6, 0); ctx.lineTo(20, 0);
        ctx.moveTo(-6, -14); ctx.lineTo(-6, 14);
        ctx.moveTo(6, -14); ctx.quadraticCurveTo(2, 0, 6, 14);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#e11d48';
        ctx.fillText('+', -12, -8);
        break;
      }

      case ComponentTypes.TANTALUM_CAP: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-6, 0);
        ctx.moveTo(6, 0); ctx.lineTo(20, 0);
        ctx.moveTo(-6, -14); ctx.lineTo(-6, 14);
        ctx.moveTo(6, -14); ctx.quadraticCurveTo(2, 0, 6, 14);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('+Ta', -12, -8);
        break;
      }

      case ComponentTypes.COUPLED_INDUCTOR: {
        ctx.beginPath();
        ctx.moveTo(-30, -15); ctx.lineTo(-20, -15);
        for (let i = 0; i < 3; i++) {
          const startX = -20 + i * 10;
          ctx.arc(startX + 5, -15, 5, Math.PI, 0, false);
        }
        ctx.lineTo(30, -15);

        ctx.moveTo(-30, 15); ctx.lineTo(-20, 15);
        for (let i = 0; i < 3; i++) {
          const startX = -20 + i * 10;
          ctx.arc(startX + 5, 15, 5, Math.PI, 0, false);
        }
        ctx.lineTo(30, 15);

        ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
        ctx.stroke();
        break;
      }

      case ComponentTypes.CRYSTAL: {
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0); ctx.lineTo(25, 0);
        ctx.moveTo(-10, -12); ctx.lineTo(-10, 12);
        ctx.moveTo(10, -12); ctx.lineTo(10, 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(-6, -10, 12, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();
        break;
      }

      case ComponentTypes.FUSE: {
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-15, 0);
        ctx.moveTo(15, 0); ctx.lineTo(25, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(-15, -6, 30, 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
        ctx.stroke();
        break;
      }

      case ComponentTypes.NTC_THERMISTOR: {
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-15, 0);
        ctx.lineTo(-10, -6); ctx.lineTo(0, 6); ctx.lineTo(10, -6); ctx.lineTo(15, 0);
        ctx.lineTo(25, 0);
        ctx.moveTo(-16, 10); ctx.lineTo(-8, 10); ctx.lineTo(16, -10);
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.fillText('-t°', 12, -12);
        break;
      }

      case ComponentTypes.PHOTORESISTOR_LDR: {
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-15, 0);
        ctx.lineTo(-10, -6); ctx.lineTo(0, 6); ctx.lineTo(10, -6); ctx.lineTo(15, 0);
        ctx.lineTo(25, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, -18); ctx.lineTo(-2, -10);
        ctx.moveTo(-4, -18); ctx.lineTo(4, -10);
        ctx.stroke();
        break;
      }

      case ComponentTypes.INDUCTOR: {
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(-20, 0);
        for (let i = 0; i < 4; i++) {
          const startX = -20 + i * 10;
          ctx.arc(startX + 5, 0, 5, Math.PI, 0, false);
        }
        ctx.lineTo(30, 0);
        ctx.stroke();
        break;
      }

      case ComponentTypes.TRANSFORMER:
      case ComponentTypes.TRANSFORMER_CENTER_TAP: {
        ctx.beginPath();
        ctx.moveTo(-30, -20); ctx.lineTo(-15, -20);
        for (let i = 0; i < 3; i++) {
          ctx.arc(-15, -15 + i * 15, 7.5, Math.PI * 1.5, Math.PI * 0.5, false);
        }
        ctx.lineTo(-30, 20);

        ctx.moveTo(30, -20); ctx.lineTo(15, -20);
        for (let i = 0; i < 3; i++) {
          ctx.arc(15, -15 + i * 15, 7.5, Math.PI * 1.5, Math.PI * 0.5, true);
        }
        ctx.lineTo(30, 20);

        if (comp.type === ComponentTypes.TRANSFORMER_CENTER_TAP) {
          ctx.moveTo(15, 0); ctx.lineTo(30, 0);
        }

        ctx.moveTo(-2, -22); ctx.lineTo(-2, 22);
        ctx.moveTo(2, -22); ctx.lineTo(2, 22);
        ctx.stroke();
        break;
      }

      case ComponentTypes.DIODE:
      case ComponentTypes.SCHOTTKY:
      case ComponentTypes.ZENER:
      case ComponentTypes.LED: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-8, 0);
        ctx.moveTo(8, 0); ctx.lineTo(20, 0);
        ctx.moveTo(-8, -12); ctx.lineTo(8, 0); ctx.lineTo(-8, 12);
        ctx.closePath();
        ctx.fillStyle = '#e11d48';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        if (comp.type === ComponentTypes.ZENER) {
          ctx.moveTo(8, -12); ctx.lineTo(8, 12); ctx.lineTo(4, 12); ctx.moveTo(8, -12); ctx.lineTo(12, -12);
        } else if (comp.type === ComponentTypes.SCHOTTKY) {
          ctx.moveTo(8, -12); ctx.lineTo(8, 12); ctx.lineTo(5, 12); ctx.lineTo(5, 8); ctx.moveTo(8, -12); ctx.lineTo(11, -12); ctx.lineTo(11, -8);
        } else {
          ctx.moveTo(8, -12); ctx.lineTo(8, 12);
        }
        ctx.stroke();

        if (comp.type === ComponentTypes.LED) {
          ctx.beginPath();
          ctx.moveTo(2, -12); ctx.lineTo(10, -20);
          ctx.moveTo(8, -12); ctx.lineTo(16, -20);
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.BRIDGE_RECTIFIER: {
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(20, 0); ctx.lineTo(0, 20); ctx.lineTo(-20, 0);
        ctx.closePath();
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-25, -15); ctx.lineTo(-10, -10);
        ctx.moveTo(-25, 15); ctx.lineTo(-10, 10);
        ctx.moveTo(25, -15); ctx.lineTo(10, -10);
        ctx.moveTo(25, 15); ctx.lineTo(10, 10);
        ctx.stroke();
        break;
      }

      case ComponentTypes.BJT_NPN:
      case ComponentTypes.BJT_PNP: {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-6, 0);
        ctx.moveTo(-6, -14); ctx.lineTo(-6, 14);
        ctx.moveTo(-6, -6); ctx.lineTo(15, -25);
        ctx.moveTo(-6, 6); ctx.lineTo(15, 25);
        ctx.stroke();

        ctx.beginPath();
        if (comp.type === ComponentTypes.BJT_NPN) {
          ctx.moveTo(11, 21); ctx.lineTo(15, 25); ctx.lineTo(8, 25);
        } else {
          ctx.moveTo(0, 11); ctx.lineTo(-6, 6); ctx.lineTo(-3, 13);
        }
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.stroke();
        break;
      }

      case ComponentTypes.NMOS:
      case ComponentTypes.PMOS: {
        ctx.beginPath();
        ctx.moveTo(-20, 10); ctx.lineTo(-8, 10);
        ctx.moveTo(-8, -14); ctx.lineTo(-8, 14);
        ctx.moveTo(4, -14); ctx.lineTo(4, 14);
        ctx.moveTo(4, -14); ctx.lineTo(15, -14); ctx.lineTo(15, -25);
        ctx.moveTo(4, 14); ctx.lineTo(15, 14); ctx.lineTo(15, 25);
        ctx.moveTo(4, 0); ctx.lineTo(15, 0); ctx.lineTo(15, 14);
        ctx.stroke();
        break;
      }

      case ComponentTypes.DARLINGTON_NPN: {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-10, 0);
        ctx.moveTo(-10, -10); ctx.lineTo(-10, 10);
        ctx.moveTo(0, -14); ctx.lineTo(0, 14);
        ctx.moveTo(-10, -4); ctx.lineTo(15, -25);
        ctx.moveTo(-10, 4); ctx.lineTo(0, 0);
        ctx.moveTo(0, -4); ctx.lineTo(15, -25);
        ctx.moveTo(0, 6); ctx.lineTo(15, 25);
        ctx.stroke();
        break;
      }

      case ComponentTypes.NJFET:
      case ComponentTypes.PJFET: {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-20, 10); ctx.lineTo(-4, 10);
        ctx.moveTo(-4, -14); ctx.lineTo(-4, 14);
        ctx.moveTo(-4, -10); ctx.lineTo(15, -25);
        ctx.moveTo(-4, 10); ctx.lineTo(15, 25);
        ctx.stroke();
        ctx.beginPath();
        if (comp.type === ComponentTypes.NJFET) {
          ctx.moveTo(-12, 10); ctx.lineTo(-6, 7); ctx.lineTo(-6, 13);
        } else {
          ctx.moveTo(-4, 10); ctx.lineTo(-10, 7); ctx.lineTo(-10, 13);
        }
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.stroke();
        break;
      }

      case ComponentTypes.SCR:
      case ComponentTypes.TRIAC: {
        ctx.beginPath();
        ctx.moveTo(-20, -15); ctx.lineTo(-8, -15);
        ctx.moveTo(8, -15); ctx.lineTo(20, -15);
        ctx.moveTo(-8, -25); ctx.lineTo(8, -15); ctx.lineTo(-8, -5);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -25); ctx.lineTo(8, -5);
        ctx.moveTo(0, -10); ctx.lineTo(0, 15); ctx.lineTo(-10, 25);
        ctx.stroke();
        break;
      }

      case ComponentTypes.DIAC: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-8, 0);
        ctx.moveTo(8, 0); ctx.lineTo(20, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -10); ctx.lineTo(4, 0); ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -10); ctx.lineTo(-4, 0); ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case ComponentTypes.OPAMP:
      case ComponentTypes.COMPARATOR: {
        ctx.beginPath();
        // Input and Output Lead lines
        ctx.moveTo(-30, -15); ctx.lineTo(-20, -15);
        ctx.moveTo(-30, 15); ctx.lineTo(-20, 15);
        ctx.moveTo(20, 0); ctx.lineTo(30, 0);
        // Power rail leads
        ctx.moveTo(0, -25); ctx.lineTo(0, -12);
        ctx.moveTo(0, 25); ctx.lineTo(0, 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-20, -25); ctx.lineTo(20, 0); ctx.lineTo(-20, 25);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('-', -12, -10);
        ctx.fillText('+', -12, 18);

        ctx.font = '7.5px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('V+', 0, -4);
        ctx.fillText('V-', 0, 10);
        break;
      }

      case ComponentTypes.TIMER555: {
        ctx.beginPath();
        ctx.rect(-35, -40, 70, 80);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#03b585';
        ctx.textAlign = 'center';
        ctx.fillText('LM555', 0, -5);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('TIMER', 0, 10);
        break;
      }

      case ComponentTypes.AND_GATE:
      case ComponentTypes.NAND_GATE: {
        ctx.beginPath();
        ctx.moveTo(-25, -18); ctx.lineTo(0, -18);
        ctx.arc(0, 0, 18, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(-25, 18);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        if (comp.type === ComponentTypes.NAND_GATE || comp.type === ComponentTypes.NAND3_GATE) {
          ctx.beginPath();
          ctx.arc(21, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.AND3_GATE:
      case ComponentTypes.NAND3_GATE: {
        ctx.beginPath();
        ctx.moveTo(-25, -20); ctx.lineTo(0, -20);
        ctx.arc(0, 0, 20, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(-25, 20);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        if (comp.type === ComponentTypes.NAND3_GATE) {
          ctx.beginPath();
          ctx.arc(23, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.OR_GATE:
      case ComponentTypes.NOR_GATE:
      case ComponentTypes.OR3_GATE:
      case ComponentTypes.NOR3_GATE: {
        ctx.beginPath();
        ctx.moveTo(-25, -18);
        ctx.quadraticCurveTo(0, -18, 20, 0);
        ctx.quadraticCurveTo(0, 18, -25, 18);
        ctx.quadraticCurveTo(-15, 0, -25, -18);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        if (comp.type === ComponentTypes.NOR_GATE || comp.type === ComponentTypes.NOR3_GATE) {
          ctx.beginPath();
          ctx.arc(23, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.NOT_GATE:
      case ComponentTypes.BUFFER_GATE: {
        ctx.beginPath();
        ctx.moveTo(-20, -14); ctx.lineTo(comp.type === ComponentTypes.NOT_GATE ? 12 : 18, 0); ctx.lineTo(-20, 14);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        if (comp.type === ComponentTypes.NOT_GATE) {
          ctx.beginPath();
          ctx.arc(16, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.SCHMITT_TRIGGER: {
        ctx.beginPath();
        ctx.moveTo(-22, -16); ctx.lineTo(12, 0); ctx.lineTo(-22, 16);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        if (p.isInverting ?? true) {
          ctx.beginPath();
          ctx.arc(16, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        // Schmitt hysteresis symbol inside body
        ctx.beginPath();
        ctx.moveTo(-13, 4); ctx.lineTo(-6, 4); ctx.lineTo(-6, -4); ctx.lineTo(1, -4);
        ctx.moveTo(1, -4); ctx.lineTo(-2, -4); ctx.lineTo(-2, 4); ctx.lineTo(-13, 4);
        ctx.lineWidth = 1.3;
        ctx.stroke();
        break;
      }

      case ComponentTypes.XOR_GATE:
      case ComponentTypes.XNOR_GATE: {
        ctx.beginPath();
        ctx.moveTo(-22, -18);
        ctx.quadraticCurveTo(3, -18, 20, 0);
        ctx.quadraticCurveTo(3, 18, -22, 18);
        ctx.quadraticCurveTo(-12, 0, -22, -18);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-27, -18);
        ctx.quadraticCurveTo(-17, 0, -27, 18);
        ctx.stroke();

        if (comp.type === ComponentTypes.XNOR_GATE) {
          ctx.beginPath();
          ctx.arc(23, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      case ComponentTypes.SPST_SWITCH: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0); ctx.lineTo(20, 0);
        ctx.arc(-10, 0, 2.5, 0, Math.PI * 2);
        ctx.arc(10, 0, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        if (p.closed) ctx.lineTo(10, 0);
        else ctx.lineTo(8, -12);
        ctx.stroke();
        break;
      }

      case ComponentTypes.PUSH_BUTTON:
      case ComponentTypes.PUSH_BUTTON_NC: {
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0); ctx.lineTo(20, 0);
        ctx.arc(-10, 0, 2.5, 0, Math.PI * 2);
        ctx.arc(10, 0, 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Push button contact bar & stalk
        const isClosed = p.closed ?? (comp.type === ComponentTypes.PUSH_BUTTON_NC);
        ctx.beginPath();
        if (isClosed) {
          ctx.moveTo(-10, -3); ctx.lineTo(10, -3);
          ctx.moveTo(0, -3); ctx.lineTo(0, -14);
        } else {
          ctx.moveTo(-10, -10); ctx.lineTo(10, -10);
          ctx.moveTo(0, -10); ctx.lineTo(0, -18);
        }
        ctx.moveTo(-4, isClosed ? -14 : -18); ctx.lineTo(4, isClosed ? -14 : -18);
        ctx.stroke();
        break;
      }

      case ComponentTypes.SPDT_SWITCH: {
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-12, 0);
        ctx.moveTo(12, -15); ctx.lineTo(25, -15);
        ctx.moveTo(12, 15); ctx.lineTo(25, 15);
        ctx.arc(-12, 0, 2.5, 0, Math.PI * 2);
        ctx.arc(12, -15, 2.5, 0, Math.PI * 2);
        ctx.arc(12, 15, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        if (p.position === 2) ctx.lineTo(12, 15);
        else ctx.lineTo(12, -15);
        ctx.stroke();
        break;
      }

      case ComponentTypes.TIMER555: {
        ctx.beginPath();
        ctx.rect(-35, -40, 70, 80);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 7.5px sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.textAlign = 'left';
        ctx.fillText('GND', -30, -28);
        ctx.fillText('TRIG', -30, -8);
        ctx.fillText('THRES', -30, 12);
        ctx.fillText('DISCH', -30, 32);

        ctx.textAlign = 'right';
        ctx.fillText('OUT', 30, -28);
        ctx.fillText('RST', 30, -8);
        ctx.fillText('CTRL', 30, 12);
        ctx.fillText('VCC', 30, 32);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('NE555', 0, 4);
        break;
      }

      case ComponentTypes.TIMER556: {
        ctx.beginPath();
        ctx.rect(-40, -50, 80, 100);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('NE556', 0, 4);
        break;
      }

      case ComponentTypes.ANALOG_MULTIPLIER: {
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-30, -12); ctx.lineTo(-20, -12);
        ctx.moveTo(-30, 12); ctx.lineTo(-20, 12);
        ctx.moveTo(20, 0); ctx.lineTo(30, 0);
        ctx.stroke();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('✕', 0, 5);
        break;
      }

      case ComponentTypes.LM7805:
      case ComponentTypes.LM7812:
      case ComponentTypes.LM7912:
      case ComponentTypes.LM317: {
        ctx.beginPath();
        ctx.rect(-30, -20, 60, 40);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(-30, 0);
        ctx.moveTo(30, 0); ctx.lineTo(30, 0);
        ctx.moveTo(0, 20); ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#03b585';
        ctx.textAlign = 'center';
        const label = comp.type.replace('LM', '').replace('ComponentTypes.', '');
        ctx.fillText(label, 0, 4);
        break;
      }

      case ComponentTypes.SR_LATCH:
      case ComponentTypes.T_FLIPFLOP:
      case ComponentTypes.D_FLIPFLOP:
      case ComponentTypes.JK_FLIPFLOP: {
        ctx.beginPath();
        ctx.rect(-25, -30, 50, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        // Clock dynamic triangle symbol for edge-triggered flip-flops
        if (comp.type !== ComponentTypes.SR_LATCH) {
          ctx.beginPath();
          const clkY = (comp.type === ComponentTypes.T_FLIPFLOP || comp.type === ComponentTypes.D_FLIPFLOP) ? 15 : 0;
          ctx.moveTo(-25, clkY - 5);
          ctx.lineTo(-17, clkY);
          ctx.lineTo(-25, clkY + 5);
          ctx.stroke();
        }
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        let label = 'D-FF';
        if (comp.type === ComponentTypes.SR_LATCH) label = 'SR-LATCH';
        else if (comp.type === ComponentTypes.T_FLIPFLOP) label = 'T-FF';
        else if (comp.type === ComponentTypes.JK_FLIPFLOP) label = 'JK-FF';
        ctx.fillText(label, 0, -5);
        break;
      }

      case ComponentTypes.BINARY_COUNTER_4BIT:
      case ComponentTypes.MUX_4TO1:
      case ComponentTypes.HALF_ADDER:
      case ComponentTypes.FULL_ADDER: {
        ctx.beginPath();
        ctx.rect(-comp.width / 2, -comp.height / 2, comp.width, comp.height);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.textAlign = 'center';
        let nameTag = 'ALU';
        if (comp.type === ComponentTypes.BINARY_COUNTER_4BIT) nameTag = '74HC161';
        else if (comp.type === ComponentTypes.MUX_4TO1) nameTag = '4:1 MUX';
        else if (comp.type === ComponentTypes.HALF_ADDER) nameTag = 'HALF ADD';
        else if (comp.type === ComponentTypes.FULL_ADDER) nameTag = 'FULL ADD';
        ctx.fillText(nameTag, 0, 3);
        break;
      }

      case ComponentTypes.RELAY_SPDT: {
        ctx.beginPath();
        ctx.rect(-30, -30, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        // Coil
        ctx.moveTo(-30, -15); ctx.lineTo(-15, -15);
        ctx.moveTo(-30, 15); ctx.lineTo(-15, 15);
        ctx.rect(-15, -12, 10, 24);
        // Switch contact
        ctx.moveTo(30, 0); ctx.lineTo(15, 0);
        ctx.lineTo(5, -15);
        ctx.moveTo(30, -20); ctx.lineTo(15, -20);
        ctx.moveTo(30, 20); ctx.lineTo(15, 20);
        ctx.stroke();
        break;
      }

      case ComponentTypes.OPTOCOUPLER: {
        ctx.beginPath();
        ctx.rect(-30, -25, 60, 50);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
        // LED side
        ctx.beginPath();
        ctx.moveTo(-18, -10); ctx.lineTo(-6, 0); ctx.lineTo(-18, 10);
        ctx.closePath();
        ctx.fillStyle = '#e11d48';
        ctx.fill();
        ctx.stroke();
        // Phototransistor side
        ctx.beginPath();
        ctx.moveTo(12, -15); ctx.lineTo(12, 15);
        ctx.moveTo(12, -8); ctx.lineTo(25, -15);
        ctx.moveTo(12, 8); ctx.lineTo(25, 15);
        ctx.stroke();
        break;
      }

      case ComponentTypes.SEVEN_SEGMENT: {
        ctx.beginPath();
        ctx.rect(-28, -38, 56, 76);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.stroke();

        const getSegLit = (segKey) => {
          if (!this.engine || !this.engine.nodeVoltages) return false;
          const n = this.engine.getNode(comp, segKey);
          const nG = this.engine.getNode(comp, 'gnd');
          const v = n !== -1 ? (this.engine.nodeVoltages[n] || 0) : 0;
          const vg = nG !== -1 ? (this.engine.nodeVoltages[nG] || 0) : 0;
          return (v - vg) > 1.8;
        };

        const onColor = p.color || '#ff3b30';
        const offColor = 'rgba(255, 59, 48, 0.12)';

        const drawSeg = (lit, x1, y1, x2, y2) => {
          ctx.beginPath();
          ctx.strokeStyle = lit ? onColor : offColor;
          ctx.lineWidth = 4.0;
          ctx.lineCap = 'round';
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.stroke();
        };

        drawSeg(getSegLit('a'), -12, -26, 12, -26); // a
        drawSeg(getSegLit('b'), 13, -24, 13, -3);   // b
        drawSeg(getSegLit('c'), 13, 3, 13, 24);    // c
        drawSeg(getSegLit('d'), -12, 26, 12, 26);   // d
        drawSeg(getSegLit('e'), -13, 3, -13, 24);  // e
        drawSeg(getSegLit('f'), -13, -24, -13, -3); // f
        drawSeg(getSegLit('g'), -12, 0, 12, 0);    // g

        // Decimal Point (DP)
        ctx.fillStyle = getSegLit('dp') ? onColor : offColor;
        ctx.beginPath();
        ctx.arc(20, 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ComponentTypes.PROBE_V:
      case ComponentTypes.PROBE_I: {
        ctx.beginPath();
        ctx.moveTo(0, 20); ctx.lineTo(-12, 0); ctx.lineTo(-12, -18); ctx.lineTo(12, -18); ctx.lineTo(12, 0);
        ctx.closePath();
        ctx.fillStyle = p.color || (comp.type === ComponentTypes.PROBE_V ? '#03b585' : '#ff9500');
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type === ComponentTypes.PROBE_V ? 'V' : 'I', 0, -5);
        break;
      }

      case ComponentTypes.VOLTMETER:
      case ComponentTypes.AMMETER: {
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(-18, 0);
        ctx.moveTo(18, 0); ctx.lineTo(25, 0);
        ctx.stroke();

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = comp.type === ComponentTypes.VOLTMETER ? '#0284c7' : '#e11d48';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type === ComponentTypes.VOLTMETER ? 'V' : 'A', 0, 4);
        break;
      }

      default: {
        ctx.beginPath();
        ctx.rect(-comp.width / 2, -comp.height / 2, comp.width, comp.height);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(comp.name, 0, 3);
        break;
      }
    }
  }

  renderLabels(ctx, comp) {
    if (comp.type === ComponentTypes.NODE || comp.type === ComponentTypes.JUNCTION) {
      if (!comp.params?.label) return;
      ctx.save();
      ctx.font = 'bold 9px Lato, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0284c7';
      ctx.fillText(comp.params.label, comp.x, comp.y - 8);
      ctx.restore();
      return;
    }

    const p = comp.params || {};
    const effHeight = ((comp.rotation || 0) % 180 !== 0) ? (comp.width || 40) : (comp.height || 40);

    ctx.save();
    ctx.font = 'bold 11px Lato, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';

    ctx.fillText(comp.name, comp.x, comp.y - (effHeight / 2 + 8));

    let valueStr = '';
    if (p.resistance) valueStr = formatValueWithPrefix(p.resistance, 'Ω');
    else if (p.capacitance) valueStr = formatValueWithPrefix(p.capacitance, 'F');
    else if (p.inductance) valueStr = formatValueWithPrefix(p.inductance, 'H');
    else if (p.voltage !== undefined) valueStr = formatValueWithPrefix(p.voltage, 'V');
    else if (p.amplitude !== undefined) valueStr = `${formatValueWithPrefix(p.amplitude, 'V')}${p.frequency ? ` @ ${formatValueWithPrefix(p.frequency, 'Hz')}` : ''}`;
    else if (p.frequency !== undefined) valueStr = formatValueWithPrefix(p.frequency, 'Hz');
    else if (p.model) valueStr = p.model;
    else if (p.label) valueStr = p.label;

    if (valueStr) {
      ctx.font = '10px Lato, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(valueStr, comp.x, comp.y + (effHeight / 2 + 14));
    }

    ctx.restore();
  }
}
