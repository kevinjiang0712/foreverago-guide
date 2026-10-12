import {test,expect} from '@playwright/test';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {matrixExpectation,inspectMatrixLayout} from '../../scripts/matrix-page';
import {mkdir} from 'node:fs/promises';
const index=buildIndex(await readSite('examples/site-a'),{preview:false});
const routes=Object.values(index.routes).filter(route=>route.kind==='page'&&['build','build-library'].includes(index.records[`${route.locale}:${index.pagesByKey[route.bodyKey].articleRecord}`]?.type));
for(const route of routes)test(`build article retains all modules at ${route.path}`,async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(route.path);await page.evaluate(async()=>{await document.fonts.ready;for(const floor of document.querySelectorAll('[data-floor]')){floor.scrollIntoView();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo(0,0);});
 const actual=await inspectMatrixLayout(page,matrixExpectation(index,route,'wiki-page'));expect(actual.errors,JSON.stringify(actual.measured)).toEqual([]);
 await expect(page.locator('#sources,a[href="#sources"]')).toHaveCount(0);await expect(page.locator('[data-template-body]')).not.toBeEmpty();
 if(route.kind==='page'&&index.records[`${route.locale}:${index.pagesByKey[route.bodyKey].articleRecord}`].type==='build'){const build=index.records[`${route.locale}:${index.pagesByKey[route.bodyKey].articleRecord}`];if(build.type==='build'){await expect(page.locator('#variants')).toHaveCount(build.variants.length?1:0);if(build.variants.length)await expect(page.locator('#variants button').first()).toHaveAttribute('aria-pressed','true');await expect(page.locator('#equipment')).toBeVisible();if(build.equipment.length)await expect(page.locator('#equipment .article-facts').first()).toBeVisible();}await expect(page.locator('#risks')).not.toBeEmpty();}
 await mkdir('.artifacts/build-merge',{recursive:true});await page.screenshot({path:`.artifacts/build-merge/${route.locale}-${route.contentId}.png`,fullPage:true});
});
for(const prefix of ['', '/ja'])for(const id of ['demo-steady','demo-range','demo-fast'])test(`old ${prefix}/builds#setup-${id} opens the build article`,async({page})=>{
 await page.goto(`${prefix}/builds#setup-${id}`);await expect(page).toHaveURL(new RegExp(`${prefix}/builds/${id}$`));await expect(page.locator('[data-template]')).toHaveAttribute('data-template','build-detail');
});
for(const anchor of ['presets','rescue','faq'])test(`old builds#${anchor} opens the shared reference article`,async({page})=>{
 await page.goto(`/builds#${anchor}`);await expect(page).toHaveURL(new RegExp(`/builds/build-library-reference#${anchor}$`));await expect(page.locator(`#${anchor}`)).toBeInViewport();
});
test('old builds#sources opens the reference body without a missing anchor',async({page})=>{
 await page.goto('/builds#sources');await expect(page).toHaveURL(/\/builds\/build-library-reference#article-body$/);await expect(page.locator('#article-body')).toBeInViewport();
});
for(const anchor of ['find-build','setups'])test(`old builds#${anchor} opens the shared list`,async({page})=>{
 await page.goto(`/builds#${anchor}`);await expect(page).toHaveURL(/\/builds#browse$/);await expect(page.locator('.catalog-card')).toHaveCount(30);
});
