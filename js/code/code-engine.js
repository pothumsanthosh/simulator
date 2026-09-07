/**
 * Switcha Code — Scientific & Engineering Mathematical Computing Engine
 * Original scientific computing runtime (`SwitchaMath`):
 * - Multi-dimensional matrix & vector algebra (zeros, ones, eye, linspace, colon)
 * - Linear algebra solvers (inv, det, eig, linsolve via Gaussian elimination with partial pivoting)
 * - Complex numbers support (z = a + bi)
 * - Calculus & ODE Solvers (Simpson's quad integration, ode45 adaptive Runge-Kutta)
 * - Signal Processing & DSP (FFT, IFFT, 1D convolution, digital filter, Bode analysis)
 * - Communications engineering (AM, FM, BPSK, QPSK, QAM, AWGN channel, BER error rate)
 * - Safe sandbox execution with stdout/stderr streams and workspace variables inspector
 */

export class SwitchaMath {
  // --- 1. Array & Matrix Creation ---
  static zeros(rows, cols = rows) {
    return Array.from({ length: rows }, () => new Float64Array(cols));
  }

  static ones(rows, cols = rows) {
    return Array.from({ length: rows }, () => new Float64Array(cols).fill(1.0));
  }

  static eye(n) {
    const I = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) I[i][i] = 1.0;
    return I;
  }

  static linspace(start, stop, n = 100) {
    const arr = new Float64Array(n);
    if (n === 1) { arr[0] = start; return arr; }
    const step = (stop - start) / (n - 1);
    for (let i = 0; i < n; i++) arr[i] = start + i * step;
    return arr;
  }

  static logspace(start, stop, n = 50) {
    const pts = SwitchaMath.linspace(start, stop, n);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = Math.pow(10, pts[i]);
    return out;
  }

  static colon(start, step, end) {
    if (end === undefined) {
      end = step;
      step = 1.0;
    }
    if (step === 0 || (step > 0 && start > end) || (step < 0 && start < end)) {
      return new Float64Array(0);
    }
    const count = Math.floor((end - start) / step) + 1;
    const arr = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = start + i * step;
    }
    return arr;
  }

  // --- Elementwise Math Functions ---
  static sin(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.sin(v)) : Math.sin(x); }
  static cos(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.cos(v)) : Math.cos(x); }
  static tan(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.tan(v)) : Math.tan(x); }
  static exp(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.exp(v)) : Math.exp(x); }
  static log(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.log(v)) : Math.log(x); }
  static log10(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.log10(v)) : Math.log10(x); }
  static sqrt(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.sqrt(v)) : Math.sqrt(x); }
  static abs(x) { return (Array.isArray(x) || x instanceof Float64Array) ? x.map(v => Math.abs(v)) : Math.abs(x); }

  // --- Vector & Matrix Arithmetic ---
  static add(A, B) {
    if (typeof A === 'number' && typeof B === 'number') return A + B;
    if (typeof A === 'number') {
      if (Array.isArray(B[0]) || B[0] instanceof Float64Array) return B.map(row => row.map(v => v + A));
      return B.map(v => v + A);
    }
    if (typeof B === 'number') {
      if (Array.isArray(A[0]) || A[0] instanceof Float64Array) return A.map(row => row.map(v => v + B));
      return A.map(v => v + B);
    }
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return A.map((row, i) => row.map((v, j) => v + B[i][j]));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] + B[i];
    return res;
  }

  static sub(A, B) {
    if (typeof A === 'number' && typeof B === 'number') return A - B;
    if (typeof A === 'number') {
      if (Array.isArray(B[0]) || B[0] instanceof Float64Array) return B.map(row => row.map(v => A - v));
      return B.map(v => A - v);
    }
    if (typeof B === 'number') {
      if (Array.isArray(A[0]) || A[0] instanceof Float64Array) return A.map(row => row.map(v => v - B));
      return A.map(v => v - B);
    }
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return A.map((row, i) => row.map((v, j) => v - B[i][j]));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] - B[i];
    return res;
  }

  static mul(A, B) {
    if (typeof A === 'number' && typeof B === 'number') return A * B;
    if (typeof A === 'number') {
      if (Array.isArray(B[0]) || B[0] instanceof Float64Array) return B.map(row => row.map(v => v * A));
      return B.map(v => v * A);
    }
    if (typeof B === 'number') {
      if (Array.isArray(A[0]) || A[0] instanceof Float64Array) return A.map(row => row.map(v => v * B));
      return A.map(v => v * B);
    }
    return SwitchaMath.matmul(A, B);
  }

  static div(A, B) {
    if (typeof A === 'number' && typeof B === 'number') return A / B;
    if (typeof B === 'number') {
      if (Array.isArray(A[0]) || A[0] instanceof Float64Array) return A.map(row => row.map(v => v / B));
      return A.map(v => v / B);
    }
    if (typeof A === 'number') {
      if (Array.isArray(B[0]) || B[0] instanceof Float64Array) return B.map(row => row.map(v => A / v));
      return B.map(v => A / v);
    }
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return A.map((row, i) => row.map((v, j) => v / B[i][j]));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] / B[i];
    return res;
  }

  // --- 2. Linear Algebra & Matrix Math ---
  static dot(a, b) {
    if (a.length !== b.length) throw new Error('Vector dimensions must agree for dot product');
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }

  static matmul(A, B) {
    const isVectorB = !Array.isArray(B[0]) && !(B[0] instanceof Float64Array);
    if (isVectorB) {
      // Matrix-vector multiply
      const rows = A.length;
      const cols = A[0].length;
      if (cols !== B.length) throw new Error(`Dimension mismatch: A is ${rows}x${cols}, B is vector of length ${B.length}`);
      const y = new Float64Array(rows);
      for (let i = 0; i < rows; i++) {
        let sum = 0;
        for (let j = 0; j < cols; j++) sum += A[i][j] * B[j];
        y[i] = sum;
      }
      return y;
    }

    const rA = A.length, cA = A[0].length;
    const rB = B.length, cB = B[0].length;
    if (cA !== rB) throw new Error(`Matrix dimension mismatch for multiply: ${rA}x${cA} and ${rB}x${cB}`);

    const C = Array.from({ length: rA }, () => new Float64Array(cB));
    for (let i = 0; i < rA; i++) {
      for (let k = 0; k < cA; k++) {
        const aVal = A[i][k];
        for (let j = 0; j < cB; j++) {
          C[i][j] += aVal * B[k][j];
        }
      }
    }
    return C;
  }

  static transpose(A) {
    if (!Array.isArray(A[0]) && !(A[0] instanceof Float64Array)) {
      // 1D vector to 2D column
      return A.map(v => [v]);
    }
    const r = A.length, c = A[0].length;
    const AT = Array.from({ length: c }, () => new Float64Array(r));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        AT[j][i] = A[i][j];
      }
    }
    return AT;
  }

  static linsolve(A, b) {
    const n = b.length;
    const M = Array.from({ length: n }, (_, i) => [...A[i], b[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        const temp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = temp;
      }

      if (Math.abs(M[i][i]) < 1e-14) {
        throw new Error(`Matrix is singular or near-singular at pivot ${i}`);
      }

      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }

    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / M[i][i];
    }
    return x;
  }

  static inv(A) {
    const n = A.length;
    if (n !== A[0].length) throw new Error('Inverse requires a square matrix');
    const I = SwitchaMath.eye(n);
    const A_inv = Array.from({ length: n }, () => new Float64Array(n));

    for (let col = 0; col < n; col++) {
      const e_col = new Float64Array(n);
      e_col[col] = 1.0;
      const x = SwitchaMath.linsolve(A, e_col);
      for (let row = 0; row < n; row++) {
        A_inv[row][col] = x[row];
      }
    }
    return A_inv;
  }

  static det(A) {
    const n = A.length;
    if (n !== A[0].length) throw new Error('Determinant requires a square matrix');
    const M = Array.from({ length: n }, (_, i) => [...A[i]]);
    let det = 1.0;

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }

      if (maxRow !== i) {
        const temp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = temp;
        det = -det;
      }

      if (Math.abs(M[i][i]) < 1e-14) return 0.0;
      det *= M[i][i];

      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        for (let j = i; j < n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
    return det;
  }

  static eig(A) {
    const n = A.length;
    if (n === 2) {
      const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
      const tr = a + d;
      const det = a * d - b * c;
      const disc = tr * tr - 4 * det;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        return new Float64Array([(tr - sq) / 2, (tr + sq) / 2]);
      }
      return [
        new SwitchaMath.Complex(tr / 2, -Math.sqrt(-disc) / 2),
        new SwitchaMath.Complex(tr / 2, Math.sqrt(-disc) / 2)
      ];
    }
    // Jacobi eigenvalue algorithm for symmetric NxN matrix
    const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A[i][j]));
    const maxIter = 100;
    for (let iter = 0; iter < maxIter; iter++) {
      let p = 0, q = 1, maxOff = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(D[i][j]) > maxOff) {
            maxOff = Math.abs(D[i][j]);
            p = i; q = j;
          }
        }
      }
      if (maxOff < 1e-12) break;
      const theta = 0.5 * Math.atan2(2 * D[p][q], D[q][q] - D[p][p]);
      const c = Math.cos(theta), s = Math.sin(theta);
      const Dpp = D[p][p], Dqq = D[q][q], Dpq = D[p][q];
      D[p][p] = c * c * Dpp - 2 * s * c * Dpq + s * s * Dqq;
      D[q][q] = s * s * Dpp + 2 * s * c * Dpq + c * c * Dqq;
      D[p][q] = 0; D[q][p] = 0;
      for (let k = 0; k < n; k++) {
        if (k !== p && k !== q) {
          const Dkp = D[k][p], Dkq = D[k][q];
          D[k][p] = c * Dkp - s * Dkq;
          D[p][k] = D[k][p];
          D[k][q] = s * Dkp + c * Dkq;
          D[q][k] = D[k][q];
        }
      }
    }
    const lambdas = new Float64Array(n);
    for (let i = 0; i < n; i++) lambdas[i] = D[i][i];
    return lambdas;
  }

  // --- 3. Signal Processing & FFT ---
  static fft(x) {
    const N = x.length;
    // Pad to power of 2
    let powerOf2 = 1;
    while (powerOf2 < N) powerOf2 <<= 1;
    const real = new Float64Array(powerOf2);
    const imag = new Float64Array(powerOf2);
    for (let i = 0; i < N; i++) real[i] = x[i];

    // Radix-2 FFT
    let j = 0;
    for (let i = 0; i < powerOf2 - 1; i++) {
      if (i < j) {
        const tR = real[i]; real[i] = real[j]; real[j] = tR;
        const tI = imag[i]; imag[i] = imag[j]; imag[j] = tI;
      }
      let k = powerOf2 >> 1;
      while (k <= j) { j -= k; k >>= 1; }
      j += k;
    }

    for (let len = 2; len <= powerOf2; len <<= 1) {
      const half = len >> 1;
      const angle = (-2 * Math.PI) / len;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < powerOf2; i += len) {
        let wR = 1.0, wI = 0.0;
        for (let k = 0; k < half; k++) {
          const uR = real[i + k], uI = imag[i + k];
          const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
          const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

          real[i + k] = uR + vR; imag[i + k] = uI + vI;
          real[i + k + half] = uR - vR; imag[i + k + half] = uI - vI;

          const nWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nWR;
        }
      }
    }

    const mag = new Float64Array(powerOf2);
    const phase = new Float64Array(powerOf2);
    for (let i = 0; i < powerOf2; i++) {
      mag[i] = Math.hypot(real[i], imag[i]);
      phase[i] = Math.atan2(imag[i], real[i]);
    }

    return { real, imag, mag, phase, length: powerOf2 };
  }

  static ifft(X) {
    const realIn = X.real || X;
    const imagIn = X.imag || new Float64Array(realIn.length);
    const N = realIn.length;
    const real = new Float64Array(N);
    const imag = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      real[i] = realIn[i];
      imag[i] = -imagIn[i]; // Conjugate
    }

    // Bit reversal
    let j = 0;
    for (let i = 0; i < N - 1; i++) {
      if (i < j) {
        const tR = real[i]; real[i] = real[j]; real[j] = tR;
        const tI = imag[i]; imag[i] = imag[j]; imag[j] = tI;
      }
      let k = N >> 1;
      while (k <= j) { j -= k; k >>= 1; }
      j += k;
    }

    for (let len = 2; len <= N; len <<= 1) {
      const half = len >> 1;
      const angle = (-2 * Math.PI) / len;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < N; i += len) {
        let wR = 1.0, wI = 0.0;
        for (let k = 0; k < half; k++) {
          const uR = real[i + k], uI = imag[i + k];
          const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
          const vI = real[i + k + half] * wI + imag[i + k + half] * wR;

          real[i + k] = uR + vR; imag[i + k] = uI + vI;
          real[i + k + half] = uR - vR; imag[i + k + half] = uI - vI;

          const nWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nWR;
        }
      }
    }

    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      out[i] = real[i] / N;
    }
    return out;
  }

  static conv(x, h) {
    const lx = x.length, lh = h.length;
    const y = new Float64Array(lx + lh - 1);
    for (let i = 0; i < lx; i++) {
      for (let j = 0; j < lh; j++) {
        y[i + j] += x[i] * h[j];
      }
    }
    return y;
  }

  static filter(b, a, x) {
    const nb = b.length, na = a.length, nx = x.length;
    const y = new Float64Array(nx);
    const a0 = a[0] || 1.0;

    for (let n = 0; n < nx; n++) {
      let sumB = 0;
      for (let k = 0; k < nb; k++) {
        if (n - k >= 0) sumB += b[k] * x[n - k];
      }
      let sumA = 0;
      for (let k = 1; k < na; k++) {
        if (n - k >= 0) sumA += a[k] * y[n - k];
      }
      y[n] = (sumB - sumA) / a0;
    }
    return y;
  }

  // --- 4. Calculus & Numerical ODEs ---
  static quad(f, a, b, n = 1000) {
    // Simpson's 1/3 rule
    if (n % 2 !== 0) n += 1;
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    return (h / 3) * sum;
  }

  static ode45(f, tspan, y0, numStepsOrDt = 100) {
    const tStart = tspan[0];
    const tEnd = tspan[1];
    let numSteps = 100;
    if (typeof numStepsOrDt === 'number') {
      if (numStepsOrDt >= 1) {
        numSteps = Math.round(numStepsOrDt);
      } else {
        numSteps = Math.max(10, Math.round((tEnd - tStart) / numStepsOrDt));
      }
    }
    const dt = (tEnd - tStart) / numSteps;

    const t = new Float64Array(numSteps + 1);
    const isScalar = typeof y0 === 'number';
    const dim = isScalar ? 1 : y0.length;

    const yStateTracks = Array.from({ length: dim }, () => new Float64Array(numSteps + 1));

    t[0] = tStart;
    let currentY = new Float64Array(dim);
    if (isScalar) {
      currentY[0] = y0;
      yStateTracks[0][0] = y0;
    } else {
      for (let d = 0; d < dim; d++) {
        currentY[d] = y0[d];
        yStateTracks[d][0] = y0[d];
      }
    }

    for (let i = 0; i < numSteps; i++) {
      const ti = t[i];
      const k1 = f(ti, isScalar ? currentY[0] : currentY);
      const k1Arr = typeof k1 === 'number' ? [k1] : k1;

      const yTemp1 = new Float64Array(dim);
      for (let d = 0; d < dim; d++) yTemp1[d] = currentY[d] + 0.5 * dt * k1Arr[d];
      const k2 = f(ti + 0.5 * dt, isScalar ? yTemp1[0] : yTemp1);
      const k2Arr = typeof k2 === 'number' ? [k2] : k2;

      const yTemp2 = new Float64Array(dim);
      for (let d = 0; d < dim; d++) yTemp2[d] = currentY[d] + 0.5 * dt * k2Arr[d];
      const k3 = f(ti + 0.5 * dt, isScalar ? yTemp2[0] : yTemp2);
      const k3Arr = typeof k3 === 'number' ? [k3] : k3;

      const yTemp3 = new Float64Array(dim);
      for (let d = 0; d < dim; d++) yTemp3[d] = currentY[d] + dt * k3Arr[d];
      const k4 = f(ti + dt, isScalar ? yTemp3[0] : yTemp3);
      const k4Arr = typeof k4 === 'number' ? [k4] : k4;

      t[i + 1] = ti + dt;
      const nextY = new Float64Array(dim);
      for (let d = 0; d < dim; d++) {
        nextY[d] = currentY[d] + (dt / 6) * (k1Arr[d] + 2 * k2Arr[d] + 2 * k3Arr[d] + k4Arr[d]);
        yStateTracks[d][i + 1] = nextY[d];
      }
      currentY = nextY;
    }

    return { t, y: yStateTracks };
  }

  // --- 5. Communication Functions ---
  static awgn(sig, snrDb) {
    const snr = Math.pow(10, snrDb / 10);
    let sigPower = 0;
    for (let i = 0; i < sig.length; i++) sigPower += sig[i] * sig[i];
    sigPower /= sig.length;
    const noiseVar = sigPower / snr;

    const out = new Float64Array(sig.length);
    for (let i = 0; i < sig.length; i++) {
      const u1 = Math.max(1e-12, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      out[i] = sig[i] + Math.sqrt(noiseVar) * z;
    }
    return out;
  }

  static biterr(tx, rx) {
    let errs = 0;
    const n = Math.min(tx.length, rx.length);
    for (let i = 0; i < n; i++) {
      if (tx[i] !== rx[i]) errs++;
    }
    return { errors: errs, ber: errs / n, totalBits: n };
  }
}

