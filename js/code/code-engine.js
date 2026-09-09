/**
 * Switcha Code — Scientific & Engineering Mathematical Computing Engine
 * Complete MathWorks MATLAB compatible scientific computing runtime:
 * - Multi-dimensional matrix & vector algebra (zeros, ones, eye, linspace, colon, rand, randn)
 * - Linear algebra solvers (inv, det, eig, linsolve, lu, qr, svd, chol, pinv, rank, cond, norm)
 * - Complex numbers support (z = a + bi)
 * - Calculus & ODE Solvers (Simpson's quad integration, ode45 adaptive Runge-Kutta, diff, trapz, fzero, fminsearch)
 * - Polynomials & Curve Fitting (poly, roots, polyval, polyfit, polyder, polyint, conv, deconv)
 * - Control Systems Toolbox (tf, step, impulse, bode, margin, nyquist, feedback, series, parallel, pzmap, damp)
 * - Signal Processing & DSP (FFT, IFFT, fftshift, butter, filter, filtfilt, freqz, spectrogram, windows, findpeaks, xcorr)
 * - Communications engineering (AM, FM, BPSK, QPSK, QAM, AWGN channel, BER error rate)
 * - Native MATLAB syntax transpiler ([1 2; 3 4], colon ranges, dot operators .*, ./, .^, suppression with ';')
 * - Simulink co-simulation bridge: sim('modelName')
 */

import { BlockEngine } from '../blocks/block-engine.js';
import { BlockLibrary } from '../blocks/block-library.js';

export class SwitchaMath {
  // --- 1. Array & Matrix Creation ---
  static parseDimArgs(...args) {
    if (args.length === 0) return [1, 1];
    if (args.length === 1) {
      const a0 = args[0];
      if (Array.isArray(a0) || a0 instanceof Float64Array) {
        if (a0.length === 0) return [0, 0];
        if (a0.length === 1) return [a0[0], a0[0]];
        return [a0[0], a0[1]];
      }
      return [a0, a0];
    }
    return [args[0], args[1]];
  }

  static toIterable(v) {
    if (v === null || v === undefined) return [];
    if (Array.isArray(v) || v instanceof Float64Array) {
      if (Array.isArray(v[0]) || v[0] instanceof Float64Array) {
        const cols = [];
        const r = v.length, c = v[0].length;
        for (let j = 0; j < c; j++) {
          const col = new Float64Array(r);
          for (let i = 0; i < r; i++) col[i] = v[i][j];
          cols.push(col);
        }
        return cols;
      }
      return v;
    }
    if (typeof v === 'number') return [v];
    if (typeof v[Symbol.iterator] === 'function') return v;
    return [v];
  }

  static zeros(...args) {
    const [rows, cols] = SwitchaMath.parseDimArgs(...args);
    if (rows <= 0 || cols <= 0) return new Float64Array(0);
    if (rows === 1) return new Float64Array(cols);
    if (cols === 1) return new Float64Array(rows);
    return Array.from({ length: rows }, () => new Float64Array(cols));
  }

  static ones(...args) {
    const [rows, cols] = SwitchaMath.parseDimArgs(...args);
    if (rows <= 0 || cols <= 0) return new Float64Array(0);
    if (rows === 1) return new Float64Array(cols).fill(1.0);
    if (cols === 1) return new Float64Array(rows).fill(1.0);
    return Array.from({ length: rows }, () => new Float64Array(cols).fill(1.0));
  }

