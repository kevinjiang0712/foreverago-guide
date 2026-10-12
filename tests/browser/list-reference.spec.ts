import {test,expect} from '@playwright/test';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {matrixExpectation,inspectMatrixLayout} from '../../scripts/matrix-page';
const index=buildIndex(await readSite('examples/site-a'),{preview:false});
for(const route of Object.values(index.routes).filter(route=>route.kind==='page'&&index.pagesByKey[route.bodyKey].articleRecord))test(`reference article retains modules and supplied media at ${route.path}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:900});await page.goto(route.path);await page.evaluate(async()=>{await document.fonts.ready;for(const floor of document.querySelectorAll('[data-floor]')){floor.scrollIntoView();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo(0,0);});
 const actual=await inspectMatrixLayout(page,matrixExpectation(index,route,'wiki-page'));expect(actual.errors,JSON.stringify(actual.measured)).toEqual([]);
 await expect(page.locator('[data-template-body]')).not.toBeEmpty();await expect(page.locator('.article-quick-answer')).toBeVisible();
});
for(const prefix of ['', '/ja'])for(const anchor of ['install','compat','safety','faq','legal'])test(`old ${prefix}/mods#${anchor} forwards to its article section`,async({page})=>{
 await page.goto(`${prefix}/mods#${anchor}`);await expect(page).toHaveURL(new RegExp(`${prefix}/mods/mod-index-reference#${anchor}$`));await expect(page.locator(`#${anchor}`)).toBeInViewport();
});

test('switching catalogue routes starts with that catalogue’s own filters',async({page})=>{
 await page.setViewportSize({width:1240,height:900});await page.goto('/bosses');await page.getByRole('button',{name:'Low difficulty',exact:true}).click();await page.getByRole('searchbox').fill('sentinel');await expect(page.locator('.list-card')).toHaveCount(1);
 await page.locator('.site-navigation').getByRole('link',{name:'Mods',exact:true}).click();await expect(page).toHaveURL(/\/mods$/);await expect(page.getByRole('searchbox')).toHaveValue('');await expect(page.locator('.catalog-card')).toHaveCount(30);await expect(page.locator('.catalog-result-count [role=status]')).toContainText('65 Results');
});
