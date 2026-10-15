import {expect,test} from '@playwright/test';

const tracker='/guide/forever-ago-completion-tracker';
const storageKey='forever-ago:completion:v1';

test('shareable filters survive refresh and follow browser back and forward',async({page})=>{
 await page.goto(`${tracker}?q=bench&stop=gas-station&type=rest&progress=remaining`);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByLabel('Search tasks',{exact:true})).toHaveValue('bench');
 await expect(tool.locator('[data-task-id]')).toHaveCount(1);
 await expect(tool.getByLabel('Selected road stop remaining tasks')).toContainText('8 tasks remaining');
 await page.reload();
 await expect(tool.getByLabel('Search tasks',{exact:true})).toHaveValue('bench');
 await expect(tool.getByLabel('Chapter / road stop',{exact:true})).toHaveValue('gas-station');
 await tool.getByLabel('Chapter / road stop',{exact:true}).selectOption('diner');
 await expect(page).toHaveURL(/stop=diner/);
 await page.goBack();
 await expect(tool.getByLabel('Chapter / road stop',{exact:true})).toHaveValue('gas-station');
 await expect(tool.locator('[data-task-id]')).toHaveCount(1);
 await page.goForward();
 await expect(tool.getByLabel('Chapter / road stop',{exact:true})).toHaveValue('diner');
 await tool.getByRole('button',{name:'Show remaining at this stop',exact:true}).click();
 await expect(tool.getByLabel('Search tasks',{exact:true})).toHaveValue('');
 await expect(tool.getByRole('button',{name:/^All types/})).toHaveAttribute('aria-pressed','true');
});

test('unknown filter values default safely and clipboard failure is explained',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new DOMException('Clipboard denied','NotAllowedError');}}}));
 await page.goto(`${tracker}?stop=unknown&type=unknown&progress=unknown`);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByLabel('Chapter / road stop',{exact:true})).toHaveValue('all');
 await expect(tool.getByLabel('Progress',{exact:true})).toHaveValue('all');
 await expect(tool.locator('[data-task-id]')).toHaveCount(53);
 await tool.getByRole('button',{name:'Copy filter link',exact:true}).click();
 await expect(tool.getByText(/The filter link could not be copied/)).toBeVisible();
});

test('copied filter links share filters without saved progress and fit a 320px screen',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(value:string)=>{document.documentElement.dataset.copiedLink=value;}}}));
 await page.setViewportSize({width:320,height:800});
 await page.goto(`${tracker}?stop=gas-station&type=rest`);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByLabel('Search tasks',{exact:true})).toBeEnabled();
 await tool.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox').check();
 await tool.getByRole('button',{name:'Copy filter link',exact:true}).click();
 const copied=await page.locator('html').getAttribute('data-copied-link');
 expect(copied).toContain('stop=gas-station&type=rest#completion-checklist');
 expect(copied).not.toContain('rest-forecourt');
 await expect(tool.getByText(/Filter link copied/)).toBeVisible();
 const bounds=await tool.evaluate(element=>({left:element.getBoundingClientRect().left,right:element.getBoundingClientRect().right,overflow:element.scrollWidth>element.clientWidth}));
 expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(320);expect(bounds.overflow).toBe(false);
});

