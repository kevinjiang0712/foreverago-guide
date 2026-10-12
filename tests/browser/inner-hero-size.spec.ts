import {test,expect,type Page} from '@playwright/test';
import {join} from 'node:path';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {isArticleType} from '../../src/content/template-layouts';

const index=buildIndex(await readSite(join(process.cwd(),'examples/site-a')),{preview:false});
const routes=Object.values(index.routes).filter(route=>route.locale==='en'&&route.kind!=='home');
async function resolvedRootFontSize(page:Page,token:string){
 return page.evaluate(token=>{const probe=document.createElement('span');probe.style.fontSize=`var(${token})`;document.body.append(probe);const size=getComputedStyle(probe).fontSize;probe.remove();return size;},token);
}
for(const width of [390,900,1240])test(`all inner Heroes share geometry at ${width}px`,async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const route of routes){
  await page.goto(route.path);await page.evaluate(()=>document.fonts.ready);
  const metadata=route.kind==='page'?index.pagesByKey[route.bodyKey]:null;
  const article=metadata&&isArticleType(metadata.template)&&metadata.template!=='mod-detail'&&(!metadata.articleRecord||index.records[`${metadata.locale}:${metadata.articleRecord}`]?.type!=='build');
  const minimum=article?(width>=1024?560:0):(width>=1024?320:width>=768?280:240);
  const hero=page.locator('.inner-hero');const content=hero.locator('.inner-hero-content');const title=hero.locator('h1');
  await expect(hero,route.path).toHaveCount(1);
  await expect(hero,route.path).toHaveCSS('min-height',`${minimum}px`);
  await expect(content,route.path).toHaveCSS('padding-top',width<768?'24px':'40px');
  await expect(content,route.path).toHaveCSS('padding-bottom',width<768?'24px':'40px');
  const h1Size=await resolvedRootFontSize(page,'--fluid-h1');
  await expect(title,route.path).toHaveCSS('font-size',h1Size);
  await expect(title,route.path).toHaveCSS('margin-bottom','16px');
  await expect(hero.locator('.breadcrumb'),route.path).toHaveCSS('margin-bottom','24px');
  const before=await hero.boundingBox();expect(before!.height,route.path).toBeGreaterThanOrEqual(minimum);
  await page.setViewportSize({width,height:1100});
  await expect.poll(async()=>Math.round((await hero.boundingBox())!.height),{message:route.path}).toBe(Math.round(before!.height));
  const titleBox=await title.boundingBox();const heroBox=await hero.boundingBox();
  expect(titleBox!.y+titleBox!.height,route.path).toBeLessThanOrEqual(heroBox!.y+heroBox!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route.path).toBe(true);
  await page.setViewportSize({width,height:900});
 }
});

test('long inner titles wrap without shrinking or clipping',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/bosses','/guides','/guides/first-steps']){
  await page.goto(path);await page.evaluate(()=>document.fonts.ready);
  const hero=page.locator('.inner-hero');const title=hero.locator('h1');const before=await hero.boundingBox();
  await title.evaluate(element=>{element.textContent='Long translated title 未確認情報の参照と検証 '.repeat(8);});
  const h1Size=await resolvedRootFontSize(page,'--fluid-h1');
  await expect(title).toHaveCSS('font-size',h1Size);
  const after=await hero.boundingBox();const titleBox=await title.boundingBox();
  expect(after!.height).toBeGreaterThan(before!.height);
  expect(titleBox!.y+titleBox!.height).toBeLessThan(after!.y+after!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
