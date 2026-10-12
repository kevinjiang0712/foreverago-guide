'use client';
import {useLayoutEffect,useState} from 'react';
import type {Dictionary} from '@/content/schemas/dictionary';
export function ModeToggle({siteId,defaultMode,labels}:{siteId:string;defaultMode:'day'|'night';labels:Pick<Dictionary['ui'],'appearance'|'day'|'night'|'storageFailed'>}){
 const [mode,setMode]=useState(defaultMode);const [storageFailed,setStorageFailed]=useState(false);
 // Synchronize the prepaint DOM preference after hydration; the server always uses defaultMode.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useLayoutEffect(()=>{const painted=document.documentElement.dataset.mode;if(painted==='day'||painted==='night')setMode(painted);},[]);
 function toggle(){const next=mode==='night'?'day':'night';document.documentElement.dataset.mode=next;setMode(next);try{localStorage.setItem(`${siteId}:mode`,next);setStorageFailed(false);}catch{setStorageFailed(true);}}
 const label=`${labels.appearance}: ${mode==='night'?labels.day:labels.night}`;
 return <><button className="site-mode" data-modepill type="button" role="switch" aria-checked={mode==='night'} aria-label={`${labels.appearance}: ${labels.night}`} title={label} onClick={toggle}><span aria-hidden="true" className="site-mode-glyph" data-mode={mode}/></button>{storageFailed&&<span className="sr-only" role="status">{labels.storageFailed}</span>}</>;
}
