/**
 * SWITCHA CODE — MULTI-PANE SCIENTIFIC PLOTTING SUITE (SwitchaPlot)
 * Provides MATLAB/Python Matplotlib style 2D plotting, subplots, stem, scatter,
 * Bode plots, constellation diagrams, eye diagrams, and interactive inspection.
 */

class SwitchaPlotter {
    constructor(canvasContainer) {
        this.container = typeof canvasContainer === 'string' ? document.getElementById(canvasContainer) : canvasContainer;
        this.canvas = null;
        this.ctx = null;
        this.figures = [];
        this.activeSubplot = { rows: 1, cols: 1, index: 1 };
        this.subplots = new Map(); // key: "r,c,i" -> subplot state
        this.cursor = { x: 0, y: 0, active: false };
        this.panZoom = new Map(); // key: "r,c,i" -> { panX, panY, zoomX, zoomY }
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragTargetSubplot = null;

        this.colorPalette = [
            '#00ffcc', '#ff007f', '#00bfff', '#ffaa00',
            '#a066ff', '#00ff66', '#ff3333', '#ffff00',
            '#ffffff', '#8888aa'
        ];

        this.initDOM();
    }

    initDOM() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#0b0f19';
        this.container.style.overflow = 'hidden';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'plot-toolbar';
        toolbar.style.display = 'flex';
        toolbar.style.alignItems = 'center';
        toolbar.style.gap = '8px';
        toolbar.style.padding = '6px 12px';
        toolbar.style.backgroundColor = '#111827';
        toolbar.style.borderBottom = '1px solid #1f2937';
        toolbar.style.fontSize = '12px';
        toolbar.style.color = '#9ca3af';

        toolbar.innerHTML = `
            <span style="font-weight: 600; color: #00ffcc; margin-right: 8px;">📊 SwitchaPlot</span>
            <button id="plotBtnReset" class="btn-tool-sm" title="Reset View & Zoom" style="background:#1f2937; color:#e5e7eb; border:1px solid #374151; padding:2px 8px; border-radius:4px; cursor:pointer;">⟲ Reset View</button>
            <button id="plotBtnClear" class="btn-tool-sm" title="Clear Figures" style="background:#1f2937; color:#e5e7eb; border:1px solid #374151; padding:2px 8px; border-radius:4px; cursor:pointer;">🗑 Clear</button>
            <button id="plotBtnExportPNG" class="btn-tool-sm" title="Export as PNG" style="background:#1f2937; color:#e5e7eb; border:1px solid #374151; padding:2px 8px; border-radius:4px; cursor:pointer;">📷 Export PNG</button>
            <button id="plotBtnExportCSV" class="btn-tool-sm" title="Export Data as CSV" style="background:#1f2937; color:#e5e7eb; border:1px solid #374151; padding:2px 8px; border-radius:4px; cursor:pointer;">📑 Export CSV</button>
            <span style="flex:1;"></span>
            <div id="plotCursorReadout" style="font-family: monospace; color: #38bdf8;">(X: --, Y: --)</div>
        `;
        this.container.appendChild(toolbar);

        // Canvas container
        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.flex = '1';
        canvasWrapper.style.position = 'relative';
        canvasWrapper.style.width = '100%';
        canvasWrapper.style.height = '100%';
        canvasWrapper.style.overflow = 'hidden';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        canvasWrapper.appendChild(this.canvas);
        this.container.appendChild(canvasWrapper);

        this.ctx = this.canvas.getContext('2d');

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        setTimeout(() => this.resizeCanvas(), 50);