  static eye(n) {
    const I = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) I[i][i] = 1.0;
    return I;
  }

  static rand(...args) {
    const [rows, cols] = SwitchaMath.parseDimArgs(...args);
    if (rows === 1 && cols === 1) return Math.random();
    if (rows === 1) {
      const v = new Float64Array(cols);
      for (let i = 0; i < cols; i++) v[i] = Math.random();
      return v;
    }
    if (cols === 1) {
      const v = new Float64Array(rows);
      for (let i = 0; i < rows; i++) v[i] = Math.random();
      return v;
    }
    return Array.from({ length: rows }, () => {
      const row = new Float64Array(cols);
      for (let j = 0; j < cols; j++) row[j] = Math.random();
      return row;
    });
  }

  static randn(...args) {
    const nextNorm = () => {
      const u1 = Math.max(1e-12, Math.random());
      const u2 = Math.random();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };
    const [rows, cols] = SwitchaMath.parseDimArgs(...args);
    if (rows === 1 && cols === 1) return nextNorm();
    if (rows === 1) {
      const v = new Float64Array(cols);
      for (let i = 0; i < cols; i++) v[i] = nextNorm();
      return v;
    }
    if (cols === 1) {
      const v = new Float64Array(rows);
      for (let i = 0; i < rows; i++) v[i] = nextNorm();
      return v;
    }
    return Array.from({ length: rows }, () => {
      const row = new Float64Array(cols);
      for (let j = 0; j < cols; j++) row[j] = nextNorm();
      return row;
    });
  }

  static randi(maxOrRange, rows = 1, cols = rows) {
    let min = 1, max = 10;
    if (Array.isArray(maxOrRange)) {
      min = maxOrRange[0];
      max = maxOrRange[1];
    } else if (typeof maxOrRange === 'number') {
      max = maxOrRange;
    }
    const gen = () => Math.floor(Math.random() * (max - min + 1)) + min;
    if (rows === 1 && cols === 1) return gen();
    if (cols === 1) {
      const v = new Float64Array(rows);
      for (let i = 0; i < rows; i++) v[i] = gen();
      return v;
    }
    return Array.from({ length: rows }, () => {
      const row = new Float64Array(cols);
      for (let j = 0; j < cols; j++) row[j] = gen();
      return row;
    });
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
      return [];
    }
    const count = Math.floor((end - start) / step + 1e-9) + 1;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(start + i * step);
    }
    return arr;
  }

  // --- Dimension and Shape Inspection ---
  static size(A) {
    if (A === null || A === undefined || typeof A === 'number') return [1, 1];
    if (!Array.isArray(A) && !(A instanceof Float64Array)) return [1, 1];
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return [A.length, A[0].length];
    }
    return [1, A.length];
  }

  static length(A) {
    const s = SwitchaMath.size(A);
    return Math.max(s[0], s[1]);
  }

  static numel(A) {
    const s = SwitchaMath.size(A);
    return s[0] * s[1];
  }

  static reshape(A, rows, cols) {
    const flat = [];
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      for (let j = 0; j < A[0].length; j++) {
        for (let i = 0; i < A.length; i++) flat.push(A[i][j]);
      }
    } else {
      for (let i = 0; i < A.length; i++) flat.push(A[i]);
    }
    if (flat.length !== rows * cols) throw new Error(`Cannot reshape array of size ${flat.length} to ${rows}x${cols}`);

    const res = Array.from({ length: rows }, () => new Float64Array(cols));
    let idx = 0;
    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        res[i][j] = flat[idx++];
      }
    }
    return res;
  }

  static vertcat(...args) {
    const is2D = args.some(a => Array.isArray(a) && (Array.isArray(a[0]) || a[0] instanceof Float64Array));
    if (is2D) {
      const rows = [];
      for (const a of args) {
        if (Array.isArray(a) || a instanceof Float64Array) {
          if (Array.isArray(a[0]) || a[0] instanceof Float64Array) {
            rows.push(...a);
          } else {
            rows.push(a);
          }
        } else {
          rows.push([a]);
        }
      }
      return rows;
    }
    const flat = [];
    for (const a of args) {
      if (Array.isArray(a) || a instanceof Float64Array) {
        for (let i = 0; i < a.length; i++) flat.push(a[i]);
      } else if (a !== undefined && a !== null) {
        flat.push(a);
      }
    }
    return (flat.every(v => typeof v === 'number')) ? Float64Array.from(flat) : flat;
  }

  static horzcat(...args) {
    return SwitchaMath.vertcat(...args);
  }

  static repmat(A, m, n = m) {
    const [rA, cA] = SwitchaMath.size(A);
    const is2D = Array.isArray(A[0]) || A[0] instanceof Float64Array;
    const res = Array.from({ length: rA * m }, () => new Float64Array(cA * n));
    for (let bi = 0; bi < m; bi++) {
      for (let bj = 0; bj < n; bj++) {
        for (let i = 0; i < rA; i++) {
          for (let j = 0; j < cA; j++) {
            const val = is2D ? A[i][j] : A[j];
            res[bi * rA + i][bj * cA + j] = val;
          }
        }
      }
    }
    return res;
  }

  static diag(v, k = 0) {
    if (Array.isArray(v[0]) || v[0] instanceof Float64Array) {
      const r = v.length, c = v[0].length;
      const diagVals = [];
      for (let i = 0; i < r; i++) {
        const j = i + k;
        if (j >= 0 && j < c) diagVals.push(v[i][j]);
      }
      return Float64Array.from(diagVals);
    }
    const n = v.length + Math.abs(k);
    const M = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < v.length; i++) {
      const row = k >= 0 ? i : i - k;
      const col = k >= 0 ? i + k : i;
      if (row < n && col < n) M[row][col] = v[i];
    }
    return M;
  }

  static tril(A, k = 0) {
    const [r, c] = SwitchaMath.size(A);
    const res = Array.from({ length: r }, () => new Float64Array(c));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (j <= i + k) res[i][j] = A[i][j];
      }
    }
    return res;
  }

  static triu(A, k = 0) {
    const [r, c] = SwitchaMath.size(A);
    const res = Array.from({ length: r }, () => new Float64Array(c));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (j >= i + k) res[i][j] = A[i][j];
      }
    }
    return res;
  }

  static flipud(A) {
    if (!Array.isArray(A[0]) && !(A[0] instanceof Float64Array)) {
      const copy = Float64Array.from(A);
      copy.reverse();
      return copy;
    }
    return A.slice().reverse().map(row => Float64Array.from(row));
  }

  static fliplr(A) {
    if (!Array.isArray(A[0]) && !(A[0] instanceof Float64Array)) {
      const copy = Float64Array.from(A);
      copy.reverse();
      return copy;
    }
    return A.map(row => Float64Array.from(row).reverse());
  }

  static rot90(A, k = 1) {
    k = ((k % 4) + 4) % 4;
    let res = A;
    for (let step = 0; step < k; step++) {
      res = SwitchaMath.flipud(SwitchaMath.transpose(res));
    }
    return res;
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
    if (A === undefined || A === null) return B ?? 0;
    if (B === undefined || B === null) return A ?? 0;
    if (A?.constructor?.name === 'Complex' || B?.constructor?.name === 'Complex') {
      const cA = A?.constructor?.name === 'Complex' ? A : new SwitchaMath.Complex(typeof A === 'number' ? A : 0, 0);
      const cB = B?.constructor?.name === 'Complex' ? B : new SwitchaMath.Complex(typeof B === 'number' ? B : 0, 0);
      return cA.add(cB);
    }
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
      return A.map((row, i) => row.map((v, j) => v + (B?.[i]?.[j] ?? 0)));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] + (B?.[i] ?? 0);
    return res;
  }

  static sub(A, B) {
    if (A === undefined || A === null) return B !== undefined ? SwitchaMath.sub(0, B) : 0;
    if (B === undefined || B === null) return A;
    if (A?.constructor?.name === 'Complex' || B?.constructor?.name === 'Complex') {
      const cA = A?.constructor?.name === 'Complex' ? A : new SwitchaMath.Complex(typeof A === 'number' ? A : 0, 0);
      const cB = B?.constructor?.name === 'Complex' ? B : new SwitchaMath.Complex(typeof B === 'number' ? B : 0, 0);
      return cA.sub(cB);
    }
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
      return A.map((row, i) => row.map((v, j) => v - (B?.[i]?.[j] ?? 0)));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] - (B?.[i] ?? 0);
    return res;
  }

  static mul(A, B) {
    if (A === undefined || A === null) return B ?? 0;
    if (B === undefined || B === null) return A ?? 0;
    if (A?.constructor?.name === 'Complex' || B?.constructor?.name === 'Complex') {
      const cA = A?.constructor?.name === 'Complex' ? A : new SwitchaMath.Complex(typeof A === 'number' ? A : 0, 0);
      const cB = B?.constructor?.name === 'Complex' ? B : new SwitchaMath.Complex(typeof B === 'number' ? B : 0, 0);
      return cA.mul(cB);
    }
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
    if (A === undefined || A === null) return 0;
    if (B === undefined || B === null) return A;
    if (A?.constructor?.name === 'Complex' || B?.constructor?.name === 'Complex') {
      const cA = A?.constructor?.name === 'Complex' ? A : new SwitchaMath.Complex(typeof A === 'number' ? A : 0, 0);
      const cB = B?.constructor?.name === 'Complex' ? B : new SwitchaMath.Complex(typeof B === 'number' ? B : 0, 0);
      return cA.div(cB);
    }
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
      return A.map((row, i) => row.map((v, j) => v / (B?.[i]?.[j] ?? 1)));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] / (B?.[i] ?? 1);
    return res;
  }

  // --- Element-Wise Operators (.*, ./, .^) ---
  static elem_mul(A, B) {
    if (A === undefined || A === null) return B ?? 0;
    if (B === undefined || B === null) return A ?? 0;
    if (typeof A === 'number' || typeof B === 'number') return SwitchaMath.mul(A, B);
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return A.map((row, i) => row.map((v, j) => v * (B?.[i]?.[j] ?? 1)));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = A[i] * (B?.[i] ?? 1);
    return res;
  }

  static elem_div(A, B) {
    return SwitchaMath.div(A, B);
  }

  static elem_pow(A, B) {
    if (A === undefined || A === null) return B ?? 0;
    if (B === undefined || B === null) return A ?? 0;
    if (typeof A === 'number' && typeof B === 'number') return Math.pow(A, B);
    if (typeof B === 'number') {
      if (Array.isArray(A[0]) || A[0] instanceof Float64Array) return A.map(row => row.map(v => Math.pow(v, B)));
      return A.map(v => Math.pow(v, B));
    }
    if (typeof A === 'number') {
      if (Array.isArray(B[0]) || B[0] instanceof Float64Array) return B.map(row => row.map(v => Math.pow(A, v)));
      return B.map(v => Math.pow(A, v));
    }
    if (Array.isArray(A[0]) || A[0] instanceof Float64Array) {
      return A.map((row, i) => row.map((v, j) => Math.pow(v, B?.[i]?.[j] ?? 1)));
    }
    const res = new Float64Array(A.length);
    for (let i = 0; i < A.length; i++) res[i] = Math.pow(A[i], B?.[i] ?? 1);
    return res;
  }

  static matrix_power(A, p) {
    if (typeof A === 'number') return Math.pow(A, p);
    if (p === 0) return SwitchaMath.eye(A.length);
    if (p === 1) return A;
    if (p === -1) return SwitchaMath.inv(A);
    let res = A;
    for (let i = 1; i < p; i++) res = SwitchaMath.matmul(res, A);
    return res;
  }

  // --- 2. Linear Algebra & Matrix Math ---
  static dot(a, b) {
    if (a.length !== b.length) throw new Error('Vector dimensions must agree for dot product');
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }

  static cross(a, b) {
    if (a.length !== 3 || b.length !== 3) throw new Error('cross product requires 3-element vectors');
    return new Float64Array([
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ]);
  }

  static kron(A, B) {
    const [rA, cA] = SwitchaMath.size(A);
    const [rB, cB] = SwitchaMath.size(B);
    const isA2D = Array.isArray(A[0]) || A[0] instanceof Float64Array;
    const isB2D = Array.isArray(B[0]) || B[0] instanceof Float64Array;

    const C = Array.from({ length: rA * rB }, () => new Float64Array(cA * cB));
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cA; j++) {
        const aVal = isA2D ? A[i][j] : A[j];
        for (let p = 0; p < rB; p++) {
          for (let q = 0; q < cB; q++) {
            const bVal = isB2D ? B[p][q] : B[q];
            C[i * rB + p][j * cB + q] = aVal * bVal;
          }
        }
      }
    }
    return C;
  }

  static norm(v, p = 2) {
    if (Array.isArray(v[0]) || v[0] instanceof Float64Array) {
      let sum = 0;
      for (let i = 0; i < v.length; i++) {
        for (let j = 0; j < v[0].length; j++) sum += v[i][j] * v[i][j];
      }
      return Math.sqrt(sum);
    }
    if (p === 2) {
      let sum = 0;
      for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
      return Math.sqrt(sum);
    }
    if (p === 1) {
      let sum = 0;
      for (let i = 0; i < v.length; i++) sum += Math.abs(v[i]);
      return sum;
    }
    if (p === Infinity) {
      let max = 0;
      for (let i = 0; i < v.length; i++) max = Math.max(max, Math.abs(v[i]));
      return max;
    }
    let sum = 0;
    for (let i = 0; i < v.length; i++) sum += Math.pow(Math.abs(v[i]), p);
    return Math.pow(sum, 1 / p);
  }

  static trace(A) {
    const n = Math.min(A.length, A[0]?.length || 0);
    let tr = 0;
    for (let i = 0; i < n; i++) tr += A[i][i];
    return tr;
  }

  static matmul(A, B) {
    const isVectorB = !Array.isArray(B[0]) && !(B[0] instanceof Float64Array);
    if (isVectorB) {
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
    if (Array.isArray(b[0]) || b[0] instanceof Float64Array) {
      b = b.map(r => r[0]);
    }
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

  static rank(A) {
    const [r, c] = SwitchaMath.size(A);
    const M = A.map(row => Float64Array.from(row));
    let rank = 0;
    for (let col = 0; col < c && rank < r; col++) {
      let pivotRow = rank;
      let maxVal = Math.abs(M[rank][col]);
      for (let i = rank + 1; i < r; i++) {
        if (Math.abs(M[i][col]) > maxVal) {
          maxVal = Math.abs(M[i][col]);
          pivotRow = i;
        }
      }
      if (maxVal < 1e-12) continue;
      if (pivotRow !== rank) {
        const temp = M[rank]; M[rank] = M[pivotRow]; M[pivotRow] = temp;
      }
      for (let i = rank + 1; i < r; i++) {
        const factor = M[i][col] / M[rank][col];
        for (let j = col; j < c; j++) M[i][j] -= factor * M[rank][j];
      }
      rank++;
    }
    return rank;
  }

  static cond(A) {
    const s = SwitchaMath.svd(A).S;
    const maxS = Math.max(...s);
    const minS = Math.min(...s);
    return minS > 1e-15 ? maxS / minS : Infinity;
  }

  static chol(A) {
    const n = A.length;
    const L = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
        if (i === j) {
          const d = A[i][i] - sum;
          if (d <= 0) throw new Error('Matrix is not positive definite for Cholesky factorization');
          L[i][j] = Math.sqrt(d);
        } else {
          L[i][j] = (A[i][j] - sum) / L[j][j];
        }
      }
    }
    return L;
  }

  static qr(A) {
    const [m, n] = SwitchaMath.size(A);
    const Q = Array.from({ length: m }, () => new Float64Array(n));
    const R = Array.from({ length: n }, () => new Float64Array(n));

    for (let j = 0; j < n; j++) {
      const v = new Float64Array(m);
      for (let i = 0; i < m; i++) v[i] = A[i][j];

      for (let i = 0; i < j; i++) {
        let dotVal = 0;
        for (let k = 0; k < m; k++) dotVal += Q[k][i] * A[k][j];
        R[i][j] = dotVal;
        for (let k = 0; k < m; k++) v[k] -= dotVal * Q[k][i];
      }
      const normV = SwitchaMath.norm(v);
      R[j][j] = normV;
      for (let k = 0; k < m; k++) Q[k][j] = normV > 1e-14 ? v[k] / normV : 0;
    }
    return { Q, R };
  }

  static svd(A) {
    const AT_A = SwitchaMath.matmul(SwitchaMath.transpose(A), A);
    const eigVals = SwitchaMath.eig(AT_A);
    const sVals = Array.from(eigVals).map(v => Math.sqrt(Math.max(0, typeof v === 'number' ? v : v.r))).sort((a, b) => b - a);
    return { S: Float64Array.from(sVals) };
  }

  static pinv(A) {
    const [m, n] = SwitchaMath.size(A);
    const AT = SwitchaMath.transpose(A);
    if (m >= n) {
      const ATA = SwitchaMath.matmul(AT, A);
      return SwitchaMath.matmul(SwitchaMath.inv(ATA), AT);
    } else {
      const AAT = SwitchaMath.matmul(A, AT);
      return SwitchaMath.matmul(AT, SwitchaMath.inv(AAT));
    }
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
    const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A[i][j]));
    const maxIter = 150;
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

  // --- 3. Statistics & Aggregations ---
  static sum(A, dim = 1) {
    if (!Array.isArray(A) && !(A instanceof Float64Array)) return A;
    if (!Array.isArray(A[0]) && !(A[0] instanceof Float64Array)) {
      let s = 0;
      for (let i = 0; i < A.length; i++) s += A[i];
      return s;
    }
    const [r, c] = SwitchaMath.size(A);
    if (dim === 1) {
      const colSums = new Float64Array(c);
      for (let j = 0; j < c; j++) {
        for (let i = 0; i < r; i++) colSums[j] += A[i][j];
      }
      return colSums;
    } else {
      const rowSums = new Float64Array(r);
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) rowSums[i] += A[i][j];
      }
      return rowSums;
    }
  }

  static mean(A, dim = 1) {
    const s = SwitchaMath.sum(A, dim);
    const n = !Array.isArray(A[0]) && !(A[0] instanceof Float64Array) ? A.length : (dim === 1 ? A.length : A[0].length);
    if (typeof s === 'number') return s / n;
    return s.map(v => v / n);
  }

  static std(A) {
    const m = SwitchaMath.mean(A);
    let sumSq = 0;
    const arr = Array.isArray(A[0]) || A[0] instanceof Float64Array ? A.flat() : A;
    for (let i = 0; i < arr.length; i++) sumSq += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(sumSq / Math.max(1, arr.length - 1));
  }

  static var(A) {
    const s = SwitchaMath.std(A);
    return s * s;
  }

  static min(A) {
    const arr = Array.isArray(A[0]) || A[0] instanceof Float64Array ? A.flat() : A;
    return Math.min(...arr);
  }

  static max(A) {
    const arr = Array.isArray(A[0]) || A[0] instanceof Float64Array ? A.flat() : A;
    return Math.max(...arr);
  }

  static sort(A) {
    const copy = Float64Array.from(A);
    copy.sort();
    return copy;
  }

  // --- 4. Polynomials & Root Finding ---
  static roots(c) {
    let start = 0;
    while (start < c.length && Math.abs(c[start]) < 1e-12) start++;
    c = c.slice(start);
    const n = c.length - 1;
    if (n <= 0) return [];
    if (n === 1) return [-c[1] / c[0]];
    if (n === 2) {
      const a = c[0], b = c[1], d = c[2];
      const disc = b * b - 4 * a * d;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        return [(-b + sq) / (2 * a), (-b - sq) / (2 * a)];
      } else {
        const sq = Math.sqrt(-disc);
        return [
          new SwitchaMath.Complex(-b / (2 * a), sq / (2 * a)),
          new SwitchaMath.Complex(-b / (2 * a), -sq / (2 * a))
        ];
      }
    }

    const a0 = c[0];
    const A = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 1; i < n; i++) A[i][i - 1] = 1.0;
    for (let i = 0; i < n; i++) A[0][i] = -c[i + 1] / a0;

    let H = A.map(row => Float64Array.from(row));
    const maxIter = 100 * n;
    for (let iter = 0; iter < maxIter; iter++) {
      let offDiag = 0;
      for (let i = 1; i < n; i++) offDiag += Math.abs(H[i][i - 1]);
      if (offDiag < 1e-10) break;

      const s = H[n - 1][n - 1];
      for (let i = 0; i < n; i++) H[i][i] -= s;

      const Gs = [];
      for (let i = 0; i < n - 1; i++) {
        const a = H[i][i], b = H[i + 1][i];
        const r = Math.hypot(a, b);
        const cRot = r === 0 ? 1 : a / r;
        const sRot = r === 0 ? 0 : -b / r;
        Gs.push({ c: cRot, s: sRot });
        for (let j = i; j < n; j++) {
          const h1 = H[i][j], h2 = H[i + 1][j];
          H[i][j] = cRot * h1 - sRot * h2;
          H[i + 1][j] = sRot * h1 + cRot * h2;
        }
      }

      for (let i = 0; i < n - 1; i++) {
        const { c: cRot, s: sRot } = Gs[i];
        for (let j = 0; j < n; j++) {
          const h1 = H[j][i], h2 = H[j][i + 1];
          H[j][i] = cRot * h1 - sRot * h2;
          H[j][i + 1] = sRot * h1 + cRot * h2;
        }
      }

      for (let i = 0; i < n; i++) H[i][i] += s;
    }

    const eigvals = [];
    let i = 0;
    while (i < n) {
      if (i === n - 1 || Math.abs(H[i + 1][i]) < 1e-6) {
        eigvals.push(H[i][i]);
        i++;
      } else {
        const a = H[i][i], b = H[i][i + 1];
        const cVal = H[i + 1][i], d = H[i + 1][i + 1];
        const tr = a + d;
        const det = a * d - b * cVal;
        const disc = tr * tr - 4 * det;
        if (disc >= 0) {
          eigvals.push((tr + Math.sqrt(disc)) / 2);
          eigvals.push((tr - Math.sqrt(disc)) / 2);
        } else {
          eigvals.push(new SwitchaMath.Complex(tr / 2, Math.sqrt(-disc) / 2));
          eigvals.push(new SwitchaMath.Complex(tr / 2, -Math.sqrt(-disc) / 2));
        }
        i += 2;
      }
    }
    return eigvals;
  }

  static poly(roots) {
    let p = [1.0];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      const rVal = typeof r === 'number' ? r : r.r;
      const nextP = new Float64Array(p.length + 1);
      for (let j = 0; j < p.length; j++) {
        nextP[j] += p[j];
        nextP[j + 1] -= rVal * p[j];
      }
      p = Array.from(nextP);
    }
    return Float64Array.from(p);
  }

  static polyval(p, x) {
    const evalAt = (val) => {
      let res = p[0];
      for (let i = 1; i < p.length; i++) res = res * val + p[i];
      return res;
    };
    if (Array.isArray(x) || x instanceof Float64Array) return x.map(evalAt);
    return evalAt(x);
  }

  static polyfit(x, y, n) {
    const m = x.length;
    const V = Array.from({ length: m }, () => new Float64Array(n + 1));
    for (let i = 0; i < m; i++) {
      V[i][n] = 1.0;
      for (let j = n - 1; j >= 0; j--) {
        V[i][j] = V[i][j + 1] * x[i];
      }
    }
    return SwitchaMath.linsolve(SwitchaMath.matmul(SwitchaMath.transpose(V), V), SwitchaMath.matmul(SwitchaMath.transpose(V), y));
  }

  static polyder(p) {
    const n = p.length - 1;
    if (n <= 0) return new Float64Array([0]);
    const dp = new Float64Array(n);
    for (let i = 0; i < n; i++) dp[i] = (n - i) * p[i];
    return dp;
  }

  static polyint(p, k = 0) {
    const n = p.length;
    const ip = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) ip[i] = p[i] / (n - i);
    ip[n] = k;
    return ip;
  }

  // --- 5. Numerical Calculus & Optimization ---
  static diff(x) {
    const n = x.length;
    if (n <= 1) return new Float64Array(0);
    const dx = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) dx[i] = x[i + 1] - x[i];
    return dx;
  }

  static trapz(x, y) {
    if (y === undefined) {
      y = x;
      x = SwitchaMath.colon(1, y.length);
    }
    let area = 0;
    for (let i = 0; i < x.length - 1; i++) {
      area += 0.5 * (y[i] + y[i + 1]) * (x[i + 1] - x[i]);
    }
    return area;
  }

  static cumsum(x) {
    const res = new Float64Array(x.length);
    let acc = 0;
    for (let i = 0; i < x.length; i++) {
      acc += x[i];
      res[i] = acc;
    }
    return res;
  }

  static cumtrapz(x, y) {
    if (y === undefined) {
      y = x;
      x = SwitchaMath.colon(1, y.length);
    }
    const res = new Float64Array(x.length);
    res[0] = 0;
    for (let i = 1; i < x.length; i++) {
      res[i] = res[i - 1] + 0.5 * (y[i - 1] + y[i]) * (x[i] - x[i - 1]);
    }
    return res;
  }

  static quad(f, a, b, n = 1000) {
    if (n % 2 !== 0) n += 1;
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    return (h / 3) * sum;
  }

  static fzero(f, x0, tol = 1e-10) {
    let x = x0;
    for (let i = 0; i < 100; i++) {
      const fx = f(x);
      if (Math.abs(fx) < tol) return x;
      const h = Math.max(1e-6, Math.abs(x) * 1e-5);
      const df = (f(x + h) - f(x - h)) / (2 * h);
      if (Math.abs(df) < 1e-14) break;
      const step = fx / df;
      x -= step;
      if (Math.abs(step) < tol) return x;
    }
    return x;
  }

  static fminsearch(f, x0, tol = 1e-6) {
    const isScalar = typeof x0 === 'number';
    let x = isScalar ? x0 : x0[0];
    let step = 0.1;
    for (let iter = 0; iter < 200; iter++) {
      const fMid = f(x);
      const fPlus = f(x + step);
      const fMinus = f(x - step);
      if (fPlus < fMid && fPlus < fMinus) {
        x += step;
      } else if (fMinus < fMid) {
        x -= step;
      } else {
        step *= 0.5;
        if (step < tol) break;
      }
    }
    return isScalar ? x : [x];
  }

  static ode45(f, tspan, y0, numStepsOrDt = 100) {
    const tStart = tspan[0];
    const tEnd = tspan[1];
    let numSteps = 100;
    if (typeof numStepsOrDt === 'number') {
      if (numStepsOrDt >= 1) numSteps = Math.round(numStepsOrDt);
      else numSteps = Math.max(10, Math.round((tEnd - tStart) / numStepsOrDt));
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

    return { t, y: isScalar ? yStateTracks[0] : yStateTracks };
  }

  // --- 6. Signal Processing & FFT ---
  static fft(x) {
    const N = x.length;
    let powerOf2 = 1;
    while (powerOf2 < N) powerOf2 <<= 1;
    const real = new Float64Array(powerOf2);
    const imag = new Float64Array(powerOf2);
    for (let i = 0; i < N; i++) real[i] = x[i];

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
      imag[i] = -imagIn[i];
    }

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
    for (let i = 0; i < N; i++) out[i] = real[i] / N;
    return out;
  }

  static fftshift(x) {
    const n = x.length;
    const half = Math.floor(n / 2);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = x[(i + half) % n];
    return out;
  }

  static ifftshift(x) {
    const n = x.length;
    const half = Math.ceil(n / 2);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = x[(i + half) % n];
    return out;
  }

  static nextpow2(N) {
    let p = 1;
    let count = 0;
    while (p < N) { p <<= 1; count++; }
    return count;
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

  static filtfilt(b, a, x) {
    const yForward = SwitchaMath.filter(b, a, x);
    yForward.reverse();
    const yBack = SwitchaMath.filter(b, a, yForward);
    yBack.reverse();
    return yBack;
  }

  static freqz(b, a, n = 512, fs = 2) {
    const w = SwitchaMath.linspace(0, Math.PI, n);
    const hMag = new Float64Array(n);
    const hPhase = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const omega = w[i];
      let numR = 0, numI = 0;
      for (let k = 0; k < b.length; k++) {
        numR += b[k] * Math.cos(-k * omega);
        numI += b[k] * Math.sin(-k * omega);
      }
      let denR = 0, denI = 0;
      for (let k = 0; k < a.length; k++) {
        denR += a[k] * Math.cos(-k * omega);
        denI += a[k] * Math.sin(-k * omega);
      }
      const numMag = Math.hypot(numR, numI);
      const denMag = Math.hypot(denR, denI);
      hMag[i] = 20 * Math.log10(Math.max(1e-12, numMag / denMag));
      hPhase[i] = (Math.atan2(numI, numR) - Math.atan2(denI, denR)) * (180 / Math.PI);
    }
    const f = w.map(v => (v / Math.PI) * (fs / 2));
    return { f, magDb: hMag, phaseDeg: hPhase };
  }

  static hanning(N) {
    const w = new Float64Array(N);
    for (let i = 0; i < N; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    return w;
  }

  static hamming(N) {
    const w = new Float64Array(N);
    for (let i = 0; i < N; i++) w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    return w;
  }

  static blackman(N) {
    const w = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      w[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
    }
    return w;
  }

  static rectwin(N) {
    return new Float64Array(N).fill(1.0);
  }

  static butter(order, Wn, type = 'low') {
    const T = 2.0;
    const wa = 2 * Math.tan((Math.PI * Wn) / 2);
    let bArr, aArr;

    if (order === 1) {
      if (type === 'low') {
        const a0 = wa + T;
        bArr = [(wa) / a0, (wa) / a0];
        aArr = [1.0, (wa - T) / a0];
      } else {
        const a0 = wa + T;
        bArr = [T / a0, -T / a0];
        aArr = [1.0, (wa - T) / a0];
      }
    } else {
      const q = Math.SQRT2;
      const wa2 = wa * wa;
      const a0 = 4 + 2 * q * wa + wa2;
      if (type === 'low') {
        bArr = [wa2 / a0, (2 * wa2) / a0, wa2 / a0];
        aArr = [1.0, (2 * wa2 - 8) / a0, (4 - 2 * q * wa + wa2) / a0];
      } else {
        bArr = [4 / a0, -8 / a0, 4 / a0];
        aArr = [1.0, (2 * wa2 - 8) / a0, (4 - 2 * q * wa + wa2) / a0];
      }
    }
    const b = Float64Array.from(bArr);
    const a = Float64Array.from(aArr);
    const res = [b, a];
    res.b = b;
    res.a = a;
    return res;
  }

  static chirp(t, f0 = 0, t1 = 1, f1 = 100, method = 'linear') {
    const k = (f1 - f0) / t1;
    const y = new Float64Array(t.length);
    for (let i = 0; i < t.length; i++) {
      const ti = t[i];
      const phi = 2 * Math.PI * (f0 * ti + 0.5 * k * ti * ti);
      y[i] = Math.cos(phi);
    }
    return y;
  }

  static square(t, duty = 50) {
    const y = new Float64Array(t.length);
    const dFrac = duty / 100;
    for (let i = 0; i < t.length; i++) {
      const cycle = (t[i] / (2 * Math.PI)) % 1;
      const pos = cycle < 0 ? cycle + 1 : cycle;
      y[i] = pos < dFrac ? 1.0 : -1.0;
    }
    return y;
  }

  static sawtooth(t, width = 1) {
    const y = new Float64Array(t.length);
    for (let i = 0; i < t.length; i++) {
      const cycle = (t[i] / (2 * Math.PI)) % 1;
      const pos = cycle < 0 ? cycle + 1 : cycle;
      if (pos < width) y[i] = 2 * (pos / width) - 1;
      else y[i] = 2 * ((1 - pos) / (1 - width)) - 1;
    }
    return y;
  }

  static findpeaks(x, opts = {}) {
    const minH = opts.minHeight ?? -Infinity;
    const minD = opts.minDistance ?? 1;
    const peaks = [];
    const locs = [];
    for (let i = 1; i < x.length - 1; i++) {
      if (x[i] > x[i - 1] && x[i] > x[i + 1] && x[i] >= minH) {
        if (locs.length === 0 || i - locs[locs.length - 1] >= minD) {
          peaks.push(x[i]);
          locs.push(i);
        }
      }
    }
    return { pks: Float64Array.from(peaks), locs: Float64Array.from(locs) };
  }

  static xcorr(x, y = x) {
    const N = x.length;
    const M = y.length;
    const len = N + M - 1;
    const r = new Float64Array(len);
    for (let lag = -M + 1; lag < N; lag++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        const m = n - lag;
        if (m >= 0 && m < M) sum += x[n] * y[m];
      }
      r[lag + M - 1] = sum;
    }
    return r;
  }

  // --- 7. Control Systems Toolbox ---
  static tf(num, den) {
    return new TransferFunction(num, den);
  }

  static step(sys, t = null) {
    if (!(sys instanceof TransferFunction)) {
      sys = new TransferFunction(sys.num || sys[0] || [1], sys.den || sys[1] || [1, 1]);
    }
    if (typeof t === 'number') {
      t = SwitchaMath.linspace(0, t, Math.max(100, Math.round(t * 200)));
    } else if (!t) {
      t = SwitchaMath.linspace(0, 5, 250);
    }
    const dt = t[1] - t[0];
    const num = sys.num;
    const den = sys.den;
    const n = Math.max(1, den.length - 1);
    const a0 = den[0] || 1.0;

    const x = new Float64Array(n);
    const y = new Float64Array(t.length);

    for (let stepIdx = 0; stepIdx < t.length; stepIdx++) {
      const u = 1.0;
      let out = 0;
      for (let i = 0; i < n; i++) {
        const bIdx = num.length - 1 - i;
        if (bIdx >= 0) out += (num[bIdx] / a0) * x[i];
      }
      y[stepIdx] = out;

      let dxTop = u;
      for (let i = 0; i < n; i++) {
        dxTop -= (den[den.length - 1 - i] / a0) * x[i];
      }
      const nextX = new Float64Array(n);
      nextX[0] = x[0] + dt * (n > 1 ? x[1] : dxTop);
      for (let i = 1; i < n - 1; i++) nextX[i] = x[i] + dt * x[i + 1];
      if (n > 1) nextX[n - 1] = x[n - 1] + dt * dxTop;
      for (let i = 0; i < n; i++) x[i] = nextX[i];
    }

    const finalVal = y[y.length - 1];
    let maxVal = -Infinity, tPeak = 0;
    let t10 = null, t90 = null;
    for (let i = 0; i < y.length; i++) {
      if (y[i] > maxVal) { maxVal = y[i]; tPeak = t[i]; }
      if (t10 === null && y[i] >= 0.1 * finalVal) t10 = t[i];
      if (t90 === null && y[i] >= 0.9 * finalVal) t90 = t[i];
    }
    const overshoot = finalVal > 0 ? Math.max(0, ((maxVal - finalVal) / finalVal) * 100) : 0;
    const riseTime = (t90 && t10) ? t90 - t10 : 0;

    return { t, y, metrics: { RiseTime: riseTime, PeakTime: tPeak, Overshoot: overshoot, SteadyState: finalVal } };
  }

  static impulse(sys, t = null) {
    if (typeof t === 'number') {
      t = SwitchaMath.linspace(0, t, Math.max(100, Math.round(t * 200)));
    } else if (!t) {
      t = SwitchaMath.linspace(0, 5, 250);
    }
    const stepRes = SwitchaMath.step(sys, t);
    const dy = SwitchaMath.diff(stepRes.y);
    const dt = stepRes.t[1] - stepRes.t[0];
    const impY = new Float64Array(stepRes.t.length);
    impY[0] = dy[0] / dt;
    for (let i = 1; i < stepRes.t.length; i++) impY[i] = (dy[i - 1] || 0) / dt;
    return { t: stepRes.t, y: impY };
  }

  static bode(sys, w = null) {
    if (!(sys instanceof TransferFunction)) {
      sys = new TransferFunction(sys.num || sys[0] || [1], sys.den || sys[1] || [1, 1]);
    }
    if (!w) w = SwitchaMath.logspace(-1, 3, 200);
    const magDb = new Float64Array(w.length);
    const phaseDeg = new Float64Array(w.length);

    for (let idx = 0; idx < w.length; idx++) {
      const omega = w[idx];
      let numR = 0, numI = 0;
      for (let k = 0; k < sys.num.length; k++) {
        const pwr = sys.num.length - 1 - k;
        const coef = sys.num[k];
        const sPwr = complexPowerJ(omega, pwr);
        numR += coef * sPwr.r;
        numI += coef * sPwr.i;
      }
      let denR = 0, denI = 0;
      for (let k = 0; k < sys.den.length; k++) {
        const pwr = sys.den.length - 1 - k;
        const coef = sys.den[k];
        const sPwr = complexPowerJ(omega, pwr);
        denR += coef * sPwr.r;
        denI += coef * sPwr.i;
      }
      const numMag = Math.hypot(numR, numI);
      const denMag = Math.hypot(denR, denI);
      magDb[idx] = 20 * Math.log10(Math.max(1e-12, numMag / denMag));
      phaseDeg[idx] = (Math.atan2(numI, numR) - Math.atan2(denI, denR)) * (180 / Math.PI);
    }
    return { w, magDb, phaseDeg };
  }

  static margin(sys) {
    const b = SwitchaMath.bode(sys);
    let Gm = Infinity, Pm = 180, Wcg = 0, Wcp = 0;
    for (let i = 0; i < b.magDb.length - 1; i++) {
      if ((b.magDb[i] >= 0 && b.magDb[i + 1] < 0) || (b.magDb[i] <= 0 && b.magDb[i + 1] > 0)) {
        Wcg = b.w[i];
        Pm = 180 + b.phaseDeg[i];
      }
      if ((b.phaseDeg[i] >= -180 && b.phaseDeg[i + 1] < -180) || (b.phaseDeg[i] <= -180 && b.phaseDeg[i + 1] > -180)) {
        Wcp = b.w[i];
        Gm = -b.magDb[i];
      }
    }
    return { Gm, Pm, Wcg, Wcp };
  }

  static nyquist(sys, w = null) {
    const b = SwitchaMath.bode(sys, w);
    const real = new Float64Array(b.w.length);
    const imag = new Float64Array(b.w.length);
    for (let i = 0; i < b.w.length; i++) {
      const magLin = Math.pow(10, b.magDb[i] / 20);
      const phiRad = (b.phaseDeg[i] * Math.PI) / 180;
      real[i] = magLin * Math.cos(phiRad);
      imag[i] = magLin * Math.sin(phiRad);
    }
    return { real, imag, w: b.w };
  }

  static feedback(sys1, sys2 = 1, sign = -1) {
    const G = sys1 instanceof TransferFunction ? sys1 : new TransferFunction(sys1[0], sys1[1]);
    const H = sys2 instanceof TransferFunction ? sys2 : (typeof sys2 === 'number' ? new TransferFunction([sys2], [1]) : new TransferFunction(sys2[0], sys2[1]));

    const num = SwitchaMath.conv(G.num, H.den);
    const denTerm1 = SwitchaMath.conv(G.den, H.den);
    const denTerm2 = SwitchaMath.conv(G.num, H.num);
    const maxLen = Math.max(denTerm1.length, denTerm2.length);
    const den = new Float64Array(maxLen);
    for (let i = 0; i < maxLen; i++) {
      const v1 = denTerm1[denTerm1.length - 1 - i] || 0;
      const v2 = denTerm2[denTerm2.length - 1 - i] || 0;
      den[maxLen - 1 - i] = v1 - sign * v2;
    }
    return new TransferFunction(num, den);
  }

  static series(sys1, sys2) {
    const G1 = sys1 instanceof TransferFunction ? sys1 : new TransferFunction(sys1[0], sys1[1]);
    const G2 = sys2 instanceof TransferFunction ? sys2 : new TransferFunction(sys2[0], sys2[1]);
    return new TransferFunction(SwitchaMath.conv(G1.num, G2.num), SwitchaMath.conv(G1.den, G2.den));
  }

  static parallel(sys1, sys2) {
    const G1 = sys1 instanceof TransferFunction ? sys1 : new TransferFunction(sys1[0], sys1[1]);
    const G2 = sys2 instanceof TransferFunction ? sys2 : new TransferFunction(sys2[0], sys2[1]);
    const n1 = SwitchaMath.conv(G1.num, G2.den);
    const n2 = SwitchaMath.conv(G2.num, G1.den);
    const maxLen = Math.max(n1.length, n2.length);
    const num = new Float64Array(maxLen);
    for (let i = 0; i < maxLen; i++) {
      num[maxLen - 1 - i] = (n1[n1.length - 1 - i] || 0) + (n2[n2.length - 1 - i] || 0);
    }
    return new TransferFunction(num, SwitchaMath.conv(G1.den, G2.den));
  }

  static pzmap(sys) {
    const G = sys instanceof TransferFunction ? sys : new TransferFunction(sys[0], sys[1]);
    const p = SwitchaMath.roots(G.den);
    const z = SwitchaMath.roots(G.num);
    return { poles: p, zeros: z };
  }

  static damp(sys) {
    const { poles } = SwitchaMath.pzmap(sys);
    const table = poles.map(p => {
      const re = typeof p === 'number' ? p : p.r;
      const im = typeof p === 'number' ? 0 : p.i;
      const wn = Math.hypot(re, im);
      const zeta = wn > 0 ? -re / wn : 1.0;
      return { Pole: p, Damping: zeta, Frequency: wn, TimeConstant: zeta * wn > 0 ? 1 / (zeta * wn) : Infinity };
    });
    table.wn = table.map(r => r.Frequency);
    table.zeta = table.map(r => r.Damping);
    table.poles = poles;
    return table;
  }

  // --- 8. Communications Functions ---
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

