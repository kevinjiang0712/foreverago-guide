'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {useAds} from './AdProvider';
import {loadAdScript,bannerSizes,type AdScriptStatus,type RevenueSlot} from './ad-script';
import {recordAdStage,observeAdVisibility} from './ad-measurement';

// Collapsed grid ads leave the grid flow; use the preceding card to preserve
// lazy loading at their actual insertion point without adding an empty row.
function loadingAnchor(element:HTMLElement){
 return element.dataset.expanded==='false'&&element.parentElement?.matches('.list-grid,.catalog-cards')?element.previousElementSibling??element:element;
}

export function RevenueAd({slot,eager=false}:{slot:RevenueSlot;eager?:boolean}){
 const context=useAds();
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[attempt,setAttempt]=useState(0);
 const [status,setStatus]=useState('waiting'),[expanded,setExpanded]=useState(false);
 const currentPath=useRef(context?.path);
 const viewedPath=useRef<string|null>(null);
 useEffect(()=>{currentPath.current=context?.path;},[context?.path]);
 const ads=context?.ads,path=context?.path;
 const mode=ads?.mode==='adsterra'&&!context?.production?'disabled':ads?.mode??'disabled';
 const scriptConfig=JSON.stringify(ads);
 const unit=ads?.adsterra?.units[slot];
 useEffect(()=>{
  const element=root.current;if(!element||mode==='disabled')return;
  let observer:IntersectionObserver|undefined;
  let eligibleReported=false;
  const check=()=>{
   const anchor=loadingAnchor(element),box=element.getBoundingClientRect();
   const top=anchor===element?box.top:anchor.getBoundingClientRect().bottom;
   if(!box.width||element.closest('[hidden]'))return;
   if(slot==='inline'){
    if(innerWidth>767||box.width<300)return;
    const native=document.querySelector<HTMLElement>('[data-revenue-slot="native"]');
    if(native&&top-loadingAnchor(native).getBoundingClientRect().bottom<innerHeight*1.5)return;
   }
   if(slot==='anchor'&&innerWidth<320)return;
   if(mode==='adsterra'&&(!context?.production||!ads?.adsterra?.allowedHosts.includes(location.hostname)||!unit))return;
   if(mode==='adsterra'&&!eligibleReported){recordAdStage(slot,'eligible',path??location.pathname);eligibleReported=true;}
   if(mode==='placeholder'||eager){setReady(true);return;}
   observer?.disconnect();
   observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setReady(true);observer?.disconnect();}},{rootMargin:`${innerHeight}px 0px`});
   observer.observe(anchor);
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
  const requestedPath=currentPath.current??location.pathname;
  let retry:ReturnType<typeof setTimeout>|undefined;
  let creativeFound=false;
  const report=(next:AdScriptStatus|'creative-dom')=>{
   setStatus(previous=>previous==='creative-dom'&&next==='script-loaded'?previous:next);
   root.current?.dispatchEvent(new CustomEvent('ad-lifecycle',{bubbles:true,detail:{slot,status:next,path:requestedPath,attempt}}));
   if(next!=='creative-dom')recordAdStage(slot,next==='script-loaded'?'script_loaded':'script_error',requestedPath,attempt);
   if(next==='script-error'&&attempt<2&&!retry)retry=setTimeout(()=>setAttempt(previous=>previous+1),1000*4**attempt);
  };
  const loadedFrames=new WeakMap<HTMLIFrameElement,string>();
  const frameObservers=new Map<HTMLIFrameElement,{load:()=>void;observer?:MutationObserver;document?:Document}>();
  const frameSource=(frame:HTMLIFrameElement)=>`${frame.getAttribute('src')??''}\0${frame.getAttribute('srcdoc')??''}`;
  const contentEvents=['load','loadeddata','canplay'];
  const observeFrame=(frame:HTMLIFrameElement)=>{
   const tracked=frameObservers.get(frame);
   if(!tracked)return;
   tracked.observer?.disconnect();for(const event of contentEvents)tracked.document?.removeEventListener(event,measureCreative,true);
   const document=frame.contentDocument;tracked.document=document??undefined;
   if(document){
    tracked.observer=new MutationObserver(measureCreative);
    tracked.observer.observe(document,{childList:true,subtree:true,attributes:true,characterData:true});
    for(const event of contentEvents)document.addEventListener(event,measureCreative,true);
   }
  };
  const watchFrame=(frame:HTMLIFrameElement)=>{
   if(frameObservers.has(frame))return;
   const load=()=>{loadedFrames.set(frame,frameSource(frame));observeFrame(frame);measureCreative();};
   frameObservers.set(frame,{load});frame.addEventListener('load',load);observeFrame(frame);
  };
  const isVisible=(node:HTMLElement)=>{
   for(let parent:HTMLElement|null=node;parent;parent=parent.parentElement){
    const style=parent.ownerDocument.defaultView!.getComputedStyle(parent);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;
   }
   return true;
  };
  const hasVisibleContent=(creative:HTMLElement):boolean=>{
   if(!isVisible(creative))return false;
   const box=creative.getBoundingClientRect();
   if(creative.tagName!=='BODY'&&(box.width<=1||box.height<=1))return false;
   if(creative.tagName==='IMG'){
    const image=creative as HTMLImageElement;return image.complete&&image.naturalWidth>0;
   }
   if(creative.tagName==='VIDEO'){
    const video=creative as HTMLVideoElement;return video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0;
   }
   if(creative.tagName==='IFRAME'){
    const frame=creative as HTMLIFrameElement;watchFrame(frame);
    const loaded=loadedFrames.get(frame)===frameSource(frame);
    if((frame.hasAttribute('src')||frame.hasAttribute('srcdoc'))&&!loaded)return false;
    const body=frame.contentDocument?.body;
    if(body)return hasVisibleContent(body);
    // Cross-origin creative DOM is inaccessible; wait for the supplier frame's
    // current source to load instead of treating an empty/loading iframe as rendered.
    return loaded&&!!frame.getAttribute('src')&&!frame.src.startsWith('about:');
   }
   const document=creative.ownerDocument;
   const texts=document.createTreeWalker(creative,NodeFilter.SHOW_TEXT);
   for(let text=texts.nextNode();text;text=texts.nextNode()){
    if(!text.textContent?.trim()||!text.parentElement||!isVisible(text.parentElement))continue;
    const range=document.createRange();range.selectNodeContents(text);
    const textBox=range.getBoundingClientRect();
    if(textBox.width>1&&textBox.height>1)return true;
   }
   return [...creative.querySelectorAll<HTMLElement>('iframe,img,video')].some(hasVisibleContent);
  };
  const measureCreative=()=>{
   const hasCreative=[...element.querySelectorAll<HTMLElement>('iframe,img,video,a[href]')].some(hasVisibleContent);
   setExpanded(hasCreative);
   if(!hasCreative){creativeFound=false;return;}
   if(!creativeFound){creativeFound=true;report('creative-dom');}
  };
  const observer=new MutationObserver(measureCreative);observer.observe(element,{childList:true,subtree:true,attributes:true,characterData:true});
  const resize=new ResizeObserver(measureCreative);resize.observe(element);
  for(const event of contentEvents)element.addEventListener(event,measureCreative,true);
  const unload=loadAdScript(element,config,slot,report,()=>recordAdStage(slot,'request',requestedPath,attempt));
  return()=>{observer.disconnect();resize.disconnect();for(const event of contentEvents)element.removeEventListener(event,measureCreative,true);for(const [frame,tracked] of frameObservers){frame.removeEventListener('load',tracked.load);tracked.observer?.disconnect();for(const event of contentEvents)tracked.document?.removeEventListener(event,measureCreative,true);}unload();if(retry)clearTimeout(retry);};
 },[ready,mode,scriptConfig,slot,attempt]);
 useEffect(()=>{
  const measuredPath=path??location.pathname;
  if(!expanded||mode!=='adsterra'||!root.current||viewedPath.current===measuredPath)return;
  return observeAdVisibility(root.current,()=>{viewedPath.current=measuredPath;recordAdStage(slot,'viewable',measuredPath);});
 },[expanded,mode,slot,path]);
 if(mode==='disabled'||(mode==='adsterra'&&!unit))return null;
 const size=slot==='native'?null:bannerSizes[slot];
 const style={'--revenue-width':size?`${size[0]}px`:'100%','--revenue-height':`${size?size[1]:mode==='placeholder'?480:0}px`} as CSSProperties;
 return <aside ref={root} className={`revenue-ad revenue-ad--${slot}`} style={style} data-revenue-slot={slot} data-ad-placement={slot==='native'?'native':slot==='inline'?'a2':slot==='left'?'a1-left':'a1'} data-ad-status={mode==='placeholder'?'placeholder':status} data-ready={ready} data-expanded={mode==='placeholder'||expanded} aria-label={`Advertisement · ${slot}`}>
  <span className="revenue-ad-label">Advertisement</span>
  {mode==='placeholder'?<div className="ad-placeholder-canvas"><span>{slot==='native'?'Native · 1 group':`${size![0]} × ${size![1]}`}</span></div>:ready&&<div ref={canvas} className="revenue-ad-canvas"/>}
 </aside>;
}
