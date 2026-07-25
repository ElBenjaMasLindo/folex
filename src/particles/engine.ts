import type { ResolvedVars } from "../core/derive";
import { detectInitialTier, recordFrameTime, TIER_CAPS, type Tier } from "../core/quality";
import { BEHAVIORS } from "./behaviors";
import { type BoundsLevel, type Mote, type MoteKind, MotePool } from "./pool";
import { buildSprite } from "./sprite";

const MAX_DT = 50;
const MIN_SIZE = 8;
const PRELOAD_MARGIN_FALLBACK = 200;
const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function readPreloadMargin(): number {
  if (typeof getComputedStyle === "undefined") return PRELOAD_MARGIN_FALLBACK;
  const root = document?.documentElement;
  if (!root) return PRELOAD_MARGIN_FALLBACK;
  const raw = getComputedStyle(root).getPropertyValue("--fx-pixie-preload").trim();
  if (!raw) return PRELOAD_MARGIN_FALLBACK;
  const m = /^(\d+(?:\.\d+)?)(?:px)?$/i.exec(raw);
  if (!m) return PRELOAD_MARGIN_FALLBACK;
  const n = Number.parseFloat(m[1]);
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

class ParticleEngine {
  private zones = new Map<HTMLElement, Zone>();
  private colorIndex = new Map<string, number>();
  private colors: string[] = [];
  private io: IntersectionObserver | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private pool: MotePool | null = null;
  private tier: Tier = detectInitialTier();
  private raf = 0;
  private lastT = 0;
  private visibleRects: DOMRect[] = [];

  registerZone(host: HTMLElement, vars: ResolvedVars): void {
    if (reducedMotion) return;
    if (this.zones.has(host)) return;
    if (!this.io) {
      const margin = readPreloadMargin();
      this.io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const z = this.zones.get(e.target as HTMLElement);
            if (z) z.intersecting = e.isIntersecting;
          }
          this.syncLoop();
        },
        { rootMargin: `${margin}px 0px` },
      );
    }
    this.zones.set(host, {
      vars,
      rect: host.getBoundingClientRect(),
      intersecting: false,
      wasIntersecting: false,
      momentum: 0,
    });
    this.io.observe(host);
    if (!this.canvas) this.createCanvas();
    if (!this.pool) this.pool = new MotePool(TIER_CAPS[this.tier].pool);
  }

  private createCanvas(): void {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("data-folex-canvas", "");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:lighter;z-index:var(--fx-canvas-z,-1)";
    document.body.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize(), { passive: true });
  }

  private resize(): void {
    if (!this.canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private syncLoop(): void {
    let any = false;
    for (const z of this.zones.values()) if (z.intersecting) any = true;
    const hasLiveMotes = !!this.pool && this.pool.activeCount > 0;
    if (any && !this.raf) {
      this.lastT = 0;
      this.raf = requestAnimationFrame(this.frame);
    } else if (!any && this.raf && !hasLiveMotes) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private frame = (t: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) return;
    const dt = this.lastT ? Math.min(MAX_DT, (t - this.lastT) / 1000) : 0;
    this.lastT = t;
    if (!this.pool || !this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = "lighter";

    for (const [host, zone] of this.zones) {
      if (!host.isConnected) {
        this.unregister(host);
        continue;
      }
      const prevTop = zone.rect.top;
      const prevLeft = zone.rect.left;
      zone.rect = host.getBoundingClientRect();

      const inView =
        zone.rect.top < window.innerHeight &&
        zone.rect.bottom > 0 &&
        zone.rect.left < window.innerWidth &&
        zone.rect.right > 0;

      const justEntered = inView && !zone.wasIntersecting;
      if (justEntered) {
        this.entryBurst(zone);
      }
      zone.wasIntersecting = inView;
      if (!inView) continue;

      if (!justEntered) {
        const moveDelta = Math.hypot(zone.rect.left - prevLeft, zone.rect.top - prevTop);
        zone.momentum = Math.max(zone.momentum * 0.8, moveDelta);
      } else {
        zone.momentum = 0;
      }
      const moveBoost = 1 + zone.momentum / 15;
      const ageOffset = zone.momentum > 2 ? Math.min(0.25, zone.momentum / 60) : undefined;

      const cap = TIER_CAPS[this.tier];
      const want = cap.emission * zone.vars.pixieDensity * dt * moveBoost;
      let n = Math.floor(want);
      if (Math.random() < want - n) n += 1;
      for (let i = 0; i < n; i++) this.spawn(zone.vars, zone.rect, ageOffset);
    }

    this.pool.step(dt, t / 1000);

    if (this.pool.activeCount === 0) {
      this.syncLoop();
      return;
    }

    this.visibleRects.length = 0;
    for (const [, zone] of this.zones) {
      if (zone.intersecting) this.visibleRects.push(zone.rect);
    }

    this.pool.forEachActive((m) => this.drawMote(ctx, m, this.visibleRects));

    recordFrameTime(dt * 1000, this.tier, (next) => {
      this.tier = next;
      this.pool?.setCap(TIER_CAPS[next].pool);
    });
  };

  private spawn(vars: ResolvedVars, rect: DOMRect, initialLifeFrac?: number): void {
    if (!this.pool) return;
    const size = Math.max(MIN_SIZE, Math.round(8 * vars.pixieScale));
    const life = 1.5 + Math.random() * 2.0;
    const startLife = initialLifeFrac !== undefined ? life * (1 - initialLifeFrac) : life;
    const px = rect.left + Math.random() * rect.width;
    const py = rect.top + Math.random() * rect.height;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    const speed = (6 + Math.random() * 12) * vars.speed;
    let vx: number;
    let vy: number;
    if (len < 0.001 || Math.random() < 0.25) {
      const angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else {
      const baseAngle = Math.atan2(dy, dx);
      const spread = (Math.random() - 0.5) * 0.7;
      const angle = baseAngle + spread;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    }
    let idx = this.colorIndex.get(vars.color);
    if (idx === undefined) {
      idx = this.colors.length;
      this.colors.push(vars.color);
      this.colorIndex.set(vars.color, idx);
    }
    const r0 = Math.random();
    const kind: MoteKind = r0 < 0.4 ? 0 : r0 < 0.85 ? 1 : 2;
    const behavior = BEHAVIORS[kind];
    const r = kind === 2 ? size * 2 : size;
    this.pool.spawn({
      x: px,
      y: py,
      vx,
      vy,
      r,
      life: startLife,
      maxLife: life,
      phase: Math.random() * Math.PI * 2,
      driftAmp: 4 + Math.random() * 8,
      driftFreq: 0.5 + Math.random() * 1.5,
      hue: idx,
      bounds: vars.pixieBounds,
      kind,
      rotation: Math.random() * Math.PI * 2,
      angularVelocity: behavior.spin(Math.random()),
    });
  }

  private entryBurst(zone: Zone): void {
    const cap = TIER_CAPS[this.tier];
    const avgLife = 2.5;
    const steadyCount = cap.emission * zone.vars.pixieDensity * avgLife;
    const burstCount = Math.floor(steadyCount * 0.85);
    for (let i = 0; i < burstCount; i++) {
      const initialLifeFrac = 0.7 + Math.random() * 0.25;
      this.spawn(zone.vars, zone.rect, initialLifeFrac);
    }
  }

  private drawMote(ctx: CanvasRenderingContext2D, m: Mote, visibleRects: DOMRect[]): void {
    const color = this.colors[m.hue] ?? "#ffb37c";
    const sprite = buildSprite(color, m.r);
    const behavior = BEHAVIORS[m.kind];
    const lifeFrac = m.maxLife > 0 ? m.life / m.maxLife : 0;
    const baseFade = Math.min(1, (1 - lifeFrac) * 4);
    const fade = behavior.fade(lifeFrac, baseFade);
    const twinkle = 0.5 + 0.5 * Math.sin(m.phase * 3);

    let minDist = Infinity;
    for (const r of visibleRects) {
      const d = distToRect(m.x, m.y, r);
      if (d < minDist) minDist = d;
    }

    let boundsAlpha = 1;
    if (visibleRects.length > 0) {
      const cfg = BOUNDS_FADE[m.bounds];
      if (m.bounds === "strict") {
        if (minDist > 0) {
          m.life = 0;
          return;
        }
      } else if (minDist >= cfg.fadeEnd) {
        m.life = 0;
        return;
      } else if (minDist > cfg.fadeStart) {
        boundsAlpha = 1 - (minDist - cfg.fadeStart) / (cfg.fadeEnd - cfg.fadeStart);
      }
    }

    const size = m.r * behavior.scale(lifeFrac);
    ctx.globalAlpha = Math.max(0, fade * twinkle * boundsAlpha);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private unregister(host: HTMLElement): void {
    this.zones.delete(host);
    this.io?.unobserve(host);
  }
}

export const particleEngine = new ParticleEngine();
