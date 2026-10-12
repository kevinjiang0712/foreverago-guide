import {expect,it} from 'vitest';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {buildArticle} from '../../src/content/build-articles';
import {articleOutline} from '../../src/content/article-outline';
it.each(['examples/site-a','examples/site-b'])('each listed build in %s resolves to one article using the original records',async root=>{
 const index=buildIndex(await readSite(root),{preview:false});
 for(const page of Object.values(index.pagesByKey).filter(page=>page.template==='build-library')){
  const library=index.records[`${page.locale}:${page.records[0]}`];if(library.type!=='build-library')throw new Error('Missing library');
  for(const id of library.buildIds){const article=buildArticle(index,page.locale,library.id,id);expect(article.category).toBe(page.category);expect(article.records).toContain(id);expect(articleOutline(index,article).map(section=>section.id)).toContain('equipment');}
 }
});
it.each(['missing','duplicate','wrong-library'])('rejects %s build article mapping',async change=>{
 const input=await readSite('examples/site-a');const article=input.pages.find(page=>page.articleRecord==='demo-steady'&&page.locale==='en')!;
 if(change==='missing')input.pages=input.pages.filter(page=>page!==article);
 if(change==='duplicate')input.pages.push({...article,id:'duplicate-build',slug:'duplicate-build',sourcePath:'duplicate-build.mdx'});
 if(change==='wrong-library')article.records=['demo-steady'];
 expect(()=>buildIndex(input,{preview:false})).toThrow(/build.*(exactly one|library)/);
});
it('empty optional build modules disappear from both article sections and anchors',async()=>{
 const index=buildIndex(await readSite('examples/site-a'),{preview:false}),page=index.pagesByKey['en:demo-steady-detail'];
 const build=index.records['en:demo-steady'];if(build.type!=='build')throw new Error('Missing build');build.variants=[];build.artifactPriority=[];build.buildOrder=[];
 const ids=articleOutline(index,page).map(section=>section.id);expect(ids).not.toContain('variants');expect(ids).not.toContain('priority');expect(ids).not.toContain('build-order');expect(ids).toContain('risks');expect(ids).toContain('evidence');
});

it('variant-only optional modules retain stable deep-link anchors',async()=>{
 const index=buildIndex(await readSite('examples/site-a'),{preview:false}),page=index.pagesByKey['en:demo-steady-detail'];
 const build=index.records['en:demo-steady'];if(build.type!=='build')throw new Error('Missing build');
 build.artifactPriority=[];build.buildOrder=[];build.variants[0].buildOrder=['Example step'];build.variants[0].artifactPriority=[{id:'test',priority:'First',items:'Example',instruction:'Example only'}];
 expect(articleOutline(index,page).map(section=>section.id)).toEqual(expect.arrayContaining(['priority','build-order']));
});
