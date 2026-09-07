/**
 * Switcha Blocks — Multi-Channel Scope Visualizer & Control Systems Analyzer
 * Computes:
 * - Real-time multichannel signal plotting (CH1, CH2, CH3, CH4)
 * - Control step response metrics:
 *   - Rise Time (tr: 10% to 90%)
 *   - Settling Time (ts: within 2% or 5% error band)
 *   - Peak Time (tp)
 *   - Percent Peak Overshoot (Mp %)
 *   - Steady-State Error (ess)
 * - Interactive time scrubbers and amplitude cursors
 */

import { formatValueWithPrefix } from '../engine/components.js';

export class BlockScope {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.timeData = [];
    this.channels = new Map(); // channelKey -> Array<number>
    this.history = []; // Array of { time, signals: { 'blk_1:CH1': val, ... } }

    this.timeSpan = 5.0; // Seconds displayed
    this.autoScale = true;
    this.yMin = -2.0;
    this.yMax = 2.0;
    this.cursor1 = 0.25;
    this.cursor2 = 0.75;
    this.activeChannel = 'ALL';

    this.metrics = {
      riseTime: 0,
      settlingTime: 0,
      peakTime: 0,
      overshootPct: 0,
      finalValue: 0
    };

    if (this.canvas) {
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

  setHistory(history) {
    this.history = history || [];
    this.computeStepMetrics();
    this.render();
  }

  computeStepMetrics() {
    if (!this.history || this.history.length < 20) return;

    // Analyze first active channel signal
    const sampleKeys = Object.keys(this.history[this.history.length - 1].signals || {});
    if (sampleKeys.length === 0) return;
    const targetKey = sampleKeys[0];

    const len = this.history.length;
    const finalVal = this.history[len - 1].signals[targetKey] || 0.0;
    const initialVal = this.history[0].signals[targetKey] || 0.0;
    const stepSize = finalVal - initialVal;

    if (Math.abs(stepSize) < 1e-4) return;

    let t10 = null, t90 = null, maxVal = -Infinity, tPeak = 0;

    for (let i = 0; i < len; i++) {
      const pt = this.history[i];
      const val = pt.signals[targetKey] || 0.0;
      const normalized = (val - initialVal) / stepSize;

      if (t10 === null && normalized >= 0.1) t10 = pt.time;
      if (t90 === null && normalized >= 0.9) t90 = pt.time;

      if (val > maxVal) {
        maxVal = val;
        tPeak = pt.time;
      }
    }

    const riseTime = (t10 !== null && t90 !== null && t90 >= t10) ? (t90 - t10) : 0;
    const overshootPct = finalVal !== 0 ? Math.max(0, ((maxVal - finalVal) / Math.abs(finalVal)) * 100) : 0;

    // Settling time (2% band)
    let settlingTime = 0;
    for (let i = len - 1; i >= 0; i--) {
      const val = this.history[i].signals[targetKey] || 0.0;
      if (Math.abs(val - finalVal) > 0.02 * Math.abs(stepSize)) {
        settlingTime = this.history[i].time;
        break;
      }
    }

    this.metrics = {
      riseTime,
      settlingTime,
      peakTime: tPeak,
      overshootPct,
      finalValue: finalVal
    };
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Dark Scope Background
    ctx.fillStyle = '#051923';
    ctx.fillRect(0, 0, w, h);

    // Grid Lines (10 x 8 divisions)
    ctx.strokeStyle = '#0a2e38';
    ctx.lineWidth = 1;
    for (let c = 0; c <= 10; c++) {
      const x = (c / 10) * w;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let r = 0; r <= 8; r++) {
      const y = (r / 8) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Center Zero Crosshair
    ctx.strokeStyle = '#0f4c5c';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

    if (!this.history || this.history.length === 0) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No simulation data. Run the block model to inspect waveforms.', w / 2, h / 2);
      return;
    }

    const tEnd = this.history[this.history.length - 1].time;
    const tStart = Math.max(0, tEnd - this.timeSpan);
    const timeRange = Math.max(tEnd - tStart, 1e-6);

    // Auto-scale Y
    let minVal = Infinity, maxVal = -Infinity;
    this.history.forEach(pt => {
      Object.values(pt.signals || {}).forEach(v => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });

    if (this.autoScale && minVal !== Infinity && maxVal !== -Infinity) {
      const margin = Math.max(Math.abs(maxVal - minVal) * 0.15, 0.5);
      this.yMin = minVal - margin;
      this.yMax = maxVal + margin;
    }

    const yRange = Math.max(this.yMax - this.yMin, 1e-6);
    const colors = ['#00f5d4', '#fee440', '#f15bb5', '#00bbf9', '#9b5de5'];

    // Draw signals
    const channelKeys = Object.keys(this.history[this.history.length - 1].signals || {});

    channelKeys.forEach((key, chIdx) => {
      const color = colors[chIdx % colors.length];
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;

      let started = false;
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        if (pt.time < tStart && i < this.history.length - 1 && this.history[i + 1].time < tStart) continue;

        const val = pt.signals[key] ?? 0.0;
        const x = ((pt.time - tStart) / timeRange) * w;
        const y = h - ((val - this.yMin) / yRange) * h;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Legend in top-left
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(`${key.split(':')[1] || key}`, 12 + chIdx * 80, 18);
    });

    // Control Metrics Overlay in top-right
    if (this.metrics.riseTime > 0 || this.metrics.overshootPct > 0) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'right';
      ctx.fillText(`tr: ${formatValueWithPrefix(this.metrics.riseTime, 's')} | ts: ${formatValueWithPrefix(this.metrics.settlingTime, 's')} | Mp: ${this.metrics.overshootPct.toFixed(1)}% | y(∞): ${this.metrics.finalValue.toFixed(3)}`, w - 12, 18);
    }
  }

  recordSample(time, signals = {}) {
    if (!this.timeData) this.timeData = [];
    this.timeData.push(time);
    for (const [key, val] of Object.entries(signals)) {
      if (!this.channels.has(key)) {
        this.channels.set(key, []);
      }
      this.channels.get(key).push(val);
    }
    if (this.timeData.length > (this.maxPoints || 5000)) {
      this.timeData.shift();
      this.channels.forEach(arr => arr.shift());
    }
    this.render();
  }

  computeStepMetrics(channelKey, targetStep = 1.0) {
    const ch = this.channels.get(channelKey);
    if (!ch || ch.length < 10) return null;
    let yMax = -Infinity;
    let tMax = 0;
    const n = ch.length;
    const finalVal = ch[n - 1];

    for (let i = 0; i < n; i++) {
      if (ch[i] > yMax) {
        yMax = ch[i];
        tMax = this.timeData[i];
      }
    }

    const overshootPercent = Math.max(0, ((yMax - finalVal) / (finalVal || 1.0)) * 100);
    const steadyStateError = Math.abs(targetStep - finalVal);

    // 10% to 90% Rise time
    const y10 = finalVal * 0.1;
    const y90 = finalVal * 0.9;
    let t10 = 0, t90 = 0;
    for (let i = 0; i < n; i++) {
      if (ch[i] >= y10 && t10 === 0) t10 = this.timeData[i];
      if (ch[i] >= y90 && t90 === 0) t90 = this.timeData[i];
    }
    const riseTime = t90 > t10 ? t90 - t10 : 0;

    // 2% Settling time
    let settlingTime = 0;
    const band = Math.abs(finalVal) * 0.02;
    for (let i = n - 1; i >= 0; i--) {
      if (Math.abs(ch[i] - finalVal) > band) {
        settlingTime = this.timeData[i];
        break;
      }
    }

    return {
      peakValue: yMax,
      peakTime: tMax,
      overshootPercent,
      riseTime,
      settlingTime,
      steadyStateError,
      finalValue: finalVal
    };
  }
}

const SwitchaBlocksScope = BlockScope;

if (typeof window !== 'undefined') {
  window.BlockScope = BlockScope;
  window.SwitchaBlocksScope = SwitchaBlocksScope;
}

export { SwitchaBlocksScope };

