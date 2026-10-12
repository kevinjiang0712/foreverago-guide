'use client';
import {useEffect,useRef,type CSSProperties} from 'react';
import {useReducedMotion} from '@/components/motion/useReducedMotion';
import {TickNumber} from '@/components/motion/TickNumber';
import '@/components/motion/motion.css';
export function CoverageMeter({label,documented,total,unknown}:{label:string;documented:number;total:number|null;unknown:string}){
 if(!Number.isFinite(documented)||documented<0||total!==null&&(!Number.isFinite(total)||total<=0||documented>total))throw new Error(`CoverageMeter requires 0 <= documented <= total; received ${documented}/${total}`);
 const meter=useRef<HTMLDivElement>(null);const played=useRef(false);const reduced=useReducedMotion();
 useEffect(()=>{
  const element=meter.current;if(!element)return;
  if(reduced||played.current){element.dataset.meterFilled='true';played.current=true;return;}
  element.dataset.motionReady='true';
  const fill=()=>{played.current=true;element.dataset.meterFilled='true';};
  if(!('IntersectionObserver'in window)){fill();return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){fill();observer.disconnect();}},{threshold:.4});observer.observe(element);return()=>observer.disconnect();
 },[reduced]);
 return <div ref={meter} className="coverage-meter" data-coverage style={{'--meter-fill':`${total===null?0:documented/total*100}%`} as CSSProperties}><div className="coverage-meter-label"><span>{label}</span><span><TickNumber value={documented}/> / {total??unknown}</span></div>{total!==null&&<div className="coverage-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={documented}><div/></div>}</div>;
}
