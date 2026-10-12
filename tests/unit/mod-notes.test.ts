import {expect,it} from 'vitest';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {articleOutline} from '../../src/content/article-outline';
it('omits empty reference sections and preserves supplied section titles',async()=>{
 const index=buildIndex(await readSite('examples/site-a'),{preview:false});const page=index.pagesByKey['en:mod-index-reference'];const record=index.records['en:mod-index'];if(record.type!=='mod-index')throw new Error('Missing fixture');
 expect(articleOutline(index,page).map(section=>section.id)).toEqual(['article-body','install','compat','safety','faq','legal']);
 record.legalNotes=[];record.safetyNotes=[];record.safetyAssetId=null;record.safetyCaption='';
 const outline=articleOutline(index,page);expect(outline.map(section=>section.id)).not.toContain('safety');expect(outline.map(section=>section.id)).not.toContain('legal');expect(outline.find(section=>section.id==='install')?.title).toBe(record.sections.install.title);
});
