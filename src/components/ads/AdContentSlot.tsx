'use client';
import {RevenueAd} from './RevenueAd';
import {useAds} from './AdProvider';
export function AdContentSlot({slot='native'}:{slot?:'native'|'inline'}){
 const context=useAds();
 if(!context||context.ads.mode==='disabled')return null;
 return <RevenueAd key={`${context.path}:${slot}`} slot={slot}/>;
}
