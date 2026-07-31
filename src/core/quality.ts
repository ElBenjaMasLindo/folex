export type Tier = "eco" | "balanced" | "cinematic";

export const TIER_CAPS: Record<Tier, { pool: number; emission: number }> = {
  eco: { pool: 400, emission: 20 },
  balanced: { pool: 1200, emission: 60 },
  cinematic: { pool: 3000, emission: 140 },
};

const WINDOW = 30;
const BUDGET_MS = 20;
const ORDER: Tier[] = ["cinematic", "balanced", "eco"];

function getHardwareMetric(): number {
  if (typeof navigator === "undefined") return 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
  return Math.min(cores, mem);
}

export function detectInitialTier(explicit?: Tier): Tier {
  if (explicit && ORDER.includes(explicit)) return explicit;
  return getHardwareMetric() <= 4 ? "eco" : "balanced";
}

let downgraded = false;
let buffer: number[] = [];
let slowWindows = 0;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function updateSlowWindows(med: number): void {
  slowWindows = med > BUDGET_MS ? slowWindows + 1 : 0;
}

export function recordFrameTime(
  dt: number,
  current: Tier,
  onDowngrade: (next: Tier) => void,
): void {
  if (downgraded) return;
  buffer.push(dt);
  if (buffer.length < WINDOW) return;

  const med = median(buffer);
  buffer = [];
  updateSlowWindows(med);

  if (slowWindows >= 2) {
    downgraded = true;
    const idx = ORDER.indexOf(current);
    if (idx >= 0 && idx < ORDER.length - 1) onDowngrade(ORDER[idx + 1] as Tier);
  }
}


export function __resetQualityForTests(): void {
  downgraded = false;
  buffer = [];
  slowWindows = 0;
}
