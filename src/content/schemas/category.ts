import { z } from 'zod';
import { safeId, slug } from './common';
export const categorySchema = z.strictObject({
  id:safeId, slug, order:z.number().finite(), navigation:z.boolean(),
  landing:safeId.nullable(), showWhenEmpty:z.boolean().default(false),
  heroAsset:safeId.optional(),
  characterIds:z.array(safeId).optional(),
});
export type CategoryConfig = z.infer<typeof categorySchema>;
