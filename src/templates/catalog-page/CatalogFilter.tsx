'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {ListFacet} from '../list-page/model';

export function CatalogFilter({facet,values,all,clear,onChange}:{facet:ListFacet;values:string[];all:string;clear:string;onChange:(values:string[])=>void}){
 const id=useId(),host=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);
 const selection=facet.options.filter(option=>values.includes(option.id)).map(option=>option.label).join(', ')||all;
 useEffect(()=>{
  if(!open)return;
  host.current?.querySelector<HTMLElement>('.catalog-filter-options')?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  const closeOutside=(event:PointerEvent)=>{if(!host.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',closeOutside);
  return()=>document.removeEventListener('pointerdown',closeOutside);
 },[open]);
 return <div className="catalog-filter" ref={host} data-facet={facet.id}
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}
  onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
  <label className="visually-hidden" id={`${id}-label`} htmlFor={`${id}-control`}>{facet.label}</label>
  {facet.multiple?<>
   <button ref={trigger} id={`${id}-control`} type="button" className="catalog-filter-trigger" disabled={Boolean(facet.disabledReason)} aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-options`} aria-describedby={facet.disabledReason?`${id}-reason`:undefined} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);requestAnimationFrame(()=>host.current?.querySelector<HTMLInputElement>('input')?.focus());}}}>
    <span id={`${id}-value`} title={`${facet.label}: ${selection}`}><span aria-hidden="true">{facet.label}: </span>{selection}</span><span aria-hidden="true">⌄</span>
   </button>
   {open&&<div id={`${id}-options`} className="catalog-filter-options" role="group" aria-labelledby={`${id}-label`}>
    {facet.options.map(option=><label key={option.id}><input type="checkbox" checked={values.includes(option.id)} onChange={()=>onChange(values.includes(option.id)?values.filter(value=>value!==option.id):[...values,option.id])}/><span>{option.label}</span></label>)}
    <button type="button" className="catalog-filter-clear" disabled={!values.length} onClick={()=>onChange([])}>{clear}</button>
   </div>}
  </>:<select id={`${id}-control`} value={values[0]??''} disabled={Boolean(facet.disabledReason)} aria-describedby={facet.disabledReason?`${id}-reason`:undefined} onChange={event=>onChange(event.target.value?[event.target.value]:[])}>
   <option value="">{facet.label}: {all}</option>{facet.options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
  </select>}
  {facet.disabledReason&&<p id={`${id}-reason`}>{facet.disabledReason}</p>}
 </div>;
}
