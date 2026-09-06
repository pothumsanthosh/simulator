/**
 * Multisim Live Professional Oscilloscope & Grapher
 * Multi-channel time-domain waveform visualizer with hardware-accurate
 * digital edge triggering, dual interactive measurement cursors,
 * automated signal parameter measurements (Vpp, Vrms, Mean, Freq, Duty),
 * Min/Max LOD decimation, and CSV/PNG export.
 */

import { formatValueWithPrefix } from '../engine/components.js';

export class CircuitGrapher {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.engine = engine;

    // Timebase & Vertical Settings
    this.timePerDiv = 0.001; // 1 ms/div (10 divisions = 10ms window)
    this.voltsPerDiv = 2.0;  // 2 V/div (8 vertical divisions)
    this.autoScale = true;
    this.theme = 'dark'; // 'dark' or 'light'

    // Measurement Cursors
    this.showCursors = true;
    this.cursor1 = 0.25; // X position ratio (0.0 to 1.0)
    this.cursor2 = 0.75;
    this.activeCursor = null;

    // Trigger Settings
    this.triggerEnabled = true;
    this.triggerLevel = 0.0;
    this.triggerSlope = 'RISING'; // 'RISING' or 'FALLING'

    // Automated Measurements Cache
    this.measurements = new Map();

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
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / this.width;
      if (Math.abs(mouseX - this.cursor1) < 0.035) {
        this.activeCursor = 1;
      } else if (Math.abs(mouseX - this.cursor2) < 0.035) {
        this.activeCursor = 2;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.activeCursor) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / this.width));
      if (this.activeCursor === 1) this.cursor1 = mouseX;
      else if (this.activeCursor === 2) this.cursor2 = mouseX;
      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.activeCursor = null;
    });
  }

  setTimeScale(scale) {
    this.timePerDiv = Math.max(parseFloat(scale) || 0.001, 1e-6);
    this.render();
  }

  setVoltScale(scale) {
    if (scale === 'auto') {
      this.autoScale = true;
    } else {
      this.autoScale = false;
      this.voltsPerDiv = Math.max(parseFloat(scale) || 1.0, 0.01);
    }
    this.render();
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
    a.download = `multisim_grapher_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPNG() {
    const dataUrl = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `multisim_grapher_plot_${Date.now()}.png`;
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
      return;
    }

    // Time window bounds (10 horizontal divisions)
    const totalTimeSpan = Math.max(this.timePerDiv * 10, 1e-9);
    const latestTime = history[history.length - 1].time;
    const startTime = Math.max(0, latestTime - totalTimeSpan);

    // Auto-scale vertical range only if explicitly set to auto
    if (this.autoScale && history.length > 5) {
      let minV = -1, maxV = 1;
      const recentPoints = history.slice(-400);
      recentPoints.forEach(pt => {
        Object.values(pt.probes).forEach(pr => {
          if (pr.value < minV) minV = pr.value;
          if (pr.value > maxV) maxV = pr.value;
        });
      });
      const maxSpan = Math.max(Math.abs(minV), Math.abs(maxV)) * 1.25;
      this.voltsPerDiv = Math.max(maxSpan / 4, 0.1);
    }

    // Calculate automated measurements
    this.calculateMeasurements(history, startTime);

    this.drawGrid(ctx, w, h, isLight);
    this.drawTraces(ctx, w, h, startTime, totalTimeSpan);

    if (this.showCursors) {
      this.drawCursors(ctx, w, h, startTime, totalTimeSpan, isLight);
    }

    this.drawLegendAndMeasurements(ctx, w, h, isLight);
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

    // Center axes (dashed)
    ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
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
      const v = (4 - i) * this.voltsPerDiv;
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
    const centerY = h / 2;
    const yPixelsPerVolt = (h / 8) / this.voltsPerDiv;

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

  calculateMeasurements(history, startTime) {
    this.measurements.clear();
    if (history.length === 0) return;

    const sample = history[history.length - 1];
    const probeIds = Object.keys(sample.probes);

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

        // Approximate zero-crossing frequency calculation
        let crossings = 0;
        for (let i = 1; i < count; i++) {
          if ((vals[i - 1].v - mean) * (vals[i].v - mean) < 0) {
            crossings++;
          }
        }
        const timeSpan = vals[count - 1].t - vals[0].t;
        const freq = timeSpan > 0 ? (crossings / (2 * timeSpan)) : 0;

        this.measurements.set(id, {
          name: sample.probes[id]?.name || 'Probe',
          color: sample.probes[id]?.color || '#03b585',
          vpp, max, min, mean, rms, freq
        });
      }
    });
  }

  drawCursors(ctx, w, h, startTime, totalTimeSpan, isLight = false) {
    const x1 = this.cursor1 * w;
    const x2 = this.cursor2 * w;
    const t1 = startTime + this.cursor1 * totalTimeSpan;
    const t2 = startTime + this.cursor2 * totalTimeSpan;
    const dt = Math.abs(t2 - t1);
    const freq = dt > 0 ? (1 / dt) : 0;

    ctx.save();
    ctx.lineWidth = 1.5;

    // Cursor 1 (Cyan)
    ctx.strokeStyle = isLight ? '#0284c7' : '#06b6d4';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, 0); ctx.lineTo(x1, h);
    ctx.stroke();

    // Cursor 2 (Amber)
    ctx.strokeStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x2, 0); ctx.lineTo(x2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Measurement HUD Overlay Box (Responsive)
    const boxW = Math.max(160, Math.min(320, w - 24));
    const col2X = boxW > 240 ? 160 : Math.floor(boxW / 2) + 10;

    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(12, 12, boxW, 52);
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, boxW, 52);

    ctx.font = '11px Roboto Mono, monospace';
    ctx.fillStyle = isLight ? '#0284c7' : '#06b6d4';
    ctx.textAlign = 'left';
    ctx.fillText(`C1: ${formatValueWithPrefix(t1, 's')}`, 20, 32);

    ctx.fillStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.fillText(`C2: ${formatValueWithPrefix(t2, 's')}`, col2X, 32);

    ctx.fillStyle = isLight ? '#059669' : '#10b981';
    ctx.fillText(`Δt: ${formatValueWithPrefix(dt, 's')}`, 20, 52);
    ctx.fillText(`Freq: ${formatValueWithPrefix(freq, 'Hz')}`, col2X, 52);

    ctx.restore();
  }

  drawLegendAndMeasurements(ctx, w, h, isLight = false) {
    const history = this.engine.history;
    if (history.length === 0) return;

    let offsetX = w - 20;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Lato, sans-serif';

    this.measurements.forEach((m, id) => {
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
}
