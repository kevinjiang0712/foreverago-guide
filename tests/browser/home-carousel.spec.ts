import {expect,test} from '@playwright/test';

for(const width of [390,1440])for(const copy of [0,1])test(`home carousel opens ${copy===0?'original':'visible loop'} cards at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const viewport=page.locator('.home-featured-viewport');
 const card=page.locator('.home-featured-track-set').nth(copy).locator('a').first();
 const href=await card.getAttribute('href');expect(href).toBeTruthy();
 await viewport.scrollIntoViewIfNeeded();
 await viewport.evaluate((element,copy)=>{element.scrollLeft=copy===0?0:element.querySelector('.home-featured-track-set')!.scrollWidth;},copy);
 await card.click();await expect(page).toHaveURL(new URL(href!,page.url()).href);
});

test('home carousel drags without navigating and the next click still opens a guide',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const viewport=page.locator('.home-featured-viewport');await viewport.scrollIntoViewIfNeeded();
 const card=page.locator('.home-featured-track-set').first().locator('a').first();
 const box=await card.boundingBox();expect(box).not.toBeNull();
 const startX=box!.x+box!.width*.75,startY=box!.y+box!.height*.5;
 const before=await viewport.evaluate(element=>element.scrollLeft);
 await page.mouse.move(startX,startY);await page.mouse.down();await page.mouse.move(startX-100,startY,{steps:10});await page.mouse.up();
 await expect(page).toHaveURL('/');expect(await viewport.evaluate(element=>element.scrollLeft)).toBeGreaterThan(before+50);
 const href=await card.getAttribute('href');await card.click();await expect(page).toHaveURL(new URL(href!,page.url()).href);
});

test('home carousel loop copies do not duplicate keyboard stops',async({page})=>{
 await page.goto('/');
 const originals=page.locator('.home-featured-track-set').first().locator('a');
 const copies=page.locator('.home-featured-track-set').nth(1).locator('a');
 await expect(copies).toHaveCount(await originals.count());
 await originals.last().focus();await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>!!document.activeElement?.closest('.home-featured-track-set'))).toBe(false);
 await originals.first().press('Enter');await expect(page).not.toHaveURL('/');
});

test.describe('touch carousel',()=>{
 test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 test('a tap opens a guide',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  const card=page.locator('.home-featured-track-set').first().locator('a').first();
  const href=await card.getAttribute('href');await card.tap();await expect(page).toHaveURL(new URL(href!,page.url()).href);
 });
});
