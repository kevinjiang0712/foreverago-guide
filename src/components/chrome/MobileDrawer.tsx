'use client';
import {useLayoutEffect,useId,useRef,type ReactNode,type RefObject} from 'react';
import type {BrandModel} from '@/content/navigation';
import {Brand} from './SiteFooter';
import {useLocale,acquireModalLock} from './LocaleContext';
export function MobileDrawer({open,collapsed,onClose,triggerRef,brand,children,id}:{open:boolean;collapsed:boolean;onClose:()=>void;triggerRef:RefObject<HTMLButtonElement|null>;brand:BrandModel;children:ReactNode;id:string}){
 const panel=useRef<HTMLDivElement>(null);const closeButton=useRef<HTMLButtonElement>(null);const headingId=useId();const {dictionary,backgroundRef}=useLocale();
 useLayoutEffect(()=>{
  if(!open)return;
  const trigger=triggerRef.current;const content=backgroundRef.current;const masthead=panel.current?.parentElement;const siblings=Array.from(masthead?.children??[]).filter((element):element is HTMLElement=>element!==panel.current&&element instanceof HTMLElement);
  const release=acquireModalLock([...(content?[content]:[]),...siblings]);closeButton.current?.focus();
  const contain=(event:FocusEvent)=>{if(panel.current&&!panel.current.contains(event.target as Node))closeButton.current?.focus();};document.addEventListener('focusin',contain);
  return()=>{release();document.removeEventListener('focusin',contain);trigger?.focus();};
 },[open,backgroundRef,triggerRef]);
 return <div ref={panel} id={id} className="site-nav-body" data-open={open} role={collapsed?'dialog':undefined} aria-modal={collapsed?true:undefined} aria-labelledby={collapsed?headingId:undefined} inert={collapsed&&!open} onKeyDown={event=>{
  if(!open)return;
  if(event.key==='Escape'){event.preventDefault();onClose();}
  if(event.key==='Tab'){
   const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]')??[]).filter(element=>!element.closest('[inert]')&&element.getClientRects().length>0);
   const first=elements[0],last=elements.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 }}>
  <div className="site-drawer-top"><Brand brand={brand}/><span id={headingId} className="sr-only">{dictionary.ui.mainMenu}</span><button ref={closeButton} className="site-close" type="button" aria-label={dictionary.ui.close} onClick={onClose}>×</button></div>
  {children}
 </div>;
}
