export interface SpringConfig {
  stiffness: number;
  damping: number;
}

export interface SpringState {
  pos: number;
  vel: number;
}

export function springStep(
  state: SpringState,
  target: number,
  config: SpringConfig & { dt: number },
): [number, number] {
  const a = -config.stiffness * (state.pos - target) - config.damping * state.vel;
  const newVel = state.vel + a * config.dt;
  const newPos = state.pos + newVel * config.dt;
  return [newPos, newVel];
}

export function springAtRest(state: SpringState, target: number, epsilon: number = 0.01): boolean {
  return Math.abs(state.pos - target) < epsilon && Math.abs(state.vel) < epsilon;
}
