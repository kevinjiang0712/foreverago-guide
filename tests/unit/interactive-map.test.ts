import {readFile} from 'node:fs/promises';
import {expect,it} from 'vitest';
import {recordSchema} from '../../src/content/schemas/record';
import {buildIndex} from '../../src/content/build-index';
import {fixedPageAnchors} from '../../src/content/template-anchors';
import {siteFixture} from './site-fixture';
const load=async()=>JSON.parse(await readFile('tests/fixtures/template-records/maps/interactive-map.json','utf8'));
it('registers the complete map with dimensioned null plates',async()=>{expect(recordSchema.safeParse(await load()).success).toBe(true);});
it('requires exactly one interactive-map record',async()=>{const input=await siteFixture();Object.assign(input.pages[0],{template:'interactive-map',guide:undefined});expect(()=>buildIndex(input,{preview:false})).toThrow(/exactly one interactive-map/);});
it('reserves the seven original sections and main anchor',()=>{expect(fixedPageAnchors('interactive-map')).toEqual(['main','map','legend','locations','progress','how-to','faq','sources']);});
it('rejects duplicate IDs, foreign references, unsafe tones, invalid dimensions and coordinates',async()=>{const r=await load();for(const patch of [{pins:[r.pins[0],r.pins[0]]},{regions:[r.regions[0],r.regions[0]]},{categories:[r.categories[0],r.categories[0]]},{pins:[{...r.pins[0],regionId:'absent'}]},{pins:[{...r.pins[0],categoryId:'absent'}]},{pins:[{...r.pins[0],xPercent:101}]},{pins:[{...r.pins[0],yPercent:-1}]},{regions:[{...r.regions[0],width:0}]},{categories:[{...r.categories[0],tone:'red'}]},{knownTotal:1},{regions:r.regions.map((row:object)=>({...row,knownTotal:0}))},{regions:r.regions.map((row:object)=>({...row,disabled:true}))},{unexpected:true}])expect(recordSchema.safeParse({...r,...patch}).success,JSON.stringify(patch)).toBe(false);});
it('accepts confirmed map and nested rows without sources',async()=>{const r=await load();for(const patch of [{verification:'confirmed'},{pins:[{...r.pins[0],verification:'confirmed'},...r.pins.slice(1)]},{regions:[{...r.regions[0],verification:'confirmed'},...r.regions.slice(1)]},{instructions:[{...r.instructions[0],verification:'confirmed'},...r.instructions.slice(1)]},{faq:[{...r.faq[0],verification:'confirmed'},...r.faq.slice(1)]}])expect(recordSchema.safeParse({...r,...patch}).success).toBe(true);});
it('validates map assets and same-language pin links through the index',async()=>{const input=await siteFixture(),r=await load();for(const patch of [{regions:[{...r.regions[0],imageAssetId:'absent'},r.regions[1]]},{progressImageAssetId:'absent'},{pins:[{...r.pins[0],contentId:'absent'}]}]){input.records=[{...recordSchema.parse({...r,...patch}),sourcePath:'map.json'}];expect(()=>buildIndex(input,{preview:false})).toThrow(/map.json.*absent/);}});
it('rejects reachable demo map records and media in production',async()=>{const input=await siteFixture(),r=await load();input.site.mode='production';input.site.siteUrl='https://wiki.garden';input.homes.forEach(home=>{home.demo=false;home.hero.video=null;});input.pages.forEach(page=>page.demo=false);input.pages[0].records=['interactive-map'];input.records=[{...recordSchema.parse(r),sourcePath:'map.json'}];expect(()=>buildIndex(input,{preview:false})).toThrow(/map.json.*demo/);const asset={...input.assets[0],id:'map-image',src:'/media/map.png',demo:true};input.assets.push(asset);for(const patch of [{regions:[{...r.regions[0],imageAssetId:asset.id},r.regions[1]]},{progressImageAssetId:asset.id}]){input.records=[{...recordSchema.parse({...r,demo:false,...patch}),sourcePath:'map.json'}];expect(()=>buildIndex(input,{preview:false})).toThrow(/map.json.*demo asset/);}});
it('accepts confirmed nested claims and rejects root sources',async()=>{
 const r=await load();expect(recordSchema.safeParse({...r,pins:[{...r.pins[0],verification:'confirmed'}]}).success).toBe(true);
 expect(recordSchema.safeParse({...r,sources:[]}).success).toBe(false);
});
import {mkdtemp,cp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareContent} from '../../scripts/prepare-content';
import {interactiveMapModel} from '../../src/templates/interactive-map/model';
it('generates frozen MDX map routes and links, rejects shadowed anchors and missing fragments',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-map-integration-'));
 try{
  for(const dir of ['config','content','public'])await cp(join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});await mkdir(join(root,'content/en/pages'),{recursive:true});await mkdir(join(root,'content/en/records'),{recursive:true});await cp('tests/fixtures/template-records/maps/interactive-map.json',join(root,'content/en/records/interactive-map.json'));const pagePath=join(root,'content/en/pages/interactive-map.mdx'),source=await readFile('tests/fixtures/template-records/maps/interactive-map.mdx','utf8');await writeFile(pagePath,source);
  const index=await prepareContent(root,{preview:false});expect(index.routes['/guides/interactive-map'].kind).toBe('page');const model=interactiveMapModel(index,index.pagesByKey['en:interactive-map']);expect(model.headings.map(heading=>heading.id)).toEqual(['map','legend','locations','progress','how-to','faq']);expect(model.record.pins).toHaveLength(5);expect(await readFile(join(root,'.generated/mdx-imports.ts'),'utf8')).toContain('interactive-map.mdx');
  await writeFile(pagePath,source+'\n## Map\n');await expect(prepareContent(root,{preview:false})).rejects.toThrow(/interactive-map.mdx.*map.*reserved/);await writeFile(pagePath,source+'\n[Broken](#missing-pin)\n');await expect(prepareContent(root,{preview:false})).rejects.toThrow(/interactive-map.mdx.*missing-pin.*unknown heading/);
 }finally{await rm(root,{recursive:true,force:true});}
});
