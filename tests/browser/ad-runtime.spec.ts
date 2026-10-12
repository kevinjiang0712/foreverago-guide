import {devices,expect,test} from '@playwright/test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
let documentSource='';
test.beforeAll(async()=>{
 const output=await build({entryPoints:['tests/fixtures/ad-runtime.tsx'],bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'test-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'test-router',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import {useSyncExternalStore} from 'react';const subscribe=fn=>{addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)};export function usePathname(){return useSyncExternalStore(subscribe,()=>location.pathname,()=>location.pathname)}`,loader:'js',resolveDir:process.cwd()}));}}]});
 const css=await readFile('src/components/ads/ad-placeholder.css','utf8');
 documentSource=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;--s-7:32px;--s-2:8px;--s-6:24px;--s-1:4px;--font-ui:Arial,sans-serif;--text-caption:#666}${css}</style></head><body><div id="root"></div><script>${output.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
});
async function fixture(page:import('@playwright/test').Page){await page.route('**/__ad_runtime_fixture*',route=>route.fulfill({contentType:'text/html',body:documentSource}));}
const creative=`
(()=>{
const script=document.currentScript;
if(script.src.endsWith('/native.js')){
 document.getElementById('container-mock-native')?.insertAdjacentHTML('beforeend','<img alt="mock creative" width="160" height="540" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">');
}else{
 const options=window.atOptions;
 const frame=document.createElement('iframe');frame.title='Mock banner creative';frame.width=options.width;frame.height=options.height;frame.dataset.key=options.key;
 script.parentElement?.append(frame);frame.contentDocument.body.innerHTML='<div style="background:#ddd;width:100%;height:100%">Mock visible creative</div>';
}
})();`;

test('isolates banner options and allows a late Native without blocking other slots',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});
 let release:()=>void=()=>{};const delayed=new Promise<void>(r=>{release=r;});const requests:string[]=[];
 await page.route('https://ad-fixture.invalid/**',async route=>{const name=new URL(route.request().url()).pathname;requests.push(name);if(name==='/native.js')await delayed;await route.fulfill({contentType:'text/javascript',body:creative});});
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','creative-dom');
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ad-status','waiting');
 await expect(page.locator('iframe[srcdoc]')).toHaveCount(0);
 await expect(page.locator('.revenue-close')).toHaveCount(0);
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveCSS('height','0px');
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveCSS('margin-top','0px');
 await expect(page.locator('[data-revenue-slot="native"] .revenue-ad-label')).toBeHidden();
 const options=await Promise.all(['left','right'].map(async slot=>page.locator(`[data-revenue-slot="${slot}"] .revenue-ad-canvas > iframe`).evaluate(frame=>({key:(frame as HTMLElement).dataset.key,height:Number(frame.getAttribute('height'))}))));
 expect(options.map(o=>o.key)).toEqual(['mock-left','mock-right']);expect(options.map(o=>o.height)).toEqual([300,600]);
 const scripts=page.locator('.revenue-ad-canvas > script');await expect(scripts).toHaveCount(3);
 expect(await scripts.evaluateAll(nodes=>nodes.every(node=>node.ownerDocument===document))).toBe(true);
 release();await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ad-status','creative-dom');
 await expect.poll(async()=> (await page.locator('[data-revenue-slot="native"] .revenue-ad-canvas').boundingBox())!.height).toBeGreaterThanOrEqual(540);
 await page.getByRole('button',{name:'Rerender 0'}).click();await expect(page.getByRole('button',{name:'Rerender 1'})).toBeVisible();
 expect(requests.filter(r=>r==='/left.js')).toHaveLength(1);expect(requests.filter(r=>r==='/native.js')).toHaveLength(1);
 expect(requests).not.toContain('/inline.js');expect(requests).not.toContain('/anchor.js');
 await page.getByRole('button',{name:'Next page'}).click();
 await expect(page).toHaveURL(/second-fixture/);
 await expect.poll(()=>requests.filter(r=>r==='/native.js').length).toBe(2);
 expect(requests.filter(r=>r==='/left.js')).toHaveLength(1);expect(requests.filter(r=>r==='/right.js')).toHaveLength(1);
});

