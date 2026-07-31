import type { ResolvedVars } from "../core/derive";
import { physicsEngine } from "../physics/engine";
import { ensurePointerListeners, getPointer } from "../physics/pointer";
import { springAtRest, springStep } from "../physics/spring";

function computeTargetTilt(host: HTMLElement, vars: ResolvedVars, hovering: boolean) {
  if (!hovering || host.getAttribute("data-folex-dragging") === "true") {
    return { tRotX: 0, tRotY: 0, tSc: 1 };
  }
  const p = getPointer();
  const r = host.getBoundingClientRect();
  const nx = ((p.x - r.left) / r.width) * 2 - 1;
  const ny = ((p.y - r.top) / r.height) * 2 - 1;
  return {
    tRotY: nx * vars.expTiltMax,
    tRotX: -ny * vars.expTiltMax,
    tSc: vars.expTiltScale,
  };
}

interface TiltState {
  sX: { pos: number; vel: number };
  sY: { pos: number; vel: number };
  sSc: { pos: number; vel: number };
  hovering: boolean;
}

function applyTiltSprings(
  state: TiltState,
  targets: { tRotX: number; tRotY: number; tSc: number },
  cfg: { speed: number; springCfg: { stiffness: number; damping: number }; dt: number },
) {
  const [rx, vx] = springStep(state.sX, targets.tRotX, { ...cfg.springCfg, dt: cfg.dt });
  state.sX = { pos: rx, vel: vx };
  const [ry, vy] = springStep(state.sY, targets.tRotY, { ...cfg.springCfg, dt: cfg.dt });
  state.sY = { pos: ry, vel: vy };
  const [sc, scv] = springStep(state.sSc, targets.tSc, {
    stiffness: 200 * cfg.speed,
    damping: 10,
    dt: cfg.dt,
  });
  state.sSc = { pos: sc, vel: scv };
  return { rx, ry, sc };
}

function checkTiltRest(state: TiltState, targets: { tRotX: number; tRotY: number; tSc: number }): boolean {
  return (
    springAtRest(state.sX, targets.tRotX, 0.001) &&
    springAtRest(state.sY, targets.tRotY, 0.001) &&
    springAtRest(state.sSc, targets.tSc, 0.0001)
  );
}

function formatTiltTransform(vars: ResolvedVars, res: { rx: number; ry: number; sc: number }): string {
  return `perspective(${vars.expTiltPerspective}px) rotateX(${res.rx.toFixed(2)}deg) rotateY(${res.ry.toFixed(2)}deg) scale3d(${res.sc.toFixed(4)},${res.sc.toFixed(4)},1)`;
}

function createTiltTicker(ctx: { host: HTMLElement; vars: ResolvedVars }, state: TiltState, onReset: () => void) {
  const speed = ctx.vars.expTiltSpeed;
  const springCfg = { stiffness: 120 * speed, damping: 4.38 * Math.sqrt(speed) };
  return (dt: number): boolean => {
    if (!ctx.host.isConnected) return false;
    const targets = computeTargetTilt(ctx.host, ctx.vars, state.hovering);
    const res = applyTiltSprings(state, targets, { speed, springCfg, dt });
    ctx.host.style.transform = formatTiltTransform(ctx.vars, res);

    if (checkTiltRest(state, targets) && !state.hovering) {
      ctx.host.style.transform = "";
      onReset();
      return false;
    }
    return true;
  };
}

function attachTiltEvents(ctx: { host: HTMLElement; vars: ResolvedVars }, state: TiltState, tick: (dt: number) => boolean): void {
  let registered = false;
  ctx.host.addEventListener("pointerenter", () => {
    state.hovering = true;
    if (!registered) { registered = true; physicsEngine.register(tick); }
  }, { passive: true });

  ctx.host.addEventListener("pointerleave", () => {
    if (!state.hovering) return;
    state.hovering = false;
    const sp = Math.sqrt(ctx.vars.expTiltSpeed);
    state.sX.vel -= state.sX.pos * 2.0 * sp;
    state.sY.vel -= state.sY.pos * 2.0 * sp;
  }, { passive: true });
}

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  ensurePointerListeners();
  host.style.transformStyle = "preserve-3d";
  const state: TiltState = { sX: { pos: 0, vel: 0 }, sY: { pos: 0, vel: 0 }, sSc: { pos: 1, vel: 0 }, hovering: false };
  const tick = createTiltTicker({ host, vars }, state, () => {});
  attachTiltEvents({ host, vars }, state, tick);
}


