type PhysicsTickFn = (dt: number) => boolean;

const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

class PhysicsEngine {
  private ticks = new Set<PhysicsTickFn>();
  private raf = 0;
  private lastT = 0;
  private MAX_DT = 50;

  register(fn: PhysicsTickFn): void {
    if (reducedMotion) return;
    this.ticks.add(fn);
    this.syncLoop();
  }

  unregister(fn: PhysicsTickFn): void {
    this.ticks.delete(fn);
    this.syncLoop();
  }

  private syncLoop(): void {
    if (typeof requestAnimationFrame === "undefined") return;

    if (this.ticks.size > 0 && !this.raf) {
      this.lastT = 0;
      this.raf = requestAnimationFrame(this.frame);
    } else if (this.ticks.size === 0 && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private frame = (t: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (typeof document !== "undefined" && document.hidden) return;
    const dt = this.lastT ? Math.min(this.MAX_DT, t - this.lastT) / 1000 : 0;
    this.lastT = t;

    for (const tick of Array.from(this.ticks)) {
      if (!tick(dt)) this.ticks.delete(tick);
    }
    if (this.ticks.size === 0) this.syncLoop();
  };
}

export const physicsEngine = new PhysicsEngine();
