import {readFileSync} from 'node:fs';
import {expect,test} from '@playwright/test';
import type {ContentIndex} from '../../src/content/types';

const index=JSON.parse(readFileSync('.generated/content-index.json','utf8')) as ContentIndex;
const newIds=['forever-ago-completion-tracker','forever-ago-walkthrough','forever-ago-snooping-shutterbug','forever-ago-mosaic-pumpkins','forever-ago-marleys-bobblehead','forever-ago-guardian-lord'];
const articleRoutes=Object.values(index.routes).filter(route=>route.kind==='page'&&route.categoryId!=='_pages');

test('every production page has readable content, unique metadata and valid structured data without JavaScript',async({browser,baseURL})=>{
 test.setTimeout(180000);
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});
 const page=await context.newPage();
 const titles=new Set<string>(),descriptions=new Set<string>();
 for(const route of Object.values(index.routes)){
  const response=await page.goto(route.path,{waitUntil:'domcontentloaded'});
  expect(response?.status(),route.path).toBe(200);
  await expect(page.locator('h1'),route.path).toHaveCount(1);
  await expect(page.locator('main'),route.path).toBeVisible();
  await expect(page.locator('html'),route.path).toHaveAttribute('lang','en');
  await expect(page.locator('link[rel="canonical"]'),route.path).toHaveAttribute('href',new URL(route.path,index.site.siteUrl).href);
  await expect(page.locator('meta[name="robots"]'),route.path).toHaveAttribute('content','index, follow');
  const title=await page.title(),description=await page.locator('meta[name="description"]').getAttribute('content');
  expect(titles.has(title),`Duplicate title at ${route.path}`).toBe(false);titles.add(title);
  expect(descriptions.has(description!),`Duplicate description at ${route.path}`).toBe(false);descriptions.add(description!);
  const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())['@graph'];
  expect(graph.some((entry:Record<string,unknown>)=>entry['@type']==='WebPage'),route.path).toBe(true);
 }
 await context.close();
});

test('all new articles and all existing articles have direct navbar entries and sitemap URLs',async({page,request})=>{
 for(const id of newIds)expect(articleRoutes.some(route=>route.contentId===id),`Missing new article ${id}`).toBe(true);
 expect(articleRoutes.length).toBeGreaterThanOrEqual(32);
 await page.goto('/');
 const navigationHrefs=await page.locator('.site-navigation a[href]').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
 for(const route of articleRoutes)expect(navigationHrefs,`Missing navbar entry ${route.path}`).toContain(route.path);
 const sitemap=await request.get('/sitemap.xml');expect(sitemap.status()).toBe(200);
 const xml=await sitemap.text();
 for(const route of Object.values(index.routes))expect(xml).toContain(`<loc>${new URL(route.path,index.site.siteUrl).href}</loc>`);
 const missing=await request.get('/this-page-does-not-exist');expect(missing.status()).toBe(404);
 expect(await missing.text()).toContain('noindex');
});

test('new article HTML includes the shared production tracking integration',async({request})=>{
 for(const id of newIds){
  const route=articleRoutes.find(route=>route.contentId===id)!;
  const response=await request.get(route.path);expect(response.status()).toBe(200);
  const html=await response.text();
  expect(html,route.path).toContain('G-1L7F54XGRR');
  expect(html,route.path).toContain('ywlgmczujj');
  expect(html,route.path).toContain('data-revenue-slot');
 }
});

for(const width of [320,390,768,1440])test(`homepage, long navigation and tracker fit the ${width}px viewport`,async({page})=>{
 await page.setViewportSize({width,height:900});
 for(const path of ['/',...articleRoutes.filter(route=>['forever-ago-completion-tracker','forever-ago-achievements','forever-ago-walkthrough'].includes(route.contentId)).map(route=>route.path)]){
  await page.goto(path,{waitUntil:'networkidle'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
  await expect(page.locator('h1')).toBeVisible();
 }
});
