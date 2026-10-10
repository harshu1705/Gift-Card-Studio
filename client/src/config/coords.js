// ============================================================================
// COORDINATE MATH - percent <-> pixel. No React, no Konva, easy to test.
//
// Templates store percentages. The canvas draws in ORIGINAL image pixels
// (the Konva layer is scaled down for the screen), so these functions always
// get the original width/height.
// ============================================================================

export const toPx = (percent, size) => (percent / 100) * size;
export const toPercent = (px, size) => (px / size) * 100;
export const round1 = (n) => Math.round(n * 10) / 10;
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Konva wants the LEFT edge of a text box. Our x is an anchor that depends on align.
export function boxLeftPx(block, imageWidth) {
  const anchor = toPx(block.x, imageWidth);
  const boxWidth = toPx(block.width, imageWidth);
  if (block.align === 'center') return anchor - boxWidth / 2;
  if (block.align === 'right') return anchor - boxWidth;
  return anchor;
}

// The reverse: after dragging, Konva tells us the new left edge. Turn it back into x percent.
export function anchorPercentFromLeft(block, leftPx, imageWidth) {
  const boxWidth = toPx(block.width, imageWidth);
  let anchor = leftPx;
  if (block.align === 'center') anchor = leftPx + boxWidth / 2;
  if (block.align === 'right') anchor = leftPx + boxWidth;
  return toPercent(anchor, imageWidth);
}

// Is a box (in pixels) inside the template's safe area (in percent)?
export function insideSafeArea(box, safeArea, imageWidth, imageHeight) {
  return (
    box.left >= toPx(safeArea.left, imageWidth) - 0.5 &&
    box.right <= toPx(safeArea.right, imageWidth) + 0.5 &&
    box.top >= toPx(safeArea.top, imageHeight) - 0.5 &&
    box.bottom <= toPx(safeArea.bottom, imageHeight) + 0.5
  );
}
