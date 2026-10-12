import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy,fact} from '../record-base';
import {validateUpgradeTree} from '../../upgrade-tree';
export const weaponExplorerRecord=z.strictObject({...recordBase,type:z.literal('weapon-explorer'),riskLabel:text,upgradeMedia:z.strictObject({assetId:safeId.nullable(),fallbackLabel:text,caption:text}),unlockSummary:text,sections:z.strictObject({comparison:sectionCopy,explorer:sectionCopy,playstyles:sectionCopy,details:sectionCopy,tier:sectionCopy,unlocks:sectionCopy,upgrades:sectionCopy,changes:sectionCopy,faq:sectionCopy}),
 comparison:z.array(z.strictObject({weaponId:safeId,identity:text,action:text.nullable(),learning:text.nullable(),bestFor:text,tradeoff:text,verification})),
 treeNodes:z.array(z.strictObject({id:safeId,parentId:safeId.nullable(),tier:z.union([z.literal(1),z.literal(2),z.literal(3)]),label:text,details:text,verification,iconAssetId:safeId.nullable()})),treeNotes:z.tuple([text,text,text]),
 playstylePicks:z.array(z.strictObject({id:safeId,label:text,weaponId:safeId,description:text,risk:text.nullable(),verification})),
 detailSections:z.array(z.strictObject({id:safeId,weaponId:safeId,label:text,facts:z.array(fact),verification})),
 tierRows:z.array(z.strictObject({id:safeId,tier:text.nullable(),weaponIds:z.array(safeId),reason:text,whenToMove:text.nullable(),verification})),
 unlockRows:z.array(z.strictObject({weaponId:safeId,method:text.nullable(),cost:text.nullable(),evidence:text.nullable(),verification})),
 upgradeExplanation:z.array(z.strictObject({id:safeId,title:text,description:text,verification})),
 patchHistory:z.array(z.strictObject({id:safeId,version:text.nullable(),weaponId:safeId.nullable(),subject:text.nullable(),change:text,verification})),
 faq:z.array(z.strictObject({id:safeId,question:text,answer:text,verification})),columns:z.strictObject({weapon:text,identity:text,action:text,learning:text,bestFor:text,tradeoff:text,tier:text,reason:text,unlock:text,version:text,change:text,whenToMove:text,cost:text,evidence:text,subject:text})
}).superRefine((record,ctx)=>{
 try{validateUpgradeTree(record.treeNodes);}catch(error){if(!(error instanceof Error))throw error;ctx.addIssue({code:'custom',path:['treeNodes'],message:error.message});}
 for(const field of ['playstylePicks','detailSections','tierRows','upgradeExplanation','patchHistory','faq'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});}
 for(const field of ['comparison','unlockRows'] as const){const ids=record[field].map(row=>row.weaponId);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate weapon IDs'});}

});
export type WeaponExplorerRecord=z.infer<typeof weaponExplorerRecord>;
