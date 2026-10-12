import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

for(const width of [320,390,834,1440])test(`eight primary entries and ten children retain readable labels and controls at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:600});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const bundle=await build({entryPoints:['tests/fixtures/interactive/navigation.tsx'],bundle:true,jsx:'automatic',write:false,format:'iife',platform:'browser',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'}});
 await page.evaluate(()=>{document.body.replaceChildren(Object.assign(document.createElement('div'),{id:'navigation-boundary'}));});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 const nav=page.locator('#navigation-boundary nav'),entries=nav.locator('.site-nav-item');await expect(entries).toHaveCount(8);
 const first=entries.first();
 if(width>=768){
  await expect(page.locator('.site-navigation-rail')).toHaveAttribute('data-overflow','true');
  await page.getByRole('button',{name:'Boundary menu: Next',exact:true}).click();await expect.poll(()=>nav.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
  await nav.evaluate(element=>element.scrollTo({left:0,behavior:'instant'}));
  await first.locator('.site-nav-link').focus();await first.locator('.site-nav-link').press('ArrowDown');
  await expect(first.locator('.site-submenu a').first()).toBeFocused();
 }
 const submenu=first.locator('.site-submenu');await expect(submenu).toBeVisible();await expect(submenu.locator('a')).toHaveCount(10);
 await expect(submenu.locator('a').last()).toHaveText('W'.repeat(28));
 expect(await submenu.locator('a').evaluateAll(rows=>rows.every(row=>row.scrollWidth<=row.clientWidth))).toBe(true);
 expect(await nav.locator('.site-nav-link').evaluateAll(rows=>rows.every(row=>{const range=document.createRange();range.selectNodeContents(row.firstChild!);const text=range.getBoundingClientRect(),box=row.getBoundingClientRect();return text.left>=box.left&&text.right<=box.right;}))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width>=768){
  expect(await submenu.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
  await submenu.locator('a').last().focus();await expect(submenu.locator('a').last()).toBeInViewport();
  await submenu.locator('a').last().press('Escape');await expect(submenu).toBeHidden();await expect(first.locator('.site-nav-link')).toBeFocused();
  await first.locator('.site-nav-link').press('ArrowDown');
  await expect(submenu.locator('a').first()).toBeFocused();
 }
 await submenu.locator('a').last().click();await expect(page.locator('html')).toHaveAttribute('data-boundary-navigated','true');
});
