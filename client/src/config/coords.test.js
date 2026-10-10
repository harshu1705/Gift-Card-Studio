import test from 'node:test';
import assert from 'node:assert/strict';
import { toPx, toPercent, boxLeftPx, anchorPercentFromLeft, insideSafeArea } from './coords.js';
import templates, { applyLayout } from './templates.js';

test('percent and pixels convert both ways', () => {
  assert.equal(toPx(50, 600), 300);
  assert.equal(toPercent(300, 600), 50);
});

test('left aligned: box starts at x', () => {
  assert.equal(boxLeftPx({ x: 8, width: 84, align: 'left' }, 600), 48);
});

test('center aligned: x is the middle of the box', () => {
  // width 80% of 960 = 768, middle at 480, so left edge = 96
  assert.equal(boxLeftPx({ x: 50, width: 80, align: 'center' }, 960), 96);
});

test('dragging round trip returns the same x', () => {
  for (const align of ['left', 'center', 'right']) {
    const block = { x: 37.5, width: 60, align };
    const left = boxLeftPx(block, 600);
    assert.ok(Math.abs(anchorPercentFromLeft(block, left, 600) - 37.5) < 1e-9);
  }
});

test('safe area check', () => {
  const safe = { left: 10, top: 10, right: 90, bottom: 90 };
  assert.equal(insideSafeArea({ left: 100, top: 100, right: 500, bottom: 500 }, safe, 600, 1000), true);
  assert.equal(insideSafeArea({ left: 10, top: 100, right: 500, bottom: 500 }, safe, 600, 1000), false);
});

test('saved layout overrides only the listed fields', () => {
  const gold = templates.find((t) => t.id === 'diwali-gold');
  const merged = applyLayout(gold, { version: 3, blocks: { sender: { x: 20 } } });
  assert.equal(merged.layoutVersion, 3);
  assert.equal(merged.blocks.find((b) => b.id === 'sender').x, 20);
  assert.equal(merged.blocks.find((b) => b.id === 'recipient').x, 8);
});

test('every template block id is unique and inside 0-100', () => {
  for (const t of templates) {
    const ids = t.blocks.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, t.id);
    for (const b of t.blocks) assert.ok(b.x >= 0 && b.x <= 100 && b.y >= 0 && b.y <= 100, `${t.id}/${b.id}`);
  }
});
