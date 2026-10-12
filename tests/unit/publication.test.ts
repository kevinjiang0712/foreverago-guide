import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {isIndexable} from '../../src/content/publication';
it('has one indexing decision for production, preview, demo, status, explicit noindex and empty category',()=>{
 const base={mode:'production' as const,preview:false,status:'published' as const,demo:false,noindex:false,empty:false};
 expect(isIndexable(base)).toBe(true);
 for(const patch of [{mode:'demo' as const},{preview:true},{status:'draft' as const},{status:'archived' as const},{demo:true},{noindex:true},{empty:true}])expect(isIndexable({...base,...patch})).toBe(false);
});
it('excludes drafts and archives except explicit preview; category lists stay published-only',async()=>{
 const input=await siteFixture();input.pages[0].status='draft';input.pages[1].status='archived';
 expect(buildIndex(input,{preview:false}).routes['/guides/first-steps']).toBeUndefined();
 const preview=buildIndex(input,{preview:true});expect(preview.routes['/guides/first-steps'].indexable).toBe(false);expect(preview.categories['en:guides'].pages).toEqual([]);
});
it('rejects production demo domains and reachable demo content',async()=>{
 const input=await siteFixture();input.site.mode='production';expect(()=>buildIndex(input,{preview:false})).toThrow(/siteUrl/);
 input.site.siteUrl='https://game-guide.testhost.com';expect(()=>buildIndex(input,{preview:false})).toThrow(/demo/);
});
async function productionFixture(){
 const input=await siteFixture();input.site.mode='production';input.site.siteUrl='https://game-guide.testhost.com';input.site.officialLinks.official='https://www.nintendo.com';
 input.homes.forEach(home=>home.demo=false);input.pages.forEach(page=>page.demo=false);return input;
}
it('does not inherit article noindex onto a nonempty category',async()=>{
 const input=await productionFixture();input.pages.forEach(page=>page.seo={noindex:true});
 const index=buildIndex(input,{preview:false});expect(index.routes['/guides'].indexable).toBe(true);expect(index.routes['/guides/first-steps'].indexable).toBe(false);
});
it.each(['HTTPS://example.com','https://example.com.','HTTPS://sample.example.'])('rejects normalized demo origin %s',async url=>{
 const input=await productionFixture();input.site.officialLinks.official=url;expect(()=>buildIndex(input,{preview:false})).toThrow(/demonstration domains/);
 input.site.officialLinks.official='https://www.nintendo.com';input.site.siteUrl=url;expect(()=>buildIndex(input,{preview:false})).toThrow(/siteUrl/);
});
