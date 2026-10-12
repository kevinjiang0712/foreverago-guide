import {test,expect} from '@playwright/test';
import {openChrome} from './chrome-access';

test('hero owns its accessible title and completes word entrance once',async({page})=>{
 await page.goto('/');const title=page.locator('h1[data-hero-title]');await expect(title).toHaveAccessibleName('Template Sample A Wiki');
 await expect(title.locator('[data-word]')).toHaveCount(4);await expect(page.locator('[data-motion-hero]')).toHaveAttribute('data-entered','true',{timeout:7000});
 await expect(title.locator('[data-word]>span').last()).toHaveCSS('opacity','1');
 await page.evaluate(()=>window.scrollTo(0,900));await page.evaluate(()=>window.scrollTo(0,0));
 expect(await title.locator('[data-word]>span').evaluateAll(elements=>elements.every(element=>getComputedStyle(element).opacity==='1'))).toBe(true);
});

test('homepage FAQ animates closure and leaves closed content inert',async({page})=>{
 await page.goto('/');const disclosure=page.locator('.home-faq-item').first();await disclosure.scrollIntoViewIfNeeded();await disclosure.locator('.home-faq-question').click();
 await expect(disclosure).toHaveAttribute('data-expanded','true');await expect(disclosure.locator('.home-faq-answer-body')).not.toHaveAttribute('inert','');
 await disclosure.locator('.home-faq-question').click();await expect(disclosure).toHaveAttribute('data-expanded','false');await expect(disclosure.locator('.home-faq-answer-body')).toHaveAttribute('inert','');
});

test('reduced motion keeps stats as plain text and chrome visible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const hero=page.locator('[data-motion-hero]');await expect(hero).toHaveAttribute('data-entered','true');
 await expect(hero.locator('.hero-stat-run [data-tick]')).toHaveCount(0);await expect(hero.locator('.hero-stat-run>span>span')).toHaveText(['2','2','Unverified','Unverified']);
 await expect(page.locator('header.site-header')).toHaveAttribute('data-hidden','false');
 expect(await hero.locator('h1').evaluate(element=>getComputedStyle(element).transform)).toBe('none');
 const disclosure=page.locator('.home-faq-item').first();await disclosure.scrollIntoViewIfNeeded();await disclosure.locator('.home-faq-question').click();await disclosure.locator('.home-faq-question').click();await expect(disclosure).toHaveAttribute('data-expanded','false');
});

test('hero artwork stays still after pointer movement and scrolling',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');const hero=page.locator('[data-motion-hero]');await expect(hero).toHaveAttribute('data-entered','true');
 const art=hero.locator('.media-slot--hero');await expect(art).toHaveCSS('transform','none');
 const bounds=await hero.boundingBox();await page.mouse.move(bounds!.x+bounds!.width-4,Math.min(850,bounds!.y+bounds!.height-4));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(art).toHaveCSS('transform','none');
 await page.evaluate(()=>window.scrollTo({top:400,behavior:'instant'}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(art).toHaveCSS('transform','none');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(art).toHaveCSS('transform','none');
});

test('touch keeps entrance while disabling drift and CTA sweep',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 try{await page.goto(test.info().project.use.baseURL+'/');const hero=page.locator('[data-motion-hero]');await expect(hero).toHaveAttribute('data-entered','true');await hero.tap({position:{x:150,y:250}});expect(await hero.locator('.media-slot--hero').evaluate(element=>getComputedStyle(element).transform)).toBe('none');expect(await hero.locator('[data-sweep]').first().evaluate(element=>getComputedStyle(element).display)).toBe('none');}finally{await context.close();}
});


test('hero fits measured title height and remeasures after container width changes',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/');const title=page.locator('h1[data-hero-title]');await expect(title).toHaveAttribute('data-title-fit');
 await title.evaluate(element=>{(element as HTMLElement).style.width='180px';});await expect.poll(()=>title.evaluate(element=>Number((element as HTMLElement).dataset.titleFit))).toBeLessThan(1);
 await expect.poll(()=>title.evaluate(element=>element.getBoundingClientRect().height/parseFloat(getComputedStyle(element).lineHeight))).toBeLessThanOrEqual(2.02);
 const compact=await title.evaluate(element=>({height:element.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(element).lineHeight),size:parseFloat(getComputedStyle(element).fontSize)}));expect(compact.height).toBeLessThanOrEqual(compact.lineHeight*2+1);
 await title.evaluate(element=>{(element as HTMLElement).style.width='900px';});await expect.poll(()=>title.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(compact.size);
});

test('three soft navigation round trips do not multiply disclosure listeners',async({page})=>{
 await page.goto('/');for(let i=0;i<3;i++){await openChrome(page);await page.locator('header nav a[href="/guides"]').click();await expect(page).toHaveURL(/\/guides\/?$/);await page.goBack();await expect(page.locator('[data-template="site-home"]')).toBeVisible();}
 const disclosure=page.locator('.home-faq-item').first();await disclosure.scrollIntoViewIfNeeded();await disclosure.locator('.home-faq-question').click();await expect(disclosure).toHaveAttribute('data-expanded','true');await disclosure.locator('.home-faq-question').click();await expect(disclosure).toHaveAttribute('data-expanded','false');
});

test('Reveal enters once and retains its final state after leaving the viewport',async({page})=>{
 await page.goto('/');const floor=page.locator('[data-motion-reveal]').first();await floor.scrollIntoViewIfNeeded();await expect(floor).toHaveAttribute('data-revealed','true');await expect(floor).toHaveCSS('opacity','1');
 await page.evaluate(()=>window.scrollTo(0,0));await expect(floor).toHaveAttribute('data-revealed','true');await floor.scrollIntoViewIfNeeded();await expect(floor).toHaveCSS('opacity','1');
});

test('a 14000px article reveals when its first readable pixels enter the mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/guides/first-steps');
 await page.addStyleTag({content:'[data-floor="article-body"]{min-height:14000px}'});
 const article=page.locator('[data-floor="article-body"]');expect((await article.boundingBox())!.height).toBeCloseTo(14000,0);
 await article.evaluate(element=>window.scrollTo({top:window.scrollY+element.getBoundingClientRect().top-200,behavior:'instant'}));
 await expect(article).toHaveAttribute('data-revealed','true');await expect(article).toHaveCSS('opacity','1');await expect(article.locator('h2,h3').first()).toBeInViewport();
});

test('reduced-motion long Japanese article title wraps without clipping',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/ja/guides/shiryo');
 const hero=page.locator('.article-hero');const title=hero.locator('h1');await expect(title).toHaveAccessibleName('資料の読み方と未確認情報を整理するためのテンプレート見本');
 const geometry=await title.evaluate(element=>{const style=getComputedStyle(element),probe=document.createElement('span');probe.style.fontSize='var(--fluid-h1)';document.body.append(probe);const token=parseFloat(getComputedStyle(probe).fontSize);probe.remove();return {height:element.getBoundingClientRect().height,line:parseFloat(style.lineHeight),font:parseFloat(style.fontSize),token,clipped:['hidden','clip'].includes(style.overflowY)&&element.scrollHeight>element.clientHeight+1||['hidden','clip'].includes(style.overflowX)&&element.scrollWidth>element.clientWidth+1};});
 expect(geometry.height).toBeGreaterThan(geometry.line*1.9);expect(geometry.font).toBe(geometry.token);expect(geometry.clipped).toBe(false);
 const titleBox=await title.boundingBox();const heroBox=await hero.boundingBox();expect(titleBox!.y+titleBox!.height).toBeLessThan(heroBox!.y+heroBox!.height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
