import {expect,test} from '@playwright/test';

test('database filters, numeric sorting and compatible comparisons',async({page})=>{
 await page.goto('/database');
 await expect(page.locator('[data-template="catalog-page"]')).toBeVisible();
 await page.locator('[data-facet="category"] select').selectOption('weapons');
 await expect(page.locator('[role=status]')).toContainText('4');
 await page.getByRole('button',{name:'Attack',exact:true}).click();
 await expect(page.locator('tbody tr').first()).toHaveAttribute('data-entry-id','sample-sabre');
 await page.getByRole('button',{name:/Attack ↑/}).click();
 await expect(page.locator('tbody tr').first()).toHaveAttribute('data-entry-id','sample-greatsword');
 await expect(page.locator('tbody tr').last()).toHaveAttribute('data-entry-id','sample-unknown');
 const blade=page.locator('[data-entry-id="sample-blade"]');
 await blade.getByRole('checkbox').check();await page.locator('[data-entry-id="sample-sabre"]').getByRole('checkbox').check();
 await page.getByRole('searchbox').fill('no such entry');await expect(page.locator('.catalog-empty')).toBeVisible();
 await expect(page.locator('.catalog-selection')).toContainText('Practice blade');
 await page.locator('.catalog-selection').getByRole('button',{name:'Compare',exact:true}).click();
 await expect(page.locator('.catalog-comparison')).toBeFocused();
 await expect(page.locator('.catalog-comparison')).toContainText('1.5 kg');
 await page.locator('.catalog-selection').getByRole('button',{name:'Clear',exact:true}).click();
 await expect(page.locator('.catalog-comparison')).toHaveCount(0);
 await page.locator('.catalog-empty').getByRole('button',{name:'Reset',exact:true}).click();
 await page.locator('[data-entry-id="sample-blade"]').getByRole('checkbox').check();
 // No other shield has comparable data, so it exposes no misleading comparison action.
 await expect(page.locator('[data-entry-id="sample-shield"]').getByRole('checkbox')).toHaveCount(0);
 await expect(page.locator('[data-entry-id="sample-unknown"]').getByRole('checkbox')).toHaveCount(0);
});