test('task filters, saved progress, cross-guide state and reset work through the real pages',async({page})=>{
 await page.goto(tracker);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByLabel('Search tasks',{exact:true})).toBeEnabled();
 await expect(tool.locator('[data-task-id]')).toHaveCount(53);
 await tool.getByRole('button',{name:/^Rest stop/}).click();
 await tool.getByLabel('Chapter / road stop',{exact:true}).selectOption('gas-station');
 await expect(tool.locator('[data-task-id]')).toHaveCount(2);
 const bench=tool.locator('[data-task-id="rest-forecourt"]');
 await bench.getByRole('checkbox').check();
 await expect(bench).toHaveAttribute('data-complete','true');
 await page.reload();
 await expect(page.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox')).toBeChecked();
 await page.goto('/guide/forever-ago-old-bones-achievement');
 await expect(page.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox')).toBeChecked();
 const rests=page.locator('[data-completion-tool="rests"]');
 await rests.getByLabel('Progress',{exact:true}).selectOption('done');
 await expect(rests.locator('[data-task-id]')).toHaveCount(1);
 await rests.getByRole('button',{name:'Clear filters',exact:true}).click();
 await rests.getByLabel('Search tasks',{exact:true}).fill('unmatched-landmark-123');
 await expect(rests.getByRole('heading',{name:'No matching tasks'})).toBeVisible();
 await rests.getByRole('button',{name:'Show all tasks',exact:true}).click();
 await rests.getByText('Manage progress',{exact:true}).click();
 page.once('dialog',dialog=>dialog.dismiss());
 await rests.getByRole('button',{name:'Reset all progress',exact:true}).click();
 await expect(rests.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox')).toBeChecked();
 page.once('dialog',dialog=>dialog.accept());
 await rests.getByRole('button',{name:'Reset all progress',exact:true}).click();
 await expect(rests.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox')).not.toBeChecked();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).progress,storageKey)).toEqual({});
});

test('vignettes require ordered stages and stay in progress until photographed',async({page})=>{
 await page.goto('/maps/forever-ago-memory-locations');
 const tool=page.locator('[data-completion-tool="memories"]');
 await expect(tool.getByLabel('Search tasks',{exact:true})).toBeEnabled();
 const vignette=tool.locator('[data-task-id="memory-fun-colors"]');
 const petals=vignette.getByRole('checkbox',{name:'Fun & Colors: Petals collected',exact:true});
 const unlocked=vignette.getByRole('checkbox',{name:'Fun & Colors: Vignette unlocked',exact:true});
 const photo=vignette.getByRole('checkbox',{name:'Fun & Colors: Memory photographed',exact:true});
 await expect(unlocked).toBeDisabled();await expect(photo).toBeDisabled();
 await petals.check();await unlocked.check();
 await expect(vignette).toHaveAttribute('data-complete','false');
 await tool.getByLabel('Progress',{exact:true}).selectOption('started');
 await expect(tool.locator('[data-task-id]')).toHaveCount(1);
 await photo.click();
 await expect(tool.locator('[data-task-id]')).toHaveCount(0);
 await tool.getByLabel('Progress',{exact:true}).selectOption('done');
 await expect(tool.locator('[data-task-id]')).toHaveCount(1);
 await expect(photo).toBeChecked();
 await petals.click();
 await tool.getByRole('button',{name:'Show all tasks',exact:true}).click();
 await expect(petals).not.toBeChecked();
 await expect(unlocked).not.toBeChecked();await expect(photo).not.toBeChecked();
 await expect(unlocked).toBeDisabled();
});

test('malformed saved progress is explained and preserved rather than silently overwritten',async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,'not-json'),storageKey);
 await page.goto(tracker);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByText(/Your saved progress could not be opened/)).toBeVisible();
 await tool.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox').check();
 expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBe('not-json');
});

test('storage denial leaves a usable checklist and an explicit saving status',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}}));
 await page.goto(tracker);
 const tool=page.locator('[data-completion-tool="all"]');
 await expect(tool.getByText(/Saving is unavailable in this browser/)).toBeVisible();
 const row=tool.locator('[data-task-id="rest-forecourt"]');
 await row.getByRole('checkbox').check();await expect(row).toHaveAttribute('data-complete','true');
});

test('a second open guide receives changed progress through the storage event',async({context,page})=>{
 await page.goto(tracker);
 const other=await context.newPage();
 await other.goto('/guide/forever-ago-old-bones-achievement');
 const target=other.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox');
 await expect(target).toBeEnabled();
 await page.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox').check();
 await expect(target).toBeChecked();
 await other.close();
});

test('readable storage with failed writes preserves visit progress when following a guide link',async({page})=>{
 await page.addInitScript(key=>{
  const originalSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(name,value){
   if(name===key)throw new DOMException('Storage quota exceeded','QuotaExceededError');
   originalSetItem.call(this,name,value);
  };
 },storageKey);
 await page.goto(tracker);
 const row=page.locator('[data-task-id="rest-forecourt"]');
 await expect(row.getByRole('checkbox')).toBeEnabled();
 await row.getByRole('checkbox').check();
 await expect(page.getByText(/Saving is unavailable in this browser/)).toBeVisible();
 await row.getByRole('link',{name:/Step-by-step guide/}).click();
 await expect(page).toHaveURL(/\/guide\/forever-ago-old-bones-achievement#/);
 await expect(page.locator('[data-task-id="rest-forecourt"]').getByRole('checkbox')).toBeChecked();
 await expect(page.getByText(/Saving is unavailable in this browser/)).toBeVisible();
});
