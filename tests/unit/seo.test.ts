import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {createMetadata,shareImage} from '../../src/seo/metadata';
import {languageAlternates} from '../../src/seo/alternates';
import {createSitemap} from '../../src/seo/sitemap';
import {createStructuredData,serializeJsonLd} from '../../src/seo/structured-data';
async function production(){
 const input=await siteFixture();input.site.mode='production';input.site.siteUrl='https://wiki.fixture-game.com';input.site.officialLinks.official='https://fixture-game.com';
 input.homes.forEach(home=>home.demo=false);input.pages.forEach(page=>page.demo=false);
 return input;
}
it('canonical, hreflang and sitemap use the same real translated routes',async()=>{
 const index=buildIndex(await production(),{preview:false});const route=index.routes['/ja/guides/hajime'];
 expect(languageAlternates(index,route)).toEqual({en:'https://wiki.fixture-game.com/guides/first-steps',ja:'https://wiki.fixture-game.com/ja/guides/hajime','x-default':'https://wiki.fixture-game.com/guides/first-steps'});
 expect(createMetadata(index,route).alternates).toEqual({canonical:'https://wiki.fixture-game.com/ja/guides/hajime',languages:languageAlternates(index,route)});
 expect(createSitemap(index).map(item=>item.url)).toEqual(Object.values(index.routes).map(route=>`https://wiki.fixture-game.com${route.path}`));
 expect(createSitemap(index).every(item=>!('lastModified' in item))).toBe(true);
});
it('noindex and missing default translations never produce invented alternates',async()=>{
 const input=await production();input.pages[0].seo={noindex:true};const index=buildIndex(input,{preview:false});
 expect(languageAlternates(index,index.routes['/ja/guides/hajime'])).toEqual({ja:'https://wiki.fixture-game.com/ja/guides/hajime'});
 expect(languageAlternates(index,index.routes['/guides/first-steps'])).toEqual({});
 expect(createSitemap(index).map(item=>item.url)).not.toContain('https://wiki.fixture-game.com/guides/first-steps');
 input.pages=input.pages.filter(page=>page.locale==='ja');const missing=buildIndex(input,{preview:false});
 expect(languageAlternates(missing,missing.routes['/ja/guides/hajime'])).not.toHaveProperty('x-default');
});
it.each(['demo','preview','draft'] as const)('%s remains outside sitemap and search alternates',async mode=>{
 const input=mode==='demo'?await siteFixture():await production();if(mode==='draft')input.pages[0].status='draft';
 const index=buildIndex(input,{preview:mode!=='demo'});const route=index.routes['/guides/first-steps'];
 expect(createMetadata(index,route).robots).toEqual({index:false,follow:true});expect(languageAlternates(index,route)).toEqual({});expect(createSitemap(index)).toEqual([]);
});
it('page SEO overrides are local and unknown image, author and dates are omitted',async()=>{
 const input=await production();input.pages[0].seo={title:'Specific title',description:'Specific description',image:null,noindex:false};const index=buildIndex(input,{preview:false});const route=index.routes['/guides/first-steps'];
 const metadata=createMetadata(index,route);expect(metadata.title).toBe('Specific title | Template Sample A Wiki');expect(metadata.description).toBe('Specific description');
 expect(metadata.openGraph).not.toHaveProperty('images');
 const article=createStructuredData(index,route).find(item=>item['@type']==='Article');expect(article).toBeUndefined();expect(createStructuredData(index,route).find(item=>item['@type']==='WebPage')).toBeDefined();
});
it('provided dates, author, registered image and category items appear without manufactured fields',async()=>{
 const input=await production();input.pages[0].publishedAt='2026-09-01';input.pages[0].updatedAt='2026-09-10';input.pages[0].author={name:'Test editor'};
 const index=buildIndex(input,{preview:false});const route=index.routes['/guides/first-steps'];const article=createStructuredData(index,route).find(item=>item['@type']==='Article');
 expect(article).toMatchObject({datePublished:'2026-09-01',dateModified:'2026-09-10',author:{'@type':'Person',name:'Test editor'}});
 expect(createSitemap(index).find(item=>item.url.endsWith(route.path))?.lastModified).toBe('2026-09-10');
 const list=createStructuredData(index,index.routes['/guides']).find(item=>item['@type']==='ItemList');expect(list).toMatchObject({numberOfItems:1});
});
it('JSON-LD safely serializes script closing text',()=>{
 const result=serializeJsonLd({name:'</script><script>alert(1)</script>'});expect(result).not.toContain('<');expect(JSON.parse(result).name).toBe('</script><script>alert(1)</script>');
});

it('share images prefer a real page hero before the site default; null disables explicitly',async()=>{
 const input=await production();input.assets[0].src='/media/hero.png';input.assets[0].demo=false;input.assets[1].src='/media/default.png';input.assets[1].demo=false;input.site.seo.image=input.assets[1].id;input.pages[0].assets.hero=input.assets[0].id;
 const index=buildIndex(input,{preview:false});const route=index.routes['/guides/first-steps'];expect(shareImage(index,route)?.url).toBe('https://wiki.fixture-game.com/media/hero.png');
 index.assets[input.assets[0].id].src=null;expect(shareImage(index,route)?.url).toBe('https://wiki.fixture-game.com/media/default.png');
 index.pagesByKey['en:first-steps'].seo={image:null,noindex:false};expect(shareImage(index,route)).toBeUndefined();
});
it('home has no invisible breadcrumb and an author without dates does not invent dates',async()=>{
 const input=await production();input.pages[0].author={name:'Test editor'};const index=buildIndex(input,{preview:false});
 expect(createStructuredData(index,index.routes['/']).some(item=>item['@type']==='BreadcrumbList')).toBe(false);
 const article=createStructuredData(index,index.routes['/guides/first-steps']).find(item=>item['@type']==='Article');expect(article).toBeDefined();expect(article).not.toHaveProperty('datePublished');expect(article).not.toHaveProperty('dateModified');
});