test('build filters intersect, configurations switch all setup content, mod metadata remains accessible',async({page})=>{
 await page.goto('/builds');await expect(page.locator('.catalog-card')).toHaveCount(30);
 await page.locator('[data-facet="playstyle"] select').selectOption('steady');await expect(page.locator('.catalog-card')).toHaveCount(30);await expect(page.getByRole('status')).toContainText('33');
 await page.locator('[data-facet="weapon"] select').selectOption('practice-bow');await expect(page.locator('.catalog-card')).toHaveCount(9);
 await page.goto('/builds/demo-steady');await expect(page.locator('[data-template="build-detail"]')).toBeVisible();
 const stages=page.locator('#variants button');await stages.nth(2).focus();await page.keyboard.press('Enter');await expect(stages.nth(2)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#how-it-works')).not.toContainText('Standard demonstration with unknown performance.');
 await stages.nth(1).click();await expect(page.locator('#how-it-works')).toContainText('Standard demonstration with unknown performance.');
 await page.goto('/mods');await expect(page.locator('[data-catalog-kind="mods"]')).toBeVisible();
 await page.locator('.catalog-card').first().locator('h2 a').click();
 await expect(page.locator('[data-template="mod-detail"]')).toBeVisible();await expect(page.locator('[data-mod-metadata]')).toBeVisible();
});

for(const width of [320,390,834,1440])test(`structured layouts preserve theme and stay within ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const path of ['/builds','/builds/demo-steady','/mods','/mods/demo-overlay','/database','/database/database-blade']){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
  for(const mode of ['day','night']){
   await page.evaluate(mode=>{document.documentElement.setAttribute('data-mode',mode);document.documentElement.setAttribute('data-theme-mode',mode);},mode);
   const theme=await page.locator('.catalog-hero').evaluate(element=>({mode:element.getAttribute('data-theme-mode'),font:getComputedStyle(element.querySelector('h1')!).fontSize,color:getComputedStyle(element).color,token:getComputedStyle(element).getPropertyValue('--text-primary').trim()}));
   expect(theme.mode).toBe('night');expect(parseFloat(theme.font)).toBeGreaterThanOrEqual(34);
  }
 }
 expect(errors).toEqual([]);
});

test('database values and detail links remain usable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('/database');await expect(page.locator('noscript p')).toContainText('JavaScript');
 await expect(page.locator('[data-entry-id="sample-blade"]')).toContainText('2 kg');
 await page.getByRole('link',{name:'Practice blade',exact:true}).click();await expect(page.locator('#parameters')).toContainText('2 kg');
 await context.close();
});

test('catalogues use full-width results, horizontal filters and blank image slots',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 for(const route of ['/builds','/mods','/database']){
  await page.goto(route);
  const filters=await page.locator('.catalog-filters').boundingBox();
  const results=await page.locator('.catalog-results').boundingBox();
  expect(filters).not.toBeNull();expect(results).not.toBeNull();
  expect(results!.y).toBeGreaterThanOrEqual(filters!.y+filters!.height-1);
  expect(results!.width).toBeCloseTo(filters!.width,0);
  await expect(page.locator('.catalog-results .catalog-evidence')).toHaveCount(0);
  await expect(page.locator('.catalog-browser details,.catalog-preview')).toHaveCount(0);
  for(const image of await page.locator('.catalog-image-placeholder').all()){const box=await image.boundingBox();expect(box!.width).toBeCloseTo(box!.height,0);}
  if(route==='/mods'){const cards=page.locator('.catalog-card');const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();expect(first!.y).toBe(second!.y);expect(second!.x).toBeGreaterThan(first!.x);}
  if(route==='/builds'){
   await expect(page.locator('.catalog-card .catalog-image-placeholder')).toHaveCount(30);
   const card=await page.locator('.catalog-card').first().boundingBox();
   expect(card!.width).toBeLessThan(results!.width/3);expect(card!.height).toBeLessThan(370);
  }
  if(route==='/database')await expect(page.locator('tbody .catalog-image-placeholder')).toHaveCount(await page.locator('tbody tr').count());
 }
});

for(const route of ['/builds','/mods','/database'])test(`${route} paginates 65 demo entries and resets page on search, filter and sort`,async({page})=>{
 await page.goto(route);
 const entries=page.locator(route==='/database'?'.catalog-table tbody tr':'.catalog-card');
 const pager=page.locator('.catalog-pagination');
 await expect(page.getByRole('status')).toContainText('65');
 await expect(entries).toHaveCount(30);await expect(pager).toContainText('1 of 3');
 await expect(pager.getByRole('button',{name:'Previous'})).toBeDisabled();
 const firstIds=await entries.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-entry-id')));
 await pager.getByRole('button',{name:'Next'}).click();
 await expect(pager).toContainText('2 of 3');await expect(entries).toHaveCount(30);
 expect(await entries.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-entry-id')))).not.toEqual(firstIds);
 await pager.getByRole('button',{name:'Next'}).click();
 await expect(entries).toHaveCount(5);await expect(pager).toContainText('3 of 3');await expect(pager.getByRole('button',{name:'Next'})).toBeDisabled();
 await page.getByRole('searchbox').fill('no matching fixture');await expect(page.locator('.catalog-empty')).toBeVisible();await expect(pager).toHaveCount(0);
 await page.getByRole('searchbox').fill('');await expect(pager).toContainText('1 of 3');
 await pager.getByRole('button',{name:'Next'}).click();await page.getByRole('combobox',{name:'Sort',exact:true}).selectOption('name');await expect(pager).toContainText('1 of 3');
 await pager.getByRole('button',{name:'Next'}).click();await page.locator('.catalog-filters select').first().selectOption({index:1});
 await expect(entries.first()).toBeVisible();
 if(await pager.count())await expect(pager).toContainText('1 of');
 await page.getByRole('button',{name:'Reset',exact:true}).first().click();await expect(pager).toContainText('1 of 3');
});

for(const width of [320,1440])test(`dropdown filters support keyboard, outside dismissal and reset at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/mods');
 const tags=page.locator('[data-facet="tags"]'),trigger=tags.locator('>button');
 await expect(tags.getByRole('checkbox')).toHaveCount(0);
 await trigger.focus();await page.keyboard.press('ArrowDown');await expect(tags.getByRole('checkbox').first()).toBeFocused();
 await page.keyboard.press('Space');await expect(trigger).toContainText('Panel');
 await page.keyboard.press('Tab');await page.keyboard.press('Space');await expect(trigger).toContainText('Loader');
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
 await trigger.click();await expect(tags.getByRole('checkbox',{name:'Panel'})).toBeChecked();
 const panel=await tags.getByRole('group').boundingBox();expect(panel!.x).toBeGreaterThanOrEqual(0);expect(panel!.x+panel!.width).toBeLessThanOrEqual(width);expect(panel!.y+panel!.height).toBeLessThanOrEqual(900);
 await page.getByRole('searchbox').click();await expect(trigger).toHaveAttribute('aria-expanded','false');
 await trigger.click();await tags.getByRole('button',{name:'Clear',exact:true}).click();await expect(trigger).toContainText('All');
 await page.getByRole('button',{name:'Reset',exact:true}).first().click();await expect(trigger).toHaveAttribute('aria-expanded','false');
 await expect(page.getByRole('status')).toContainText('65');
 await page.locator('[data-facet="category"] select').selectOption('interface');await expect(page.getByRole('status')).toContainText('12');
 await page.locator('[data-facet="category"] select').selectOption('');await expect(page.getByRole('status')).toContainText('65');
});

test('catalogue heroes and unified controls bring results into the first viewport',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/builds','/mods','/database']){
  await page.goto(path);await page.evaluate(()=>document.fonts.ready);
  const dimensions=await page.evaluate(()=>{
   const hero=document.querySelector('.catalog-hero')!.getBoundingClientRect(),toolbar=document.querySelector('.catalog-toolbar')!.getBoundingClientRect(),filters=document.querySelector('.catalog-filters')!.getBoundingClientRect(),first=document.querySelector('[data-entry-id]')!.getBoundingClientRect();
   return {hero:hero.height,controls:filters.bottom-toolbar.top,first:first.top+scrollY,firstBottom:first.bottom+scrollY};
  });
  expect(dimensions.hero,path).toBeLessThanOrEqual(220);expect(dimensions.controls,path).toBeLessThanOrEqual(128);
  expect(dimensions.first,path).toBeLessThan(500);expect(dimensions.firstBottom,path).toBeLessThanOrEqual(900);
  await expect(page.locator('.catalog-filters .catalog-result-count')).toBeVisible();
 }
 await page.goto('/builds/demo-steady');await expect(page.locator('.catalog-hero')).not.toHaveAttribute('data-hero-size','catalog');
});