test('keeps slow Banner options through unmount and loads Native independently',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});
 let release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});const requests:string[]=[];
 await page.route('https://ad-fixture.invalid/**',async route=>{
  const name=new URL(route.request().url()).pathname;requests.push(name);
  if(name==='/left.js')await delayed;
  await route.fulfill({contentType:'text/javascript',body:`window.bannerExecutions??=[];if(!document.currentScript.src.endsWith('/native.js'))window.bannerExecutions.push({src:document.currentScript.src,key:window.atOptions.key});${creative}`});
 });
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ad-status','creative-dom');
 expect(requests).toContain('/left.js');expect(requests).not.toContain('/right.js');
 await page.setViewportSize({width:1280,height:1000});
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveCount(0);
 expect(requests).not.toContain('/right.js');
 release();await expect.poll(async()=>page.evaluate(()=> (window as typeof window&{bannerExecutions?:{key:string}[]}).bannerExecutions?.length??0)).toBe(1);
 await page.setViewportSize({width:1920,height:1000});
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','creative-dom');
 expect(await page.evaluate(()=> (window as typeof window&{bannerExecutions:{key:string}[]}).bannerExecutions.map(entry=>entry.key))).toEqual(['mock-left','mock-left','mock-right']);
});

test('retries explicit load errors finitely while other slots continue',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});let failed=0;
 await page.route('https://ad-fixture.invalid/**',async route=>{if(route.request().url().endsWith('/left.js')){failed++;await route.abort('failed');}else await route.fulfill({contentType:'text/javascript',body:creative});});
 await page.goto('/__ad_runtime_fixture');await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','creative-dom');
 await expect.poll(()=>failed,{timeout:12000}).toBe(3);
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveAttribute('data-ad-status','script-error');
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveCSS('height','0px');
 await page.getByRole('button',{name:'Rerender 0'}).click();expect(failed).toBe(3);
});

test('prevents a late Native response from filling the next page container',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});
 let release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});let nativeRequests=0;
 await page.route('https://ad-fixture.invalid/**',async route=>{
  if(route.request().url().endsWith('/native.js')&&++nativeRequests===1)await delayed;
  await route.fulfill({contentType:'text/javascript',body:creative});
 });
 await page.goto('/__ad_runtime_fixture');await expect.poll(()=>nativeRequests).toBe(1);
 await page.getByRole('button',{name:'Next page'}).click();await expect(page).toHaveURL(/second-fixture/);
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#container-mock-native')).toHaveCount(0);
 expect(nativeRequests).toBe(1);
 release();await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ad-status','creative-dom');
 expect(nativeRequests).toBe(2);await expect(page.locator('#container-mock-native img')).toHaveCount(1);
});

for(const query of ['preview','wrong-host'])test(`${query} never requests production ads`,async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});const requests:string[]=[];
 await page.route('https://ad-fixture.invalid/**',async route=>{requests.push(route.request().url());await route.abort();});
 await page.goto(`/__ad_runtime_fixture?${query}`);await page.getByRole('button',{name:'Rerender 0'}).click();
 await expect(page.getByRole('button',{name:'Rerender 1'})).toBeVisible();
 expect(requests).toEqual([]);await expect(page.locator('iframe')).toHaveCount(0);
});
test.describe('mobile device',()=>{
 const device=devices['iPhone 13'];
 test.use({viewport:device.viewport,userAgent:device.userAgent,deviceScaleFactor:device.deviceScaleFactor,isMobile:true,hasTouch:true});
 test('an approved rectangle works when Native is still missing',async({page})=>{
  await fixture(page);await page.route('https://ad-fixture.invalid/**',route=>route.fulfill({contentType:'text/javascript',body:creative}));
  await page.goto('/__ad_runtime_fixture?no-native');await expect(page.locator('[data-revenue-slot="native"]')).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,1800));await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-ad-status','creative-dom');
 });
 test('requests only mobile slots, waits for near viewport and keeps the anchor across navigation',async({page})=>{
  await fixture(page);const requests:string[]=[];
  await page.route('https://ad-fixture.invalid/**',async route=>{requests.push(new URL(route.request().url()).pathname);await route.fulfill({contentType:'text/javascript',body:creative});});
  await page.goto('/__ad_runtime_fixture');
  await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ad-status','creative-dom');
  expect(requests).not.toContain('/left.js');expect(requests).not.toContain('/right.js');expect(requests).not.toContain('/inline.js');
  await page.evaluate(()=>scrollTo(0,2000));
  await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-ad-status','creative-dom');
  const size=await page.locator('[data-revenue-slot="inline"] iframe').boundingBox();expect(size?.width).toBe(300);expect(size?.height).toBe(250);
  await page.setViewportSize({width:320,height:844});
  const creativeBox=await page.locator('[data-revenue-slot="anchor"] iframe').boundingBox();
  expect(creativeBox!.width).toBe(320);expect(creativeBox!.height).toBe(50);expect(creativeBox!.y).toBe(0);
  await expect(page.locator('.revenue-close')).toHaveCount(0);
  await expect.poll(()=>page.locator('[data-site-shell]').evaluate(node=>getComputedStyle(node).getPropertyValue('--mobile-sticky-ad-height').trim())).toBe('calc(50px + 0px)');
  await page.getByRole('button',{name:'Next page'}).click();
  await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
  expect(requests.filter(url=>url==='/anchor.js')).toHaveLength(1);
 });
});


