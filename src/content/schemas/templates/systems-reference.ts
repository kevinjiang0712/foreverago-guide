import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy} from '../record-base';
// Only installed, theme-coloured hairline SVGs are accepted here.
export const mechanismIcon=z.enum(['route','collectible','clock','tip','clash','issen','soul','arrow-right','alert','list']);
export const systemsReferenceRecord=z.strictObject({...recordBase,type:z.literal('systems-reference'),mechanics:sectionCopy,combos:sectionCopy,items:sectionCopy,diagramAssetId:safeId.nullable(),mechanisms:z.array(z.strictObject({id:safeId,icon:mechanismIcon,title:text,description:text,verification})).min(1),comboRoutes:z.array(z.strictObject({id:safeId,name:text,input:text.nullable(),frames:z.number().int().nonnegative().nullable(),use:text.nullable(),verification})),itemIds:z.array(safeId),stats:z.array(z.strictObject({itemId:safeId,attack:z.number().finite().nonnegative().nullable(),speed:z.number().finite().nonnegative().nullable(),note:text,verification})),columns:z.strictObject({route:text,input:text,frames:text,use:text,item:text,attack:text,speed:text,notes:text})}).superRefine((record,ctx)=>{
 for(const field of ['mechanisms','comboRoutes'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});}
 if(new Set(record.itemIds).size!==record.itemIds.length)ctx.addIssue({code:'custom',path:['itemIds'],message:'duplicate item IDs'});
 const statIds=new Set<string>();record.stats.forEach((stat,i)=>{if(!record.itemIds.includes(stat.itemId))ctx.addIssue({code:'custom',path:['stats',i,'itemId'],message:`stat item ${stat.itemId} must be in itemIds`});if(statIds.has(stat.itemId))ctx.addIssue({code:'custom',path:['stats',i,'itemId'],message:`duplicate stat item ${stat.itemId}`});statIds.add(stat.itemId);});
});
export type SystemsReferenceRecord=z.infer<typeof systemsReferenceRecord>;
