/**
 * Switcha Blocks — Visual Block Diagram Canvas Editor
 * Handles:
 * - HTML5 Canvas 2D rendering of professional block glyphs
 * - Port hit-testing, connection snapping, and signal bus routing with direction arrows
 * - Drag-and-drop block movement, multi-selection, group drag, box selection
 * - Interactive parameter inspection on block double-click / click
 * - Undo/Redo state snapshots
 */

import { BlockDefinitions, BlockTypes } from './block-types.js';

export class BlockCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.blocks = [];
    this.wires = []; // { id, fromBlock, fromPort, toBlock, toPort }

    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.gridSize = 20;

    this.selectedBlocks = new Set();
    this.selectedWire = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.isConnecting = false;
    this.connectingFrom = null; // { blockId, portId, x, y }
    this.tempWirePos = { x: 0, y: 0 };

    this.undoStack = [];
    this.redoStack = [];
    this.onSelectionChanged = null;
    this.onModified = null;

    if (this.canvas) {
      this.initEvents();
      this.resize();
    }
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.render();
  }

  screenToWorld(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.panX) / this.zoom;
    const y = (screenY - rect.top - this.panY) / this.zoom;
    return { x, y };
  }

  worldToScreen(worldX, worldY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = rect.left + this.panX + worldX * this.zoom;
    const y = rect.top + this.panY + worldY * this.zoom;
    return { x, y };
  }

  snapToGrid(val) {
    return Math.round(val / this.gridSize) * this.gridSize;
  }

  saveState() {
    const state = {
      blocks: JSON.parse(JSON.stringify(this.blocks)),
      wires: JSON.parse(JSON.stringify(this.wires))
    };
    this.undoStack.push(state);
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.redoStack = [];
    if (this.onModified) this.onModified();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState = {
      blocks: JSON.parse(JSON.stringify(this.blocks)),
      wires: JSON.parse(JSON.stringify(this.wires))
    };
    this.redoStack.push(currentState);
    const prev = this.undoStack.pop();
    this.blocks = prev.blocks;
    this.wires = prev.wires;
    this.selectedBlocks.clear();
    this.selectedWire = null;
    this.render();
    if (this.onModified) this.onModified();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop();
    this.undoStack.push({
      blocks: JSON.parse(JSON.stringify(this.blocks)),
      wires: JSON.parse(JSON.stringify(this.wires))
    });
    this.blocks = next.blocks;
    this.wires = next.wires;
    this.render();
    if (this.onModified) this.onModified();
  }

  addBlock(type, worldX, worldY, params = {}) {
    const def = BlockDefinitions[type];
    if (!def) return null;
    this.saveState();

    const id = `blk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const block = {
      id,
      type,
      name: def.name,
      x: this.snapToGrid(worldX),
      y: this.snapToGrid(worldY),
      width: def.width || 60,
      height: def.height || 45,
      params: { ...(def.params || {}), ...params },
      inputs: (def.inputs || []).map(p => ({ ...p })),
      outputs: (def.outputs || []).map(p => ({ ...p }))
    };

    this.blocks.push(block);
    this.selectedBlocks.clear();
    this.selectedBlocks.add(block);
    this.render();
    if (this.onSelectionChanged) this.onSelectionChanged(block);
    return block;
  }

  removeSelected() {
    if (this.selectedBlocks.size === 0 && !this.selectedWire) return;
    this.saveState();

    const selectedIds = new Set(Array.from(this.selectedBlocks).map(b => b.id));
    this.blocks = this.blocks.filter(b => !selectedIds.has(b.id));
    this.wires = this.wires.filter(w => !selectedIds.has(w.fromBlock) && !selectedIds.has(w.toBlock) && w !== this.selectedWire);

    this.selectedBlocks.clear();
    this.selectedWire = null;
    this.render();
    if (this.onSelectionChanged) this.onSelectionChanged(null);
  }

  getBlockAt(worldX, worldY) {
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      const halfW = b.width / 2;
      const halfH = b.height / 2;
      if (worldX >= b.x - halfW && worldX <= b.x + halfW && worldY >= b.y - halfH && worldY <= b.y + halfH) {
        return b;
      }
    }
    return null;
  }

  getPortAt(worldX, worldY, hitRadius = 12) {
    for (const b of this.blocks) {
      // Check outputs
      for (const p of b.outputs) {
        const px = b.x + p.x;
        const py = b.y + p.y;
        if (Math.hypot(worldX - px, worldY - py) <= hitRadius) {
          return { block: b, port: p, isOutput: true, x: px, y: py };
        }
      }
      // Check inputs
      for (const p of b.inputs) {
        const px = b.x + p.x;
        const py = b.y + p.y;
        if (Math.hypot(worldX - px, worldY - py) <= hitRadius) {
          return { block: b, port: p, isOutput: false, x: px, y: py };
        }
      }
    }
    return null;
  }

  initEvents() {
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    this.canvas.addEventListener('pointerdown', (e) => {
      const pos = this.screenToWorld(e.clientX, e.clientY);

      // Check port click (start connection)
      const hitPort = this.getPortAt(pos.x, pos.y);
      if (hitPort && hitPort.isOutput) {
        this.isConnecting = true;
        this.connectingFrom = {
          blockId: hitPort.block.id,
          portId: hitPort.port.id,
          x: hitPort.x,
          y: hitPort.y
        };
        this.tempWirePos = { x: pos.x, y: pos.y };
        return;
      }

      // Check block click
      const hitBlock = this.getBlockAt(pos.x, pos.y);
      if (hitBlock) {
        if (!e.shiftKey && !this.selectedBlocks.has(hitBlock)) {
          this.selectedBlocks.clear();
        }
        this.selectedBlocks.add(hitBlock);
        this.selectedWire = null;
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.blocks.forEach(b => {
          b._origX = b.x;
          b._origY = b.y;
        });
        if (this.onSelectionChanged) this.onSelectionChanged(hitBlock);
        this.render();
        return;
      }

      // Pan or deselect
      if (e.button === 1 || e.spaceKey || e.altKey) {
        isPanning = true;
        panStartX = e.clientX - this.panX;
        panStartY = e.clientY - this.panY;
      } else {
        this.selectedBlocks.clear();
        this.selectedWire = null;
        if (this.onSelectionChanged) this.onSelectionChanged(null);
        this.render();
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (isPanning) {
        this.panX = e.clientX - panStartX;
        this.panY = e.clientY - panStartY;
        this.render();
        return;
      }

      const pos = this.screenToWorld(e.clientX, e.clientY);

      if (this.isConnecting) {
        this.tempWirePos = { x: pos.x, y: pos.y };
        this.render();
        return;
      }

      if (this.isDragging && this.selectedBlocks.size > 0) {
        const dx = pos.x - this.dragStartX;
        const dy = pos.y - this.dragStartY;
        this.selectedBlocks.forEach(b => {
          b.x = this.snapToGrid((b._origX || b.x) + dx);
          b.y = this.snapToGrid((b._origY || b.y) + dy);
        });
        this.render();
      }
    });

    window.addEventListener('pointerup', (e) => {
      isPanning = false;

      if (this.isConnecting) {
        const pos = this.screenToWorld(e.clientX, e.clientY);
        const hitPort = this.getPortAt(pos.x, pos.y);

        if (hitPort && !hitPort.isOutput && hitPort.block.id !== this.connectingFrom.blockId) {
          this.saveState();
          // Remove existing wire to the same input port if any
          this.wires = this.wires.filter(w => !(w.toBlock === hitPort.block.id && w.toPort === hitPort.port.id));

          this.wires.push({
            id: `w_${Date.now()}`,
            fromBlock: this.connectingFrom.blockId,
            fromPort: this.connectingFrom.portId,
            toBlock: hitPort.block.id,
            toPort: hitPort.port.id
          });
        }
        this.isConnecting = false;
        this.connectingFrom = null;
        this.render();
      }

      if (this.isDragging) {
        this.isDragging = false;
        this.saveState();
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.3, Math.min(3.0, this.zoom * zoomFactor));

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.render();
    }, { passive: false });
  }

  // --- Rendering ---
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Grid dots
    const startX = Math.floor(-this.panX / this.zoom / this.gridSize) * this.gridSize;
    const startY = Math.floor(-this.panY / this.zoom / this.gridSize) * this.gridSize;
    const endX = startX + (w / this.zoom) + this.gridSize * 2;
    const endY = startY + (h / this.zoom) + this.gridSize * 2;

    ctx.fillStyle = '#1e293b';
    for (let x = startX; x < endX; x += this.gridSize) {
      for (let y = startY; y < endY; y += this.gridSize) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }

    // Render Wires (Signal Buses)
    this.renderWires(ctx);

    // Render Blocks
    this.blocks.forEach(block => this.renderBlock(ctx, block));

    // Render In-Progress Connection Wire
    if (this.isConnecting && this.connectingFrom) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      this.drawOrthogonalSignalBus(ctx, this.connectingFrom.x, this.connectingFrom.y, this.tempWirePos.x, this.tempWirePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    ctx.restore();
  }

  renderWires(ctx) {
    this.wires.forEach(wire => {
      const fromBlock = this.blocks.find(b => b.id === wire.fromBlock);
      const toBlock = this.blocks.find(b => b.id === wire.toBlock);
      if (!fromBlock || !toBlock) return;

      const fromPort = fromBlock.outputs.find(p => p.id === wire.fromPort) || { x: fromBlock.width / 2, y: 0 };
      const toPort = toBlock.inputs.find(p => p.id === wire.toPort) || { x: -toBlock.width / 2, y: 0 };

      const x1 = fromBlock.x + fromPort.x;
      const y1 = fromBlock.y + fromPort.y;
      const x2 = toBlock.x + toPort.x;
      const y2 = toBlock.y + toPort.y;

      const isSelected = this.selectedWire === wire;
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = isSelected ? 3.0 : 2.0;

      this.drawOrthogonalSignalBus(ctx, x1, y1, x2, y2);
      ctx.stroke();

      // Direction Arrow Head
      this.drawArrowHead(ctx, x2, y2, 'right');
    });
  }

  drawOrthogonalSignalBus(ctx, x1, y1, x2, y2) {
    const midX = x1 + (x2 - x1) * 0.5;
    ctx.moveTo(x1, y1);
    ctx.lineTo(midX, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(x2, y2);
  }

  drawArrowHead(ctx, x, y, dir = 'right') {
    ctx.save();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y - 4);
    ctx.lineTo(x - 7, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderBlock(ctx, block) {
    const isSelected = this.selectedBlocks.has(block);
    const halfW = block.width / 2;
    const halfH = block.height / 2;

    ctx.save();
    ctx.translate(block.x, block.y);

    // Block Body Rect
    ctx.beginPath();
    ctx.rect(-halfW, -halfH, block.width, block.height);
    ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // Block Glyph / Inner Math Icon
    this.renderBlockGlyph(ctx, block);

    // Block Name / Label below
    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillStyle = isSelected ? '#38bdf8' : '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(block.name, 0, halfH + 13);

    // Render Input Ports
    block.inputs.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (p.label) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(p.label, p.x + 6, p.y + 3);
      }
    });

    // Render Output Ports
    block.outputs.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (p.label) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.fillText(p.label, p.x - 6, p.y + 3);
      }
    });

    ctx.restore();
  }

  renderBlockGlyph(ctx, block) {
    const p = block.params || {};
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (block.type) {
      case BlockTypes.CONSTANT:
        ctx.font = 'bold 13px monospace';
        ctx.fillText(String(p.value ?? 1), 0, 0);
        break;

      case BlockTypes.STEP:
        ctx.beginPath();
        ctx.lineWidth = 1.8;
        ctx.moveTo(-15, 8); ctx.lineTo(-4, 8); ctx.lineTo(-4, -8); ctx.lineTo(15, -8);
        ctx.stroke();
        break;

      case BlockTypes.SINE_GEN:
        ctx.beginPath();
        ctx.lineWidth = 1.8;
        ctx.moveTo(-16, 0);
        ctx.bezierCurveTo(-10, -12, -6, -12, 0, 0);
        ctx.bezierCurveTo(6, 12, 10, 12, 16, 0);
        ctx.stroke();
        break;

      case BlockTypes.SUM:
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Σ', 0, 0);
        break;

      case BlockTypes.GAIN:
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.moveTo(-15, -12); ctx.lineTo(15, 0); ctx.lineTo(-15, 12); ctx.closePath();
        ctx.stroke();
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`K=${p.gain ?? 2}`, -3, 0);
        break;

      case BlockTypes.INTEGRATOR:
        ctx.font = 'bold 15px serif';
        ctx.fillText('1/s', 0, 0);
        break;

      case BlockTypes.PID_CONTROLLER:
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('PID', 0, 0);
        break;

      case BlockTypes.TRANSFER_FCN:
        ctx.font = 'bold 9px monospace';
        ctx.fillText(p.numerator || '1', 0, -6);
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
        ctx.stroke();
        ctx.fillText(p.denominator || 's+1', 0, 7);
        break;

      case BlockTypes.SCOPE:
        ctx.beginPath();
        ctx.rect(-18, -12, 36, 24);
        ctx.fillStyle = '#051923';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = '#00f5d4';
        ctx.moveTo(-14, 4); ctx.lineTo(-7, -6); ctx.lineTo(0, 4); ctx.lineTo(7, -6); ctx.lineTo(14, 4);
        ctx.stroke();
        break;

      default:
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(block.type.substring(0, 6), 0, 0);
        break;
    }
  }
}
