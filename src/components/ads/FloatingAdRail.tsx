'use client';

import {useEffect,useRef} from 'react';
import {AdPlaceholder} from './AdPlaceholder';

const railGap=24;

export function FloatingAdRail({side}:{side:'left'|'right'}){
 const railRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const rail=railRef.current;
  const main=document.querySelector<HTMLElement>('main');
  const footer=document.querySelector<HTMLElement>('.site-footer');
  const header=document.querySelector<HTMLElement>('.site-header');
  if(!rail||!main||!footer)return;
  let frame=0;
  const positionRail=()=>{
   frame=0;
   if(window.innerWidth<1200){
    rail.style.removeProperty('--floating-ad-top');
    rail.dataset.ready='true';
    return;
   }
   const minimumTop=(header?.getBoundingClientRect().height??60)+railGap;
   const mainTop=main.getBoundingClientRect().top+railGap;
   const footerTop=footer.getBoundingClientRect().top;
   const railHeight=rail.getBoundingClientRect().height;
   const top=Math.min(Math.max(minimumTop,mainTop),footerTop-railHeight-railGap);
   rail.style.setProperty('--floating-ad-top',`${Math.round(top)}px`);
   rail.dataset.ready='true';
  };
  const schedulePosition=()=>{
   if(frame)return;
   frame=requestAnimationFrame(positionRail);
  };
  positionRail();
  window.addEventListener('scroll',schedulePosition,{passive:true});
  window.addEventListener('resize',schedulePosition);
  const resizeObserver=new ResizeObserver(schedulePosition);
  resizeObserver.observe(main);
  resizeObserver.observe(footer);
  return ()=>{
   window.removeEventListener('scroll',schedulePosition);
   window.removeEventListener('resize',schedulePosition);
   resizeObserver.disconnect();
   if(frame)cancelAnimationFrame(frame);
  };
 },[]);
 return <div ref={railRef} className={`floating-ad-rail floating-ad-rail--${side}`}><AdPlaceholder placement={side==='left'?'a1-left':'a1'}/></div>;
}
