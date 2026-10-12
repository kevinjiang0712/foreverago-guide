import {z} from 'zod';
import {safeId} from './common';

const target=(anchor:string,position:'before'|'after')=>({anchor,position});
const placementTargetSchema=z.strictObject({anchor:safeId,position:z.enum(['before','after'])});
const defaultA2Placements={
 'site-home':target('featured','after'),
 'list-page':target('result-grid','after'),
 'article-page':target('content-midpoint','after'),
 'weapon-explorer':target('explorer','after'),
 'interactive-map':target('locations','after'),
};
const defaultPlacements={
 a1:target('site-header','after'),
 a2:defaultA2Placements,
 a3:target('site-footer','before'),
};

const scriptUrlSchema=z.url().refine(value=>{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash;},'Ad script URL must be HTTPS without credentials or fragment');
const bannerUnitSchema=z.strictObject({key:z.string().regex(/^[a-zA-Z0-9_-]+$/),scriptUrl:scriptUrlSchema});

export const adsSchema=z.strictObject({
 mode:z.enum(['disabled','placeholder','adsterra']),
 adsterra:z.strictObject({
  allowedHosts:z.array(z.string().regex(/^(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i)).min(1),
  units:z.strictObject({
   native:z.strictObject({containerId:z.string().regex(/^container-[a-zA-Z0-9_-]+$/),scriptUrl:scriptUrlSchema}).optional(),
   left:bannerUnitSchema.optional(),right:bannerUnitSchema.optional(),inline:bannerUnitSchema.optional(),anchor:bannerUnitSchema.optional(),
  }),
 }).optional(),
 placements:z.strictObject({
  a1:placementTargetSchema.default(defaultPlacements.a1),
  a2:z.strictObject({
   'site-home':placementTargetSchema.default(defaultA2Placements['site-home']),
   'list-page':placementTargetSchema.default(defaultA2Placements['list-page']),
   'article-page':placementTargetSchema.default(defaultA2Placements['article-page']),
   'weapon-explorer':placementTargetSchema.default(defaultA2Placements['weapon-explorer']),
   'interactive-map':placementTargetSchema.default(defaultA2Placements['interactive-map']),
  }).default(defaultA2Placements),
  a3:placementTargetSchema.default(defaultPlacements.a3),
 }).default(defaultPlacements),
}).superRefine((ads,ctx)=>{
 if(ads.mode==='adsterra'&&!ads.adsterra)ctx.addIssue({code:'custom',path:['adsterra'],message:'adsterra mode requires target hosts and approved units'});
 const units=ads.adsterra?.units;if(!units)return;
 if(!Object.keys(units).length)ctx.addIssue({code:'custom',path:['adsterra','units'],message:'At least one approved unit is required'});
 const keys=new Set<string>();
 for(const slot of ['left','right','inline','anchor'] as const){const unit=units[slot];if(!unit)continue;if(keys.has(unit.key))ctx.addIssue({code:'custom',path:['adsterra','units',slot,'key'],message:`Duplicate Banner key: ${unit.key}`});keys.add(unit.key);}
});

export type AdsConfig=z.infer<typeof adsSchema>;
export type AdTemplate=keyof AdsConfig['placements']['a2'];
export type AdTarget=AdsConfig['placements']['a1'];
export const disabledAds:AdsConfig=adsSchema.parse({mode:'disabled'});
