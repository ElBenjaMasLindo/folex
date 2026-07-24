/**
 * Semi-implicit Euler integration of a damped harmonic oscillator.
 * Returns new [position, velocity].
 *
 * equation: a = -stiffness * (pos - target) - damping * vel
 */
export function springStep(
  pos: number,
  vel: number,
  target: number,
  stiffness: number,
  damping: number,
  dt: number,
): [number, number] {
  const a = -stiffness * (pos - target) - damping * vel;
  const newVel = vel + a * dt;
  const newPos = pos + newVel * dt;
  return [newPos, newVel];
}

/**
 * Returns true when spring is at rest
 * (position close enough to target AND velocity near zero).
 */
export function springAtRest(
  pos: number,
  vel: number,
  target: number,
  epsilon: number = 0.01,
): boolean {
  return Math.abs(pos - target) < epsilon && Math.abs(vel) < epsilon;
}
