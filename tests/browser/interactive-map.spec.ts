import {expect,test,type Page} from '@playwright/test';
import {openChrome} from './chrome-access';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const mapPath='/guides/interactive-map';
async function openMap(page:Page){await page.goto(mapPath);await expect(page.locator('[data-found="north-token"]')).toBeEnabled();}
for(const width of [390,1240])for(const prefix of ['', '/ja'])test(`map omits source displays but preserves body and navigation at ${width}: ${prefix}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 expect((await page.goto(`${prefix}${mapPath}`))?.status()).toBe(200);
 await expect(page.locator('#sources,a[href="#sources"],.map-sources,.map-source-references')).toHaveCount(0);
 await expect(page.locator('#how-to [data-template-body]')).not.toBeEmpty();
 await expect(page.locator('[data-found="north-token"]')).toBeEnabled();
 for(const id of await page.locator('.anchor-rail a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')!.slice(1))))await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('map regions, category filters and normalized search share the written pin data',async({page})=>{
 await openMap(page);await expect(page.locator('[data-template]')).toHaveAttribute('data-template','interactive-map');await expect(page.locator('[data-pin]:visible')).toHaveCount(3);await expect(page.locator('[data-loc]')).toHaveCount(3);
 await page.locator('[data-cat-toggle="notes"]').uncheck();await expect(page.locator('[data-pin]:visible')).toHaveCount(2);await expect(page.locator('[data-loc]')).toHaveCount(2);await expect(page.locator('[data-pin="north-note"]')).toBeHidden();
 await page.locator('[data-loc-search]').fill('  ＮＯＲＴＨＥＲＮ　ＰＡＧＥ  ');await expect(page.locator('[data-pin]:visible')).toHaveCount(1);await expect(page.locator('[data-loc]')).toHaveAttribute('data-loc','north-page');
 await page.locator('[data-region="south"]').click();await expect(page.locator('[data-pin]:visible')).toHaveCount(0);await expect(page.locator('[data-loc-empty]')).toBeVisible();await page.locator('[data-loc-search]').clear();await page.locator('[data-cat-all]').click();await expect(page.locator('[data-pin]:visible')).toHaveCount(2);await expect(page.locator('[data-loc]')).toHaveCount(2);await expect(page.locator('[data-stage-wrap]')).toHaveCSS('aspect-ratio','2600 / 2600');await page.locator('[data-cat-none]').click();await expect(page.locator('[data-pin]:visible')).toHaveCount(0);await expect(page.locator('[data-loc]')).toHaveCount(0);
});
test('pointer drag, button and wheel zoom clamp actual viewport; changing region resets and closes popup',async({page})=>{
 await openMap(page);await page.locator('[data-pin="north-token"]').focus();await expect(page.locator('[data-popup]')).toContainText('Northern token');await page.keyboard.press('Escape');await expect(page.locator('[data-popup]')).toBeHidden();
 await page.locator('[data-zoom-btn="in"]').click();await expect(page.locator('[data-zoom-level]')).toHaveText('140%');// Focus and the zoom-button click can leave native smooth scrolling in flight.
 // Cancel that scroll, then measure stable, visible gesture coordinates before pressing.
 const {dragStart,dragEnd,scrollBeforeDrag}=await page.locator('[data-stage-wrap]').evaluate(async element=>{
  const initial=element.getBoundingClientRect();
  window.scrollTo({top:scrollY+initial.top-(innerHeight-initial.height)/2,behavior:'instant'});
  const deadline=performance.now()+5000;let previous='';let stableFrames=0;
  while(performance.now()<deadline){
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   const rect=element.getBoundingClientRect();const state=JSON.stringify([scrollX,scrollY,rect.x,rect.y,rect.width,rect.height]);
   stableFrames=state===previous?stableFrames+1:0;previous=state;
   if(stableFrames<4)continue;
   for(const yFraction of [.2,.35,.5,.65,.8]){
    const start={x:rect.x+rect.width*.2,y:rect.y+rect.height*yFraction},end={x:rect.x+rect.width*.8,y:rect.y+rect.height*yFraction};
    const safe=({x,y}:{x:number;y:number})=>{const target=document.elementFromPoint(x,y);return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&Boolean(target?.closest('[data-stage]'))&&!target?.closest('button,a,[data-popup]');};
    if(safe(start)&&safe(end))return {dragStart:start,dragEnd:end,scrollBeforeDrag:scrollY};
   }
   throw new Error('No unobstructed map drag path is visible');
  }
  throw new Error('Map viewport did not settle before pointer drag');
 });await page.mouse.move(dragStart.x,dragStart.y);await page.mouse.down();await page.mouse.move(dragEnd.x,dragEnd.y,{steps:4});await page.mouse.up();expect(await page.evaluate(()=>window.getSelection()?.toString())).toBe('');expect(await page.evaluate(()=>window.scrollY)).toBe(scrollBeforeDrag);await expect.poll(()=>page.locator('[data-stage]').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).m41)).toBe(0);
 await page.mouse.move(dragStart.x,dragStart.y);await page.mouse.wheel(0,-600);await expect.poll(()=>page.locator('[data-zoom-level]').innerText()).not.toBe('140%');for(let i=0;i<8&&!await page.locator('[data-zoom-btn="in"]').isDisabled();i++)await page.locator('[data-zoom-btn="in"]').click();await expect(page.locator('[data-zoom-level]')).toHaveText('400%');await expect(page.locator('[data-zoom-btn="in"]')).toBeDisabled();await page.locator('[data-zoom-btn="reset"]').click();await expect(page.locator('[data-zoom-level]')).toHaveText('100%');await page.locator('[data-pin="north-token"]').click();await expect(page.locator('[data-popup]')).toBeVisible();await page.locator('[data-region="south"]').click();await expect(page.locator('[data-popup]')).toBeHidden();await expect(page.locator('[data-zoom-level]')).toHaveText('100%');
});
test('collectible progress persists across regions and reload, reset only deletes this map key',async({page})=>{
 await openMap(page);await page.locator('[data-found="north-token"]').check();await page.locator('[data-region="south"]').click();await page.locator('[data-found="south-token"]').check();await page.reload();await expect(page.locator('[data-found="north-token"]')).toBeChecked();await expect(page.locator('[data-progress-summary]')).toContainText('2');await expect(page.locator('[data-meter]')).toHaveCount(0);await page.evaluate(()=>{localStorage.setItem('other-site:map:demo-world:demo-v1','["other"]');localStorage.setItem('unrelated','keep');});await page.locator('[data-clear]').click();await expect(page.locator('[data-clear-note]')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('template-sample-a:map:demo-world:demo-v1'))).toBe(null);expect(await page.evaluate(()=>localStorage.getItem('other-site:map:demo-world:demo-v1'))).toBe('["other"]');expect(await page.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');await page.reload();await expect(page.locator('[data-found="north-token"]')).not.toBeChecked();await expect(page.locator('[data-found="north-note"]')).toHaveCount(0);
});
test('corrupt, blocked and quota-limited storage is visible, recoverable and never claims save success',async({page})=>{
 await openMap(page);await page.evaluate(()=>localStorage.setItem('template-sample-a:map:demo-world:demo-v1','corrupt'));await page.reload();await expect(page.locator('[data-map-storage-error]')).toBeVisible();await page.locator('[data-clear]').click();await expect(page.locator('[data-map-storage-error]')).toHaveCount(0);await expect(page.locator('[data-clear-note]')).toBeVisible();await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError');};Storage.prototype.removeItem=function(){throw new DOMException('Blocked','SecurityError');};});await page.locator('[data-found="north-token"]').click();await expect(page.locator('[data-found="north-token"]')).not.toBeChecked();await expect(page.locator('[data-map-storage-error]')).toBeVisible();await page.locator('[data-clear]').click();await expect(page.locator('[data-clear-note]')).toHaveCount(0);
});
test('storage getter failure is visible and reduced motion avoids transform animation',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});await page.emulateMedia({reducedMotion:'reduce'});await openMap(page);await expect(page.locator('[data-map-storage-error]')).toBeVisible();await page.locator('[data-zoom-btn="in"]').click();await expect(page.locator('[data-stage]')).toHaveCSS('transition-duration','0s');await page.locator('[data-clear]').click();await expect(page.locator('[data-clear-note]')).toHaveCount(0);
});
test('keyboard controls and locale soft navigation keep fresh listeners and shared progress',async({page})=>{
 await openMap(page);await page.locator('[data-found="north-token"]').focus();await page.keyboard.press('Space');await expect(page.locator('[data-found="north-token"]')).toBeChecked();await page.locator('[data-pin="north-token"]').focus();await expect(page.locator('[data-popup]')).toContainText('Northern token');await page.locator('[data-cat-none]').click();await expect(page.locator('[data-popup]')).toBeHidden();await page.evaluate(()=>{(window as typeof window&{mapNavigationMarker?:string}).mapNavigationMarker='retained';});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await openChrome(page);await page.getByRole('button',{name:/Language/}).click();await page.getByRole('option',{name:/日本語/}).click();await expect(page).toHaveURL(/\/ja\/guides\/interactive-map\/?$/);expect(await page.evaluate(()=>(window as typeof window&{mapNavigationMarker?:string}).mapNavigationMarker)).toBe('retained');await expect(page.locator('[data-found="north-token"]')).toBeChecked();await page.locator('[data-region="south"]').click();await expect(page.locator('[data-loc]')).toHaveCount(2);await page.locator('[data-zoom-btn="in"]').click();await expect(page.locator('[data-zoom-level]')).toHaveText('140%');
});

async function themePaintState(page:Page){
 return page.evaluate(()=>{
  const probe=document.createElement('span');probe.style.display='none';probe.style.color='var(--surface-page)';document.body.append(probe);const token=getComputedStyle(probe).color;probe.remove();
  const transitions=document.getAnimations().filter(animation=>animation instanceof CSSTransition&&(animation.playState==='running'||animation.pending)).map(animation=>{const target=(animation.effect as KeyframeEffect).target as HTMLElement;return {tag:target.tagName,className:target.className,property:(animation as CSSTransition).transitionProperty,currentTime:animation.currentTime,visible:target.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&target.getBoundingClientRect().width>0&&target.getBoundingClientRect().height>0,detailsOpen:target.closest('details')?.open,panelHidden:target.closest('[role=tabpanel]')?.hasAttribute('hidden')};});
  return {mode:document.documentElement.dataset.mode,background:getComputedStyle(document.body).backgroundColor,surfacePageToken:token,totalPendingTransitions:transitions.length,visiblePendingTransitions:transitions.filter(transition=>transition.visible).length,hiddenPendingTransitions:transitions.filter(transition=>!transition.visible).length,transitions};
 });
}
async function settleTheme(page:Page,mode:'day'|'night'){
 const toggle=page.locator('[data-modepill]');let openedDrawer=false;
 if(await toggle.getAttribute('aria-checked')!==String(mode==='night')){
  if(!await toggle.isVisible()){await page.locator('[data-burger]').click();openedDrawer=true;}
  await toggle.click();await expect(toggle).toHaveAttribute('aria-checked',String(mode==='night'));
  if(openedDrawer){await page.keyboard.press('Escape');await expect(page.locator('[data-burger]')).toHaveAttribute('aria-expanded','false');}
 }
 await expect(page.locator('html')).toHaveAttribute('data-mode',mode);
 await page.evaluate(async()=>{await document.fonts.ready;});await page.mouse.move(0,0);
 const deadline=Date.now()+5000;let stableSince:number|null=null;
 while(Date.now()<deadline){
  await page.evaluate(()=>new Promise<void>(accept=>requestAnimationFrame(()=>accept())));
  const actual=await themePaintState(page);const now=Date.now();
  if(actual.mode===mode&&actual.background===actual.surfacePageToken&&actual.visiblePendingTransitions===0){
   stableSince??=now;
   if(now-stableSince>=250){expect(actual).toMatchObject({mode,background:actual.surfacePageToken,visiblePendingTransitions:0});return {...actual,stableMilliseconds:now-stableSince};}
  }else stableSince=null;
 }
 throw new Error(`Theme ${mode} did not remain visually settled for 250ms`);
}

for(const width of [390,834,1240,1600])test(`map original floors and settled day/night media at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await openMap(page);await mkdir('.artifacts/t05',{recursive:true});
 const original=JSON.parse(await readFile('tests/fixtures/template-sections.json','utf8'));const templateFloors=['hero','map','legend','locations','progress','how-to','faq'];const floors=[...templateFloors,'related-content'];expect(await page.locator('[data-floor]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-floor')))).toEqual(floors);expect(templateFloors.length).toBe(original['interactive-map'].orderedSections.filter((section:{kind:string;label:string})=>['hero','section'].includes(section.kind)&&section.label!=='Sources and evidence').length);
 await page.evaluate(async()=>{await document.fonts.ready;for(const node of document.querySelectorAll('[data-floor]')){node.scrollIntoView();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo(0,0);});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const viewport=await page.locator('[data-stage-wrap]').boundingBox(),categories=await page.locator('.map-categories').boundingBox();if(!viewport||!categories)throw new Error('Missing map layout');if(width<768)expect(categories.y).toBeGreaterThan(viewport.y+viewport.height);else expect(categories.x).toBeGreaterThan(viewport.x+viewport.width);
 await expect(page.locator('.map-plate-placeholder')).toContainText('3000 × 2060');await expect(page.locator('.map-comparison-placeholder')).toContainText('1200 × 900');await expect(page.locator('[data-media-id=map-hero]')).toContainText('2560 × 900');
 const themes=[];for(const mode of ['day','night'] as const){const before=await settleTheme(page,mode);await page.screenshot({path:`.artifacts/t05/interactive-map-${width}-${mode}.png`,fullPage:true,caret:'initial'});const after=await themePaintState(page);expect(after).toMatchObject({mode,background:before.surfacePageToken,visiblePendingTransitions:0});themes.push({before,after});}await writeFile(`.artifacts/t05/interactive-map-${width}-theme-state.json`,JSON.stringify(themes,null,2));
});

