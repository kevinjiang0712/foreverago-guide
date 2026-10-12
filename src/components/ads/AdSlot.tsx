import {AdContentSlot} from './AdContentSlot';
import type {AdsConfig,AdTarget,AdTemplate} from '@/content/schemas/ads';
import {AdPlaceholder,type AdPlacement} from './AdPlaceholder';

type ConfiguredPlacement='a1'|'a2'|'a3';

export function configuredAdTarget(ads:AdsConfig,placement:ConfiguredPlacement,template?:AdTemplate):AdTarget{
 if(placement!=='a2')return ads.placements[placement];
 if(!template)throw new Error('configuredAdTarget: A2 requires a page template');
 return ads.placements.a2[template];
}

export function assertAdAnchor(ads:AdsConfig,placement:ConfiguredPlacement,anchors:string[],template?:AdTemplate){
 const {anchor}=configuredAdTarget(ads,placement,template);
 if(!anchors.includes(anchor))throw new Error(`${template??'site-shell'}: configured ${placement.toUpperCase()} anchor "${anchor}" is unavailable; expected one of ${anchors.join(', ')}`);
}

export function isAdTarget(ads:AdsConfig,placement:ConfiguredPlacement,anchor:string,position:'before'|'after',template?:AdTemplate){
 const target=configuredAdTarget(ads,placement,template);
 return target.anchor===anchor&&target.position===position;
}

export function ConfiguredAdSlot({ads,mode,placement,template,anchor,position}:{ads:AdsConfig;mode?:AdsConfig['mode'];placement:ConfiguredPlacement;template?:AdTemplate;anchor:string;position:'before'|'after';className?:string}){
 if(!isAdTarget(ads,placement,anchor,position,template))return null;
 if((mode??ads.mode)==='disabled')return null;
 return placement==='a2'?<AdContentSlot slot="inline"/>:null;
}

export function AdSlot({mode,placement,className}:{mode:AdsConfig['mode'];placement:AdPlacement;className?:string}){
 if(mode==='disabled')return null;
 return <AdPlaceholder placement={placement} className={className}/>;
}
