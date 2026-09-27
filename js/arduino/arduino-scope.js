/**
 * e-Samastha — Lightweight Arduino Signal Oscilloscope & Waveform Monitor
 * 
 * Independent signal visualization module for microcontroller pins (Digital, PWM, Analog).
 * Does not modify or interfere with the Circuit Studio grapher.
 */

export class ArduinoScope {
  constructor(canvasElement, board) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.board = board;
    this.selectedPins = [9, 13, 14]; // Default: Pin 9 (PWM), Pin 13 (Builtin LED), A0 (Analog)
    this.channels = [
      { color: '#38bdf8', label: 'CH1' },
      { color: '#f59e0b', label: 'CH2' },
      { color: '#10b981', label: 'CH3' }
    ];
    this.historyLength = 150;
    this.pinHistories = new Map();

    for (const p of this.selectedPins) {
      this.pinHistories.set(p, new Array(this.historyLength).fill(0));
    }

    this.sampleTimer = null;
  }

  sample() {
    for (let i = 0; i < this.selectedPins.length; i++) {
      const pinKey = this.selectedPins[i];
      const pinObj = this.board.getPin(pinKey);
      const voltage = pinObj ? pinObj.voltage : 0.0;

      let hist = this.pinHistories.get(pinKey);
      if (!hist) {
        hist = new Array(this.historyLength).fill(0);
        this.pinHistories.set(pinKey, hist);
      }
      hist.push(voltage);
      if (hist.length > this.historyLength) {
        hist.shift();
      }
    }
  }

  setSelectedPin(channelIndex, pinKey) {
    const resolved = this.board.resolvePinIndex(pinKey);
    this.selectedPins[channelIndex] = resolved;
    if (!this.pinHistories.has(resolved)) {
      this.pinHistories.set(resolved, new Array(this.historyLength).fill(0));
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    // Horizontal 0V, 2.5V, 5V
    const y0V = h - 20;
    const y5V = 20;
    const y25V = (y0V + y5V) / 2;

    ctx.beginPath();
    ctx.moveTo(35, y5V); ctx.lineTo(w - 10, y5V);
    ctx.moveTo(35, y25V); ctx.lineTo(w - 10, y25V);
    ctx.moveTo(35, y0V); ctx.lineTo(w - 10, y0V);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('5.0V', 5, y5V + 3);
    ctx.fillText('2.5V', 5, y25V + 3);
    ctx.fillText('0.0V', 5, y0V + 3);

    // Vertical time grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 15);
      ctx.stroke();
    }

    // Render channels
    const plotWidth = w - 45;
    const stepX = plotWidth / (this.historyLength - 1);

    for (let c = 0; c < this.selectedPins.length; c++) {
      const pinKey = this.selectedPins[c];
      const hist = this.pinHistories.get(pinKey);
      if (!hist || hist.length === 0) continue;

      const chInfo = this.channels[c] || { color: '#38bdf8' };
      const pObj = this.board.getPin(pinKey);
      const pinName = pObj ? pObj.name : `Pin ${pinKey}`;

      ctx.save();
      ctx.strokeStyle = chInfo.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < hist.length; i++) {
        const vx = 40 + i * stepX;
        const normV = Math.max(0, Math.min(5.0, hist[i])) / 5.0;
        const vy = y0V - normV * (y0V - y5V);

        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.stroke();

      // Legend in top right
      ctx.fillStyle = chInfo.color;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${chInfo.label}: ${pinName} (${hist[hist.length - 1].toFixed(2)}V)`, w - 140, 16 + c * 13);
      ctx.restore();
    }
  }
}
