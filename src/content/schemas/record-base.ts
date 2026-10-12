import {z} from 'zod';
import {safeId,locale,verification,text} from './common';
export const recordBase={id:safeId,locale,verification:verification.default('unverified'),demo:z.boolean().default(true)};
export const sectionCopy=z.strictObject({eyebrow:text,title:text,description:text});
export const fact=z.strictObject({label:text,value:z.union([text,z.number().finite(),z.null()])});
export const unrevealedSlot=z.strictObject({status:z.literal('unrevealed'),label:text,description:text});
