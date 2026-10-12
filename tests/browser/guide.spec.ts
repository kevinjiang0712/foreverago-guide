import {expect,test} from '@playwright/test';
test('guide heading IDs, table, localized links and neighbors agree with the index',async({page})=>{
 await page.goto('/guides/first-steps');
 const ids=await page.locator('[data-article-body] h2,[data-article-body] h3').evaluateAll(headings=>headings.map(heading=>heading.id));
 expect(new Set(ids).size).toBe(ids.length);expect(ids.some(id=>id.endsWith('-1'))).toBe(true);
 const anchors=await page.locator('.anchor-rail-links a').evaluateAll(links=>links.map(link=>link.getAttribute('href')?.slice(1)));expect(anchors).toEqual([...ids]);
 await expect(page.locator('[data-floor=article-body] table')).toHaveCount(1);await expect(page.locator('[data-article-summary]')).toHaveCount(0);await expect(page.locator('.article-quick-answer h2')).toHaveText('Quick Answer');await expect(page.locator('.article-quick-answer p')).toHaveCount(4);await expect(page.locator('[data-floor=chapter-list],[data-article-route],[data-article-heading]')).toHaveCount(0);await expect(page.locator('.page-pager')).toHaveCount(0);await expect(page.locator('.related-content-card').first()).toHaveAttribute('href','/guides/reference-notes');await expect(page.locator('.related-content-action').first()).toHaveClass(/button-ghost/);await expect(page.locator('.related-content-action.button-primary')).toHaveCount(0);
 await page.locator('.related-content-card').first().click();await expect(page).toHaveURL(/reference-notes$/);await page.goBack();await expect(page.locator('h1')).toHaveAccessibleName('Getting started');
 await page.goto('/ja/guides/hajime');await expect(page.locator('[data-article-body] a').last()).toHaveAttribute('href','/ja');await expect(page.locator('.page-pager')).toHaveCount(0);await expect(page.locator('.related-content-card').first()).toHaveAttribute('href','/ja/guides/shiryo');
 await page.goto('/guides');await expect(page.locator('main .list-card')).toHaveCount(24);await expect(page.locator('main .list-card').first()).toHaveAttribute('href','/guides/first-steps');
});
test('mobile article omits contents picker and table stays readable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/guides/first-steps');
 await expect(page.locator('.article-directory')).toBeHidden();await expect(page.locator('.anchor-rail-picker')).toHaveCount(0);
 await expect(page.getByRole('listbox')).toHaveCount(0);
 const geometry=await page.locator('.wiki-table-scroll').evaluate(element=>({width:element.getBoundingClientRect().width,overflow:getComputedStyle(element).overflowX}));expect(geometry.width).toBeLessThanOrEqual(390);expect(geometry.overflow).toBe('auto');
});
