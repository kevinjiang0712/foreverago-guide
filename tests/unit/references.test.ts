import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
it.each([['related',['missing']],['records',['missing']],['assets',{hero:'missing'}],['previous','missing'],['next','missing']] as const)('rejects broken %s with source location',async(field,value)=>{
 const input=await siteFixture();Object.assign(input.pages[0],{[field]:value});expect(()=>buildIndex(input,{preview:false})).toThrow(new RegExp(`content/en/pages/first-steps.mdx.*${field}.*missing`));
});
it('deletion removes derived navigation but not explicit bad references',async()=>{
 const input=await siteFixture();input.pages.push({...input.pages[0],id:'second',slug:'second'});let index=buildIndex(input,{preview:false});expect(index.pagesByKey['en:first-steps'].next).toBe('second');
 input.pages.pop();index=buildIndex(input,{preview:false});expect(index.pagesByKey['en:first-steps'].next).toBeUndefined();
 input.pages[0].related=['second'];expect(()=>buildIndex(input,{preview:false})).toThrow(/related.*second/);
});
it('redirects resolve a content ID into its current translated slug',async()=>{
 const input=await siteFixture();input.site.redirects=[{from:'/ja/old',to:'first-steps',locale:'ja',permanent:true}];
 expect(buildIndex(input,{preview:false}).redirects).toEqual([{source:'/ja/old',destination:'/ja/guides/hajime',permanent:true}]);
});
it.each(['/guides/first-steps','/ja/guides/hajime'])('rejects redirect sources that collide with real routes: %s',async from=>{
 const input=await siteFixture();input.site.redirects=[{from,to:'first-steps',locale:'en',permanent:true}];expect(()=>buildIndex(input,{preview:false})).toThrow(/redirects/);
});
it('rejects a redirect to a nonexistent content ID',async()=>{
 const input=await siteFixture();input.site.redirects=[{from:'/old',to:'missing',locale:'en',permanent:true}];expect(()=>buildIndex(input,{preview:false})).toThrow(/redirects.*missing/);
});
it('rejects inherited object keys masquerading as assets or links',async()=>{
 const input=await siteFixture();input.pages[0].assets={hero:'constructor'};
 expect(()=>buildIndex(input,{preview:false})).toThrow(/assets.hero.*constructor.*unknown asset/);
});
it.each(['/:path*','/old(.*)','/old\\\\path','/old+'])('rejects redirect pattern %s',async from=>{
 const input=await siteFixture();input.site.redirects=[{from,to:'first-steps',locale:'en',permanent:true}];
 expect(()=>buildIndex(input,{preview:false})).toThrow(/redirects.*literal/);
});
it('does not create submenu links to drafts',async()=>{
 const input=await siteFixture();input.site.navigation.en[1].children=[{label:'Start',target:{type:'content',id:'first-steps'}}];input.pages.forEach(page=>page.status='draft');
 expect(()=>buildIndex(input,{preview:false})).toThrow(/navigation.en.1.children.0.target.*first-steps.*published/);
 expect(()=>buildIndex(input,{preview:true})).toThrow(/navigation.en.1.children.0.target.*first-steps.*published/);
});
