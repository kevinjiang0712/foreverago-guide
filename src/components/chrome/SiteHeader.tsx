'use client';
import {useCallback,useEffect,useId,useRef,useState,useSyncExternalStore,type CSSProperties} from 'react';
import type {BrandModel,LocaleChoice,NavigationItem} from '@/content/navigation';
import {SiteNavigation} from './SiteNavigation';
import {Brand} from './SiteFooter';
import {useLocale} from './LocaleContext';
import {MobileDrawer} from './MobileDrawer';
import {LocalePicker} from './LocalePicker';
import {SiteSearch,type SiteSearchEntry} from './SiteSearch';
export type SiteHeaderModel={brand:BrandModel;items:NavigationItem[];locales:LocaleChoice[];siteId:string;defaultMode:'day'|'night';searchEntries?:SiteSearchEntry[]};
function subscribeMobile(change:()=>void){const media=window.matchMedia('(max-width: 767px)');media.addEventListener('change',change);return()=>media.removeEventListener('change',change);}
function isMobile(){return window.matchMedia('(max-width: 767px)').matches;}
export function SiteHeader({model,pathname}:{model:SiteHeaderModel;pathname:string}){
 const {dictionary,locale}=useLocale();const header=useRef<HTMLElement>(null);const bar=useRef<HTMLDivElement>(null);const burger=useRef<HTMLButtonElement>(null);const drawerId=useId();
 const collapsed=useSyncExternalStore(subscribeMobile,isMobile,()=>false);const [drawerOpen,setDrawerOpen]=useState(false);const [hidden,setHidden]=useState(false);const [progress,setProgress]=useState(0);const [scrolled,setScrolled]=useState(false);
 const dismiss=useCallback(()=>setDrawerOpen(false),[]);
 const revealSearch=useCallback(()=>{setDrawerOpen(false);setHidden(false);},[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{setDrawerOpen(false);setHidden(false);});return()=>cancelAnimationFrame(frame);},[pathname,collapsed]);
 useEffect(()=>{
  let lastY=window.scrollY;let frame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{const y=window.scrollY;const height=document.documentElement.scrollHeight-window.innerHeight;setProgress(height>0?Math.max(0,Math.min(1,y/height)):0);setScrolled(y>24);if(Math.abs(y-lastY)>=8){setHidden(!drawerOpen&&!reduced.matches&&y>3*(header.current?.offsetHeight??60)&&y>lastY);lastY=y;}};
  const scroll=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};const motionChange=()=>{if(reduced.matches)setHidden(false);};window.addEventListener('scroll',scroll,{passive:true});reduced.addEventListener('change',motionChange);update();return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);reduced.removeEventListener('change',motionChange);};
 },[drawerOpen]);
 return <><a href="#main" className="site-skip">{dictionary.ui.skipToContent}</a><div className="site-header-spacer" data-nav-form={collapsed?'burger':'inline'} aria-hidden="true"/><header ref={header} className="site-header" data-nav-form={collapsed?'burger':'inline'} data-hidden={hidden} data-scrolled={scrolled} data-drawer-open={drawerOpen} onFocusCapture={()=>setHidden(false)} style={{'--read-progress':progress} as CSSProperties}>
  <div ref={bar} className="site-header-bar"><Brand brand={model.brand}/><MobileDrawer id={drawerId} open={drawerOpen} collapsed={collapsed} onClose={dismiss} triggerRef={burger} brand={model.brand}>
   <SiteNavigation items={model.items} mobile={collapsed} label={dictionary.ui.mainNavigation} currentLabel={dictionary.ui.current} unavailableLabel={dictionary.ui.unavailable} previousLabel={dictionary.ui.previous} nextLabel={dictionary.ui.next} onNavigate={dismiss}/>
   {model.locales.length>1&&<div className="site-drawer-controls"><div className="site-control-group"><span className="site-control-label">{dictionary.ui.language}</span><LocalePicker locale={locale} choices={model.locales} labels={dictionary.ui} onNavigate={dismiss}/></div></div>}
  </MobileDrawer><SiteSearch entries={model.searchEntries??[]} pathname={pathname} onOpen={revealSearch}/><button ref={burger} type="button" className="site-burger" data-burger aria-label={dictionary.ui.openMenu} aria-expanded={drawerOpen} aria-controls={drawerId} onClick={()=>setDrawerOpen(true)}><span/><span/></button></div><span className="site-read-progress" aria-hidden="true"/>
 </header></>;
}
