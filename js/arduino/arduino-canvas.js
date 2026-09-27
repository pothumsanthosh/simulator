/**
 * e-Samastha — Interactive Hardware Canvas & Dynamic Wiring System
 * 
 * Features:
 * - Authentic Arduino UNO, Nano, and Mega 2560 board rendering
 * - Pin-to-pin drag-and-drop wire creation with smart color coding
 * - Wire selection, deletion, and component movement with persistent wires
 * - Real-time animated components: LEDs (PWM glow), Servo (rotating horn),
 *   DC Motor (spinning rotor), Buzzer (sound waves), LCD 16x2 & OLED display matrices
 * - Physical stimulus widgets: Button click, Potentiometer dial, Sensor sliders
 * - Power & Ground check warnings
 */

import { ComponentFactory, ComponentType } from './arduino-components.js';

export class ArduinoCanvas {
  constructor(canvasElement, board, interpreter) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.board = board;
    this.interpreter = interpreter;
    this.components = [];
    this.wires = [];

    // Board position & dimensions on canvas
    this.boardRect = { x: 30, y: 70, w: 320, h: 220 };

    // Pin header physical coordinates
    this.pinPositions = new Map();
    this.computePinPositions();

    // Interaction & Wiring State
    this.isDragging = false;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoverTarget = null;

    // Interactive Wiring & Selection
    this.wiringStart = null; // { compId, terminal, x, y, boardPin }
    this.wiringCurrent = null; // { x, y }
    this.selectedWireIndex = -1;
    this.selectedComponent = null;

    this.highlightPin = null;

    this.initEventListeners();

    this.board.subscribe(() => {
      this.requestRender();
    });

