'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {motionMilliseconds,useReducedMotion} from './useReducedMotion';
import './motion.css';
export function TickNumber({value,suffix='',duration,animate=true,style}:{value:number;suffix?:string;duration?:number;animate?:boolean;style?:CSSProperties}){
 if(!Number.isFinite(value))throw new Error(`TickNumber value must be finite; received ${value}`);
 const ref=useRef<HTMLSpanElement>(null);const [display,setDisplay]=useState(value);const playedValue=useRef<number|null>(null);const reduced=useReducedMotion();
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  let frame=0;let observer:IntersectionObserver|undefined;let active=true;
  const complete=()=>{playedValue.current=value;setDisplay(value);element.dataset.tickComplete='true';};
  if(reduced||!animate||playedValue.current===value){frame=requestAnimationFrame(complete);return()=>cancelAnimationFrame(frame);}
  const run=()=>{
   if(playedValue.current===value)return;playedValue.current=value;observer?.disconnect();
   const length=duration??motionMilliseconds(element,'--d-hero',1200);const start=performance.now();setDisplay(0);element.dataset.tickComplete='false';
   const draw=(now:number)=>{if(!active)return;const progress=length>0?Math.min(1,(now-start)/length):1;const eased=1-Math.pow(1-progress,3);setDisplay(Math.round(value*eased));if(progress<1)frame=requestAnimationFrame(draw);else complete();};frame=requestAnimationFrame(draw);
  };
  if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))run();},{threshold:.4});observer.observe(element);}else run();
  return()=>{active=false;cancelAnimationFrame(frame);observer?.disconnect();};
 },[value,duration,animate,reduced]);
 return <span ref={ref} data-tick={value} className="motion-tick" style={style}><span className="sr-only">{value}{suffix}</span><span aria-hidden="true">{reduced||!animate?value:display}{suffix}</span></span>;
}
