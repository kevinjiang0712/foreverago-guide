import {readFile} from 'node:fs/promises';
import matter from 'gray-matter';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {achievementEntries,completionEntries,memoryEntries,restEntries,photoEntries,completionChapters,completionToolForPage} from '../../src/features/forever-ago/completion-data';
import {changeCompletionStage,parseCompletionProgress,readCompletionProgress,serializeCompletionProgress,writeCompletionProgress} from '../../src/features/forever-ago/completion-progress';
import {linkCompletionEntries} from '../../src/features/forever-ago/completion-links';
import {CompletionTracker} from '../../src/features/forever-ago/CompletionTracker';
import {analyzeMdx} from '../../src/content/remark-content.mjs';
import type {ContentIndex} from '../../src/content/types';

it('keeps the known achievement set and Epic XP separate from route checks',async()=>{
  const {content}=matter(await readFile('content/en/pages/forever-ago-achievements.mdx','utf8'));
  const rows=[...content.matchAll(/^\| ([^|]+) \| ([^|]+) \| (\d+) \|$/gm)];
  expect(achievementEntries).toHaveLength(29);
  expect(achievementEntries.map(entry=>[entry.name,entry.epicXP])).toEqual(rows.map(row=>[row[1].replace(/<\/?ContentLink\b[^>]*>/g,'').trim(),Number(row[3])]));
  expect(achievementEntries.reduce((sum,entry)=>sum+entry.epicXP!,0)).toBe(1000);
  expect(memoryEntries).toHaveLength(7);expect(restEntries).toHaveLength(6);expect(photoEntries).toHaveLength(11);
  expect(new Set(completionEntries.map(entry=>entry.id)).size).toBe(completionEntries.length);
  expect(completionEntries.every(entry=>completionChapters.some(chapter=>chapter.id===entry.chapter))).toBe(true);
  expect(completionEntries.every(entry=>entry.location&&entry.action&&entry.condition&&entry.guideHeading)).toBe(true);
  expect(completionEntries.filter(entry=>entry.type!=='achievement').every(entry=>entry.epicXP===undefined)).toBe(true);
});

it('resolves every task to an existing local guide heading rather than a guessed URL',async()=>{
  const pagesByKey:ContentIndex['pagesByKey']={};
  const categories=JSON.parse(await readFile('config/categories.json','utf8')) as {id:string;slug:string}[];
  for(const guideId of new Set(completionEntries.map(entry=>entry.guideId))){
    const {data,content}=matter(await readFile(`content/en/pages/${guideId}.mdx`,'utf8'));
    const analysis=analyzeMdx(content,guideId);
    const slug=categories.find(category=>category.id===data.category)!.slug;
    pagesByKey[`en:${guideId}`]={...data,path:`/${slug}/${data.slug}`,headings:analysis.headings} as ContentIndex['pagesByKey'][string];
  }
  const linked=linkCompletionEntries({pagesByKey},'en',completionEntries);
  for(const entry of linked){const guide=pagesByKey[`en:${entry.guideId}`];expect(entry.href).toBe(`${guide.path}#${guide.headings.find(heading=>heading.text===entry.guideHeading)!.id}`);}
  expect(()=>linkCompletionEntries({pagesByKey:{}},'en',[completionEntries[0]])).toThrow(/no guide/);
  const damaged={...pagesByKey,'en:forever-ago-achievements':{...pagesByKey['en:forever-ago-achievements'],headings:[]}};
  expect(()=>linkCompletionEntries({pagesByKey:damaged},'en',[completionEntries[0]])).toThrow(/no guide heading/);
});

it('preserves every stage through a backup and rejects unknown or impossible states',()=>{
  const progress={'memory-fun-colors':2,'rest-forecourt':1,'achievement-old-bones':1};
  expect(parseCompletionProgress(serializeCompletionProgress(progress))).toEqual(progress);
  expect(parseCompletionProgress(null)).toEqual({});
  for(const raw of ['broken','null','[]','{"version":2,"progress":{}}','{"version":1,"progress":[]}','{"version":1,"progress":{"unknown":1}}','{"version":1,"progress":{"rest-forecourt":2}}','{"version":1,"progress":{"memory-fun-colors":4}}','{"version":1,"progress":{"memory-fun-colors":1.5}}'])expect(()=>parseCompletionProgress(raw)).toThrow();
});

it('clearing an earlier vignette stage also clears later stages without marking an achievement',()=>{
  const memory=memoryEntries[0];
  const complete={'memory-fun-colors':3,'rest-forecourt':1};
  expect(changeCompletionStage(complete,memory,2,false)).toEqual({'memory-fun-colors':1,'rest-forecourt':1});
  expect(changeCompletionStage(complete,memory,1,false)).toEqual({'rest-forecourt':1});
  expect(changeCompletionStage({},memory,3,true)).toEqual({'memory-fun-colors':3});
  expect(changeCompletionStage(complete,restEntries[0],1,false)).toEqual({'memory-fun-colors':3});
  expect(()=>changeCompletionStage({},restEntries[0],2,true)).toThrow(/Invalid requested completion stage/);
  expect(complete).toEqual({'memory-fun-colors':3,'rest-forecourt':1});
});

it('does not hide blocked storage reads or failed writes and does not replace a damaged save',()=>{
  const denied=new Error('Browser storage denied');
  expect(()=>readCompletionProgress({getItem:()=>{throw denied;}})).toThrow(denied);
  const quota=new Error('Quota exceeded');
  expect(()=>writeCompletionProgress({setItem:()=>{throw quota;}},{'rest-forecourt':1})).toThrow(quota);
  let raw='damaged save';
  expect(()=>readCompletionProgress({getItem:()=>raw})).toThrow(/not valid JSON/);
  expect(raw).toBe('damaged save');
  expect(()=>writeCompletionProgress({setItem:(_key,value)=>{raw=value;}},{unknown:1})).toThrow(/unknown task/);
  expect(raw).toBe('damaged save');
});

it('renders readable tasks and guide links in server HTML before saved progress loads',()=>{
  const entries=memoryEntries.map(entry=>({...entry,href:'/maps/forever-ago-memory-locations#memory-landmark-checklist'}));
  const html=renderToStaticMarkup(createElement(CompletionTracker,{entries,mode:'memories'}));
  expect((html.match(/data-task-id=/g)??[]).length).toBe(7);
  expect(html).toContain('Fun &amp; Colors');expect(html).toContain('Where:');expect(html).toContain('Done when:');
  expect(html).toContain('Memory photographed');expect(html).toContain('Step-by-step guide');expect(html).toContain('<noscript>');
  expect(html).toContain('Loading your saved progress');
  for(const id of ['forever-ago-completion-tracker','forever-ago-achievements','forever-ago-collectibles','forever-ago-memory-locations','forever-ago-petal-locations','forever-ago-photo-locations','forever-ago-old-bones-achievement'])expect(completionToolForPage(id)).not.toBeNull();
  expect(completionToolForPage('privacy')).toBeNull();
});
