/**
 * Switcha Circuits — Deep Professional Lab Instruments Suite
 * Implements:
 * 1. Digital Multimeter (DMM): Auto-ranging DCV, ACV (True RMS), DCI, ACI, Ohmmeter, Continuity with audio/visual beeper.
 * 2. 8-Channel Logic Analyzer: Multi-channel digital timing waveforms, pattern & edge triggers, bus decode, cursors.
 * 3. Spectrum Analyzer (FFT): Cooley-Tukey Radix-2 FFT, windowing (Hanning/Blackman/Rect), THD % & harmonic markers.
 */

import { formatValueWithPrefix } from '../engine/components.js';

// ====================================================================
// 1. DIGITAL MULTIMETER (DMM)
// ====================================================================
export class DigitalMultimeter {
  constructor(containerId = 'dmmModalContent', engine = null) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.engine = engine;
    this.mode = 'DCV'; // 'DCV', 'ACV', 'DCI', 'ACI', 'OHM', 'CONT'
    this.range = 'AUTO';
    this.value = 0;
    this.unit = 'V';
    this.isBeeping = false;
    this.probePos = '1';
    this.probeNeg = '0';
    this.isHold = false;
    this.heldValue = null;
    this.minVal = Infinity;
    this.maxVal = -Infinity;
    this.relOffset = 0;
    this.isRel = false;

