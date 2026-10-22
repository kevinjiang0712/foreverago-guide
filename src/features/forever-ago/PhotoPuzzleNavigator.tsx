'use client';
import {useState,useSyncExternalStore,type FormEvent} from 'react';
import './photo-puzzle-navigator.css';

export type PhotoPuzzleStop={id:string;label:string};
const subscribe=()=>()=>{};

export function PhotoPuzzleNavigator({stops}:{stops:PhotoPuzzleStop[]}){
 const [selected,setSelected]=useState(stops[0].id);
 const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
 function jump(event:FormEvent){
  event.preventDefault();
  const heading=document.getElementById(selected);
  if(!heading)return;
  window.location.hash=selected;
  heading.setAttribute('tabindex','-1');
  heading.focus({preventScroll:true});
 }
 return <nav className="photo-puzzle-navigator" aria-labelledby="photo-puzzle-jump-title">
  <h2 id="photo-puzzle-jump-title">Where are you stuck?</h2>
  <form onSubmit={jump}>
   <label htmlFor="photo-puzzle-scene">Choose your current step</label>
   <div><select id="photo-puzzle-scene" value={selected} disabled={!ready} onChange={event=>setSelected(event.target.value)}>{stops.map(stop=><option key={stop.id} value={stop.id}>{stop.label}</option>)}</select><button type="submit" disabled={!ready}>Go to solution</button></div>
  </form>
  <details><summary>Or follow a scene link</summary><ul>{stops.map(stop=><li key={stop.id}><a href={`#${stop.id}`}>{stop.label}</a></li>)}</ul></details>
  <noscript><p>The selector needs JavaScript. Open the scene links above; every solution and image is available below.</p></noscript>
 </nav>;
}
