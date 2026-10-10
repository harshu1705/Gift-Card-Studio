// The ONLY file that touches the disk. Routes call these functions and don't know
// about JSON files. To move to a database later, rewrite this file only.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const defaultDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const dataDir = () => process.env.DATA_DIR || defaultDir;
const activitiesFile = () => path.join(dataDir(), 'activities.json');
const layoutFile = () => path.join(dataDir(), 'layout-overrides.json');

// ---- one write at a time ----
// Every read-change-write goes through this queue so two requests can't overwrite each other.
let queue = Promise.resolve();
function oneAtATime(task) {
  const run = queue.then(task);
  queue = run.catch(() => {}); // a failed task must not block the next one
  return run;
}

// ---- file helpers ----
async function readJson(file, emptyValue) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(file, JSON.stringify(emptyValue, null, 2));
      return emptyValue;
    }
    throw new Error(`Could not read ${path.basename(file)}: ${err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    // Never overwrite a damaged file: the old records might still be recoverable.
    throw new Error(`${path.basename(file)} contains invalid JSON. Fix or move it, then retry.`);
  }
}

// Write to a temp file, then rename. A crash mid-write can't leave half a file.
async function writeJson(file, data) {
  const temp = file + '.tmp';
  try {
    await fs.writeFile(temp, JSON.stringify(data, null, 2));
    await fs.rename(temp, file);
  } catch (err) {
    throw new Error(`Could not save ${path.basename(file)}: ${err.message}`);
  }
}

// ---- activities ----
export async function listActivities({ search, templateId, from, to, page = 1, pageSize = 10 } = {}) {
  let items = await readJson(activitiesFile(), []);
  items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (a) => a.recipientName.toLowerCase().includes(q) || a.senderName.toLowerCase().includes(q)
    );
  }
  if (templateId) items = items.filter((a) => a.templateId === templateId);
  if (from) items = items.filter((a) => a.createdAt >= from + 'T00:00:00.000Z');
  if (to) items = items.filter((a) => a.createdAt <= to + 'T23:59:59.999Z');

  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

// The server decides the id, the time and the first status. The browser can't.
export function createActivity(data) {
  return oneAtATime(async () => {
    const all = await readJson(activitiesFile(), []);
    const record = {
      id: 'ACT-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      ...data,
      status: 'export_started',
      createdAt: new Date().toISOString(),
    };
    all.push(record);
    await writeJson(activitiesFile(), all); // only returns after the file write worked
    return record;
  });
}

export function updateActivityStatus(id, status, errorMessage) {
  return oneAtATime(async () => {
    const all = await readJson(activitiesFile(), []);
    const record = all.find((a) => a.id === id);
    if (!record) return null;
    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (errorMessage) record.errorMessage = errorMessage;
    await writeJson(activitiesFile(), all);
    return record;
  });
}

// ---- saved layouts ----
// File shape: { "diwali-gold": { "version": 2, "blocks": { "recipient": { "x": 8, ... } } } }
export async function getTemplateLayout(templateId) {
  const all = await readJson(layoutFile(), {});
  return all[templateId] || null;
}

export function saveTemplateLayout(templateId, blocks) {
  return oneAtATime(async () => {
    const all = await readJson(layoutFile(), {});
    const old = all[templateId] || { version: 0, blocks: {} };
    const merged = { ...old.blocks };
    for (const [blockId, style] of Object.entries(blocks)) {
      merged[blockId] = { ...(merged[blockId] || {}), ...style };
    }
    all[templateId] = { version: old.version + 1, blocks: merged };
    await writeJson(layoutFile(), all);
    return all[templateId];
  });
}
