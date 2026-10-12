import {expect,test} from '@playwright/test';
for(const [path,locale] of [['/','en'],['/ja','ja'],['/guides/first-steps','en'],['/ja/guides/hajime','ja']]){
 test(`${path} is a real server-rendered ${locale} page`,async({page,request})=>{
  const response=await page.goto(path);expect(response?.status()).toBe(200);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).toHaveCount(1);
  const html=await (await request.get(path)).text();expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}"`));expect(html).toContain('<h1');
 });
}
for(const [path,locale] of [['/missing','en'],['/ja/missing','ja'],['/en','en']]){
 test(`${path} is a real localized 404`,async({page})=>{
  const response=await page.goto(path);expect(response?.status()).toBe(404);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).toHaveCount(1);
 });
}
