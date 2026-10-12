import {test,expect,type Locator} from '@playwright/test';
import {openChrome} from './chrome-access';
import {inspectTextContrast} from '../../scripts/matrix-page';
async function colors(hero:Locator){return hero.evaluate(element=>[element,...element.querySelectorAll('*')].map(node=>[null,'::before','::after'].map(pseudo=>{const style=getComputedStyle(node,pseudo);return ['color','background-color','background-image','border-top-color','border-left-color','box-shadow','opacity','color-scheme'].map(property=>style.getPropertyValue(property));})));}
for(const width of [390,520,1240])test(`article Hero keeps night appearance and balanced artwork at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/guides/first-steps');await page.evaluate(()=>document.fonts.ready);
 const hero=page.locator('.article-hero');await expect(hero).toHaveAttribute('data-theme-mode','night');
 await expect(hero.locator('.breadcrumb')).toBeVisible();await expect(hero.locator('h1')).toHaveText('Getting started');await expect(hero.locator('.article-quick-answer p')).toHaveCount(4);
 const art=hero.locator('img');await expect(art).toBeVisible();expect(await art.evaluate(node=>node instanceof HTMLImageElement&&node.complete&&node.naturalWidth>0)).toBe(true);
 const night=await colors(hero);const body=await page.locator('body').evaluate(node=>getComputedStyle(node).backgroundColor);
 const contrast=await inspectTextContrast(page,'.article-quick-answer h2,.article-quick-answer p');expect(contrast.filter(item=>item.ratio<4.5)).toEqual([]);
 await openChrome(page);await page.getByRole('switch').click();if(await page.locator('[data-burger]').getAttribute('aria-expanded')==='true')await page.keyboard.press('Escape');
 await expect(page.locator('html')).toHaveAttribute('data-mode','day');expect(await colors(hero)).toEqual(night);
 await expect.poll(()=>page.locator('body').evaluate(node=>getComputedStyle(node).backgroundColor)).not.toBe(body);
 await page.reload();await page.evaluate(()=>document.fonts.ready);expect(await colors(hero)).toEqual(night);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.article-main [data-media-id="article-atmosphere"]')).toHaveCount(0);
 if(width===1240){const answer=await hero.locator('.article-quick-answer').boundingBox();const image=await art.boundingBox();expect(image!.x+image!.width).toBeGreaterThan(answer!.x+answer!.width+200);}
});
