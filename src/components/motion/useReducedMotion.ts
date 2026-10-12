'use client';
import {useSyncExternalStore} from 'react';
const query='(prefers-reduced-motion: reduce)';
function subscribe(listener:()=>void){const media=window.matchMedia(query);media.addEventListener('change',listener);return()=>media.removeEventListener('change',listener);}
export function useReducedMotion(){return useSyncExternalStore(subscribe,()=>window.matchMedia(query).matches,()=>false);}
export function motionMilliseconds(element:Element,name:string,fallback:number):number{
 const value=getComputedStyle(element).getPropertyValue(name).trim();const amount=parseFloat(value);
 return Number.isFinite(amount)?amount*(value.endsWith('ms')?1:value.endsWith('s')?1000:1):fallback;
}
