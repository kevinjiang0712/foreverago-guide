import {expect,test} from '@playwright/test';

for(const path of ['/about','/contact','/privacy','/terms'])test(`${path} uses the standard article layout without advertising`,async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(path);
 await expect(page.locator('[data-template="article-page"]')).toBeVisible();
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('[data-site-shell]')).toHaveAttribute('data-ad-mode','disabled');
 await expect(page.locator('[data-ad-placement],.floating-ad-rail')).toHaveCount(0);
 await expect(page.locator('[data-article-body]')).toContainText('Template Sample A');
 await expect(page.locator('.site-footer-column').filter({hasText:'About & Policies'}).locator('a')).toHaveCount(4);
});

test('not-found pages do not expose advertising',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const response=await page.goto('/missing-page-for-ad-coverage');
 expect(response?.status()).toBe(404);
 await expect(page.locator('[data-site-shell]')).toHaveAttribute('data-ad-mode','disabled');
 await expect(page.locator('[data-ad-placement],.floating-ad-rail')).toHaveCount(0);
 await expect(page.locator('.site-header')).toHaveCSS('top','0px');
 await expect(page.locator('.site-header-spacer')).toHaveCSS('height','60px');
});

test('community footer keeps four stable destinations and only configured URLs are links',async({page})=>{
 await page.goto('/');
 const community=page.locator('.site-footer-column').filter({hasText:'Community'});
 await expect(community.locator('.site-footer-links>*')).toHaveCount(4);
 await expect(community).toContainText('Official site');
 await expect(community).toContainText('Steam');
 await expect(community).toContainText('Discord');
 await expect(community).toContainText('YouTube');
 await expect(community.locator('a')).toHaveCount(0);
 await expect(community.locator('.site-footer-placeholder')).toHaveCount(4);
 await expect(community.locator('small')).toHaveCount(0);
 await expect(community.locator('.site-footer-entry')).toHaveCount(4);
});

test('policy footer remains responsive with four columns',async({page})=>{
 for(const width of [390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/privacy');
  const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
 }
});

test('desktop footer keeps a dominant brand panel and four aligned link columns',async({page})=>{
 for(const width of [1024,1276,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  const layout=await page.locator('.site-footer-grid').evaluate(element=>{
   const brand=element.querySelector<HTMLElement>('.site-footer-brand')!.getBoundingClientRect();
   const columns=[...element.querySelectorAll<HTMLElement>('.site-footer-column')].map(column=>column.getBoundingClientRect());
   const legal=element.querySelector<HTMLElement>('.site-footer-disclaimer')!.getBoundingClientRect();
   return {brandTop:brand.top,brandWidth:brand.width,columnWidths:columns.map(column=>column.width),columnTops:columns.map(column=>column.top),legalBottom:legal.bottom,brandBottom:brand.bottom};
  });
  expect(layout.columnWidths).toHaveLength(4);
  expect(layout.brandWidth).toBeGreaterThan(Math.max(...layout.columnWidths)*2);
  expect(Math.max(...layout.columnTops)-Math.min(...layout.columnTops)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.brandTop-layout.columnTops[0])).toBeLessThanOrEqual(1);
  expect(layout.brandBottom-layout.legalBottom).toBeLessThanOrEqual(1);
 }
});
