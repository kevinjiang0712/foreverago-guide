import { z } from 'zod';
export const safeId = z.string().regex(/^[a-z][a-z0-9-]*$/, 'expected a lowercase stable ID');
export const slug = z.string().regex(/^[\p{L}\p{N}][\p{L}\p{N}-]*$/u, 'expected one URL segment');
export const locale = z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
export const text = z.string().trim().min(1);
export const httpUrl = z.url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'expected an HTTP(S) URL');
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value); return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'expected a real ISO calendar date');
export const verification = z.enum(['confirmed','partial','unverified']);
export const contentStatus = z.enum(['draft','published','archived']);
export const target = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('home') }),
  z.strictObject({ type: z.literal('content'), id: safeId }),
  z.strictObject({ type: z.literal('category'), id: safeId }),
  z.strictObject({ type: z.literal('official'), id: safeId }),
  z.strictObject({ type: z.literal('external'), url: httpUrl }),
]);
export const labeledLink = z.strictObject({ label: text, target });
export const seo = z.strictObject({ title: text.optional(), description: text.optional(), image: safeId.nullable().optional(), noindex: z.boolean().default(false), final:z.boolean().optional() });
export const publicationFields = {
  locale, title: text, description: text, status: contentStatus.default('draft'),
  verification: verification.default('unverified'), demo: z.boolean().default(true),
  publishedAt: date.optional(), updatedAt: date.optional(), seo: seo.optional(),
  gameVersion: text.optional(),
};
export function checkPublication(value: {publishedAt?: string; updatedAt?: string}, ctx: z.RefinementCtx) {
  if (value.publishedAt && value.updatedAt && value.updatedAt < value.publishedAt)
    ctx.addIssue({code:'custom',path:['updatedAt'],message:'must not precede publishedAt'});
}