        toolbar.querySelector('#plotBtnReset').addEventListener('click', () => {
            this.panZoom.clear();
            this.render();
        });
        toolbar.querySelector('#plotBtnClear').addEventListener('click', () => {
            this.clf();
        });
        toolbar.querySelector('#plotBtnExportPNG').addEventListener('click', () => {
            this.exportPNG();
        });
        toolbar.querySelector('#plotBtnExportCSV').addEventListener('click', () => {
            this.exportCSV();
        });

        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    resizeCanvas() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.max(100, Math.floor(rect.width * dpr));
        this.canvas.height = Math.max(100, Math.floor(rect.height * dpr));
        this.render();
    }

    getSubplotKey(r, c, i) {
        return `${r},${c},${i}`;
    }

    getOrCreateSubplot(r = this.activeSubplot.rows, c = this.activeSubplot.cols, i = this.activeSubplot.index) {
        const key = this.getSubplotKey(r, c, i);
        if (!this.subplots.has(key)) {
            this.subplots.set(key, {
                row: r,
                col: c,
                idx: i,
                traces: [],
                title: '',
                xlabel: '',
                ylabel: '',
                grid: true,
                xlim: null,
                ylim: null,
                legend: [],
                hold: false,
                type: 'standard'
            });
        }
        return this.subplots.get(key);
    }

    // --- API Commands Called by Code Engine Runtime ---

    subplot(rows, cols, index) {
        this.activeSubplot = { rows: Math.max(1, rows), cols: Math.max(1, cols), index: Math.max(1, index) };
        this.getOrCreateSubplot();
    }

    clf() {
        this.subplots.clear();
        this.panZoom.clear();
        this.activeSubplot = { rows: 1, cols: 1, index: 1 };
        this.render();
    }

    hold(state = true) {
        const sp = this.getOrCreateSubplot();
        sp.hold = !!state;
    }

    grid(state = true) {
        const sp = this.getOrCreateSubplot();
        sp.grid = !!state;
        this.render();
    }

    title(text) {
        const sp = this.getOrCreateSubplot();
        sp.title = String(text);
        this.render();
    }

    xlabel(text) {
        const sp = this.getOrCreateSubplot();
        sp.xlabel = String(text);
        this.render();
    }

    ylabel(text) {
        const sp = this.getOrCreateSubplot();
        sp.ylabel = String(text);
        this.render();
    }

    xlim(limits) {
        const sp = this.getOrCreateSubplot();
        sp.xlim = Array.isArray(limits) && limits.length === 2 ? limits : null;
        this.render();
    }

    ylim(limits) {
        const sp = this.getOrCreateSubplot();
        sp.ylim = Array.isArray(limits) && limits.length === 2 ? limits : null;
        this.render();
    }

    legend(...labels) {
        const sp = this.getOrCreateSubplot();
        sp.legend = labels.flat();
        this.render();
    }

    plot(arg1, arg2, style = {}) {
        let x, y, opts = {};
        if (arg2 === undefined || (typeof arg2 === 'object' && !Array.isArray(arg2) && !(arg2 instanceof Float64Array))) {
            y = Array.from(arg1);
            x = y.map((_, idx) => idx);
            opts = typeof arg2 === 'object' ? arg2 : (typeof style === 'object' ? style : {});
        } else {
            x = Array.from(arg1);
            y = Array.from(arg2);
            opts = typeof style === 'object' ? style : {};
            if (typeof style === 'string') opts = { style };
        }

        const sp = this.getOrCreateSubplot();
        if (!sp.hold) {
            sp.traces = [];
        }

        const color = opts.color || this.colorPalette[sp.traces.length % this.colorPalette.length];
        sp.traces.push({
            type: 'line',
            x,
            y,
            color,
            lineWidth: opts.lineWidth || 2,
            lineDash: opts.lineDash || [],
            label: opts.label || `Trace ${sp.traces.length + 1}`
        });

        this.render();
    }

    stem(x, y, opts = {}) {
        let px, py;
        if (y === undefined || (typeof y === 'object' && !Array.isArray(y) && !(y instanceof Float64Array))) {
            py = Array.from(x);
            px = py.map((_, i) => i);
            opts = y || {};
        } else {
            px = Array.from(x);
            py = Array.from(y);
        }

        const sp = this.getOrCreateSubplot();
        if (!sp.hold) sp.traces = [];

        const color = opts.color || this.colorPalette[sp.traces.length % this.colorPalette.length];
        sp.traces.push({
            type: 'stem',
            x: px,
            y: py,
            color,
            lineWidth: opts.lineWidth || 1.5,
            label: opts.label || `Stem ${sp.traces.length + 1}`
        });
        this.render();
    }

    scatter(x, y, opts = {}) {
        let px, py;
        if (y === undefined || (typeof y === 'object' && !Array.isArray(y) && !(y instanceof Float64Array))) {
            py = Array.from(x);
            px = py.map((_, i) => i);
            opts = y || {};
        } else {
            px = Array.from(x);
            py = Array.from(y);
        }

        const sp = this.getOrCreateSubplot();
        if (!sp.hold) sp.traces = [];

        const color = opts.color || this.colorPalette[sp.traces.length % this.colorPalette.length];
        sp.traces.push({
            type: 'scatter',
            x: px,
            y: py,
            color,
            size: opts.size || 4,
            label: opts.label || `Scatter ${sp.traces.length + 1}`
        });
        this.render();
    }

    bar(x, y, opts = {}) {
        let px, py;
        if (y === undefined || (typeof y === 'object' && !Array.isArray(y) && !(y instanceof Float64Array))) {
            py = Array.from(x);
            px = py.map((_, i) => i);
            opts = y || {};
        } else {
            px = Array.from(x);
            py = Array.from(y);
        }

        const sp = this.getOrCreateSubplot();
        if (!sp.hold) sp.traces = [];

        const color = opts.color || this.colorPalette[sp.traces.length % this.colorPalette.length];
        sp.traces.push({
            type: 'bar',
            x: px,
            y: py,
            color,
            label: opts.label || `Bar ${sp.traces.length + 1}`
        });
        this.render();
    }

    bode(w, mag, phase) {
        this.clf();
        const freq = Array.from(w);
        const magArr = Array.from(mag);
        const phaseArr = Array.from(phase);

        this.subplot(2, 1, 1);
        const sp1 = this.getOrCreateSubplot();
        sp1.title = 'Bode Diagram — Magnitude';
        sp1.ylabel = 'Magnitude (dB)';
        sp1.traces.push({
            type: 'line',
            x: freq,
            y: magArr,
            color: '#00ffcc',
            lineWidth: 2,
            isLogX: true,
            label: 'Magnitude'
        });

        this.subplot(2, 1, 2);
        const sp2 = this.getOrCreateSubplot();
        sp2.title = 'Bode Diagram — Phase';
        sp2.xlabel = 'Frequency (rad/s or Hz)';
        sp2.ylabel = 'Phase (deg)';
        sp2.traces.push({
            type: 'line',
            x: freq,
            y: phaseArr,
            color: '#ff007f',
            lineWidth: 2,
            isLogX: true,
            label: 'Phase'
        });

        this.render();
    }

    constellation(symbols, opts = {}) {
        const sp = this.getOrCreateSubplot();
        if (!sp.hold) sp.traces = [];
        sp.title = opts.title || 'IQ Constellation Diagram';
        sp.xlabel = 'In-Phase (I)';
        sp.ylabel = 'Quadrature (Q)';

        const iVals = [];
        const qVals = [];
        for (const s of symbols) {
            if (typeof s === 'object' && s !== null && 're' in s && 'im' in s) {
                iVals.push(s.re);
                qVals.push(s.im);
            } else if (Array.isArray(s) && s.length >= 2) {
                iVals.push(s[0]);
                qVals.push(s[1]);
            }
        }

        sp.traces.push({
            type: 'constellation',
            x: iVals,
            y: qVals,
            color: opts.color || '#00ffcc',
            size: opts.size || 5,
            label: opts.label || 'Constellation'
        });
        this.render();
    }

    eyediagram(signal, samplesPerSymbol = 16, numTraces = 50, opts = {}) {
        const sp = this.getOrCreateSubplot();
        if (!sp.hold) sp.traces = [];
        sp.title = opts.title || 'Eye Diagram';
        sp.xlabel = 'Time (symbols)';
        sp.ylabel = 'Amplitude';

        const sig = Array.from(signal);
        const traceLen = samplesPerSymbol * 2;
        const totalTraces = Math.min(numTraces, Math.floor(sig.length / samplesPerSymbol) - 2);

        const xNorm = [];
        for (let i = 0; i < traceLen; i++) {
            xNorm.push(i / samplesPerSymbol - 1);
        }

        for (let t = 0; t < totalTraces; t++) {
            const start = t * samplesPerSymbol;
            const slice = sig.slice(start, start + traceLen);
            if (slice.length === traceLen) {
                sp.traces.push({
                    type: 'line',
                    x: xNorm,
                    y: slice,
                    color: 'rgba(0, 255, 204, 0.25)',
                    lineWidth: 1.2
                });
            }
        }
        this.render();
    }

    // --- Rendering Engine ---

    render() {
        if (!this.canvas || !this.ctx) return;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, width, height);

        if (this.subplots.size === 0) {
            ctx.fillStyle = '#4b5563';
            ctx.font = `${14 * dpr}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('No active plot. Run a script or use plot(x, y) to visualize data.', width / 2, height / 2);
            return;
        }

        let maxR = 1, maxC = 1;
        this.subplots.forEach(sp => {
            maxR = Math.max(maxR, sp.row);
            maxC = Math.max(maxC, sp.col);
        });

        const cellW = width / maxC;
        const cellH = height / maxR;

        this.subplots.forEach((sp, key) => {
            const rIdx = Math.floor((sp.idx - 1) / maxC);
            const cIdx = (sp.idx - 1) % maxC;

            const rect = {
                x: cIdx * cellW,
                y: rIdx * cellH,
                w: cellW,
                h: cellH
            };

            this.renderSubplot(ctx, sp, rect, dpr, key);
        });
    }

    renderSubplot(ctx, sp, rect, dpr, key) {
        const padLeft = 60 * dpr;
        const padRight = 24 * dpr;
        const padTop = 32 * dpr;
        const padBottom = 40 * dpr;

        const plotX = rect.x + padLeft;
        const plotY = rect.y + padTop;
        const plotW = Math.max(10, rect.w - padLeft - padRight);
        const plotH = Math.max(10, rect.h - padTop - padBottom);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let hasData = false;

        for (const tr of sp.traces) {
            for (let i = 0; i < tr.x.length; i++) {
                const vx = tr.x[i];
                const vy = tr.y[i];
                if (Number.isFinite(vx) && Number.isFinite(vy)) {
                    if (vx < minX) minX = vx;
                    if (vx > maxX) maxX = vx;
                    if (vy < minY) minY = vy;
                    if (vy > maxY) maxY = vy;
                    hasData = true;
                }
            }
        }

        if (!hasData) {
            minX = 0; maxX = 1; minY = -1; maxY = 1;
        } else {
            if (minX === maxX) { minX -= 1; maxX += 1; }
            if (minY === maxY) { minY -= 1; maxY += 1; }
            const padY = (maxY - minY) * 0.08;
            minY -= padY;
            maxY += padY;
        }

        if (sp.xlim) { minX = sp.xlim[0]; maxX = sp.xlim[1]; }
        if (sp.ylim) { minY = sp.ylim[0]; maxY = sp.ylim[1]; }

        const pz = this.panZoom.get(key) || { panX: 0, panY: 0, zoomX: 1, zoomY: 1 };
        const rangeX = (maxX - minX) / pz.zoomX;
        const rangeY = (maxY - minY) / pz.zoomY;
        const curMinX = minX - pz.panX * rangeX;
        const curMaxX = curMinX + rangeX;
        const curMinY = minY - pz.panY * rangeY;
        const curMaxY = curMinY + rangeY;

        sp.activeBounds = { plotX, plotY, plotW, plotH, minX: curMinX, maxX: curMaxX, minY: curMinY, maxY: curMaxY };

        if (sp.grid) {
            this.drawGridAndTicks(ctx, sp, plotX, plotY, plotW, plotH, curMinX, curMaxX, curMinY, curMaxY, dpr);
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(plotX, plotY, plotW, plotH);
        ctx.clip();

        for (const tr of sp.traces) {
            this.drawTrace(ctx, tr, plotX, plotY, plotW, plotH, curMinX, curMaxX, curMinY, curMaxY, dpr);
        }
        ctx.restore();

        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        if (sp.title) {
            ctx.fillText(sp.title, plotX + plotW / 2, plotY - 10 * dpr);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = `${10 * dpr}px 'Inter', sans-serif`;
        if (sp.xlabel) {
            ctx.fillText(sp.xlabel, plotX + plotW / 2, plotY + plotH + 30 * dpr);
        }

        if (sp.ylabel) {
            ctx.save();
            ctx.translate(plotX - 44 * dpr, plotY + plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(sp.ylabel, 0, 0);
            ctx.restore();
        }

        if (sp.legend && sp.legend.length > 0) {
            this.drawLegend(ctx, sp, plotX, plotY, plotW, dpr);
        }
    }

    drawGridAndTicks(ctx, sp, px, py, pw, ph, minX, maxX, minY, maxY, dpr) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1 * dpr;
        ctx.fillStyle = '#64748b';
        ctx.font = `${9 * dpr}px monospace`;

        const numXTicks = 6;
        const numYTicks = 5;

        for (let i = 0; i <= numXTicks; i++) {
            const frac = i / numXTicks;
            const xVal = minX + frac * (maxX - minX);
            const screenX = px + frac * pw;

            ctx.beginPath();
            ctx.moveTo(screenX, py);
            ctx.lineTo(screenX, py + ph);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillText(this.formatNumber(xVal), screenX, py + ph + 14 * dpr);
        }

        for (let i = 0; i <= numYTicks; i++) {
            const frac = i / numYTicks;
            const yVal = minY + frac * (maxY - minY);
            const screenY = py + ph - frac * ph;

            ctx.beginPath();
            ctx.moveTo(px, screenY);
            ctx.lineTo(px + pw, screenY);
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillText(this.formatNumber(yVal), px - 6 * dpr, screenY + 3 * dpr);
        }
    }

    drawTrace(ctx, tr, px, py, pw, ph, minX, maxX, minY, maxY, dpr) {
        const toScreenX = (x) => px + ((x - minX) / (maxX - minX)) * pw;
        const toScreenY = (y) => py + ph - ((y - minY) / (maxY - minY)) * ph;

        ctx.strokeStyle = tr.color || '#00ffcc';
        ctx.fillStyle = tr.color || '#00ffcc';
        ctx.lineWidth = (tr.lineWidth || 2) * dpr;

        if (tr.type === 'line') {
            ctx.beginPath();
            let first = true;
            for (let i = 0; i < tr.x.length; i++) {
                const sx = toScreenX(tr.x[i]);
                const sy = toScreenY(tr.y[i]);
                if (first) {
                    ctx.moveTo(sx, sy);
                    first = false;
                } else {
                    ctx.lineTo(sx, sy);
                }
            }
            ctx.stroke();
        } else if (tr.type === 'stem') {
            const zeroY = toScreenY(0);
            for (let i = 0; i < tr.x.length; i++) {
                const sx = toScreenX(tr.x[i]);
                const sy = toScreenY(tr.y[i]);
                ctx.beginPath();
                ctx.moveTo(sx, zeroY);
                ctx.lineTo(sx, sy);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(sx, sy, 3 * dpr, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else if (tr.type === 'scatter' || tr.type === 'constellation') {
            const r = (tr.size || 4) * dpr;
            for (let i = 0; i < tr.x.length; i++) {
                const sx = toScreenX(tr.x[i]);
                const sy = toScreenY(tr.y[i]);
                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else if (tr.type === 'bar') {
            const barW = Math.max(2, (pw / tr.x.length) * 0.7);
            const zeroY = toScreenY(0);
            for (let i = 0; i < tr.x.length; i++) {
                const sx = toScreenX(tr.x[i]) - barW / 2;
                const sy = toScreenY(tr.y[i]);
                const barH = zeroY - sy;
                ctx.fillRect(sx, sy, barW, barH);
            }
        }
    }

    drawLegend(ctx, sp, px, py, pw, dpr) {
        const legW = 120 * dpr;
        const legH = (sp.legend.length * 16 + 8) * dpr;
        const lx = px + pw - legW - 8 * dpr;
        const ly = py + 8 * dpr;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1 * dpr;
        ctx.fillRect(lx, ly, legW, legH);
        ctx.strokeRect(lx, ly, legW, legH);

        ctx.font = `${9 * dpr}px 'Inter', sans-serif`;
        ctx.textAlign = 'left';

        sp.legend.forEach((lbl, i) => {
            const itemY = ly + (14 + i * 16) * dpr;
            const color = this.colorPalette[i % this.colorPalette.length];
            ctx.fillStyle = color;
            ctx.fillRect(lx + 8 * dpr, itemY - 6 * dpr, 12 * dpr, 3 * dpr);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(lbl, lx + 26 * dpr, itemY - 3 * dpr);
        });
    }

    formatNumber(num) {
        if (Math.abs(num) < 1e-4 && num !== 0) return num.toExponential(2);
        if (Math.abs(num) >= 1e4) return num.toExponential(2);
        return num.toLocaleString(undefined, { maximumFractionDigits: 3 });
    }

    // --- Interaction & Event Handlers ---

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;

        if (this.isDragging && this.dragTargetSubplot) {
            const dx = (mouseX - this.dragStart.x) / this.dragTargetSubplot.bounds.plotW;
            const dy = (mouseY - this.dragStart.y) / this.dragTargetSubplot.bounds.plotH;

            const pz = this.panZoom.get(this.dragTargetSubplot.key) || { panX: 0, panY: 0, zoomX: 1, zoomY: 1 };
            pz.panX += dx;
            pz.panY -= dy;
            this.panZoom.set(this.dragTargetSubplot.key, pz);

            this.dragStart = { x: mouseX, y: mouseY };
            this.render();
            return;
        }

        let hovered = null;
        this.subplots.forEach((sp, key) => {
            if (sp.activeBounds) {
                const b = sp.activeBounds;
                if (mouseX >= b.plotX && mouseX <= b.plotX + b.plotW && mouseY >= b.plotY && mouseY <= b.plotY + b.plotH) {
                    const dataX = b.minX + ((mouseX - b.plotX) / b.plotW) * (b.maxX - b.minX);
                    const dataY = b.minY + ((b.plotY + b.plotH - mouseY) / b.plotH) * (b.maxY - b.minY);
                    hovered = { key, dataX, dataY };
                }
            }
        });

        const readout = this.container.querySelector('#plotCursorReadout');
        if (hovered && readout) {
            readout.textContent = `X: ${this.formatNumber(hovered.dataX)} | Y: ${this.formatNumber(hovered.dataY)}`;
        }
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;

        this.subplots.forEach((sp, key) => {
            if (sp.activeBounds) {
                const b = sp.activeBounds;
                if (mouseX >= b.plotX && mouseX <= b.plotX + b.plotW && mouseY >= b.plotY && mouseY <= b.plotY + b.plotH) {
                    this.isDragging = true;
                    this.dragStart = { x: mouseX, y: mouseY };
                    this.dragTargetSubplot = { key, bounds: b };
                }
            }
        });
    }

    onMouseUp() {
        this.isDragging = false;
        this.dragTargetSubplot = null;
    }

    onMouseLeave() {
        this.isDragging = false;
        this.dragTargetSubplot = null;
        const readout = this.container.querySelector('#plotCursorReadout');
        if (readout) readout.textContent = '(X: --, Y: --)';
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;

        this.subplots.forEach((sp, key) => {
            if (sp.activeBounds) {
                const b = sp.activeBounds;
                if (mouseX >= b.plotX && mouseX <= b.plotX + b.plotW && mouseY >= b.plotY && mouseY <= b.plotY + b.plotH) {
                    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
                    const pz = this.panZoom.get(key) || { panX: 0, panY: 0, zoomX: 1, zoomY: 1 };
                    pz.zoomX = Math.max(0.01, Math.min(100, pz.zoomX * zoomFactor));
                    pz.zoomY = Math.max(0.01, Math.min(100, pz.zoomY * zoomFactor));
                    this.panZoom.set(key, pz);
                    this.render();
                }
            }
        });
    }

    // --- Export Utilities ---

    exportPNG() {
        if (!this.canvas) return;
        const link = document.createElement('a');
        link.download = `switcha_plot_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    exportCSV() {
        let csvContent = 'data:text/csv;charset=utf-8,';
        this.subplots.forEach((sp, key) => {
            csvContent += `\n# Subplot: ${key} - ${sp.title || 'Untitled'}\n`;
            sp.traces.forEach((tr, tIdx) => {
                csvContent += `# Trace ${tIdx + 1}: ${tr.label || 'Trace'}\n`;
                csvContent += 'x,y\n';
                for (let i = 0; i < tr.x.length; i++) {
                    csvContent += `${tr.x[i]},${tr.y[i]}\n`;
                }
            });
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `switcha_data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

if (typeof window !== 'undefined') {
    window.SwitchaPlotter = SwitchaPlotter;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SwitchaPlotter };
}
export { SwitchaPlotter };

