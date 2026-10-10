// URL -> function. Each route checks input, calls storage, sends the answer.
import { Router } from 'express';
import templates, { applyLayout } from '../../client/src/config/templates.js';
import * as storage from './storage.js';
import { parse, HttpError, activityCreate, statusUpdate, activityQuery, layoutBody } from './validation.js';

const router = Router();

// Express 4 does not catch errors from async functions, so wrap them.
const route = (fn) => (req, res, next) => fn(req, res).catch(next);

function findTemplate(id) {
  const template = templates.find((t) => t.id === id);
  if (!template) throw new HttpError(404, `Template "${id}" does not exist`);
  return template;
}

// Default template + saved layout = what the browser should use.
async function templateWithLayout(template) {
  return applyLayout(template, await storage.getTemplateLayout(template.id));
}

// Layout saving needs a password. In production it is refused if none is configured.
function requireLayoutAccess(req, res, next) {
  const token = process.env.LAYOUT_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      return next(new HttpError(403, 'Layout editing is disabled. Set LAYOUT_TOKEN on the server.'));
    }
    return next(); // local development only
  }
  if (req.get('x-layout-token') !== token) return next(new HttpError(401, 'Wrong or missing layout token'));
  next();
}

// ---- health ----
router.get('/health', (req, res) => res.json({ ok: true }));

// ---- templates ----
router.get('/templates', route(async (req, res) => {
  res.json(await Promise.all(templates.map(templateWithLayout)));
}));

router.get('/templates/:id', route(async (req, res) => {
  res.json(await templateWithLayout(findTemplate(req.params.id)));
}));

router.put('/templates/:id/layout', requireLayoutAccess, route(async (req, res) => {
  const template = findTemplate(req.params.id);
  const body = parse(layoutBody, req.body);
  for (const blockId of Object.keys(body.blocks)) {
    if (!template.blocks.some((b) => b.id === blockId)) {
      throw new HttpError(400, `Template "${template.id}" has no text block "${blockId}"`);
    }
  }
  await storage.saveTemplateLayout(template.id, body.blocks);
  res.json(await templateWithLayout(template));
}));

// ---- activities ----
router.get('/activities', route(async (req, res) => {
  res.json(await storage.listActivities(parse(activityQuery, req.query)));
}));

router.post('/activities', route(async (req, res) => {
  const body = parse(activityCreate, req.body);
  const template = await templateWithLayout(findTemplate(body.templateId));
  const record = await storage.createActivity({
    ...body,
    templateName: template.name,
    templateVersion: template.layoutVersion,
  });
  res.status(201).json(record);
}));

router.patch('/activities/:id/status', route(async (req, res) => {
  const { status, errorMessage } = parse(statusUpdate, req.body);
  const record = await storage.updateActivityStatus(req.params.id, status, errorMessage);
  if (!record) throw new HttpError(404, 'Activity not found');
  res.json(record);
}));

export default router;
