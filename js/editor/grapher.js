/**
 * Multisim Live Professional Oscilloscope & Grapher
 * Multi-channel time-domain waveform visualizer with hardware-accurate
 * digital edge triggering, dual interactive measurement cursors,
 * automated signal parameter measurements (Vpp, Vrms, Mean, Freq, Duty),
 * Min/Max LOD decimation, and CSV/PNG export.
 */

import { formatValueWithPrefix, parseEngineeringValue } from '../engine/components.js';

export class CircuitGrapher {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.engine = engine;

    // Timebase & Vertical Settings (Unlimited manual variations)
    this.timePerDiv = 0.001; // 1 ms/div (10 divisions = 10ms window)
    this.voltsPerDiv = 2.0;  // 2 V/div (8 vertical divisions)
    this.timeOffset = 0.0;   // Horizontal pan offset in seconds
    this.voltOffset = 0.0;   // Vertical baseline offset in Volts
    this.autoScale = true;
    this.theme = 'dark';     // 'dark' or 'light'

    // Measurement Cursors (Interactive Time & Voltage Cursors)
    this.showCursors = true;
    this.cursorMode = 'TIME'; // 'TIME' | 'VOLTAGE' | 'DUAL'
    this.cursor1 = 0.25;      // X1 position ratio (0.0 to 1.0)
    this.cursor2 = 0.75;      // X2 position ratio (0.0 to 1.0)
    this.cursorY1 = 0.35;     // Y1 position ratio (0.0 to 1.0, top to bottom)
    this.cursorY2 = 0.65;     // Y2 position ratio (0.0 to 1.0, top to bottom)
    this.activeCursor = null; // 'X1' | 'X2' | 'Y1' | 'Y2' | null

    // Quick Parameters Panel State
    this.isQuickPanelOpen = false;
    this.selectedChannel = 'ALL';

    // Trigger Settings
    this.triggerEnabled = true;
    this.triggerLevel = 0.0;
    this.triggerSlope = 'RISING'; // 'RISING' or 'FALLING'

    // Automated Measurements Cache
    this.measurements = new Map();
    this.cursorMeasurements = {
      t1: 0, t2: 0, dt: 0, freq: 0,
      v1: 0, v2: 0, dv: 0,
      y1Volt: 0, y2Volt: 0, dyVolt: 0,
      probes: {}
    };

    // Touch & Pointer Gesture Tracking (Bare Hands & Mouse)
    this.activePointers = new Map();
    this.isPanning = false;
    this.isPinching = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.initialTimeOffset = 0;
    this.initialVoltOffset = 0;
    this.initialPinchDist = 0;
    this.initialPinchTimePerDiv = 0.001;
    this.initialPinchVoltsPerDiv = 2.0;