test('loaded scripts without a visible creative keep every slot collapsed',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});
 await page.route('https://ad-fixture.invalid/**',route=>route.fulfill({contentType:'text/javascript',body:`document.currentScript.parentElement.insertAdjacentHTML('beforeend','<img width="1" height="1" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><a href="#" style="display:none">Hidden creative</a><iframe width="320" height="50"></iframe><a href="#" style="display:block;width:320px;height:50px"></a><div style="opacity:0"><a href="#" style="display:block;width:320px;height:50px">Transparent creative</a></div><video width="320" height="50"></video>');`}));
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','script-loaded');
 const collapsed=async()=>{
  const boxes=await page.locator('[data-revenue-slot]').evaluateAll(nodes=>nodes.map(node=>({height:node.getBoundingClientRect().height,expanded:node.getAttribute('data-expanded'),margin:getComputedStyle(node).margin})));
  expect(boxes.length).toBeGreaterThan(0);for(const box of boxes){expect(box).toEqual({height:0,expanded:'false',margin:'0px'});}
 };
 await collapsed();
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ad-status','script-loaded');
 await page.evaluate(()=>scrollTo(0,1800));
 await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-ad-status','script-loaded');
 await collapsed();await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','0px');
 await expect(page.locator('[data-site-shell]')).toHaveCSS('--mobile-sticky-ad-height','0px');
});

test('mobile navigation space follows a late creative and collapses when it disappears',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});
 let release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});
 await page.route('https://ad-fixture.invalid/**',async route=>{if(route.request().url().endsWith('/anchor.js'))await delayed;await route.fulfill({contentType:'text/javascript',body:creative});});
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ready','true');
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','0px');
 await expect(page.locator('[data-site-shell]')).toHaveCSS('--mobile-sticky-ad-height','0px');
 release();await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','50px');
 await expect(page.locator('[data-site-shell]')).toHaveCSS('--mobile-sticky-ad-height','calc(50px + 0px)');
 await expect(page.locator('[data-revenue-slot="native"] .revenue-ad-label')).toHaveCSS('font-size','10px');
 await expect(page.locator('[data-revenue-slot="native"] .revenue-ad-label')).toHaveCSS('opacity','0.5');
 await page.locator('[data-revenue-slot="anchor"] iframe').evaluate(frame=>frame.remove());
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','0px');
 await expect(page.locator('[data-site-shell]')).toHaveCSS('--mobile-sticky-ad-height','0px');
 await page.locator('[data-revenue-slot="native"] img').evaluate(image=>image.remove());
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveCSS('height','0px');
});


test('same-origin frame stays collapsed until its document receives visible content',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});
 await page.route('https://ad-fixture.invalid/**',route=>route.fulfill({contentType:'text/javascript',body:`if(document.currentScript.src.endsWith('/anchor.js')){const frame=document.createElement('iframe');frame.width=320;frame.height=50;document.currentScript.parentElement.append(frame);}`}));
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ad-status','script-loaded');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCSS('height','0px');
 await page.locator('[data-revenue-slot="anchor"] iframe').evaluate(frame=>{const document=(frame as HTMLIFrameElement).contentDocument!;document.body.append(document.createTextNode(''));});
 await page.locator('[data-revenue-slot="anchor"] iframe').evaluate(frame=>{(frame as HTMLIFrameElement).contentDocument!.body.firstChild!.textContent='Loaded advertisement';});
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCSS('height','50px');
 await page.locator('[data-revenue-slot="anchor"] iframe').evaluate(frame=>{(frame as HTMLIFrameElement).contentDocument!.body.innerHTML='<div style="opacity:0;width:320px;height:50px">Hidden ad</div>';});
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCSS('height','0px');
});


