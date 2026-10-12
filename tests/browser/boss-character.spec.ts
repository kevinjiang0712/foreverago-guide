import {expect,test} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('boss filters combine difficulty and phase, report actual entities and reset',async({page})=>{
 await page.goto('/bosses');await expect(page.locator('.list-card')).toHaveCount(24);await expect(page.locator('.list-notice')).toHaveCount(1);await expect(page.locator('.list-results [role=status]')).toContainText('24 Results');await expect(page.locator('.list-results [role=status]')).toContainText('Known total: Unverified');
 await page.getByRole('button',{name:'Low difficulty',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(9);
 await page.getByRole('button',{name:'Multi-phase',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(7);await expect(page.locator('[data-entry-id="demo-sentinel"]')).toBeVisible();
 await page.getByRole('button',{name:'Unrated',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(0);await expect(page.locator('.list-no-results')).toBeVisible();
 await page.locator('.list-no-results button').click();await expect(page.locator('.list-card')).toHaveCount(24);await expect(page.getByRole('button',{name:'Multi-phase',exact:true})).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('[data-entry-id="demo-guardian"]')).toHaveAttribute('href','/guides/first-steps');await expect(page.locator('[data-entry-id="demo-warden"]')).toHaveAttribute('href','/bosses/boss-catalogue-reference');
 await page.locator('.list-guide a').click();await expect(page.locator('[data-template=article-page]')).toHaveCount(1);await expect(page.locator('#attacks tbody tr')).toHaveCount(4);await expect(page.locator('[data-template-body]')).toContainText('fixed description slot');
});
test('character lists and relation articles resolve the same records in both languages',async({page})=>{
 for(const prefix of ['', '/ja']){
  await page.goto(`${prefix}/characters`);await expect(page.locator('.list-card')).toHaveCount(24);await expect(page.locator('.list-notice')).toHaveCount(1);const lead=await page.locator('[data-entry-id="demo-traveller"] h3').innerText();
  await expect(page.locator('[data-character-spotlight]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('↗');await expect(page.locator('.list-card-action .ui-arrow-right').first()).toBeVisible();
  await expect(page.locator('[data-entry-id="demo-traveller"]')).toHaveAttribute('href',prefix?'/ja/guides/hajime':'/guides/first-steps');await expect(page.locator('[data-entry-id="demo-guide"]')).toHaveAttribute('href',`${prefix}/characters/demo-guide`);
  await page.locator('.list-guide a').click();await expect(page.locator('#lead h3')).toHaveText(lead);await expect(page.locator('#relations tbody tr')).toHaveCount(3);await expect(page.locator('#relations tbody tr').first().locator('td').first()).toHaveText(lead);await expect(page.locator('#lead .article-facts')).toBeVisible();
  await page.goto(prefix||'/');await expect(page.locator('[data-character-spotlight]')).toHaveCount(1);await expect(page.locator('.character-spotlight-card')).toHaveCount(3);await expect(page.locator('.character-spotlight-avatar img')).toHaveCount(3);
 }
 await page.goto('/bosses');await expect(page.locator('[data-character-spotlight]')).toHaveCount(0);
 await page.goto('/ja/bosses');await page.getByRole('button',{name:'低難度',exact:true}).click();await page.getByRole('button',{name:'複数フェーズ',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(7);
});
for(const width of [390,834,1240,1440,1600])for(const path of ['/bosses','/characters','/mods'])test(`${path} uses shared list geometry at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(path);await page.evaluate(async()=>{await document.fonts.ready;});
 expect(await page.locator('[data-template] [data-floor]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-floor')))).toEqual(['hero','list']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await expect(page.locator('.inner-hero')).toHaveCSS('min-height',`${width<768?240:width<1024?280:320}px`);
 const columns=await page.locator('.list-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);expect(columns).toBe(width<601?1:width<1024?2:width<1200?3:width<1440?4:5);
 if(width>=1240){const rowHeightSpreads=await page.locator('.list-card').evaluateAll(nodes=>{const rows=new Map<number,number[]>();for(const node of nodes){const box=node.getBoundingClientRect(),top=Math.round(box.top);rows.set(top,[...(rows.get(top)??[]),box.height]);}return [...rows.values()].map(heights=>Math.max(...heights)-Math.min(...heights));});expect(Math.max(...rowHeightSpreads)).toBeLessThan(1);}
 await mkdir('.artifacts/list-consolidation',{recursive:true});await page.screenshot({path:`.artifacts/list-consolidation/${path.slice(1)}-${width}.png`,fullPage:true});
});
