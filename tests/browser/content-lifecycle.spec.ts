import {test,expect} from '@playwright/test';
import {cp,mkdtemp,mkdir,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {runCommand,startProductionServer} from '../../scripts/test-server';
import {verifySite} from '../../scripts/verify-site';
import {isMissing} from '../../scripts/site-files';
import type {ContentIndex} from '../../src/content/types';

test('content changes regenerate real routes, navigation and SEO without editing framework files',async({browser})=>{
 test.setTimeout(420000);
 const controller=new AbortController();const abort=()=>controller.abort();let deadline:ReturnType<typeof setTimeout>|undefined;
 const root=process.cwd();const fixture=await mkdtemp(join(tmpdir(),'game-wiki-lifecycle-'));const runId=randomUUID();
 const artifact=join(root,'.artifacts/content-lifecycle',runId);const runErrors:string[]=[];let failure:unknown;
 const stages:{name:string;status:string;routes:number;error?:string}[]=[];
 let started:Awaited<ReturnType<typeof startProductionServer>>|undefined;
 const readJson=async(path:string)=>JSON.parse(await readFile(join(fixture,path),'utf8'));
 const writeJson=async(path:string,value:unknown)=>writeFile(join(fixture,path),JSON.stringify(value,null,2)+'\n');
 const articlePath='content/en/pages/first-steps.mdx';
 async function checkStage(name:string,inspect:(index:ContentIndex,url:string)=>Promise<void>,preview=false){
  let routes=0;
  try{
   controller.signal.throwIfAborted();await runCommand('npm',['run','build'],fixture,{env:{...process.env,SITE_ENV:preview?'preview':'production'},signal:controller.signal});
   const index=await readJson('.generated/content-index.json') as ContentIndex;routes=Object.keys(index.routes).length;
   started=await startProductionServer(fixture);await verifySite(fixture,{url:started.url,build:false,signal:controller.signal});controller.signal.throwIfAborted();await inspect(index,started.url);controller.signal.throwIfAborted();
   stages.push({name,status:'passed',routes});
  }catch(error){stages.push({name,status:'failed',routes,error:String(error)});throw error;}
  finally{
   await started?.stop();started=undefined;
   const stageDirectory=join(artifact,name);await mkdir(stageDirectory,{recursive:true});
   for(const [source,name] of [['.generated/content-index.json','content-index.json'],['.artifacts/site/summary.json','site-summary.json']])try{await cp(join(fixture,source),join(stageDirectory,name));}catch(error){if(!isMissing(error))throw error;}
  }
 }
 try{
  deadline=setTimeout(abort,360000);process.once('SIGTERM',abort);process.once('SIGINT',abort);
  await mkdir(artifact,{recursive:true});
  for(const path of ['src','scripts','public','package.json','package-lock.json','tsconfig.json','next.config.mjs'])await cp(join(root,path),join(fixture,path),{recursive:true});
  for(const path of ['config','content'])await cp(join(root,'tests/fixtures/production-site',path),join(fixture,path),{recursive:true});
  await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
  const original=await readFile(join(fixture,articlePath),'utf8');const initialConfig=await readFile(join(fixture,'config/site.json'),'utf8');
  await checkStage('01-baseline',async index=>{expect(index.routes['/guides/first-steps'].indexable).toBe(true);expect(index.translationGroups['first-steps'].ja).toBe('/ja/guides/hajime');});
  const added=join(fixture,'content/en/pages/second-guide.mdx');await writeFile(added,original.replace('id: first-steps','id: second-guide').replace('slug: first-steps','slug: second-guide').replace('title: Production test article','title: Second production test article'));
  await checkStage('02-add-article',async(index,url)=>{
   expect(index.categories['en:guides'].pages).toHaveLength(2);expect(index.pagesByKey['en:first-steps'].next).toBe('second-guide');
   const page=await browser.newPage();try{await page.goto(url+'/guides/first-steps');await expect(page.locator('.page-pager')).toHaveCount(0);await expect(page.locator('.related-content-card[href="/guides/second-guide"]')).toBeVisible();}finally{await page.close();}
  });
  await rm(added);
  await checkStage('03-delete-article',async(index,url)=>{
   expect(index.routes['/guides/second-guide']).toBeUndefined();expect(index.pagesByKey['en:first-steps'].next).toBeUndefined();
   const page=await browser.newPage();try{expect((await page.goto(url+'/guides/second-guide'))?.status()).toBe(404);}finally{await page.close();}
  });
  const categories=await readJson('config/categories.json');categories.push({id:'field-notes',slug:'notes',order:30,navigation:true,submenu:[],landing:null,showWhenEmpty:true});await writeJson('config/categories.json',categories);
  for(const locale of ['en','ja']){const dictionary=await readJson(`content/locales/${locale}.json`);dictionary.categories['field-notes']={title:locale==='en'?'Field notes':'記録',description:locale==='en'?'Empty test category.':'空のテスト分類。'};await writeJson(`content/locales/${locale}.json`,dictionary);}
  await checkStage('04-add-category',async(index,url)=>{
   expect(index.routes['/notes'].indexable).toBe(false);expect(index.categories['en:field-notes'].visible).toBe(true);
   const page=await browser.newPage();try{await page.goto(url+'/notes');await expect(page.locator('header nav a[href="/notes"]')).toHaveAttribute('aria-current','page');}finally{await page.close();}
  });
  await rm(join(fixture,'content/ja/pages/first-steps.mdx'));
  await checkStage('05-remove-translation',async(index,url)=>{
   expect(index.translationGroups['first-steps'].ja).toBeUndefined();
   const page=await browser.newPage();try{expect((await page.goto(url+'/ja/guides/hajime'))?.status()).toBe(404);await expect(page.locator('html')).toHaveAttribute('lang','ja');await page.goto(url+'/guides/first-steps');await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveCount(0);}finally{await page.close();}
  });
  await writeFile(join(fixture,articlePath),original.replace('slug: first-steps','slug: renamed-guide'));
  const site=await readJson('config/site.json');site.redirects.push({from:'/guides/first-steps',to:'first-steps',locale:'en',permanent:true});await writeJson('config/site.json',site);
  await checkStage('06-rename-slug',async(index,url)=>{
   expect(index.routes['/guides/first-steps']).toBeUndefined();expect(index.routes['/guides/renamed-guide'].indexable).toBe(true);
   const response=await fetch(url+'/guides/first-steps',{redirect:'manual',signal:controller.signal});expect(response.status).toBe(308);expect(response.headers.get('location')).toBe('/guides/renamed-guide');
  });
  const productionConfig=await readFile(join(fixture,'config/site.json'),'utf8');
  await checkStage('07-preview',async index=>{expect(index.preview).toBe(true);expect(Object.values(index.routes).every(route=>!route.indexable)).toBe(true);},true);
  expect(await readFile(join(fixture,'config/site.json'),'utf8')).toBe(productionConfig);expect(JSON.parse(initialConfig).mode).toBe('production');
  controller.signal.throwIfAborted();
 }catch(error){failure=error;runErrors.push(String(error));}
 finally{
  clearTimeout(deadline);process.removeListener('SIGTERM',abort);process.removeListener('SIGINT',abort);
  for(const cleanup of [()=>started?.stop(),()=>rm(fixture,{recursive:true,force:true})])try{await cleanup();}catch(error){runErrors.push(`cleanup: ${String(error)}`);}
  await writeFile(join(artifact,'summary.json'),JSON.stringify({runId,status:!runErrors.length&&stages.length===7&&stages.every(stage=>stage.status==='passed')?'passed':'failed',stages,runErrors,deployed:false},null,2)+'\n');
 }
 if(failure)throw failure;if(runErrors.length)throw new Error(runErrors.join('; '));
});
