import {expect,test} from '@playwright/test';
test('demo HTML has canonical metadata and safe factual omissions',async({page,request})=>{
 await page.goto('/guides/first-steps');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://sample-a.example/guides/first-steps');
 await expect(page.locator('link[hreflang]')).toHaveCount(0);
 await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/fictional/i);
 const scripts=await page.locator('script[type="application/ld+json"]').allTextContents();const article=JSON.parse(scripts[0])['@graph'].find((entry:Record<string,unknown>)=>entry['@type']==='Article');
 expect(article).toBeUndefined();expect(JSON.parse(scripts[0])['@graph'].some((entry:Record<string,unknown>)=>entry['@type']==='WebPage')).toBe(true);
 const robots=await (await request.get('/robots.txt')).text();expect(robots).toContain('Disallow: /');
 const sitemap=await (await request.get('/sitemap.xml')).text();expect(sitemap).not.toContain('<url>');
});
test('raw server HTML has Japanese SEO and unknown pages remain noindex',async({request})=>{
 const html=await(await request.get('/ja/guides/hajime')).text();expect(html).toContain('https://sample-a.example/ja/guides/hajime');expect(html).toMatch(/<title>最初の攻略 \| テンプレート見本 A<\/title>/);
 const response=await request.get('/ja/missing');expect(response.status()).toBe(404);expect(await response.text()).toMatch(/name="robots" content="[^"]*noindex/);
});
