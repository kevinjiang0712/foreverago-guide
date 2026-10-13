'use client';

import Link from 'next/link';
import {useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';

export type SiteSearchEntry={id:string;href:string;title:string;description:string;section:string;keywords:string};

function normalizeSearch(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}

export function SiteSearch({entries,pathname,onOpen}:{entries:SiteSearchEntry[];pathname:string;onOpen:()=>void}){
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');
 const trigger=useRef<HTMLButtonElement>(null);const dialog=useRef<HTMLDialogElement>(null);const input=useRef<HTMLInputElement>(null);const results=useRef<HTMLUListElement>(null);
 const dialogId=useId();const headingId=useId();const resultsId=useId();
 const close=useCallback(()=>setOpen(false),[]);
 const show=useCallback(()=>{onOpen();setOpen(true);},[onOpen]);
 const normalizedQuery=normalizeSearch(query);
 const matches=useMemo(()=>{
  if(!normalizedQuery)return entries.slice(0,6);
  const terms=normalizedQuery.split(' ').filter(Boolean);
  return entries.map(entry=>{
   const title=normalizeSearch(entry.title),keywords=normalizeSearch(entry.keywords),description=normalizeSearch(entry.description);
   const searchable=`${title} ${keywords} ${description}`;
   if(!terms.every(term=>searchable.includes(term)))return {entry,score:0};
   return {entry,score:1+(title.includes(normalizedQuery)?8:0)+(keywords.includes(normalizedQuery)?4:0)+terms.filter(term=>title.includes(term)).length};
  }).filter(match=>match.score>0).sort((left,right)=>right.score-left.score||left.entry.title.localeCompare(right.entry.title)).map(match=>match.entry);
 },[entries,normalizedQuery]);
 useLayoutEffect(()=>{
  const panel=dialog.current,returnFocus=trigger.current;if(!open||!panel)return;
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.showModal();input.current?.focus();
  return()=>{panel.close();document.body.style.overflow=previousOverflow;returnFocus?.focus({preventScroll:true});};
 },[open]);
 useEffect(()=>{
  const shortcut=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement;
   if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!target.closest('input,textarea,select,[contenteditable="true"]')){event.preventDefault();show();}
  };
  document.addEventListener('keydown',shortcut);return()=>document.removeEventListener('keydown',shortcut);
 },[show]);
 useEffect(()=>{const frame=requestAnimationFrame(close);return()=>cancelAnimationFrame(frame);},[pathname,close]);
 function focusResult(position:number){const links=results.current?.querySelectorAll<HTMLAnchorElement>('a');if(links?.length)links[(position+links.length)%links.length]?.focus();}
 return <>
  <button ref={trigger} type="button" className="site-search-trigger" aria-label="Search guides" aria-haspopup="dialog" aria-controls={dialogId} onClick={show}>
   <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Search</span><kbd aria-hidden="true">/</kbd>
  </button>
  <dialog id={dialogId} ref={dialog} className="site-search-dialog" aria-labelledby={headingId} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
   <div className="site-search-panel">
    <div className="site-search-heading"><h2 id={headingId}>Find your next stop</h2><button type="button" className="site-close" aria-label="Close search" onClick={close}>×</button></div>
    <label className="site-search-input"><span className="sr-only">Search guides by title, keyword or question</span><input ref={input} type="search" value={query} placeholder="Search achievements, photos, chapters…" aria-controls={resultsId} autoComplete="off" onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='ArrowDown'&&matches.length){event.preventDefault();focusResult(0);}}}/></label>
    <p className="site-search-status" role="status">{normalizedQuery?`${matches.length} ${matches.length===1?'guide':'guides'} found`:'Popular starting points'}</p>
    <ul ref={results} id={resultsId} className="site-search-results" aria-label="Search results" onKeyDown={event=>{
     const links=Array.from(results.current?.querySelectorAll<HTMLAnchorElement>('a')??[]);const current=links.indexOf(document.activeElement as HTMLAnchorElement);
     if(event.key==='ArrowDown'){event.preventDefault();focusResult(current+1);}else if(event.key==='ArrowUp'){event.preventDefault();if(current===0)input.current?.focus();else focusResult(current-1);}
    }}>
     {matches.map(entry=><li key={entry.id}><Link href={entry.href} onClick={close}><span className="site-search-section">{entry.section}</span><strong>{entry.title}</strong><span className="site-search-description">{entry.description}</span></Link></li>)}
    </ul>
    {normalizedQuery&&!matches.length&&<div className="site-search-empty"><strong>No matching guide yet.</strong><p>Try a destination, achievement name, or a shorter phrase such as “camera” or “petals”.</p><button type="button" className="button button-ghost" onClick={()=>{setQuery('');input.current?.focus();}}>Show all starting points</button></div>}
    <p className="site-search-help">Use ↑ ↓ to move through results. Escape closes search.</p>
   </div>
  </dialog>
 </>;
}
