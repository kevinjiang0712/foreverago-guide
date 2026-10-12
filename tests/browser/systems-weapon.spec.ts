import {build} from 'esbuild';
import {expect,test} from '@playwright/test';
test('weapon article tabs omit empty datasets and retain keyboard behavior in both languages',async({page})=>{
 for(const path of ['/weapons/practice-blade','/ja/weapons/practice-blade']){
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(path);
  const tabs=page.getByRole('tab');await expect(tabs).toHaveCount(2);
  await tabs.first().focus();await page.keyboard.press('ArrowRight');await expect(tabs.last()).toBeFocused();
  await expect(page.locator('[data-upgrade-id="training-base"]')).toBeVisible();
  await expect(page.locator('.weapon-moveset')).toBeHidden();
  await page.keyboard.press('Home');await expect(tabs.first()).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('tabpanel')).toBeFocused();
  await expect(page.locator('[data-gallery],.empty-state')).toHaveCount(0);
  expect(await page.getByRole('tab').evaluateAll(nodes=>nodes.every(node=>Boolean(document.getElementById(node.getAttribute('aria-controls')!))))).toBe(true);
 }
});
test('systems article keeps shared item links, unknown values, and omits source displays',async({page})=>{
 for(const [prefix,unknown] of [['','Unverified'],['/ja','未確認']]){
  await page.goto(`${prefix}/systems`);await expect(page.locator('[data-mechanism-id]')).toHaveCount(4);
  await expect(page.locator('#items table')).toContainText(unknown);
  await expect(page.locator('.article-mechanism-icon').first()).toHaveCSS('mask-image',/\/ui\/icons\/issen.svg/);
  const name=await page.locator('[data-item-id="practice-blade"] h3').innerText();await page.locator('[data-item-id="practice-blade"] a').click();
  await expect(page.locator('h1')).toHaveAccessibleName(name);await expect(page.locator('.article-summary')).toContainText(unknown);
  await expect(page.locator('#sources')).toHaveCount(0);await expect(page.locator('#sources a,a[href="#"],a[href=""]')).toHaveCount(0);
 }
});
test('weapon article directory reaches sections and FAQ still expands',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/weapons/practice-blade');
 await page.locator('.anchor-rail-links a[href="#unlock"]').click();await expect(page.locator('#unlock')).toBeInViewport();
 await page.locator('.anchor-rail-links a[href="#faq"]').click();await expect(page.locator('#faq')).toBeInViewport();
 const first=page.locator('#faq details').first();await expect(first).toHaveAttribute('open','');await first.locator('summary').click();await expect(first).not.toHaveAttribute('open','');
 await page.setViewportSize({width:390,height:900});await expect(page.locator('.article-directory')).toBeHidden();
 await page.locator('#tabs').scrollIntoViewIfNeeded();await expect(page.locator('#tabs')).toBeInViewport();
 await expect(page.locator('.related-content-card')).toHaveCount(3);
});

test('isolated React instances keep tab IDs, focus and empty or single galleries independent',async({page})=>{
 const bundle=await build({entryPoints:['tests/fixtures/interactive/systems-weapon.tsx'],bundle:true,jsx:'automatic',write:false,outdir:'/tmp/game-template-interactive-bundle',format:'iife',platform:'browser',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'}});
 const script=bundle.outputFiles.find(file=>file.path.endsWith('.js'));const css=bundle.outputFiles.find(file=>file.path.endsWith('.css'));if(!script||!css)throw new Error('Interactive fixture bundle missing JS or CSS');
 await page.goto('about:blank');await page.setContent('<main id="root" style="width:640px"></main>');await page.addStyleTag({content:css.text});await page.addScriptTag({content:script.text});
 const first=page.locator('[data-harness=first]'),second=page.locator('[data-harness=second]');await expect(first.getByRole('tab').first()).toHaveAttribute('aria-selected','true');await expect(second.getByRole('tab').nth(1)).toHaveAttribute('aria-selected','true');
 const ids=await page.locator('[role=tab],[role=tabpanel]').evaluateAll(nodes=>nodes.map(node=>node.id));expect(new Set(ids).size).toBe(ids.length);expect(ids.some(id=>/\s/.test(id))).toBe(false);
 await first.getByRole('tab').first().focus();await page.keyboard.press('ArrowRight');await expect(first.getByRole('tab').nth(1)).toBeFocused();await second.getByRole('tab').first().click();await expect(second.getByRole('tab').first()).toHaveAttribute('aria-selected','true');await expect(first.getByRole('tab').nth(1)).toHaveAttribute('aria-selected','true');
 const hiddenFocus=await page.locator('[role=tabpanel][hidden] button').evaluateAll(nodes=>nodes.map(node=>{(node as HTMLButtonElement).focus();return document.activeElement===node;}));expect(hiddenFocus).toEqual([false,false]);
 const empty=page.locator('[data-harness=empty]'),single=page.locator('[data-harness=single]'),multiple=page.locator('[data-harness=multiple]');await expect(empty).toContainText('No artwork supplied');await expect(empty.locator('button')).toHaveCount(0);await expect(single.locator('button')).toHaveCount(0);await expect(multiple.locator('button')).toHaveCount(2);
 const sizes=await page.locator('.gallery-main').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {width:b.width,height:b.height};}));expect(sizes[0]).toEqual(sizes[1]);expect(sizes[0]).toEqual(sizes[2]);expect(sizes[0].width/sizes[0].height).toBeCloseTo(16/9,2);
 await multiple.locator('button').first().focus();await page.keyboard.press('ArrowRight');await expect(multiple.locator('[data-gallery]')).toHaveAttribute('data-selected-asset','second-image');await expect(single.locator('[data-gallery]')).toHaveAttribute('data-selected-asset','first-image');
});
