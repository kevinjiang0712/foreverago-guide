import { z } from 'zod';
import {templateNames} from '../template-names';
import {isListType} from '../template-layouts';
import { safeId, slug, text, httpUrl, publicationFields, checkPublication } from './common';
export const templateName = z.enum(templateNames).exclude(['site-home']);
export const pageSchema = z.strictObject({
  id:safeId.refine(value=>value!=='home','home is reserved for home.json'), slug,
  category:z.union([safeId,z.literal('_pages')]), template:templateName,
  ...publicationFields, order:z.number().finite().optional(),
  quickAnswer:z.array(text).min(1).optional(),
  listGroup:safeId.optional(),
  listGuide:safeId.nullable().optional(),
  articleRecord:safeId.optional(),
  records:z.array(safeId).default([]), assets:z.record(safeId,safeId).default({}),
  related:z.array(safeId).default([]), previous:safeId.optional(), next:safeId.optional(),
  card:z.strictObject({title:text,description:text,image:safeId}).optional(),
  guide:z.strictObject({eyebrow:text,title:text,stats:z.array(z.strictObject({label:text,value:z.union([text,z.number().finite(),z.null()])})),table:safeId.nullable(),route:safeId.nullable()}).optional(),
  author:z.strictObject({name:z.string().min(1),url:httpUrl.optional()}).optional(),
}).superRefine((page,ctx)=>{if(page.articleRecord&&page.guide)ctx.addIssue({code:'custom',path:['articleRecord'],message:'articleRecord and guide cannot be combined'});}).superRefine(checkPublication).superRefine((page,ctx)=>{
 if(page.template!=='wiki-page'&&page.guide)ctx.addIssue({code:'custom',path:['guide'],message:'guide is only valid for wiki-page'});
 if(page.template==='database-index'&&page.listGuide!==null)ctx.addIssue({code:'custom',path:['listGuide'],message:'database-index requires null; use database-detail for entry explanations'});
 if(isListType(page.template)&&page.listGuide===undefined)ctx.addIssue({code:'custom',path:['listGuide'],message:'requires an explicit article ID or null when no reference article is provided'});
});
export type PageMetadata = z.infer<typeof pageSchema>;
