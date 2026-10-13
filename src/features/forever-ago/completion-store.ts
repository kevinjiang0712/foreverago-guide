'use client';
import {useSyncExternalStore} from 'react';
import {completionStorageKey,readCompletionProgress,writeCompletionProgress,type CompletionProgress} from './completion-progress';

type CompletionSnapshot = {progress:CompletionProgress;status:'loading'|'saved'|'unavailable'|'damaged'};
const serverSnapshot:CompletionSnapshot={progress:{},status:'loading'};
let browserSnapshot=serverSnapshot;
const listeners=new Set<()=>void>();

function publishCompletionSnapshot(snapshot:CompletionSnapshot){browserSnapshot=snapshot;for(const listener of listeners)listener();}
function loadSavedCompletion(){
  // A failed write leaves newer visit progress than the readable stored copy.
  if(browserSnapshot.status==='unavailable')return;
  let storage:Storage;
  try{storage=window.localStorage;}catch{publishCompletionSnapshot({...browserSnapshot,status:'unavailable'});return;}
  let raw:string|null;
  try{raw=storage.getItem(completionStorageKey);}catch{publishCompletionSnapshot({...browserSnapshot,status:'unavailable'});return;}
  try{publishCompletionSnapshot({progress:readCompletionProgress({getItem:()=>raw}),status:'saved'});}
  catch{publishCompletionSnapshot({...browserSnapshot,status:'damaged'});}
}
function synchronizeCompletion(event:StorageEvent){if(event.key===completionStorageKey||event.key===null)loadSavedCompletion();}
function subscribeToCompletion(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1){window.addEventListener('storage',synchronizeCompletion);loadSavedCompletion();}
  return ()=>{listeners.delete(listener);if(listeners.size===0)window.removeEventListener('storage',synchronizeCompletion);};
}
export function useCompletionProgress(){return useSyncExternalStore(subscribeToCompletion,()=>browserSnapshot,()=>serverSnapshot);}

export function saveCompletionProgress(progress:CompletionProgress,replaceDamagedSave=false){
  if(browserSnapshot.status==='damaged'&&!replaceDamagedSave){publishCompletionSnapshot({progress,status:'damaged'});return;}
  try{writeCompletionProgress(window.localStorage,progress);publishCompletionSnapshot({progress,status:'saved'});}
  catch{publishCompletionSnapshot({progress,status:'unavailable'});}
}
