export function calculateNextIndexFromScroll(offsetX: number, width: number): number {
  return Math.round(offsetX / Math.max(width, 1));
}

export function calculateBoundedIndex(index: number, maxIndex: number): number {
  return Math.max(0, Math.min(index, maxIndex));
}

export function canOpenFullscreen(submissionsLength: number): boolean {
  return submissionsLength > 0;
}

export function needsFullscreenClose(submissionsLength: number): boolean {
  return submissionsLength === 0;
}
