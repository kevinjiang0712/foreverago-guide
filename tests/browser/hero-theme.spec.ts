import {isArticleType,isListType} from '../../src/content/template-layouts';
import {test,expect,type Locator,type Page} from '@playwright/test';
import {openChrome} from './chrome-access';
import {join} from 'node:path';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';

const catalogue=buildIndex(await readSite(join(process.cwd(),'examples/site-a')),{preview:false});
async function heroColors(hero:Locator){
 return hero.evaluate(element=>[element,...element.querySelectorAll('*')].map(node=>[null,'::before','::after'].map(pseudo=>{
  const style=getComputedStyle(node,pseudo);
  return ['color','background-color','background-image','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','box-shadow','text-shadow','fill','stroke','color-scheme','opacity','mix-blend-mode'].map(property=>style.getPropertyValue(property));
 })));
}
async function toggleMode(page:Page){
 await openChrome(page);await page.getByRole('switch').click();
 if(await page.locator('[data-burger]').getAttribute('aria-expanded')==='true')await page.keyboard.press('Escape');
}
for(const width of [1240,390])for(const route of Object.values(catalogue.routes).filter(route=>route.kind!=='page'||!isArticleType(catalogue.pagesByKey[route.bodyKey].template))){
 test(`hero keeps night colors at ${width}px on ${route.path}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(route.path);
  const hero=page.locator('[data-floor=hero]');await expect(hero).toHaveCount(1);if(route.kind==='home'||(route.kind==='page'&&!isListType(catalogue.pagesByKey[route.bodyKey].template)))await expect(hero).toHaveAttribute('data-entered','true');
  if(await page.locator('html').getAttribute('data-mode')!=='night')await toggleMode(page);
  const night=await heroColors(hero);const bodyNight=await page.locator('body').evaluate(element=>getComputedStyle(element).backgroundColor);
  await toggleMode(page);await expect(page.locator('html')).toHaveAttribute('data-mode','day');
  await expect.poll(()=>heroColors(hero)).toEqual(night);
  await expect.poll(()=>page.locator('body').evaluate(element=>getComputedStyle(element).backgroundColor)).not.toBe(bodyNight);
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-mode','day');if(route.kind==='home'||(route.kind==='page'&&!isListType(catalogue.pagesByKey[route.bodyKey].template)))await expect(hero).toHaveAttribute('data-entered','true');
  await expect.poll(()=>heroColors(hero)).toEqual(night);
  await toggleMode(page);await expect(page.locator('html')).toHaveAttribute('data-mode','night');await expect.poll(()=>heroColors(hero)).toEqual(night);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 });
}
