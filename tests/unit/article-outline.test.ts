import {expect,it} from 'vitest';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {articleOutline} from '../../src/content/article-outline';
import {articleTypes,renderedTemplate} from '../../src/content/template-layouts';
import {pageTemplateAnchors,fixedPageAnchors} from '../../src/content/template-anchors';

it('keeps narrative articles separate from structured mod details',()=>{
 expect(articleTypes.map(renderedTemplate)).toEqual([...Array(4).fill('article-page'),'mod-detail']);
 expect(renderedTemplate('interactive-map')).toBe('interactive-map');
 expect(renderedTemplate('build-library')).toBe('catalog-page');
});
it('source sections and tool anchors are not exposed',async()=>{
 const input=await readSite('examples/site-a');
 const index=buildIndex(input,{preview:false});
 expect(index.pagesByKey['en:first-steps']).not.toHaveProperty('sources');
 for(const page of Object.values(index.pagesByKey))expect(pageTemplateAnchors(index,page)).not.toContain('sources');
});
it('empty weapon modules disappear from both the article and reachable anchors',async()=>{
 const index=buildIndex(await readSite('examples/site-a'),{preview:false});
 const page=index.pagesByKey['en:practice-blade-detail'];
 const record=page.records.map(id=>index.records[`en:${id}`]).find(row=>row.type==='weapon-detail');
 if(record?.type!=='weapon-detail')throw new Error('Missing weapon fixture');
 record.unlockSteps=[];record.moveset=[];record.upgradeNodes=[];record.patchHistory=[];record.buildRefs=[];record.matchups=[];record.pairings=[];record.faq=[];
 expect(articleOutline(index,page).map(section=>section.id)).toEqual(['overview']);
 expect(pageTemplateAnchors(index,page)).toEqual(['main','overview']);
 // Empty section names stay reserved so later data cannot collide with MDX headings.
 expect(fixedPageAnchors(page.template)).toContain('unlock');
});
it('an article with no skill or acquisition data has no empty sections or directory entries',async()=>{
 const index=buildIndex(await readSite('examples/site-a'),{preview:false});
 const page=index.pagesByKey['en:demo-guide-detail'];
 const record=page.records.map(id=>index.records[`en:${id}`]).find(row=>row.type==='character-detail');
 if(record?.type!=='character-detail')throw new Error('Missing character fixture');
 record.skills=[];record.acquisition={steps:[],prerequisites:null,location:null};
 expect(articleOutline(index,page).map(section=>section.id)).toEqual(['article-body','attributes']);
 record.acquisition.location='Known location';
 expect(pageTemplateAnchors(index,page)).toContain('acquisition');
});
