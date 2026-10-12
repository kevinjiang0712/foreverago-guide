import {test,expect} from '@playwright/test';
import {inspectMatrixLayout,inspectTextContrast,revealPage,type MatrixExpectation} from '../../scripts/matrix-page';
const expected:MatrixExpectation={template:'wiki-page',title:'Measured title',floors:['hero'],media:{hero:1},assetIds:[],currentHrefs:['/guides']};
const html='<style>h1{font:24px/1.5 sans-serif;width:600px;margin:0}.media-slot{height:100px;width:100px}</style><nav class="site-navigation"><a href="/guides" aria-current="page">Guides</a></nav><div data-template="wiki-page"><main data-floor="hero"><h1>Measured title</h1><div class="media-slot"></div></main></div>';
test('reveal capture rejects a floor whose observer never reveals it',async({page})=>{
 await page.setContent('<div data-template="site-home"><section data-floor="featured" data-motion-reveal data-motion-ready style="height:100px;opacity:0">Never revealed</section></div>');
 await expect(revealPage(page)).rejects.toThrow(/Reveal did not appear: featured/);
 await expect(page.locator('section')).not.toHaveAttribute('data-revealed','true');
});
test('reveal capture scrolls floors into view and waits for their actual observer',async({page})=>{
 await page.setContent('<div data-template="site-home"><div style="height:1000px"></div><section data-floor="featured" data-motion-reveal data-motion-ready style="height:160px;opacity:0">Observed floor</section><div style="height:1800px"></div></div>');
 await page.evaluate(()=>{const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.setAttribute('data-revealed','true');(entry.target as HTMLElement).style.opacity='1';observer.disconnect();}});observer.observe(document.querySelector('section')!);});
 await revealPage(page);await expect(page.locator('section')).toHaveAttribute('data-revealed','true');await expect(page.locator('section')).toHaveCSS('opacity','1');
});
test('matrix accepts a complete visible page',async({page})=>{await page.setContent(html);expect((await inspectMatrixLayout(page,expected)).errors).toEqual([]);});
test('matrix accepts visible font ink that extends beyond its line box',async({page})=>{
 await page.setContent(html);await page.locator('h1').evaluate(element=>{element.style.lineHeight='.5';element.style.overflow='visible';});
 expect((await inspectMatrixLayout(page,expected)).errors).toEqual([]);
});
test('matrix requires supplied article assets to remain on the page',async({page})=>{
 await page.setContent(html);
 const withAsset={...expected,assetIds:['registered-image']};
 expect((await inspectMatrixLayout(page,withAsset)).errors.join('; ')).toContain('Missing supplied');
 await page.locator('.media-slot').evaluate(element=>element.setAttribute('data-media-id','registered-image'));
 expect((await inspectMatrixLayout(page,withAsset)).errors).toEqual([]);
});
for(const [name,script,error] of [
 ['wrong template','document.querySelector("[data-template]").dataset.template="site-home"','Wrong template'],
 ['wrong title','document.querySelector("h1").textContent="Other page"','Wrong H1'],
 ['wrong nav','document.querySelector("a").href="/wrong"','Wrong current navigation'],
 ['deleted floor','document.querySelector("[data-floor]").remove()','Missing, extra or reordered floors'],
 ['hidden floor','document.querySelector("[data-floor]").style.display="none"','Fixed floor'],
 ['transparent ancestor','document.querySelector("[data-template]").style.opacity="0"','Fixed floor'],
 ['deleted media','document.querySelector(".media-slot").remove()','Missing media'],
 ['hidden media','document.querySelector(".media-slot").hidden=true','Media is hidden'],
 ['clipped plain title','Object.assign(document.querySelector("h1").style,{width:"80px",height:"14px",overflow:"hidden",whiteSpace:"nowrap"})','Hero title glyphs'],
 ['transparent title','document.querySelector("h1").style.opacity="0"','Hero title glyphs'],
 ['invisible title','document.querySelector("h1").style.visibility="hidden"','Hero title glyphs'],
 ['masked title','document.querySelector("h1").style.clipPath="inset(100%)"','Hero title glyphs'],
 ['hidden title text','document.querySelector("h1").innerHTML="<span style=visibility:hidden>Measured title</span>"','Hero title glyphs'],
] as const)test(`matrix rejects ${name}`,async({page})=>{await page.setContent(html);await page.evaluate(script);expect((await inspectMatrixLayout(page,expected)).errors.join('; ')).toContain(error);});
test('contrast uses nested visible text colour rather than the button parent',async({page})=>{
 await page.setContent('<button style="color:white;background:black"><span class="button-label" style="color:black">Unreadable label</span></button><p style="color:white;background:black"><span style="color:black">Unreadable text</span></p>');
 const colors=await inspectTextContrast(page,'button,p');expect(colors).toHaveLength(2);expect(colors.every(color=>color.ratio===1)).toBe(true);
});
test('matrix rejects a loaded image hidden inside its visible slot',async({page})=>{
 await page.setContent(html);await page.locator('.media-slot').evaluate(element=>{element.innerHTML='<img style="display:none" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22/%3E">';});
 await page.waitForFunction(()=>document.querySelector('img')?.complete);expect((await inspectMatrixLayout(page,expected)).errors.join('; ')).toContain('Media is hidden');
});
test('contrast measures the rendered gradient rather than the underlying background colour',async({page})=>{
 await page.setContent('<p style="color:white;background:black;background-image:linear-gradient(white,white)">Unreadable text</p>');
 expect((await inspectTextContrast(page,'p'))[0].ratio).toBe(1);
});
test('contrast includes sibling overlays and restores visible ink after sampling',async({page})=>{
 await page.setContent('<div style="position:relative;background:black"><div style="position:absolute;inset:0;background:white"></div><p style="position:relative;color:white">Unreadable text</p></div>');
 expect((await inspectTextContrast(page,'p'))[0].ratio).toBe(1);
 await expect(page.locator('p')).toHaveCSS('-webkit-text-fill-color','rgb(255, 255, 255)');
});
test('contrast measures only visible text bounds when a thumbnail label is ellipsised',async({page})=>{
 await page.setContent('<div style="width:90px;background:black;border:2px solid white"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:white">A long thumbnail label that exceeds its slot</span></div>');
 expect((await inspectTextContrast(page,'span'))[0].ratio).toBe(21);
});
for(const [name,change] of [
 ['geometry',()=>{document.querySelector('button')!.style.marginTop='50px';}],
 ['paint',()=>{document.querySelector('button')!.style.backgroundColor='white';}],
 ['selection',()=>{document.querySelector('button')!.setAttribute('aria-pressed','false');}],
] as const)test(`contrast rejects ${name} changes during its screenshot instead of sampling stale coordinates`,async({page})=>{
 await page.setContent('<button aria-pressed="true" style="color:white;background:black">All</button>');
 const screenshot=page.screenshot.bind(page);let captures=0;
 page.screenshot=async options=>{captures++;await page.evaluate(change);return screenshot(options);};
 await expect(inspectTextContrast(page,'button')).rejects.toThrow(/Contrast capture changed/);
 expect(captures).toBe(1);
 await expect(page.locator('button')).toHaveCSS('-webkit-text-fill-color','rgb(255, 255, 255)');
});
test('contrast waits for the real colour transition before recording a single baseline',async({page})=>{
 await page.setContent('<button style="color:white;background:black;transition:background-color 240ms linear">Settling button</button>');
 await page.locator('button').evaluate(element=>{void getComputedStyle(element).backgroundColor;element.style.backgroundColor='rgb(51, 51, 51)';});
 const colors=await inspectTextContrast(page,'button');
 expect(colors[0].layers[0].background).toBe('rgb(51, 51, 51)');expect(colors[0].ratio).toBeGreaterThan(12);expect(colors[0].ratio).toBeLessThan(13);
});

test('contrast waits for text fill to finish fading out before sampling the background',async({page})=>{
 await page.setContent('<style>*{transition-duration:140ms}</style><p style="color:rgb(200,165,75);background:rgb(14,15,18)">Quick Answer</p>');
 const rows=await inspectTextContrast(page,'p');expect(rows[0].lowestBackground).toBe('#0e0f12');expect(rows[0].ratio).toBeGreaterThan(7);
 await expect(page.locator('p')).toHaveCSS('-webkit-text-fill-color','rgb(200, 165, 75)');
});
