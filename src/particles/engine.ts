import type { ResolvedVars } from "../core/derive";
import { Option } from "../core/functional";
import { detectInitialTier, recordFrameTime, TIER_CAPS, type Tier } from "../core/quality";
import { BEHAVIORS } from "./behaviors";
import { type BoundsLevel, type Mote, type MoteKind, type MotePool, createMotePool, motePoolActiveCount, motePoolForEachActive, motePoolSetCap, motePoolSpawn, motePoolStep } from "./pool";
import { buildSprite } from "./sprite";


const MAX_DT = 50;
const MIN_SIZE = 8;
const PRELOAD_MARGIN_FALLBACK = 200;
const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function parseMargin(raw: string): number {
  const m = /^(\d+(?:\.\d+)?)(?:px)?$/i.exec(raw.trim());
  return m ? Number.parseFloat(m[1]) : PRELOAD_MARGIN_FALLBACK;
}

export function readPreloadMargin(): number {
  if (typeof getComputedStyle === "undefined" || !document?.documentElement) return PRELOAD_MARGIN_FALLBACK;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--fx-pixie-preload");
  const n = parseMargin(raw);
  return Number.isFinite(n) && n >= 0 ? n : PRELOAD_MARGIN_FALLBACK;
}





type BoundsFade = { fadeStart: number; fadeEnd: number };

const BOUNDS_FADE: Record<BoundsLevel, BoundsFade> = {
  loose: { fadeStart: 225, fadeEnd: 563 },
  normal: { fadeStart: 113, fadeEnd: 281 },
  tight: { fadeStart: 34, fadeEnd: 90 },
  strict: { fadeStart: 0, fadeEnd: 0 },
};

