import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy} from '../record-base';

export const characterDetailRecord=z.strictObject({
 ...recordBase,type:z.literal('character-detail'),characterId:safeId,
 sections:z.strictObject({attributes:sectionCopy,skills:sectionCopy,acquisition:sectionCopy}),
 labels:z.strictObject({cost:text,cooldown:text,prerequisites:text,location:text,version:text,updated:text,skillArtwork:text}),
 attributeNote:text.nullable(),
 skills:z.array(z.strictObject({id:safeId,name:text,kind:text,description:text,iconAssetId:safeId.nullable(),cost:text.nullable(),cooldown:text.nullable(),verification})),
 acquisition:z.strictObject({prerequisites:text.nullable(),location:text.nullable(),steps:z.array(z.strictObject({id:safeId,title:text,description:text,verification}))}),
}).superRefine((record,ctx)=>{
 for(const [path,rows] of [['skills',record.skills],['acquisition.steps',record.acquisition.steps]] as const){
  const seen=new Set<string>();rows.forEach((row,i)=>{if(seen.has(row.id))ctx.addIssue({code:'custom',path:[...path.split('.'),i,'id'],message:`duplicate ID ${row.id}`});seen.add(row.id);});
 }
});
export type CharacterDetailRecord=z.infer<typeof characterDetailRecord>;
