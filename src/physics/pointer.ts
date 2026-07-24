interface PointerState {
  x: number;
  y: number;
  down: boolean;
  activeId: number;
}

const state: PointerState = { x: 0, y: 0, down: false, activeId: -1 };
let listening = false;

export function getPointer(): Readonly<PointerState> {
  return state;
}

export function ensurePointerListeners(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;

  document.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      state.x = e.clientX;
      state.y = e.clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerdown",
    (e: PointerEvent) => {
      state.down = true;
      state.activeId = e.pointerId;
      state.x = e.clientX;
      state.y = e.clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerup",
    () => {
      state.down = false;
      state.activeId = -1;
    },
    { passive: true },
  );
}
