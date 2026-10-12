import {expect,test} from '@playwright/test';

for(const width of [320,390,834,1440])test(`homepage character cards omit status and keep compact readable content at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const cards=page.locator('.character-spotlight-card');await cards.first().scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
 await expect(cards).toHaveCount(3);await expect(cards.locator('.character-spotlight-copy>span')).toHaveCount(0);
 await expect(cards.locator('.character-spotlight-avatar img')).toHaveCount(3);
 await expect(cards.locator('h3')).toHaveText(['Demo Traveller','Demo Guide','Demo Archivist']);
 const geometry=await cards.evaluateAll(nodes=>nodes.map(card=>{
  const box=card.getBoundingClientRect(),avatar=card.querySelector('.character-spotlight-avatar')!.getBoundingClientRect(),role=card.querySelector('.character-spotlight-role')!.getBoundingClientRect(),description=card.querySelector('.character-spotlight-copy>p:nth-of-type(2)')!,descriptionBox=description.getBoundingClientRect(),style=getComputedStyle(description);
  return {height:box.height,avatarWidth:avatar.width,avatarGap:role.top-avatar.bottom,copyVisible:descriptionBox.bottom<=box.bottom&&description.scrollHeight<=description.clientHeight+1,bottomPadding:getComputedStyle(card).paddingBottom,descriptionMargin:style.marginBottom,overflow:style.overflowY,lineClamp:style.webkitLineClamp};
 }));
 for(const card of geometry){expect(card.height).toBeLessThan(320);expect(card.avatarWidth).toBe(width<=600?136:150);expect(card.avatarGap).toBeGreaterThan(0);expect(card.copyVisible).toBe(true);expect(card.bottomPadding).toBe('20px');expect(card.descriptionMargin).toBe('0px');expect(card.overflow).toBe('visible');expect(card.lineClamp).toBe('none');}
 await expect(page.locator('.character-spotlight-action a')).toHaveAttribute('href','/characters');
 if(width<=600){const grid=page.locator('.character-spotlight-grid');await expect(grid).toHaveCSS('overflow-x','auto');expect(await grid.evaluate(node=>node.scrollWidth>node.clientWidth)).toBe(true);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

for(const width of [320,390,768,834,1440])test(`About facts wrap long words without shrinking or clipping at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const sheet=page.locator('.home-about .fact-sheet');await sheet.scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
 const fonts=await sheet.locator('dt,dd').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).fontSize));
 for(const value of ['W'.repeat(30),'PC, PS5, Xbox Series X/S, Deck']){
  await sheet.evaluate((element,value)=>{for(const row of element.children){row.querySelector('dt')!.textContent='W'.repeat(12);row.querySelector('dd')!.textContent=value;}},value);
  const layout=await sheet.evaluate(element=>{
   const bounds=element.getBoundingClientRect(),parent=element.parentElement!.getBoundingClientRect();
   return {insideParent:bounds.left>=parent.left-1&&bounds.right<=parent.right+1,cells:[...element.querySelectorAll('dt,dd')].map(cell=>{
    const style=getComputedStyle(cell),box=cell.getBoundingClientRect(),row=cell.parentElement!.getBoundingClientRect();
    return {text:cell.textContent,font:style.fontSize,overflowWrap:style.overflowWrap,insideRow:box.left>=row.left-1&&box.right<=row.right+1,clipped:cell.scrollWidth>cell.clientWidth+1||cell.scrollHeight>cell.clientHeight+1,overflowX:style.overflowX,overflowY:style.overflowY,textOverflow:style.textOverflow,lineClamp:style.webkitLineClamp};
   })};
  });
  expect(layout.insideParent).toBe(true);expect(layout.cells).toHaveLength(12);
  for(const [index,cell] of layout.cells.entries()){
   expect(cell.text).toBe(index%2===0?'W'.repeat(12):value);expect(cell.font).toBe(fonts[index]);
   expect(cell).toMatchObject({insideRow:true,clipped:false,overflowWrap:'anywhere',overflowX:'visible',overflowY:'visible',textOverflow:'clip',lineClamp:'none'});
  }
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 }
});

