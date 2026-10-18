import {expect,test} from '@playwright/test';

test('mobile home reserves route downloads for the selected guide',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const routeDownloads:string[]=[];
 page.on('request',request=>{
  if(new URL(request.url()).searchParams.has('_rsc'))routeDownloads.push(request.url());
 });
 await page.goto('/',{waitUntil:'networkidle'});
 const trackerLink=page.locator('.hero-actions').getByRole('link',{name:'Open Completion Tracker'});
 await expect(trackerLink).toBeVisible();
 await page.waitForTimeout(1000);
 expect(routeDownloads).toEqual([]);
 await page.locator('[data-floor="featured"]').scrollIntoViewIfNeeded();
 await page.waitForTimeout(1000);
 expect(routeDownloads).toEqual([]);
 await trackerLink.click();
 await expect(page).toHaveURL(/\/guide\/forever-ago-completion-tracker$/);
 await expect(page.getByLabel('Search tasks',{exact:true})).toBeEnabled();
});
