'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {motionMilliseconds,useReducedMotion} from '@/components/motion/useReducedMotion';
import '@/components/motion/motion.css';
export function Disclosure({question,children,initialOpen=false}:{question:string;children:ReactNode;initialOpen?:boolean}){
 const details=useRef<HTMLDetailsElement>(null);const summary=useRef<HTMLElement>(null);const body=useRef<HTMLDivElement>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const frame=useRef(0);const intendedOpen=useRef(initialOpen);const [expanded,setExpanded]=useState(initialOpen);const [renderOpen,setRenderOpen]=useState(initialOpen);const reduced=useReducedMotion();
 const clear=()=>{if(timer.current)clearTimeout(timer.current);cancelAnimationFrame(frame.current);};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);cancelAnimationFrame(frame.current);},[]);
 useEffect(()=>{if(reduced){frame.current=requestAnimationFrame(()=>{if(timer.current)clearTimeout(timer.current);setRenderOpen(expanded);});return()=>cancelAnimationFrame(frame.current);}},[reduced,expanded]);
 function toggle(){
  clear();const next=!intendedOpen.current;intendedOpen.current=next;
  if(next){setRenderOpen(true);if(reduced)setExpanded(true);else frame.current=requestAnimationFrame(()=>{frame.current=requestAnimationFrame(()=>setExpanded(true));});}
  else{if(body.current?.contains(document.activeElement))summary.current?.focus();setExpanded(false);if(reduced)setRenderOpen(false);else timer.current=setTimeout(()=>setRenderOpen(false),motionMilliseconds(details.current!,'--d-expand',320));}
 }
 return <details ref={details} data-faq className="disclosure" open={renderOpen} data-expanded={expanded}><summary ref={summary} aria-expanded={expanded} onClick={event=>{event.preventDefault();toggle();}}><span className="disclosure-edge" aria-hidden="true"/><span>{question}</span><span className="disclosure-caret" aria-hidden="true"/></summary><div ref={body} className="disclosure-body" inert={!expanded} aria-hidden={!expanded} onTransitionEnd={event=>{if(event.target===event.currentTarget&&event.propertyName==='grid-template-rows'&&!expanded){clear();setRenderOpen(false);}}}><div><div className="disclosure-inner">{children}</div></div></div></details>;
}