test('a supplier cross-origin frame waits for its load event before expanding',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});
 let release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});
 await page.route('https://ad-fixture.invalid/**',async route=>{
  if(route.request().url().endsWith('/creative.html')){await delayed;await route.fulfill({contentType:'text/html',body:'<div style="width:320px;height:50px">Supplier creative</div>'});}
  else await route.fulfill({contentType:'text/javascript',body:`if(document.currentScript.src.endsWith('/anchor.js')){const frame=document.createElement('iframe');frame.width=320;frame.height=50;frame.src='https://ad-fixture.invalid/creative.html';document.currentScript.parentElement.append(frame);}`});
 });
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ad-status','script-loaded');
 await expect(page.locator('[data-revenue-slot="anchor"] iframe')).toHaveCount(1);
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','0px');
 release();await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','50px');
});


test('changing a loaded supplier frame source collapses it until the new load completes',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});
 let release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});
 await page.route('https://ad-fixture.invalid/**',async route=>{
  const url=route.request().url();
  if(url.endsWith('/two.html')){await delayed;await route.fulfill({contentType:'text/html',body:'Second creative'});}
  else if(url.endsWith('/one.html'))await route.fulfill({contentType:'text/html',body:'First creative'});
  else await route.fulfill({contentType:'text/javascript',body:`if(document.currentScript.src.endsWith('/anchor.js')){const frame=document.createElement('iframe');frame.width=320;frame.height=50;frame.src='https://ad-fixture.invalid/one.html';document.currentScript.parentElement.append(frame);}`});
 });
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
 await page.locator('[data-revenue-slot="anchor"] iframe').evaluate(frame=>{(frame as HTMLIFrameElement).src='https://ad-fixture.invalid/two.html';});
 await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','0px');
 await expect(page.locator('[data-site-shell]')).toHaveCSS('--mobile-sticky-ad-height','0px');
 release();await expect(page.locator('.revenue-rail--anchor')).toHaveCSS('height','50px');
});


for(const grid of ['list-grid','catalog-cards'])test(`collapsed ads do not create an extra ${grid} row or gap`,async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});
 await page.route('https://ad-fixture.invalid/**',route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.goto('/__ad_runtime_fixture');
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-ad-status','script-loaded');
 const heights=await page.locator('main').evaluate((main,grid)=>{
  main.classList.add(grid);Object.assign((main as HTMLElement).style,{display:'grid',gridTemplateColumns:'1fr',gap:'24px'});
  const before=main.getBoundingClientRect().height;
  main.querySelectorAll('[data-revenue-slot]').forEach(ad=>ad.remove());
  return {before,withoutAds:main.getBoundingClientRect().height};
 },grid);
 expect(heights.before).toBe(heights.withoutAds);
});


for(const grid of ['list-grid','catalog-cards'])test(`${grid} keeps mobile Native and inline loading at their insertion points`,async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});const requests:string[]=[];
 await page.route('https://ad-fixture.invalid/**',route=>{requests.push(new URL(route.request().url()).pathname);return route.fulfill({contentType:'text/javascript',body:creative});});
 await page.goto(`/__ad_runtime_fixture?grid=${grid}`);
 await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-expanded','true');
 expect(requests).not.toContain('/native.js');expect(requests).not.toContain('/inline.js');
 await page.evaluate(()=>scrollTo(0,1000));
 await expect(page.locator('[data-revenue-slot="native"]')).toHaveAttribute('data-expanded','true');
 expect(requests).not.toContain('/inline.js');
 await page.evaluate(()=>scrollTo(0,3300));
 await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-expanded','true');
 const separation=await page.evaluate(()=>document.querySelector('[data-revenue-slot="inline"]')!.getBoundingClientRect().top-document.querySelector('[data-revenue-slot="native"]')!.getBoundingClientRect().bottom);
 expect(separation).toBeGreaterThanOrEqual(844*1.5);
});
