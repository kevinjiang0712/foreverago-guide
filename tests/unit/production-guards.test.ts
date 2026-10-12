import {afterEach,expect,it} from 'vitest';
import {mkdtemp,cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import {prepareContent} from '../../scripts/prepare-content';
import {prepareTheme} from '../../src/content/theme';
import {createSitemap} from '../../src/seo/sitemap';
import {languageAlternates} from '../../src/seo/alternates';
const roots:string[]=[];
async function fixture(){const root=await mkdtemp(join(tmpdir(),'production-guards-'));roots.push(root);await cp('tests/fixtures/production-site',root,{recursive:true});await mkdir(join(root,'public/media'),{recursive:true});return root;}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
const articlePath='content/en/pages/first-steps.mdx';
async function replace(root:string,path:string,from:string,to:string){const file=join(root,path);const source=await readFile(file,'utf8');if(!source.includes(from))throw new Error(`Fixture replacement missing: ${path}: ${from}`);await writeFile(file,source.replace(from,to));}

it.each([
 ['published demo',articlePath,'demo: false','demo: true',/first-steps.mdx.*demo.*published demonstration/],
 ['missing description',articlePath,'description: Isolated test fixture. Never publish this site.','description: ""',/first-steps.mdx.*description/],
 ['invalid locale',articlePath,'locale: en','locale: bad_locale',/first-steps.mdx.*locale.*bad_locale/],
 ['placeholder official domain','config/site.json','https://fixture-game.com','https://example.com',/config\/site.json.*example.com.*demonstration domains/],
 ['self-target redirect','config/site.json','/old-guide','/guides/first-steps',/redirects.0.from.*collision or loop/],
] as const)('production rejects %s with a specific authoring location',async(_label,path,from,to,error)=>{
 const root=await fixture();await replace(root,path,from,to);await expect(prepareContent(root,{preview:false})).rejects.toThrow(error);
});
it('rejects href hash placeholders and duplicate URLs before publishing',async()=>{
 const root=await fixture();const file=join(root,articlePath);const original=await readFile(file,'utf8');
 await writeFile(file,original+'\n[Unconfigured](#)\n');await expect(prepareContent(root,{preview:false})).rejects.toThrow(/first-steps.mdx.*unsupported link URL.*#/);
 await writeFile(file,original);await writeFile(join(root,'content/en/pages/collision.mdx'),original.replace('id: first-steps','id: second-page'));
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/path.*first-steps.*collision/);
});
it('rejects a missing public translation key and an unknown theme preset',async()=>{
 const root=await fixture();const dictionaryPath=join(root,'content/locales/ja.json');const dictionary=JSON.parse(await readFile(dictionaryPath,'utf8'));delete dictionary.ui.close;await writeFile(dictionaryPath,JSON.stringify(dictionary));
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/locales\/ja.json.*ui.close/);
 await cp('src/styles/presets',join(root,'src/styles/presets'),{recursive:true});const theme=JSON.parse(await readFile(join(root,'config/theme.json'),'utf8'));theme.preset='missing-theme';await writeFile(join(root,'config/theme.json'),JSON.stringify(theme));
 await expect(prepareTheme(root)).rejects.toThrow(/missing-theme/);
});
it('a demo draft can coexist with production, but its demo record cannot be referenced by a published page',async()=>{
 const root=await fixture();const original=await readFile(join(root,articlePath),'utf8');
 await writeFile(join(root,'content/en/pages/draft.mdx'),original.replace('id: first-steps','id: demo-draft').replace('slug: first-steps','slug: demo-draft').replace('status: published','status: draft').replace('demo: false','demo: true'));
 const index=await prepareContent(root,{preview:false});expect(index.routes['/guides/demo-draft']).toBeUndefined();expect(index.routes['/guides/first-steps'].indexable).toBe(true);
 await mkdir(join(root,'content/en/records'),{recursive:true});await writeFile(join(root,'content/en/records/sample-table.json'),JSON.stringify({id:'sample-table',locale:'en',type:'table',title:'Demo table',columns:[{id:'value',label:'Value'}],rows:[],demo:true,verification:'unverified'}));
 await replace(root,articlePath,'demo: false','demo: false\nrecords: [sample-table]');
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/records\/sample-table.json.*demo.*sample-table.*not production/);
});
it('deleting a referenced article reports the referring MDX; repairing it restores the index',async()=>{
 const root=await fixture();const original=await readFile(join(root,articlePath),'utf8');const target=join(root,'content/en/pages/target.mdx');
 await writeFile(target,original.replace('id: first-steps','id: target-guide').replace('slug: first-steps','slug: target-guide'));
 await writeFile(join(root,articlePath),original+'\n<ContentLink id="target-guide">Target</ContentLink>\n');await prepareContent(root,{preview:false});
 await rm(target);await expect(prepareContent(root,{preview:false})).rejects.toThrow(/first-steps.mdx.*target-guide/);
 await writeFile(join(root,articlePath),original);expect((await prepareContent(root,{preview:false})).routes['/guides/target-guide']).toBeUndefined();
});
it('noindex pages retain navigation access but leave sitemap and alternates; preview never changes config',async()=>{
 const root=await fixture();await replace(root,articlePath,'demo: false','demo: false\nseo: {noindex: true}');
 const before=await readFile(join(root,'config/site.json'),'utf8');const index=await prepareContent(root,{preview:false});
 expect(index.categories['en:guides'].pages).toContain('en:first-steps');expect(createSitemap(index).some(entry=>entry.url.endsWith('/guides/first-steps'))).toBe(false);
 expect(languageAlternates(index,index.routes['/ja/guides/hajime'])).not.toHaveProperty('en');
 const preview=await prepareContent(root,{preview:true});expect(Object.values(preview.routes).every(route=>!route.indexable)).toBe(true);expect(createSitemap(preview)).toEqual([]);expect(await readFile(join(root,'config/site.json'),'utf8')).toBe(before);
});

