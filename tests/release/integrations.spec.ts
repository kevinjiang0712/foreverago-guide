import {readFileSync} from 'node:fs';
import {expect,test} from '@playwright/test';
import type {ContentIndex} from '../../src/content/types';

const index=JSON.parse(readFileSync('.generated/content-index.json','utf8')) as ContentIndex;
const newIds=['forever-ago-game-length','forever-ago-achievements','forever-ago-camera-achievements','forever-ago-photo-puzzle','forever-ago-completion-tracker','forever-ago-walkthrough','forever-ago-snooping-shutterbug','forever-ago-mosaic-pumpkins','forever-ago-marleys-bobblehead','forever-ago-guardian-lord','forever-ago-shopaholic','forever-ago-scallyrat-roberts'];
const newRoutes=Object.values(index.routes).filter(route=>newIds.includes(route.contentId));

test('every new page starts the shared analytics loaders and mobile ad units on an allowed host',async({browser,baseURL})=>{
 test.setTimeout(180000);
 for(const route of newRoutes){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const requested=new Set<string>();
  await context.route('**/*',async requestRoute=>{
   const url=new URL(requestRoute.request().url());
   if(url.hostname==='www.foreverago-guide.wiki'){
    const response=await requestRoute.fetch({url:new URL(url.pathname+url.search,baseURL).href});
    await requestRoute.fulfill({response});return;
   }
   if(url.hostname==='www.googletagmanager.com'){requested.add(url.href);await requestRoute.fulfill({contentType:'application/javascript',body:'window.__releaseGoogleLoader=true;'});return;}
   if(url.hostname==='www.clarity.ms'){requested.add(url.href);await requestRoute.fulfill({contentType:'application/javascript',body:'window.__releaseClarityLoader=true;'});return;}
   if(url.hostname==='bauval.org'){requested.add(url.href);await requestRoute.fulfill({status:403,body:'Blocked in the test proxy environment'});return;}
   await requestRoute.continue();
  });
  const page=await context.newPage();
  const pageErrors:string[]=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(new URL(route.path,index.site.siteUrl).href,{waitUntil:'networkidle'});
  for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=600){await page.evaluate(top=>window.scrollTo(0,top),y);await page.waitForTimeout(30);}
  await expect.poll(()=>[...requested].some(url=>url.includes('gtag/js?id=G-1L7F54XGRR')),route.path).toBe(true);
  await expect.poll(()=>[...requested].some(url=>url.includes('/tag/ywlgmczujj')),route.path).toBe(true);
  for(const slot of ['native','anchor'] as const){
   const script=index.ads.adsterra!.units[slot]!.scriptUrl;
   await expect.poll(()=>requested.has(script),`${route.path}: ${slot}`).toBe(true);
  }
  const inlineGap=await page.evaluate(()=>{
   const inline=document.querySelector<HTMLElement>('[data-revenue-slot="inline"]');
   const native=document.querySelector<HTMLElement>('[data-revenue-slot="native"]');
   return {present:Boolean(inline),eligible:Boolean(inline&&(!native||inline.getBoundingClientRect().top-native.getBoundingClientRect().bottom>=innerHeight*1.5))};
  });
  expect(inlineGap.present,`${route.path}: inline placement`).toBe(true);
  if(inlineGap.eligible)await expect.poll(()=>requested.has(index.ads.adsterra!.units.inline!.scriptUrl),`${route.path}: eligible inline`).toBe(true);
  else await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-ready','false');
  const diagnostics=await page.evaluate(()=>((window as Window&{dataLayer?:ArrayLike<unknown>[]}).dataLayer??[]).map(entry=>Array.from(entry)).filter(entry=>entry[0]==='event').map(entry=>String(entry[1])));
  expect(diagnostics,route.path).toContain('ad_anchor_request');
  expect(diagnostics,route.path).toContain('ad_anchor_script_error');
  expect(diagnostics.filter(name=>name.endsWith('_viewable')),route.path).toEqual([]);
  expect(diagnostics,route.path).not.toContain('ad_impression');
  expect(pageErrors,route.path).toEqual([]);
  await context.close();
 }
});

test('desktop rails start both side ad scripts without creating empty advertising gaps',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:1920,height:1000}});
 const requested=new Set<string>();
 await context.route('**/*',async requestRoute=>{
  const url=new URL(requestRoute.request().url());
  if(url.hostname==='www.foreverago-guide.wiki'){
   const response=await requestRoute.fetch({url:new URL(url.pathname+url.search,baseURL).href});await requestRoute.fulfill({response});return;
  }
  if(['bauval.org','www.googletagmanager.com','www.clarity.ms'].includes(url.hostname)){
   requested.add(url.href);await requestRoute.fulfill({status:url.hostname==='bauval.org'?403:200,contentType:'application/javascript',body:''});return;
  }
  await requestRoute.continue();
 });
 const page=await context.newPage();await page.goto(new URL('/guide/forever-ago-completion-tracker',index.site.siteUrl).href,{waitUntil:'networkidle'});
 for(const slot of ['left','right'] as const)await expect.poll(()=>requested.has(index.ads.adsterra!.units[slot]!.scriptUrl)).toBe(true);
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveAttribute('data-expanded','false');
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-expanded','false');
 await context.close();
});