import {build} from 'esbuild';
async function openFrozenMap(page:Page,long=false){
 const bundle=await build({entryPoints:['tests/fixtures/interactive/map.tsx'],bundle:true,jsx:'automatic',write:false,outdir:'/tmp/t05-map-fixture',format:'iife',platform:'browser',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'}});const script=bundle.outputFiles.find(file=>file.path.endsWith('.js')),css=bundle.outputFiles.find(file=>file.path.endsWith('.css'));if(!script||!css)throw new Error('Map fixture bundle missing');
 await page.route('**/__map-fixture*',route=>route.fulfill({contentType:'text/html',body:'<html><head></head><body><div id="root"></div></body></html>'}));await page.goto(long?'/__map-fixture?long=1':'/__map-fixture');await page.addStyleTag({content:css.text});await page.addScriptTag({content:script.text});await expect(page.locator('[data-found="north-token"]')).toBeEnabled();
}
test('frozen fixture isolates progress by site and animates known-total meters once on entry',async({page})=>{
 await openFrozenMap(page);
 await page.locator('[data-found="north-token"]').check();await expect(page.locator('.map-progress [role=progressbar]').first()).toHaveAttribute('aria-valuenow','1');await page.locator('#progress').scrollIntoViewIfNeeded();await expect(page.locator('.map-progress [data-meter-filled]').first()).toHaveAttribute('data-meter-filled','true');
 await page.locator('[data-switch-site]').click();await expect(page.locator('[data-switch-site]')).toHaveText('isolated-b');await expect(page.locator('[data-found="north-token"]')).not.toBeChecked();await page.locator('[data-found="north-page"]').check();await page.locator('[data-switch-site]').click();await expect(page.locator('[data-found="north-token"]')).toBeChecked();await expect(page.locator('[data-found="north-page"]')).not.toBeChecked();expect(await page.evaluate(()=>localStorage.getItem('isolated-b:map:demo-world:demo-v1'))).toBe('["north-page"]');
});
test('real two-finger zoom retains one-finger panning and clamps after viewport resize',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await openMap(page);const viewport=page.locator('[data-stage-wrap]');await viewport.scrollIntoViewIfNeeded();const box=await viewport.boundingBox();if(!box)throw new Error('Missing viewport');const session=await page.context().newCDPSession(page);const point=(x:number,y:number,id:number)=>({x:box.x+box.width*x,y:box.y+box.height*y,id});
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.2,.7,1),point(.5,.7,2)]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.1,.7,1),point(.7,.7,2)]});await expect.poll(()=>viewport.locator('[data-zoom-level]').innerText()).not.toBe('100%');
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point(.7,.7,2)]});const before=await page.locator('[data-stage]').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).m41);await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.2,.7,1)]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>page.locator('[data-stage]').evaluate(node=>new DOMMatrix(getComputedStyle(node).transform).m41)).toBeGreaterThan(before);
 await page.setViewportSize({width:390,height:900});const geometry=await viewport.evaluate(node=>{const transform=new DOMMatrix(getComputedStyle(node.querySelector('[data-stage]')!).transform);return {x:transform.m41,y:transform.m42,scale:transform.m11,width:node.clientWidth,height:node.clientHeight};});expect(geometry.x).toBeLessThanOrEqual(0);expect(geometry.y).toBeLessThanOrEqual(0);expect(geometry.x).toBeGreaterThanOrEqual(geometry.width*(1-geometry.scale)-1);expect(geometry.y).toBeGreaterThanOrEqual(geometry.height*(1-geometry.scale)-1);await session.detach();
});
test('successful reset acknowledgement expires as in the prototype',async({page})=>{await openMap(page);await page.locator('[data-clear]').click();await expect(page.locator('[data-clear-note]')).toBeVisible();await expect(page.locator('[data-clear-note]')).toHaveCount(0,{timeout:3500});});
test('category exit fades the pin while immediately removing keyboard access',async({page})=>{await openMap(page);const pin=page.locator('[data-pin="north-note"]');await page.locator('[data-cat-toggle="notes"]').uncheck();await expect(pin).toHaveAttribute('inert','');await expect(pin).toHaveAttribute('tabindex','-1');expect(await pin.evaluate(node=>{(node as HTMLElement).focus();return document.activeElement===node;})).toBe(false);await expect(pin).toHaveCSS('opacity','0');await expect(pin).toBeHidden();expect(await pin.getAttribute('hidden')).toBe(null);await page.locator('[data-cat-toggle="notes"]').check();await expect(pin).toBeVisible();await expect(pin).not.toHaveAttribute('inert','');});

