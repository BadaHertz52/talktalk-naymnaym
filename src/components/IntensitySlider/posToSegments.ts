export const SEGMENT_COUNT = 10;

export function posToSegments(x: number, width: number): number {
  if (width === 0) return 1;
  const ratio = Math.max(0, Math.min(1, x / width));

  return Math.max(1, Math.ceil(ratio * SEGMENT_COUNT));
}