    this.animFrameId = null;
  }

  computePinPositions() {
    this.pinPositions.clear();
    const bx = this.boardRect.x;
    const by = this.boardRect.y;

    if (this.board.type === 'UNO') {
      this.boardRect = { x: 30, y: 70, w: 330, h: 220 };
      // Top Digital Header
      const topPins = ['AREF', 'GND_TOP', '13', '12', '11', '10', '9', '8', 'GAP', '7', '6', '5', '4', '3', '2', '1', '0'];
      let curX = bx + 95;
      for (const p of topPins) {
        if (p === 'GAP') { curX += 8; continue; }
        this.pinPositions.set(p === 'GND_TOP' ? 'GND' : p, { x: curX, y: by + 12, label: p === 'GND_TOP' ? 'GND' : p });
        curX += 12;
      }
      // Bottom Power & Analog Header
      const pwrPins = ['RESET', '3.3V', '5V', 'GND', 'VIN'];
      curX = bx + 120;
      for (const p of pwrPins) {
        this.pinPositions.set(p, { x: curX, y: by + this.boardRect.h - 12, label: p });
        curX += 13;
      }
      curX += 15;
      for (let i = 0; i <= 5; i++) {
        const pName = `A${i}`;
        this.pinPositions.set(pName, { x: curX, y: by + this.boardRect.h - 12, label: pName });
        curX += 13;
      }
    } else if (this.board.type === 'NANO') {
      this.boardRect = { x: 30, y: 70, w: 220, h: 260 };
      // Nano Left header (D1-D12, RESET, GND, VIN)
      const leftPins = ['VIN', 'GND', 'RESET', '+5V', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'AREF', '3.3V', '13'];
      let curY = by + 25;
      for (const p of leftPins) {
        const key = p === '+5V' ? '5V' : p;
        this.pinPositions.set(key, { x: bx + 10, y: curY, label: p });
        curY += 15;
      }
      // Nano Right header (D0, D1, etc.)
      const rightPins = ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'GND', 'RESET', '0', '1'];
      curY = by + 25;
      for (const p of rightPins) {
        this.pinPositions.set(p, { x: bx + this.boardRect.w - 10, y: curY, label: p });
        curY += 15;
      }
    } else if (this.board.type === 'MEGA') {
      this.boardRect = { x: 20, y: 60, w: 380, h: 250 };
      // Standard UNO pin block
      let curX = bx + 95;
      for (let i = 13; i >= 0; i--) {
        this.pinPositions.set(String(i), { x: curX, y: by + 12, label: `D${i}` });
        curX += 11;
      }
      this.pinPositions.set('GND', { x: curX, y: by + 12, label: 'GND' });
      this.pinPositions.set('5V', { x: bx + 120, y: by + this.boardRect.h - 12, label: '5V' });
      this.pinPositions.set('3.3V', { x: bx + 105, y: by + this.boardRect.h - 12, label: '3.3V' });
      curX = bx + 150;
      for (let a = 0; a <= 15; a++) {
        this.pinPositions.set(`A${a}`, { x: curX, y: by + this.boardRect.h - 12, label: `A${a}` });
        curX += 11;
      }
    }
  }

  setPreset(preset) {
    this.components = [];
    this.wires = [];
    this.selectedComponent = null;
    this.selectedWireIndex = -1;

    if (preset.components) {
      for (const compData of preset.components) {
        const comp = ComponentFactory.create(
          compData.type,
          compData.id,
          compData.name,
          compData.x,
          compData.y
        );
        if (compData.state) {
          Object.assign(comp.state, compData.state);
        }
        this.components.push(comp);
      }

      if (preset.wires) {
        this.wires = JSON.parse(JSON.stringify(preset.wires));
        for (const w of this.wires) {
          const [cId, term] = w.from.split('.');
          const c = this.components.find(x => x.id === cId);
          if (c) c.connect(term, w.to);
        }
      }
      this.requestRender();
    }
  }

  addComponent(type, name, x, y) {
    const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const compX = x !== undefined ? x : 380 + (this.components.length % 3) * 95;
    const compY = y !== undefined ? y : 45 + (Math.floor(this.components.length / 3) % 4) * 85;
    const comp = ComponentFactory.create(type, id, name, compX, compY);
    this.components.push(comp);
    this.selectedComponent = comp;
    this.selectedWireIndex = -1;
    this.requestRender();
    return comp;
  }

  removeComponent(compOrId) {
    const comp = typeof compOrId === 'string' ? this.components.find(c => c.id === compOrId) : compOrId;
    if (!comp) return;
    this.wires = this.wires.filter(w => {
      const [cId, term] = w.from.split('.');
      if (cId === comp.id) {
        comp.disconnect(term);
        return false;
      }
      return true;
    });
    const idx = this.components.indexOf(comp);
    if (idx >= 0) this.components.splice(idx, 1);
    if (this.selectedComponent === comp) this.selectedComponent = null;
    this.requestRender();
  }

  deleteSelectedComponent() {
    if (this.selectedComponent) {
      this.removeComponent(this.selectedComponent);
      this.selectedComponent = null;
    }
  }

  clearComponentsAndWires() {
    this.wires = [];
    this.components = [];
    this.selectedComponent = null;
    this.selectedWireIndex = -1;
    this.requestRender();
  }

  initEventListeners() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      this.handleMouseDown(pos, e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      this.handleMouseMove(pos);
    });

    window.addEventListener('mouseup', (e) => {
      const pos = getPos(e);
      this.handleMouseUp(pos);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
          return;
        }
        if (this.selectedWireIndex >= 0) {
          this.deleteSelectedWire();
        } else if (this.selectedComponent) {
          this.deleteSelectedComponent();
        }
      }
    });
  }

  handleMouseDown(pos, e) {
    // 1. Check if clicking on a Terminal to START WIRING
    const termHit = this.hitTestTerminal(pos);
    if (termHit) {
      this.wiringStart = termHit;
      this.wiringCurrent = { x: pos.x, y: pos.y };
      return;
    }

    // 2. Check Interactive Components
    for (const comp of this.components) {
      // Pushbutton
      if (comp.type === 'BUTTON') {
        const cx = comp.x + comp.width / 2;
        const cy = comp.y + comp.height / 2;
        if (Math.hypot(pos.x - cx, pos.y - cy) <= 22) {
          this.selectedComponent = comp;
          this.selectedWireIndex = -1;
          comp.setPressed(true, this.board);
          this.dragTarget = { type: 'button', comp };
          this.requestRender();
          return;
        }
      }

      // Switch
      if (comp.type === 'SWITCH') {
        if (pos.x >= comp.x + 10 && pos.x <= comp.x + 60 && pos.y >= comp.y + 15 && pos.y <= comp.y + 55) {
          this.selectedComponent = comp;
          this.selectedWireIndex = -1;
          comp.toggle(this.board);
          this.requestRender();
          return;
        }
      }

      // Potentiometer
      if (comp.type === 'POTENTIOMETER') {
        const cx = comp.x + comp.width / 2;
        const cy = comp.y + comp.height / 2 - 8;
        if (Math.hypot(pos.x - cx, pos.y - cy) <= 26) {
          this.selectedComponent = comp;
          this.selectedWireIndex = -1;
          this.dragTarget = { type: 'pot', comp, cx, cy };
          this.isDragging = true;
          return;
        }
      }

      // Sensor Sliders (LDR, LM35, Ultrasonic, Gas)
      if (['LDR', 'LM35', 'ULTRASONIC', 'GAS_SENSOR', 'PIR_SENSOR'].includes(comp.type)) {
        if (pos.x >= comp.x && pos.x <= comp.x + comp.width && pos.y >= comp.y && pos.y <= comp.y + comp.height) {
          this.selectedComponent = comp;
          this.selectedWireIndex = -1;
          if (comp.type === 'PIR_SENSOR') {
            comp.triggerMotion(this.board);
            this.requestRender();
            return;
          }
          this.dragTarget = { type: 'slider', comp };
          this.isDragging = true;
          this.updateSliderValue(comp, pos);
          return;
        }
      }

      // Component Dragging
      if (pos.x >= comp.x && pos.x <= comp.x + comp.width && pos.y >= comp.y && pos.y <= comp.y + comp.height) {
        this.selectedComponent = comp;
        this.selectedWireIndex = -1;
        this.dragTarget = { type: 'component', comp };
        this.dragOffset = { x: pos.x - comp.x, y: pos.y - comp.y };
        this.isDragging = true;
        this.requestRender();
        return;
      }
    }

    // 3. Check Wire Selection
    const wireHit = this.hitTestWire(pos);
    this.selectedWireIndex = wireHit;
    this.selectedComponent = null;
    this.requestRender();
  }

  handleMouseMove(pos) {
    if (this.wiringStart) {
      this.wiringCurrent = { x: pos.x, y: pos.y };
      this.requestRender();
      return;
    }

    if (!this.dragTarget) {
      const termHit = this.hitTestTerminal(pos);
      const wireHit = this.hitTestWire(pos);
      let foundComp = null;
      for (const comp of this.components) {
        if (pos.x >= comp.x && pos.x <= comp.x + comp.width && pos.y >= comp.y && pos.y <= comp.y + comp.height) {
          foundComp = comp;
          break;
        }
      }
      this.canvas.style.cursor = termHit ? 'crosshair' : (foundComp ? 'grab' : (wireHit >= 0 ? 'pointer' : 'default'));
      return;
    }

    if (this.dragTarget.type === 'component') {
      const comp = this.dragTarget.comp;
      comp.x = Math.max(10, Math.min(this.canvas.width - comp.width - 10, pos.x - this.dragOffset.x));
      comp.y = Math.max(10, Math.min(this.canvas.height - comp.height - 10, pos.y - this.dragOffset.y));
      this.requestRender();
    } else if (this.dragTarget.type === 'pot') {
      const comp = this.dragTarget.comp;
      const angle = Math.atan2(pos.y - this.dragTarget.cy, pos.x - this.dragTarget.cx);
      let normAngle = (angle + Math.PI / 2) / Math.PI;
      if (normAngle < 0) normAngle += 1;
      comp.setValue(normAngle, this.board);
      this.requestRender();
    } else if (this.dragTarget.type === 'slider') {
      this.updateSliderValue(this.dragTarget.comp, pos);
      this.requestRender();
    }
  }

  handleMouseUp(pos) {
    // Complete wiring connection
    if (this.wiringStart) {
      const targetHit = this.hitTestTerminal(pos);
      if (targetHit && targetHit !== this.wiringStart) {
        this.createWire(this.wiringStart, targetHit);
      }
      this.wiringStart = null;
      this.wiringCurrent = null;
      this.requestRender();
    }

    if (this.dragTarget && this.dragTarget.type === 'button') {
      this.dragTarget.comp.setPressed(false, this.board);
      this.requestRender();
    }
    this.isDragging = false;
    this.dragTarget = null;
  }

  updateSliderValue(comp, pos) {
    const relX = Math.max(0, Math.min(1, (pos.x - comp.x) / comp.width));
    if (comp.type === 'ULTRASONIC') {
      comp.setDistance(Math.round(2 + relX * 398), this.interpreter);
    } else if (comp.type === 'LDR') {
      comp.setLux(Math.round(relX * 1000), this.board);
    } else if (comp.type === 'LM35') {
      comp.setTemp(Math.round(-20 + relX * 145), this.board);
    } else if (comp.type === 'GAS_SENSOR') {
      comp.setPpm(Math.round(relX * 1000), this.board);
    }
  }

  hitTestTerminal(pos) {
    // 1. Check Board Pins
    for (const [pinKey, pPos] of this.pinPositions.entries()) {
      if (Math.hypot(pos.x - pPos.x, pos.y - pPos.y) <= 8) {
        return { isBoardPin: true, boardPin: pinKey, x: pPos.x, y: pPos.y, label: pPos.label };
      }
    }
    // 2. Check Component Terminals
    for (const comp of this.components) {
      for (const term of comp.terminals) {
        const tx = comp.x + term.dx;
        const ty = comp.y + term.dy;
        if (Math.hypot(pos.x - tx, pos.y - ty) <= 8) {
          return { isBoardPin: false, compId: comp.id, terminalName: term.name, x: tx, y: ty, label: `${comp.name}.${term.label}` };
        }
      }
    }
    return null;
  }

  hitTestWire(pos) {
    for (let i = 0; i < this.wires.length; i++) {
      const wire = this.wires[i];
      const p1 = this.resolveEndpoint(wire.from);
      const p2 = this.resolveEndpoint(wire.to);
      if (!p1 || !p2) continue;

      // Distance to line segment
      const d = this.distToSegment(pos, p1, p2);
      if (d < 8) return i;
    }
    return -1;
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  createWire(endpointA, endpointB) {
    // Normalization: from Component to BoardPin
    let compEndpoint = !endpointA.isBoardPin ? endpointA : endpointB;
    let boardEndpoint = endpointA.isBoardPin ? endpointA : endpointB;

    if (!compEndpoint.isBoardPin && boardEndpoint.isBoardPin) {
      const comp = this.components.find(c => c.id === compEndpoint.compId);
      if (comp) {
        comp.connect(compEndpoint.terminalName, boardEndpoint.boardPin);
        const color = this.suggestWireColor(compEndpoint.terminalName, boardEndpoint.boardPin);
        this.wires.push({
          from: `${compEndpoint.compId}.${compEndpoint.terminalName}`,
          to: boardEndpoint.boardPin,
          color
        });
      }
    }
  }

  suggestWireColor(terminal, pin) {
    const pStr = String(pin).toUpperCase();
    const tStr = String(terminal).toLowerCase();
    if (pStr === '5V' || tStr === 'vcc' || tStr === 'vdd') return '#ef4444'; // Red
    if (pStr === 'GND' || tStr === 'gnd' || tStr === 'cathode' || tStr === 'vss') return '#1e293b'; // Black
    if (pStr === '3.3V') return '#f97316'; // Orange
    if (pStr.startsWith('A')) return '#a855f7'; // Purple
    return '#3b82f6'; // Blue
  }

  deleteSelectedWire() {
    if (this.selectedWireIndex >= 0 && this.selectedWireIndex < this.wires.length) {
      const w = this.wires[this.selectedWireIndex];
      const [cId, term] = w.from.split('.');
      const comp = this.components.find(c => c.id === cId);
      if (comp) comp.disconnect(term);
      this.wires.splice(this.selectedWireIndex, 1);
      this.selectedWireIndex = -1;
      this.requestRender();
    }
  }

  resolveEndpoint(spec) {
    if (typeof spec === 'string' && spec.includes('.')) {
      const [cId, termName] = spec.split('.');
      const c = this.components.find(x => x.id === cId);
      if (!c) return null;
      const term = c.terminals.find(t => t.name === termName);
      if (!term) return null;
      return { x: c.x + term.dx, y: c.y + term.dy };
    }
    const bp = this.pinPositions.get(spec);
    return bp ? { x: bp.x, y: bp.y } : null;
  }

  requestRender() {
    if (this.animFrameId) return;
    this.animFrameId = requestAnimationFrame(() => {
      this.animFrameId = null;
      this.render();
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Workbench Mat
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 10; x < w; x += 20) {
      for (let y = 10; y < h; y += 20) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Draw Board
    this.drawBoard(ctx);

    // Update & check power on components
    for (const comp of this.components) {
      comp.update(this.board, this.interpreter);
    }

    // Draw Wires
    this.drawWires(ctx);

    // Draw Active Dragging Wire
    if (this.wiringStart && this.wiringCurrent) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.wiringStart.x, this.wiringStart.y);
      ctx.lineTo(this.wiringCurrent.x, this.wiringCurrent.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Components
    for (const comp of this.components) {
      this.drawComponent(ctx, comp);
    }

    // Draw selection outline around selected component
    if (this.selectedComponent) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        this.selectedComponent.x - 4,
        this.selectedComponent.y - 4,
        this.selectedComponent.width + 8,
        this.selectedComponent.height + 8
      );
      ctx.restore();
    }
  }

  drawBoard(ctx) {
    const bx = this.boardRect.x;
    const by = this.boardRect.y;
    const bw = this.boardRect.w;
    const bh = this.boardRect.h;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;

    // PCB Body
    ctx.fillStyle = this.board.type === 'MEGA' ? '#00757a' : '#00878a';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.restore();

    // USB Jack
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx - 12, by + 25, 32, 45, 3);
    ctx.fill();
    ctx.stroke();

    // DC Power Jack
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(bx - 10, by + bh - 60, 30, 45, 3);
    ctx.fill();

    // Reset Switch
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(bx + 40, by + 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8px sans-serif';
    ctx.fillText('RESET', bx + 28, by + 48);

    // ATmega Chip
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(bx + 130, by + 85, 110, 40, 3);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(bx + 135 + i * 7.5, by + 80, 3, 5);
      ctx.fillRect(bx + 135 + i * 7.5, by + 125, 3, 5);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '8px monospace';
    ctx.fillText(`ATMEGA-${this.board.type === 'MEGA' ? '2560' : '328P'}`, bx + 142, by + 108);

    // Power Indicator LED
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bx + 75, by + 65, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pin 13 Builtin LED
    const p13 = this.board.getPin(13);
    const p13Active = p13 && (p13.digitalValue === 1 || p13.pwmDuty > 0);
    const p13Brightness = p13 ? (p13.pwmDuty > 0 ? p13.pwmDuty / 255 : p13.digitalValue) : 0;
    if (p13Active) {
      ctx.fillStyle = `rgba(250, 204, 21, ${0.4 + p13Brightness * 0.6})`;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12 * p13Brightness;
    } else {
      ctx.fillStyle = '#4b5563';
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.arc(bx + 90, by + 65, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Board Branding
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`e-Samastha ${this.board.type}`, bx + 115, by + 48);

    // Headers
    this.drawPinHeaders(ctx);
  }

  drawPinHeaders(ctx) {
    const bx = this.boardRect.x;
    const by = this.boardRect.y;

    for (const [pinName, pos] of this.pinPositions.entries()) {
      const isTop = pos.y < by + 50;

      // Socket hole
      ctx.fillStyle = '#020617';
      ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);

      // Gold contact
      ctx.fillStyle = (this.highlightPin === pinName) ? '#38bdf8' : '#f59e0b';
      ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);

      // Highlight ring if selected
      if (this.highlightPin === pinName) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pos.x - 5, pos.y - 5, 10, 10);
      }

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      if (isTop) {
        ctx.fillText(pos.label, pos.x, pos.y + 14);
      } else {
        ctx.fillText(pos.label, pos.x, pos.y - 7);
      }
    }
    ctx.textAlign = 'left';
  }

  drawWires(ctx) {
    for (let i = 0; i < this.wires.length; i++) {
      const wire = this.wires[i];
      const p1 = this.resolveEndpoint(wire.from);
      const p2 = this.resolveEndpoint(wire.to);
      if (!p1 || !p2) continue;

      const isSelected = (i === this.selectedWireIndex);

      ctx.save();
      ctx.strokeStyle = isSelected ? '#ffffff' : (wire.color || '#3b82f6');
      ctx.lineWidth = isSelected ? 4 : 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      const midY = (p1.y + p2.y) / 2 + (p1.x > p2.x ? 25 : -25);
      ctx.quadraticCurveTo((p1.x + p2.x) / 2, midY, p2.x, p2.y);
      ctx.stroke();

      // Terminal dots
      ctx.fillStyle = wire.color || '#3b82f6';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawComponent(ctx, comp) {
    ctx.save();
    ctx.translate(comp.x, comp.y);

    // Component body
    switch (comp.type) {
      case 'LED': this.renderLed(ctx, comp); break;
      case 'RGB_LED': this.renderRgbLed(ctx, comp); break;
      case 'BUTTON': this.renderButton(ctx, comp); break;
      case 'SWITCH': this.renderSwitch(ctx, comp); break;
      case 'POTENTIOMETER': this.renderPot(ctx, comp); break;
      case 'BUZZER': this.renderBuzzer(ctx, comp); break;
      case 'LDR': this.renderLdr(ctx, comp); break;
      case 'LM35': this.renderLm35(ctx, comp); break;
      case 'ULTRASONIC': this.renderUltrasonic(ctx, comp); break;
      case 'SERVO': this.renderServo(ctx, comp); break;
      case 'DC_MOTOR': this.renderMotor(ctx, comp); break;
      case 'RELAY': this.renderRelay(ctx, comp); break;
      case 'LCD1602': this.renderLcd(ctx, comp); break;
      case 'OLED12864': this.renderOled(ctx, comp); break;
      default: this.renderGeneric(ctx, comp); break;
    }

    // Power Status Warning Badge if required
    if (comp.requiresPower && comp.powerState !== 'POWERED') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(comp.powerState === 'MISSING_VCC' ? '⚡ NO VCC' : '⚠️ NO GND', 5, comp.height - 4);
    }

    // Terminals
    for (const term of comp.terminals) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(term.dx, term.dy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px sans-serif';
      ctx.fillText(term.label, term.dx - 8, term.dy - 6);
    }

    ctx.restore();
  }

  renderLed(ctx, comp) {
    const col = comp.state.color || 'red';
    const b = comp.state.brightness || 0;
    const isLit = comp.state.isOn;

    const colors = {
      red: { lit: `rgba(239, 68, 68, ${0.4 + b * 0.6})`, off: '#7f1d1d', glow: '#ef4444' },
      green: { lit: `rgba(34, 197, 94, ${0.4 + b * 0.6})`, off: '#14532d', glow: '#22c55e' },
      yellow: { lit: `rgba(234, 179, 8, ${0.4 + b * 0.6})`, off: '#713f12', glow: '#eab308' },
      blue: { lit: `rgba(59, 130, 246, ${0.4 + b * 0.6})`, off: '#1e3a8a', glow: '#3b82f6' },
      white: { lit: `rgba(248, 250, 252, ${0.4 + b * 0.6})`, off: '#64748b', glow: '#ffffff' }
    };
    const c = colors[col] || colors.red;

    if (isLit) {
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 18 * b;
    }
    ctx.fillStyle = isLit ? c.lit : c.off;
    ctx.beginPath();
    ctx.arc(30, 25, 16, Math.PI, 0, false);
    ctx.lineTo(46, 45);
    ctx.lineTo(14, 45);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#475569';
    ctx.fillRect(12, 45, 36, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(19, 51, 3, 14);
    ctx.fillRect(39, 51, 3, 14);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 10, 8);
  }

  renderRgbLed(ctx, comp) {
    const { r, g, b } = comp.state;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(40, 35, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 10, 10);
  }

  renderButton(ctx, comp) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(10, 10, 50, 50, 4);
    ctx.fill();

    ctx.fillStyle = comp.state.pressed ? '#2563eb' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(35, 35, comp.state.pressed ? 15 : 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 8);
  }

  renderSwitch(ctx, comp) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(10, 15, 50, 35, 4);
    ctx.fill();

    ctx.fillStyle = comp.state.closed ? '#10b981' : '#64748b';
    ctx.beginPath();
    ctx.arc(comp.state.closed ? 45 : 25, 32, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderPot(ctx, comp) {
    const ratio = comp.state.ratio || 0.5;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(10, 10, 70, 65, 4);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(45, 38, 18, 0, Math.PI * 2);
    ctx.fill();

    const angle = (ratio * 1.5 - 0.75) * Math.PI;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(45 + Math.cos(angle) * 14, 38 + Math.sin(angle) * 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    ctx.fillText(`${Math.round(ratio * 100)}%`, 35, 68);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 8);
  }

  renderBuzzer(ctx, comp) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(35, 35, 24, 0, Math.PI * 2);
    ctx.fill();

    if (comp.state.isPlaying) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(35, 35, 28, 0, Math.PI * 2);
      ctx.arc(35, 35, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 8);
  }

  renderLdr(ctx, comp) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(10, 15, 60, 50, 4);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px monospace';
    ctx.fillText(`${comp.state.lux} lx`, 20, 45);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderLm35(ctx, comp) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(10, 15, 60, 50, 4);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = '9px monospace';
    ctx.fillText(`${comp.state.tempC}°C`, 22, 45);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderUltrasonic(ctx, comp) {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(10, 15, 100, 50, 4);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(38, 40, 16, 0, Math.PI * 2);
    ctx.arc(82, 40, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${comp.state.distanceCm} cm`, 44, 25);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderServo(ctx, comp) {
    const angle = comp.state.angle || 90;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(10, 15, 90, 55, 4);
    ctx.fill();

    ctx.save();
    ctx.translate(75, 42);
    ctx.rotate((angle - 90) * (Math.PI / 180));
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-4, -30, 8, 60, 4);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${angle}°`, 18, 46);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderMotor(ctx, comp) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(10, 15, 70, 60, 4);
    ctx.fill();

    ctx.save();
    ctx.translate(45, 45);
    ctx.rotate((comp.state.rotationAngle || 0) * (Math.PI / 180));
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, -20, 6, 40);
    ctx.fillRect(-20, -3, 40, 6);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(`${comp.state.speedRpm} RPM`, 18, 80);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderRelay(ctx, comp) {
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(10, 10, 80, 70, 4);
    ctx.fill();

    ctx.fillStyle = comp.state.isEnergized ? '#10b981' : '#dc2626';
    ctx.beginPath();
    ctx.arc(75, 25, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.fillText(comp.state.isEnergized ? 'ON' : 'OFF', 20, 45);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 10);
  }

  renderLcd(ctx, comp) {
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(5, 5, 230, 95, 4);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(25, 18, 190, 55, 3);
    ctx.fill();

    ctx.fillStyle = '#f0fdf4';
    ctx.font = '11px monospace';
    const l1 = (comp.state.lines && comp.state.lines[0]) || '                ';
    const l2 = (comp.state.lines && comp.state.lines[1]) || '                ';
    ctx.fillText(l1, 35, 40);
    ctx.fillText(l2, 35, 58);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 102);
  }

  renderOled(ctx, comp) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(5, 5, 130, 85, 4);
    ctx.fill();

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(15, 15, 110, 55, 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px monospace';
    let y = 28;
    for (const line of (comp.state.lines || [])) {
      ctx.fillText(line, 20, y);
      y += 10;
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 5, 95);
  }

  renderGeneric(ctx, comp) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(5, 5, comp.width - 10, comp.height - 10, 4);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '9px sans-serif';
    ctx.fillText(comp.name, 8, 20);
  }
}