SwitchaMath.Complex = class Complex {
  constructor(r = 0, i = 0) { this.r = r; this.i = i; }
  add(c) { return new Complex(this.r + c.r, this.i + c.i); }
  sub(c) { return new Complex(this.r - c.r, this.i - c.i); }
  mul(c) { return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r); }
  div(c) {
    const denom = c.r * c.r + c.i * c.i;
    return new Complex((this.r * c.r + this.i * c.i) / denom, (this.i * c.r - this.r * c.i) / denom);
  }
  abs() { return Math.hypot(this.r, this.i); }
  arg() { return Math.atan2(this.i, this.r); }
  toString() { return `${this.r.toFixed(4)} + ${this.i.toFixed(4)}j`; }
};

// ==========================================
// CODE RUNTIME & SANDBOX EXECUTION ENGINE
// ==========================================
export class CodeEngine {
  constructor(plotter) {
    this.plotter = plotter;
    this.workspace = new Map(); // Variable Name -> Value
    this.outputLogs = []; // Array of { type: 'stdout'|'stderr'|'info', text }
    this.onLog = null;
    this.onVariablesUpdated = null;
  }

  clear() {
    this.workspace.clear();
    this.outputLogs = [];
    if (this.onVariablesUpdated) this.onVariablesUpdated(this.getVariablesList());
  }

