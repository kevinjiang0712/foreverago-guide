import type {ContentIndex} from '@/content/types';
import type {CompletionEntry,LinkedCompletionEntry} from './completion-data';

export function linkCompletionEntries(index:Pick<ContentIndex,'pagesByKey'>,locale:string,entries:CompletionEntry[]):LinkedCompletionEntry[] {
  return entries.map(entry=>{
    const guide=index.pagesByKey[`${locale}:${entry.guideId}`];
    if(!guide)throw new Error(`Completion task ${entry.id} has no guide: ${locale}:${entry.guideId}.`);
    const heading=guide.headings.find(candidate=>candidate.text===entry.guideHeading);
    if(!heading)throw new Error(`Completion task ${entry.id} has no guide heading: ${entry.guideId} — ${entry.guideHeading}.`);
    return {...entry,href:`${guide.path}#${heading.id}`};
  });
}
