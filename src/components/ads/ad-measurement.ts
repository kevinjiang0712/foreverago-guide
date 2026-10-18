import type {RevenueSlot} from './ad-script';

type AdStage='eligible'|'request'|'script_loaded'|'script_error'|'viewable';

// These are browser diagnostics, not billable Adsterra impressions or clicks.
// Slot-specific event names remain queryable without GA4 custom dimensions.
export function recordAdStage(slot:RevenueSlot,stage:AdStage,path:string,attempt=0){
 const tracker=window as Window&{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void};
 const parameters={ad_slot:slot,page_path:path,page_location:new URL(path,window.location.origin).href,ad_attempt:attempt,measurement_basis:stage==='viewable'?'container_50pct_1s':'browser_lifecycle'};
 const command=['event',`ad_${slot}_${stage}`,parameters];
 if(tracker.gtag)tracker.gtag(...command);
 else{tracker.dataLayer??=[];tracker.dataLayer.push(command);}
}

export function observeAdVisibility(element:HTMLElement,visible:()=>void){
 let ratio=0,timer:ReturnType<typeof setTimeout>|undefined,reported=false;
 const check=()=>{
  if(timer){clearTimeout(timer);timer=undefined;}
  if(reported||document.visibilityState!=='visible'||ratio<.5)return;
  timer=setTimeout(()=>{reported=true;visible();},1000);
 };
 const observer=new IntersectionObserver(entries=>{ratio=entries.at(-1)?.intersectionRatio??0;check();},{threshold:[0,.5,1]});
 observer.observe(element);document.addEventListener('visibilitychange',check);
 return()=>{observer.disconnect();document.removeEventListener('visibilitychange',check);if(timer)clearTimeout(timer);};
}
