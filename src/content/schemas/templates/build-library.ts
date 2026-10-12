import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy,fact} from '../record-base';
const equipment=z.strictObject({recordId:safeId.nullable(),label:text,value:text.nullable()});
const priority=z.strictObject({id:safeId,priority:text,items:text,instruction:text});
const setup={skills:z.array(z.strictObject({id:safeId,name:text,value:text.nullable()})).default([]),equipment:z.array(equipment),bestFor:text,avoidIf:text,howItWorks:text,artifactPriority:z.array(priority),buildOrder:z.array(text),howToPlay:text,risks:text,evidenceNote:text,verification};
export const buildRecord=z.strictObject({...recordBase,type:z.literal('build'),name:text,summary:text,assetId:safeId.nullable(),classIds:z.array(safeId).default([]),playstyleIds:z.array(safeId),weaponIds:z.array(safeId),facts:z.array(fact),...setup,variants:z.array(z.strictObject({id:safeId.refine(id=>id!=='base','base is reserved for the default configuration'),label:text,...setup}))}).superRefine((record,ctx)=>{
 for(const field of ['classIds','playstyleIds','weaponIds'] as const)if(new Set(record[field]).size!==record[field].length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});
 if(new Set(record.variants.map(row=>row.id)).size!==record.variants.length)ctx.addIssue({code:'custom',path:['variants'],message:'duplicate variant IDs'});
 const checkSkills=(rows:typeof record.skills,path:(string|number)[])=>{if(new Set(rows.map(row=>row.id)).size!==rows.length)ctx.addIssue({code:'custom',path,message:'duplicate skill IDs'});};checkSkills(record.skills,['skills']);record.variants.forEach((variant,i)=>checkSkills(variant.skills,['variants',i,'skills']));
 const checkPriority=(rows:typeof record.artifactPriority,path:(string|number)[])=>{if(new Set(rows.map(row=>row.id)).size!==rows.length)ctx.addIssue({code:'custom',path,message:'duplicate priority IDs'});};checkPriority(record.artifactPriority,['artifactPriority']);record.variants.forEach((variant,i)=>checkPriority(variant.artifactPriority,['variants',i,'artifactPriority']));
});
const option=z.strictObject({id:safeId.refine(id=>id!=='all','all is reserved for the reset filter'),label:text});
export const buildLibraryRecord=z.strictObject({...recordBase,type:z.literal('build-library'),sections:z.strictObject({evidence:sectionCopy,find:sectionCopy,setups:sectionCopy,presets:sectionCopy,rescue:sectionCopy,faq:sectionCopy}),evidenceLegend:z.array(z.strictObject({id:safeId,label:text,description:text,verification})),filterOptions:z.strictObject({classes:z.array(option).default([]),playstyles:z.array(option),weapons:z.array(option)}),buildIds:z.array(safeId),presets:z.array(z.strictObject({id:safeId,buildId:safeId,title:text,code:text,description:text,verification})),rescueRows:z.array(z.strictObject({id:safeId,buildId:safeId,protectFirst:text.nullable(),ifMissing:text.nullable(),pivot:text.nullable(),verification})),faq:z.array(z.strictObject({id:safeId,question:text,answer:text,verification})),columns:z.strictObject({build:text,protectFirst:text,ifMissing:text,pivot:text})}).superRefine((record,ctx)=>{
 for(const field of ['classes','playstyles','weapons'] as const){const ids=record.filterOptions[field].map(option=>option.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:['filterOptions',field],message:'duplicate filter IDs'});}
 for(const field of ['evidenceLegend','presets','rescueRows','faq'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});}

 if(new Set(record.buildIds).size!==record.buildIds.length)ctx.addIssue({code:'custom',path:['buildIds'],message:'duplicate build IDs'});
});
export type BuildRecord=z.infer<typeof buildRecord>;
export type BuildLibraryRecord=z.infer<typeof buildLibraryRecord>;
