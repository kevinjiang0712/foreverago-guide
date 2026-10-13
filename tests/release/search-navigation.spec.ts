import {expect,test} from '@playwright/test';

test('site search finds new guides, supports keyboard navigation and restores focus',async({page})=>{
 await page.goto('/');
 const trigger=page.getByRole('button',{name:'Search guides',exact:true});
 await trigger.click();
 const dialog=page.getByRole('dialog');
 const query=dialog.getByRole('searchbox');
 await expect(query).toBeFocused();
 await query.fill('mosaic pumpkins');
 await expect(dialog.locator('a[href="/guide/forever-ago-mosaic-pumpkins"]')).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
 await page.keyboard.press('/');await expect(dialog).toBeVisible();
 await query.fill('no-matching-game-guide-54321');
 await expect(dialog.getByText('No matching guide yet.',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Show all starting points',exact:true}).click();
 await query.fill('completion tracker');await query.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/guide\/forever-ago-completion-tracker$/);
 await expect(dialog).not.toBeVisible();
});

test('mobile navigation opens groups and reaches every new task page',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const menu=page.locator('[data-burger]');await expect(menu).toBeVisible();await menu.click();
 await page.getByRole('button',{name:'Open Side Quests guides',exact:true}).click();
 const target=page.locator('.site-navigation a[href="/guide/forever-ago-guardian-lord"]');
 await expect(target).toBeVisible();await target.click();
 await expect(page).toHaveURL(/\/guide\/forever-ago-guardian-lord$/);
 await expect(menu).toHaveAttribute('aria-expanded','false');
 await menu.click();await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');
 await page.getByRole('button',{name:'Search guides',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('desktop dropdowns open with click and close with Escape without following the parent link',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const toggle=page.getByRole('button',{name:'Open Completion guides',exact:true});
 await toggle.click();
 await expect(page.getByRole('button',{name:'Close Completion guides',exact:true})).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('.site-navigation a[href="/guide/forever-ago-achievements"]')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Open Completion guides',exact:true})).toHaveAttribute('aria-expanded','false');
 await expect(page).toHaveURL(/\/$/);
});
