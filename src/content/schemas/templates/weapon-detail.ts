import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy,fact} from '../record-base';
import {validateUpgradeTree} from '../../upgrade-tree';
const itemFields={...recordBase,name:text,kind:text,summary:text,contentId:safeId.nullable(),assetId:safeId.nullable(),iconAssetId:safeId.nullable(),facts:z.array(fact),tags:z.array(text)};
export const weaponRecord=z.strictObject({...itemFields,type:z.literal('weapon')});
export const itemRecord=z.strictObject({...itemFields,type:z.literal('item')});
export const weaponDetailRecord=z.strictObject({...recordBase,type:z.literal('weapon-detail'),weaponId:safeId,gallery:z.array(safeId),namingNote:text.nullable(),heroLabel:text,primaryCta:text,secondaryCta:text,overview:sectionCopy,unlock:sectionCopy,detail:sectionCopy,matchupSection:sectionCopy,pairingSection:sectionCopy,faqSection:sectionCopy,atAGlance:text,
 unlockSteps:z.array(z.strictObject({id:safeId,title:text,description:text,verification})),evidenceNote:text,
 moveset:z.array(z.strictObject({id:safeId,action:text,input:text.nullable(),frames:z.number().int().nonnegative().nullable(),coverage:text.nullable(),notes:text,verification})),movesetNote:text,
 upgradeNodes:z.array(z.strictObject({id:safeId,parentId:safeId.nullable(),tier:z.union([z.literal(1),z.literal(2),z.literal(3)]),name:text,description:text,verification})),upgradeNote:text,
 patchHistory:z.array(z.strictObject({id:safeId,version:text.nullable(),change:text,verification})),patchNote:text,
 buildRefs:z.array(z.strictObject({contentId:safeId,description:text,verification})),
 matchups:z.array(z.strictObject({id:safeId,situation:text,contentId:safeId.nullable(),result:text.nullable(),answer:text.nullable(),verification})),
 pairings:z.array(z.strictObject({recordId:safeId,description:text,verification})),
 faq:z.array(z.strictObject({id:safeId,question:text,answer:text,verification})),
 tabs:z.strictObject({moveset:text,upgrades:text,changes:text,builds:text}),columns:z.strictObject({action:text,input:text,frames:text,coverage:text,notes:text,patch:text,change:text,source:text,situation:text,result:text,answer:text})
}).superRefine((record,ctx)=>{
 for(const field of ['gallery'] as const)if(new Set(record[field]).size!==record[field].length)ctx.addIssue({code:'custom',path:[field],message:`duplicate ${field} IDs`});
 for(const field of ['unlockSteps','moveset','patchHistory','matchups','faq'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});}
 for(const [field,ids] of [['buildRefs',record.buildRefs.map(row=>row.contentId)],['pairings',record.pairings.map(row=>row.recordId)]] as const)if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate references'});
 try{validateUpgradeTree(record.upgradeNodes);}catch(error){if(!(error instanceof Error))throw error;ctx.addIssue({code:'custom',path:['upgradeNodes'],message:error.message});}
});
export type WeaponRecord=z.infer<typeof weaponRecord>;
export type ItemRecord=z.infer<typeof itemRecord>;
export type WeaponDetailRecord=z.infer<typeof weaponDetailRecord>;