function complexPowerJ(omega, n) {
  const mod = Math.pow(omega, n);
  const rem = n % 4;
  if (rem === 0) return { r: mod, i: 0 };
  if (rem === 1) return { r: 0, i: mod };
  if (rem === 2) return { r: -mod, i: 0 };
  return { r: 0, i: -mod };
}

export class TransferFunction {
  constructor(num, den) {
    this.num = Float64Array.from(Array.isArray(num) || num instanceof Float64Array ? num : [num]);
    this.den = Float64Array.from(Array.isArray(den) || den instanceof Float64Array ? den : [den]);
  }
  get dcGain() {
    const num0 = this.num[this.num.length - 1] || 0;
    const den0 = this.den[this.den.length - 1] || 0;
    return den0 !== 0 ? num0 / den0 : Infinity;
  }
  toString() {
    const numStr = Array.from(this.num).map(n => n.toFixed(2)).join(' s + ');
    const denStr = Array.from(this.den).map(n => n.toFixed(2)).join(' s + ');
    return `TransferFunction:\n  ${numStr}\n  ----------------\n  ${denStr}`;
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
  toString() {
    const sign = this.i >= 0 ? '+' : '-';
    return `${this.r.toFixed(4)} ${sign} ${Math.abs(this.i).toFixed(4)}i`;
  }
};

// ==========================================
// MATLAB SYNTAX PREPROCESSOR & TRANSPILER
// ==========================================
const KNOWN_MATLAB_FUNCS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'log10', 'sqrt', 'abs',
  'add', 'sub', 'mul', 'div', 'elem_mul', 'elem_div', 'elem_pow', 'mtimes', 'matmul', 'matrix_power',
  'zeros', 'ones', 'eye', 'rand', 'randn', 'randi', 'linspace', 'logspace', 'colon',
  'size', 'length', 'numel', 'reshape', 'repmat', 'diag', 'tril', 'triu', 'flipud', 'fliplr', 'rot90', 'vertcat', 'horzcat',
  'dot', 'cross', 'kron', 'transpose', 'linsolve', 'inv', 'det', 'rank', 'cond', 'norm', 'trace',
  'chol', 'qr', 'svd', 'pinv', 'eig', 'sum', 'mean', 'std', 'var', 'min', 'max', 'sort',
  'poly', 'roots', 'polyval', 'polyfit', 'polyder', 'polyint', 'diff', 'trapz', 'cumsum', 'cumtrapz',
  'quad', 'fzero', 'fminsearch', 'ode45', 'fft', 'ifft', 'fftshift', 'ifftshift', 'nextpow2',
  'conv', 'filter', 'filtfilt', 'freqz', 'hanning', 'hamming', 'blackman', 'rectwin', 'butter',
  'chirp', 'square', 'sawtooth', 'findpeaks', 'xcorr', 'tf', 'step', 'impulse', 'bode', 'margin',
  'nyquist', 'feedback', 'series', 'parallel', 'pzmap', 'damp', 'awgn', 'biterr', 'Complex', 'sim',
  'disp', 'print', 'dispMatlab', 'clc', 'clear', 'who', 'whos', 'clf', 'figure',
  'plot', 'subplot', 'stem', 'scatter', 'bar', 'stairs', 'semilogx', 'semilogy', 'loglog',
  'polarplot', 'constellation', 'eyediagram', 'grid', 'title', 'xlabel', 'ylabel', 'xlim', 'ylim',
  'legend', 'hold'
]);

