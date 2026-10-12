'use client';
import {useLayoutEffect,useRef,type HTMLAttributes,type CSSProperties} from 'react';
import {useReducedMotion} from './useReducedMotion';
import './motion.css';
export type RevealProps=HTMLAttributes<HTMLDivElement>&{as?:'div'|'section'|'article'|'aside'|'span';delay?:number};
export function Reveal({as:Tag='div',delay=0,style,...props}:RevealProps){
 const ref=useRef<HTMLDivElement>(null);const played=useRef(false);const reduced=useReducedMotion();
 useLayoutEffect(()=>{
  const element=ref.current;if(!element)return;
  if(played.current||reduced){element.dataset.revealed='true';played.current=true;return;}
  element.dataset.motionReady='true';
  const show=()=>{played.current=true;element.dataset.revealed='true';};
  if(!('IntersectionObserver'in window)){show();return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){show();observer.disconnect();}},{threshold:0});observer.observe(element);
  return()=>observer.disconnect();
 },[reduced]);
 return <Tag {...props} ref={ref} data-motion-reveal style={{...style,'--reveal-delay':`calc(var(--stagger-line) * ${delay})`} as CSSProperties}/>;
}
