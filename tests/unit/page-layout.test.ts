import {expect,it} from 'vitest';
import {pageSchema} from '../../src/content/schemas/page';
import {homeSchema} from '../../src/content/schemas/home';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
it('plain articles accept MDX without requiring fictional guide statistics',async()=>{
 const {sourcePath,body,bodyLineOffset,mdxSource,...page}=(await siteFixture()).pages[0];void sourcePath;void body;void bodyLineOffset;void mdxSource;
 expect(pageSchema.safeParse({...page,guide:undefined}).success).toBe(true);
});
it('guide table and route references are checked before rendering',async()=>{
 const input=await siteFixture();input.pages[0].guide={eyebrow:'Chapter',title:'Start',stats:[{label:'Time',value:null}],table:'missing-table',route:null};
 expect(()=>buildIndex(input,{preview:false})).toThrow(/guide.table.*missing-table/);
});
it('featured pinned content IDs cannot be duplicated',async()=>{
 const home=(await siteFixture()).homes[0];const {sourcePath,...content}=home;void sourcePath;
 expect(homeSchema.safeParse({...content,featured:{...content.featured,pinnedIds:['first-steps','first-steps']}}).success).toBe(false);
});
