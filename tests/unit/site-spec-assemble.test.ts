import {afterAll,expect,it} from 'vitest';
import {copyFile,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assembleSite} from '../../scripts/assemble-site';
import {readPreset} from '../../src/content/theme';
import {themeColorTokens} from '../../scripts/site-spec-load';

const templateRoot=process.cwd();
const temporaryRoots:string[]=[];
afterAll(async()=>{if(process.env.SITE_SPEC_KEEP_FIXTURE)return;for(const root of temporaryRoots)await rm(root,{recursive:true,force:true});});
const length=(value:string,count:number)=>value.padEnd(count,'x').slice(0,count).replace(/\s$/,'x');
async function json(root:string,path:string,value:unknown){const file=join(root,path);await mkdir(join(file,'..'),{recursive:true});await writeFile(file,`${JSON.stringify(value,null,2)}\n`);}
function changeColor(value:string){
 if(/#[0-9a-f]{6}/i.test(value))return value.replace(/#[0-9a-f]{6}/i,match=>{const color=parseInt(match.slice(1),16);return `#${(color===0xffffff?color-1:color+1).toString(16).padStart(6,'0')}`;});
 if(/rgba\(\d+,/i.test(value))return value.replace(/rgba\((\d+),/i,(_,number:string)=>`rgba(${Number(number)+1},`);
 throw new Error(`Unexpected color token: ${value}`);
}
async function makePackage(root:string){
 const pack=join(root,'new-site/site-spec');await mkdir(join(pack,'media'),{recursive:true});
 const image='article-shrine-atmosphere.webp';
 await copyFile(join(templateRoot,'examples/site-a/public/media',image),join(pack,'media',image));
 const font=join(templateRoot,'node_modules/next/dist/next-devtools/server/font/geist-latin.woff2');
 await copyFile(font,join(pack,'media/font.woff2'));
 await writeFile(join(pack,'media/logo.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#234567"/></svg>');
 const seo=(subject:string)=>({title:length(`${subject} Wiki Guide and Reference`,55),description:length(`${subject} wiki reference with practical walkthroughs, clear navigation, useful examples and independent game information for new and returning readers.`,155),image:'hero',noindex:false});
 await json(pack,'site.json',{siteId:'test-game',siteUrl:'https://test-game-wiki.org/',defaultLocale:'en',locales:['en'],gameName:'Test Game',logoAssetId:'logo',officialLinks:{official:null,steam:null,discord:null,youtube:null},navigation:{en:[{label:'Home',target:{type:'home'},children:[]},{label:'Guides',target:{type:'category',id:'guides'},children:[]},{label:'About',target:{type:'content',id:'about'},children:[]},{label:'Contact',target:{type:'content',id:'contact'},children:[]}]},contactEmail:null,effectiveDate:'2026-01-01',footerDescription:length('An independent reference for the Test Game community',45),defaultDescription:'Independent game reference.'});
 await json(pack,'categories.json',[{id:'guides',slug:'guides',order:1}]);
 await json(pack,'en/categories.json',{guides:{title:'Guides',description:length('Practical reference and walkthrough articles',50),seo:seo('Test Game guides')}});
 await json(pack,'assets.json',[{id:'logo',file:'logo.svg',alt:null},{id:'hero',file:image,alt:'A fictional mountain shrine at dusk'}]);
 const day=await readPreset(templateRoot,'onimusha','day'),night=await readPreset(templateRoot,'onimusha','night');
 const colors=(preset:Record<string,string>)=>Object.fromEntries(themeColorTokens.map(key=>[key,changeColor(preset[key])]));
 await json(pack,'theme.json',{defaultMode:'night',common:{'--font-display':'"Geist"','--font-ui':'"Geist"','--display-weight':'400','--radius':'3px','--radius-lg':'6px','--radius-chip':'99px'},day:colors(day),night:colors(night),fonts:[{family:'Geist',src:'/media/font.woff2',weight:400,style:'normal'}]});
 const ids=Array.from({length:8},(_,i)=>`guide-${i+1}`);
 await json(pack,'en/home.json',{description:length('Independent reference for every Test Game visitor',60),seo:seo('Test Game home'),hero:{eyebrow:'Game Wiki',description:length('Find practical reference articles and explore Test Game',55),assetId:'hero',video:null,stats:null,cta:[{label:'Read guides',target:{type:'category',id:'guides'}},{label:'Learn about',target:{type:'content',id:'about'}}]},featured:{eyebrow:'Selected guides',title:'Featured articles',description:length('A handpicked set of practical Test Game reference articles',55),articleIds:ids.slice(0,6)},about:{eyebrow:'About this site',title:'Independent game wiki',paragraph:length('This independent Test Game wiki brings together practical reference notes, beginner guidance, and useful walkthroughs in one clear place for readers.',150),facts:Array.from({length:6},(_,i)=>({label:`Fact ${i+1}`,value:`Value ${i+1}`}))},articleFloors:[{id:'guides-floor',eyebrow:'Explore guides',title:'Practical game guides',description:length('Browse a curated set of useful articles for the Test Game community',60),articleIds:ids}],characterSpotlight:null,weaponShowcase:null,faq:{eyebrow:'Quick answers',title:'Frequently asked questions',description:length('Answers to common questions about this independent game site',55),items:Array.from({length:4},(_,i)=>({question:length(`How should I use this guide ${i+1}?`,30),answer:length('Start with a relevant article and follow the references for more detailed context and helpful examples.',100)}))}});
 await json(pack,'en/characters.json',[]);
 await json(pack,'en/pages.json',ids.map((id,i)=>({id,slug:id,category:'guides',h1:`Guide ${i+1} for Test Game`,description:'A fictional guide article for site assembly.',card:{title:length(`Test Game guide number ${i+1}`,24),description:length('A practical Test Game reference article for curious readers',55),image:'hero'},heroImage:'hero',quickAnswer:[length('This fictional demonstration article explains the reference topic clearly and provides enough detail to verify the generated page content.',130)],seo:seo(`Test Game guide ${i+1}`),authorName:null,publishedAt:null,updatedAt:null,gameVersion:null})));
 for(const id of ids){await mkdir(join(pack,'en/pages'),{recursive:true});await writeFile(join(pack,'en/pages',`${id}.md`),`## Overview\n\nThis is a fictional guide for ${id}. See [the guide category](category:guides).\n`);}
 for(const id of ['about','contact','privacy','terms']){
  await json(pack,`en/policies/${id}.json`,{h1:id[0].toUpperCase()+id.slice(1),description:`Independent Test Game ${id} information.`,heroImage:null,seo:seo(`Test Game ${id}`)});
  await writeFile(join(pack,'en/policies',`${id}.md`),`## ${id[0].toUpperCase()+id.slice(1)}\n\nThis is the fictional ${id} policy page for this test.\n`);
 }
 return join(root,'new-site');
}

it('assembles and safely regenerates a site from a structured package',async()=>{
 const root=await mkdtemp(join(tmpdir(),'site-spec-test-'));temporaryRoots.push(root);
 const target=await makePackage(root);
 const adConfig={mode:'adsterra',adsterra:{allowedHosts:['test-game-wiki.org'],units:{native:{containerId:'container-test-fixture',scriptUrl:'https://ads.example.org/native.js'},left:{key:'test-left',scriptUrl:'https://ads.example.org/left.js'}}}};
 await json(join(target,'site-spec'),'ads.json',adConfig);
 if(process.env.SITE_SPEC_KEEP_FIXTURE)console.log(`Temporary site-spec fixture: ${target}`);
 const first=await assembleSite(target,{templateSnapshotRoot:templateRoot});
 expect(first.mode).toBe('created');expect(first.routes).toBeGreaterThanOrEqual(13);
 const article=await readFile(join(target,'content/en/pages/guide-1.mdx'),'utf8');
 expect(article).toContain('/guides');expect(article).toContain('demo: false');
 const second=await assembleSite(target,{templateSnapshotRoot:templateRoot});expect(second.mode).toBe('regenerated');
 expect(JSON.parse(await readFile(join(target,'config/ads.json'),'utf8'))).toMatchObject(adConfig);
 if(!process.env.SITE_SPEC_KEEP_FIXTURE){
  await writeFile(join(target,'content/en/pages/guide-1.mdx'),`${article}\nmanual change`);
  await expect(assembleSite(target,{templateSnapshotRoot:templateRoot})).rejects.toThrow('generated file changed');
 }
},30000);

it('assembles all three structured families and retains their records on regeneration',async()=>{
 const root=await mkdtemp(join(tmpdir(),'site-spec-catalogue-test-'));temporaryRoots.push(root);
 const target=await makePackage(root),pack=join(target,'site-spec');
 // Synthetic schema fixtures only. This temporary site is never published.
 const base={locale:'en',demo:false,verification:'unverified'};
 const section={eyebrow:'Test fixture',title:'Test fixture section',description:'Synthetic content used only by the assembly test.'};
 const sections=(names:string[])=>Object.fromEntries(names.map(name=>[name,section]));
 const setup={equipment:[{recordId:null,label:'Weapon',value:null}],bestFor:'Schema testing only.',avoidIf:'You need real game advice.',howItWorks:'No game mechanics are asserted.',artifactPriority:[],buildOrder:[],howToPlay:'Use only in the test harness.',risks:'Not real game data.',evidenceNote:'Synthetic automated test fixture.',verification:'unverified'};
 const records=[
  {...base,id:'test-build',type:'build',name:'Test configuration',summary:'A synthetic configuration.',assetId:null,playstyleIds:[],weaponIds:[],facts:[],...setup,variants:[]},
  {...base,id:'test-builds',type:'build-library',sections:sections(['evidence','find','setups','presets','rescue','faq']),evidenceLegend:[],filterOptions:{playstyles:[],weapons:[]},buildIds:['test-build'],presets:[],rescueRows:[],faq:[],columns:{build:'Build',protectFirst:'Protect',ifMissing:'Missing',pivot:'Alternative'}},
  {...base,id:'test-mod',type:'mod',title:'Test mod entry',description:'Synthetic catalogue fixture.',authorName:null,releaseVersion:null,endorsements:null,fileSize:null,categoryId:'utility',tagIds:[],testedVersions:[],updatedAt:null,downloads:null,contentId:'test-mod-page',assetId:null},
  {...base,id:'test-mods',type:'mod-index',sections:sections(['browse','install','compat','safety','faq','legal']),modIds:['test-mod'],currentVersion:null,perPage:30,knownTotal:null,sortOptions:[{id:'listed',label:'Listed'}],categories:[{id:'utility',label:'Utility'}],tags:[],beforeInstall:section,installSteps:[],compatibility:[],safetyNotes:[],safetyAssetId:null,safetyCaption:'No installable files.',faq:[],legalNotes:[]},
  {...base,id:'test-mod-detail',type:'mod-detail',modId:'test-mod',dataVersion:'fixture-1',categoryLabel:'Utility',authorUrl:null,authorNote:'No author is asserted.',gallery:[],sections:sections(['overview','requirements','install','tabs','conflicts','faq','report']),atAGlance:'Test only.',facts:[],evidenceNote:'No real mod.',requirements:[],installSteps:[],filesNote:'No files.',permissionsNote:'No permission asserted.',postsNote:'No posts.',files:[],changelog:[],posts:[],permissions:[],conflicts:[],faq:[],feedbackTarget:null,feedbackOptions:[],tabs:{files:'Files',changelog:'Changes',posts:'Posts',permissions:'Permissions'},columns:{file:'File',uploaded:'Uploaded',notes:'Notes',permission:'Permission',terms:'Terms',requirement:'Requirement',version:'Version',reason:'Reason',status:'Status',mod:'Mod',interaction:'Interaction',resolution:'Resolution'}},
  {...base,id:'test-db',type:'database-index',entryIds:['test-entry'],fields:[{id:'weight',label:'Weight',kind:'number',unit:'kg',compare:true}],categories:[{id:'equipment',label:'Equipment'}],evidenceNote:'Synthetic schema test.'},
  {...base,id:'test-entry',type:'database-entry',databaseId:'test-db',name:'Test entry',summary:'No game values are asserted.',categoryId:'equipment',contentId:'test-entry-page',values:{weight:null},evidenceNote:'Synthetic schema test.',sources:[]},
 ];
 for(const record of records)await json(pack,`en/records/${record.id}.json`,record);
 const page=(id:string,template:string,records:string[],extra:Record<string,unknown>={})=>({...base,id,locale:'en',slug:id,category:'guides',template,title:'Synthetic structured page',description:'Used only to verify the generated page contract.',status:'published',records,assets:{},...extra});
 const pages=[page('test-builds-page','build-library',['test-builds'],{listGuide:null}),page('test-build-page','wiki-page',['test-builds','test-build'],{articleRecord:'test-build'}),page('test-mods-page','mod-index',['test-mods'],{listGuide:null}),page('test-mod-page','mod-detail',['test-mod-detail']),page('test-database','database-index',['test-db'],{listGuide:null}),page('test-entry-page','database-detail',['test-entry'])];
 await json(pack,'en/structured-pages.json',pages);
 await json(pack,'categories.json',[{id:'guides',slug:'guides',order:1,landing:'test-database'}]);
 await mkdir(join(pack,'en/structured-pages'),{recursive:true});
 for(const page of pages)await writeFile(join(pack,`en/structured-pages/${page.id}.md`),page.template.endsWith('index')||page.template==='build-library'?'':'## Test notes\n\nSynthetic fixture. [Catalogue](content:test-database).');
 await assembleSite(target,{templateSnapshotRoot:templateRoot});
 const {readSite}=await import('../../src/content/read-site');const {buildIndex}=await import('../../src/content/build-index');
 const index=buildIndex(await readSite(target),{preview:false});
 expect(index.translationGroups['test-database'].en).toBe('/guides');
 expect(index.records['en:test-entry'].type).toBe('database-entry');
 expect(index.pagesByKey['en:test-build-page'].articleRecord).toBe('test-build');
 expect(index.pagesByKey['en:test-mod-page'].template).toBe('mod-detail');
 await assembleSite(target,{templateSnapshotRoot:templateRoot});
 expect(await readFile(join(target,'content/en/pages/test-entry-page.mdx'),'utf8')).toContain('[Catalogue](/guides)');
 await json(pack,'en/records/test-entry.json',{...records.at(-1),values:{weight:'heavy'}});
 await expect(assembleSite(target,{templateSnapshotRoot:templateRoot})).rejects.toThrow(/values.weight/);
 expect(JSON.parse(await readFile(join(target,'content/en/records/test-entry.json'),'utf8')).values.weight).toBeNull();
},30000);
