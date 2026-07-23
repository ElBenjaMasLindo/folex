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

export class MotePool {
  private readonly slots: Mote[];
  private active = 0;
  private cap: number;

  constructor(cap: number) {
    this.cap = Math.max(0, Math.floor(cap));
    this.slots = new Array<Mote>(this.cap);
    for (let i = 0; i < this.cap; i++) this.slots[i] = { ...ZERO };
  }

  get activeCount(): number {
    return this.active;
  }

  get currentCap(): number {
    return this.cap;
  }

  setCap(newCap: number): void {
    const next = Math.max(0, Math.floor(newCap));
    if (next < this.cap) this.cap = next;
  }

  spawn(init: Partial<Mote>): boolean {
    if (this.active >= this.cap) return false;
    const m = this.slots[this.active];
    Object.assign(m, ZERO, init);
    this.active += 1;
    return true;
  }

  step(dt: number, t: number): void {
    let i = 0;
    while (i < this.active) {
      const m = this.slots[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.x += Math.sin(t * m.driftFreq) * m.driftAmp * dt;
      m.y += Math.cos(t * m.driftFreq) * m.driftAmp * dt;
      m.life -= dt;
      m.phase += dt;
      m.rotation += m.angularVelocity * dt;
      if (m.life <= 0) {
        const last = this.slots[this.active - 1];
        this.slots[i] = last;
        this.slots[this.active - 1] = m;
        this.active -= 1;
        continue;
      }
      i += 1;
    }
  }

  forEachActive(fn: (m: Mote) => void): void {
    for (let i = 0; i < this.active; i++) fn(this.slots[i]);
  }
}
