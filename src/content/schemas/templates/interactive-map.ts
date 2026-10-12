import {z} from 'zod';
import {safeId,text,verification} from '../common';
import {recordBase,sectionCopy} from '../record-base';
const total=z.number().int().nonnegative().nullable();
export const mapRegion=z.strictObject({id:safeId,label:text,chapterLabel:text,imageAssetId:safeId.nullable(),width:z.number().int().positive(),height:z.number().int().positive(),plateLabel:text,plateNote:text,knownTotal:total,disabled:z.boolean(),verification});
export const mapCategory=z.strictObject({id:safeId,label:text,description:text,icon:text.max(4),tone:z.enum(['accent-text','marker','ok','warn','text-secondary','text-caption','marker-soft'])});
export const mapPin=z.strictObject({id:safeId,regionId:safeId,categoryId:safeId,xPercent:z.number().finite().min(0).max(100),yPercent:z.number().finite().min(0).max(100),label:text,description:text,contentId:safeId.nullable(),collectible:z.boolean(),verification});
const instruction=z.strictObject({id:safeId,title:text,description:text,verification});
export const interactiveMapRecord=z.strictObject({...recordBase,type:z.literal('interactive-map'),mapId:safeId,dataVersion:safeId,knownTotal:total,
 sections:z.strictObject({map:sectionCopy,legend:sectionCopy,locations:sectionCopy,progress:sectionCopy,'how-to':sectionCopy,faq:sectionCopy}),
 regions:z.array(mapRegion).min(1),categories:z.array(mapCategory).min(1),pins:z.array(mapPin),mapNote:text,locationsNote:text,
 progressImageAssetId:safeId.nullable(),progressImageLabel:text,progressCaption:text,instructions:z.array(instruction),
 faq:z.array(z.strictObject({id:safeId,question:text,answer:text,verification})),
}).superRefine((record,ctx)=>{
 const issue=(path:(string|number)[],message:string)=>ctx.addIssue({code:'custom',path,message});
 for(const field of ['regions','categories','pins','instructions','faq'] as const){const ids=record[field].map(row=>row.id);if(new Set(ids).size!==ids.length)issue([field],'duplicate IDs');}
 if(!record.regions.some(region=>!region.disabled))issue(['regions'],'requires at least one enabled region');
 record.pins.forEach((pin,i)=>{if(!record.regions.some(region=>region.id===pin.regionId))issue(['pins',i,'regionId'],`unknown region ${pin.regionId}`);if(!record.categories.some(category=>category.id===pin.categoryId))issue(['pins',i,'categoryId'],`unknown category ${pin.categoryId}`);});
 if(record.knownTotal!==null&&record.knownTotal<record.pins.filter(pin=>pin.collectible).length)issue(['knownTotal'],'cannot be less than supplied collectible pins');
 record.regions.forEach((region,i)=>{if(region.knownTotal!==null&&region.knownTotal<record.pins.filter(pin=>pin.regionId===region.id&&pin.collectible).length)issue(['regions',i,'knownTotal'],'cannot be less than supplied collectible pins');});
});
export type InteractiveMapRecord=z.infer<typeof interactiveMapRecord>;
export type MapPin=z.infer<typeof mapPin>;
export type MapRegion=z.infer<typeof mapRegion>;
export type MapCategory=z.infer<typeof mapCategory>;
