import {expect,it} from 'vitest';
import {getLocaleFromSegments,resolveRoute} from '../../src/content/resolve-route';
import {buildIndex} from '../../src/content/build-index';
import {siteFixture} from './site-fixture';
it('recognizes only configured locale prefixes and resolves exact paths',async()=>{
 const index=buildIndex(await siteFixture(),{preview:false});
 expect(getLocaleFromSegments([],index.site)).toBe('en');expect(getLocaleFromSegments(['ja','missing'],index.site)).toBe('ja');expect(getLocaleFromSegments(['fr'],index.site)).toBe('en');
 expect(resolveRoute('/ja/guides/hajime',index)?.contentId).toBe('first-steps');expect(resolveRoute('/ja/guides/first-steps',index)).toBeUndefined();expect(resolveRoute('/en',index)).toBeUndefined();
});
