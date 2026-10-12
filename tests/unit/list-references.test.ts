import {catalogModel} from '../../src/templates/catalog-page/model';
import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';

it.each(['missing','constructor'])('rejects untranslated list group %s',async group=>{
 const input=await siteFixture();input.pages[0].listGroup=group;
 expect(()=>buildIndex(input,{preview:false})).toThrow(new RegExp(`listGroup.*${group}.*translation`));
});
it('keeps list groups and category art in the unified index',async()=>{
 const input=await siteFixture();input.pages[0].listGroup='articles';input.dictionaries.find(dictionary=>dictionary.locale==='en')!.listGroups={articles:'Articles'};
 input.categories[0].heroAsset=input.assets[0].id;
 const index=buildIndex(input,{preview:false});
 expect(index.pagesByKey['en:first-steps'].listGroup).toBe('articles');
 expect(index.categories['en:guides'].heroAsset).toBe(input.assets[0].id);
});
it('rejects a missing category hero with its config location',async()=>{
 const input=await siteFixture();input.categories[0].heroAsset='missing';
 expect(()=>buildIndex(input,{preview:false})).toThrow(/config\/categories.json.*guides.heroAsset.*missing.*unknown asset/);
});

import {readSite} from '../../src/content/read-site';
import {listPageModel} from '../../src/templates/list-page/model';
import {renderedTemplate} from '../../src/content/template-layouts';
import {templateNames} from '../../src/content/template-names';
import {listTypes} from '../../src/content/template-layouts';
import {pageSchema} from '../../src/content/schemas/page';
import {pageTemplateAnchors} from '../../src/content/template-anchors';
it('registers eight static layouts plus record-backed build detail',()=>{expect(new Set(templateNames.map(renderedTemplate)).size).toBe(8);});
it.each(['examples/site-a','examples/site-b'])('resolves catalogue guides and filter records in %s',async root=>{
 const index=buildIndex(await readSite(root),{preview:false});
 const lists=Object.values(index.pagesByKey).filter(page=>page.listGuide);expect(lists).toHaveLength(root.endsWith('site-b')?4:8);
 for(const page of lists){const guide=index.pagesByKey[`${page.locale}:${page.listGuide}`];expect(guide.template).toBe('wiki-page');expect(guide.records).toContain(guide.articleRecord);const model=listPageModel(index,page);expect(model.entries.length).toBeGreaterThan(0);expect(model.perPage).toBe(30);for(const entry of model.entries)if(entry.path)expect(index.routes[entry.path]).toBeDefined();}
});
it.each(['missing','wrong-record','unmoved-body'])('rejects invalid catalogue migration: %s',async change=>{
 const input=await readSite('examples/site-a');const page=input.pages.find(page=>page.template==='mod-index'&&page.locale==='en')!;
 if(change==='missing')page.listGuide=undefined;
 if(change==='wrong-record'){const article=input.pages.find(article=>article.id===page.listGuide&&article.locale===page.locale)!;article.articleRecord='boss-catalogue';article.records=['boss-catalogue'];}
 if(change==='unmoved-body')page.body='Unmoved installation instructions';
 expect(()=>buildIndex(input,{preview:false})).toThrow(change==='unmoved-body'?/move list body/:/listGuide/);
});

it.each(listTypes)('accepts an explicit null guide on %s without a reference article',async template=>{
 const input=await readSite('examples/site-a');
 const page=input.pages.find(page=>page.template===template&&page.locale==='en')!;
 const guideId=page.listGuide;
 page.listGuide=null;
 input.pages=input.pages.filter(candidate=>candidate.locale!==page.locale||candidate.id!==guideId);
 for(const record of input.records)if(record.locale==='en'&&record.type==='boss-index')for(const entity of record.entities)if(entity.contentId===guideId)entity.contentId=null;
 const index=buildIndex(input,{preview:false});
 const indexedPage=index.pagesByKey[`en:${page.id}`];
 expect(indexedPage.listGuide).toBeNull();
 expect((renderedTemplate(indexedPage.template)==='catalog-page'?catalogModel(index,indexedPage):listPageModel(index,indexedPage)).entries.length).toBeGreaterThan(0);
 expect(pageTemplateAnchors(index,indexedPage)).toEqual(['main','browse']);
});

it.each(listTypes)('requires an explicit guide ID or null in the %s input schema',template=>{
 const metadata={id:'catalogue',locale:'en',slug:'catalogue',category:'guides',template,title:'Catalogue',description:'Demonstration catalogue.'};
 expect(pageSchema.safeParse({...metadata,listGuide:null}).success).toBe(true);
 expect(pageSchema.safeParse({...metadata,listGuide:'catalogue-reference'}).success).toBe(template!=='database-index');
 for(const listGuide of [undefined,'','   ','bad/path',false]){
  const result=pageSchema.safeParse({...metadata,listGuide});
  expect(result.success).toBe(false);
  if(!result.success)expect(result.error.issues.some(issue=>issue.path.join('.')==='listGuide')).toBe(true);
 }
});

it.each(['unknown','other-language','other-category','wrong-template','unpublished','no-shared-record'])('rejects invalid supplied guide: %s',async change=>{
 const input=await readSite('examples/site-a');
 const page=input.pages.find(page=>page.template==='mod-index'&&page.locale==='en')!;
 const guide=input.pages.find(candidate=>candidate.id===page.listGuide&&candidate.locale===page.locale)!;
 if(change==='unknown')page.listGuide='missing-reference';
 if(change==='other-language')input.pages=input.pages.filter(candidate=>candidate!==guide);
 if(change==='other-category')guide.category='guides';
 if(change==='wrong-template')page.listGuide=input.pages.find(candidate=>candidate.template==='character-detail'&&candidate.locale==='en')!.id;
 if(change==='unpublished')guide.status='draft';
 if(change==='no-shared-record')delete guide.articleRecord;
 expect(()=>buildIndex(input,{preview:true})).toThrow(/listGuide/);
});

it('does not make build detail articles optional when its library guide is disabled',async()=>{
 const input=await readSite('examples/site-a');
 const library=input.pages.find(page=>page.template==='build-library'&&page.locale==='en')!;
 library.listGuide=null;
 const build=input.records.find(record=>record.type==='build'&&record.locale==='en')!;
 input.pages=input.pages.filter(page=>page.locale!=='en'||page.articleRecord!==build.id);
 expect(()=>buildIndex(input,{preview:false})).toThrow(/requires exactly one published wiki-page/);
});
