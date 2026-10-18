import type {AdsConfig} from '@/content/schemas/ads';

export type RevenueSlot='native'|'left'|'right'|'inline'|'anchor';
export type AdScriptStatus='script-error'|'script-loaded';
export const bannerSizes={left:[160,300],right:[160,600],inline:[300,250],anchor:[320,50]} as const;
let bannerLoads=Promise.resolve();
let nativeLoads=Promise.resolve();

export function loadAdScript(canvas:HTMLDivElement,ads:AdsConfig,slot:RevenueSlot,report:(status:AdScriptStatus)=>void,onRequest?:()=>void){
 const unit=ads.adsterra?.units[slot];
 if(!unit)throw new Error(`Missing Adsterra unit: ${slot}`);
 let cancelled=false;
 let script:HTMLScriptElement|undefined;
 const appendScript=(complete:()=>void)=>{
  script=document.createElement('script');
  script.src=unit.scriptUrl;
  script.async=slot==='native';
  script.dataset.cfasync='false';
  const finish=(status:AdScriptStatus)=>{
   if(script){script.onload=null;script.onerror=null;}
   complete();if(!cancelled)report(status);
  };
  script.onload=()=>finish('script-loaded');
  script.onerror=()=>finish('script-error');
  onRequest?.();
  canvas.append(script);
 };
 if(slot==='native'&&!('containerId' in unit))throw new Error(`Missing Adsterra Native container ID: ${slot}`);
 if(slot!=='native'&&!('key' in unit))throw new Error(`Missing Adsterra Banner key: ${slot}`);
 // Each format waits for load/error. Native has its own queue and only exposes
 // its fixed container ID when the previous page's script has finished.
 const loading=(slot==='native'?nativeLoads:bannerLoads).then(()=>new Promise<void>(resolve=>{
  if(cancelled||!canvas.isConnected){resolve();return;}
  if(slot==='native'&&'containerId' in unit){
   canvas.id=unit.containerId;
  }else if(slot!=='native'&&'key' in unit){
   const size=bannerSizes[slot];
   (window as Window&{atOptions?:unknown}).atOptions={key:unit.key,format:'iframe',width:size[0],height:size[1],params:{}};
  }
  appendScript(resolve);
 }));
 if(slot==='native')nativeLoads=loading;else bannerLoads=loading;
 return()=>{
  cancelled=true;
  // Removing an in-flight script does not stop its execution. Keep its
  // load/error callback and the format's lock until the response completes.
  script?.remove();
  if(slot==='native')canvas.removeAttribute('id');
  canvas.replaceChildren();
 };
}
