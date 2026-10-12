import { expect,it } from 'vitest';
import { siteFixture } from './site-fixture';
import { buildIndex } from '../../src/content/build-index';
import { localePath } from '../../src/content/paths';
it('has one locale prefix rule',()=>{
 expect(localePath('en','en',[])).toBe('/');expect(localePath('en','ja',[])).toBe('/ja');
 expect(localePath('en','en',['guides','first-steps'])).toBe('/guides/first-steps');expect(localePath('en','ja',['guides','hajime'])).toBe('/ja/guides/hajime');
});
it('derives homepage, category, article and actual translation paths',async()=>{
 const index=buildIndex(await siteFixture(),{preview:false});
 expect(Object.keys(index.routes).sort()).toEqual(['/','/guides','/guides/first-steps','/ja','/ja/guides','/ja/guides/hajime']);
 expect(index.translationGroups['first-steps']).toEqual({en:'/guides/first-steps',ja:'/ja/guides/hajime'});
 expect(index.routes['/guides/first-steps']).toMatchObject({kind:'page',bodyKey:'en:first-steps',locale:'en',indexable:false});
});
it('landing occupies category URL without a duplicate article URL',async()=>{
 const input=await siteFixture();input.categories[0].landing='first-steps';const index=buildIndex(input,{preview:false});
 expect(index.routes['/guides']).toMatchObject({kind:'page',contentId:'first-steps'});
 expect(index.routes['/guides/first-steps']).toBeUndefined();
 expect(index.translationGroups['first-steps']).toEqual({en:'/guides',ja:'/ja/guides'});
});
it('standalone pages generate a root path and no category list entry',async()=>{
 const input=await siteFixture();input.pages[0].category='_pages';input.pages[0].slug='about';
 const index=buildIndex(input,{preview:false});expect(index.routes['/about']).toBeDefined();expect(index.categories['en:guides'].pages).toEqual([]);
});
it('empty categories remain accessible but hidden and nonindexable',async()=>{
 const input=await siteFixture();input.pages=[];const index=buildIndex(input,{preview:false});
 expect(index.routes['/guides'].indexable).toBe(false);expect(index.categories['en:guides'].visible).toBe(false);
 input.categories[0].showWhenEmpty=true;expect(buildIndex(input,{preview:false}).categories['en:guides'].visible).toBe(true);
});
it('sorts order then explicit date then ID without depending on scan order',async()=>{
 const input=await siteFixture();const page=input.pages[0];
 input.pages=[{...page,id:'z',order:1,updatedAt:'2026-09-10'},{...page,id:'a',order:1,updatedAt:'2026-09-12'},{...page,id:'b',order:0},{...page,id:'c'}].map(p=>({...p,slug:p.id}));
 const index=buildIndex(input,{preview:false});expect(index.categories['en:guides'].pages).toEqual(['en:b','en:a','en:z','en:c']);
 expect(index.pagesByKey['en:a'].previous).toBe('b');expect(index.pagesByKey['en:a'].next).toBe('z');
});
it.each(['ja','en','api','_next','robots.txt','sitemap.xml'])('rejects reserved root %s',async slug=>{
 const input=await siteFixture();input.categories[0].slug=slug;expect(()=>buildIndex(input,{preview:false})).toThrow(/config\/categories.json.*slug/);
});
it('rejects complete URL collisions, including standalone and category',async()=>{
 const input=await siteFixture();input.pages[0].category='_pages';input.pages[0].slug='guides';
 expect(()=>buildIndex(input,{preview:false})).toThrow(/first-steps.mdx.*path.*\/guides.*collision/);
});
it('rejects duplicate article URLs even with distinct content IDs',async()=>{
 const input=await siteFixture();input.pages.push({...input.pages[0],id:'second'});
 expect(()=>buildIndex(input,{preview:false})).toThrow(/collision/);
});
it('missing translation never manufactures a fallback article',async()=>{
 const input=await siteFixture();input.pages=input.pages.filter(page=>page.locale==='en');const index=buildIndex(input,{preview:false});
 expect(index.translationGroups['first-steps']).toEqual({en:'/guides/first-steps'});expect(index.routes['/ja/guides/first-steps']).toBeUndefined();
});
it('keeps constructor as an own ID through serialization without cross-build pollution',async()=>{
 const input=await siteFixture();input.pages[0].id='constructor';
 const index=buildIndex(input,{preview:false});expect(Object.hasOwn(index.translationGroups,'constructor')).toBe(true);
 expect(JSON.parse(JSON.stringify(index)).translationGroups.constructor).toEqual({en:'/guides/first-steps'});
 const nextInput=await siteFixture();nextInput.pages[0].related=['constructor'];
 expect(()=>buildIndex(nextInput,{preview:false})).toThrow(/related.*constructor/);
});
it('rejects a landing page assigned to a different category',async()=>{
 const input=await siteFixture();input.categories[0].landing='first-steps';input.pages[0].category='_pages';
 expect(()=>buildIndex(input,{preview:false})).toThrow(/landing.*first-steps.*guides/);
});
