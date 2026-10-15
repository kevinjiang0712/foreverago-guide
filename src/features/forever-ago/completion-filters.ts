import type {CompletionChapter,CompletionEntry,CompletionType} from './completion-data';

export type CompletionFilters={q:string;stop:CompletionChapter|'all';type:CompletionType|'all';progress:'all'|'remaining'|'done'|'started'};
export const defaultCompletionFilters:CompletionFilters={q:'',stop:'all',type:'all',progress:'all'};

export function parseCompletionFilters(search:string,entries:CompletionEntry[]):CompletionFilters{
  const params=new URLSearchParams(search);
  const stop=params.get('stop');const type=params.get('type');const progress=params.get('progress');
  return {
    q:(params.get('q')??'').slice(0,120),
    stop:entries.some(entry=>entry.chapter===stop)?stop as CompletionChapter:'all',
    type:entries.some(entry=>entry.type===type)?type as CompletionType:'all',
    progress:progress==='remaining'||progress==='done'||(progress==='started'&&entries.some(entry=>entry.type==='memory'))?progress:'all',
  };
}

export function completionFilterSearch(search:string,filters:CompletionFilters):string{
  const params=new URLSearchParams(search);
  for(const key of ['q','stop','type','progress'] as const){
    if(key==='q'?filters.q!=='':filters[key]!=='all')params.set(key,filters[key]);else params.delete(key);
  }
  const encoded=params.toString();return encoded?`?${encoded}`:'';
}
