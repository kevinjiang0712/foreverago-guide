import {devices,expect,test} from '@playwright/test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
let documentSource='';
test.beforeAll(async()=>{
 const output=await build({entryPoints:['tests/fixtures/ad-runtime.tsx'],bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'test-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'test-router',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import {useSyncExternalStore} from 'react';const subscribe=fn=>{addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)};export function usePathname(){return useSyncExternalStore(subscribe,()=>location.pathname,()=>location.pathname)}`,loader:'js',resolveDir:process.cwd()}));}}]});
 const css=await readFile('src/components/ads/ad-placeholder.css','utf8');
 documentSource=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;--s-7:32px;--s-2:8px;--s-6:24px;--s-1:4px}${css}</style></head><body><div id="root"></div><script>${output.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
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
 script.parentElement?.append(frame);
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
 await page.getByRole('button',{name:'Close left advertisement'}).click();
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveCount(0);
 expect(requests).not.toContain('/right.js');
 release();await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','creative-dom');
 expect(await page.evaluate(()=> (window as typeof window&{bannerExecutions:{key:string}[]}).bannerExecutions.map(entry=>entry.key))).toEqual(['mock-left','mock-right']);
});

test('retries explicit load errors finitely while other slots continue',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1920,height:1000});let failed=0;
 await page.route('https://ad-fixture.invalid/**',async route=>{if(route.request().url().endsWith('/left.js')){failed++;await route.abort('failed');}else await route.fulfill({contentType:'text/javascript',body:creative});});
 await page.goto('/__ad_runtime_fixture');await expect(page.locator('[data-revenue-slot="right"]')).toHaveAttribute('data-ad-status','creative-dom');
 await expect.poll(()=>failed,{timeout:12000}).toBe(3);
 await expect(page.locator('[data-revenue-slot="left"]')).toHaveAttribute('data-ad-status','script-error');
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
 test('requests only mobile slots, waits for near viewport and keeps close separate',async({page})=>{
  await fixture(page);const requests:string[]=[];
  await page.route('https://ad-fixture.invalid/**',async route=>{requests.push(new URL(route.request().url()).pathname);await route.fulfill({contentType:'text/javascript',body:creative});});
  await page.goto('/__ad_runtime_fixture');
  await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveAttribute('data-ad-status','creative-dom');
  expect(requests).not.toContain('/left.js');expect(requests).not.toContain('/right.js');expect(requests).not.toContain('/inline.js');
  await page.evaluate(()=>scrollTo(0,2000));
  await expect(page.locator('[data-revenue-slot="inline"]')).toHaveAttribute('data-ad-status','creative-dom');
  const size=await page.locator('[data-revenue-slot="inline"] iframe').boundingBox();expect(size?.width).toBe(300);expect(size?.height).toBe(250);
  await page.setViewportSize({width:320,height:844});
  const creativeBox=await page.locator('[data-revenue-slot="anchor"] iframe').boundingBox();const closeBox=await page.getByRole('button',{name:'Close anchor advertisement'}).boundingBox();
  expect(closeBox!.y+closeBox!.height).toBeLessThanOrEqual(creativeBox!.y);
  await page.getByRole('button',{name:'Close anchor advertisement'}).click();
  await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Next page'}).click();
  await expect(page.locator('[data-revenue-slot="anchor"]')).toHaveCount(0);
 });
});