it('redirect aliases cannot target each other because destinations require reachable content IDs',async()=>{
 const root=await fixture();const path=join(root,'config/site.json');const site=JSON.parse(await readFile(path,'utf8'));
 site.redirects=[{from:'/loop-a',to:'loop-b',locale:'en',permanent:true},{from:'/loop-b',to:'loop-a',locale:'en',permanent:true}];await writeFile(path,JSON.stringify(site));
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/config\/site.json.*redirects.0.to.*loop-b.*target is not reachable/);
});

it('the author-facing content CLI exits nonzero and names the broken source',async()=>{
 const root=await fixture();await replace(root,articlePath,'## Test section','<ContentLink id=\"missing-page\">Missing</ContentLink>');
 await expect(promisify(execFile)(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),resolve('scripts/check-content.ts')],{cwd:root,env:{...process.env,SITE_ENV:'production'}})).rejects.toMatchObject({code:1,stderr:expect.stringMatching(/first-steps.mdx.*missing-page/)});
});

it('rejects a fourth upgrade tier at the supplied record field before generating production output',async()=>{
 const root=await fixture();const copy={eyebrow:'Fixture',title:'Fixture',description:'Isolated test information.'};
 const record={id:'invalid-upgrade',locale:'en',type:'weapon-explorer',demo:false,verification:'unverified',riskLabel:'Risk',upgradeMedia:{assetId:null,fallbackLabel:'Inventory',caption:'No image supplied'},unlockSummary:'Fixture only',sections:Object.fromEntries(['comparison','explorer','playstyles','details','tier','unlocks','upgrades','changes','faq'].map(id=>[id,copy])),comparison:[],treeNodes:[{id:'fourth',parentId:null,tier:4,label:'Invalid fourth layer',details:'Fixture only',verification:'unverified',iconAssetId:null}],treeNotes:['One','Two','Three'],playstylePicks:[],detailSections:[],tierRows:[],unlockRows:[],upgradeExplanation:[],patchHistory:[],faq:[],columns:{weapon:'Weapon',identity:'Identity',action:'Action',learning:'Learning',bestFor:'Best for',tradeoff:'Tradeoff',tier:'Tier',reason:'Reason',unlock:'Unlock',version:'Version',change:'Change',whenToMove:'When to move them',cost:'Cost',evidence:'Evidence',subject:'Subject'}};
 await writeFile(join(root,'content/en/records/invalid-upgrade.json'),JSON.stringify(record));
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/invalid-upgrade.json.*treeNodes.0.tier.*4/);
});
it('rejects out-of-range map coordinates at the supplied pin field before production generation',async()=>{
 const root=await fixture();const record=JSON.parse(await readFile('tests/fixtures/template-records/maps/interactive-map.json','utf8'));
 record.demo=false;record.pins[0].xPercent=101;await writeFile(join(root,'content/en/records/invalid-map.json'),JSON.stringify(record));
 await expect(prepareContent(root,{preview:false})).rejects.toThrow(/invalid-map.json.*pins.0.xPercent.*101/);
});