export function transformMathExpr(expr) {
  const tokens = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Two-character operators
    if (i + 1 < len) {
      const two = expr.slice(i, i + 2);
      if (['.*', './', '.^', '==', '~=', '<=', '>=', '&&', '||', '=>'].includes(two)) {
        tokens.push({ type: 'op', value: two });
        i += 2;
        continue;
      }
    }

    // Single character operators & delimiters
    if (['+', '-', '*', '/', '\\', '^', ':', '(', ')', '[', ']', '{', '}', ',', ';', '<', '>', '~', '&', '|', '!'].includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Numbers (e.g. 10, 0.00001, 1e-4, .5)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
      let num = '';
      while (i < len && (/[\d\.]/.test(expr[i]) || (/[eE]/.test(expr[i]) && i + 1 < len && /[\+\-\d]/.test(expr[i + 1])))) {
        num += expr[i];
        if (/[eE]/.test(expr[i]) && /[\+\-]/.test(expr[i + 1])) {
          i++;
          num += expr[i];
        }
        i++;
      }
      tokens.push({ type: 'num', value: num });
      continue;
    }

    // Identifiers or string tokens (e.g. __SWITCHA_STR_0__, varName)
    if (/[a-zA-Z_$]/.test(ch)) {
      let id = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(expr[i])) {
        id += expr[i];
        i++;
      }
      tokens.push({ type: 'id', value: id });
      continue;
    }

    // Transpose quote ' after an operand
    if (ch === "'") {
      tokens.push({ type: 'transpose', value: "'" });
      i++;
      continue;
    }

    tokens.push({ type: 'other', value: ch });
    i++;
  }

  const PRECEDENCE = {
    '||': 0.4,
    '|': 0.45,
    '&&': 0.5,
    '&': 0.55,
    '==': 0.6, '~=': 0.6, '<=': 0.6, '>=': 0.6, '<': 0.6, '>': 0.6,
    ':': 0.7,
    '+': 1, '-': 1,
    '*': 2, '/': 2, '.*': 2, './': 2, '\\': 2,
    '^': 3, '.^': 3
  };

  const OP_FUNC = {
    '+': 'add',
    '-': 'sub',
    '*': 'mul',
    '/': 'div',
    '.*': 'elem_mul',
    './': 'elem_div',
    '^': 'elem_pow',
    '.^': 'elem_pow',
    '\\': 'linsolve'
  };

  let pos = 0;

  function parseExpression(minPrec = 0) {
    let left = parsePrimary();

    while (pos < tokens.length) {
      const tok = tokens[pos];
      if (tok.type !== 'op' || !(tok.value in PRECEDENCE)) break;

      const prec = PRECEDENCE[tok.value];
      if (prec < minPrec) break;

      pos++;

      if (tok.value === ':') {
        const stepOrEnd = parseExpression(prec + 0.01);
        if (pos < tokens.length && tokens[pos].type === 'op' && tokens[pos].value === ':') {
          pos++;
          const end = parseExpression(prec + 0.01);
          left = `colon(${left}, ${stepOrEnd}, ${end})`;
        } else {
          left = `colon(${left}, ${stepOrEnd})`;
        }
        continue;
      }

      const nextMinPrec = (tok.value === '^' || tok.value === '.^') ? prec : prec + 1;
      const right = parseExpression(nextMinPrec);
      const func = OP_FUNC[tok.value];
      if (func) {
        left = `${func}(${left}, ${right})`;
      } else {
        const jsOp = tok.value === '~=' ? '!==' : (tok.value === '==' ? '===' : tok.value);
        left = `(${left} ${jsOp} ${right})`;
      }
    }

    return left;
  }

  function parsePrimary() {
    if (pos >= tokens.length) return '';

    const tok = tokens[pos];

    // Unary + or -
    if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      pos++;
      const operand = parsePrimary();
      return tok.value === '-' ? `sub(0, ${operand})` : operand;
    }

    // Unary ~ or !
    if (tok.type === 'op' && (tok.value === '~' || tok.value === '!')) {
      pos++;
      const operand = parsePrimary();
      return `(!${operand})`;
    }

    // Parentheses (or parameter list for arrow function)
    if (tok.type === 'op' && tok.value === '(') {
      pos++;
      const args = [];
      while (pos < tokens.length && tokens[pos].value !== ')') {
        args.push(parseExpression(0));
        if (pos < tokens.length && tokens[pos].value === ',') pos++;
      }
      if (pos < tokens.length && tokens[pos].value === ')') pos++;

      // Check for arrow function: (t, y) => ...
      if (pos < tokens.length && tokens[pos].type === 'op' && tokens[pos].value === '=>') {
        pos++;
        const body = parseExpression(0);
        return `((${args.join(', ')}) => ${body})`;
      }

      let res = `(${args.join(', ')})`;
      if (pos < tokens.length && tokens[pos].type === 'transpose') {
        pos++;
        res = `transpose(${res})`;
      }
      return res;
    }

    // Matrix literal bracket [ ... ]
    if (tok.type === 'op' && tok.value === '[') {
      let bracketContent = '[';
      pos++;
      let depth = 1;
      while (pos < tokens.length && depth > 0) {
        if (tokens[pos].value === '[') depth++;
        else if (tokens[pos].value === ']') {
          depth--;
          if (depth === 0) { pos++; break; }
        }
        bracketContent += (tokens[pos].value === ',' ? ', ' : tokens[pos].value);
        pos++;
      }
      bracketContent += ']';
      if (pos < tokens.length && tokens[pos].type === 'transpose') {
        pos++;
        return `transpose(${bracketContent})`;
      }
      return bracketContent;
    }

    // Object literal { ... }
    if (tok.type === 'op' && tok.value === '{') {
      let braceContent = '{';
      pos++;
      let depth = 1;
      while (pos < tokens.length && depth > 0) {
        if (tokens[pos].value === '{') depth++;
        else if (tokens[pos].value === '}') {
          depth--;
          if (depth === 0) { pos++; break; }
        }
        const val = tokens[pos].value;
        braceContent += (val === ':' ? ': ' : (val === ',' ? ', ' : val));
        pos++;
      }
      braceContent += '}';
      return braceContent;
    }

    // Identifier / Function call / Property access / Single param arrow func
    if (tok.type === 'id') {
      // Check if it's single param arrow function: v => ...
      if (pos + 1 < tokens.length && tokens[pos + 1].type === 'op' && tokens[pos + 1].value === '=>') {
        const param = tok.value;
        pos += 2; // skip id and '=>'
        const body = parseExpression(0);
        return `((${param}) => ${body})`;
      }

      pos++;
      let res = tok.value;

      while (pos < tokens.length) {
        if (tokens[pos].value === '(') {
          pos++;
          const args = [];
          while (pos < tokens.length && tokens[pos].value !== ')') {
            args.push(parseExpression(0));
            if (pos < tokens.length && tokens[pos].value === ',') pos++;
          }
          if (pos < tokens.length && tokens[pos].value === ')') pos++;
          if (KNOWN_MATLAB_FUNCS.has(res) || res.startsWith('Math.') || res.endsWith('.map') || res.endsWith('.filter') || res.endsWith('.reduce') || res.endsWith('.forEach') || res.endsWith('.slice') || res.endsWith('.some') || res.endsWith('.every')) {
            res = `${res}(${args.join(', ')})`;
          } else if (res.includes('.')) {
            const lastDot = res.lastIndexOf('.');
            const obj = res.slice(0, lastDot);
            const prop = res.slice(lastDot + 1);
            res = args.length > 0 ? `prop_call(${obj}, '${prop}', ${args.join(', ')})` : `prop_call(${obj}, '${prop}')`;
          } else {
            res = args.length > 0 ? `idx_or_call(${res}, ${args.join(', ')})` : `${res}()`;
          }
        } else if (tokens[pos].value === '[') {
          pos++;
          let inner = '';
          while (pos < tokens.length && tokens[pos].value !== ']') {
            inner += tokens[pos].value;
            pos++;
          }
          if (pos < tokens.length && tokens[pos].value === ']') pos++;
          res = `${res}[${inner}]`;
        } else if (tokens[pos].value === '.') {
          pos++;
          if (pos < tokens.length && tokens[pos].type === 'id') {
            res = `${res}.${tokens[pos].value}`;
            pos++;
          }
        } else {
          break;
        }
      }

      if (pos < tokens.length && tokens[pos].type === 'transpose') {
        pos++;
        res = `transpose(${res})`;
      }
      return res;
    }

    pos++;
    return tok.value;
  }

  try {
    return parseExpression(0);
  } catch (_) {
    return expr;
  }
}

