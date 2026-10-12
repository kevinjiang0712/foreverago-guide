import {expect,test} from '@playwright/test';
const origin='https://wiki.fixture-game.com';
test('actual production HTML reciprocates only real localized URLs',async({page,request})=>{
 for(const [path,locale,other] of [['/guides/first-steps','en','/ja/guides/hajime'],['/ja/guides/hajime','ja','/guides/first-steps']]){
  const response=await page.goto(path);expect(response?.status()).toBe(200);await expect(page.locator('html')).toHaveAttribute('lang',locale);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',origin+path);await expect(page.locator('link[hreflang]')).toHaveCount(3);
  await expect(page.locator(`link[hreflang="${locale==='en'?'ja':'en'}"]`)).toHaveAttribute('href',origin+other);await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href',origin+'/guides/first-steps');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index, follow');await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  const raw=await(await request.get(path)).text();expect(raw).toContain(`href="${origin+path}"`);expect(raw).toMatch(/<link[^>]*hreflang="en"/i);expect(raw).toMatch(/<link[^>]*hreflang="ja"/i);
  const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())['@graph'];expect(graph.some((entry:Record<string,unknown>)=>entry['@type']==='Article')).toBe(false);expect(graph.some((entry:Record<string,unknown>)=>entry['@type']==='WebPage')).toBe(true);
 }
});
test('sitemap, redirects, robots and visible breadcrumbs match generated routes',async({request,page})=>{
 const xml=await(await request.get('/sitemap.xml')).text();expect(xml.match(/<url>/g)).toHaveLength(6);expect(xml).not.toContain('<lastmod>');expect(xml).not.toContain('/old-guide');expect(xml).toContain(`<loc>${origin}/ja/guides/hajime</loc>`);
 const robots=await(await request.get('/robots.txt')).text();expect(robots).toContain('Allow: /');expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
 const redirect=await request.get('/old-guide',{maxRedirects:0});expect(redirect.status()).toBe(308);expect(redirect.headers().location).toBe('/guides/first-steps');
 await page.goto('/guides');const visible=await page.locator('.breadcrumb').innerText();expect(visible.replace(/\s+/g,' ').trim()).toBe('Home / Guides');
 const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())['@graph'];expect(graph.find((entry:Record<string,unknown>)=>entry['@type']==='BreadcrumbList').itemListElement).toHaveLength(2);
});
