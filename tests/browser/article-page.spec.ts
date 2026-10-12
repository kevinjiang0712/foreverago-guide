import {test,expect} from '@playwright/test';
import {openChrome} from './chrome-access';

const articles=[['wiki-page','/guides/first-steps','/ja/guides/hajime'],['character-detail','/characters/demo-guide','/ja/characters/demo-guide'],['weapon-detail','/weapons/practice-blade','/ja/weapons/practice-blade'],['systems-reference','/systems','/ja/systems']];
for(const [type,en,ja] of articles)for(const width of [390,1240])for(const path of [en,ja])test(`${type} shares article layout and usable directory at ${width}: ${path}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 expect((await page.goto(path))?.status()).toBe(200);
 await expect(page.locator('[data-template]')).toHaveAttribute('data-template','article-page');
 await expect(page.locator('[data-template]')).toHaveAttribute('data-article-type',type);
 await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('[data-article-body]')).toHaveCount(1);
 await expect(page.locator('[data-floor=chapter-list],.page-hero,.weapon-hero,.character-detail-hero,.mod-detail-hero')).toHaveCount(0);
 // Fixtures have no supplied images. Optional module images must not become blank scaffolding.
 await expect(page.locator('.article-main [data-gallery],.article-main .media-slot-label')).toHaveCount(0);
 const headings=await page.locator('.article-directory a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')!.slice(1)));
 for(const id of headings)await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
 await expect(page.locator('#sources,.article-source-list,.article-directory a[href="#sources"]')).toHaveCount(0);
 const lastSection=page.locator('.article-content>.article-section').last();
 if(width<768){
  await expect(page.locator('.article-directory')).toBeHidden();await expect(page.locator('.article-directory .anchor-rail-picker')).toHaveCount(0);await lastSection.scrollIntoViewIfNeeded();
 }else await page.locator('.article-directory a').last().click();
 await expect(lastSection).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const table=page.locator('.article-table').first();if(await table.count())expect(await table.evaluate(node=>getComputedStyle(node).overflowX)).toBe('auto');
 await openChrome(page);await page.getByRole('switch').click();
 if(await page.locator('[data-burger]').getAttribute('aria-expanded')==='true')await page.keyboard.press('Escape');
 await expect(page.locator('html')).toHaveAttribute('data-mode','day');
 await page.locator('h1').scrollIntoViewIfNeeded();await expect(page.locator('h1')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
