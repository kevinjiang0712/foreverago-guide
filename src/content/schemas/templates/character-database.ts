import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy,fact,unrevealedSlot} from '../record-base';
export const characterRecord=z.strictObject({...recordBase,type:z.literal('character'),name:text,role:text,summary:text,contentId:safeId.nullable(),assetId:safeId.nullable(),attributes:z.array(fact)});
export const characterDatabaseRecord=z.strictObject({...recordBase,type:z.literal('character-database'),leadCharacterId:safeId,characterIds:z.array(safeId).min(1),leadLabel:text,cast:sectionCopy,connections:sectionCopy,unrevealed:unrevealedSlot.nullable(),relationNote:text,relations:z.array(z.strictObject({fromId:safeId,toId:safeId,type:safeId,label:text,verification,sourceLabel:text.nullable()}))}).superRefine((record,ctx)=>{
 if(new Set(record.characterIds).size!==record.characterIds.length)ctx.addIssue({code:'custom',path:['characterIds'],message:'duplicate character IDs'});
 if(!record.characterIds.includes(record.leadCharacterId))ctx.addIssue({code:'custom',path:['leadCharacterId'],message:`lead ${record.leadCharacterId} must be in characterIds`});
 record.relations.forEach((relation,i)=>{for(const field of ['fromId','toId'] as const)if(!record.characterIds.includes(relation[field]))ctx.addIssue({code:'custom',path:['relations',i,field],message:`unknown cast ID ${relation[field]}`});});
});
export type CharacterRecord=z.infer<typeof characterRecord>;
export type CharacterDatabaseRecord=z.infer<typeof characterDatabaseRecord>;
