// ============================================================================
// TEXT LOGIC - what text a block shows, whether it fits, and font loading.
// Uses Konva only to MEASURE text (same engine as the preview and the PNG).
// ============================================================================
import Konva from 'konva';
import { toPx, boxLeftPx, insideSafeArea } from './coords';

// The text drawn for a block. Empty input -> nothing is drawn (never invented).
export function blockText(block, value) {
  if (block.kind === 'static') return block.default;
  const typed = (value || '').trim();
  if (!typed) return '';
  return (block.prefix || '') + typed + (block.suffix || '');
}

// Make an off-screen Konva text with the same settings the canvas will use.
function measure(block, text, template) {
  const node = new Konva.Text({
    text,
    width: toPx(block.width, template.width),
    fontSize: block.fontSize,
    fontFamily: block.fontFamily,
    fontStyle: String(block.fontWeight),
    lineHeight: block.lineHeight,
    wrap: 'word',
  });
  const result = { height: node.height(), lines: Math.round(node.height() / (block.fontSize * block.lineHeight)) };
  node.destroy();
  return result;
}

export const textHeight = (block, text, template) => measure(block, text, template).height;

// Returns a sentence describing the problem, or null if the text fits.
export function checkBlock(block, text, template) {
  if (!text) return null;
  const { height, lines } = measure(block, text, template);

  if (lines > block.maxLines) {
    return `${block.label} is too long. It needs ${lines} lines and this card has room for ${block.maxLines}.`;
  }

  const left = boxLeftPx(block, template.width);
  const top = toPx(block.y, template.height);
  const box = { left, top, right: left + toPx(block.width, template.width), bottom: top + height };
  if (!insideSafeArea(box, template.safeArea, template.width, template.height)) {
    return `${block.label} runs outside the safe area of the card.`;
  }
  return null;
}

// Wait until the fonts the card uses are really ready (otherwise the canvas draws a fallback font).
export function loadFonts(blocks) {
  const wanted = blocks.map((b) => `${b.fontWeight} 16px "${b.fontFamily}"`);
  return Promise.all([...new Set(wanted)].map((f) => document.fonts.load(f)));
}
