import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gcs-'));
process.env.DATA_DIR = tempDir();
const storage = await import('../src/storage.js');

const sample = (name) => ({
  templateId: 'diwali-gold', templateName: 'Gold', recipientName: name, senderName: 'Anand',
  exportWidth: 600, exportHeight: 1000, exportFormat: 'png', templateVersion: 0,
});

test('creates a record with server id, time and status', async () => {
  const record = await storage.createActivity(sample('Asha'));
  assert.match(record.id, /^ACT-/);
  assert.equal(record.status, 'export_started');
  assert.ok(record.createdAt);
});

test('lists newest first and filters by search', async () => {
  await storage.createActivity(sample('Bela'));
  const all = await storage.listActivities({});
  assert.equal(all.items[0].recipientName, 'Bela');
  const found = await storage.listActivities({ search: 'asha' });
  assert.equal(found.total, 1);
});

test('20 writes at the same time lose nothing', async () => {
  process.env.DATA_DIR = tempDir();
  await Promise.all(Array.from({ length: 20 }, (_, i) => storage.createActivity(sample('P' + i))));
  const all = await storage.listActivities({ pageSize: 100 });
  assert.equal(all.total, 20);
});

test('status update works and unknown id returns null', async () => {
  const record = await storage.createActivity(sample('Chitra'));
  const updated = await storage.updateActivityStatus(record.id, 'download_triggered');
  assert.equal(updated.status, 'download_triggered');
  assert.equal(await storage.updateActivityStatus('ACT-NOPE', 'failed'), null);
});

test('layout save bumps the version and keeps old blocks', async () => {
  await storage.saveTemplateLayout('diwali-gold', { recipient: { x: 10 } });
  const second = await storage.saveTemplateLayout('diwali-gold', { sender: { y: 80 } });
  assert.equal(second.version, 2);
  assert.equal(second.blocks.recipient.x, 10);
});

test('damaged JSON is reported and NOT overwritten', async () => {
  const dir = tempDir();
  process.env.DATA_DIR = dir;
  fs.writeFileSync(path.join(dir, 'activities.json'), '{ broken');
  await assert.rejects(storage.createActivity(sample('X')), /invalid JSON/);
  assert.equal(fs.readFileSync(path.join(dir, 'activities.json'), 'utf8'), '{ broken');
});
