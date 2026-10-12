import {test,expect} from '@playwright/test';
import {openChrome} from './chrome-access';
import {inspectTextContrast} from '../../scripts/matrix-page';

for(const path of ['/guides','/weapons','/bosses','/characters','/builds','/mods','/ja/guides','/ja/weapons','/ja/bosses','/ja/characters','/ja/builds','/ja/mods'])test(`${path} exposes all 24 results within the 30-item page size`,async({page})=>{
 await page.goto(path);const prefix=/\/(builds|mods)$/.test(path)?'catalog':'list';await expect(page.getByRole('status')).toContainText('24');await expect(page.locator(`.${prefix}-card`)).toHaveCount(24);
 await expect(page.locator(`.${prefix}-pagination`)).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('list search and groups combine, reset, and preserve detail URLs',async({page})=>{
 await page.goto('/guides');
 await expect(page.locator('[data-template=list-page]')).toHaveCount(1);
 await expect(page.getByRole('status')).toContainText('24');await expect(page.locator('.list-card')).toHaveCount(24);
 await expect(page.locator('.list-pagination')).toHaveCount(0);await expect(page.locator('.list-card .media-slot')).not.toHaveCount(0);
 await page.getByRole('button',{name:'Articles',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(20);
 await page.getByRole('searchbox').fill('Reading the reference');await expect(page.locator('.list-card')).toHaveCount(1);
 await expect(page.locator('.list-card')).toHaveAttribute('href','/guides/reference-notes');
 await expect(page.locator('.list-card-action').first()).toHaveClass(/button-ghost/);await expect(page.locator('.list-card-action.button-primary')).toHaveCount(0);
 await page.getByRole('button',{name:'Tools',exact:true}).click();await expect(page.locator('.list-card')).toHaveCount(0);
 await expect(page.locator('.list-no-results')).toBeVisible();await expect(page.getByRole('status')).toContainText('0');
 await page.locator('.list-no-results button').click();await expect(page.locator('.list-card')).toHaveCount(24);
 await expect(page.getByRole('searchbox')).toHaveValue('');
 await page.getByRole('searchbox').fill('interactive map');await expect(page.locator('.list-card')).toHaveCount(1);
 await expect(page.locator('.list-card')).toHaveAttribute('href','/guides/interactive-map');await expect(page.locator('.list-card-action')).toHaveClass(/button-ghost/);await page.locator('.list-card-action').click();await expect(page).toHaveURL(/guides\/interactive-map$/);
});

test('Japanese list has localized groups and destination links',async({page})=>{
 await page.goto('/ja/guides');await page.getByRole('button',{name:'記事',exact:true}).click();
 await expect(page.locator('.list-card')).toHaveCount(20);
 await expect(page.locator('.list-card').first()).toHaveAttribute('href','/ja/guides/hajime');
 await page.getByRole('searchbox').fill('　');await expect(page.locator('.list-card')).toHaveCount(20);
});

test('desktop list uses five columns and cards reveal on scroll',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/guides');
 const firstRow=page.locator('.list-card-reveal').first();await expect(firstRow).toBeVisible();
 const firstFive=await page.locator('.list-card-reveal').evaluateAll(elements=>elements.slice(0,5).map(element=>Math.round(element.getBoundingClientRect().top)));
 expect(new Set(firstFive).size).toBe(1);
 const last=page.locator('.list-card-reveal').nth(23);await last.scrollIntoViewIfNeeded();
 await expect.poll(()=>last.evaluate(element=>Number(getComputedStyle(element).opacity))).toBeGreaterThan(.98);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('reduced motion keeps list cards fully visible without reveal animation',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/guides');
 const styles=await page.locator('.list-card-reveal').nth(20).evaluate(element=>{const css=getComputedStyle(element);return {animationName:css.animationName,opacity:css.opacity,transform:css.transform};});
 expect(styles).toEqual({animationName:'none',opacity:'1',transform:'none'});
});

test('Weapons cards use the fixed compact layout without secondary actions',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const {width,height} of [{width:390,height:300},{width:834,height:260},{width:1240,height:224},{width:1440,height:224},{width:1600,height:224}]){
  await page.setViewportSize({width,height:900});await page.goto('/weapons');await page.evaluate(()=>document.fonts.ready);
  const browser=page.locator('.list-browser');await expect(browser).toHaveAttribute('data-card-layout','compact');
  await expect(browser.locator('.list-card')).toHaveCount(24);await expect(browser.locator('.list-card-body>p')).toHaveCount(0);
  expect(await browser.locator('.list-card').first().evaluate(card=>card.tagName)).toBe('A');await expect(browser.locator('.list-card').first()).toHaveAttribute('href',/\/weapons\//);
  await expect(browser.locator('.list-card-action')).toHaveCount(0);await expect(browser.locator('.list-card .ui-arrow-right')).toHaveCount(0);
  const cardHeights=await browser.locator('.list-card').evaluateAll(cards=>cards.map(card=>Math.round(card.getBoundingClientRect().height)));
  expect(new Set(cardHeights)).toEqual(new Set([height]));
  const titleStyles=await browser.locator('.list-card h3').evaluateAll(titles=>titles.map(title=>{const css=getComputedStyle(title);return {whiteSpace:css.whiteSpace,overflow:css.overflow,textOverflow:css.textOverflow,height:title.getBoundingClientRect().height,lineHeight:parseFloat(css.lineHeight)};}));
  expect(titleStyles.every(title=>title.whiteSpace==='nowrap'&&title.overflow==='hidden'&&title.textOverflow==='ellipsis'&&title.height<=title.lineHeight+1)).toBe(true);
  const media=browser.locator('.list-card .media-slot');expect(await media.count()).toBeGreaterThan(0);expect((await media.first().boundingBox())!.height).toBeGreaterThan(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:1440,height:900});await page.goto('/guides');
 await expect(page.locator('.list-browser')).toHaveAttribute('data-card-layout','default');
 await expect(page.locator('.list-card-body>p').first()).toBeVisible();await expect(page.locator('.list-card-action').first()).toBeVisible();
});

for(const width of [390,520,1240])test(`compact list hero and cards work in both modes at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/guides');await page.evaluate(()=>document.fonts.ready);
 const hero=page.locator('.list-hero');await expect(hero).toHaveAttribute('data-theme-mode','night');
 await expect(hero.locator('h1')).toHaveText('Guides');await expect(hero.locator('.article-quick-answer')).toHaveCount(0);
 const box=await hero.boundingBox();expect(box!.height).toBeLessThan(350);
 expect(await hero.locator('img').evaluate(node=>node instanceof HTMLImageElement&&node.complete&&node.naturalWidth>0)).toBe(true);
 const styles=()=>hero.evaluate(element=>[element,...element.querySelectorAll('*')].map(node=>{const css=getComputedStyle(node);return [css.color,css.backgroundColor,css.backgroundImage,css.opacity];}));
 const night=await styles();
 for(const mode of ['night','day']){
  if(mode==='day'){await openChrome(page);await page.getByRole('switch').click();if(await page.locator('[data-burger]').getAttribute('aria-expanded')==='true')await page.keyboard.press('Escape');}
  await expect(page.locator('html')).toHaveAttribute('data-mode',mode);expect(await styles()).toEqual(night);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const ratios=await inspectTextContrast(page,'.list-hero-copy p,.list-card-meta span,.list-card-body>p,.list-card-action');
  expect(ratios.filter(item=>item.ratio<4.5)).toEqual([]);
 }
 const card=await page.locator('.list-card').first().boundingBox();
 if(width===1240)expect(card!.width).toBeLessThan(450);else expect(card!.width).toBeGreaterThan(width*.8);
});
