import {it,expect} from 'vitest';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {recordSchema} from '../../src/content/schemas/record';
import {characterDetailModel} from '../../src/templates/character-detail/model';
import {siteFixture} from './site-fixture';
import {languageAlternates} from '../../src/seo/alternates';
import {createSitemap} from '../../src/seo/sitemap';

const sample=()=>readSite('examples/site-a');
it('links the character card to its localized detail without mutating content inputs',async()=>{
 const input=await sample();const index=buildIndex(input,{preview:false});
 for(const locale of ['en','ja']){
  const character=index.records[`${locale}:demo-guide`];expect(character.type).toBe('character');
  if(character.type!=='character')throw new Error('Expected character');
  expect(character.contentId).toBe('demo-guide-detail');
  expect(index.translationGroups[character.contentId!][locale]).toBe(`${locale==='ja'?'/ja':''}/characters/demo-guide`);
  const original=input.records.find(row=>row.id==='demo-guide'&&row.locale===locale);
  expect(original&&'contentId' in original?original.contentId:undefined).toBeNull();
 }
});
it('does not invent links for missing translations, drafts, or removed pages',async()=>{
 const input=await sample();const detail=input.pages.find(page=>page.id==='demo-guide-detail'&&page.locale==='ja')!;
 detail.status='draft';let index=buildIndex(input,{preview:false});
 expect(index.translationGroups['demo-guide-detail'].ja).toBeUndefined();
 expect(index.records['ja:demo-guide']).toHaveProperty('contentId',null);
 index=buildIndex(input,{preview:true});expect(index.records['ja:demo-guide']).toHaveProperty('contentId','demo-guide-detail');
 input.pages=input.pages.filter(page=>page.id!=='demo-guide-detail');index=buildIndex(input,{preview:false});
 expect(index.records['en:demo-guide']).toHaveProperty('contentId',null);
});
it('rejects two detail pages for the same character and locale',async()=>{
 const input=await sample();const detail=input.pages.find(page=>page.id==='demo-guide-detail'&&page.locale==='en')!;
 input.pages.push({...detail,id:'duplicate-guide',slug:'duplicate-guide',sourcePath:'duplicate.mdx'});
 expect(()=>buildIndex(input,{preview:false})).toThrow(/duplicate.mdx.*demo-guide.*already has detail page/);
});
it('rejects a configured card link that conflicts with its detail page',async()=>{
 const input=await sample();const character=input.records.find(row=>row.id==='demo-guide'&&row.locale==='en')!;
 if(character.type!=='character')throw new Error('Expected character');character.contentId='first-steps';
 expect(()=>buildIndex(input,{preview:false})).toThrow(/contentId.*first-steps.*conflicts/);
});
it.each(['missing','wrong-type','missing-icon','missing-primary'] as const)('rejects broken detail references: %s',async scenario=>{
 const input=await sample();const record=input.records.find(row=>row.type==='character-detail'&&row.locale==='en')!;
 if(record.type!=='character-detail')throw new Error('Expected detail');
 if(scenario==='missing')record.characterId='missing-character';
 if(scenario==='wrong-type')record.characterId='practice-blade';
 if(scenario==='missing-icon')record.skills[0].iconAssetId='missing-icon';
 if(scenario==='missing-primary')input.pages.find(page=>page.id==='demo-guide-detail'&&page.locale==='en')!.records=[];
 expect(()=>buildIndex(input,{preview:false})).toThrow(scenario==='missing-icon'?/missing-icon/:scenario==='missing-primary'?/exactly one character-detail/:/requires an existing character/);
});
it('rejects duplicate skill and acquisition IDs while allowing confirmed rows without sources',async()=>{
 const input=await sample();const record=input.records.find(row=>row.type==='character-detail')!;
 if(record.type!=='character-detail')throw new Error('Expected detail');const {sourcePath,...metadata}=record;void sourcePath;
 expect(recordSchema.safeParse({...metadata,skills:[record.skills[0],record.skills[0]]}).success).toBe(false);
 expect(recordSchema.safeParse({...metadata,skills:[{...record.skills[0],verification:'confirmed'}]}).success).toBe(true);
 expect(recordSchema.safeParse({...metadata,acquisition:{...record.acquisition,steps:[{...record.acquisition.steps[0],verification:'confirmed'}]}}).success).toBe(true);
 expect(recordSchema.safeParse({...metadata,acquisition:{...record.acquisition,steps:[record.acquisition.steps[0],record.acquisition.steps[0]]}}).success).toBe(false);
});
it('preserves optional skill fields and unknown attributes without source headings',async()=>{
 const input=await sample();
 const index=buildIndex(input,{preview:false});const model=characterDetailModel(index,index.pagesByKey['en:demo-guide-detail']);
 expect(model.skills[1]).toMatchObject({cost:null,cooldown:null});expect(model.character.attributes[0].value).toBeNull();
 expect(model).not.toHaveProperty('sources');expect(model.headings.map(heading=>heading.id)).toEqual(['attributes','skills','acquisition']);
});

async function productionDetail(){
 const input=await siteFixture();const examples=await sample();
 input.site.mode='production';input.site.siteUrl='https://wiki.fixture-game.com';input.site.officialLinks.official='https://fixture-game.com';
 input.homes.forEach(home=>home.demo=false);
 input.records=examples.records.filter(record=>record.id==='demo-guide'||record.id==='demo-guide-detail').map(record=>({...record,demo:false}));
 input.assets.push(...examples.assets.filter(asset=>asset.id==='demo-character-guide').map(asset=>({...asset,demo:false})));
 input.pages.forEach(page=>{page.demo=false;page.template='character-detail';page.guide=undefined;page.records=['demo-guide-detail'];});
 return input;
}
it('uses published character detail routes for hreflang and sitemap without manufacturing dates',async()=>{
 const index=buildIndex(await productionDetail(),{preview:false});const route=index.routes['/guides/first-steps'];
 expect(languageAlternates(index,route)).toMatchObject({en:'https://wiki.fixture-game.com/guides/first-steps',ja:'https://wiki.fixture-game.com/ja/guides/hajime'});
 const entry=createSitemap(index).find(item=>item.url.endsWith('/guides/first-steps'));expect(entry).toBeDefined();expect(entry).not.toHaveProperty('lastModified');
});
it.each(['character','portrait','skill-icon'] as const)('production validates indirect character-detail dependencies: %s',async dependency=>{
 const input=await productionDetail();const character=input.records.find(record=>record.id==='demo-guide'&&record.locale==='en')!;
 const detail=input.records.find(record=>record.type==='character-detail'&&record.locale==='en')!;
 if(character.type!=='character'||detail.type!=='character-detail')throw new Error('Missing fixture records');
 input.assets.push({id:'demo-art',src:'/media/demo.svg',width:64,height:64,purpose:'Demo',alt:{en:'Demo',ja:'デモ'},position:'50% 50%',demo:true});
 if(dependency==='character')character.demo=true;
 if(dependency==='portrait')character.assetId='demo-art';
 if(dependency==='skill-icon')detail.skills[0].iconAssetId='demo-art';
 expect(()=>buildIndex(input,{preview:false})).toThrow(/demo.*production|demo asset/);
});
