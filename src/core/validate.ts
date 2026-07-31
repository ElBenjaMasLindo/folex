import { Option } from "./functional";

export type RawInput = string | Option<string>;

export type Validator<T> = (raw: RawInput | unknown, fallback: T) => T;

function toOpt(raw: RawInput | unknown): Option<string> {
  if (typeof raw === "undefined" || raw === null) return Option.none();
  if (typeof raw === "string") return Option.fromNullable(raw);
  return raw as Option<string>;
}



function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function numberInRange(min: number, max: number): Validator<number> {
  return (raw, fallback) => {
    const rawOpt = toOpt(raw);
    if (!rawOpt.some) return fallback;
    const n = Number.parseFloat(rawOpt.value);
    return Number.isFinite(n) ? clamp(n, min, max) : fallback;
  };
}

export function enumMatch<T extends string>(allowed: readonly T[]): Validator<T> {
  return (raw, fallback) => {
    const rawOpt = toOpt(raw);
    if (!rawOpt.some) return fallback;
    const value = rawOpt.value.trim();
    return allowed.includes(value as T) ? (value as T) : fallback;
  };
}

function checkCssSupport(val: string): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return true;
  try {
    return CSS.supports("color", val);
  } catch {
    return false;
  }
}

export const safeColor: Validator<string> = (raw, fallback) => {
  const rawOpt = toOpt(raw);
  if (!rawOpt.some) return fallback;
  const value = rawOpt.value.trim();
  if (value.length === 0) return fallback;
  return checkCssSupport(value) ? value : fallback;
};


