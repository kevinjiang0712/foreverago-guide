import {expect,type Page} from '@playwright/test';
/** Open whichever navigation form the real labels and viewport require. */
export async function openChrome(page:Page){
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await expect(page.locator('header.site-header')).toHaveAttribute('data-hidden','false');
 await expect(page.locator('header.site-header')).toBeVisible();
 const trigger=page.locator('[data-burger]');
 if(await trigger.isVisible()&&await trigger.getAttribute('aria-expanded')!=='true'){
  await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
 }
}
