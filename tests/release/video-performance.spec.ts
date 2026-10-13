import {expect,test} from '@playwright/test';

test('trailer loads the player only after keyboard activation',async({page})=>{
 const playerRequests:string[]=[];
 await page.route(/https:\/\/(www\.youtube-nocookie\.com|www\.youtube\.com)\//,async route=>{
  playerRequests.push(route.request().url());
  await route.fulfill({contentType:'text/html',body:'<!doctype html><title>Trailer player</title>'});
 });
 await page.goto('/',{waitUntil:'networkidle'});
 expect(playerRequests).toEqual([]);
 await expect(page.locator('.video-embed iframe')).toHaveCount(0);
 const preview=page.getByRole('button',{name:/Play.*trailer/i});
 await expect(preview).toBeVisible();
 const before=await page.locator('.video-embed').boundingBox();
 await preview.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.video-embed iframe')).toHaveAttribute('src',/youtube-nocookie\.com\/embed\/AeHgQ29sukE\?autoplay=1/);
 await expect.poll(()=>playerRequests.length).toBe(1);
 const after=await page.locator('.video-embed').boundingBox();
 expect(after?.height).toBe(before?.height);
 expect(after?.width).toBe(before?.width);
});