function parseAssignment(str) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth--;
    else if (ch === '=' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (str[i + 1] === '=') continue;
      if (i > 0 && ['<', '>', '~', '!'].includes(str[i - 1])) continue;
      if (str[i + 1] === '>') continue;
      const lhs = str.slice(0, i).trim();
      const rhs = str.slice(i + 1).trim();
      return { lhs, rhs };
    }
  }
  return null;
}

export function transpileMatlab(code) {
  const lines = code.split('\n');
  const resultLines = [];

  for (let line of lines) {
    if (!line.trim()) {
      resultLines.push('');
      continue;
    }

    let inSingle = false, inDouble = false, commentIdx = -1;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === '%' && !inSingle && !inDouble) {
        commentIdx = i;
        break;
      }
    }
    let comment = '';
    let codePart = line;
    if (commentIdx !== -1) {
      codePart = line.substring(0, commentIdx);
      comment = '//' + line.substring(commentIdx + 1);
    }
    let tCode = codePart.trim();
    if (!tCode) {
      resultLines.push(comment);
      continue;
    }

    // 1. Protect string literals with placeholders
    const strings = [];
    tCode = tCode.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, (match) => {
      const idx = strings.length;
      strings.push(match);
      return `__SWITCHA_STR_${idx}__`;
    });

    // Split multiple statements on the same line if separated by ';' outside of brackets
    const stmts = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    for (let i = 0; i < tCode.length; i++) {
      const ch = tCode[i];
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;
      else if (ch === '[') bracketDepth++;
      else if (ch === ']') bracketDepth--;
      else if (ch === ';' && parenDepth === 0 && bracketDepth === 0) {
        current += ';';
        stmts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) stmts.push(current.trim());

    const transpiledStmts = stmts.map(stmt => {
      let s = stmt.trim();
      if (!s) return '';

      // Command shortcuts (only when not followed by '(')
      s = s
        .replace(/\bfigure\b(?!\s*\()/g, 'figure()')
        .replace(/\bgrid\s+on\b/g, 'grid(true)')
        .replace(/\bgrid\s+off\b/g, 'grid(false)')
        .replace(/\bhold\s+on\b/g, 'hold(true)')
        .replace(/\bhold\s+off\b/g, 'hold(false)')
        .replace(/\bclose\s+all\b/g, 'clf()')
        .replace(/\bclc\b(?!\s*\()/g, 'clc()')
        .replace(/\bclear\b(?!\s*\()/g, 'clear()')
        .replace(/\bwho\b(?!\s*\()/g, 'who()')
        .replace(/\bwhos\b(?!\s*\()/g, 'whos()');

      // Matrix literal syntax: [1 2; 3 4] -> [[1, 2], [3, 4]]
      s = s.replace(/(?<![a-zA-Z0-9_\)\]])\[([^\]]+)\]/g, (match, inner) => {
        if (inner.includes(';')) {
          if (/^[\s\d\.\-eE,;]+$/.test(inner)) {
            const rows = inner.split(';').map(row => {
              const items = row.trim().split(/[\s,]+/).filter(Boolean);
              return '[' + items.join(', ') + ']';
            });
            return '[' + rows.join(', ') + ']';
          } else {
            const parts = inner.split(';').map(p => p.trim()).filter(Boolean);
            return 'vertcat(' + parts.join(', ') + ')';
          }
        } else {
          if (/^[\s\d\.\-eE,]+$/.test(inner)) {
            const items = inner.trim().split(/[\s,]+/).filter(Boolean);
            if (items.length > 1) {
              return '[' + items.join(', ') + ']';
            }
          }
          return match;
        }
      });

      // Strip variable declarations
      s = s.replace(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, '$2 =');

      const hasSemicolon = s.endsWith(';');
      const rawCode = hasSemicolon ? s.slice(0, -1).trim() : s;

      // 1. Control flow keywords
      const forMatch = rawCode.match(/^for\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/i);
      if (forMatch) {
        const loopVar = forMatch[1];
        const rangeExpr = transformMathExpr(forMatch[2]);
        return `for (${loopVar} of toIterable(${rangeExpr})) {`;
      }

      const whileMatch = rawCode.match(/^while\s+(.+)$/i);
      if (whileMatch) {
        const cond = transformMathExpr(whileMatch[1]);
        return `while (${cond}) {`;
      }

      const ifMatch = rawCode.match(/^if\s+(.+)$/i);
      if (ifMatch) {
        const cond = transformMathExpr(ifMatch[1]);
        return `if (${cond}) {`;
      }

      const elseifMatch = rawCode.match(/^(?:elseif|else\s+if)\s+(.+)$/i);
      if (elseifMatch) {
        const cond = transformMathExpr(elseifMatch[1]);
        return `} else if (${cond}) {`;
      }

      if (/^else$/i.test(rawCode)) {
        return `} else {`;
      }

      if (/^end$/i.test(rawCode)) {
        return `}`;
      }

      if (/^break$/i.test(rawCode)) {
        return `break;`;
      }

      if (/^continue$/i.test(rawCode)) {
        return `continue;`;
      }

      if (/^return$/i.test(rawCode)) {
        return `return;`;
      }

      // 2. Assignment detection
      const assign = parseAssignment(rawCode);
      if (assign) {
        const { lhs, rhs } = assign;
        const transformedRhs = transformMathExpr(rhs);

        // Indexed LHS: e.g. dm(i) = 1 or y(i) = ... or A(r, c) = ...
        const indexedMatch = lhs.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.+)\)$/);
        if (indexedMatch) {
          const varName = indexedMatch[1];
          const innerIndices = indexedMatch[2];
          const idxParts = [];
          let curIdx = '', pD = 0, bD = 0;
          for (let ci = 0; ci < innerIndices.length; ci++) {
            const ch = innerIndices[ci];
            if (ch === '(') pD++;
            else if (ch === ')') pD--;
            else if (ch === '[') bD++;
            else if (ch === ']') bD--;
            else if (ch === ',' && pD === 0 && bD === 0) {
              if (curIdx.trim()) idxParts.push(curIdx.trim());
              curIdx = '';
              continue;
            }
            curIdx += ch;
          }
          if (curIdx.trim()) idxParts.push(curIdx.trim());
          const transformedIndices = idxParts.map(idx => transformMathExpr(idx));

          if (hasSemicolon) {
            return `idx_set(${varName}, ${transformedRhs}, ${transformedIndices.join(', ')});`;
          } else {
            return `idx_set(${varName}, ${transformedRhs}, ${transformedIndices.join(', ')}); dispMatlab('${varName}', ${varName});`;
          }
        }

        // Destructuring assignment: [a, b] = ...
        if (lhs.startsWith('[')) {
          return `${lhs} = ${transformedRhs};`;
        }

        // Plain variable or property assignment
        if (hasSemicolon) {
          return `${lhs} = ${transformedRhs};`;
        } else {
          return `${lhs} = ${transformedRhs}; dispMatlab('${lhs}', ${lhs});`;
        }
      }

      // 3. Regular expression
      if (rawCode) {
        const transformedExpr = transformMathExpr(rawCode);
        if (hasSemicolon) {
          return `${transformedExpr};`;
        } else {
          return `ans = ${transformedExpr}; dispMatlab('ans', ans);`;
        }
      }
      return s;
    });

    let fullLine = transpiledStmts.filter(Boolean).join(' ');

    // 2. Restore string literals
    fullLine = fullLine.replace(/__SWITCHA_STR_(\d+)__/g, (_, idx) => strings[Number(idx)]);
    resultLines.push(fullLine + (comment ? ' ' + comment : ''));
  }

  return resultLines.join('\n');
}

