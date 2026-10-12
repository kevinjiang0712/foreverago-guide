'use client';
import {Fragment,useId,useLayoutEffect,useRef,useState} from 'react';
import Link from 'next/link';
import type {Dictionary} from '@/content/schemas/dictionary';
import type {AdsConfig} from '@/content/schemas/ads';
import {Media} from '@/components/content/Media';
import {AdContentSlot} from '@/components/ads/AdContentSlot';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
import type {ListModel} from './model';

export function ListBrowser({model,locale,copy,ads,compactCards}:{model:ListModel;locale:string;copy:Dictionary['ui'];ads:AdsConfig;compactCards:boolean}){
 const {entries,facets,perPage,sortOptions}=model;
 const [query,setQuery]=useState('');const [selected,setSelected]=useState<Record<string,string[]>>({});const [page,setPage]=useState(1);const [sort,setSort]=useState(sortOptions?.[0]?.id??'listed');
 const resultsId=useId();const resultsRef=useRef<HTMLDivElement>(null);const pendingPageScroll=useRef(false);
 useLayoutEffect(()=>{
  const results=resultsRef.current;if(!pendingPageScroll.current||!results)return;
  pendingPageScroll.current=false;results.focus({preventScroll:true});
  const offset=parseFloat(getComputedStyle(results).scrollMarginTop);
  window.scrollTo({top:results.getBoundingClientRect().top+window.scrollY-offset,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[page]);
 const search=query.trim().normalize('NFKC').toLocaleLowerCase(locale);
 const matches=entries.filter(entry=>Object.entries(selected).every(([id,values])=>values.every(value=>entry.facets[id]?.includes(value)))&&`${entry.title} ${entry.description}`.normalize('NFKC').toLocaleLowerCase(locale).includes(search));
 if(sort!=='listed')matches.sort((left,right)=>{const a=(sort==='downloads'?left.downloads:left.updatedAt)??null,b=(sort==='downloads'?right.downloads:right.updatedAt)??null;if(a===null&&b!==null)return 1;if(a!==null&&b===null)return -1;if(a!==null&&b!==null&&a!==b)return a>b?-1:1;return left.id.localeCompare(right.id);});
 const pageCount=Math.ceil(matches.length/perPage),visible=matches.slice((page-1)*perPage,page*perPage);
 const active=query||Object.values(selected).some(values=>values.length)||sort!==(sortOptions?.[0]?.id??'listed');
 const reset=()=>{setQuery('');setSelected({});setSort(sortOptions?.[0]?.id??'listed');setPage(1);};
 const toggle=(id:string,value:string,multiple?:boolean)=>{setSelected(previous=>({...previous,[id]:previous[id]?.includes(value)?previous[id].filter(item=>item!==value):multiple?[...(previous[id]??[]),value]:[value]}));setPage(1);};
 const changePage=(next:number)=>{pendingPageScroll.current=true;setPage(next);};
 return <div className="list-browser" id="browse" data-card-layout={compactCards?'compact':'default'}>
  <div className="list-toolbar"><label className="list-search"><span>{copy.search}</span><input type="search" value={query} aria-controls={resultsId} onChange={event=>{setQuery(event.target.value);setPage(1);}}/></label>
   {sortOptions&&<label className="list-sort"><span>{copy.sort}</span><select value={sort} onChange={event=>{setSort(event.target.value as typeof sort);setPage(1);}}>{sortOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>}
  </div>
  {facets.length>0&&<div className="list-facet-groups">{facets.map(facet=><div key={facet.id} className="list-facet-row"><span className="list-facet-label">{facet.label}</span><div className="list-filters" role="group" aria-label={facet.label}>
   {!facet.multiple&&<button type="button" aria-pressed={!selected[facet.id]?.length} aria-controls={resultsId} onClick={()=>{setSelected(previous=>({...previous,[facet.id]:[]}));setPage(1);}}>{copy.all}</button>}
   {facet.options.map(option=><button type="button" key={option.id} disabled={!!facet.disabledReason} aria-pressed={selected[facet.id]?.includes(option.id)??false} aria-controls={resultsId} aria-describedby={facet.disabledReason?`${resultsId}-${facet.id}-reason`:undefined} onClick={()=>toggle(facet.id,option.id,facet.multiple)}>{option.label}</button>)}
  </div>{facet.disabledReason&&<p className="list-filter-note" id={`${resultsId}-${facet.id}-reason`}>{facet.disabledReason}</p>}</div>)}</div>}
  <div className="list-results" id={resultsId} ref={resultsRef} tabIndex={-1} aria-labelledby={`${resultsId}-title`}>
   <h2 className="visually-hidden" id={`${resultsId}-title`}>{copy.results}</h2>
   <div className="list-result-summary"><p role="status" aria-live="polite">{matches.length} {copy.results}{model.knownTotal!==undefined&&<> · {copy.knownTotal}: {model.knownTotal??copy.unknown}</>}</p>{active&&<button type="button" className="list-reset" onClick={reset}>{copy.reset}</button>}</div>
   {visible.length?<><div className="list-grid">{visible.map((entry,i)=>{const content=<>{entry.thumbnail?.src&&<Media asset={entry.thumbnail} locale={locale} variant="card" ratio="16 / 9"/>}<div className="list-card-body"><div className="list-card-meta">{entry.label&&<span>{entry.label}</span>}<span>{entry.verification}</span></div><h3>{entry.title}</h3>{!compactCards&&entry.description&&<p>{entry.description}</p>}{!compactCards&&entry.facts&&<dl className="list-card-facts">{entry.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}{entry.path?!compactCards&&<span className="button button-ghost list-card-action">{copy.details}<ArrowRightIcon/></span>:<span className="list-card-unavailable">{copy.unavailable}</span>}</div></>;return <Fragment key={entry.id}><div className="list-card-reveal">{entry.path?<Link href={entry.path} className="list-card" data-entry-id={entry.id}>{content}</Link>:<article className="list-card" data-entry-id={entry.id}>{content}</article>}</div>{ads.mode!=='disabled'&&(i===5||i===visible.length-1&&visible.length<6)&&<AdContentSlot/>}{ads.mode!=='disabled'&&i===11&&visible.length>12&&<AdContentSlot slot="inline"/>}</Fragment>;})}</div></>:<div className="list-no-results"><p>{copy.noResults}</p><button type="button" className="button button-ghost" onClick={reset}>{copy.reset}</button></div>}
  </div>
  {pageCount>1&&<nav className="list-pagination" aria-label={copy.page}><button type="button" className="button button-ghost" disabled={page===1} onClick={()=>changePage(page-1)}>{copy.previous}</button><span>{copy.page} {page} {copy.of} {pageCount}</span><button type="button" className="button button-ghost" disabled={page===pageCount} onClick={()=>changePage(page+1)}>{copy.next}</button></nav>}
  {model.notice&&<aside className="list-notice" aria-labelledby={`${resultsId}-notice-title`}><strong className="list-notice-title" id={`${resultsId}-notice-title`}>{model.notice.label}</strong><p>{model.notice.description}</p></aside>}
 </div>;
}
