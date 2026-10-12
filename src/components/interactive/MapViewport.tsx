'use client';
import Link from 'next/link';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode,type PointerEvent} from 'react';
import type {Dictionary} from '@/content/schemas/dictionary';
import type {AdsConfig} from '@/content/schemas/ads';
import type {InteractiveMapRecord,MapPin,MapCategory,MapRegion} from '@/content/schemas/templates/interactive-map';
import {clampToViewport,zoomAtPoint,type MapTransform} from '@/content/map-geometry';
import {mapProgressKey,parseMapProgress} from '@/content/map-progress';
import {Reveal} from '@/components/motion/Reveal';
import {useReducedMotion} from '@/components/motion/useReducedMotion';
import {CoverageMeter} from '@/components/content/CoverageMeter';
import {SectionHeading} from '@/components/content/SectionHeading';
import {AdContentSlot} from '@/components/ads/AdContentSlot';
import {ConfiguredAdSlot} from '@/components/ads/AdSlot';
type Labels=Dictionary['ui'];
const identity:MapTransform={scale:1,x:0,y:0};
const toneStyle=(category:MapCategory)=>({'--map-tone':`var(--${category.tone})`} as CSSProperties);
function CategoryIcon({category}:{category:MapCategory}){return <span className="map-icon" aria-hidden="true" style={toneStyle(category)}>{category.icon}</span>;}
function normalize(value:string){return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');}
function MapPlate({region,pins,categories,visibleIds,image,selected,onSelect,labels,pinLinks}:{region:MapRegion;pins:MapPin[];categories:MapCategory[];visibleIds:string[];image:ReactNode;selected:MapPin|null;onSelect:(pin:MapPin|null)=>void;labels:Labels;pinLinks:Record<string,string>}){
 const viewport=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null);const current=useRef(identity);const [transform,setTransform]=useState(identity);const [animate,setAnimate]=useState(false);const [size,setSize]=useState({width:1,height:1});const pointers=useRef(new Map<number,{x:number;y:number}>());const drag=useRef<{x:number;y:number;transform:MapTransform}|null>(null);const reduced=useReducedMotion();
 function paint(next:MapTransform,smooth=false){const element=viewport.current;if(!element||element.clientWidth<=0||element.clientHeight<=0)return;const clamped=clampToViewport(next,{width:element.clientWidth,height:element.clientHeight});current.current=clamped;setAnimate(smooth);setTransform(clamped);}
 function zoom(scale:number,point?:{x:number;y:number},smooth=false){const element=viewport.current;if(!element)return;paint(zoomAtPoint(current.current,scale,point??{x:element.clientWidth/2,y:element.clientHeight/2}),smooth);}
 useEffect(()=>{
  const element=viewport.current;if(!element)return;
  const resize=()=>{if(element.clientWidth<=0||element.clientHeight<=0)return;const dimensions={width:element.clientWidth,height:element.clientHeight};setSize(dimensions);current.current=clampToViewport(current.current,dimensions);setTransform(current.current);};
  const observer=new ResizeObserver(resize);observer.observe(element);
  const wheel=(event:WheelEvent)=>{if(event.target instanceof Element&&event.target.closest('[data-popup]'))return;event.preventDefault();const rect=element.getBoundingClientRect();const next=zoomAtPoint(current.current,current.current.scale*(event.deltaY<0?1.18:1/1.18),{x:event.clientX-rect.left,y:event.clientY-rect.top});current.current=clampToViewport(next,{width:element.clientWidth,height:element.clientHeight});setAnimate(false);setTransform(current.current);};
  element.addEventListener('wheel',wheel,{passive:false});return()=>{observer.disconnect();element.removeEventListener('wheel',wheel);};
 },[]);
 useLayoutEffect(()=>{
  const element=popup.current,frame=viewport.current;if(!selected||!element||!frame)return;
  const place=()=>{
   const pinX=selected.xPercent/100*frame.clientWidth*transform.scale+transform.x,pinY=selected.yPercent/100*frame.clientHeight*transform.scale+transform.y;
   const left=Math.max(6,Math.min(frame.clientWidth-element.offsetWidth-6,pinX-element.offsetWidth/2));const above=pinY-element.offsetHeight-25;
   element.style.left=`${left}px`;element.style.top=`${Math.max(6,Math.min(frame.clientHeight-element.offsetHeight-6,above<6?pinY+25:above))}px`;
  };
  place();const observer=new ResizeObserver(place);observer.observe(element);return()=>observer.disconnect();
 },[selected,transform,size]);
 function pointerDown(event:PointerEvent<HTMLDivElement>){if((event.target as Element).closest('button,a,[data-popup]'))return;event.preventDefault();onSelect(null);pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});drag.current={x:event.clientX,y:event.clientY,transform:current.current};event.currentTarget.setPointerCapture(event.pointerId);}
 function pointerMove(event:PointerEvent<HTMLDivElement>){
  if(!pointers.current.has(event.pointerId))return;
  const previous=[...pointers.current.values()];pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const next=[...pointers.current.values()];
  if(next.length===2&&previous.length===2){const before=Math.hypot(previous[1].x-previous[0].x,previous[1].y-previous[0].y),after=Math.hypot(next[1].x-next[0].x,next[1].y-next[0].y);const rect=event.currentTarget.getBoundingClientRect();if(before>0){const middle={x:(previous[0].x+previous[1].x)/2-rect.left,y:(previous[0].y+previous[1].y)/2-rect.top};const zoomed=zoomAtPoint(current.current,current.current.scale*after/before,middle);paint({...zoomed,x:zoomed.x+(next[0].x+next[1].x-previous[0].x-previous[1].x)/2,y:zoomed.y+(next[0].y+next[1].y-previous[0].y-previous[1].y)/2});}return;}
  if(drag.current)paint({...drag.current.transform,x:drag.current.transform.x+event.clientX-drag.current.x,y:drag.current.transform.y+event.clientY-drag.current.y});
 }
 function pointerEnd(event:PointerEvent<HTMLDivElement>){pointers.current.delete(event.pointerId);const remaining=[...pointers.current.values()][0];drag.current=remaining?{...remaining,transform:current.current}:null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}
 const selectedCategory=selected?categories.find(category=>category.id===selected.categoryId)!:null;
 return <div ref={viewport} data-stage-wrap className="map-viewport" style={{aspectRatio:`${region.width}/${region.height}`}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onKeyDown={event=>{if(event.key==='Escape')onSelect(null);}}>
  <div data-stage data-animated={animate&&!reduced} style={{transform:`translate3d(${transform.x}px,${transform.y}px,0) scale(${transform.scale})`}}>
   <div data-plate className="map-plate">{image??<div className="map-plate-placeholder"><div aria-hidden="true"/><div><span>{region.plateLabel}</span><small>{region.width} × {region.height}</small><small>{labels.demo} · {region.plateNote}</small></div></div>}</div>
   {pins.map(pin=>{const category=categories.find(category=>category.id===pin.categoryId)!;const visible=visibleIds.includes(pin.id);return <button key={pin.id} type="button" data-pin={pin.id} data-visible={visible} aria-hidden={!visible} inert={!visible} tabIndex={visible?0:-1} className="map-pin" style={{...toneStyle(category),left:`${pin.xPercent}%`,top:`${pin.yPercent}%`}} aria-label={pin.label} title={pin.label} onClick={()=>onSelect(pin)} onFocus={()=>onSelect(pin)}><CategoryIcon category={category}/></button>;})}
  </div>
  <div data-zoom className="map-zoom">{(['in','out','reset'] as const).map(action=><button key={action} type="button" data-zoom-btn={action} aria-label={action==='in'?labels.zoomIn:action==='out'?labels.zoomOut:labels.zoomReset} title={action==='in'?labels.zoomIn:action==='out'?labels.zoomOut:labels.zoomReset} disabled={action==='in'?transform.scale>=4:action==='out'?transform.scale<=1:false} onClick={()=>{onSelect(null);if(action==='reset')paint(identity,true);else zoom(current.current.scale*(action==='in'?1.4:1/1.4),undefined,true);}}>{action==='in'?'+':action==='out'?'−':'⤾'}</button>)}</div>
  <output data-zoom-level className="map-zoom-level" aria-label={labels.mapZoom}>{Math.round(transform.scale*100)}%</output>
  <div ref={popup} data-popup hidden={!selected} className="map-popup" role="status" aria-live="polite">{selected&&selectedCategory&&<><span className="map-popup-category" style={{color:`var(--${selectedCategory.tone})`}}>{selectedCategory.icon} {selectedCategory.label}</span><strong>{selected.label}</strong><p>{selected.description}</p><small>{labels[selected.verification]}</small>{pinLinks[selected.id]&&<Link href={pinLinks[selected.id]}>{labels.details}</Link>}<button type="button" aria-label={labels.close} onClick={()=>onSelect(null)}>×</button></>}</div>
 </div>;
}
export function MapViewport({record,siteId,labels,regionImages,progressImage,pinLinks,ads}:{record:InteractiveMapRecord;siteId:string;labels:Labels;regionImages:Record<string,ReactNode>;progressImage:ReactNode;pinLinks:Record<string,string>;ads:AdsConfig}){
 const [regionId,setRegionId]=useState(()=>record.regions.find(region=>!region.disabled)!.id);const [enabled,setEnabled]=useState(()=>record.categories.map(category=>category.id));const [query,setQuery]=useState('');const [selected,setSelected]=useState<MapPin|null>(null);
 const storageKey=mapProgressKey(siteId,record.mapId,record.dataVersion);const clearTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const [progress,setProgress]=useState({found:new Set<string>(),ready:false,error:false,cleared:false});
 const collectibleIds=record.pins.filter(pin=>pin.collectible).map(pin=>pin.id);const collectibleSignature=JSON.stringify(collectibleIds);
 useEffect(()=>{
  let found=new Set<string>(),error=false;try{found=parseMapProgress(window.localStorage.getItem(storageKey),JSON.parse(collectibleSignature));}catch{error=true;}
  const timer=setTimeout(()=>setProgress({found,ready:true,error,cleared:false}),0);return()=>{clearTimeout(timer);if(clearTimer.current)clearTimeout(clearTimer.current);};
 },[storageKey,collectibleSignature]);
 function mark(pin:MapPin){if(!pin.collectible||!progress.ready)return;const found=new Set(progress.found);if(found.has(pin.id))found.delete(pin.id);else found.add(pin.id);try{window.localStorage.setItem(storageKey,JSON.stringify([...found]));}catch{setProgress({...progress,error:true,cleared:false});return;}setProgress({found,ready:true,error:false,cleared:false});}
 function reset(){if(clearTimer.current)clearTimeout(clearTimer.current);try{window.localStorage.removeItem(storageKey);}catch{setProgress({...progress,error:true,cleared:false});return;}setProgress({found:new Set(),ready:true,error:false,cleared:true});clearTimer.current=setTimeout(()=>setProgress(current=>({...current,cleared:false})),2000);}
 const region=record.regions.find(region=>region.id===regionId)!;const regionPins=record.pins.filter(pin=>pin.regionId===regionId);const search=normalize(query);const visiblePins=regionPins.filter(pin=>enabled.includes(pin.categoryId)&&(!search||normalize(`${pin.label} ${pin.description} ${record.categories.find(category=>category.id===pin.categoryId)!.label}`).includes(search)));
 const foundIn=(id:string)=>record.pins.filter(pin=>pin.regionId===id&&pin.collectible&&progress.found.has(pin.id)).length;
 function categories(ids:string[]){setEnabled(ids);setSelected(null);}
 const a2=(anchor:string,position:'before'|'after')=><ConfiguredAdSlot ads={ads} placement="a2" template="interactive-map" anchor={anchor} position={position}/>;
 return <>
  {a2('map','before')}
  <Reveal as="section" id="map" data-floor="map" className="map-floor map-first" aria-label={record.sections.map.title}>
   <div data-regions role="group" aria-label={labels.chooseRegion} className="map-regions">{record.regions.map(row=><button type="button" key={row.id} data-region={row.id} aria-pressed={regionId===row.id} disabled={row.disabled} onClick={()=>{setRegionId(row.id);setSelected(null);}}><small>{row.chapterLabel}</small><span>{row.label}</span><small>{row.disabled?labels.unrevealed:`${foundIn(row.id)} / ${row.knownTotal??labels.unknown} ${labels.found}`}</small></button>)}</div>
   <div className="map-grid"><MapPlate key={regionId} region={region} pins={regionPins} categories={record.categories} visibleIds={visiblePins.map(pin=>pin.id)} image={regionImages[regionId]} selected={selected} onSelect={setSelected} labels={labels} pinLinks={pinLinks}/>
    <aside className="map-categories" aria-labelledby="map-categories-title"><div className="map-categories-title" id="map-categories-title">{labels.pinCategories}</div><div data-cats role="group" aria-labelledby="map-categories-title">{record.categories.map(category=><label key={category.id} data-cat-row style={toneStyle(category)}><input type="checkbox" data-cat-toggle={category.id} checked={enabled.includes(category.id)} onChange={event=>categories(event.target.checked?[...enabled,category.id]:enabled.filter(id=>id!==category.id))}/><CategoryIcon category={category}/><span><span>{category.label}</span><small>{category.description}</small></span><small>{regionPins.filter(pin=>pin.categoryId===category.id).length}</small></label>)}</div><div className="map-category-actions"><button type="button" data-cat-all onClick={()=>categories(record.categories.map(category=>category.id))}>{labels.showAllPins}</button><button type="button" data-cat-none onClick={()=>categories([])}>{labels.hideAllPins}</button></div></aside>
   </div><p className="map-note">{record.mapNote}</p>
  </Reveal>{a2('map','after')}{a2('legend','before')}
  <Reveal as="section" id="legend" data-floor="legend" className="map-floor"><SectionHeading {...record.sections.legend}/><div className="map-legend">{record.categories.map(category=><div key={category.id}><CategoryIcon category={category}/><div><span>{category.label} <small>{record.pins.filter(pin=>pin.categoryId===category.id).length}</small></span><p>{category.description}</p></div></div>)}</div></Reveal>
  <AdContentSlot/>{a2('legend','after')}{a2('locations','before')}
  <Reveal as="section" id="locations" data-floor="locations" className="map-floor"><SectionHeading {...record.sections.locations}/><div className="map-search"><label><span>{labels.searchPins}</span><input type="search" data-loc-search value={query} placeholder={labels.searchPins} onChange={event=>{setQuery(event.target.value);setSelected(null);}}/></label><span data-loc-count role="status" aria-live="polite">{visiblePins.length} / {regionPins.length} · {region.label} · {labels.results}</span></div><div data-loc-list className="map-locations">{visiblePins.map(pin=>{const category=record.categories.find(row=>row.id===pin.categoryId)!;return <article key={pin.id} data-loc={pin.id} data-collected={progress.found.has(pin.id)}>{pin.collectible&&<input type="checkbox" data-found={pin.id} checked={progress.found.has(pin.id)} disabled={!progress.ready} aria-label={`${labels.found}: ${pin.label}`} onChange={()=>mark(pin)}/>}<CategoryIcon category={category}/><div><button className="map-location-name" type="button" onClick={()=>setSelected(pin)}>{pin.label}</button><small>{region.label} · {category.label}</small><p>{pin.description}</p>{pinLinks[pin.id]&&<Link href={pinLinks[pin.id]}>{labels.details}</Link>}</div><span className="map-verification" data-verification={pin.verification}>{labels[pin.verification]}</span></article>;})}{!visiblePins.length&&<p data-loc-empty className="map-empty">{labels.noResults}</p>}</div><p className="map-note">{record.locationsNote}</p></Reveal>
  {a2('locations','after')}{a2('progress','before')}
  <Reveal as="section" id="progress" data-floor="progress" className="map-floor"><SectionHeading {...record.sections.progress}/><div className="map-progress-grid"><div><div data-progress className="map-progress">{record.regions.map(row=>row.knownTotal!==null&&row.knownTotal>0?<CoverageMeter key={row.id} label={`${row.label} · ${row.chapterLabel}`} documented={foundIn(row.id)} total={row.knownTotal} unknown={labels.unknown}/>:<div key={row.id}><div><span>{row.label} <small>{row.chapterLabel}</small></span><span>{foundIn(row.id)} / {row.knownTotal??labels.unknown}</span></div><small>{labels.knownTotal}: {row.knownTotal??labels.unknown}</small></div>)}</div><p data-progress-summary aria-live="polite">{progress.found.size} {labels.found} · {labels.knownTotal}: {record.knownTotal??labels.unknown}</p><div className="map-clear"><button type="button" data-clear disabled={!progress.ready} onClick={reset}>{labels.resetProgress}</button>{progress.cleared&&<span data-clear-note role="status">{labels.progressCleared}</span>}</div><p className="map-note">{labels.localOnly}</p>{progress.error&&<p data-map-storage-error role="alert" className="map-storage-error">{labels.storageFailed} {labels.mapStorageRecovery}</p>}</div><div>{progressImage??<div className="map-comparison-placeholder"><span>{record.progressImageLabel}</span><small>1200 × 900 · {labels.demo}</small></div>}<p className="map-caption">{record.progressCaption}</p></div></div></Reveal>
  {a2('progress','after')}
 </>;
}