// ==========================================
// CODE RUNTIME & SANDBOX EXECUTION ENGINE
// ==========================================
export class CodeEngine {
  constructor(plotter) {
    this.plotter = plotter;
    this.workspace = new Map();
    this.outputLogs = [];
    this.onLog = null;
    this.onVariablesUpdated = null;
    this.blocksEngine = null;
  }

  clear() {
    this.workspace.clear();
    this.outputLogs = [];
    if (this.onVariablesUpdated) this.onVariablesUpdated(this.getVariablesList());
    if (this.onLog) this.onLog({ type: 'info', text: '🧹 Workspace cleared.' });
  }

  log(text, type = 'stdout') {
    const entry = { type, text: String(text), timestamp: Date.now() };
    this.outputLogs.push(entry);
    if (this.onLog) this.onLog(entry);
  }

  formatOutput(name, val) {
    if (val === undefined || val === null) return `${name} = []`;
    if (typeof val === 'number') {
      return `${name} =\n    ${Number.isInteger(val) ? val : val.toFixed(4)}`;
    }
    if (typeof val === 'string') {
      return `${name} =\n    "${val}"`;
    }
    if (val instanceof TransferFunction) {
      return `${name} =\n${val.toString()}`;
    }
    if (val instanceof SwitchaMath.Complex) {
      return `${name} =\n    ${val.toString()}`;
    }
    if (Array.isArray(val) || val instanceof Float64Array) {
      if (Array.isArray(val[0]) || val[0] instanceof Float64Array) {
        const rows = val.map(r => '    ' + Array.from(r).map(v => (typeof v === 'number' ? (Number.isInteger(v) ? String(v).padStart(6) : v.toFixed(4).padStart(8)) : String(v))).join('  '));
        return `${name} =\n${rows.join('\n')}`;
      } else {
        if (val.length <= 15) {
          const items = Array.from(val).map(v => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(4)) : String(v))).join('    ');
          return `${name} =\n    ${items}`;
        } else {
          return `${name} = [1x${val.length} double vector: ${val[0].toFixed(2)}, ${val[1].toFixed(2)}, ... ${val[val.length - 1].toFixed(2)}]`;
        }
      }
    }
    if (typeof val === 'object') {
      return `${name} =\n` + JSON.stringify(val, null, 2).split('\n').map(l => '    ' + l).join('\n');
    }
    return `${name} = ${String(val)}`;
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
          type = 'double matrix';
          preview = `[${val.length}x${val[0].length} Double]`;
        } else {
          size = `1x${val.length}`;
          type = 'double array';
          preview = `[${Array.from(val.slice(0, 4)).map(n => (typeof n === 'number' ? n.toFixed(2) : String(n))).join(', ')}${val.length > 4 ? '...' : ''}]`;
        }
      } else if (val instanceof TransferFunction) {
        size = '1x1';
        type = 'tf model';
        preview = `G(s) = [${val.num}]/[${val.den}]`;
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
    const onPrint = opts.onPrint || ((msg) => this.log(msg, 'stdout'));
    const onError = opts.onError || ((err) => this.log(err, 'stderr'));

    try {
      const sandboxScope = {
        Math,
        pi: Math.PI,
        inf: Infinity,
        nan: NaN,
        i: new SwitchaMath.Complex(0, 1),
        j: new SwitchaMath.Complex(0, 1),
        sin: SwitchaMath.sin,
        cos: SwitchaMath.cos,
        tan: SwitchaMath.tan,
        exp: SwitchaMath.exp,
        log: SwitchaMath.log,
        log10: SwitchaMath.log10,
        sqrt: SwitchaMath.sqrt,
        abs: SwitchaMath.abs,

        add: SwitchaMath.add,
        sub: SwitchaMath.sub,
        mul: SwitchaMath.mul,
        mtimes: SwitchaMath.mul,
        matmul: SwitchaMath.matmul,
        div: SwitchaMath.div,
        elem_mul: SwitchaMath.elem_mul,
        elem_div: SwitchaMath.elem_div,
        elem_pow: SwitchaMath.elem_pow,
        matrix_power: SwitchaMath.matrix_power,

        zeros: SwitchaMath.zeros,
        ones: SwitchaMath.ones,
        eye: SwitchaMath.eye,
        rand: SwitchaMath.rand,
        randn: SwitchaMath.randn,
        randi: SwitchaMath.randi,
        linspace: SwitchaMath.linspace,
        logspace: SwitchaMath.logspace,
        colon: SwitchaMath.colon,
        size: SwitchaMath.size,
        length: SwitchaMath.length,
        numel: SwitchaMath.numel,
        reshape: SwitchaMath.reshape,
        repmat: SwitchaMath.repmat,
        diag: SwitchaMath.diag,
        tril: SwitchaMath.tril,
        triu: SwitchaMath.triu,
        flipud: SwitchaMath.flipud,
        fliplr: SwitchaMath.fliplr,
        rot90: SwitchaMath.rot90,

        dot: SwitchaMath.dot,
        cross: SwitchaMath.cross,
        kron: SwitchaMath.kron,
        matmul: SwitchaMath.matmul,
        transpose: SwitchaMath.transpose,
        linsolve: SwitchaMath.linsolve,
        inv: SwitchaMath.inv,
        det: SwitchaMath.det,
        rank: SwitchaMath.rank,
        cond: SwitchaMath.cond,
        norm: SwitchaMath.norm,
        trace: SwitchaMath.trace,
        chol: SwitchaMath.chol,
        qr: SwitchaMath.qr,
        svd: SwitchaMath.svd,
        pinv: SwitchaMath.pinv,
        eig: SwitchaMath.eig,

        sum: SwitchaMath.sum,
        mean: SwitchaMath.mean,
        std: SwitchaMath.std,
        var: SwitchaMath.var,
        min: SwitchaMath.min,
        max: SwitchaMath.max,
        sort: SwitchaMath.sort,

        poly: SwitchaMath.poly,
        roots: SwitchaMath.roots,
        polyval: SwitchaMath.polyval,
        polyfit: SwitchaMath.polyfit,
        polyder: SwitchaMath.polyder,
        polyint: SwitchaMath.polyint,

        diff: SwitchaMath.diff,
        trapz: SwitchaMath.trapz,
        cumsum: SwitchaMath.cumsum,
        cumtrapz: SwitchaMath.cumtrapz,
        quad: SwitchaMath.quad,
        fzero: SwitchaMath.fzero,
        fminsearch: SwitchaMath.fminsearch,
        ode45: SwitchaMath.ode45,

        fft: SwitchaMath.fft,
        ifft: SwitchaMath.ifft,
        fftshift: SwitchaMath.fftshift,
        ifftshift: SwitchaMath.ifftshift,
        nextpow2: SwitchaMath.nextpow2,
        conv: SwitchaMath.conv,
        filter: SwitchaMath.filter,
        filtfilt: SwitchaMath.filtfilt,
        freqz: SwitchaMath.freqz,
        hanning: SwitchaMath.hanning,
        hamming: SwitchaMath.hamming,
        blackman: SwitchaMath.blackman,
        rectwin: SwitchaMath.rectwin,
        butter: SwitchaMath.butter,
        chirp: SwitchaMath.chirp,
        square: SwitchaMath.square,
        sawtooth: SwitchaMath.sawtooth,
        findpeaks: SwitchaMath.findpeaks,
        xcorr: SwitchaMath.xcorr,

        tf: SwitchaMath.tf,
        step: (sys, t) => {
          const res = SwitchaMath.step(sys, t);
          if (plotter) {
            plotter.plot(res.t, res.y, { color: '#00ffcc', lineWidth: 2, label: 'Step Response' });
            plotter.title(`Step Response (Rise: ${res.metrics.RiseTime.toFixed(3)}s, Mp: ${res.metrics.Overshoot.toFixed(1)}%)`);
            plotter.xlabel('Time (seconds)');
            plotter.ylabel('Amplitude');
            plotter.grid(true);
          }
          return res;
        },
        impulse: (sys, t) => {
          const res = SwitchaMath.impulse(sys, t);
          if (plotter) {
            plotter.plot(res.t, res.y, { color: '#ff007f', lineWidth: 2, label: 'Impulse Response' });
            plotter.title('Impulse Response');
            plotter.xlabel('Time (seconds)');
            plotter.ylabel('Amplitude');
            plotter.grid(true);
          }
          return res;
        },
        bode: (sys, w) => {
          const res = SwitchaMath.bode(sys, w);
          if (plotter) {
            plotter.subplot(2, 1, 1);
            plotter.semilogx(res.w, res.magDb, { color: '#38bdf8', lineWidth: 2 });
            plotter.title('Bode Diagram');
            plotter.ylabel('Magnitude (dB)');
            plotter.grid(true);
            plotter.subplot(2, 1, 2);
            plotter.semilogx(res.w, res.phaseDeg, { color: '#facc15', lineWidth: 2 });
            plotter.xlabel('Frequency (rad/s)');
            plotter.ylabel('Phase (deg)');
            plotter.grid(true);
          }
          return res;
        },
        margin: SwitchaMath.margin,
        nyquist: SwitchaMath.nyquist,
        feedback: SwitchaMath.feedback,
        series: SwitchaMath.series,
        parallel: SwitchaMath.parallel,
        pzmap: SwitchaMath.pzmap,
        damp: SwitchaMath.damp,

        awgn: SwitchaMath.awgn,
        biterr: SwitchaMath.biterr,
        Complex: SwitchaMath.Complex,
        vertcat: SwitchaMath.vertcat,
        horzcat: SwitchaMath.horzcat,

        toIterable: SwitchaMath.toIterable,
        idx_set: (target, value, ...indices) => {
          if (!target) return value;
          if (indices.length === 1) {
            const idx = indices[0];
            if (typeof idx === 'number') {
              const k = Math.round(idx) - 1;
              if (k >= 0) target[k] = value;
              return target;
            }
            if (Array.isArray(idx) || idx instanceof Float64Array) {
              if (Array.isArray(value) || value instanceof Float64Array) {
                for (let i = 0; i < idx.length; i++) {
                  const k = Math.round(idx[i]) - 1;
                  if (k >= 0) target[k] = value[i];
                }
              } else {
                for (let i = 0; i < idx.length; i++) {
                  const k = Math.round(idx[i]) - 1;
                  if (k >= 0) target[k] = value;
                }
              }
              return target;
            }
          } else if (indices.length === 2) {
            const r = Math.round(indices[0]) - 1;
            const c = Math.round(indices[1]) - 1;
            if (Array.isArray(target[0]) || target[0] instanceof Float64Array) {
              if (target[r]) target[r][c] = value;
            } else {
              if (r === 0 && target[c] !== undefined) target[c] = value;
              else if (c === 0 && target[r] !== undefined) target[r] = value;
              else target[r] = value;
            }
            return target;
          }
          return target;
        },

        idx_or_call: (target, ...args) => {
          if (typeof target === 'function') {
            return target(...args);
          }
          if (Array.isArray(target) || target instanceof Float64Array) {
            if (args.length === 1) {
              const idx = args[0];
              if (Array.isArray(idx) || idx instanceof Float64Array) {
                const sub = new Float64Array(idx.length);
                for (let i = 0; i < idx.length; i++) {
                  const k = Math.round(idx[i]) - 1;
                  sub[i] = target[k] ?? 0;
                }
                return sub;
              } else if (typeof idx === 'number') {
                return target[Math.round(idx) - 1];
              }
            } else if (args.length === 2) {
              const r = Math.round(args[0]) - 1;
              const c = Math.round(args[1]) - 1;
              if (Array.isArray(target[0]) || target[0] instanceof Float64Array) {
                return target[r]?.[c];
              }
            }
          }
          return target;
        },

        prop_call: (obj, prop, ...args) => {
          if (!obj) return undefined;
          const target = obj[prop];
          if (typeof target === 'function') {
            return target.apply(obj, args);
          }
          if (Array.isArray(target) || target instanceof Float64Array) {
            if (args.length === 1) {
              const idx = args[0];
              if (Array.isArray(idx) || idx instanceof Float64Array) {
                const sub = new Float64Array(idx.length);
                for (let i = 0; i < idx.length; i++) {
                  const k = Math.round(idx[i]) - 1;
                  sub[i] = target[k] ?? 0;
                }
                return sub;
              } else if (typeof idx === 'number') {
                return target[Math.round(idx) - 1];
              }
            } else if (args.length === 2) {
              const r = Math.round(args[0]) - 1;
              const c = Math.round(args[1]) - 1;
              if (Array.isArray(target[0]) || target[0] instanceof Float64Array) {
                return target[r]?.[c];
              }
            }
          }
          return target;
        },

        sim: (modelName, simOpts = {}) => {
          let be = (typeof window !== 'undefined' && window.SwitchaApp?.blocksEngine) || new BlockEngine();
          if (BlockLibrary && (BlockLibrary[modelName] || typeof BlockLibrary.loadModel === 'function')) {
            const canvas = {
              blocks: [],
              wires: [],
              addBlock(type, x, y, params) {
                const b = { id: `b_${this.blocks.length + 1}`, type, params: params || {} };
                this.blocks.push(b);
                return b;
              }
            };
            BlockLibrary.loadModel(modelName, canvas);
            if (canvas.blocks.length > 0) {
              be.setModel(canvas.blocks, canvas.wires);
            }
          }
          be.reset();
          const stop = typeof simOpts === 'number' ? simOpts : (simOpts.stopTime || 5.0);
          const dt = (typeof simOpts === 'object' && simOpts.timeStep) ? simOpts.timeStep : 0.001;
          const steps = Math.round(stop / dt);
          for (let i = 0; i < steps; i++) be.step(dt);
          const res = { tout: be.history.map(h => h.time), signals: be.sampleSignals(), history: be.history };
          onPrint(`🚀 Simulink Model "${modelName}" simulated successfully (${steps} steps)`);
          return res;
        },

        disp: (msg) => onPrint(typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)),
        print: (msg) => onPrint(typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)),
        dispMatlab: (name, val) => {
          if (val !== undefined) {
            const formatted = this.formatOutput(name, val);
            if (formatted) onPrint(formatted);
          }
        },
        clc: () => {
          this.outputLogs = [];
          if (this.onLog) this.onLog({ type: 'clear' });
        },
        clear: () => this.clear(),
        who: () => onPrint('Your variables are:\n\n' + Array.from(this.workspace.keys()).join('  ')),
        whos: () => {
          const list = this.getVariablesList();
          let table = '  Name      Size         Bytes       Class\n  ====      ====         =====       =====\n';
          list.forEach(v => {
            table += `  ${v.name.padEnd(8)}  ${v.size.padEnd(11)}  ${String(v.preview.length * 8).padEnd(10)}  ${v.type}\n`;
          });
          onPrint(table);
        },

        plot: (...args) => plotter?.plot(...args),
        subplot: (...args) => plotter?.subplot(...args),
        stem: (...args) => plotter?.stem(...args),
        scatter: (...args) => plotter?.scatter(...args),
        bar: (...args) => plotter?.bar(...args),
        stairs: (...args) => plotter?.stairs(...args),
        semilogx: (...args) => plotter?.semilogx(...args),
        semilogy: (...args) => plotter?.semilogy(...args),
        loglog: (...args) => plotter?.loglog(...args),
        polarplot: (...args) => plotter?.polarplot(...args),
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
        figure: (...args) => plotter?.figure ? plotter.figure(...args) : plotter?.clf(),

        ...Object.fromEntries(this.workspace)
      };

      const scopeProxy = new Proxy(sandboxScope, {
        set: (target, prop, value) => {
          target[prop] = value;
          this.workspace.set(prop, value);
          if (this.onVariablesUpdated) this.onVariablesUpdated(this.getVariablesList());
          return true;
        },
        get: (target, prop) => {
          if (prop in target) return target[prop];
          return undefined;
        },
        has: () => true
      });

      const transformedCode = transpileMatlab(sourceCode);

      const fn = new Function('scope', `with(scope) { return (function() { ${transformedCode} })(); }`);
      const result = fn(scopeProxy);

      if (this.onVariablesUpdated) this.onVariablesUpdated(this.getVariablesList());
      return { result, error: null, success: true };
    } catch (err) {
      onError(err.message);
      return { result: null, error: err.message, success: false };
    }
  }

  transpile(sourceCode) {
    return transpileMatlab(sourceCode);
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
  window.TransferFunction = TransferFunction;
}

export { SwitchaCodeEngine };
