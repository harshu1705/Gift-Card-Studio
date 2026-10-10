// The ONE drawing component. Preview, Layout Setup and PNG export all use it,
// so what you see is what you download.
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as CardImage, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import { boxLeftPx, toPx } from '../config/coords';
import { blockText, loadFonts, textHeight } from '../config/cardText';

// Everything inside the Layer is drawn in ORIGINAL image pixels.
// The Layer is scaled down so the card fits the screen.
const CardCanvas = forwardRef(function CardCanvas(
  { template, values, layoutMode = false, selectedId, onSelect, onMove, maxWidth = 380 },
  stageRef
) {
  const wrapRef = useRef(null);
  const [shownWidth, setShownWidth] = useState(maxWidth);
  const [, setFontsLoaded] = useState(0);
  const [image, imageStatus] = useImage(template.image);

  // Fit the card to the space available.
  useEffect(() => {
    const box = wrapRef.current;
    const observer = new ResizeObserver(() => {
      setShownWidth(Math.floor(Math.min(box.clientWidth || maxWidth, maxWidth)));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [maxWidth]);

  // Redraw once the fonts have arrived.
  useEffect(() => {
    loadFonts(template.blocks).then(() => setFontsLoaded((n) => n + 1));
  }, [template.id]);

  const { width: W, height: H } = template;
  const scale = shownWidth / W;

  return (
    <div ref={wrapRef} className="canvas-wrap">
      {imageStatus === 'failed' && (
        <p className="error-box">Could not load {template.image}. Check that the file is in client/public/cards/.</p>
      )}

      <Stage ref={stageRef} width={shownWidth} height={H * scale}>
        <Layer scaleX={scale} scaleY={scale}>
          <CardImage id="card-image" image={image} x={0} y={0} width={W} height={H} />

          {layoutMode && (
            <Rect
              x={toPx(template.safeArea.left, W)}
              y={toPx(template.safeArea.top, H)}
              width={toPx(template.safeArea.right - template.safeArea.left, W)}
              height={toPx(template.safeArea.bottom - template.safeArea.top, H)}
              stroke="#00a86b"
              strokeWidth={2 / scale}
              dash={[10 / scale, 6 / scale]}
              listening={false}
            />
          )}

          {template.blocks.map((block) => {
            const text = blockText(block, values[block.id]);
            if (!text) return null;
            const left = boxLeftPx(block, W);
            const top = toPx(block.y, H);
            const boxWidth = toPx(block.width, W);
            const selected = layoutMode && block.id === selectedId;
            return [
              selected && (
                <Rect
                  key={block.id + '-box'}
                  x={left}
                  y={top}
                  width={boxWidth}
                  height={textHeight(block, text, template)}
                  stroke="#2f6fed"
                  strokeWidth={2 / scale}
                  listening={false}
                />
              ),
              <Text
                key={block.id}
                text={text}
                x={left}
                y={top}
                width={boxWidth}
                fontSize={block.fontSize}
                fontFamily={block.fontFamily}
                fontStyle={String(block.fontWeight)}
                fill={block.color}
                align={block.align}
                lineHeight={block.lineHeight}
                wrap="word"
                draggable={layoutMode}
                onClick={() => onSelect && onSelect(block.id)}
                onTap={() => onSelect && onSelect(block.id)}
                onDragStart={() => onSelect && onSelect(block.id)}
                onDragEnd={(e) => onMove && onMove(block.id, e.target.x(), e.target.y())}
              />,
            ];
          })}
        </Layer>
      </Stage>
    </div>
  );
});

export default CardCanvas;