    this.initEvents();
    this.resize();
  }

  resize() {
    if (!this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.width = this.width || 800;
      this.height = this.height || 280;
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // --- Unified Pointer Events (Touchscreen "Bare Hands", Stylus & Mouse) ---
    this.canvas.addEventListener('pointerdown', (e) => {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / this.width;
        const mouseY = (e.clientY - rect.top) / this.height;

        let hit = false;
        if (this.showCursors) {
          // Check Time Cursors (X1, X2)
          if (this.cursorMode === 'TIME' || this.cursorMode === 'DUAL') {
            if (Math.abs(mouseX - this.cursor1) < 0.04) {
              this.activeCursor = 'X1';
              hit = true;
            } else if (Math.abs(mouseX - this.cursor2) < 0.04) {
              this.activeCursor = 'X2';
              hit = true;
            }
          }

          // Check Voltage Cursors (Y1, Y2)
          if (!hit && (this.cursorMode === 'VOLTAGE' || this.cursorMode === 'DUAL')) {
            if (Math.abs(mouseY - this.cursorY1) < 0.05) {
              this.activeCursor = 'Y1';
              hit = true;
            } else if (Math.abs(mouseY - this.cursorY2) < 0.05) {
              this.activeCursor = 'Y2';
              hit = true;
            }
          }
        }

        if (!hit) {
          this.isPanning = true;
          this.panStartX = e.clientX;
          this.panStartY = e.clientY;
          this.initialTimeOffset = this.timeOffset;
          this.initialVoltOffset = this.voltOffset;
        }
      } else if (this.activePointers.size === 2) {
        // Two-Finger Pinch Zoom (Bare Hands)
        this.activeCursor = null;
        this.isPanning = false;
        this.isPinching = true;
        const pts = Array.from(this.activePointers.values());
        this.initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.initialPinchTimePerDiv = this.timePerDiv;
        this.initialPinchVoltsPerDiv = this.voltsPerDiv;
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.isPinching && this.activePointers.size >= 2) {
        const pts = Array.from(this.activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.initialPinchDist > 5 && currentDist > 5) {
          const ratio = this.initialPinchDist / currentDist;
          this.timePerDiv = Math.max(1e-12, Math.min(1e4, this.initialPinchTimePerDiv * ratio));
          this.syncInputs();
          this.render();
        }
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = Math.max(0.005, Math.min(0.995, (e.clientX - rect.left) / this.width));
      const mouseY = Math.max(0.005, Math.min(0.995, (e.clientY - rect.top) / this.height));

      if (this.activeCursor) {
        if (this.activeCursor === 'X1' || this.activeCursor === 1) this.cursor1 = mouseX;
        else if (this.activeCursor === 'X2' || this.activeCursor === 2) this.cursor2 = mouseX;
        else if (this.activeCursor === 'Y1') this.cursorY1 = mouseY;
        else if (this.activeCursor === 'Y2') this.cursorY2 = mouseY;
        this.render();
        this.updateQuickPanelDOM();
        return;
      }

      if (this.isPanning) {
        const dx = e.clientX - this.panStartX;
        const dy = e.clientY - this.panStartY;
        const totalSpan = this.timePerDiv * 10;
        this.timeOffset = this.initialTimeOffset - (dx / this.width) * totalSpan;
        this.voltOffset = this.initialVoltOffset + (dy / this.height) * (this.voltsPerDiv * 8);
        this.render();
      }
    });

    const endPointer = (e) => {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size === 0) {
        this.activeCursor = null;
        this.isPanning = false;
        this.isPinching = false;
      } else if (this.activePointers.size === 1) {
        this.isPinching = false;
      }
    };

    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);

    // --- Continuous Mouse Wheel Zoom (Unlimited Variations on X and Y) ---
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const factor = e.deltaY < 0 ? 0.85 : 1.18;

      if (mouseX < 65 || e.shiftKey) {
        // Vertical Volts/Div Zoom
        this.autoScale = false;
        this.voltsPerDiv = Math.max(1e-6, Math.min(1e6, this.voltsPerDiv * factor));
      } else {
        // Horizontal Time/Div Zoom
        this.timePerDiv = Math.max(1e-12, Math.min(1e4, this.timePerDiv * factor));
      }
      this.syncInputs();
      this.render();
    }, { passive: false });
  }

  // --- Exact Voltage & Coordinate Interpolation ---
  getVoltageAtTime(probeId, targetTime) {
    const history = this.engine.history;
    if (!history || history.length === 0) return 0;
    if (targetTime <= history[0].time) return history[0].probes[probeId]?.value ?? 0;
    if (targetTime >= history[history.length - 1].time) return history[history.length - 1].probes[probeId]?.value ?? 0;

    let low = 0;
    let high = history.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (history[mid].time < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, high);
    const idx1 = Math.min(history.length - 1, low);
    const pt0 = history[idx0];
    const pt1 = history[idx1];

    const v0 = pt0.probes[probeId]?.value ?? 0;
    const v1 = pt1.probes[probeId]?.value ?? 0;

    if (pt1.time === pt0.time) return v0;
    const frac = (targetTime - pt0.time) / (pt1.time - pt0.time);
    return v0 + frac * (v1 - v0);
  }

  getVoltageFromYRatio(yRatio) {
    const y = yRatio * this.height;
    const yPixelsPerVolt = (this.height / 8) / this.voltsPerDiv;
    const centerY = (this.height / 2) + (this.voltOffset || 0) * yPixelsPerVolt;
    return (centerY - y) / yPixelsPerVolt;
  }

  getYRatioFromVoltage(volt) {
    const yPixelsPerVolt = (this.height / 8) / this.voltsPerDiv;
    const centerY = (this.height / 2) + (this.voltOffset || 0) * yPixelsPerVolt;
    const y = centerY - volt * yPixelsPerVolt;
    return Math.max(0, Math.min(1, y / this.height));
  }

  // --- Unlimited Manual Variations Scaling ---
  setTimeScale(scale) {
    if (typeof scale === 'string') {
      const parsed = parseEngineeringValue(scale);
      if (parsed && !isNaN(parsed) && parsed > 0) {
        this.timePerDiv = Math.max(1e-12, Math.min(1e4, parsed));
      }
    } else if (typeof scale === 'number' && scale > 0) {
      this.timePerDiv = Math.max(1e-12, Math.min(1e4, scale));
    }
    this.syncInputs();
    this.render();
  }

  setVoltScale(scale) {
    if (scale === 'auto' || scale === 'Auto') {
      this.autoScale = true;
    } else if (typeof scale === 'string') {
      const parsed = parseEngineeringValue(scale);
      if (parsed && !isNaN(parsed) && parsed > 0) {
        this.autoScale = false;
        this.voltsPerDiv = Math.max(1e-6, Math.min(1e6, parsed));
      }
    } else if (typeof scale === 'number' && scale > 0) {
      this.autoScale = false;
      this.voltsPerDiv = Math.max(1e-6, Math.min(1e6, scale));
    }
    this.syncInputs();
    this.render();
  }

  resetView() {
    this.timePerDiv = 0.001;
    this.voltsPerDiv = 2.0;
    this.autoScale = true;
    this.timeOffset = 0.0;
    this.voltOffset = 0.0;
    this.syncInputs();
    this.render();
  }

  syncInputs() {
    const timeInput = document.getElementById('timeScaleInput');
    if (timeInput && document.activeElement !== timeInput) {
      timeInput.value = formatValueWithPrefix(this.timePerDiv, 's');
    }
    const voltInput = document.getElementById('voltScaleInput');
    if (voltInput && document.activeElement !== voltInput) {
      voltInput.value = this.autoScale ? 'Auto' : formatValueWithPrefix(this.voltsPerDiv, 'V');
    }
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.render();
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.render();
    return this.theme;
  }

  toggleCursors() {
    this.showCursors = !this.showCursors;
    this.render();
    return this.showCursors;
  }

  setCursorMode(mode) {
    if (['TIME', 'VOLTAGE', 'DUAL'].includes(mode)) {
      this.cursorMode = mode;
      this.showCursors = true;
      this.render();
      this.updateQuickPanelDOM();
    }
  }

  // --- Quick Parameters Panel Controls ---
  toggleQuickPanel() {
    this.isQuickPanelOpen = !this.isQuickPanelOpen;
    const panel = document.getElementById('croQuickPanel');
    const btn = document.getElementById('btnQuickParams');
    if (panel) {
      panel.style.display = this.isQuickPanelOpen ? 'flex' : 'none';
    }
    if (btn) {
      btn.classList.toggle('active', this.isQuickPanelOpen);
    }
    if (this.isQuickPanelOpen) {
      this.updateQuickPanelDOM();
    }
    return this.isQuickPanelOpen;
  }

  setChannelFocus(channelId) {
    this.selectedChannel = channelId;
    this.updateQuickPanelDOM();
  }

  snapCursorToPeak() {
    const history = this.engine.history;
    if (!history || history.length === 0) return;
    const totalTimeSpan = Math.max(this.timePerDiv * 10, 1e-12);
    const latestTime = history[history.length - 1].time;
    const startTime = Math.max(0, latestTime - totalTimeSpan) + (this.timeOffset || 0);
    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    const targetProbe = (this.selectedChannel !== 'ALL' && probeIds.includes(this.selectedChannel)) ? this.selectedChannel : probeIds[0];
    if (!targetProbe) return;

    let maxVal = -Infinity;
    let maxTime = startTime;
    for (const pt of history) {
      if (pt.time >= startTime && pt.time <= startTime + totalTimeSpan) {
        const v = pt.probes[targetProbe]?.value;
        if (v !== undefined && v > maxVal) {
          maxVal = v;
          maxTime = pt.time;
        }
      }
    }
    this.cursor1 = Math.max(0.01, Math.min(0.99, (maxTime - startTime) / totalTimeSpan));
    this.render();
    this.updateQuickPanelDOM();
  }

  snapCursorToValley() {
    const history = this.engine.history;
    if (!history || history.length === 0) return;
    const totalTimeSpan = Math.max(this.timePerDiv * 10, 1e-12);
    const latestTime = history[history.length - 1].time;
    const startTime = Math.max(0, latestTime - totalTimeSpan) + (this.timeOffset || 0);
    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    const targetProbe = (this.selectedChannel !== 'ALL' && probeIds.includes(this.selectedChannel)) ? this.selectedChannel : probeIds[0];
    if (!targetProbe) return;

    let minVal = Infinity;
    let minTime = startTime;
    for (const pt of history) {
      if (pt.time >= startTime && pt.time <= startTime + totalTimeSpan) {
        const v = pt.probes[targetProbe]?.value;
        if (v !== undefined && v < minVal) {
          minVal = v;
          minTime = pt.time;
        }
      }
    }
    this.cursor2 = Math.max(0.01, Math.min(0.99, (minTime - startTime) / totalTimeSpan));
    this.render();
    this.updateQuickPanelDOM();
  }

  snapCursorToPeriod() {
    const history = this.engine.history;
    if (!history || history.length === 0) return;
    const totalTimeSpan = Math.max(this.timePerDiv * 10, 1e-12);
    const latestTime = history[history.length - 1].time;
    const startTime = Math.max(0, latestTime - totalTimeSpan) + (this.timeOffset || 0);
    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    const targetProbe = (this.selectedChannel !== 'ALL' && probeIds.includes(this.selectedChannel)) ? this.selectedChannel : probeIds[0];
    const m = this.measurements.get(targetProbe);
    if (!m || !m.period || m.period <= 0) return;

    const t1 = startTime + this.cursor1 * totalTimeSpan;
    const t2 = t1 + m.period;
    this.cursor2 = Math.max(0.01, Math.min(0.99, (t2 - startTime) / totalTimeSpan));
    this.render();
    this.updateQuickPanelDOM();
  }

  exportCSV() {
    const history = this.engine.history;
    if (history.length === 0) {
      alert('No simulation data to export. Run the simulation first.');
      return;
    }

    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    let csv = 'Time (s)';
    probeIds.forEach(id => {
      const p = sample.probes[id];
      csv += `,${p.name} (${p.unit})`;
    });
    csv += '\n';

    history.forEach(pt => {
      csv += pt.time.toFixed(8);
      probeIds.forEach(id => {
        const val = pt.probes[id]?.value ?? 0;
        csv += `,${val.toFixed(6)}`;
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `switcha_grapher_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPNG() {
    const dataUrl = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `switcha_grapher_plot_${Date.now()}.png`;
    a.click();
  }

  // --- Waveform Rendering Pipeline ---
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h || w <= 0 || h <= 0) return;

    const isLight = this.theme === 'light';

    // Background
    ctx.fillStyle = isLight ? '#f8fafc' : '#111827';
    ctx.fillRect(0, 0, w, h);

    const history = this.engine.history;
    if (!history || history.length === 0) {
      this.drawGrid(ctx, w, h, isLight);
      this.drawEmptyMessage(ctx, w, h);
      this.updateQuickPanelDOM();
      return;
    }

    // Time window bounds with timeOffset
    const totalTimeSpan = Math.max(this.timePerDiv * 10, 1e-12);
    const latestTime = history[history.length - 1].time;
    const baseStartTime = Math.max(0, latestTime - totalTimeSpan);
    const startTime = baseStartTime + (this.timeOffset || 0);

    // Auto-scale vertical range only if explicitly set to auto
    if (this.autoScale && history.length > 5) {
      let minV = -1, maxV = 1;
      const recentPoints = history.slice(-500);
      recentPoints.forEach(pt => {
        Object.values(pt.probes).forEach(pr => {
          if (pr.value < minV) minV = pr.value;
          if (pr.value > maxV) maxV = pr.value;
        });
      });
      const maxSpan = Math.max(Math.abs(minV), Math.abs(maxV)) * 1.25;
      this.voltsPerDiv = Math.max(maxSpan / 4, 0.05);
    }

    // Calculate automated measurements & exact cursor values
    this.calculateMeasurements(history, startTime, totalTimeSpan);

    this.drawGrid(ctx, w, h, isLight);
    this.drawTraces(ctx, w, h, startTime, totalTimeSpan);

    if (this.showCursors) {
      this.drawCursors(ctx, w, h, startTime, totalTimeSpan, isLight);
    }

    this.drawLegendAndMeasurements(ctx, w, h, isLight);

    if (this.isQuickPanelOpen) {
      this.updateQuickPanelDOM();
    }
  }

  drawGrid(ctx, w, h, isLight = false) {
    const numDivX = 10;
    const numDivY = 8;
    const stepX = w / numDivX;
    const stepY = h / numDivY;
    if (stepX <= 0 || stepY <= 0) return;

    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1.0;

    // Vertical grid lines
    ctx.beginPath();
    for (let x = 0; x <= w + 0.1; x += stepX) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    // Horizontal grid lines
    for (let y = 0; y <= h + 0.1; y += stepY) {
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Center axes (dashed) with vertical baseline offset
    const yPixelsPerVolt = (h / 8) / this.voltsPerDiv;
    const centerY = (h / 2) + (this.voltOffset || 0) * yPixelsPerVolt;

    ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, Math.max(0, Math.min(h, centerY)));
    ctx.lineTo(w, Math.max(0, Math.min(h, centerY)));
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-Axis Voltage Markings on left edge
    ctx.save();
    ctx.font = '9px Roboto Mono, monospace';
    ctx.fillStyle = isLight ? '#64748b' : '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= numDivY; i++) {
      const y = i * stepY;
      const v = (4 - i) * this.voltsPerDiv - (this.voltOffset || 0);
      const label = `${v >= 0 ? '+' : ''}${formatValueWithPrefix(v, 'V')}`;
      ctx.fillText(label, 6, Math.max(10, Math.min(h - 10, y)));
    }
    ctx.restore();
  }

  drawEmptyMessage(ctx, w, h) {
    ctx.font = '14px Lato, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('Press "Run Simulation" or place Voltage/Current Probes to inspect live waveforms.', w / 2, h / 2);
  }

  drawTraces(ctx, w, h, startTime, totalTimeSpan) {
    const history = this.engine.history;
    if (history.length === 0) return;

    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    const yPixelsPerVolt = (h / 8) / this.voltsPerDiv;
    const centerY = (h / 2) + (this.voltOffset || 0) * yPixelsPerVolt;

    probeIds.forEach(probeId => {
      const probeInfo = sample.probes[probeId];
      const color = probeInfo.color || '#00d2ff';

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < history.length; i++) {
        const pt = history[i];
        if (pt.time < startTime) continue;

        const pr = pt.probes[probeId];
        if (!pr) continue;

        const x = ((pt.time - startTime) / totalTimeSpan) * w;
        const y = centerY - pr.value * yPixelsPerVolt;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  calculateMeasurements(history, startTime, totalTimeSpan) {
    this.measurements.clear();
    if (history.length === 0) return;

    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);
    const t1 = startTime + this.cursor1 * totalTimeSpan;
    const t2 = startTime + this.cursor2 * totalTimeSpan;
    const dt = Math.abs(t2 - t1);
    const freqCursor = dt > 0 ? (1 / dt) : 0;

    const y1Volt = this.getVoltageFromYRatio(this.cursorY1);
    const y2Volt = this.getVoltageFromYRatio(this.cursorY2);
    const dyVolt = Math.abs(y2Volt - y1Volt);

    this.cursorMeasurements = {
      t1, t2, dt, freq: freqCursor,
      y1Volt, y2Volt, dyVolt,
      probes: {}
    };

    probeIds.forEach(id => {
      const vals = [];
      let sum = 0;
      let sumSq = 0;
      let min = Infinity;
      let max = -Infinity;

      for (let i = 0; i < history.length; i++) {
        const pt = history[i];
        if (pt.time < startTime) continue;
        const v = pt.probes[id]?.value;
        if (v !== undefined) {
          vals.push({ t: pt.time, v });
          sum += v;
          sumSq += v * v;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }

      const count = vals.length;
      if (count > 0) {
        const mean = sum / count;
        const rms = Math.sqrt(sumSq / count);
        const vpp = max - min;
        const amp = vpp / 2;

        // Enhanced zero-crossing frequency detection with noise hysteresis
        let crossings = 0;
        const hyst = Math.max(vpp * 0.05, 1e-4);
        let lastState = (vals[0].v > mean + hyst) ? 1 : ((vals[0].v < mean - hyst) ? -1 : 0);

        for (let i = 1; i < count; i++) {
          const v = vals[i].v;
          if (lastState <= 0 && v > mean + hyst) {
            if (lastState === -1) crossings++;
            lastState = 1;
          } else if (lastState >= 0 && v < mean - hyst) {
            if (lastState === 1) crossings++;
            lastState = -1;
          }
        }
        const timeSpan = vals[count - 1].t - vals[0].t;
        const freq = timeSpan > 0 ? (crossings / (2 * timeSpan)) : 0;
        const period = freq > 0 ? (1 / freq) : 0;

        // Exact interpolated voltages at Cursor 1 and Cursor 2
        const vCursor1 = this.getVoltageAtTime(id, t1);
        const vCursor2 = this.getVoltageAtTime(id, t2);
        const dvCursor = vCursor2 - vCursor1;

        const measData = {
          name: sample.probes[id]?.name || 'Probe',
          color: sample.probes[id]?.color || '#03b585',
          vpp, amp, max, min, mean, rms, freq, period,
          vCursor1, vCursor2, dvCursor
        };

        this.measurements.set(id, measData);
        this.cursorMeasurements.probes[id] = measData;
      }
    });
  }

  drawCursors(ctx, w, h, startTime, totalTimeSpan, isLight = false) {
    const yPixelsPerVolt = (h / 8) / this.voltsPerDiv;
    const centerY = (h / 2) + (this.voltOffset || 0) * yPixelsPerVolt;

    // --- 1. Draw Time Cursors (X1, X2) ---
    if (this.cursorMode === 'TIME' || this.cursorMode === 'DUAL') {
      const x1 = this.cursor1 * w;
      const x2 = this.cursor2 * w;

      ctx.save();
      ctx.lineWidth = 1.5;

      // Cursor 1 (Cyan)
      ctx.strokeStyle = isLight ? '#0284c7' : '#06b6d4';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, 0); ctx.lineTo(x1, h);
      ctx.stroke();

      // C1 Top Flag
      ctx.fillStyle = isLight ? '#0284c7' : '#06b6d4';
      ctx.fillRect(x1 - 14, 0, 28, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Roboto Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('C1', x1, 12);

      // Cursor 2 (Amber)
      ctx.strokeStyle = isLight ? '#d97706' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(x2, 0); ctx.lineTo(x2, h);
      ctx.stroke();

      // C2 Top Flag
      ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
      ctx.fillRect(x2 - 14, 0, 28, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('C2', x2, 12);
      ctx.setLineDash([]);

      // --- Draw Waveform Intersection Nodes & Exact Voltage Badges ---
      this.measurements.forEach((m) => {
        const y1 = centerY - m.vCursor1 * yPixelsPerVolt;
        const y2 = centerY - m.vCursor2 * yPixelsPerVolt;

        // C1 Node & Voltage Badge
        ctx.fillStyle = m.color || '#00d2ff';
        ctx.beginPath();
        ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Exact Voltage Tag for C1
        const label1 = `${m.name}: ${formatValueWithPrefix(m.vCursor1, 'V')}`;
        ctx.font = 'bold 9.5px Roboto Mono, monospace';
        const tag1W = ctx.measureText(label1).width + 8;
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.9)';
        ctx.fillRect(x1 + 6, Math.max(16, Math.min(h - 20, y1 - 8)), tag1W, 16);
        ctx.strokeStyle = m.color || '#00d2ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x1 + 6, Math.max(16, Math.min(h - 20, y1 - 8)), tag1W, 16);
        ctx.fillStyle = m.color || '#00d2ff';
        ctx.textAlign = 'left';
        ctx.fillText(label1, x1 + 10, Math.max(28, Math.min(h - 8, y1 + 4)));

        // C2 Node & Voltage Badge
        ctx.fillStyle = m.color || '#00d2ff';
        ctx.beginPath();
        ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Exact Voltage Tag for C2
        const label2 = `${m.name}: ${formatValueWithPrefix(m.vCursor2, 'V')}`;
        const tag2W = ctx.measureText(label2).width + 8;
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.9)';
        ctx.fillRect(x2 + 6, Math.max(16, Math.min(h - 20, y2 - 8)), tag2W, 16);
        ctx.strokeStyle = m.color || '#00d2ff';
        ctx.strokeRect(x2 + 6, Math.max(16, Math.min(h - 20, y2 - 8)), tag2W, 16);
        ctx.fillStyle = m.color || '#00d2ff';
        ctx.fillText(label2, x2 + 10, Math.max(28, Math.min(h - 8, y2 + 4)));
      });

      ctx.restore();
    }

    // --- 2. Draw Voltage Cursors (Y1, Y2) ---
    if (this.cursorMode === 'VOLTAGE' || this.cursorMode === 'DUAL') {
      const y1 = this.cursorY1 * h;
      const y2 = this.cursorY2 * h;
      const v1 = this.getVoltageFromYRatio(this.cursorY1);
      const v2 = this.getVoltageFromYRatio(this.cursorY2);

      ctx.save();
      ctx.lineWidth = 1.5;

      // Voltage Cursor 1 (Emerald)
      ctx.strokeStyle = isLight ? '#059669' : '#10b981';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y1); ctx.lineTo(w, y1);
      ctx.stroke();

      // Y1 Left Flag
      const tagY1 = `Y1: ${formatValueWithPrefix(v1, 'V')}`;
      ctx.font = 'bold 9.5px Roboto Mono, monospace';
      const wY1 = ctx.measureText(tagY1).width + 8;
      ctx.fillStyle = isLight ? '#059669' : '#10b981';
      ctx.fillRect(w - wY1 - 8, y1 - 8, wY1, 16);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(tagY1, w - wY1 - 4, y1 + 4);

      // Voltage Cursor 2 (Purple)
      ctx.strokeStyle = isLight ? '#9333ea' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(0, y2); ctx.lineTo(w, y2);
      ctx.stroke();

      // Y2 Left Flag
      const tagY2 = `Y2: ${formatValueWithPrefix(v2, 'V')}`;
      const wY2 = ctx.measureText(tagY2).width + 8;
      ctx.fillStyle = isLight ? '#9333ea' : '#a855f7';
      ctx.fillRect(w - wY2 - 8, y2 - 8, wY2, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagY2, w - wY2 - 4, y2 + 4);

      ctx.setLineDash([]);
      ctx.restore();
    }

    // --- 3. Compact HUD Readout Bar (Top Left) ---
    this.drawHUD(ctx, w, h, isLight);
  }

  drawHUD(ctx, w, h, isLight = false) {
    const cm = this.cursorMeasurements;
    const firstProbeMeas = Array.from(this.measurements.values())[0];

    const boxW = Math.max(180, Math.min(360, w - 24));
    ctx.save();
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(12, 12, boxW, 56);
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, boxW, 56);

    ctx.font = '10.5px Roboto Mono, monospace';
    const col2X = boxW > 260 ? 180 : Math.floor(boxW / 2) + 6;

    if (this.cursorMode === 'VOLTAGE') {
      ctx.fillStyle = isLight ? '#059669' : '#10b981';
      ctx.fillText(`Y1: ${formatValueWithPrefix(cm.y1Volt, 'V')}`, 20, 30);
      ctx.fillStyle = isLight ? '#9333ea' : '#a855f7';
      ctx.fillText(`Y2: ${formatValueWithPrefix(cm.y2Volt, 'V')}`, col2X, 30);
      ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
      ctx.fillText(`ΔV: ${formatValueWithPrefix(cm.dyVolt, 'V')}`, 20, 52);
    } else {
      const v1Str = firstProbeMeas ? ` (${formatValueWithPrefix(firstProbeMeas.vCursor1, 'V')})` : '';
      const v2Str = firstProbeMeas ? ` (${formatValueWithPrefix(firstProbeMeas.vCursor2, 'V')})` : '';
      const dvStr = firstProbeMeas ? ` | ΔV: ${formatValueWithPrefix(Math.abs(firstProbeMeas.dvCursor), 'V')}` : '';

      ctx.fillStyle = isLight ? '#0284c7' : '#06b6d4';
      ctx.fillText(`C1: ${formatValueWithPrefix(cm.t1, 's')}${v1Str}`, 20, 30);

      ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
      ctx.fillText(`C2: ${formatValueWithPrefix(cm.t2, 's')}${v2Str}`, col2X, 30);

      ctx.fillStyle = isLight ? '#059669' : '#10b981';
      ctx.fillText(`Δt: ${formatValueWithPrefix(cm.dt, 's')}${dvStr}`, 20, 52);
      ctx.fillText(`1/Δt: ${formatValueWithPrefix(cm.freq, 'Hz')}`, col2X, 52);
    }

    ctx.restore();
  }

  drawLegendAndMeasurements(ctx, w, h, isLight = false) {
    const history = this.engine.history;
    if (history.length === 0) return;

    let offsetX = w - 20;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Lato, sans-serif';

    this.measurements.forEach((m) => {
      const vppStr = formatValueWithPrefix(m.vpp, 'Vpp');
      const rmsStr = formatValueWithPrefix(m.rms, 'Vrms');
      const text = `${m.name}: ${vppStr} (${rmsStr})`;

      ctx.fillStyle = m.color || '#03b585';
      ctx.fillRect(offsetX - ctx.measureText(text).width - 16, 15, 10, 10);
      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.fillText(text, offsetX, 24);
      offsetX -= ctx.measureText(text).width + 30;
    });

    // Scale info at bottom left
    ctx.textAlign = 'left';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px Lato, sans-serif';
    ctx.fillText(`Time: ${formatValueWithPrefix(this.timePerDiv, 's')}/div  |  Voltage: ${formatValueWithPrefix(this.voltsPerDiv, 'V')}/div`, 15, h - 12);

    ctx.restore();
  }

  // --- Real-Time Quick Parameters Panel DOM Updater ---
  updateQuickPanelDOM() {
    const panel = document.getElementById('croQuickPanel');
    if (!panel || panel.style.display === 'none') return;

    const tabsContainer = document.getElementById('croChannelTabs');
    const probeIds = Array.from(this.measurements.keys());

    // Render channel tabs if changed
    if (tabsContainer) {
      let tabsHtml = `<button class="cro-tab-btn ${this.selectedChannel === 'ALL' ? 'active' : ''}" data-channel="ALL">All Channels</button>`;
      probeIds.forEach(id => {
        const m = this.measurements.get(id);
        const isActive = this.selectedChannel === id;
        tabsHtml += `<button class="cro-tab-btn ${isActive ? 'active' : ''}" data-channel="${id}" style="color: ${m.color || '#00d2ff'};">${m.name}</button>`;
      });
      tabsContainer.innerHTML = tabsHtml;

      tabsContainer.querySelectorAll('.cro-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setChannelFocus(btn.dataset.channel);
        });
      });
    }

    // Determine target measurement object
    let targetMeas = null;
    if (this.selectedChannel !== 'ALL' && this.measurements.has(this.selectedChannel)) {
      targetMeas = this.measurements.get(this.selectedChannel);
    } else if (probeIds.length > 0) {
      targetMeas = this.measurements.get(probeIds[0]);
    }

    const setVal = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.textContent = val;
    };

    if (targetMeas) {
      setVal('croValFreq', targetMeas.freq > 0 ? formatValueWithPrefix(targetMeas.freq, 'Hz') : '-- Hz');
      setVal('croValPeriod', targetMeas.period > 0 ? formatValueWithPrefix(targetMeas.period, 's') : '-- s');
      setVal('croValAmp', formatValueWithPrefix(targetMeas.amp, 'V'));
      setVal('croValVpp', formatValueWithPrefix(targetMeas.vpp, 'V'));
      setVal('croValVmax', formatValueWithPrefix(targetMeas.max, 'V'));
      setVal('croValVmin', formatValueWithPrefix(targetMeas.min, 'V'));
      setVal('croValVrms', formatValueWithPrefix(targetMeas.rms, 'V'));
      setVal('croValVmean', formatValueWithPrefix(targetMeas.mean, 'V'));

      // Cursor live readouts
      setVal('croCursor1Time', `t₁ = ${formatValueWithPrefix(this.cursorMeasurements.t1, 's')}`);
      setVal('croCursor1Volt', `V₁ = ${formatValueWithPrefix(targetMeas.vCursor1, 'V')}`);
      setVal('croCursor2Time', `t₂ = ${formatValueWithPrefix(this.cursorMeasurements.t2, 's')}`);
      setVal('croCursor2Volt', `V₂ = ${formatValueWithPrefix(targetMeas.vCursor2, 'V')}`);
      setVal('croCursorDeltaTime', `Δt = ${formatValueWithPrefix(this.cursorMeasurements.dt, 's')}`);
      setVal('croCursorDeltaVolt', `ΔV = ${formatValueWithPrefix(Math.abs(targetMeas.dvCursor), 'V')}`);
      setVal('croCursorDeltaFreq', `1/Δt = ${formatValueWithPrefix(this.cursorMeasurements.freq, 'Hz')}`);
    } else {
      setVal('croValFreq', '-- Hz');
      setVal('croValPeriod', '-- s');
      setVal('croValAmp', '-- V');
      setVal('croValVpp', '-- V');
      setVal('croValVmax', '-- V');
      setVal('croValVmin', '-- V');
      setVal('croValVrms', '-- V');
      setVal('croValVmean', '-- V');

      setVal('croCursor1Time', `t₁ = ${formatValueWithPrefix(this.cursorMeasurements.t1, 's')}`);
      setVal('croCursor1Volt', 'V₁ = -- V');
      setVal('croCursor2Time', `t₂ = ${formatValueWithPrefix(this.cursorMeasurements.t2, 's')}`);
      setVal('croCursor2Volt', 'V₂ = -- V');
      setVal('croCursorDeltaTime', `Δt = ${formatValueWithPrefix(this.cursorMeasurements.dt, 's')}`);
      setVal('croCursorDeltaVolt', 'ΔV = -- V');
      setVal('croCursorDeltaFreq', `1/Δt = ${formatValueWithPrefix(this.cursorMeasurements.freq, 'Hz')}`);
    }
  }
}
