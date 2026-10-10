// All request checking lives here (zod). Routes call parse() and nothing else.
import { z } from 'zod';
import { FONTS } from '../../client/src/config/templates.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Runs a schema and turns the first problem into a 400 error.
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? issue.path.join('.') + ': ' : '';
    throw new HttpError(400, where + issue.message);
  }
  return result.data;
}

export const activityCreate = z
  .object({
    templateId: z.string().min(1).max(60),
    recipientName: z.string().trim().min(1).max(80),
    senderName: z.string().trim().min(1).max(80),
    greetingText: z.string().trim().max(300).optional(),
    exportWidth: z.number().int().positive().max(10000),
    exportHeight: z.number().int().positive().max(10000),
    exportFormat: z.literal('png'),
  })
  .strict();

export const statusUpdate = z
  .object({
    status: z.enum(['download_triggered', 'failed']),
    errorMessage: z.string().max(200).optional(),
  })
  .strict();

export const activityQuery = z.object({
  search: z.string().max(80).optional(),
  templateId: z.string().max(60).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// Only these style fields can be changed from Layout Setup.
const blockStyle = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().min(5).max(100),
    fontSize: z.number().min(8).max(200),
    fontFamily: z.enum(FONTS),
    fontWeight: z.number().int().min(300).max(800),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must look like #aabbcc'),
    align: z.enum(['left', 'center', 'right']),
  })
  .partial()
  .strict();

export const layoutBody = z
  .object({ blocks: z.record(z.string().max(40), blockStyle) })
  .strict();
