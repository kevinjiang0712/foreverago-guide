import {renderedTemplate} from '../../src/content/template-layouts';
import {expect,test} from '@playwright/test';
import {join} from 'node:path';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {templateNames} from '../../src/content/template-names';
import {matrixExpectation,inspectMatrixLayout} from '../../scripts/matrix-page';

// Framework regression content is frozen independently of the user's current site.
const catalogue=buildIndex(await readSite(join(process.cwd(),'examples/site-a')),{preview:false});
for(const locale of catalogue.site.locales)for(const template of templateNames){
 test(`${locale} ${template}: real page, ordered floors, current navigation and keyboard tabs`,async({page})=>{
  const route=Object.values(catalogue.routes).find(route=>route.locale===locale&&(template==='site-home'?route.kind==='home':route.kind==='page'&&catalogue.pagesByKey[route.bodyKey].template===template));
  expect(route,`Missing ${locale}/${template} sample`).toBeDefined();
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.emulateMedia({reducedMotion:'reduce'});const response=await page.goto(route!.path);expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang',locale);
  await expect(page.locator('[data-template]')).toHaveAttribute('data-template',renderedTemplate(template));
  await page.evaluate(async()=>{await document.fonts.ready;for(const floor of document.querySelectorAll('[data-floor]')){floor.scrollIntoView();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo(0,0);});
  const actual=await inspectMatrixLayout(page,matrixExpectation(catalogue,route!,template));expect(actual.errors,JSON.stringify(actual.measured)).toEqual([]);
  if(route!.kind!=='home'){
   const breadcrumb=page.locator('.breadcrumb');await expect(breadcrumb).toBeVisible();
   await expect(breadcrumb.locator('a').first()).toHaveAttribute('href',catalogue.translationGroups.home[locale]);
  }
  for(const tablist of await page.getByRole('tablist').all()){
   if(!await tablist.isVisible())continue;
   const tabs=tablist.getByRole('tab');const count=await tabs.count();if(count<2)continue;
   await tabs.first().focus();await page.keyboard.press('End');await expect(tabs.last()).toBeFocused();await expect(tabs.last()).toHaveAttribute('aria-selected','true');
   await page.keyboard.press('Home');await expect(tabs.first()).toHaveAttribute('aria-selected','true');
  }
  expect(errors).toEqual([]);
 });
}