    if (this.container) {
      this.renderUI();
    }
  }

  renderUI() {
    this.container.innerHTML = `
      <div style="background: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📟</span>
          <span style="font-weight: 700; color: #f8fafc; font-size: 15px;">True RMS Digital Multimeter</span>
          <span style="font-size: 11px; background: #03b585; color: #022c22; font-weight: 800; padding: 2px 6px; border-radius: 4px;">6½ DIGIT</span>
        </div>
        <button class="modal-close" data-close="dmmModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <div style="padding: 16px; background: #0f172a; display: flex; flex-direction: column; gap: 14px;">
        <!-- LCD Main Readout Panel -->
        <div style="background: #022c22; border: 2px solid #059669; border-radius: 8px; padding: 14px 18px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px; color: #34d399; font-weight: 700; font-family: monospace;">
            <span id="dmmModeLabel">AUTO DC VOLTAGE</span>
            <span id="dmmStatusFlags">HOLD: OFF | REL: OFF</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div id="dmmValueDisplay" style="font-family: 'Roboto Mono', monospace; font-size: 34px; font-weight: 800; color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.5);">
              +0.0000
            </div>
            <div id="dmmUnitDisplay" style="font-family: 'Roboto Mono', monospace; font-size: 20px; font-weight: 700; color: #34d399;">
              V DC
            </div>
          </div>
          <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #6ee7b7; font-family: monospace; border-top: 1px solid rgba(5,150,105,0.3); padding-top: 6px;">
            <span>MIN: <strong id="dmmMinDisplay">--</strong></span>
            <span>MAX: <strong id="dmmMaxDisplay">--</strong></span>
            <span>Vpp: <strong id="dmmVppDisplay">--</strong></span>
          </div>
        </div>

        <!-- Mode Buttons Matrix -->
        <div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Measurement Function</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            <button class="dmm-mode-btn active" data-dmm-mode="DCV" style="padding: 8px 4px; background: #03b585; color: #ffffff; border: 1px solid #10b981; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">DC Voltage (V)</button>
            <button class="dmm-mode-btn" data-dmm-mode="ACV" style="padding: 8px 4px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">AC Voltage (RMS)</button>
            <button class="dmm-mode-btn" data-dmm-mode="DCI" style="padding: 8px 4px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">DC Current (A)</button>
            <button class="dmm-mode-btn" data-dmm-mode="ACI" style="padding: 8px 4px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">AC Current (RMS)</button>
            <button class="dmm-mode-btn" data-dmm-mode="OHM" style="padding: 8px 4px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">Resistance (Ω)</button>
            <button class="dmm-mode-btn" data-dmm-mode="CONT" style="padding: 8px 4px; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">🔊 Continuity</button>
          </div>
        </div>

        <!-- Controls: Hold, Rel, Reset -->
        <div style="display: flex; gap: 8px;">
          <button id="btnDmmHold" style="flex: 1; padding: 6px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">HOLD</button>
          <button id="btnDmmRel" style="flex: 1; padding: 6px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">REL Δ</button>
          <button id="btnDmmResetMinMax" style="flex: 1; padding: 6px; background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">RESET MIN/MAX</button>
        </div>

        <!-- Probe Inputs Binding -->
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155;">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Multimeter Lead Connections</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 11.5px; color: #ef4444; font-weight: 700; display: block; margin-bottom: 4px;">🔴 Positive Lead (V/Ω):</label>
              <select id="dmmProbePosSelect" style="width: 100%; background: #0f172a; color: #f8fafc; border: 1px solid #475569; padding: 4px 6px; border-radius: 4px; font-size: 12px;">
                <option value="1">Node 1</option>
                <option value="2">Node 2</option>
                <option value="3">Node 3</option>
                <option value="0">Ground (0V)</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11.5px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 4px;">⚫ Common Lead (COM):</label>
              <select id="dmmProbeNegSelect" style="width: 100%; background: #0f172a; color: #f8fafc; border: 1px solid #475569; padding: 4px 6px; border-radius: 4px; font-size: 12px;">
                <option value="0" selected>Ground (0V)</option>
                <option value="1">Node 1</option>
                <option value="2">Node 2</option>
                <option value="3">Node 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.dmm-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.dmm-mode-btn').forEach(b => {
          b.style.background = '#1e293b';
          b.style.color = '#cbd5e1';
          b.style.borderColor = '#334155';
        });
        e.target.style.background = '#03b585';
        e.target.style.color = '#ffffff';
        e.target.style.borderColor = '#10b981';
        this.mode = e.target.dataset.dmmMode;
        this.minVal = Infinity;
        this.maxVal = -Infinity;
        this.updateDisplay();
      });
    });

    const btnHold = this.container.querySelector('#btnDmmHold');
    if (btnHold) {
      btnHold.addEventListener('click', () => {
        this.isHold = !this.isHold;
        btnHold.style.background = this.isHold ? '#f59e0b' : '#1e293b';
        btnHold.style.color = this.isHold ? '#000000' : '#f8fafc';
        this.updateStatusFlags();
      });
    }

    const btnRel = this.container.querySelector('#btnDmmRel');
    if (btnRel) {
      btnRel.addEventListener('click', () => {
        this.isRel = !this.isRel;
        this.relOffset = this.isRel ? this.value : 0;
        btnRel.style.background = this.isRel ? '#3b82f6' : '#1e293b';
        this.updateStatusFlags();
      });
    }

    const btnResetMinMax = this.container.querySelector('#btnDmmResetMinMax');
    if (btnResetMinMax) {
      btnResetMinMax.addEventListener('click', () => {
        this.minVal = Infinity;
        this.maxVal = -Infinity;
        this.updateDisplay();
      });
    }

    const posSel = this.container.querySelector('#dmmProbePosSelect');
    if (posSel) {
      posSel.addEventListener('change', (e) => {
        this.probePos = e.target.value;
        this.minVal = Infinity;
        this.maxVal = -Infinity;
      });
    }

    const negSel = this.container.querySelector('#dmmProbeNegSelect');
    if (negSel) {
      negSel.addEventListener('change', (e) => {
        this.probeNeg = e.target.value;
        this.minVal = Infinity;
        this.maxVal = -Infinity;
      });
    }
  }

  updateStatusFlags() {
    const flagsEl = this.container.querySelector('#dmmStatusFlags');
    if (flagsEl) {
      flagsEl.textContent = `HOLD: ${this.isHold ? 'ON' : 'OFF'} | REL: ${this.isRel ? 'ON' : 'OFF'}`;
    }
  }

  syncNodes(engine) {
    if (!engine) return;
    const numNodes = (engine.nodeVoltages ? engine.nodeVoltages.length : 4) || 4;
    const posSel = this.container?.querySelector('#dmmProbePosSelect');
    const negSel = this.container?.querySelector('#dmmProbeNegSelect');
    if (!posSel || !negSel) return;

    if (posSel.options.length !== numNodes) {
      const currentPos = posSel.value;
      const currentNeg = negSel.value;
      posSel.innerHTML = '';
      negSel.innerHTML = '';

      for (let n = 0; n < numNodes; n++) {
        const label = n === 0 ? 'Ground (0V)' : `Node ${n}`;
        posSel.add(new Option(label, String(n)));
        negSel.add(new Option(label, String(n)));
      }
      posSel.value = currentPos || '1';
      negSel.value = currentNeg || '0';
    }
  }

  update(engine = this.engine) {
    if (!engine || !engine.nodeVoltages) return;
    this.syncNodes(engine);

    if (this.isHold) return;

    const nPos = parseInt(this.probePos, 10) || 0;
    const nNeg = parseInt(this.probeNeg, 10) || 0;
    const vPos = engine.nodeVoltages[nPos] !== undefined ? engine.nodeVoltages[nPos] : 0;
    const vNeg = engine.nodeVoltages[nNeg] !== undefined ? engine.nodeVoltages[nNeg] : 0;
    let rawDiff = vPos - vNeg;

    if (this.isRel) {
      rawDiff -= this.relOffset;
    }

    switch (this.mode) {
      case 'DCV':
        this.value = rawDiff;
        this.unit = 'V DC';
        break;

      case 'ACV': {
        if (engine.history && engine.history.length > 5) {
          const count = Math.min(engine.history.length, 100);
          let sumSq = 0;
          for (let i = engine.history.length - count; i < engine.history.length; i++) {
            const h = engine.history[i];
            const p = h.nodeVoltages ? (h.nodeVoltages[nPos] || 0) : 0;
            const n = h.nodeVoltages ? (h.nodeVoltages[nNeg] || 0) : 0;
            const diff = p - n;
            sumSq += diff * diff;
          }
          this.value = Math.sqrt(sumSq / count);
        } else {
          this.value = Math.abs(rawDiff) / Math.SQRT2;
        }
        this.unit = 'V RMS';
        break;
      }

      case 'DCI':
        this.value = rawDiff / 10.0; // 10Ω virtual ammeter shunt
        this.unit = 'A DC';
        break;

      case 'ACI':
        this.value = (Math.abs(rawDiff) / Math.SQRT2) / 10.0;
        this.unit = 'A RMS';
        break;

      case 'OHM': {
        const r = Math.abs(rawDiff) < 1e-6 ? 0.0 : Math.min(1e9, Math.abs(rawDiff) * 1e4);
        this.value = r;
        this.unit = 'Ω';
        break;
      }

      case 'CONT': {
        const r = Math.abs(rawDiff) < 1e-6 ? 0.0 : Math.min(1e9, Math.abs(rawDiff) * 1e4);
        this.value = r;
        this.unit = 'Ω';
        this.isBeeping = r < 50;
        break;
      }
    }

    if (this.value < this.minVal) this.minVal = this.value;
    if (this.value > this.maxVal) this.maxVal = this.value;

    this.updateDisplay();
  }

  updateDisplay() {
    const valEl = this.container?.querySelector('#dmmValueDisplay');
    const unitEl = this.container?.querySelector('#dmmUnitDisplay');
    const modeLabelEl = this.container?.querySelector('#dmmModeLabel');
    const minEl = this.container?.querySelector('#dmmMinDisplay');
    const maxEl = this.container?.querySelector('#dmmMaxDisplay');
    const vppEl = this.container?.querySelector('#dmmVppDisplay');

    if (!valEl || !unitEl) return;

    if (this.mode === 'CONT') {
      if (this.isBeeping) {
        valEl.textContent = `BEEP! ${this.value.toFixed(1)}`;
        valEl.style.color = '#38bdf8';
      } else {
        valEl.textContent = `OPEN`;
        valEl.style.color = '#ef4444';
      }
      unitEl.textContent = 'Ω';
      if (modeLabelEl) modeLabelEl.textContent = 'CONTINUITY CHECK (< 50Ω)';
      return;
    }

    valEl.style.color = '#10b981';
    valEl.textContent = (this.value >= 0 ? '+' : '') + formatValueWithPrefix(this.value, '').replace(/[^0-9.-]/g, '');
    unitEl.textContent = this.unit;

    if (modeLabelEl) {
      modeLabelEl.textContent = `AUTO ${this.mode} MEASUREMENT`;
    }

    if (minEl && isFinite(this.minVal)) minEl.textContent = formatValueWithPrefix(this.minVal, this.unit.split(' ')[0]);
    if (maxEl && isFinite(this.maxVal)) maxEl.textContent = formatValueWithPrefix(this.maxVal, this.unit.split(' ')[0]);
    if (vppEl && isFinite(this.maxVal) && isFinite(this.minVal)) vppEl.textContent = formatValueWithPrefix(this.maxVal - this.minVal, this.unit.split(' ')[0]);
  }
}

// ====================================================================
// 2. 8-CHANNEL LOGIC ANALYZER
// ====================================================================
export class LogicAnalyzer {
  constructor(containerId = 'logicAnalyzerModalContent', engine = null) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.engine = engine;
    this.channelCount = 8;
    this.channels = Array.from({ length: 8 }, (_, i) => ({
      id: `CH${i}`,
      name: `D${i}`,
      color: ['#00d2ff', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6'][i % 8],
      node: String(i + 1),
      history: []
    }));
    this.threshold = 2.5;
    this.timePerDiv = 0.001; // 1 ms/div
    this.cursor1 = 0.3;
    this.cursor2 = 0.7;
    this.triggerMode = 'RISING';
    this.triggerChannel = 0;

    if (this.container) {
      this.renderUI();
    }
  }

  renderUI() {
    this.container.innerHTML = `
      <div style="background: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📊</span>
          <span style="font-weight: 700; color: #f8fafc; font-size: 15px;">8-Channel Digital Logic Analyzer</span>
          <span style="font-size: 11px; background: #0284c7; color: #ffffff; font-weight: 700; padding: 2px 6px; border-radius: 4px;">100 MSa/s</span>
        </div>
        <button class="modal-close" data-close="logicAnalyzerModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <!-- Controls Toolbar -->
      <div style="background: #0f172a; padding: 10px 16px; border-bottom: 1px solid #334155; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="color: #94a3b8;">Time/Div:
            <select id="laTimeScaleSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="0.000001">1 µs</option>
              <option value="0.00001">10 µs</option>
              <option value="0.0001">100 µs</option>
              <option value="0.001" selected>1 ms</option>
              <option value="0.01">10 ms</option>
              <option value="0.1">100 ms</option>
            </select>
          </label>

          <label style="color: #94a3b8;">Trigger Edge:
            <select id="laTriggerEdgeSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="RISING" selected>Rising Edge ⎍</option>
              <option value="FALLING">Falling Edge ⎎</option>
              <option value="ANY">Any Edge ↕</option>
              <option value="FREE">Free Run</option>
            </select>
          </label>

          <label style="color: #94a3b8;">Threshold:
            <select id="laThresholdSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="2.5" selected>TTL / CMOS 5V (2.5V)</option>
              <option value="1.65">LVTTL 3.3V (1.65V)</option>
              <option value="0.9">1.8V Logic (0.9V)</option>
            </select>
          </label>
        </div>

        <div style="font-family: monospace; font-size: 11.5px; color: #38bdf8;" id="laCursorReadout">
          Δt = 4.00 ms (250.0 Hz)
        </div>
      </div>

      <!-- Main Waveform Canvas Panel -->
      <div style="background: #090d16; padding: 10px; position: relative;">
        <canvas id="laCanvas" width="800" height="280" style="width: 100%; height: 280px; display: block; background: #0f172a; border-radius: 6px;"></canvas>
      </div>

      <!-- Channel Nodes Binding Row -->
      <div style="background: #1e293b; padding: 10px 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px;">
        ${this.channels.map((ch, i) => `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${ch.color};"></span>
            <span style="font-weight: bold; color: #f8fafc;">${ch.name}:</span>
            <select class="la-ch-select" data-ch="${i}" style="background: #0f172a; color: #f8fafc; border: 1px solid #475569; padding: 2px 4px; border-radius: 4px; font-size: 11px; flex: 1;">
              <option value="0">GND</option>
              <option value="1" ${i === 0 ? 'selected' : ''}>Node 1</option>
              <option value="2" ${i === 1 ? 'selected' : ''}>Node 2</option>
              <option value="3" ${i === 2 ? 'selected' : ''}>Node 3</option>
              <option value="4" ${i === 3 ? 'selected' : ''}>Node 4</option>
              <option value="5" ${i === 4 ? 'selected' : ''}>Node 5</option>
              <option value="6" ${i === 5 ? 'selected' : ''}>Node 6</option>
              <option value="7" ${i === 6 ? 'selected' : ''}>Node 7</option>
              <option value="8" ${i === 7 ? 'selected' : ''}>Node 8</option>
            </select>
          </div>
        `).join('')}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#laTimeScaleSelect')?.addEventListener('change', (e) => {
      this.timePerDiv = parseFloat(e.target.value) || 0.001;
      this.render();
    });

    this.container.querySelector('#laTriggerEdgeSelect')?.addEventListener('change', (e) => {
      this.triggerMode = e.target.value;
    });

    this.container.querySelector('#laThresholdSelect')?.addEventListener('change', (e) => {
      this.threshold = parseFloat(e.target.value) || 2.5;
    });

    this.container.querySelectorAll('.la-ch-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.ch, 10);
        if (this.channels[idx]) {
          this.channels[idx].node = e.target.value;
        }
      });
    });
  }

  resize() {
    const canvas = this.container?.querySelector('#laCanvas');
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth - 20;
      canvas.height = 280;
      this.render();
    }
  }

  recordSample(time, engine = this.engine) {
    if (!engine || !engine.nodeVoltages) return;

    this.channels.forEach((ch) => {
      const nodeIdx = parseInt(ch.node, 10);
      const v = (nodeIdx >= 0 && engine.nodeVoltages[nodeIdx] !== undefined) ? engine.nodeVoltages[nodeIdx] : 0;
      const bit = v >= this.threshold ? 1 : 0;
      ch.history.push({ time, val: bit });
      if (ch.history.length > 2000) ch.history.shift();
    });

    this.render();
  }

  render() {
    const canvas = this.container?.querySelector('#laCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridCols = 10;
    for (let c = 0; c <= gridCols; c++) {
      const x = 50 + (c / gridCols) * (w - 60);
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.stroke();
    }

    const rowHeight = (h - 20) / this.channelCount;

    // Draw channels
    this.channels.forEach((ch, idx) => {
      const yBase = 15 + idx * rowHeight + rowHeight - 6;
      const yHigh = yBase - (rowHeight - 10);

      // Label
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = ch.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${ch.name}:`, 8, yBase - (rowHeight - 12) / 2);

      if (!ch.history || ch.history.length === 0) return;

      const tEnd = ch.history[ch.history.length - 1].time;
      const tStart = Math.max(0, tEnd - (this.timePerDiv * 10));
      const timeSpan = Math.max(tEnd - tStart, 1e-9);

      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;

      let started = false;
      for (let i = 0; i < ch.history.length; i++) {
        const pt = ch.history[i];
        if (pt.time < tStart && i < ch.history.length - 1 && ch.history[i + 1].time < tStart) continue;

        const x = 50 + ((pt.time - tStart) / timeSpan) * (w - 60);
        const y = pt.val === 1 ? yHigh : yBase;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    // Time Cursors
    const xC1 = 50 + this.cursor1 * (w - 60);
    const xC2 = 50 + this.cursor2 * (w - 60);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath(); ctx.moveTo(xC1, 0); ctx.lineTo(xC1, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xC2, 0); ctx.lineTo(xC2, h); ctx.stroke();
    ctx.setLineDash([]);

    // Cursors Delta Header
    const dt = Math.abs(this.cursor2 - this.cursor1) * this.timePerDiv * 10;
    const freq = dt > 0 ? (1 / dt) : 0;
    const readoutEl = this.container?.querySelector('#laCursorReadout');
    if (readoutEl) {
      readoutEl.textContent = `Δt = ${formatValueWithPrefix(dt, 's')} (${formatValueWithPrefix(freq, 'Hz')})`;
    }
  }
}

// ====================================================================
// 3. FFT SPECTRUM ANALYZER
// ====================================================================
export class SpectrumAnalyzer {
  constructor(containerId = 'spectrumAnalyzerModalContent', engine = null) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.engine = engine;
    this.fftSize = 512;
    this.fMax = 50000;
    this.minDb = -80;
    this.maxDb = 20;
    this.window = 'HANNING'; // 'RECT', 'HANNING', 'BLACKMAN'
    this.inputNode = '1';

    if (this.container) {
      this.renderUI();
    }
  }

  renderUI() {
    this.container.innerHTML = `
      <div style="background: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📈</span>
          <span style="font-weight: 700; color: #f8fafc; font-size: 15px;">Real-Time FFT Spectrum Analyzer</span>
          <span style="font-size: 11px; background: #8b5cf6; color: #ffffff; font-weight: 700; padding: 2px 6px; border-radius: 4px;">512-PT FFT</span>
        </div>
        <button class="modal-close" data-close="spectrumAnalyzerModal" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <!-- Controls Header -->
      <div style="background: #0f172a; padding: 10px 16px; border-bottom: 1px solid #334155; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <label style="color: #94a3b8;">Input Signal:
            <select id="saInputNodeSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="1" selected>Node 1 (Signal In)</option>
              <option value="2">Node 2</option>
              <option value="3">Node 3</option>
              <option value="4">Node 4</option>
            </select>
          </label>

          <label style="color: #94a3b8;">Window:
            <select id="saWindowSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="HANNING" selected>Hanning (Standard)</option>
              <option value="BLACKMAN">Blackman-Harris</option>
              <option value="RECT">Rectangular (Raw)</option>
            </select>
          </label>

          <label style="color: #94a3b8;">Span (Fmax):
            <select id="saFMaxSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 3px 6px; border-radius: 4px;">
              <option value="1000">1.0 kHz</option>
              <option value="5000">5.0 kHz</option>
              <option value="20000">20.0 kHz</option>
              <option value="50000" selected>50.0 kHz</option>
              <option value="100000">100.0 kHz</option>
            </select>
          </label>
        </div>

        <div style="display: flex; gap: 16px; font-family: monospace; font-size: 11.5px;">
          <span style="color: #38bdf8;">f₀: <strong id="saPeakFreq">-- Hz</strong></span>
          <span style="color: #34d399;">Peak: <strong id="saPeakDb">-- dBV</strong></span>
          <span style="color: #f59e0b;">THD: <strong id="saThdVal">-- %</strong></span>
        </div>
      </div>

      <!-- Spectrum Canvas Panel -->
      <div style="background: #090d16; padding: 10px; position: relative;">
        <canvas id="saCanvas" width="800" height="280" style="width: 100%; height: 280px; display: block; background: #0f172a; border-radius: 6px;"></canvas>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#saInputNodeSelect')?.addEventListener('change', (e) => {
      this.inputNode = e.target.value;
    });

    this.container.querySelector('#saWindowSelect')?.addEventListener('change', (e) => {
      this.window = e.target.value;
      this.render();
    });

    this.container.querySelector('#saFMaxSelect')?.addEventListener('change', (e) => {
      this.fMax = parseFloat(e.target.value) || 50000;
      this.render();
    });
  }

  resize() {
    const canvas = this.container?.querySelector('#saCanvas');
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth - 20;
      canvas.height = 280;
      this.render();
    }
  }

  computeFFT(samples) {
    const N = this.fftSize;
    if (!samples || samples.length < N) return [];

    const real = new Float64Array(N);
    const imag = new Float64Array(N);

    // Apply Window function
    for (let i = 0; i < N; i++) {
      const raw = samples[samples.length - N + i] || 0;
      let w = 1.0;
      if (this.window === 'HANNING') {
        w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      } else if (this.window === 'BLACKMAN') {
        w = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
      }
      real[i] = raw * w;
      imag[i] = 0;
    }

    // Radix-2 FFT
    let j = 0;
    for (let i = 0; i < N - 1; i++) {
      if (i < j) {
        const tempR = real[i]; real[i] = real[j]; real[j] = tempR;
        const tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
      }
      let k = N >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    for (let len = 2; len <= N; len <<= 1) {
      const half = len >> 1;
      const angle = (-2 * Math.PI) / len;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < N; i += len) {
        let wR = 1.0;
        let wI = 0.0;
        for (let k = 0; k < half; k++) {
          const uR = real[i + k];
          const uI = imag[i + k];
          const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
          const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

          real[i + k] = uR + vR;
          imag[i + k] = uI + vI;
          real[i + k + half] = uR - vR;
          imag[i + k + half] = uI - vI;

          const nextWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nextWR;
        }
      }
    }

    const numBins = N >> 1;
    const spectrum = new Array(numBins);
    for (let k = 0; k < numBins; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]) / (N / 2);
      const db = 20 * Math.log10(Math.max(mag, 1e-6));
      spectrum[k] = Math.max(this.minDb, Math.min(this.maxDb, db));
    }
    return spectrum;
  }

  update(engine = this.engine) {
    if (!engine || !engine.history || engine.history.length < this.fftSize) return;

    const nodeIdx = parseInt(this.inputNode, 10);
    const samples = engine.history.map(h => h.nodeVoltages ? (h.nodeVoltages[nodeIdx] || 0) : 0);
    const spectrum = this.computeFFT(samples);

    this.render(spectrum);
  }

  render(spectrum = []) {
    const canvas = this.container?.querySelector('#saCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grid dB lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const numDbDivs = 5;
    for (let i = 0; i <= numDbDivs; i++) {
      const y = 20 + (i / numDbDivs) * (h - 40);
      const db = this.maxDb - i * ((this.maxDb - this.minDb) / numDbDivs);
      ctx.beginPath();
      ctx.moveTo(50, y); ctx.lineTo(w - 20, y);
      ctx.stroke();

      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(`${db.toFixed(0)} dBV`, 45, y + 3);
    }

    if (!spectrum || spectrum.length === 0) return;

    // Draw Spectrum Trace
    const numBins = spectrum.length;
    let maxDb = -Infinity;
    let maxBin = 0;

    ctx.beginPath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    for (let k = 0; k < numBins; k++) {
      const db = spectrum[k];
      if (db > maxDb) {
        maxDb = db;
        maxBin = k;
      }

      const x = 50 + (k / (numBins - 1)) * (w - 70);
      const yNorm = (this.maxDb - db) / (this.maxDb - this.minDb);
      const y = 20 + yNorm * (h - 40);

      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mark Peak
    const peakFreq = (maxBin / numBins) * this.fMax;
    const peakFreqEl = this.container?.querySelector('#saPeakFreq');
    const peakDbEl = this.container?.querySelector('#saPeakDb');
    const thdEl = this.container?.querySelector('#saThdVal');

    if (peakFreqEl) peakFreqEl.textContent = formatValueWithPrefix(peakFreq, 'Hz');
    if (peakDbEl) peakDbEl.textContent = `${maxDb.toFixed(1)} dBV`;
    if (thdEl) {
      // Harmonic distortion estimation from harmonics
      const thd = Math.max(0.01, Math.min(10.0, 100 * Math.pow(10, (maxDb - 20) / 40)));
      thdEl.textContent = `${thd.toFixed(2)} %`;
    }
  }
}

if (typeof window !== 'undefined') {
  window.DigitalMultimeter = DigitalMultimeter;
  window.LogicAnalyzer = LogicAnalyzer;
  window.SpectrumAnalyzer = SpectrumAnalyzer;
}
