'use client';
import Link from 'next/link';
import {acquireModalLock} from '@/components/chrome/LocaleContext';
import {useCallback,useEffect,useLayoutEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
export type PickerOption={value:string;label:string;href?:string;description?:string;disabled?:boolean};
export type PickerProps={label:string;closeLabel:string;value:string;displayValue?:string;options:PickerOption[];onChange?:(value:string)=>void;onNavigate?:()=>void;naked?:boolean};
export function Picker({label,closeLabel,value,displayValue,options,onChange,onNavigate,naked=false}:PickerProps){
 const id=useId();const trigger=useRef<HTMLButtonElement>(null);const host=useRef<HTMLSpanElement>(null);const panel=useRef<HTMLDivElement>(null);const [open,setOpen]=useState(false);const [mobile,setMobile]=useState(false);
 const close=useCallback((restore=true)=>{setOpen(false);if(restore)trigger.current?.focus();},[]);
 useEffect(()=>{const query=window.matchMedia('(max-width: 767px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{
  if(!open)return;
  const selected=panel.current?.querySelector<HTMLElement>('[aria-selected="true"]:not([aria-disabled="true"])');
  (selected??panel.current?.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])'))?.focus();
  const outside=(event:PointerEvent)=>{if(!host.current?.contains(event.target as Node))close(false);};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[open,close]);
 useLayoutEffect(()=>{
  if(!open||!mobile)return;
  const background:HTMLElement[]=[];
  let branch:HTMLElement|null=host.current;
  while(branch&&branch!==document.body){const parent:HTMLElement|null=branch.parentElement;if(!parent)break;for(const sibling of parent.children)if(sibling!==branch&&sibling instanceof HTMLElement)background.push(sibling);branch=parent;}
  return acquireModalLock(background);
 },[open,mobile]);
 function select(option:PickerOption){if(option.disabled)return;onChange?.(option.value);close();if(option.href)onNavigate?.();}
 function keys(event:KeyboardEvent){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
  const rows=Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])')??[]);
  const current=rows.indexOf(document.activeElement as HTMLElement);
  const movement=event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0;
  if(movement||event.key==='Home'||event.key==='End'){
   event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?rows.length-1:(current+movement+rows.length)%rows.length;rows[next]?.focus();
  }
  if(event.key==='Tab'){
   if(!mobile){close(false);return;}
   const focusable=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')??[]);
   event.preventDefault();event.stopPropagation();const current=focusable.indexOf(document.activeElement as HTMLElement);focusable[(current+(event.shiftKey?-1:1)+focusable.length)%focusable.length]?.focus();
  }
 }
 return <span ref={host} className={`site-picker${naked?' site-picker-naked':''}`} data-picker>
  <button ref={trigger} className="site-picker-trigger" type="button" aria-label={label} aria-haspopup={mobile?'dialog':'listbox'} aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);}}}>{displayValue??options.find(option=>option.value===value)?.label??label}<span className="site-caret" aria-hidden="true"/></button>
  {open&&<><div className="site-picker-backdrop" hidden={!mobile} onClick={()=>close()} aria-hidden="true"/><div ref={panel} id={id} data-picker-panel className={`site-picker-panel${mobile?' site-picker-sheet':''}`} role={mobile?'dialog':undefined} aria-modal={mobile?true:undefined} aria-label={mobile?label:undefined} onKeyDown={keys}>
   {mobile&&<div className="site-picker-heading"><span>{label}</span><button type="button" aria-label={closeLabel} className="site-close" onClick={()=>close()}>×</button></div>}
   <div role="listbox" aria-label={label}>{options.map(option=>{
    const properties={className:'site-picker-row',role:'option','aria-selected':option.value===value,'aria-disabled':option.disabled||undefined,tabIndex:-1};
    const content=<><span>{option.label}{option.description&&<small>{option.description}</small>}</span></>;
    return option.disabled?<div key={option.value} {...properties}>{content}</div>:option.href?<Link key={option.value} {...properties} href={option.href} onClick={()=>select(option)} onKeyDown={event=>{if(event.key===' '){event.preventDefault();event.currentTarget.click();}}}>{content}</Link>:<button key={option.value} type="button" {...properties} onClick={()=>select(option)}>{content}</button>;
   })}</div>
  </div></>}
 </span>;
}
