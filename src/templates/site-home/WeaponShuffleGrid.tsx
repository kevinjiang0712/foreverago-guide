'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import {useReducedMotion} from '@/components/motion/useReducedMotion';

const slotPermutation=[5,2,15,7,10,0,12,4,14,9,3,13,1,11,6,8];

function spritePosition(index:number){
 const coordinate=(index%4)*100/3,row=Math.floor(index/4)*100/3;
 return `${coordinate}% ${row}%`;
}

export function WeaponShuffleGrid({src,label}:{src:string;label:string}){
 const reducedMotion=useReducedMotion();
 const [slots,setSlots]=useState(()=>Array.from({length:16},(_,index)=>index));
 useEffect(()=>{
  if(reducedMotion)return;
  const interval=window.setInterval(()=>setSlots(current=>current.map(slot=>slotPermutation[slot])),3500);
  return()=>window.clearInterval(interval);
 },[reducedMotion]);
 return <div className="weapon-shuffle-grid" role="img" aria-label={label} data-shuffle-active={!reducedMotion}>
  {slots.map((slot,index)=>{const column=slot%4,row=Math.floor(slot/4);return <span className="weapon-shuffle-tile" key={index} style={{'--weapon-column':column,'--weapon-row':row,backgroundImage:`url(${src})`,backgroundPosition:spritePosition(index)} as CSSProperties}/>;})}
 </div>;
}