for(const width of [320,390,834,1440])test(`homepage stats stay plain text at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 const stats=page.locator('.hero-stat-run');
 await expect(stats.locator(':scope>span>span')).toHaveText(['2','2','Unverified','Unverified']);
 await expect(stats.locator('[data-tick],.sr-only,[aria-hidden]')).toHaveCount(0);
 await expect(page.locator('[data-motion-hero]')).toHaveAttribute('data-entered','true');
 await stats.scrollIntoViewIfNeeded();
 await expect(stats.locator(':scope>span>span')).toHaveText(['2','2','Unverified','Unverified']);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('ordinary home floors omit view-all actions and retain article navigation',async({page})=>{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('.home-category-floor')).not.toHaveCount(0);
  await expect(page.locator('.home-category-floor .floor-heading-row a')).toHaveCount(0);
  const cards=page.locator('[data-floor="category-guides"] .home-discovery-card');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('[data-floor="category-characters"] a[href="/characters"]')).toHaveCount(1);
  await expect(page.locator('[data-floor="category-weapons"] a[href="/weapons"]')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  const href=await cards.first().getAttribute('href');
  expect(href).toBeTruthy();
  await cards.first().click();
  await expect(page).toHaveURL(new URL(href!,page.url()).href);
 }
});

test('home builds discovery floors from navigation and keeps the page dense',async({page})=>{
 await page.goto('/');
 await expect(page.locator('h1')).toHaveCount(1);
 expect(await page.locator('[data-floor]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-floor')))).toEqual(['hero','featured','about','category-guides','category-characters','category-weapons','faq']);
 expect(await page.locator('[data-floor], [data-ad-placement="a2"]').evaluateAll(nodes=>nodes.slice(0,4).map(node=>node.getAttribute('data-floor')??node.getAttribute('data-ad-placement')))).toEqual(['hero','featured','a2','about']);
 await expect(page.locator('main h2')).toHaveCount(6);
 await expect(page.locator('[data-floor="featured"] .home-featured-track-set').first().locator('.home-discovery-card')).toHaveCount(6);
 await expect(page.locator('[data-floor="featured"] .home-featured-track-set[aria-hidden="true"] .home-discovery-card')).toHaveCount(6);
 await expect(page.locator('[data-floor="featured"] .home-featured-controls button')).toHaveCount(3);
 await expect(page.locator('[data-floor="category-guides"] .home-discovery-card')).toHaveCount(8);
 await expect(page.locator('[data-floor="category-guides"] .home-discovery-card__meta')).toHaveCount(0);
 await expect(page.locator('[data-floor="featured"] .home-discovery-card__meta')).not.toHaveCount(0);
 await expect(page.locator('[data-floor="category-guides"] .home-discovery-card--hover-reveal')).toHaveCount(8);
 await expect(page.locator('[data-floor="category-guides"] .home-discovery-card--hover-reveal>.media-slot')).toHaveCount(8);
 await expect(page.locator('[data-floor="category-weapons"] .weapon-shuffle-grid')).toHaveCount(1);
 await expect(page.locator('[data-floor="category-weapons"] .weapon-shuffle-tile')).toHaveCount(16);
 await expect(page.locator('[data-floor="category-characters"] .character-spotlight-card')).toHaveCount(3);
 await expect(page.locator('[data-floor="category-characters"] .character-spotlight-avatar img')).toHaveCount(3);
 await expect(page.locator('[data-floor="category-characters"] a[href="/characters"]')).toHaveCount(1);
 await expect(page.locator('.home-category-floor .floor-heading-row a')).toHaveCount(0);
 await expect(page.locator('[data-floor="category-weapons"] a[href="/weapons"]')).toHaveCount(1);
 await expect(page.locator('a[href="#"]')).toHaveCount(0);
 await expect(page.locator('body')).not.toContainText('↗');
 await expect(page.locator('.ui-arrow-right')).not.toHaveCount(0);
 const heroMedia=page.locator('[data-media-id="hero"]');
 await expect(heroMedia).toHaveCount(1);
 await expect(heroMedia.locator('img')).toHaveCount(1);
 await expect(page.locator('[data-floor="category-bosses"], [data-floor="category-mods"]')).toHaveCount(0);
 const heroHeight=await page.locator('[data-floor="hero"]').evaluate(element=>element.getBoundingClientRect().height);
 expect(heroHeight).toBeGreaterThanOrEqual(640);expect(heroHeight).toBeLessThanOrEqual(781);
 const floorHeadingSizes=await page.evaluate(()=>({guides:getComputedStyle(document.querySelector('[data-floor="category-guides"] h2')!).fontSize,characters:getComputedStyle(document.querySelector('[data-floor="category-characters"] h2')!).fontSize}));
 expect(floorHeadingSizes.characters).toBe(floorHeadingSizes.guides);
 await expect(page.locator('.hero-actions .button').nth(1)).toHaveClass(/button-secondary/);
 expect(Math.round((await page.locator('.hero-actions .button').first().boundingBox())!.height)).toBe(46);
 const guideGallery=await page.locator('[data-floor="category-guides"] .home-discovery-grid').evaluate(element=>{const card=element.firstElementChild!,image=card.querySelector<HTMLElement>('.media-slot')!,heading=element.parentElement!.querySelector<HTMLElement>('h2')!;return{columns:getComputedStyle(element).gridTemplateColumns.split(' ').length,gap:getComputedStyle(element).gap,cardRadius:getComputedStyle(card).borderRadius,radiusToken:getComputedStyle(document.documentElement).getPropertyValue('--radius-lg').trim(),cardHeight:Math.round(card.getBoundingClientRect().height),imageRatio:image.getBoundingClientRect().width/image.getBoundingClientRect().height,headingLines:Math.round(heading.getBoundingClientRect().height/parseFloat(getComputedStyle(heading).lineHeight))};});
 expect(guideGallery).toMatchObject({columns:4,gap:'16px'});expect(guideGallery.cardHeight).toBeGreaterThan(180);expect(guideGallery.cardHeight).toBeLessThan(300);expect(guideGallery.headingLines).toBeLessThanOrEqual(2);expect(guideGallery.cardRadius).toBe(guideGallery.radiusToken);expect(guideGallery.imageRatio).toBeGreaterThan(1.7);
 const guideCards=page.locator('[data-floor="category-guides"] .home-discovery-card--hover-reveal');
 const guideCardTops=await guideCards.evaluateAll(cards=>cards.map(card=>Math.round(card.getBoundingClientRect().top)));
 expect(new Set(guideCardTops.slice(0,4)).size).toBe(1);expect(new Set(guideCardTops.slice(4)).size).toBe(1);
 await guideCards.first().hover();await page.waitForTimeout(800);
 const hoverState=await guideCards.evaluateAll(cards=>cards.slice(0,2).map(card=>({opacity:getComputedStyle(card).opacity,filter:getComputedStyle(card).filter,transform:getComputedStyle(card).transform})));
 expect(hoverState[0]).toMatchObject({opacity:'1',filter:'none'});expect(hoverState[0].transform).not.toBe('none');
 expect(hoverState[1]).toMatchObject({opacity:'0.6',filter:'blur(2px)'});expect(hoverState[1].transform).not.toBe('none');
 const footerColumns=page.locator('nav.site-footer-column');
 await expect(footerColumns).toHaveCount(4);
 expect(await footerColumns.evaluateAll(columns=>columns.map(column=>({heading:column.querySelector('h2.site-footer-heading')?.textContent?.trim(),labelledBy:column.getAttribute('aria-labelledby')})))).toEqual([
  {heading:'Navigation',labelledBy:'footer-navigation'},
  {heading:'Featured',labelledBy:'footer-featured'},
  {heading:'About & Policies',labelledBy:'footer-about-policies'},
  {heading:'Community',labelledBy:'footer-community'},
 ]);
 const faq=page.locator('.home-faq-item').first();await faq.locator('.home-faq-question').click();await expect(faq).toHaveAttribute('data-expanded','true');await expect(faq.locator('.home-faq-answer-body')).not.toHaveAttribute('inert','');
 await page.setViewportSize({width:390,height:844});await page.reload();
 const mobile=await page.evaluate(()=>{const characterGrid=document.querySelector<HTMLElement>('[data-floor="category-characters"] .character-spotlight-grid')!,guideCard=document.querySelector<HTMLElement>('[data-floor="category-guides"] .home-discovery-card')!,guideImage=guideCard.querySelector<HTMLElement>('.media-slot')!,guideHeading=document.querySelector<HTMLElement>('[data-floor="category-guides"] h2')!,mobileAd=document.querySelector<HTMLElement>('[data-ad-placement="a1"] .ad-placeholder-canvas')!;return{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,pageHeight:document.body.scrollHeight,cardLefts:[...document.querySelectorAll('[data-floor="featured"] .home-featured-track-set:first-child .home-discovery-card')].slice(0,2).map(card=>Math.round(card.getBoundingClientRect().left)),guideColumns:getComputedStyle(document.querySelector('[data-floor="category-guides"] .home-discovery-grid')!).gridTemplateColumns.split(' ').length,guideCardHeight:Math.round(guideCard.getBoundingClientRect().height),guideImageRatio:guideImage.getBoundingClientRect().width/guideImage.getBoundingClientRect().height,guideHeadingRight:guideHeading.getBoundingClientRect().right,guideHeadingWhiteSpace:getComputedStyle(guideHeading).whiteSpace,characterScrollable:characterGrid.scrollWidth>characterGrid.clientWidth,mobileAd:[Math.round(mobileAd.getBoundingClientRect().width),Math.round(mobileAd.getBoundingClientRect().height)]};});
 expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);expect(mobile.cardLefts[1]).toBeGreaterThan(mobile.cardLefts[0]);expect(mobile.guideColumns).toBe(2);expect(mobile.guideCardHeight).toBeGreaterThan(150);expect(mobile.guideCardHeight).toBeLessThan(230);expect(mobile.guideImageRatio).toBeGreaterThan(1.7);expect(mobile.guideHeadingRight).toBeLessThanOrEqual(mobile.clientWidth);expect(mobile.guideHeadingWhiteSpace).toBe('normal');expect(mobile.characterScrollable).toBe(true);expect(mobile.pageHeight).toBeLessThan(8500);expect(mobile.mobileAd).toEqual([320,50]);
 expect(Math.round((await page.locator('.hero-actions .button').first().boundingBox())!.height)).toBe(52);
});

test('home guide heading wraps inside a 320px reflow viewport',async({page})=>{
 await page.setViewportSize({width:320,height:844});await page.goto('/');
 const layout=await page.locator('[data-floor="category-guides"] h2').evaluate(element=>({
  clientWidth:document.documentElement.clientWidth,
  scrollWidth:document.documentElement.scrollWidth,
  headingRight:element.getBoundingClientRect().right,
  whiteSpace:getComputedStyle(element).whiteSpace,
 }));
 expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
 expect(layout.headingRight).toBeLessThanOrEqual(layout.clientWidth);
 expect(layout.whiteSpace).toBe('normal');
});

test('footer link groups expose labelled navigation landmarks',async({page})=>{
 await page.goto('/');
 const columns=page.locator('nav.site-footer-column');await expect(columns).toHaveCount(4);
 expect(await columns.evaluateAll(nodes=>nodes.map(node=>({heading:node.querySelector('h2.site-footer-heading')?.textContent?.trim(),labelledBy:node.getAttribute('aria-labelledby')})))).toEqual([
  {heading:'Navigation',labelledBy:'footer-navigation'},
  {heading:'Featured',labelledBy:'footer-featured'},
  {heading:'About & Policies',labelledBy:'footer-about-policies'},
  {heading:'Community',labelledBy:'footer-community'},
 ]);
});

test('footer navigation follows the header top-level order',async({page})=>{
 await page.goto('/');
 const order=await page.evaluate(()=>({
  header:[...document.querySelectorAll('.site-navigation>.site-nav-item>a.site-nav-link')].map(link=>link.getAttribute('href')),
  footer:[...document.querySelectorAll('.site-footer-column:first-of-type a')].map(link=>link.getAttribute('href')),
 }));
 expect(order.footer).toEqual(order.header);
});

test('Japanese homepage uses translated content across generated floors',async({page})=>{
 await page.goto('/ja');
 await expect(page.locator('[data-floor="hero"]')).toContainText('テンプレート');
 await expect(page.locator('[data-floor="about"]')).toContainText('ゲーム');
 await expect(page.locator('.site-footer-column').first()).toContainText('ナビゲーション');
 await expect(page.locator('main')).not.toContainText('Fictional sample');
});
