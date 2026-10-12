'use client';
import {useEffect,useRef,useState} from 'react';
import './copy-button.css';
import {copyPreset} from '@/content/copy-preset';
export function CopyButton({code,labels}:{code:string;labels:{copy:string;copied:string;copyFailed:string}}){
 const [state,setState]=useState<'idle'|'pending'|'copied'|'failed'>('idle');const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current);};},[]);
 async function copy(){if(timer.current)clearTimeout(timer.current);setState('pending');try{await copyPreset(code);}catch{if(mounted.current)setState('failed');return;}if(!mounted.current)return;setState('copied');timer.current=setTimeout(()=>setState('idle'),1600);}
 return <div className="preset-copy"><code data-code tabIndex={0}>{code}</code><button type="button" className="button button-ghost" data-copy data-pulse={state==='copied'} disabled={state==='pending'} onClick={copy}>{state==='copied'?labels.copied:labels.copy}</button><span className="visually-hidden" role="status">{state==='copied'?labels.copied:''}</span>{state==='failed'&&<p role="alert" data-copy-error>{labels.copyFailed}</p>}</div>;
}
