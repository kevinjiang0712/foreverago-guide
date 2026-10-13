import type {ContentIndex,IndexedPage} from '@/content/types';
import {completionToolForPage,entriesForCompletionMode} from './completion-data';
import {linkCompletionEntries} from './completion-links';
import {CompletionTracker} from './CompletionTracker';
import './completion-tool.css';

export function CompletionTool({index,page}:{index:ContentIndex;page:IndexedPage}){
  if(index.site.siteId!=='forever-ago'||page.locale!=='en')return null;
  const mode=completionToolForPage(page.id);
  if(!mode)return null;
  const entries=linkCompletionEntries(index,page.locale,entriesForCompletionMode(mode));
  const trackerHref=index.pagesByKey[`${page.locale}:forever-ago-completion-tracker`]?.path;
  return <CompletionTracker entries={entries} mode={mode} trackerHref={trackerHref}/>;
}
