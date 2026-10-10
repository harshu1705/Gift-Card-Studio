// ============================================================================
// TEMPLATE CONFIG - the only place where card positions are written down.
//
// x, y, width  = percent (0-100) of the ORIGINAL image size
// fontSize     = pixels on the ORIGINAL image
//
// x is the "anchor": left edge for align:'left', middle for 'center', right edge for 'right'.
// y is the TOP of the text box.
//
// kind:'input'  -> the user types it (shows up as a form field)
// kind:'static' -> fixed wording we add to the card (no form field)
// Text that is already printed in the image goes in fixedContent (just a note).
//
// This file has no imports so the server can read it too.
// ============================================================================

export const FONTS = ['Montserrat', 'Poppins', 'Playfair Display', 'Georgia', 'Arial'];

// The style fields that Layout Setup is allowed to change.
export const STYLE_FIELDS = ['x', 'y', 'width', 'fontSize', 'fontFamily', 'fontWeight', 'color', 'align'];

// Settings every text block starts with. A block only writes what is different.
const base = {
  fontFamily: 'Montserrat',
  fontWeight: 500,
  align: 'left',
  lineHeight: 1.4,
  maxLines: 1,
};

const dearBlock = {
  ...base,
  id: 'recipient',
  label: 'Recipient name',
  kind: 'input',
  required: true,
  placeholder: 'Who is this card for?',
  sample: 'Vaikhari',
  prefix: 'Dear ',
  suffix: ',',
  maxLength: 40,
};

const closingBlock = { ...base, id: 'closing', label: 'Closing line', kind: 'static', default: 'Warm Regards,' };

const senderBlock = {
  ...base,
  id: 'sender',
  label: 'Sender name',
  kind: 'input',
  required: true,
  placeholder: 'Who is sending it?',
  sample: 'Anand',
  maxLength: 40,
};

const templates = [
  // ---- 1. Blank card (960 x 1600): we add everything ----
  {
    id: 'diwali-blank',
    name: 'Diwali - Orange diyas',
    version: 1,
    mode: 'blank',
    image: '/cards/diwali-blank.jpg',
    width: 960,
    height: 1600,
    fixedContent: [],
    safeArea: { left: 6, top: 60, right: 94, bottom: 84 },
    export: { format: 'png' },
    blocks: [
      { ...dearBlock, x: 50, y: 62.5, width: 84, fontSize: 30, align: 'center', color: '#fff4e0' },
      {
        ...base,
        id: 'greeting',
        label: 'Greeting message',
        kind: 'input',
        multiline: true,
        required: true,
        // Approved wording taken from the design team's gold card.
        default: 'May the season of light and renewal bring you protection, growth, and happiness in every moment',
        placeholder: 'Write the greeting',
        sample: 'May the season of light and renewal bring you protection, growth, and happiness in every moment',
        maxLength: 160,
        maxLines: 3,
        x: 50, y: 65.6, width: 80, fontSize: 34, align: 'center', color: '#fff4e0',
      },
      { ...closingBlock, x: 50, y: 77.5, width: 84, fontSize: 28, align: 'center', color: '#fff4e0' },
      { ...senderBlock, x: 50, y: 80.5, width: 84, fontSize: 30, align: 'center', color: '#fff4e0' },
    ],
  },

  // ---- 2. Gold card (600 x 1000): greeting is printed, add names ----
  // Built on the CLEAN image (no names). The version with "Dear Vaikhari / Anand"
  // baked in is only a reference for where the text goes.
  {
    id: 'diwali-gold',
    name: 'Diwali - Golden diyas',
    version: 1,
    mode: 'partial',
    image: '/cards/diwali-gold.jpg',
    width: 600,
    height: 1000,
    fixedContent: ['Happy Diwali', 'May the season of light and renewal bring you protection, growth, and happiness in every moment'],
    safeArea: { left: 6, top: 62, right: 94, bottom: 83 },
    export: { format: 'png' },
    blocks: [
      { ...dearBlock, x: 8, y: 63.8, width: 84, fontSize: 16, color: '#a8363c' },
      { ...closingBlock, x: 8, y: 73.6, width: 84, fontSize: 16, color: '#a8363c' },
      { ...senderBlock, x: 8, y: 76.6, width: 84, fontSize: 16, color: '#a8363c' },
    ],
  },

  // ---- 3. Bells card (600 x 1000): greeting is printed, add names ----
  {
    id: 'diwali-bells',
    name: 'Diwali - Bells and lamps',
    version: 1,
    mode: 'partial',
    image: '/cards/diwali-bells.jpg',
    width: 600,
    height: 1000,
    fixedContent: ['Happy Diwali', 'Wishing you a season filled with light, new beginnings, and protection. May growth and happiness come your way'],
    safeArea: { left: 6, top: 62, right: 94, bottom: 83 },
    export: { format: 'png' },
    blocks: [
      { ...dearBlock, x: 7.6, y: 63.2, width: 84, fontSize: 16, color: '#ffffff' },
      { ...closingBlock, x: 7.6, y: 76.2, width: 84, fontSize: 16, color: '#ffffff' },
      { ...senderBlock, x: 7.6, y: 79.2, width: 84, fontSize: 16, color: '#ffffff' },
    ],
  },
];

export default templates;

// Puts a saved layout on top of a template. Used by the server (when sending
// templates) and by the browser (when previewing unsaved changes).
// layout = { version, blocks: { blockId: { x, y, ... } } }  or null
export function applyLayout(template, layout) {
  return {
    ...template,
    layoutVersion: layout?.version || 0,
    blocks: template.blocks.map((block) => ({ ...block, ...(layout?.blocks?.[block.id] || {}) })),
  };
}
