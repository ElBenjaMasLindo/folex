type PhysicsTickFn = (dt: number) => boolean;

const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const ticks = new Set<PhysicsTickFn>();
let raf = 0;
let lastT = 0;
const MAX_DT = 50;

function syncLoop(): void {
  if (typeof requestAnimationFrame === "undefined") return;

  if (ticks.size > 0 && !raf) {
    lastT = 0;
    raf = requestAnimationFrame(frame);
  } else if (ticks.size === 0 && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

function runPhysicsTicks(dt: number): void {
  for (const tick of Array.from(ticks)) {
    if (!tick(dt)) ticks.delete(tick);
  }
}

function frame(t: number): void {
  raf = requestAnimationFrame(frame);
  if (typeof document !== "undefined" && document.hidden) return;
  const dt = lastT ? Math.min(MAX_DT, t - lastT) / 1000 : 0;
  lastT = t;

  runPhysicsTicks(dt);
  if (ticks.size === 0) syncLoop();
}

export const physicsEngine = {
  register(fn: PhysicsTickFn): void {
    if (reducedMotion) return;
    ticks.add(fn);
    syncLoop();
  },
  unregister(fn: PhysicsTickFn): void {
    ticks.delete(fn);
    syncLoop();
  },
};
