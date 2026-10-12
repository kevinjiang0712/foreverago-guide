import {expect,it} from 'vitest';
import {mkdtemp,cp,writeFile,readFile,rm,stat,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareContent} from '../../scripts/prepare-content';
const source='---\nid: new-guide\nlocale: en\nslug: new-guide\ncategory: guides\ntemplate: wiki-page\nguide: {eyebrow: Chapter, title: Start, stats: [{label: Time, value: null}], table: null, route: null}\ntitle: New guide\ndescription: A demonstration guide.\nstatus: published\ndemo: true\n---\n\n## Start\nA new guide.';
it('regenerates imports after add/delete, does not rewrite unchanged files, preserves good index after errors',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-generation-'));
 try{
  for(const dir of ['config','content','public'])await cp(join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});
  await mkdir(join(root,'content/en/pages'),{recursive:true});
  await prepareContent(root,{preview:false});const manifest=join(root,'.generated/content-index.json');const initial=await stat(manifest);
  await prepareContent(root,{preview:false});expect((await stat(manifest)).mtimeMs).toBe(initial.mtimeMs);
  const article=join(root,'content/en/pages/new-guide.mdx');await writeFile(article,source);await prepareContent(root,{preview:false});
  expect(await readFile(join(root,'.generated/mdx-imports.ts'),'utf8')).toContain('import("../content/en/pages/new-guide.mdx")');
  const good=await readFile(manifest,'utf8');await writeFile(article,source+'\n<Media id="missing" />');
  await expect(prepareContent(root,{preview:false})).rejects.toThrow(/new-guide.mdx:\d+.*missing/);
  expect(await readFile(manifest,'utf8')).toBe(good);
  await rm(article);await prepareContent(root,{preview:false});expect(await readFile(join(root,'.generated/mdx-imports.ts'),'utf8')).not.toContain('new-guide');
 }finally{await rm(root,{recursive:true,force:true});}
});
async function withSource(body:string,check:(root:string)=>Promise<void>){
 const root=await mkdtemp(join(tmpdir(),'wiki-mdx-boundary-'));
 try{
  for(const dir of ['config','content','public'])await cp(join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});await mkdir(join(root,'content/en/pages'),{recursive:true});
  await writeFile(join(root,'content/en/pages/new-guide.mdx'),source.slice(0,source.indexOf('## Start')).trimEnd()+'\n'+body);await check(root);
 }finally{await rm(root,{recursive:true,force:true});}
}
it('validates a body beginning with thematic breaks exactly as full MDX compilation',async()=>{
 await withSource('---\n## Same\n<Media id="missing" />\n---\n\n## Same',async root=>{
  await expect(prepareContent(root,{preview:false})).rejects.toThrow(/new-guide.mdx:\d+.*missing/);
 });
});
it('validates reference-style images at the image usage',async()=>{
 await withSource('## Images\n\n![alt][img]\n\n[img]: https://media.real-domain.org/unregistered.png',async root=>{
  await expect(prepareContent(root,{preview:false})).rejects.toThrow(/new-guide.mdx:\d+.*unregistered.png.*registered/);
 });
});
it('allows H4-H6 anchors while keeping the TOC limited to H2/H3',async()=>{
 await withSource('## Overview\n\n#### Deep\n\n[x](#deep)',async root=>{
  const index=await prepareContent(root,{preview:false});expect(index.pagesByKey['en:new-guide'].headings.map(h=>h.id)).toEqual(['overview']);
 });
});
it('reports malformed anchor encoding with the source file and line',async()=>{
 await withSource('## Start\n\n[x](#a%ZZ)',async root=>{
  await expect(prepareContent(root,{preview:false})).rejects.toThrow(/new-guide.mdx:\d+.*#a%ZZ.*encoding/);
 });
});
it('supports browser-encoded CJK fragments',async()=>{
 await withSource('## 開始\n\n[Jump](#%E9%96%8B%E5%A7%8B)',async root=>{
  await expect(prepareContent(root,{preview:false})).resolves.toHaveProperty('routes');
 });
});
it('checks the entire fragment rather than ignoring a second hash',async()=>{
 await withSource('## Start\n\n[Broken](#start#missing)',async root=>{
  await expect(prepareContent(root,{preview:false})).rejects.toThrow(/new-guide.mdx:\d+.*#start#missing.*unknown heading/);
 });
});

async function copyWeaponFixture(root:string){
 for(const dir of ['config','content','public'])await cp(join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});
 await mkdir(join(root,'content/en/records'),{recursive:true});await mkdir(join(root,'content/en/pages'),{recursive:true});
 for(const file of ['weapon.json','weapon-detail.json'])await cp(join('tests/fixtures/template-records',file),join(root,'content/en/records',file));
 await cp('tests/fixtures/template-records/weapon-detail.mdx',join(root,'content/en/pages/practice-blade-detail.mdx'));
}
it.each(['Main','Overview','Unlock','Tabs','Matchups','Pairs','FAQ','Sources'])('rejects weapon body heading %s that shadows a fixed template anchor without changing generated output',async title=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-weapon-anchor-'));
 try{
  await copyWeaponFixture(root);
  await prepareContent(root,{preview:false});const manifest=join(root,'.generated/content-index.json');const good=await readFile(manifest,'utf8');
  const article=join(root,'content/en/pages/practice-blade-detail.mdx');const original=await readFile(article,'utf8');await writeFile(article,`${original}\n## ${title}\nA legitimate MDX heading that shadows the page shell.\n`);
  await expect(prepareContent(root,{preview:false}).then(()=>undefined)).rejects.toThrow(new RegExp(`practice-blade-detail.mdx.*headingIds.*${title.toLowerCase()}.*reserved.*weapon-detail`));
  expect(await readFile(manifest,'utf8')).toBe(good);expect(await readFile(article,'utf8')).toBe(`${original}\n## ${title}\nA legitimate MDX heading that shadows the page shell.\n`);
 }finally{await rm(root,{recursive:true,force:true});}
});
it.each(['## Main','#### Main','###### Main'])('protects the shared main landmark from %s in wiki body content',async heading=>{
 await withSource(`${heading}\nBody text`,async root=>{await expect(prepareContent(root,{preview:false}).then(()=>undefined)).rejects.toThrow(/new-guide.mdx.*headingIds.*main.*reserved.*wiki-page/);});
});
it('keeps ordinary body slugs unchanged, including headings that are only reserved on another template',async()=>{
 await withSource('## FAQ\n\n## FAQ\n\n### Unlock notes\n\n[Continue](#faq-1)',async root=>{const index=await prepareContent(root,{preview:false});expect(index.pagesByKey['en:new-guide'].headings.map(heading=>heading.id)).toEqual(['faq','faq-1','unlock-notes']);});
});

it('allows explicit links to populated page sections without generating duplicate body headings',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-fixed-anchor-links-'));
 try{
  await copyWeaponFixture(root);
  const recordPath=join(root,'content/en/records/weapon-detail.json');const record=JSON.parse(await readFile(recordPath,'utf8'));
  record.unlockSteps=[{id:'step-one',title:'Unlock',description:'Fixture step',verification:'unverified'}];
  record.faq=[{id:'question-one',question:'Question?',answer:'Fixture answer',verification:'unverified'}];
  await writeFile(recordPath,JSON.stringify(record));
  const article=join(root,'content/en/pages/practice-blade-detail.mdx');await writeFile(article,`${await readFile(article,'utf8')}\n[Unlock](#unlock) and [FAQ](#faq).\n`);
  const index=await prepareContent(root,{preview:false});expect(index.pagesByKey['en:practice-blade-detail'].headings.map(heading=>heading.id)).not.toContain('unlock');
 }finally{await rm(root,{recursive:true,force:true});}
});
