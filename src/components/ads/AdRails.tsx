'use client';
import {useEffect,useRef,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {AdContext,useAds} from './AdProvider';
import {RevenueAd} from './RevenueAd';
import type {RevenueSlot} from './ad-script';
const closedSlots=new Set<string>();
let persistentRoot:Root|undefined;
let persistentElement:HTMLDivElement|undefined;
let disposeTimer:ReturnType<typeof setTimeout>|undefined;

// The catch-all Next layout remounts on navigation. Keep fixed ads attached to
// the document so moving between content pages does not destroy their creatives.
export function AdRails({siteId}:{siteId:string}){
 const context=useAds();
 useEffect(()=>{
  if(disposeTimer)clearTimeout(disposeTimer);
  if(!persistentRoot){
   persistentElement=document.createElement('div');
   persistentElement.dataset.fixedAds='';
   document.body.append(persistentElement);
   persistentRoot=createRoot(persistentElement);
  }
  persistentRoot.render(<AdContext.Provider value={context}><PositionedAdRails siteId={siteId}/></AdContext.Provider>);
  return()=>{disposeTimer=setTimeout(()=>{persistentRoot?.unmount();persistentElement?.remove();persistentRoot=undefined;persistentElement=undefined;},0);};
 },[context,siteId]);
 return null;
}
function PositionedAdRails({siteId}:{siteId:string}){
 const context=useAds(),root=useRef<HTMLDivElement>(null);
 const [closed,setClosed]=useState<string[]>([]);
 const [layout,setLayout]=useState({left:false,right:false,anchor:false,leftTop:0,rightTop:0,leftX:0,rightX:0});
 const mode=context?.ads.mode??'disabled';
 useEffect(()=>{
  let frame=0;
  const shellNode=document.querySelector<HTMLElement>('[data-site-shell]');
  const measure=()=>{
   frame=0;
   const main=document.querySelector<HTMLElement>('main.container'),footer=document.querySelector<HTMLElement>('.site-footer'),header=document.querySelector<HTMLElement>('.site-header');
   const shell=document.querySelector<HTMLElement>('[data-site-shell]');
   if(!main||!footer||!shell)return;
   const closedNow=['left','right','anchor'].filter(slot=>{const key=`${siteId}:ad-closed:${slot}`;try{if(sessionStorage.getItem(key))closedSlots.add(key);}catch(error){console.warn('Ad close storage unavailable',error);}return closedSlots.has(key);});
   setClosed(closedNow);
   const mainBox=main.getBoundingClientRect(),footerTop=footer.getBoundingClientRect().top,headerHeight=header?.getBoundingClientRect().height??60;
   const wide=mainBox.left>=200&&innerWidth-mainBox.right>=200;
   const allowed=(slot:RevenueSlot)=>mode==='placeholder'||(mode==='adsterra'&&!!context?.ads.adsterra?.units[slot]&&!!context.production&&context.ads.adsterra.allowedHosts.includes(location.hostname));
   const anchor=allowed('anchor')&&innerWidth>=320&&innerWidth<=767&&innerHeight>=500&&!context?.tool&&!closedNow.includes('anchor')&&(!visualViewport||visualViewport.height>=innerHeight*.8);
   shell.style.setProperty('--mobile-sticky-ad-height',anchor?`calc(${innerWidth<=367?78:50}px + env(safe-area-inset-top))`:'0px');
   const top=(height:number)=>Math.min(Math.max(headerHeight+24,mainBox.top+24),footerTop-height-24);
   const next={left:wide&&allowed('left')&&!closedNow.includes('left')&&innerHeight>=headerHeight+348,right:wide&&allowed('right')&&!closedNow.includes('right')&&innerHeight>=headerHeight+648,anchor,leftTop:top(300),rightTop:top(600),leftX:mainBox.left-184,rightX:mainBox.right+24};
   setLayout(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  schedule();
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('ad-close',schedule);visualViewport?.addEventListener('resize',schedule);
  const observer=new ResizeObserver(schedule);const main=document.querySelector('main');const footer=document.querySelector('.site-footer');if(main)observer.observe(main);if(footer)observer.observe(footer);
  return()=>{if(frame)cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('ad-close',schedule);visualViewport?.removeEventListener('resize',schedule);shellNode?.style.setProperty('--mobile-sticky-ad-height','0px');};
 },[context,siteId,mode]);
 function close(slot:string){const key=`${siteId}:ad-closed:${slot}`;closedSlots.add(key);try{sessionStorage.setItem(key,'1');}catch(error){console.warn('Ad close storage unavailable',error);}setClosed(previous=>[...previous,slot]);window.dispatchEvent(new Event('ad-close'));}
 if(mode==='disabled')return null;
 return <div ref={root} className="ad-rails">{(['left','right','anchor'] as const).map(slot=>layout[slot]&&!closed.includes(slot)&&<div key={slot} className={`revenue-rail revenue-rail--${slot}`} style={slot==='anchor'?undefined:{left:slot==='left'?layout.leftX:layout.rightX,top:slot==='left'?layout.leftTop:layout.rightTop}}>
  <button className="revenue-close" type="button" aria-label={`Close ${slot} advertisement`} onClick={()=>close(slot)}>×</button><RevenueAd slot={slot} eager/>
 </div>)}</div>;
}
