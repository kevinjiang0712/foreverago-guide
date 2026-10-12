import {expect,test,type Page} from '@playwright/test';

// Advertising geometry is independent of the demo theme's external font CDN.
test.beforeEach(async({page})=>{await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));});

async function openPage(page:Page,path:string){
 await page.goto(path,{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-fixed-ads]')).toHaveCount(1);
}


for(const path of ['/','/builds','/guides/first-steps','/arsenal','/guides/interactive-map'])test(`one early Native and no footer Native: ${path}`,async({page})=>{
 await page.setViewportSize({width:1920,height:1000});await openPage(page,path);
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveCount(1);
 await expect(page.locator('[data-ad-placement="a3"]')).toHaveCount(0);
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveCount(1);
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveCount(1);
 await expect(page.locator('[data-revenue-slot="inline"]:visible')).toHaveCount(0);
});

for(const width of [1280,1440,1680,1920])test(`preserves original body and outer rail clearance at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await openPage(page,'/characters');
 const wide=width>=1640;
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveCount(wide?1:0);
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveCount(wide?1:0);
 const geometry=await page.evaluate(()=>{const main=document.querySelector('main')!.getBoundingClientRect();const rails=[...document.querySelectorAll('.revenue-rail')].map(e=>e.getBoundingClientRect());return{width:main.width,center:main.left+main.width/2,gaps:rails.map(r=>r.left<main.left?main.left-r.right:r.left-main.right)};});
 expect(geometry.width).toBe(1240);expect(geometry.center).toBe(width/2);geometry.gaps.forEach(gap=>expect(gap).toBeGreaterThanOrEqual(24));
});

test('Native is between complete article sections and outside lists/tables',async({page})=>{
 await openPage(page,'/guides/first-steps');
 const native=page.locator('[data-revenue-slot="native"]');await expect(native).toHaveCount(1);
 expect(await native.evaluate(e=>Boolean(e.closest('table,ol,ul')))).toBe(false);
 const order=await page.locator('[data-article-body] h2,[data-article-body] [data-revenue-slot="native"]').evaluateAll(nodes=>nodes.map(e=>e.tagName));
 expect(order.slice(0,3)).toEqual(['H2','ASIDE','H2']);
});

test('mobile banner reserves navigation space and stays closed across client navigation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openPage(page,'/');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toBeVisible();
 await expect(page.locator('.site-header')).toHaveCSS('top','50px');
 await page.getByRole('button',{name:'Close anchor advertisement',exact:true}).click();
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCount(0);
 await expect(page.locator('.site-header')).toHaveCSS('top','0px');
 await page.locator('main a[href="/guides/first-steps"]:visible').first().click();
 await expect(page).toHaveURL(/first-steps/);await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCount(0);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCount(0);
});

test('short viewports, tools and policy pages do not get obstructive floating ads',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/arsenal','/guides/interactive-map','/about','/privacy','/missing-route']){
  await openPage(page,path);await expect(page.locator('.revenue-rail')).toHaveCount(0);
  if(path==='/about'||path==='/privacy'||path==='/missing-route')await expect(page.locator('[data-revenue-slot]')).toHaveCount(0);
 }
 await page.setViewportSize({width:1920,height:600});await openPage(page,'/');await expect(page.locator('[data-revenue-slot="right"]')).toHaveCount(0);
});

test('mobile rectangle keeps real size and sufficient content gap',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openPage(page,'/guides/first-steps');
 const boxes=await page.locator('[data-revenue-slot="inline"]:visible').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),n=document.querySelector('[data-revenue-slot="native"]')!.getBoundingClientRect();const c=node.querySelector('.ad-placeholder-canvas')!.getBoundingClientRect();return{width:c.width,height:c.height,gap:r.top-n.bottom};}));
 boxes.forEach(box=>{expect(box.width).toBe(300);expect(box.height).toBe(250);expect(box.gap).toBeGreaterThanOrEqual(844*1.5);});
 await page.setViewportSize({width:320,height:844});await openPage(page,'/guides/first-steps');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});


test('fixed rail DOM survives actual Next navigation without rebuilding the content shell',async({page})=>{
 await page.setViewportSize({width:1920,height:1000});await openPage(page,'/');
 await expect(page.locator('[data-revenue-slot="left"]')).toBeVisible();
 const original=await page.locator('[data-revenue-slot="left"]').elementHandle();
 await page.locator('main a[href="/guides/first-steps"]:visible').first().click();
 await expect(page).toHaveURL(/first-steps/);
 expect(await original!.evaluate(node=>node===document.querySelector('[data-revenue-slot="left"]'))).toBe(true);
 await openPage(page,'/privacy');await expect(page.locator('[data-revenue-slot]')).toHaveCount(0);
});
