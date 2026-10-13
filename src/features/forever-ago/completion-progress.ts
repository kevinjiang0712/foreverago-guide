import {completionEntries,type CompletionEntry} from './completion-data';

export type CompletionProgress = Record<string,number>;
export const completionStorageKey = 'forever-ago:completion:v1';
export function completionStageCount(entry:Pick<CompletionEntry,'type'>):number {return entry.type==='memory'?3:1;}

export function parseCompletionProgress(raw:string|null):CompletionProgress {
  if(raw===null)return {};
  let saved:unknown;
  try{saved=JSON.parse(raw);}catch(error){if(error instanceof SyntaxError)throw new Error('Completion progress is not valid JSON.',{cause:error});throw error;}
  if(!saved||typeof saved!=='object'||Array.isArray(saved))throw new Error('Completion progress must be an object with version and progress.');
  const envelope=saved as Record<string,unknown>;
  if(envelope.version!==1)throw new Error(`Unsupported completion progress version: ${JSON.stringify(envelope.version)}.`);
  if(!envelope.progress||typeof envelope.progress!=='object'||Array.isArray(envelope.progress))throw new Error('Completion progress has no valid progress map.');
  const progress:CompletionProgress={};
  for(const [id,stage] of Object.entries(envelope.progress)){
    const entry=completionEntries.find(candidate=>candidate.id===id);
    if(!entry)throw new Error(`Completion progress contains an unknown task: ${id}.`);
    if(typeof stage!=='number'||!Number.isInteger(stage)||stage<0||stage>completionStageCount(entry))throw new Error(`Invalid completion stage for ${id}: ${JSON.stringify(stage)}.`);
    if(stage>0)progress[id]=stage;
  }
  return progress;
}
export function serializeCompletionProgress(progress:CompletionProgress):string {
  const raw=JSON.stringify({version:1,progress});
  parseCompletionProgress(raw);
  return raw;
}
export function readCompletionProgress(storage:Pick<Storage,'getItem'>):CompletionProgress {return parseCompletionProgress(storage.getItem(completionStorageKey));}
export function writeCompletionProgress(storage:Pick<Storage,'setItem'>,progress:CompletionProgress):void {storage.setItem(completionStorageKey,serializeCompletionProgress(progress));}

export function changeCompletionStage(progress:CompletionProgress,entry:CompletionEntry,stage:number,checked:boolean):CompletionProgress {
  const maximum=completionStageCount(entry);
  if(!Number.isInteger(stage)||stage<1||stage>maximum)throw new Error(`Invalid requested completion stage for ${entry.id}: ${stage}.`);
  const current=progress[entry.id]??0;
  const next=checked?Math.max(current,stage):Math.min(current,stage-1);
  const changed={...progress};
  if(next===0)delete changed[entry.id];else changed[entry.id]=next;
  return changed;
}
