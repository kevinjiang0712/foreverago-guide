import {expect,test} from '@playwright/test';

const paths=['/review/forever-ago-game-length','/walkthrough/forever-ago-photo-puzzle','/guide/forever-ago-camera-achievements'];

for(const width of [320,390,1440])test(`photo scene selector reaches every indexed solution at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto(paths[1]);
 const selector=page.getByLabel('Choose your current step');
 await expect(selector).toBeEnabled();
 const options=await selector.locator('option').evaluateAll(items=>items.map(item=>({id:(item as HTMLOptionElement).value,label:item.textContent})));
 expect(options).toHaveLength(5);
 for(const option of options){
  await selector.selectOption(option.id);
  await page.getByRole('button',{name:'Go to solution',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`#${option.id}$`));
  const heading=page.locator(`[id="${option.id}"]`);
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  const hasIllustration=await heading.evaluate(start=>{
   for(let node=start.nextElementSibling;node;node=node.nextElementSibling){
    if(node.tagName==='H2')return false;
    if(node.querySelector('img'))return true;
   }
   return false;
  });
  expect(hasIllustration,option.label??option.id).toBe(true);
 }
 await page.goBack();
 await expect(page).not.toHaveURL(new RegExp(`#${options.at(-1)!.id}$`));
});

test('scene links and all three guides remain usable without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL,viewport:{width:390,height:900}});
 const page=await context.newPage();
 for(const path of paths){
  const response=await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#article-body')).toHaveAttribute('data-revealed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.goto(paths[1]);
 await page.getByText('Or follow a scene link',{exact:true}).click();
 const links=await page.locator('.photo-puzzle-navigator a').evaluateAll(items=>items.map(item=>({href:item.getAttribute('href')!,text:item.textContent!})));
 expect(links).toHaveLength(5);
 for(const link of links){
  await page.goto(paths[1]);
  await page.getByText('Or follow a scene link',{exact:true}).click();
  await page.getByRole('link',{name:link.text,exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`${link.href}$`));
  await expect(page.locator(link.href)).toBeInViewport();
 }
 await context.close();
});