for(const input of ['wheel','touch'] as const)test(`390px long pin popup scrolls its complete text with ${input} without zooming the map`,async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({reducedMotion:'reduce'});await openFrozenMap(page,true);await page.locator('[data-pin="north-token"]').click();const popup=page.locator('[data-popup]');await expect(popup).toBeVisible();const size=await popup.evaluate(node=>({height:node.clientHeight,scroll:node.scrollHeight}));expect(size.scroll).toBeGreaterThan(size.height*3);const originalZoom=await page.locator('[data-zoom-level]').innerText();const box=await popup.boundingBox();if(!box)throw new Error('Missing pin popup');expect(await popup.evaluate((element,point)=>element.contains(document.elementFromPoint(point.x,point.y)),{x:box.x+box.width/2,y:box.y+box.height-24})).toBe(true);
 if(input==='wheel'){
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,300);await expect.poll(()=>popup.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);await page.mouse.wheel(0,size.scroll);await expect.poll(()=>popup.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThan(2);
 }else{
  const session=await page.context().newCDPSession(page);const x=box.x+box.width/2,from=box.y+box.height-24,to=box.y+24;const swipe=async()=>{await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:from,id:1}]});for(let i=1;i<=8;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:from+(to-from)*i/8,id:1}]});await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  await swipe();await expect.poll(()=>popup.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);for(let i=0;i<40&&await popup.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)>2;i++)await swipe();await expect.poll(()=>popup.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThan(2);await session.detach();
 }
 await expect(page.locator('[data-zoom-level]')).toHaveText(originalZoom);await expect(popup).toContainText('END OF COMPLETE PIN DESCRIPTION.');await expect(popup.locator('small').last()).toBeInViewport();
});

test('disabled map regions use semantic text colors without translucent ancestors',async({page})=>{await openFrozenMap(page);await page.addStyleTag({content:':root{--text-disabled:rgb(90,90,90)}'});const region=page.locator('[data-region="held-region"]');await expect(region).toBeDisabled();await expect(region).toHaveAttribute('aria-pressed','false');const actual=await region.evaluate(element=>[element,...element.querySelectorAll('*')].map(node=>{const opacity=[];for(let ancestor:Element|null=node;ancestor;ancestor=ancestor.parentElement)opacity.push(getComputedStyle(ancestor).opacity);return {color:getComputedStyle(node).color,opacity};}));for(const row of actual){expect(row.opacity.every(value=>value==='1')).toBe(true);expect(row.color).toBe('rgb(90, 90, 90)');}});
