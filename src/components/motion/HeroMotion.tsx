'use client';
import {Fragment,useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type HTMLAttributes} from 'react';
import {motionMilliseconds,useReducedMotion} from './useReducedMotion';
import './motion.css';
export function HeroTitle({title,fontSize='var(--fluid-d1)',split='word',className='',...props}:{title:string;fontSize?:string;split?:'word'|'char';className?:string}&Omit<HTMLAttributes<HTMLHeadingElement>,'children'>){
 const heading=useRef<HTMLHeadingElement>(null);
 useLayoutEffect(()=>{
  const element=heading.current;if(!element)return;let frame=0;let active=true;
  const fit=()=>{
   const parent=element.parentElement;if(!parent)return;
   const parentStyle=getComputedStyle(parent);const available=parent.clientWidth-parseFloat(parentStyle.paddingLeft)-parseFloat(parentStyle.paddingRight);if(available<=0)return;
   const probe=element.cloneNode(true) as HTMLHeadingElement;probe.removeAttribute('id');probe.removeAttribute('data-hero-title');probe.removeAttribute('data-hero-words');probe.classList.remove('motion-hero-title');probe.setAttribute('aria-hidden','true');probe.inert=true;probe.querySelector('.sr-only')?.remove();
   Object.assign(probe.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:element.style.width||`${available}px`,height:'auto',maxHeight:'none',minHeight:'0',overflow:'visible',display:'block',fontSize,padding:'0',margin:'0',contain:'layout style',whiteSpace:'normal',webkitLineClamp:'unset'});
   // The reduced-motion foundation sets a universal duration. Measurements must never interpolate.
   for(const node of [probe,...probe.querySelectorAll<HTMLElement>('*')]){node.style.setProperty('transition-property','none','important');node.style.setProperty('animation','none','important');node.style.setProperty('transform','none','important');}
   parent.appendChild(probe);const authored=parseFloat(getComputedStyle(probe).fontSize);const width=probe.getBoundingClientRect().width;
   // Freeze the width at the authored font size: a 22ch maximum must not shrink with each step.
   probe.style.width=`${width}px`;probe.style.maxWidth='none';
   const fitsAt=(scale:number)=>{
    probe.style.fontSize=`${authored*scale}px`;const lineHeight=parseFloat(getComputedStyle(probe).lineHeight)||authored*scale*1.1;const bounds=probe.getBoundingClientRect();
    const glyphs=[...probe.querySelectorAll<HTMLElement>('[data-word]>span')];
    return bounds.height<=lineHeight*2+1&&glyphs.every(glyph=>{const rect=glyph.getBoundingClientRect();return rect.left>=bounds.left-1&&rect.right<=bounds.right+1&&rect.top>=bounds.top-1&&rect.bottom<=bounds.top+lineHeight*2+1;});
   };
   const minimumScale=Math.min(.55,20/authored);let chosen=.68;let fits=false;
   for(const scale of [1,.92,.85,.78,.72,.68])if(fitsAt(scale)){chosen=scale;fits=true;break;}
   if(!fits){let lower=minimumScale,upper=.68;for(let attempt=0;attempt<14;attempt++){const middle=(lower+upper)/2;if(fitsAt(middle))lower=middle;else upper=middle;}chosen=fitsAt(lower)?lower:minimumScale;}
   probe.remove();element.style.setProperty('--hero-fitted-size',`${authored*chosen}px`);element.style.setProperty('--hero-fit-width',`${width}px`);element.dataset.titleFit=String(chosen);
  };
  const queue=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};fit();const observer=new ResizeObserver(queue);observer.observe(element);if(element.parentElement)observer.observe(element.parentElement);window.addEventListener('resize',queue);document.fonts.ready.then(()=>{if(active)queue();});document.fonts.addEventListener('loadingdone',queue);
  return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',queue);document.fonts.removeEventListener('loadingdone',queue);};
 },[title,fontSize]);
 let index=0;const words=title.trim().split(/\s+/);const cjk=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
 const glyph=(text:string,key:number)=><span data-word key={key}><span style={{'--hero-word-index':index++} as CSSProperties}>{text}</span></span>;
 const characters=(word:string)=>Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(word),segment=>segment.segment);
 return <h1 {...props} ref={heading} className={`motion-hero-title ${className}`} data-hero-title data-hero-words={split} style={{...props.style,'--hero-authored-size':fontSize} as CSSProperties}><span className="sr-only">{title}</span><span aria-hidden="true">{words.map((word,wordIndex)=><Fragment key={`${word}:${wordIndex}`}>{cjk.test(word)?characters(word).map(glyph):split==='char'?<span className="hero-word-group">{characters(word).map(glyph)}</span>:glyph(word,wordIndex)}{wordIndex<words.length-1?' ':null}</Fragment>)}</span></h1>;
}
export function HeroMotion({children,...props}:HTMLAttributes<HTMLElement>){
 const hero=useRef<HTMLElement>(null);const enteredOnce=useRef(false);const [entered,setEntered]=useState(false);const [sweeping,setSweeping]=useState(false);const reduced=useReducedMotion();
 useLayoutEffect(()=>{
  const element=hero.current;if(!element)return;element.dataset.motionReady='true';
  element.querySelectorAll<HTMLElement>('[data-hero-step]').forEach((step,index)=>step.style.setProperty('--hero-step-index',String(index+1)));
 },[children]);
 useEffect(()=>{
  const element=hero.current;if(!element)return;let active=true;const timers=new Set<ReturnType<typeof setTimeout>>();let frame=0;let observer:IntersectionObserver|undefined;
  const later=(callback:()=>void,delay:number)=>{const timer=setTimeout(()=>{timers.delete(timer);if(active)callback();},delay);timers.add(timer);};
  if(reduced||enteredOnce.current){frame=requestAnimationFrame(()=>{enteredOnce.current=true;setEntered(true);setSweeping(false);});return()=>cancelAnimationFrame(frame);}
  const count=element.querySelectorAll('[data-word]').length;const duration=motionMilliseconds(element,'--d-hero',1200);const stagger=motionMilliseconds(element,'--stagger-line',60);const budget=Math.max(0,motionMilliseconds(element,'--d-ambient',2400)-duration);const step=count>1?Math.min(stagger*1.6,budget/(count-1)):0;element.style.setProperty('--hero-word-stagger',`${step}ms`);
  const play=()=>{if(enteredOnce.current)return;enteredOnce.current=true;observer?.disconnect();later(()=>{frame=requestAnimationFrame(()=>{if(!active)return;setEntered(true);if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){later(()=>{setSweeping(true);later(()=>setSweeping(false),duration+80);},duration+Math.round(step*Math.max(0,count-1))+stagger*element.querySelectorAll('[data-hero-step]').length+500);}});},motionMilliseconds(element,'--d-ui',240));};
  const ready=()=>{if(!active)return;const target=element.querySelector('[data-hero-title]')??element;if(!('IntersectionObserver'in window)){play();return;}observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))play();},{threshold:.15});observer.observe(target);};
  let fontsDone=false;const fontsReady=()=>{if(fontsDone)return;fontsDone=true;ready();};document.fonts.ready.then(fontsReady);later(fontsReady,1200);
  return()=>{active=false;cancelAnimationFrame(frame);observer?.disconnect();for(const timer of timers)clearTimeout(timer);};
 },[reduced]);
 useEffect(()=>{
  const element=hero.current;if(!element)return;const art=element.querySelector<HTMLElement>('.media-slot--hero,.media-slot--inner-hero,[data-hero-art]');let frame=0;
  const reset=()=>element.style.setProperty('--hero-title-y','0px');
  const pointer=window.matchMedia('(pointer: fine)');if(reduced){reset();return;}
  const draw=()=>{frame=0;if(!pointer.matches){reset();return;}const bounds=element.getBoundingClientRect();const seen=Math.min(1,Math.max(0,-bounds.top/Math.max(1,element.offsetHeight)));const raw=parseFloat(getComputedStyle(element).getPropertyValue('--parallax-max'));const cap=(art?.offsetHeight??element.offsetHeight)*Math.min(8,Math.max(0,Number.isFinite(raw)?raw:8))/100;element.style.setProperty('--hero-title-y',`${-seen*cap*.5}px`);};
  const queue=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);pointer.addEventListener('change',queue);queue();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);pointer.removeEventListener('change',queue);reset();};
 },[reduced]);
 return <section {...props} ref={hero} data-motion-hero data-entered={reduced||entered} data-sweep-running={sweeping}>{children}</section>;
}