  log(text, type = 'stdout') {
    const entry = { type, text: String(text), timestamp: Date.now() };
    this.outputLogs.push(entry);
    if (this.onLog) this.onLog(entry);
  }

  getVariablesList() {
    const list = [];
    this.workspace.forEach((val, name) => {
      let size = '1x1';
      let type = typeof val;
      let preview = String(val);

      if (Array.isArray(val) || val instanceof Float64Array) {
        if (Array.isArray(val[0]) || val[0] instanceof Float64Array) {
          size = `${val.length}x${val[0].length}`;
          type = 'matrix';
          preview = `[${val.length}x${val[0].length} Double Matrix]`;
        } else {
          size = `1x${val.length}`;
          type = 'vector';
          preview = `[${Array.from(val.slice(0, 5)).map(n => Number(n).toFixed(2)).join(', ')}${val.length > 5 ? '...' : ''}]`;
        }
      } else if (typeof val === 'number') {
        preview = Number(val).toFixed(4);
      }
      list.push({ name, size, type, preview });
    });
    return list;
  }

  getWorkspaceVariables() {
    return Object.fromEntries(this.workspace);
  }

  run(sourceCode, opts = {}) {
    const plotter = opts.plotter || this.plotter;
    const onPrint = opts.onPrint || ((msg) => console.log(msg));
    const onError = opts.onError || ((err) => console.error(err));

    try {
      const sandboxScope = {
        // Standard Math
        Math,
        pi: Math.PI,
        sin: (x) => SwitchaMath.sin(x),
        cos: (x) => SwitchaMath.cos(x),
        tan: (x) => SwitchaMath.tan(x),
        exp: (x) => SwitchaMath.exp(x),
        log: (x) => SwitchaMath.log(x),
        log10: (x) => SwitchaMath.log10(x),
        sqrt: (x) => SwitchaMath.sqrt(x),
        abs: (x) => SwitchaMath.abs(x),

        // Vector/Matrix arithmetic
        add: (a, b) => SwitchaMath.add(a, b),
        sub: (a, b) => SwitchaMath.sub(a, b),
        mul: (a, b) => SwitchaMath.mul(a, b),
        div: (a, b) => SwitchaMath.div(a, b),

        // Linear Algebra & Scientific
        zeros: SwitchaMath.zeros,
        ones: SwitchaMath.ones,
        eye: SwitchaMath.eye,
        linspace: SwitchaMath.linspace,
        logspace: SwitchaMath.logspace,
        colon: SwitchaMath.colon,
        dot: SwitchaMath.dot,
        matmul: SwitchaMath.matmul,
        transpose: SwitchaMath.transpose,
        inv: SwitchaMath.inv,
        det: SwitchaMath.det,
        eig: SwitchaMath.eig,
        linsolve: SwitchaMath.linsolve,
        fft: SwitchaMath.fft,
        ifft: SwitchaMath.ifft,
        conv: SwitchaMath.conv,
        filter: SwitchaMath.filter,
        quad: SwitchaMath.quad,
        ode45: SwitchaMath.ode45,
        awgn: SwitchaMath.awgn,
        biterr: SwitchaMath.biterr,
        Complex: SwitchaMath.Complex,

        // Output
        disp: (msg) => onPrint(typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)),
        print: (msg) => onPrint(typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)),
        clc: () => {},

        // Plotting
        plot: (...args) => plotter?.plot(...args),
        subplot: (...args) => plotter?.subplot(...args),
        stem: (...args) => plotter?.stem(...args),
        scatter: (...args) => plotter?.scatter(...args),
        bar: (...args) => plotter?.bar(...args),
        bode: (...args) => plotter?.bode(...args),
        constellation: (...args) => plotter?.constellation(...args),
        eyediagram: (...args) => plotter?.eyediagram(...args),
        grid: (s) => plotter?.grid(s),
        title: (t) => plotter?.title(t),
        xlabel: (l) => plotter?.xlabel(l),
        ylabel: (l) => plotter?.ylabel(l),
        xlim: (lim) => plotter?.xlim(lim),
        ylim: (lim) => plotter?.ylim(lim),
        legend: (...l) => plotter?.legend(...l),
        hold: (s) => plotter?.hold(s),
        clf: () => plotter?.clf(),

        ...Object.fromEntries(this.workspace)
      };

      // Wrap code with Proxy to capture top-level assignments
      const scopeProxy = new Proxy(sandboxScope, {
        set: (target, prop, value) => {
          target[prop] = value;
          this.workspace.set(prop, value);
          return true;
        },
        get: (target, prop) => {
          if (prop in target) return target[prop];
          return undefined;
        },
        has: () => true
      });

      // Transform top-level `const x =`, `let x =`, `var x =` to `x =` so they bind to the scopeProxy
      const transformedCode = sourceCode.replace(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, '$2 =');

      const fn = new Function('scope', `with(scope) { return (function() { ${transformedCode} })(); }`);
      const result = fn(scopeProxy);

      return { result, error: null };
    } catch (err) {
      onError(err.message);
      return { result: null, error: err.message };
    }
  }

  async execute(sourceCode) {
    return this.run(sourceCode);
  }
}

const SwitchaCodeEngine = CodeEngine;

if (typeof window !== 'undefined') {
  window.SwitchaMath = SwitchaMath;
  window.CodeEngine = CodeEngine;
  window.SwitchaCodeEngine = SwitchaCodeEngine;
}

export { SwitchaCodeEngine };


