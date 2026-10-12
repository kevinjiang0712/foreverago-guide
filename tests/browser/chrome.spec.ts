import {test,expect} from '@playwright/test';
import {openChrome} from './chrome-access';

test('desktop menus distribute available space for different item counts',async({page})=>{
 await page.setViewportSize({width:1600,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 for(const count of [4,5,8]){
  await page.goto('/guides');await page.evaluate(()=>document.fonts.ready);
  const nav=page.locator('.site-header nav');
  await nav.evaluate((element,count)=>{
   const original=Array.from(element.children);
   while(element.children.length>count)element.lastElementChild!.remove();
   while(element.children.length<count){const item=original[element.children.length%original.length].cloneNode(true) as HTMLElement;item.querySelector('.site-submenu')?.remove();item.querySelector('a')?.removeAttribute('aria-controls');element.appendChild(item);}
  },count);
  await page.setViewportSize({width:1599,height:900});
  await expect(page.locator('.site-navigation-rail')).toHaveAttribute('data-overflow','false');
  const spacing=await nav.evaluate(element=>{
   const items=Array.from(element.children).map(item=>item.getBoundingClientRect());
   return {gaps:items.slice(1).map((item,i)=>item.left-items[i].right),edge:items[0].left-element.getBoundingClientRect().left};
  });
  expect(Math.max(...spacing.gaps)-Math.min(...spacing.gaps)).toBeLessThan(1);
  expect(Math.min(...spacing.gaps)).toBeGreaterThanOrEqual(12);
  expect(spacing.edge).toBeGreaterThan(4);
 }
 await page.setViewportSize({width:390,height:844});await page.reload();await openChrome(page);
 await expect(page.locator('.site-header nav a[href="/"]')).toHaveCount(0);
 await expect(page.locator('header .site-nav-item').nth(1)).toHaveCSS('margin-top','16px');
});

test('desktop navigation remains singular and category current follows soft navigation and back',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');
 const navigation=page.locator('.site-header nav');
 await expect(navigation).toHaveCount(1);await expect(navigation.locator('[aria-current="page"]')).toHaveCount(0);
 await expect(navigation.locator('a[href="/"]')).toHaveCount(0);
 await expect(page.locator('.site-header-bar>.site-brand')).toHaveAttribute('href','/');
 await openChrome(page);await navigation.locator('a[href="/guides"]').first().click();await expect(page).toHaveURL(/\/guides\/?$/);
 await expect(page.locator('.site-header nav [aria-current="page"]')).toHaveAttribute('href','/guides');
 await page.goBack();await expect(page.locator('.site-header nav [aria-current="page"]')).toHaveCount(0);
 await expect(page.locator('.site-footer')).toHaveCount(1);
});

test('desktop overflow scrolls without collapsing and recovers after mobile resizing',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const header=page.locator('header'),nav=page.locator('.site-header nav');
 await expect(header).toHaveAttribute('data-nav-form','inline');await expect(page.locator('[data-burger]')).toBeHidden();
 const first=nav.locator('.site-nav-link').first();const original=await first.innerHTML();
 await first.evaluate(element=>{element.textContent='An exceptionally long navigation section '.repeat(12);});
 await expect(page.locator('.site-navigation-rail')).toHaveAttribute('data-overflow','true');
 const next=page.getByRole('button',{name:'Main: Next',exact:true});await next.click();
 await expect.poll(()=>nav.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
 await expect(header).toHaveAttribute('data-nav-form','inline');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await first.evaluate((element,html)=>{element.innerHTML=html;},original);
 await page.setViewportSize({width:390,height:844});await expect(header).toHaveAttribute('data-nav-form','burger');
 await page.setViewportSize({width:1440,height:900});await expect(header).toHaveAttribute('data-nav-form','inline');
});

test('desktop submenu escapes the scroll rail and Escape returns focus',async({page})=>{
 await page.setViewportSize({width:1024,height:900});await page.goto('/');
 const entry=page.locator('header .site-nav-item').filter({has:page.locator('.site-submenu')}).first();
 const trigger=entry.locator('.site-nav-link');await trigger.focus();await trigger.press('ArrowDown');
 const submenu=entry.locator('.site-submenu');await expect(submenu).toBeVisible();
 expect(await submenu.evaluate(element=>element.matches(':popover-open'))).toBe(true);
 const child=submenu.locator('a[href]').first();await expect(child).toBeFocused();
 await child.press('Escape');await expect(submenu).toBeHidden();await expect(trigger).toBeFocused();
});

test('mobile drawer contains focus, locks the page, and Escape returns focus',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const trigger=page.getByRole('button',{name:'Open menu',exact:true});await expect(trigger).toBeVisible();
 await expect(page.locator('.site-header nav')).toHaveCount(1);await trigger.click();
 const drawer=page.getByRole('dialog',{name:'Main menu',exact:true});await expect(drawer).toBeVisible();
 await expect(page.locator('[data-shell-background]')).toHaveAttribute('inert','');
 for(let i=0;i<18;i++){await page.keyboard.press('Tab');expect(await drawer.evaluate(element=>element.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
 await expect(page.locator('[data-shell-background]')).not.toHaveAttribute('inert','');
 expect(await page.locator('body').evaluate(element=>element.style.overflow)).not.toBe('hidden');
});

test('mobile wordmark stays on one line and truncates longer game names',async({page})=>{
 await page.setViewportSize({width:1024,height:844});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const desktopFontSize=await page.locator('.site-header-bar>.site-brand .site-wordmark').evaluate(element=>parseFloat(getComputedStyle(element).fontSize));
 for(const width of [280,320,390]){
  await page.setViewportSize({width,height:844});await expect(page.locator('.site-header')).toHaveAttribute('data-nav-form','burger');
  const wordmark=page.locator('.site-header-bar>.site-brand .site-wordmark');
  const styles=await wordmark.evaluate(element=>{const css=getComputedStyle(element);return {fontSize:parseFloat(css.fontSize),height:element.getBoundingClientRect().height,lineHeight:parseFloat(css.lineHeight),overflow:css.overflow,textOverflow:css.textOverflow,whiteSpace:css.whiteSpace};});
  expect(styles.whiteSpace).toBe('nowrap');expect(styles.height).toBeLessThanOrEqual(styles.lineHeight+1);expect(styles.fontSize).toBe(desktopFontSize);
  const bounds=await page.locator('.site-header-bar').evaluate(bar=>{const brand=bar.querySelector<HTMLElement>('.site-brand')!.getBoundingClientRect(),menu=bar.querySelector<HTMLElement>('[data-burger]')!.getBoundingClientRect();return {brandRight:brand.right,menuLeft:menu.left};});
  expect(bounds.brandRight).toBeLessThanOrEqual(bounds.menuLeft);
 }
 await page.setViewportSize({width:320,height:844});
 const wordmark=page.locator('.site-header-bar>.site-brand .site-wordmark');await wordmark.evaluate(element=>{element.textContent='An Exceptionally Long Game Title For Mobile · WIKI';});
 const overflow=await wordmark.evaluate(element=>({clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,textOverflow:getComputedStyle(element).textOverflow,whiteSpace:getComputedStyle(element).whiteSpace}));
 expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);expect(overflow.textOverflow).toBe('ellipsis');expect(overflow.whiteSpace).toBe('nowrap');
});

test('mobile wordmark matches the final navigation size before hydration',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
 const page=await context.newPage();await page.goto('/');
 const sizes=await page.locator('.site-header-bar>.site-brand .site-wordmark').evaluate(element=>{
  const css=getComputedStyle(element);return {actual:parseFloat(css.fontSize),expected:parseFloat(css.getPropertyValue('--fs-body-lg'))};
 });
 expect(sizes.actual).toBe(sizes.expected);
 await context.close();
});

test('mode is a naked glyph and persists with the configured site key',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');
 await openChrome(page);const toggle=page.getByRole('switch');const previous=await page.locator('html').getAttribute('data-mode');await toggle.click();
 const next=previous==='day'?'night':'day';await expect(page.locator('html')).toHaveAttribute('data-mode',next);
 await toggle.hover();expect(await toggle.evaluate(element=>getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
 await page.reload();await openChrome(page);await expect(page.locator('html')).toHaveAttribute('data-mode',next);await expect(page.getByRole('switch')).toHaveAttribute('aria-checked',String(next==='night'));
 expect(await page.evaluate(()=>localStorage.getItem('template-sample-a:mode'))).toBe(next);
});

test('locale picker keyboard navigates to the actual translated home',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');
 await openChrome(page);const trigger=page.getByRole('button',{name:'Language',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');
 await expect(page.getByRole('listbox',{name:'Language',exact:true})).toBeVisible();await page.keyboard.press('End');await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/ja\/?$/);await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await expect(page.locator('.site-header nav [aria-current="page"]')).toHaveCount(0);
 await expect(page.locator('.site-header-bar>.site-brand')).toHaveAttribute('href','/ja');
});

test('locale picker only references its panel while the panel exists',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');
 await openChrome(page);const trigger=page.getByRole('button',{name:'Language',exact:true});
 await expect(trigger).not.toHaveAttribute('aria-controls');
 await trigger.click();const controlledId=await trigger.getAttribute('aria-controls');
 expect(controlledId).toBeTruthy();await expect(page.locator(`#${controlledId}`)).toHaveCount(1);
 await page.keyboard.press('Escape');await expect(trigger).not.toHaveAttribute('aria-controls');
});

test('mobile locale sheet handles nested Escape and focus returns to its trigger',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Open menu',exact:true}).click();
 const trigger=page.getByRole('button',{name:'Language',exact:true});await trigger.click();
 const sheet=page.getByRole('dialog',{name:'Language',exact:true});await expect(sheet).toBeVisible();
 for(let i=0;i<6;i++){await page.keyboard.press('Tab');expect(await sheet.evaluate(element=>element.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(sheet).not.toBeVisible();await expect(trigger).toBeFocused();
 await expect(page.getByRole('dialog',{name:'Main menu',exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Open menu',exact:true})).toBeFocused();
});

test('mobile drawer fills the viewport and language sheet attaches to its bottom',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Open menu',exact:true}).click();
 const drawer=page.getByRole('dialog',{name:'Main menu',exact:true});const rect=await drawer.boundingBox();
 expect(rect).not.toBeNull();expect(rect!.y).toBeCloseTo(0,0);expect(rect!.height).toBeCloseTo(844,0);
 const language=page.getByRole('button',{name:'Language',exact:true});const target=await language.boundingBox();expect(target!.height).toBeGreaterThanOrEqual(44);expect(target!.width).toBeGreaterThanOrEqual(44);await language.click();
 const sheet=page.getByRole('dialog',{name:'Language',exact:true});await expect(sheet).toBeVisible();await expect.poll(async()=>{const box=await sheet.boundingBox();return Math.round(box!.y+box!.height);}).toBe(844);
});

test('selecting a mobile language releases nested locks and updates the complete locale chrome',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('button',{name:'Language',exact:true}).click();
 await page.getByRole('option',{name:'English',exact:true}).click();
 await expect(page.locator('[data-shell-background]')).not.toHaveAttribute('inert','');
 await expect.poll(()=>page.locator('body').evaluate(element=>element.style.overflow)).not.toBe('hidden');
 const menu=page.getByRole('button',{name:'Open menu',exact:true});await expect(menu).toBeEnabled();await menu.click();await page.getByRole('button',{name:'Language',exact:true}).click();
 await page.getByRole('option',{name:'日本語',exact:true}).click();await expect(page).toHaveURL(/\/ja\/?$/);
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await expect(page.locator('[data-shell-background]')).not.toHaveAttribute('inert','');
 await expect.poll(()=>page.locator('body').evaluate(element=>element.style.overflow)).not.toBe('hidden');
 await expect(page.locator('[data-burger]')).toHaveAccessibleName('メニューを開く');
 await page.locator('[data-burger]').click();await expect(page.locator('.site-header nav')).toHaveAccessibleName('メイン');await expect(page.locator('.site-header nav [aria-current="page"]')).toHaveCount(0);
 await expect(page.locator('.site-header-bar>.site-brand')).toHaveAttribute('href','/ja');
 await expect(page.locator('.site-picker-trigger')).toHaveText('JA');await expect(page.locator('.site-picker-trigger')).toHaveAccessibleName('言語');
 await page.locator('.site-picker-trigger').click();await expect(page.getByRole('option',{name:'English',exact:true})).toHaveAttribute('href','/');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.goBack();await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('button',{name:'Open menu',exact:true})).toBeVisible();
});

test('Escape on a mobile navigation link dismisses the drawer in one press',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Open menu',exact:true}).click();
 await page.locator('.site-header nav a[href="/guides"]').first().focus();await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Main menu',exact:true})).not.toBeVisible();await expect(page.getByRole('button',{name:'Open menu',exact:true})).toBeFocused();
});

test('night switch keeps a stable accessible name while checked state changes',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');
 await openChrome(page);const toggle=page.getByRole('switch');await expect(toggle).toHaveAccessibleName('Appearance: Night');const before=await toggle.getAttribute('aria-checked');await toggle.click();
 await expect(toggle).toHaveAccessibleName('Appearance: Night');await expect(toggle).toHaveAttribute('aria-checked',before==='true'?'false':'true');
});
