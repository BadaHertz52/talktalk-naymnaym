export interface MaskSegment {
  text: string;
  masked: boolean;
}

export function getMaskSegments(text: string, secretMode: boolean): MaskSegment[] {
  if (!secretMode) return [{ text, masked: false }];

  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((chunk) => ({ text: chunk, masked: !/^\s+$/.test(chunk) }));
}
