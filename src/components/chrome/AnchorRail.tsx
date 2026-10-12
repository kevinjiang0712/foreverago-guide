'use client';
import {useEffect,useState} from 'react';
import type {Heading} from '@/content/types';
import {Picker} from '@/components/interactive/Picker';
import {useLocale} from './LocaleContext';
export function AnchorRail({headings,label,mobilePicker=true}:{headings:Heading[];label:string;mobilePicker?:boolean}){
 const {dictionary}=useLocale();const [active,setActive]=useState(headings[0]?.id??'');
 useEffect(()=>{
  const elements=headings.map(heading=>document.getElementById(heading.id)).filter((node):node is HTMLElement=>Boolean(node));
  const update=()=>{
   const activationLine=elements.reduce((largest,element)=>Math.max(largest,Number.parseFloat(getComputedStyle(element).scrollMarginTop)||0),0)+1;
   const passed=elements.filter(element=>element.getBoundingClientRect().top<=activationLine);setActive(passed.at(-1)?.id??elements[0]?.id??'');
  };
  update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);
 },[headings]);
 if(!headings.length)return null;
 const choose=(id:string)=>{setActive(id);document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <nav className="anchor-rail" aria-label={label} data-rail><div className="container"><div className="anchor-rail-links">{headings.map(heading=><a key={heading.id} href={`#${heading.id}`} aria-current={heading.id===active?'location':undefined}>{heading.text}</a>)}</div>{mobilePicker&&<div className="anchor-rail-picker"><Picker label={label} closeLabel={dictionary.ui.close} value={active} options={headings.map(heading=>({value:heading.id,label:heading.text}))} onChange={choose}/></div>}</div></nav>;
}
