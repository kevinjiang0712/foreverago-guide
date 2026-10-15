import {expect,test} from '@playwright/test';

test('trailer loads the player only after keyboard activation',async({page})=>{
 const playerRequests:string[]=[];
 await page.route(/https:\/\/(www\.youtube-nocookie\.com|www\.youtube\.com)\//,async route=>{
  playerRequests.push(route.request().url());
  await route.fulfill({contentType:'text/html',body:'<!doctype html><title>Trailer player</title>'});
 });
 await page.goto('/',{waitUntil:'networkidle'});
 await expect(page.locator('link[rel="preload"][href="/media/fonts/figtree-600.woff2"]').first()).toHaveAttribute('as','font');
 expect(playerRequests).toEqual([]);
 await expect(page.locator('.video-embed iframe')).toHaveCount(0);
 const preview=page.getByRole('button',{name:/Play.*trailer/i});
 await expect(preview).toBeVisible();
 const before=await page.locator('.video-embed').boundingBox();
 await preview.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.video-embed iframe')).toHaveAttribute('src',/youtube-nocookie\.com\/embed\/AeHgQ29sukE\?autoplay=1/);
 await expect.poll(()=>playerRequests.length).toBe(1);
 const after=await page.locator('.video-embed').boundingBox();
 expect(after?.height).toBe(before?.height);
 expect(after?.width).toBe(before?.width);
});

test('the mobile tracker avoids speculative breadcrumb downloads and its home link still navigates',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const speculative:string[]=[];
 page.on('request',request=>{if(new URL(request.url()).searchParams.has('_rsc'))speculative.push(request.url());});
 await page.goto('/guide/forever-ago-completion-tracker',{waitUntil:'networkidle'});
 await expect(page.getByLabel('Search tasks',{exact:true})).toBeEnabled();
 await page.waitForTimeout(1000);
 expect(speculative).toEqual([]);
 await page.locator('.site-header-bar > .site-brand').click();
 await expect(page).toHaveURL(/\/$/);
 await expect(page.locator('h1')).toBeVisible();
});

test('cold pages render their theme without external CSS or JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:390,height:844}});
 const stylesheetRequests:string[]=[];
 await context.route(/\.css(?:\?|$)/,async route=>{
  stylesheetRequests.push(route.request().url());
  await route.abort();
 });
 const page=await context.newPage();
 for(const path of ['/','/guide/forever-ago-completion-tracker','/guide/forever-ago-scallyrat-roberts']){
  await page.goto(path,{waitUntil:'networkidle'});
  await expect(page.locator('h1')).toBeVisible();
  const typography=await page.locator('h1').evaluate(heading=>({font:getComputedStyle(heading).fontFamily,size:parseFloat(getComputedStyle(heading).fontSize)}));
  expect(typography.font).toContain('Outfit');
  expect(typography.size).toBeGreaterThan(30);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
 }
 expect(stylesheetRequests).toEqual([]);
 await context.close();
});