function distToRect(px: number, py: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - px, 0, px - rect.right);
  const dy = Math.max(rect.top - py, 0, py - rect.bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

type Zone = {
  vars: ResolvedVars;
  rect: DOMRect;
  intersecting: boolean;
  wasIntersecting: boolean;
  momentum: number;
};


const zones = new Map<HTMLElement, Zone>();
const colorIndex = new Map<string, number>();
const colors: string[] = [];
let ioOpt: Option<IntersectionObserver> = Option.none();
let canvasOpt: Option<HTMLCanvasElement> = Option.none();
let ctxOpt: Option<CanvasRenderingContext2D> = Option.none();
let poolOpt: Option<MotePool> = Option.none();
let currentTier: Tier = detectInitialTier();
let rafId = 0;
let lastTimestamp = 0;
const visibleRects: DOMRect[] = [];

function resizeCanvas(): void {
  if (!canvasOpt.some) return;
  const canvas = canvasOpt.value;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  if (ctxOpt.some) ctxOpt.value.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createCanvasElement(): void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("data-folex-canvas", "");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:lighter;z-index:var(--fx-canvas-z,-1)";
  document.body.appendChild(canvas);
  canvasOpt = Option.some(canvas);
  ctxOpt = Option.fromNullable(canvas.getContext("2d"));
  resizeCanvas();
  window.addEventListener("resize", () => resizeCanvas(), { passive: true });
}

function unregisterZone(host: HTMLElement): void {
  zones.delete(host);
  if (ioOpt.some) ioOpt.value.unobserve(host);
}

function hasAnyIntersectingZone(): boolean {
  for (const z of zones.values()) if (z.intersecting) return true;
  return false;
}

function shouldStartLoop(active: boolean): boolean {
  return active && !rafId;
}

function shouldStopLoop(active: boolean, hasMotes: boolean): boolean {
  return !active && Boolean(rafId) && !hasMotes;
}

function syncEngineLoop(): void {
  const active = hasAnyIntersectingZone();
  const hasMotes = poolOpt.some && motePoolActiveCount(poolOpt.value) > 0;
  if (shouldStartLoop(active)) {
    lastTimestamp = 0;
    rafId = requestAnimationFrame(engineFrame);
  } else if (shouldStopLoop(active, hasMotes)) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function getOrAddColorIndex(color: string): number {
  const existing = colorIndex.get(color);
  if (typeof existing === "number") return existing;
  const idx = colors.length;
  colors.push(color);
  colorIndex.set(color, idx);
  return idx;
}

function getBoundsAlpha(minDist: number, bounds: BoundsLevel, m: Mote): number {
  if (bounds === "strict") {
    if (minDist > 0) m.life = 0;
    return 1;
  }
  const cfg = BOUNDS_FADE[bounds];
  if (minDist >= cfg.fadeEnd) {
    m.life = 0;
    return 0;
  }
  return minDist > cfg.fadeStart ? 1 - (minDist - cfg.fadeStart) / (cfg.fadeEnd - cfg.fadeStart) : 1;
}

function computeMoteVel(rect: DOMRect, speed: number) {
  const px = rect.left + Math.random() * rect.width;
  const py = rect.top + Math.random() * rect.height;
  const dx = px - (rect.left + rect.width / 2);
  const dy = py - (rect.top + rect.height / 2);
  const angle = Math.sqrt(dx * dx + dy * dy) < 0.001 || Math.random() < 0.25
    ? Math.random() * Math.PI * 2
    : Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.7;
  return { px, py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

function spawnMote(vars: ResolvedVars, rect: DOMRect, initialLifeFrac?: number): void {
  if (!poolOpt.some) return;
  const size = Math.max(MIN_SIZE, Math.round(8 * vars.pixieScale));
  const life = 1.5 + Math.random() * 2.0;
  const { px, py, vx, vy } = computeMoteVel(rect, (6 + Math.random() * 12) * vars.speed);

  const idx = getOrAddColorIndex(vars.color);
  const r0 = Math.random();
  const kind: MoteKind = r0 < 0.4 ? 0 : r0 < 0.85 ? 1 : 2;
  const behavior = BEHAVIORS[kind];
  motePoolSpawn(poolOpt.value, {
    x: px, y: py, vx, vy, r: kind === 2 ? size * 2 : size,
    life: initialLifeFrac !== undefined ? life * (1 - initialLifeFrac) : life,
    maxLife: life, phase: Math.random() * Math.PI * 2,
    driftAmp: 4 + Math.random() * 8, driftFreq: 0.5 + Math.random() * 1.5,
    hue: idx, bounds: vars.pixieBounds, kind, rotation: Math.random() * Math.PI * 2,
    angularVelocity: behavior.spin(Math.random()),
  });
}

function entryBurst(zone: Zone): void {
  const burstCount = Math.floor(TIER_CAPS[currentTier].emission * zone.vars.pixieDensity * 2.5 * 0.85);
  for (let i = 0; i < burstCount; i++) spawnMote(zone.vars, zone.rect, 0.7 + Math.random() * 0.25);
}

function calcMinRectDist(m: Mote, rects: DOMRect[]): number {
  let min = Infinity;
  for (const r of rects) {
    const d = distToRect(m.x, m.y, r);
    if (d < min) min = d;
  }
  return min;
}

function drawMote(ctx: CanvasRenderingContext2D, m: Mote, rects: DOMRect[]): void {
  const color = colors[m.hue] ?? "#ffb37c";
  const sprite = buildSprite(color, m.r);
  const behavior = BEHAVIORS[m.kind];
  const lifeFrac = m.maxLife > 0 ? m.life / m.maxLife : 0;
  const fade = behavior.fade(lifeFrac, Math.min(1, (1 - lifeFrac) * 4));
  const twinkle = 0.5 + 0.5 * Math.sin(m.phase * 3);

  const boundsAlpha = rects.length > 0 ? getBoundsAlpha(calcMinRectDist(m, rects), m.bounds, m) : 1;
  if (m.life <= 0) return;

  const size = m.r * behavior.scale(lifeFrac);
  ctx.globalAlpha = Math.max(0, fade * twinkle * boundsAlpha);
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.rotation);
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function updateZoneMomentum(zone: Zone, delta: { left: number; top: number }, justEntered: boolean): { moveBoost: number; ageOffset?: number } {
  if (justEntered) {
    zone.momentum = 0;
    return { moveBoost: 1 };
  }
  zone.momentum = Math.max(zone.momentum * 0.8, Math.hypot(delta.left, delta.top));
  return {
    moveBoost: 1 + zone.momentum / 15,
    ageOffset: zone.momentum > 2 ? Math.min(0.25, zone.momentum / 60) : undefined,
  };
}

function calculateInView(rect: DOMRect): boolean {
  return rect.top < window.innerHeight && rect.bottom > 0 &&
    rect.left < window.innerWidth && rect.right > 0;
}

function updateZoneAndSpawn(host: HTMLElement, zone: Zone, dt: number): void {
  const delta = { left: zone.rect.left, top: zone.rect.top };
  zone.rect = host.getBoundingClientRect();
  const inView = calculateInView(zone.rect);
  const justEntered = inView && !zone.wasIntersecting;
  if (justEntered) entryBurst(zone);
  zone.wasIntersecting = inView;
  if (!inView) return;

  const { moveBoost, ageOffset } = updateZoneMomentum(zone, { left: zone.rect.left - delta.left, top: zone.rect.top - delta.top }, justEntered);
  const want = TIER_CAPS[currentTier].emission * zone.vars.pixieDensity * dt * moveBoost;
  let n = Math.floor(want);
  if (Math.random() < want - n) n += 1;
  for (let i = 0; i < n; i++) spawnMote(zone.vars, zone.rect, ageOffset);
}

function renderFrameZones(ctx: CanvasRenderingContext2D, dt: number): void {
  const c = canvasOpt;
  if (c.some) ctx.clearRect(0, 0, c.value.width, c.value.height);
  ctx.globalCompositeOperation = "lighter";
  for (const [host, zone] of zones) {
    if (!host.isConnected) { unregisterZone(host); continue; }
    updateZoneAndSpawn(host, zone, dt);
  }
}

function processFrameStep(dt: number, t: number): void {
  const cOpt = ctxOpt;
  const pOpt = poolOpt;
  if (cOpt.some && pOpt.some) {
    renderFrameZones(cOpt.value, dt);
    motePoolStep(pOpt.value, dt, t / 1000);
  }
}

function renderActiveMotes(ctx: CanvasRenderingContext2D): void {
  const pOpt = poolOpt;
  if (!pOpt.some) return;
  visibleRects.length = 0;
  for (const [, z] of zones) if (z.intersecting) visibleRects.push(z.rect);
  motePoolForEachActive(pOpt.value, (m) => drawMote(ctx, m, visibleRects));
}

function engineFrameBody(dt: number, t: number): void {
  processFrameStep(dt, t);
  const pOpt = poolOpt;
  const cOpt = ctxOpt;
  if (!pOpt.some || motePoolActiveCount(pOpt.value) === 0) {
    syncEngineLoop();
  } else if (cOpt.some) {
    renderActiveMotes(cOpt.value);
    recordFrameTime(dt * 1000, currentTier, (next) => {
      currentTier = next;
      const p = poolOpt;
      if (p.some) motePoolSetCap(p.value, TIER_CAPS[next].pool);
    });
  }
}



function engineFrame(t: number): void {
  rafId = requestAnimationFrame(engineFrame);
  if (document.hidden || !canvasOpt.some || !ctxOpt.some || !poolOpt.some) return;
  const dt = lastTimestamp ? Math.min(MAX_DT, (t - lastTimestamp) / 1000) : 0;
  lastTimestamp = t;
  engineFrameBody(dt, t);
}





function ensureIntersectionObserver(): void {
  if (ioOpt.some) return;
  const margin = readPreloadMargin();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const z = zones.get(e.target as HTMLElement);
      if (z) z.intersecting = e.isIntersecting;
    }
    syncEngineLoop();
  }, { rootMargin: `${margin}px 0px` });
  ioOpt = Option.some(io);
}


export const particleEngine = {
  registerZone(host: HTMLElement, vars: ResolvedVars): void {
    if (reducedMotion || zones.has(host)) return;
    ensureIntersectionObserver();
    zones.set(host, { vars, rect: host.getBoundingClientRect(), intersecting: false, wasIntersecting: false, momentum: 0 });
    if (ioOpt.some) ioOpt.value.observe(host);
    if (!canvasOpt.some) createCanvasElement();
    if (!poolOpt.some) poolOpt = Option.some(createMotePool(TIER_CAPS[currentTier].pool));
  },
};


