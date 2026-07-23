export type Tier = "eco" | "balanced" | "cinematic";

export const TIER_CAPS: Record<Tier, { pool: number; emission: number }> = {
  eco: { pool: 400, emission: 20 },
  balanced: { pool: 1200, emission: 60 },
  cinematic: { pool: 3000, emission: 140 },
};

const WINDOW = 30;
const BUDGET_MS = 20;
const ORDER: Tier[] = ["cinematic", "balanced", "eco"];

export function detectInitialTier(explicit?: Tier): Tier {
  if (explicit && ORDER.includes(explicit)) return explicit;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const cores = nav?.hardwareConcurrency;
  const mem = (nav as { deviceMemory?: number } | undefined)?.deviceMemory;
  if (typeof cores === "number" && cores <= 4) return "eco";
  if (typeof mem === "number" && mem <= 4) return "eco";
  return "balanced";
}

let downgraded = false;
let buffer: number[] = [];
let slowWindows = 0;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
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
  if (med > BUDGET_MS) {
    slowWindows += 1;
  } else {
    slowWindows = 0;
  }

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
