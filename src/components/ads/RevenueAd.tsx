'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {useAds} from './AdProvider';
import {loadAdScript,bannerSizes,type AdScriptStatus,type RevenueSlot} from './ad-script';

export function RevenueAd({slot,eager=false}:{slot:RevenueSlot;eager?:boolean}){
 const context=useAds();
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[attempt,setAttempt]=useState(0),[height,setHeight]=useState(480);
 const [status,setStatus]=useState('waiting');
 const currentPath=useRef(context?.path);
 useEffect(()=>{currentPath.current=context?.path;},[context?.path]);
 const ads=context?.ads,path=context?.path;
 const mode=ads?.mode==='adsterra'&&!context?.production?'disabled':ads?.mode??'disabled';
 const scriptConfig=JSON.stringify(ads);
 const unit=ads?.adsterra?.units[slot];
 useEffect(()=>{
  const element=root.current;if(!element||mode==='disabled')return;
  let observer:IntersectionObserver|undefined;
  const check=()=>{
   const box=element.getBoundingClientRect();
   if(!box.width||(slot!=='inline'&&!box.height)||element.closest('[hidden]'))return;
   if(slot==='inline'){
    if(innerWidth>767||box.width<300)return;
    const native=document.querySelector<HTMLElement>('[data-revenue-slot="native"]');
    if(native&&box.top-native.getBoundingClientRect().bottom<innerHeight*1.5)return;
   }
   if(slot==='anchor'&&innerWidth<320)return;
   if(mode==='adsterra'&&(!context?.production||!ads?.adsterra?.allowedHosts.includes(location.hostname)||!unit))return;
   if(mode==='placeholder'||eager){setReady(true);return;}
   observer?.disconnect();
   observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setReady(true);observer?.disconnect();}},{rootMargin:`${innerHeight}px 0px`});
   observer.observe(element);
  };
  const raf=requestAnimationFrame(check);
  const resize=new ResizeObserver(check);resize.observe(element);
  window.addEventListener('resize',check);
  return()=>{cancelAnimationFrame(raf);resize.disconnect();observer?.disconnect();window.removeEventListener('resize',check);};
 },[mode,ads,context?.production,unit,slot,eager,path]);
 useEffect(()=>{
  if(!ready||mode!=='adsterra'||!scriptConfig||!canvas.current)return;
  const config=JSON.parse(scriptConfig);
  if(!config.adsterra?.allowedHosts.includes(location.hostname))return;
  const element=canvas.current;
  let retry:ReturnType<typeof setTimeout>|undefined;
  let creativeFound=false;
  const report=(next:AdScriptStatus|'creative-dom')=>{
   setStatus(previous=>previous==='creative-dom'&&next==='script-loaded'?previous:next);
   root.current?.dispatchEvent(new CustomEvent('ad-lifecycle',{bubbles:true,detail:{slot,status:next,path:currentPath.current,attempt}}));
   if(next==='script-error'&&attempt<2&&!retry)retry=setTimeout(()=>setAttempt(previous=>previous+1),1000*4**attempt);
  };
  const measureCreative=()=>{
   if(!element.querySelector('iframe,img,video,a[href]'))return;
   if(!creativeFound){creativeFound=true;report('creative-dom');}
   if(slot==='native'){
    const nextHeight=Math.max(element.scrollHeight,element.getBoundingClientRect().height);
    if(nextHeight>0)setHeight(previous=>Math.max(previous,nextHeight));
   }
  };
  const observer=new MutationObserver(measureCreative);observer.observe(element,{childList:true,subtree:true,attributes:true});
  const resize=new ResizeObserver(measureCreative);resize.observe(element);
  const unload=loadAdScript(element,config,slot,report);
  return()=>{observer.disconnect();resize.disconnect();unload();if(retry)clearTimeout(retry);};
 },[ready,mode,scriptConfig,slot,attempt]);
 if(mode==='disabled'||(mode==='adsterra'&&!unit))return null;
 const size=slot==='native'?null:bannerSizes[slot];
 const style={minHeight:size?`${size[1]}px`:undefined,'--revenue-width':size?`${size[0]}px`:'100%','--revenue-height':`${size?size[1]:height}px`} as CSSProperties;
 return <aside ref={root} className={`revenue-ad revenue-ad--${slot}`} style={style} data-revenue-slot={slot} data-ad-placement={slot==='native'?'native':slot==='inline'?'a2':slot==='left'?'a1-left':'a1'} data-ad-status={mode==='placeholder'?'placeholder':status} data-ready={ready} aria-label={`Advertisement · ${slot}`}>
  <span className="revenue-ad-label">Advertisement</span>
  {mode==='placeholder'?<div className="ad-placeholder-canvas"><span>{slot==='native'?'Native · 1 group':`${size![0]} × ${size![1]}`}</span></div>:ready&&<div ref={canvas} className="revenue-ad-canvas"/>}
 </aside>;
}
