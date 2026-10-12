import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
for(const locale of ['en','ja'])test(`catalogue retains original media, table columns, content without source displays in ${locale}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const prefix=locale==='en'?'':`/${locale}`;
 await page.goto(`${prefix}/builds/build-library-reference`);await expect(page.locator('#rescue th')).toHaveCount(4);await expect(page.locator('#rescue tbody tr').first().locator('td')).toHaveCount(4);await expect(page.locator('#rescue a[href$="/demo-steady"]')).toHaveCount(1);
 await expect(page.locator('#sources,a[href="#sources"]')).toHaveCount(0);await expect(page.locator('.page-pager')).toHaveCount(0);await expect(page.locator('#sources a[href="#"]')).toHaveCount(0);
 await page.goto(`${prefix}/arsenal`);for(const id of ['tier-list','unlocks']){await expect(page.locator(`#${id} th`)).toHaveCount(4);await expect(page.locator(`#${id} tbody tr`).first().locator('td')).toHaveCount(4);}
 await expect(page.locator('#upgrades [data-media-id]')).toHaveCSS('aspect-ratio','4 / 3');await expect(page.locator('#upgrades .media-slot-dimensions')).toHaveText('1200 × 900');await expect(page.locator('#upgrades figcaption')).not.toBeEmpty();
 await expect(page.locator('.explorer-pick-risk')).toHaveCount(2);await expect(page.locator('#sources,a[href="#sources"]')).toHaveCount(0);await expect(page.locator('#changes th')).toHaveCount(3);await expect(page.locator('#changes tbody tr').first().locator('td')).toHaveCount(3);await expect(page.locator('.page-pager')).toHaveCount(0);
});
for(const width of [390,834,1240])test(`catalogue grids match original sizing and long upgrade columns scroll at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/arsenal');
 const columns=await page.locator('.explorer-picks').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);expect(columns).toBe(width===390?1:2);
 const detail=await page.locator('.explorer-weapon-detail').first().evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').map(parseFloat).filter(width=>width>0));expect(detail.length).toBe(width===390?1:2);if(detail.length===2)expect(Math.abs(detail[0]-detail[1])).toBeLessThan(1);
 const upgradeColumns=await page.locator('.explorer-upgrade-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').map(parseFloat).filter(width=>width>0).length);expect(upgradeColumns).toBe(width===390?1:2);
 const bundle=await build({entryPoints:['tests/fixtures/interactive/catalogue.tsx'],bundle:true,jsx:'automatic',write:false,format:'iife',platform:'browser',define:{'process.env':'{}','process.env.NODE_ENV':'\"production\"'}});
 await page.evaluate(()=>{const host=document.createElement('div');host.id='catalogue-long-tree';document.querySelector('main')!.append(host);});await page.addScriptTag({content:bundle.outputFiles[0].text});const harness=page.locator('#catalogue-long-tree');
 for(const tier of [1,2,3]){const tree=harness.locator(`[data-col="t${tier}"]`);await expect(tree.locator('button')).toHaveCount(18);await expect(tree).toHaveCSS('max-height','296px');await expect(tree).toHaveCSS('overflow-y','auto');const scroll=await tree.evaluate(node=>{node.scrollTop=node.scrollHeight;return {client:node.clientHeight,scroll:node.scrollHeight,top:node.scrollTop};});expect(scroll.client).toBeLessThanOrEqual(296);expect(scroll.scroll).toBeGreaterThan(scroll.client);expect(scroll.top).toBeGreaterThan(0);await tree.locator('button').first().click();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
