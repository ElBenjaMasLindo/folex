import type { ResolvedVars } from "../core/derive";
import { physicsEngine } from "../physics/engine";
import { ensurePointerListeners, getPointer } from "../physics/pointer";
import { springAtRest, springStep } from "../physics/spring";

export function setup(host: HTMLElement, vars: ResolvedVars): void {
  const tiltMax = vars.tiltMax;
  const perspective = vars.tiltPerspective;
  const hoverScale = vars.tiltScale;
  const speed = vars.tiltSpeed;
  const stiffness = 120 * speed;
  const damping = 8;

  ensurePointerListeners();

  host.style.transformStyle = "preserve-3d";

  let rotX = 0;
  let rotY = 0;
  let velX = 0;
  let velY = 0;
  let sc = 1;
  let scVel = 0;
  let hovering = false;
  let registered = false;

  const tick = (dt: number): boolean => {
    if (!host.isConnected) return false;

    let tRotX = 0;
    let tRotY = 0;
    let tSc = 1;
    if (hovering && host.getAttribute("data-folex-dragging") !== "true") {
      const p = getPointer();
      const r = host.getBoundingClientRect();
      const nx = ((p.x - r.left) / r.width) * 2 - 1;
      const ny = ((p.y - r.top) / r.height) * 2 - 1;
      tRotY = nx * tiltMax;
      tRotX = -ny * tiltMax;
      tSc = hoverScale;
    }

    [rotX, velX] = springStep(rotX, velX, tRotX, stiffness, damping, dt);
    [rotY, velY] = springStep(rotY, velY, tRotY, stiffness, damping, dt);
    [sc, scVel] = springStep(sc, scVel, tSc, 200 * speed, 14, dt);

    host.style.transform = `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${sc.toFixed(4)},${sc.toFixed(4)},1)`;

    const atRest =
      springAtRest(rotX, velX, tRotX, 0.001) &&
      springAtRest(rotY, velY, tRotY, 0.001) &&
      springAtRest(sc, scVel, tSc, 0.0001);

    if (atRest && !hovering) {
      host.style.transform = "";
      registered = false;
      return false;
    }
    return true;
  };

  const wake = () => {
    if (!registered) {
      registered = true;
      physicsEngine.register(tick);
    }
  };

  host.addEventListener(
    "pointerenter",
    () => {
      hovering = true;
      wake();
    },
    { passive: true },
  );

  host.addEventListener(
    "pointerleave",
    () => {
      hovering = false;
    },
    { passive: true },
  );
}
