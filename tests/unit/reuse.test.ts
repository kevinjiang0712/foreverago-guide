import {describe,it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {frameworkDifferences,assertDistinctSamples,findRuntimeLeaks,verifyReuse} from '../../scripts/verify-reuse';

const sample=(b=false)=>({siteId:b?'sample-b':'sample-a',siteUrl:b?'https://b.example':'https://a.example',mode:'demo',locales:b?['en','fr']:['en','ja'],defaultLocale:'en',names:b?['Silver Marsh']:['Ember Vale'],theme:{preset:'onimusha',common:{'--radius':b?'8px':'2px'},day:{},night:{},fonts:[]},officialLinks:(b?{publisher:null}:{official:null}) as Record<string,string|null>,categories:b?[{id:'journeys',slug:'routes',order:2}]:[{id:'guides',slug:'guides',order:1}],pages:b?['Silver path','Lantern trail']:['Ember path'],records:b?['en:b-1','en:b-2']:['en:a-1'],recordIds:b?['b-1','b-2']:['a-1'],entityNames:b?['Silver Lantern']:['Ember Staff'],identifiers:b?['b-1','b-2']:['a-1'],nonDemo:[],templates:['site-home','wiki-page']});
describe('reuse evidence guards',()=>{
 it('reports changed, missing and extra framework paths',()=>{
  const source={files:[{path:'src/a',sha256:'one',bytes:1},{path:'src/b',sha256:'two',bytes:2}]};
  expect(frameworkDifferences(source,{files:[{path:'src/a',sha256:'other',bytes:1},{path:'src/c',sha256:'three',bytes:3}]})).toEqual(['src/a: changed','src/b: missing','src/c: added']);
 });
 it('requires substantive sample changes rather than a renamed title',()=>{
  expect(()=>assertDistinctSamples(sample(),sample(true),['site-home','wiki-page'])).not.toThrow();
  expect(()=>assertDistinctSamples(sample(),{...sample(true),theme:sample().theme},['site-home','wiki-page'])).toThrow('theme');
  expect(()=>assertDistinctSamples(sample(),{...sample(),names:['Other']},['site-home','wiki-page'])).toThrow('siteId');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),locales:['en','ja']},['site-home','wiki-page'])).toThrow('non-default language');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),records:['en:b-1','fr:b-1','de:b-1'],recordIds:['b-1']},['site-home','wiki-page'])).toThrow('record count');
  expect(()=>assertDistinctSamples(sample(),sample(true),['site-home','wiki-page','mod-index'])).toThrow('mod-index');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),names:['Ember Vale','Ember Vale']},['site-home','wiki-page'])).toThrow('names');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),categories:sample().categories},['site-home','wiki-page'])).toThrow('category id');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),entityNames:['Ember Staff']},['site-home','wiki-page'])).toThrow('entityNames');
  expect(()=>assertDistinctSamples(sample(),{...sample(true),nonDemo:['a-mod']},['site-home','wiki-page'])).toThrow('a-mod');
 });
 it('scans runtime outputs including escaped payloads without scanning examples or tests',async()=>{
  const root=await mkdtemp(join(tmpdir(),'reuse-leak-'));
  try{
   for(const path of ['.generated','.next/server/app','examples/site-a','tests'])await mkdir(join(root,path),{recursive:true});
   await writeFile(join(root,'.generated/content-index.json'),'{"title":"New Site"}');
   await writeFile(join(root,'.next/server/app/index.html'),'<title>Ember Vale</title><h1>Ember &amp; Vale</h1>');
   await writeFile(join(root,'.next/server/app/page.rsc'),'"\\u65e7\\u30b2\\u30fc\\u30e0"');
   await writeFile(join(root,'examples/site-a/old.json'),'Ember Vale');
   await writeFile(join(root,'tests/old.txt'),'Ember Vale');
   expect(await findRuntimeLeaks(root,['Ember Vale','旧ゲーム','Ember & Vale'])).toEqual([{path:'.next/server/app/index.html',marker:'Ember Vale'},{path:'.next/server/app/index.html',marker:'Ember & Vale'},{path:'.next/server/app/page.rsc',marker:'旧ゲーム'}]);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it('matches stable IDs as complete content tokens, never substrings of HTML syntax',async()=>{
  const root=await mkdtemp(join(tmpdir(),'reuse-short-id-'));
  try{
   await mkdir(join(root,'.generated'),{recursive:true});await mkdir(join(root,'.next/server/app'),{recursive:true});
   await writeFile(join(root,'.generated/content-index.json'),JSON.stringify({records:{'en:b':{id:'b',description:'A plain example'}}}));
   await writeFile(join(root,'.next/server/app/index.html'),'<main><p>Sample B</p></main>');
   expect(await findRuntimeLeaks(root,[],['a'])).toEqual([]);
   await writeFile(join(root,'.generated/content-index.json'),JSON.stringify({records:{'en:a':{id:'a'}}}));
   expect(await findRuntimeLeaks(root,[],['a'])).toEqual([{path:'.generated/content-index.json',marker:'a'}]);
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it.each([false,true])('persists failure when samples are absent or artifact path blocked (%s)',async blocked=>{
  const root=await mkdtemp(join(tmpdir(),'reuse-missing-'));
  try{
   await mkdir(join(root,'docs/verification'),{recursive:true});await writeFile(join(root,'docs/verification/reuse-report.json'),'{"status":"passed","runId":"old"}');
   if(blocked){await mkdir(join(root,'.artifacts'),{recursive:true});await writeFile(join(root,'.artifacts/reuse'),'blocked');}
   await expect(verifyReuse(root)).rejects.toThrow('Reuse verification failed');
   const report=JSON.parse(await readFile(join(root,'docs/verification/reuse-report.json'),'utf8'));
   expect(report.status).toBe('failed');expect(report.runId).not.toBe('old');expect(report.errors.length).toBeGreaterThan(0);
  }finally{await rm(root,{recursive:true,force:true});}
 });
});
