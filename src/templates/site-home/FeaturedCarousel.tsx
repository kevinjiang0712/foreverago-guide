'use client';
import {useEffect,useId,useRef,useState,type PointerEvent,type ReactNode} from 'react';
import {useReducedMotion} from '@/components/motion/useReducedMotion';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';

type FeaturedCarouselProps={children:ReactNode;label:string;previousLabel:string;nextLabel:string;pauseLabel:string;resumeLabel:string};
const autoplayPixelsPerMillisecond=.032;

export function FeaturedCarousel({children,label,previousLabel,nextLabel,pauseLabel,resumeLabel}:FeaturedCarouselProps){
 const id=useId();
 const viewport=useRef<HTMLDivElement>(null);
 const primary=useRef<HTMLDivElement>(null);
 const visible=useRef(true);
 const interacting=useRef(false);
 const drag=useRef<{pointerId:number;startX:number;scrollLeft:number;moved:boolean}|null>(null);
 const suppressClick=useRef(false);
 const resumeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const compact=useRef(false);
 const [paused,setPaused]=useState(false);
 const reduced=useReducedMotion();

 useEffect(()=>{
  const element=viewport.current;if(!element)return;
  const compactQuery=window.matchMedia('(max-width: 767px)');
  const updateCompact=()=>{compact.current=compactQuery.matches;};
  updateCompact();compactQuery.addEventListener('change',updateCompact);
  const observer=new IntersectionObserver(entries=>{visible.current=entries.some(entry=>entry.isIntersecting);},{threshold:.05});
  observer.observe(element);
  let frame=0,last=performance.now();
  const move=(now:number)=>{
   const elapsed=Math.min(48,now-last);last=now;
   const loopWidth=primary.current?.scrollWidth??0;
   if(!paused&&!reduced&&!compact.current&&!interacting.current&&visible.current&&loopWidth>element.clientWidth){
    element.scrollLeft+=elapsed*autoplayPixelsPerMillisecond;
    if(element.scrollLeft>=loopWidth)element.scrollLeft-=loopWidth;
   }
   frame=requestAnimationFrame(move);
  };
  frame=requestAnimationFrame(move);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();compactQuery.removeEventListener('change',updateCompact);};
 },[paused,reduced]);

 useEffect(()=>()=>{if(resumeTimer.current)clearTimeout(resumeTimer.current);},[]);

 function pauseTemporarily(){
  interacting.current=true;
  if(resumeTimer.current)clearTimeout(resumeTimer.current);
  resumeTimer.current=setTimeout(()=>{interacting.current=false;},1800);
 }
 function cardStep(){
  const set=primary.current,card=set?.querySelector<HTMLElement>('.home-discovery-card');
  if(!set||!card)return (viewport.current?.clientWidth??400)*.8;
  const gap=parseFloat(getComputedStyle(set).columnGap)||0;
  return card.getBoundingClientRect().width+gap;
 }
 function moveBy(direction:-1|1){
  const element=viewport.current,loopWidth=primary.current?.scrollWidth??0;if(!element)return;
  pauseTemporarily();
  if(direction<0&&element.scrollLeft<cardStep()&&loopWidth)element.scrollLeft+=loopWidth;
  element.scrollBy({left:direction*cardStep(),behavior:reduced?'instant':'smooth'});
 }
 function startDrag(event:PointerEvent<HTMLDivElement>){
  const element=viewport.current;if(!element||event.button!==0||!event.isPrimary)return;
  suppressClick.current=false;
  drag.current={pointerId:event.pointerId,startX:event.clientX,scrollLeft:element.scrollLeft,moved:false};
  interacting.current=true;
 }
 function dragTrack(event:PointerEvent<HTMLDivElement>){
  const state=drag.current,element=viewport.current;if(!state||state.pointerId!==event.pointerId||!element)return;
  const distance=event.clientX-state.startX;
  if(!state.moved&&Math.abs(distance)>5){state.moved=true;element.setPointerCapture(event.pointerId);}
  if(state.moved){event.preventDefault();element.scrollLeft=state.scrollLeft-distance;}
 }
 function finishDrag(event:PointerEvent<HTMLDivElement>){
  const element=viewport.current;if(!drag.current||drag.current.pointerId!==event.pointerId||!element)return;
  const moved=drag.current.moved;
  if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);
  const loopWidth=primary.current?.scrollWidth??0;
  if(loopWidth&&element.scrollLeft>=loopWidth)element.scrollLeft-=loopWidth;
  suppressClick.current=moved;drag.current=null;pauseTemporarily();
  if(moved)setTimeout(()=>{suppressClick.current=false;},0);
 }

 return <div className="home-featured-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
  <div className="home-featured-controls">
   <button type="button" aria-label={previousLabel} aria-controls={id} onClick={()=>moveBy(-1)}><ArrowRightIcon back/></button>
   <button type="button" className="home-featured-control--motion" aria-label={paused?resumeLabel:pauseLabel} aria-controls={id} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'▶':'Ⅱ'}</button>
   <button type="button" aria-label={nextLabel} aria-controls={id} onClick={()=>moveBy(1)}><ArrowRightIcon/></button>
  </div>
  <div id={id} ref={viewport} className="home-featured-viewport"
   onMouseEnter={()=>{interacting.current=true;}} onMouseLeave={()=>{if(!drag.current)interacting.current=false;}}
   onFocusCapture={()=>{interacting.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))interacting.current=false;}}
   onPointerDown={startDrag} onPointerMove={dragTrack} onPointerUp={finishDrag} onPointerCancel={finishDrag}
   onDragStart={event=>event.preventDefault()}
   onClickCapture={event=>{if(suppressClick.current)event.preventDefault();}}>
   <div className="home-featured-track">
    <div ref={primary} className="home-featured-track-set">{children}</div>
    <div className="home-featured-track-set" aria-hidden="true" ref={element=>{element?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{link.tabIndex=-1;});}}>{children}</div>
   </div>
  </div>
 </div>;
}
