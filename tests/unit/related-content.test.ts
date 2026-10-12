import {expect,it} from 'vitest';
import {buildIndex} from '../../src/content/build-index';
import {buildRelatedContent} from '../../src/components/content/related-content';
import {siteFixture} from './site-fixture';

it('prioritizes explicit relations, then adjacent pages, without recommending the current page',async()=>{
 const input=await siteFixture();const current=input.pages.find(page=>page.locale==='en')!;
 current.order=10;current.related=['fourth'];
 for(const [id,order] of [['second',20],['third',30],['fourth',40]] as const)input.pages.push({...current,id,slug:id,title:id,order,related:[],previous:undefined,next:undefined,sourcePath:`content/en/pages/${id}.mdx`});
 const index=buildIndex(input,{preview:false});const page=index.pagesByKey['en:first-steps'];
 expect(buildRelatedContent(index,page).map(item=>item.id)).toEqual(['fourth','second','third']);
});
