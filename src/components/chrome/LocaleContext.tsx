'use client';
import {createContext,useContext,useRef,type ReactNode,type RefObject} from 'react';
import type {Dictionary} from '@/content/schemas/dictionary';
type LocaleValue={locale:string;dictionary:Dictionary;homeHref:string;backgroundRef:RefObject<HTMLDivElement|null>};
const LocaleContext=createContext<LocaleValue|null>(null);
export function LocaleProvider({locale,dictionary,homeHref,children}:{locale:string;dictionary:Dictionary;homeHref:string;children:ReactNode}){
 const backgroundRef=useRef<HTMLDivElement>(null);
 return <LocaleContext.Provider value={{locale,dictionary,homeHref,backgroundRef}}>{children}</LocaleContext.Provider>;
}
export function useLocale(){const context=useContext(LocaleContext);if(!context)throw new Error('useLocale requires LocaleProvider');return context;}
export function ShellBackground({children}:{children:ReactNode}){const {backgroundRef}=useLocale();return <div ref={backgroundRef} data-shell-background>{children}</div>;}

// Nested dialogs share ownership: either cleanup order releases only its own lock.
const inertLocks=new WeakMap<HTMLElement,{count:number;previous:boolean}>();
let scrollLocks=0;
let previousOverflow='';
export function acquireModalLock(elements:HTMLElement[]):()=>void{
 const unique=[...new Set(elements)];
 if(scrollLocks++===0){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
 for(const element of unique){const existing=inertLocks.get(element);if(existing)existing.count++;else{inertLocks.set(element,{count:1,previous:element.inert});element.inert=true;}}
 let released=false;
 return()=>{
  if(released)return;released=true;
  for(const element of unique){const lock=inertLocks.get(element);if(!lock)throw new Error('Modal inert lock missing');if(--lock.count===0){element.inert=lock.previous;inertLocks.delete(element);}}
  if(--scrollLocks===0)document.body.style.overflow=previousOverflow;
 };
}
