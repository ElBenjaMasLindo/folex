export type BoundsLevel = "loose" | "normal" | "tight" | "strict";
export type MoteKind = 0 | 1 | 2;

export interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  phase: number;
  driftAmp: number;
  driftFreq: number;
  hue: number;
  bounds: BoundsLevel;
  kind: MoteKind;
  rotation: number;
  angularVelocity: number;
}

const ZERO: Mote = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 0,
  life: 0,
  maxLife: 0,
  phase: 0,
  driftAmp: 0,
  driftFreq: 0,
  hue: 0,
  bounds: "normal",
  kind: 1,
  rotation: 0,
  angularVelocity: 0,
};

export interface MotePool {
  slots: Mote[];
  active: number;
  cap: number;
}



export function createMotePool(cap: number): MotePool {
  const c = Math.max(0, Math.floor(cap));
  const slots = new Array<Mote>(c);
  for (let i = 0; i < c; i++) slots[i] = { ...ZERO };
  return { slots, active: 0, cap: c };
}

export function motePoolActiveCount(pool: MotePool): number {
  return pool.active;
}

export function motePoolCurrentCap(pool: MotePool): number {
  return pool.cap;
}

export function motePoolSetCap(pool: MotePool, newCap: number): void {
  const next = Math.max(0, Math.floor(newCap));
  if (next < pool.cap) pool.cap = next;
}

export function motePoolSpawn(pool: MotePool, init: Partial<Mote>): boolean {
  if (pool.active >= pool.cap) return false;
  const m = pool.slots[pool.active];
  Object.assign(m, ZERO, init);
  pool.active += 1;
  return true;
}

export function motePoolStep(pool: MotePool, dt: number, t: number): void {
  let i = 0;
  while (i < pool.active) {
    const m = pool.slots[i];
    m.x += (m.vx + Math.sin(t * m.driftFreq) * m.driftAmp) * dt;
    m.y += (m.vy + Math.cos(t * m.driftFreq) * m.driftAmp) * dt;
    m.life -= dt;
    m.phase += dt;
    m.rotation += m.angularVelocity * dt;
    if (m.life <= 0) {
      pool.slots[i] = pool.slots[pool.active - 1];
      pool.slots[pool.active - 1] = m;
      pool.active -= 1;
      continue;
    }
    i += 1;
  }
}

export function motePoolForEachActive(pool: MotePool, fn: (m: Mote) => void): void {
  for (let i = 0; i < pool.active; i++) fn(pool.slots[i]);
}


