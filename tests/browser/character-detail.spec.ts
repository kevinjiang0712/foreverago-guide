import {test,expect} from '@playwright/test';
import {openChrome} from './chrome-access';

for(const locale of ['en','ja'])test(`character card reaches a complete localized detail: ${locale}`,async({page})=>{
 const prefix=locale==='en'?'':'/ja';const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${prefix}/characters`);
 await page.locator('.list-card[data-entry-id="demo-guide"]').click();await expect(page).toHaveURL(new RegExp(`${prefix}/characters/demo-guide$`));
 await expect(page.locator('[data-template="article-page"]')).toHaveCount(1);
 await expect(page.locator('h1')).toHaveAccessibleName(locale==='en'?'Demo Guide':'サンプル案内人');
 await expect(page.locator('.site-header nav [aria-current="page"]')).toHaveAttribute('href',`${prefix}/characters`);
 expect(await page.locator('[data-floor]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-floor')))).toEqual(['hero','article-body','attributes','skills','acquisition','related-content']);
 await expect(page.locator('#attributes dd')).toHaveCount(4);
 await expect(page.locator('[data-skill-id="active-demo"] .article-facts>div:first-child')).toHaveCount(1);
 await expect(page.locator('[data-skill-id="active-demo"] .article-facts>div:last-child')).toHaveCount(1);
 await expect(page.locator('[data-skill-id="passive-demo"] .article-facts>div')).toHaveCount(0);
 await expect(page.locator('#acquisition ol li')).toHaveCount(2);
 await expect(page.locator('#sources time')).toHaveCount(0);
 await page.locator('.anchor-rail-links a[href="#skills"]').click();await expect(page).toHaveURL(/#skills$/);
 await expect(page.locator('#skills')).toBeInViewport();
 await page.locator('.breadcrumb a:last-of-type').click();await expect(page).toHaveURL(new RegExp(`${prefix}/characters$`));
 expect(errors).toEqual([]);
});

for(const width of [390,1240])test(`character detail supports language navigation and keyboard anchors at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/characters/demo-guide');
 if(width<768){await expect(page.locator('.article-directory')).toBeHidden();await page.locator('#acquisition').scrollIntoViewIfNeeded();}else{await page.locator('.anchor-rail-links a[href="#acquisition"]').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/#acquisition$/);}
 await expect(page.locator('#acquisition')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await openChrome(page);await page.getByRole('button',{name:'Language',exact:true}).click();
 await page.getByRole('option',{name:'日本語',exact:true}).click();await expect(page).toHaveURL(/\/ja\/characters\/demo-guide$/);
 await expect(page.locator('html')).toHaveAttribute('lang','ja');await expect(page.locator('h1')).toHaveAccessibleName('サンプル案内人');
 await page.reload();await expect(page.locator('[data-template="article-page"]')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

test('character detail metadata and canonical follow its real route',async({page})=>{
 await page.goto('/characters/demo-guide');
 await expect(page).toHaveTitle(/Demo Guide/);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://sample-a.example/characters/demo-guide');
 // Demo pages are noindex and intentionally have no search-engine alternates.
 await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 const response=await page.request.get('/ja/characters/demo-guide');expect(response.ok()).toBe(true);
});

test('mobile character article omits the contents picker',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/characters/demo-guide');
 await expect(page.locator('.article-directory')).toBeHidden();await expect(page.locator('.anchor-rail-picker')).toHaveCount(0);
});
