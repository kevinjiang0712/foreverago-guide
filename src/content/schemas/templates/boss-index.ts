import {z} from 'zod';
import {safeId,text,verification,labeledLink} from '../common';
import {recordBase,sectionCopy,fact,unrevealedSlot} from '../record-base';
export const bossEntry=z.strictObject({id:safeId,name:text,contentId:safeId.nullable(),assetId:safeId.nullable(),difficultyId:safeId.nullable(),phaseCount:z.number().int().positive().nullable(),tags:z.array(text),verification});
export const bossIndexRecord=z.strictObject({...recordBase,type:z.literal('boss-index'),entities:z.array(bossEntry),filterOptions:z.array(z.strictObject({id:safeId,label:text})),knownTotal:z.number().int().nonnegative().nullable(),index:sectionCopy,unrevealed:unrevealedSlot.nullable(),detail:z.strictObject({entityId:safeId,eyebrow:text,stats:z.array(fact),facts:z.array(fact),videoAssetId:safeId.nullable(),attacksTitle:text,columns:z.strictObject({attack:text,phase:text,windUp:text,answer:text}),attacks:z.array(z.strictObject({id:safeId,name:text,phases:z.array(z.number().int().positive()).nullable(),windUpFrames:z.number().int().nonnegative().nullable(),answer:text.nullable(),verification}))}).nullable(),footer:z.strictObject({note:text,link:labeledLink.nullable()})}).superRefine((record,ctx)=>{
 const ids=record.entities.map(e=>e.id);const options=record.filterOptions.map(o=>o.id);
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:['entities'],message:'duplicate boss IDs'});
 if(new Set(options).size!==options.length)ctx.addIssue({code:'custom',path:['filterOptions'],message:'duplicate difficulty IDs'});
 record.entities.forEach((entry,i)=>{if(entry.difficultyId&&!options.includes(entry.difficultyId))ctx.addIssue({code:'custom',path:['entities',i,'difficultyId'],message:`unknown difficulty ID ${entry.difficultyId}`});});
 if(record.knownTotal!==null&&record.knownTotal<ids.length)ctx.addIssue({code:'custom',path:['knownTotal'],message:'knownTotal cannot be smaller than named entities'});
 if(record.detail&&!ids.includes(record.detail.entityId))ctx.addIssue({code:'custom',path:['detail','entityId'],message:`unknown boss ID ${record.detail.entityId}`});
});
export type BossEntry=z.infer<typeof bossEntry>;
export type BossIndexRecord=z.infer<typeof bossIndexRecord>;
