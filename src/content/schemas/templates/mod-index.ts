import {z} from 'zod';
import {safeId,text,date,verification} from '../common';
import {recordBase,sectionCopy} from '../record-base';
const uniqueIds=z.array(safeId).refine(ids=>new Set(ids).size===ids.length,'duplicate IDs');
export const modEntry=z.strictObject({...recordBase,type:z.literal('mod'),title:text,description:text,authorName:text.nullable(),releaseVersion:text.nullable(),endorsements:z.number().int().nonnegative().nullable(),fileSize:text.nullable(),categoryId:safeId,tagIds:uniqueIds,testedVersions:z.array(text).refine(ids=>new Set(ids).size===ids.length,'duplicate versions'),updatedAt:date.nullable(),downloads:z.number().int().nonnegative().nullable(),contentId:safeId.nullable(),assetId:safeId.nullable()});
export const modNote=z.strictObject({id:safeId,title:text,description:text,verification});
export const modFaq=z.strictObject({id:safeId,question:text,answer:text,verification});
const option=z.strictObject({id:safeId.refine(id=>id!=='all','all is reserved'),label:text});
export const modIndexRecord=z.strictObject({...recordBase,type:z.literal('mod-index'),sections:z.strictObject({browse:sectionCopy,install:sectionCopy,compat:sectionCopy,safety:sectionCopy,faq:sectionCopy,legal:sectionCopy}),modIds:uniqueIds,currentVersion:text.nullable(),perPage:z.literal(30),knownTotal:z.number().int().nonnegative().nullable(),sortOptions:z.array(z.strictObject({id:z.enum(['listed','downloads','updated']),label:text})).min(1),categories:z.array(option),tags:z.array(option),beforeInstall:sectionCopy,installSteps:z.array(modNote),compatibility:z.array(modNote),safetyNotes:z.array(modNote),safetyAssetId:safeId.nullable(),safetyCaption:text,faq:z.array(modFaq),legalNotes:z.array(modNote)}).superRefine((record,ctx)=>{
 for(const field of ['sortOptions','categories','tags','installSteps','compatibility','safetyNotes','faq','legalNotes'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});}
 if(record.knownTotal!==null&&record.knownTotal<record.modIds.length)ctx.addIssue({code:'custom',path:['knownTotal'],message:'knownTotal cannot be less than listed entries'});
});
export type ModEntry=z.infer<typeof modEntry>;
export type ModIndexRecord=z.infer<typeof modIndexRecord>;
