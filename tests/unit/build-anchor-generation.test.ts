import {expect,it} from 'vitest';
import {mkdtemp,cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareContent} from '../../scripts/prepare-content';
const section={eyebrow:'Demo',title:'Demo',description:'Demo only'};
const library={id:'library',locale:'en',type:'build-library',verification:'unverified',demo:true,sections:{evidence:section,find:section,setups:section,presets:section,rescue:section,faq:section},evidenceLegend:[],filterOptions:{playstyles:[],weapons:[]},buildIds:['example-build'],presets:[],rescueRows:[],faq:[],columns:{build:'Build',protectFirst:'Protect first',ifMissing:'If missing',pivot:'Pivot'}};
const build={id:'example-build',locale:'en',type:'build',demo:true,name:'Demo',summary:'Demo',assetId:null,playstyleIds:[],weaponIds:[],facts:[],equipment:[],bestFor:'Demo',avoidIf:'Demo',howItWorks:'Demo',artifactPriority:[],buildOrder:[],howToPlay:'Demo',risks:'Demo',evidenceNote:'Demo',verification:'unverified',variants:[]};
async function fixture(body:string,check:(root:string)=>Promise<void>){
 const root=await mkdtemp(join(tmpdir(),'wiki-build-anchor-'));
 try{
  for(const dir of ['config','content','public'])await cp(join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});
  await mkdir(join(root,'content/en/pages'),{recursive:true});await mkdir(join(root,'content/en/records'),{recursive:true});
  for(const record of [library,build])await writeFile(join(root,`content/en/records/${record.id}.json`),JSON.stringify(record));
  const common='locale: en\ncategory: guides\ntitle: Demo\ndescription: Demo only\nstatus: published\ndemo: true\n';
  await writeFile(join(root,'content/en/pages/builds.mdx'),'---\nid: library\nslug: library\ntemplate: build-library\n'+common+'records: [library]\nlistGuide: library-reference\n---\n');
  await writeFile(join(root,'content/en/pages/library-reference.mdx'),'---\nid: library-reference\nslug: library-reference\ntemplate: wiki-page\n'+common+'records: [library]\narticleRecord: library\n---\n'+body);
  await writeFile(join(root,'content/en/pages/build-detail.mdx'),'---\nid: build-detail\nslug: example-build\ntemplate: wiki-page\n'+common+'records: [example-build, library]\narticleRecord: example-build\n---\n');
  await check(root);
 }finally{await rm(root,{recursive:true,force:true});}
}
it('rejects an article heading that shadows a fixed section',async()=>{await fixture('## Sources',async root=>{await expect(prepareContent(root,{preview:false})).rejects.toThrow(/library-reference.mdx.*headingIds.*sources.*reserved/);});});
it('allows legacy setup URLs and the new article section URLs',async()=>{await fixture('[Setup](/guides/library#setup-example-build)\n\n[Details](/guides/example-build#fit)',async root=>{await expect(prepareContent(root,{preview:false})).resolves.toHaveProperty('routes');});});
it('rejects unknown legacy setup anchors',async()=>{await fixture('[Setup](/guides/library#setup-missing)',async root=>{await expect(prepareContent(root,{preview:false})).rejects.toThrow(/library-reference.mdx.*link.*setup-missing.*unknown heading/);});});

it.each(['browse','presets','setup-example-build'])('validates #%s against a library without its guide',async anchor=>{
 await fixture(`[Library](/guides/library#${anchor})`,async root=>{
  const path=join(root,'content/en/pages/builds.mdx');
  await writeFile(path,(await readFile(path,'utf8')).replace('listGuide: library-reference','listGuide: null'));
  if(anchor==='browse')await expect(prepareContent(root,{preview:false})).resolves.toHaveProperty('routes');
  else await expect(prepareContent(root,{preview:false})).rejects.toThrow(/library-reference.mdx.*link.*unknown heading/);
 });
});
