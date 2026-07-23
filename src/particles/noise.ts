function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tile(v: number, n: number): number {
  return ((v % n) + n) % n;
}

function bilinear(grid: Float32Array, dim: number, fx: number, fy: number): number {
  const x = tile(fx, dim);
  const y = tile(fy, dim);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = (x0 + 1) % dim;
  const y1 = (y0 + 1) % dim;
  const tx = x - x0;
  const ty = y - y0;
  const v00 = grid[y0 * dim + x0];
  const v10 = grid[y0 * dim + x1];
  const v01 = grid[y1 * dim + x0];
  const v11 = grid[y1 * dim + x1];
  const top = v00 + (v10 - v00) * tx;
  const bot = v01 + (v11 - v01) * tx;
  return top + (bot - top) * ty;
}

export function valueNoiseTexture(size: number, seed: number, octaves = 2): ImageData {
  const o = Math.max(1, Math.min(3, Math.floor(octaves)));
  const data = new Uint8ClampedArray(size * size * 4);
  let totalAmp = 0;
  const grids: Float32Array[] = [];
  const amps: number[] = [];
  for (let i = 0; i < o; i++) {
    const dim = 8 << i;
    const grid = new Float32Array(dim * dim);
    const rng = mulberry32(seed + 0x9e3779b1 * (i + 1));
    for (let k = 0; k < grid.length; k++) grid[k] = rng();
    grids.push(grid);
    const amp = 1 / (1 << i);
    amps.push(amp);
    totalAmp += amp;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let i = 0; i < o; i++) {
        const dim = 8 << i;
        const fx = (x / size) * dim;
        const fy = (y / size) * dim;
        acc += bilinear(grids[i], dim, fx, fy) * amps[i];
      }
      const v = acc / totalAmp;
      const b = (v * 255) | 0;
      const idx = (y * size + x) * 4;
      data[idx] = b;
      data[idx + 1] = b;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return new ImageData(data, size, size);
}

export function cellularNoiseTexture(size: number, seed: number, density: number): ImageData {
  const k = Math.max(2, Math.min(24, Math.round(6 + density * 6)));
  const rng = mulberry32(seed);
  const px = new Float32Array(k);
  const py = new Float32Array(k);
  for (let i = 0; i < k; i++) {
    px[i] = rng() * size;
    py[i] = rng() * size;
  }
  const mins = new Float32Array(size * size);
  let maxMin = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let min = Infinity;
      for (let i = 0; i < k; i++) {
        let dx = Math.abs(x - px[i]);
        let dy = Math.abs(y - py[i]);
        dx = Math.min(dx, size - dx);
        dy = Math.min(dy, size - dy);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < min) min = d;
      }
      mins[y * size + x] = min;
      if (min > maxMin) maxMin = min;
    }
  }
  const inv = maxMin > 0 ? 1 / maxMin : 1;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const norm = (1 - mins[y * size + x] * inv) ** 0.75;
      const b = (norm * 255) | 0;
      const idx = (y * size + x) * 4;
      data[idx] = b;
      data[idx + 1] = b;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return new ImageData(data, size, size);
}
