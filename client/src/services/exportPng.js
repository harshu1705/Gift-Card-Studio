// PNG export. Runs fully in the browser - nothing is uploaded.

// The preview stage is small (scaled for the screen). To export, we briefly set it
// to the original size, take the picture, and put it back.
export function exportPng(stage, template) {
  const photo = stage.findOne('#card-image');
  if (!photo || !photo.image()) throw new Error('The card image has not loaded, so it cannot be exported.');

  const layer = stage.getLayers()[0];
  const before = { w: stage.width(), h: stage.height(), sx: layer.scaleX(), sy: layer.scaleY() };
  try {
    stage.size({ width: template.width, height: template.height });
    layer.scale({ x: 1, y: 1 });
    return stage.toDataURL({ mimeType: 'image/png', pixelRatio: 1 });
  } finally {
    stage.size({ width: before.w, height: before.h });
    layer.scale({ x: before.sx, y: before.sy });
    stage.batchDraw();
  }
}

// "diwali-gold-Asha-Rao.png". Keeps letters and digits in any language, drops the rest.
export function makeFileName(template, recipient) {
  const safe =
    recipient
      .trim()
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'card';
  return `${template.id}-${safe}.png`;
}

export function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
