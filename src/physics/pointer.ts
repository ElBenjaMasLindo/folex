export type PointerId = number & { readonly __brand: "PointerId" };

export function toPointerId(n: number): PointerId {
  return n as PointerId;
}

interface PointerState {
  x: number;
  y: number;
  down: boolean;
  activeId: PointerId;
}

const state: PointerState = { x: 0, y: 0, down: false, activeId: toPointerId(-1) };
let listening = false;

export function getPointer(): Readonly<PointerState> {
  return state;
}

function registerMoveAndUp(): void {
  document.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      state.x = e.clientX;
      state.y = e.clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerup",
    () => {
      state.down = false;
      state.activeId = toPointerId(-1);
    },
    { passive: true },
  );
}

export function ensurePointerListeners(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;

  registerMoveAndUp();
  document.addEventListener(
    "pointerdown",
    (e: PointerEvent) => {
      state.down = true;
      state.activeId = toPointerId(e.pointerId);
      state.x = e.clientX;
      state.y = e.clientY;
    },
    { passive: true },
  );
}

