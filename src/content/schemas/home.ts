import { z } from 'zod';
import { safeId,text,labeledLink,publicationFields,checkPublication } from './common';
import {youtubeVideoId} from '../youtube';
const heading={eyebrow:text,title:text,description:text};
const statValue=z.string().refine(value=>value.trim().length>0,'stat value must contain non-whitespace text or be null').nullable();
const video=z.strictObject({
  url:z.url().refine(value=>youtubeVideoId(value)!==null,'expected an HTTPS YouTube video URL without timestamp or playlist parameters'),
  title:z.string().refine(value=>value.trim().length>0&&Array.from(value.trim()).length<=120&&!/[\r\n]/.test(value),'expected a single-line title of 1–120 characters').transform(value=>value.trim()),
});
const distinctArticles=(ids:string[])=>new Set(ids).size===ids.length;
export const homeSchema=z.strictObject({
  id:z.literal('home'),template:z.literal('site-home'),...publicationFields,
  hero:z.strictObject({eyebrow:text,description:text,asset:safeId,video:video.nullable(),stats:z.array(z.strictObject({label:text,value:statValue})).nullable()}),
  featured:z.strictObject({...heading,pinnedIds:z.array(safeId).refine(ids=>new Set(ids).size===ids.length,'duplicate pinned IDs')}),
  about:z.strictObject({eyebrow:text,title:text,paragraphs:z.array(text),facts:z.array(z.strictObject({label:text,value:text.nullable()})),link:labeledLink}),
  articleFloors:z.array(z.strictObject({id:safeId,...heading,articleIds:z.array(safeId).length(8).refine(distinctArticles,'article IDs must be distinct')})).optional(),
  characterSpotlight:z.strictObject({...heading,characterIds:z.array(safeId).length(3).refine(distinctArticles,'character IDs must be distinct')}).nullable().optional(),
  weaponShowcase:z.union([
    z.strictObject({asset:safeId,ariaLabel:text}),
    z.strictObject({asset:safeId,ariaLabel:text,...heading,categoryId:safeId}),
  ]).nullable().optional(),
  faq:z.strictObject({...heading,support:z.strictObject({prefix:text,link:labeledLink,suffix:text}).optional(),items:z.array(z.strictObject({question:text,answer:text}))}),
  cta:z.strictObject({links:z.array(labeledLink)}),
}).superRefine(checkPublication);
export type HomeContent=z.infer<typeof homeSchema>;
