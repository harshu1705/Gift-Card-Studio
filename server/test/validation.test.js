import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, activityCreate, layoutBody } from '../src/validation.js';

const good = { templateId: 'a', recipientName: 'Asha', senderName: 'Anand', exportWidth: 600, exportHeight: 1000, exportFormat: 'png' };

test('accepts a good activity', () => {
  assert.equal(parse(activityCreate, good).recipientName, 'Asha');
});

test('rejects an empty recipient', () => {
  assert.throws(() => parse(activityCreate, { ...good, recipientName: '  ' }), /recipientName/);
});

test('rejects unknown fields', () => {
  assert.throws(() => parse(activityCreate, { ...good, hack: 1 }));
});

test('layout: rejects a bad color and a path-like font', () => {
  assert.throws(() => parse(layoutBody, { blocks: { sender: { color: 'red' } } }));
  assert.throws(() => parse(layoutBody, { blocks: { sender: { fontFamily: '../../etc' } } }));
});

test('layout: accepts a normal change', () => {
  assert.ok(parse(layoutBody, { blocks: { sender: { x: 12.5, align: 'left' } } }));
});
