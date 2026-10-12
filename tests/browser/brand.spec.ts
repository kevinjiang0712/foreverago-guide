import {expect,test} from '@playwright/test';
import {openChrome} from './chrome-access';

for(const width of [320,1440])test(`homepage preserves an unbroken maximum-length game name at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const title=page.locator('h1');const name='M'.repeat(40)+' Wiki';
 await title.evaluate((element,name)=>{
  element.querySelector('.sr-only')!.textContent=name;
  element.querySelector('[aria-hidden=true]')!.replaceChildren(...name.split(' ').flatMap((word,i)=>{
   const wrap=document.createElement('span');wrap.dataset.word='';const glyph=document.createElement('span');glyph.textContent=word;wrap.append(glyph);
   return i?[document.createTextNode(' '),wrap]:[wrap];
  }));
  window.dispatchEvent(new Event('resize'));
 },name);
 await expect(title).toHaveAccessibleName(name);
 await expect.poll(()=>title.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 expect(await title.locator('[data-word]').evaluateAll(words=>words.every(word=>word.scrollWidth<=word.clientWidth+1))).toBe(true);
 await expect(title.locator('[aria-hidden=true]')).toHaveText(name);
});

test('homepage, header, drawer and footer use the same generated game name',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const name='Template Sample A Wiki';
 await expect(page.locator('h1')).toHaveAccessibleName(name);
 for(const brand of await page.locator('.site-header-bar > .site-brand, .site-footer .site-brand').all()){
  await expect(brand).toHaveAccessibleName(name);await expect(brand).toHaveAttribute('title',name);
  await expect(brand.locator('.site-wordmark')).toHaveText(name);
 }
 await openChrome(page);await expect(page.locator('.site-drawer-top .site-brand')).toHaveAccessibleName(name);await expect(page.locator('.site-drawer-top .site-wordmark')).toHaveText(name);
 await page.goto('/ja');await expect(page.locator('h1')).toHaveAccessibleName('テンプレート見本 A Wiki');
});

for(const width of [320,390,768,834,1440])test(`maximum game name stays on one line without hiding controls at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const header=page.locator('header.site-header');await expect(header).toHaveAttribute('data-nav-form',width<768?'burger':'inline');
 const name='M'.repeat(40)+' Wiki';
 await page.locator('.site-brand').evaluateAll((brands,name)=>{
  for(const brand of brands){brand.setAttribute('title',name);brand.querySelector('.site-wordmark')!.textContent=name;}
 },name);
 const brand=page.locator('.site-header-bar > .site-brand');const wordmark=brand.locator('.site-wordmark');
 await expect(brand).toHaveAccessibleName(name);await expect(wordmark).toHaveText(name);
 await expect(wordmark).toHaveCSS('white-space','nowrap');await expect(wordmark).toHaveCSS('text-overflow','ellipsis');await expect(wordmark).toHaveCSS('font-size','18px');
 const geometry=await wordmark.evaluate(element=>({width:element.clientWidth,overflow:element.scrollWidth>element.clientWidth,height:element.getBoundingClientRect().height,line:parseFloat(getComputedStyle(element).lineHeight)}));
 expect(geometry.width).toBeGreaterThan(40);expect(geometry.overflow).toBe(true);expect(geometry.height).toBeLessThanOrEqual(geometry.line+1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width<768){
  await openChrome(page);const drawer=page.locator('.site-drawer-top .site-brand');await expect(drawer).toHaveAccessibleName(name);
  await expect(drawer.locator('.site-wordmark')).toHaveCSS('text-overflow','ellipsis');await expect(page.locator('.site-close')).toBeInViewport();
  await page.locator('.site-close').click();await expect(page.locator('[data-burger]')).toHaveAttribute('aria-expanded','false');
 }else{
  const rail=page.locator('.site-navigation-rail');expect((await rail.boundingBox())!.width).toBeGreaterThan(130);
  await expect(page.locator('.site-mode')).toBeInViewport();await page.locator('.site-mode').click();
  const next=rail.locator('.site-nav-scroll').last();
  if(await next.isVisible()){await next.click();await expect.poll(()=>rail.locator('nav').evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);}
 }
 const footer=page.locator('.site-footer .site-wordmark');expect(await footer.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
});
