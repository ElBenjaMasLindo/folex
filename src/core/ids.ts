let seq = 0;
export function nextId(): number {
  seq += 1;
  return seq;
}
