import {test,expect} from '@playwright/test';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {isListType} from '../../src/content/template-layouts';
import {catalogModel} from '../../src/templates/catalog-page/model';
import {listPageModel} from '../../src/templates/list-page/model';

const index=buildIndex(await readSite(process.cwd()),{preview:false});
for(const catalogue of Object.values(index.pagesByKey).filter(page=>isListType(page.template)))for(const width of [390,1440]){
 test(`catalogue guide contract at ${catalogue.path}, ${width}px`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(catalogue.path);
  const structured=['build-library','mod-index','database-index'].includes(catalogue.template);
  const model=structured?catalogModel(index,catalogue):listPageModel(index,catalogue);
  const prefix=structured?'catalog':'list';
  const entries=catalogue.template==='database-index'?'.catalog-table tbody tr':`.${prefix}-card`;
  const guide=catalogue.listGuide?index.pagesByKey[`${catalogue.locale}:${catalogue.listGuide}`]:null;
  await expect(page.locator(`.${prefix}-guide`)).toHaveCount(guide?1:0);
  if(guide){await expect(page.locator(structured?'.catalog-guide strong':'.list-guide-title')).toHaveText(guide.title);await expect(page.locator(`.${prefix}-guide a`)).toHaveAttribute('href',guide.path);}
  await expect(page.getByRole('searchbox')).toBeVisible();
  await expect(page.locator(entries)).toHaveCount(Math.min(model.entries.length,model.perPage));
  await page.getByRole('searchbox').fill('__no_matching_catalogue_entry__');
  await expect(page.locator(structured?'.catalog-empty':'.list-no-results')).toBeVisible();
  await page.locator(structured?'.catalog-empty button':'.list-no-results button').click();
  await expect(page.locator(entries)).toHaveCount(Math.min(model.entries.length,model.perPage));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
