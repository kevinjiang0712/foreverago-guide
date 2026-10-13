import { z } from 'zod';
import { safeId, locale, text } from './common';
export const assetSchema=z.strictObject({
  id:safeId,src:z.string().regex(/^\/media\/(?!.*(?:\.\.|\\|[?#])).+$/,'expected a local /media/ path').nullable(),
  width:z.number().int().positive(),height:z.number().int().positive(),purpose:text,
  alt:z.record(locale,text),position:z.string().regex(/^(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%$/),demo:z.boolean().default(true),
  avifSources:z.array(z.strictObject({src:z.string().regex(/^\/media\/(?!.*(?:\.\.|\\|[?#])).+\.avif$/,'expected a local /media/ AVIF path'),width:z.number().int().positive()})).min(1).max(3).optional(),
});
export type Asset = z.infer<typeof assetSchema>;
