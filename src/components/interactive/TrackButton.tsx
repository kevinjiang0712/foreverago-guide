'use client';
import {useEffect,useRef,useState} from 'react';
import {modTrackingKey,readModTracking,writeModTracking} from '@/content/mod-tracking';
export function TrackButton({siteId,modId,dataVersion,labels}:{siteId:string;modId:string;dataVersion:string;labels:{track:string;tracking:string;localOnly:string;storageFailed:string}}){
 const key=modTrackingKey(siteId,modId,dataVersion);const [state,setState]=useState({tracked:false,ready:false,error:false,pulse:false});const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{let tracked=false,error=false;try{tracked=readModTracking(window.localStorage,key);}catch{error=true;}const hydrate=setTimeout(()=>setState({tracked,ready:true,error,pulse:false}),0);return()=>{clearTimeout(hydrate);if(timer.current)clearTimeout(timer.current);};},[key]);
 function toggle(){if(timer.current)clearTimeout(timer.current);const tracked=!state.tracked;try{writeModTracking(window.localStorage,key,tracked);}catch{setState({...state,error:true,pulse:false});return;}setState({tracked,ready:true,error:false,pulse:true});timer.current=setTimeout(()=>setState(current=>({...current,pulse:false})),280);}
 return <div className="mod-track"><button type="button" className="button button-ghost" data-track data-pulse={state.pulse} aria-pressed={state.tracked} disabled={!state.ready} onClick={toggle}>{state.tracked?labels.tracking:labels.track}</button><p>{labels.localOnly}</p>{state.error&&<p role="alert" data-track-error>{labels.storageFailed}</p>}</div>;
}
