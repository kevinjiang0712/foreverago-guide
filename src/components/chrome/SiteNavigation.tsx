'use client';
import Link from 'next/link';
import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import type {NavigationItem} from '@/content/navigation';

type NavigationProps={items:NavigationItem[];mobile:boolean;label:string;currentLabel:string;unavailableLabel:string;previousLabel:string;nextLabel:string;onNavigate:()=>void};
function NavigationEntry({item,mobile,currentLabel,unavailableLabel,onNavigate}:Pick<NavigationProps,'mobile'|'currentLabel'|'unavailableLabel'|'onNavigate'>&{item:NavigationItem}){
 const [open,setOpen]=useState(false);
 const submenuId=useId();
 const host=useRef<HTMLSpanElement>(null);
 const submenu=useRef<HTMLSpanElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const hasChildren=item.children.length>0;
 const expanded=open||(mobile&&Boolean(item.href));
 function cancelClose(){if(timer.current)clearTimeout(timer.current);}
 function close(){setOpen(false);}
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useLayoutEffect(()=>{
  const panel=submenu.current,anchor=host.current;
  if(!open||mobile||!panel||!anchor)return;
  // A top-layer popover escapes the horizontal scroller without duplicating links.
  const rect=anchor.getBoundingClientRect();
  const width=Math.min(300,window.innerWidth-24);
  panel.style.width=`${width}px`;
  panel.style.left=`${Math.max(12,Math.min(rect.left,window.innerWidth-width-12))}px`;
  panel.style.top=`${rect.bottom+8}px`;
  panel.showPopover();
  const nav=anchor.closest('nav');
  const outside=(event:PointerEvent)=>{if(!anchor.contains(event.target as Node))close();};
  nav?.addEventListener('scroll',close,{passive:true});
  window.addEventListener('resize',close);
  window.addEventListener('scroll',close,{passive:true});
  document.addEventListener('pointerdown',outside);
  return()=>{
   if(panel.matches(':popover-open'))panel.hidePopover();
   nav?.removeEventListener('scroll',close);
   window.removeEventListener('resize',close);
   window.removeEventListener('scroll',close);
   document.removeEventListener('pointerdown',outside);
  };
 },[open,mobile]);
 const contents=<>{item.label}{item.current&&<span className="site-current-label">{currentLabel}</span>}{hasChildren&&<span className="site-caret" aria-hidden="true"/>}{!item.href&&!hasChildren&&<small className="site-plan-status">{unavailableLabel}</small>}</>;
 return <span ref={host} className="site-nav-item" data-sub-open={expanded}
  onMouseEnter={()=>{cancelClose();if(!mobile&&hasChildren)setOpen(true);}}
  onMouseLeave={()=>{cancelClose();if(!mobile)timer.current=setTimeout(close,140);}}
  onFocus={()=>{cancelClose();if(!mobile&&hasChildren)setOpen(true);}}
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))close();}}
  onKeyDown={event=>{
   if(event.key==='Escape'&&open&&!mobile){event.stopPropagation();event.preventDefault();host.current?.querySelector<HTMLElement>('.site-nav-link')?.focus();close();}
   if(event.key==='ArrowDown'&&hasChildren&&!mobile){event.preventDefault();setOpen(true);requestAnimationFrame(()=>submenu.current?.querySelector<HTMLElement>('a[href]')?.focus());}
  }}>
  {item.href?<Link className="site-nav-link" href={item.href} aria-current={item.current?'page':undefined} aria-expanded={hasChildren?expanded:undefined} aria-controls={hasChildren?submenuId:undefined} onClick={onNavigate}>{contents}</Link>:<button type="button" className="site-nav-link site-unavailable" aria-expanded={hasChildren?expanded:undefined} aria-controls={hasChildren?submenuId:undefined} disabled={!hasChildren} onClick={()=>setOpen(mobile?!open:true)}>{contents}</button>}
  {hasChildren&&<span ref={submenu} id={submenuId} className="site-submenu" aria-label={item.label} popover={mobile?undefined:'manual'} inert={!expanded}>
   {item.children.map(child=>child.href?<Link key={child.id} href={child.href} className="site-subrow" onClick={()=>{close();onNavigate();}}>{child.label}</Link>:<span key={child.id} className="site-subrow site-planned-item">{child.label}<small>{unavailableLabel}</small></span>)}
  </span>}
 </span>;
}
export function SiteNavigation({items,mobile,label,currentLabel,unavailableLabel,previousLabel,nextLabel,onNavigate}:NavigationProps){
 const rail=useRef<HTMLDivElement>(null);
 const nav=useRef<HTMLElement>(null);
 const id=useId();
 const [scroll,setScroll]=useState({overflow:false,start:true,end:true});
 useLayoutEffect(()=>{
  const container=rail.current,links=nav.current;
  if(!container||!links||mobile)return;
  let active=true;
  const measure=()=>{
   const next={overflow:links.scrollWidth>container.clientWidth+1,start:links.scrollLeft<=1,end:links.scrollLeft+links.clientWidth>=links.scrollWidth-1};
   setScroll(previous=>previous.overflow===next.overflow&&previous.start===next.start&&previous.end===next.end?previous:next);
  };
  const observer=new ResizeObserver(measure);
  observer.observe(container);observer.observe(links);
  for(const item of links.children)observer.observe(item);
  links.addEventListener('scroll',measure,{passive:true});
  document.fonts.ready.then(()=>{if(active)measure();});
  document.fonts.addEventListener('loadingdone',measure);
  measure();
  return()=>{active=false;observer.disconnect();links.removeEventListener('scroll',measure);document.fonts.removeEventListener('loadingdone',measure);};
 },[mobile,items]);
 function scrollByPage(direction:number){
  const links=nav.current;if(!links)return;
  links.scrollBy({left:direction*Math.max(160,links.clientWidth*.8),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <div ref={rail} className="site-navigation-rail" data-overflow={!mobile&&scroll.overflow}>
  <button type="button" className="site-nav-scroll" hidden={mobile||!scroll.overflow} disabled={scroll.start} aria-label={`${label}: ${previousLabel}`} aria-controls={id} onClick={()=>scrollByPage(-1)}>‹</button>
  <nav ref={nav} id={id} className="site-navigation" aria-label={label}>
   {items.map(item=><NavigationEntry key={`${mobile}:${item.id}`} item={item} mobile={mobile} currentLabel={currentLabel} unavailableLabel={unavailableLabel} onNavigate={onNavigate}/>)}
  </nav>
  <button type="button" className="site-nav-scroll" hidden={mobile||!scroll.overflow} disabled={scroll.end} aria-label={`${label}: ${nextLabel}`} aria-controls={id} onClick={()=>scrollByPage(1)}>›</button>
 </div>;
}
