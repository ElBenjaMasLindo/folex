export type Validator<T> = (raw: string | null, fallback: T) => T;

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function numberInRange(min: number, max: number): Validator<number> {
  return (raw, fallback) => {
    if (raw == null) return fallback;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    return clamp(n, min, max);
  };
}

export function enumMatch<T extends string>(allowed: readonly T[]): Validator<T> {
  return (raw, fallback) => {
    if (raw == null) return fallback;
    const value = raw.trim();
    return allowed.includes(value as T) ? (value as T) : fallback;
  };
}

export const safeColor: Validator<string> = (raw, fallback) => {
  if (raw == null) return fallback;
  const value = raw.trim();
  if (value.length === 0) return fallback;
  const supports = typeof CSS !== "undefined" && typeof CSS.supports === "function";
  if (!supports) return value;
  try {
    return CSS.supports("color", value) ? value : fallback;
  } catch {
    return fallback;
  }
};
