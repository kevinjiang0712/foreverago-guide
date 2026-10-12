import {mkdtemp,mkdir,readFile,writeFile,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createSite} from './create-site';
import {frameworkHash} from './framework-hash';
import {listSiteFiles,isMissing} from './site-files';
import {runCommand} from './test-server';
import {verifySite} from './verify-site';
import {templateNames} from '../src/content/template-names';
import type {ContentIndex} from '../src/content/types';
import type {ThemeConfig} from '../src/content/schemas/theme';
import {readSite} from '../src/content/read-site';

type Digest={files:{path:string;sha256:string;bytes:number}[]};
type SampleSummary={siteId:string;siteUrl:string;mode:string;locales:string[];defaultLocale:string;names:string[];theme:Omit<ThemeConfig,'defaultMode'>;officialLinks:Record<string,string|null>;categories:{id:string;slug:string;order:number}[];pages:string[];records:string[];recordIds:string[];entityNames:string[];identifiers:string[];nonDemo:string[];templates:string[]};
export function frameworkDifferences(source:Digest,target:Digest){
 const expected=new Map(source.files.map(file=>[file.path,file.sha256]));const actual=new Map(target.files.map(file=>[file.path,file.sha256]));
 return [...new Set([...expected.keys(),...actual.keys()])].sort().flatMap(path=>!actual.has(path)?[`${path}: missing`]:!expected.has(path)?[`${path}: added`]:expected.get(path)!==actual.get(path)?[`${path}: changed`]:[]);
}
export function assertDistinctSamples(a:SampleSummary,b:SampleSummary,requiredTemplates:readonly string[]=templateNames){
 const equal=(left:unknown,right:unknown)=>JSON.stringify(left)===JSON.stringify(right);
 for(const field of ['siteId','siteUrl','theme','officialLinks'] as const)if(equal(a[field],b[field]))throw new Error(`Samples must differ in ${field}`);
 const values=(items:string[])=>[...new Set(items)].sort();
 for(const field of ['names','pages','entityNames'] as const)if(equal(values(a[field]),values(b[field])))throw new Error(`Samples must differ in ${field}`);
 for(const field of ['id','slug'] as const)if(equal(values(a.categories.map(category=>category[field])),values(b.categories.map(category=>category[field]))))throw new Error(`Samples must differ in category ${field}`);
 if(equal(a.categories.map(category=>category.order).sort((a,b)=>a-b),b.categories.map(category=>category.order).sort((a,b)=>a-b)))throw new Error('Samples must differ in category order values');
 if(a.nonDemo.length||b.nonDemo.length)throw new Error(`Reuse content must remain demo: ${[...a.nonDemo,...b.nonDemo].join(', ')}`);
 if(a.mode!=='demo'||b.mode!=='demo')throw new Error('Both reuse samples must remain demo');
 if(!b.locales.some(locale=>locale!==b.defaultLocale&&!a.locales.includes(locale)))throw new Error('Sample B requires a different non-default language');
 if(a.recordIds.length===b.recordIds.length)throw new Error('Samples must differ in unique record count; extra translations do not count');
 for(const [label,sample] of [['a',a],['b',b]] as const)for(const template of requiredTemplates)if(!sample.templates.includes(template))throw new Error(`Sample ${label} is missing template ${template}`);
}
export async function findRuntimeLeaks(root:string,markers:string[],identifiers:string[]=[]){
 const files=[...await listSiteFiles(root,'.generated/content-index.json'),...await listSiteFiles(root,'.next/server/app')];
 try{files.push(...await listSiteFiles(root,'.next/static/chunks'));}catch(error){if(!isMissing(error))throw error;}
 const leaks:{path:string;marker:string}[]=[];
 for(const file of files.sort((a,b)=>a.path.localeCompare(b.path))){
  if(!/\.(json|html|rsc|txt|js|meta)$/.test(file.path))continue;
  const source=await readFile(file.source,'utf8');
  const decoded=source.replace(/\\u([\da-f]{4})/gi,(_,hex:string)=>String.fromCharCode(parseInt(hex,16))).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{
   if(entity[0]==='#'){const point=parseInt(entity.slice(entity[1]?.toLowerCase()==='x'?2:1),entity[1]?.toLowerCase()==='x'?16:10);return point<=0x10ffff?String.fromCodePoint(point):`&${entity};`;}
   return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'} as Record<string,string>)[entity.toLowerCase()];
  });
  for(const marker of markers)if(decoded.includes(marker)||source.includes(JSON.stringify(marker).slice(1,-1)))leaks.push({path:file.path,marker});
  if(file.path==='.generated/content-index.json'){
   const tokens=new Set<string>();const collect=(value:unknown)=>{if(typeof value==='string')tokens.add(value);else if(value&&typeof value==='object')for(const [key,nested] of Object.entries(value)){tokens.add(key);collect(nested);}};collect(JSON.parse(source));
   for(const identifier of identifiers)if([...tokens].some(token=>token===identifier||/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*:/.test(token)&&token.slice(token.indexOf(':')+1)===identifier))leaks.push({path:file.path,marker:identifier});
  }
 }
 return leaks;
}
async function summarizeSample(root:string,index:ContentIndex):Promise<SampleSummary>{
 const theme=JSON.parse(await readFile(join(root,'config/theme.json'),'utf8')) as ThemeConfig;
 const categories=JSON.parse(await readFile(join(root,'config/categories.json'),'utf8')) as SampleSummary['categories'];
 const input=await readSite(root);const entityNames:string[]=[];
 const collectNames=(value:unknown)=>{if(!value||typeof value!=='object')return;for(const [key,nested] of Object.entries(value)){if(key==='name'&&typeof nested==='string')entityNames.push(nested);else if(typeof nested==='object')collectNames(nested);}};
 Object.values(index.records).forEach(record=>{collectNames(record);if(['mod','build','table'].includes(record.type)&&'title' in record&&typeof record.title==='string')entityNames.push(record.title);});
 const nonDemo=[...input.homes,...input.pages,...input.records,...input.assets].filter(item=>!item.demo).map(item=>item.id);
 const identifiers=[...Object.values(index.records).map(record=>record.id),...Object.values(index.pagesByKey).map(page=>page.id)];
 return {recordIds:[...new Set(Object.values(index.records).map(record=>record.id))].sort(),entityNames:[...new Set(entityNames)].sort(),identifiers:[...new Set(identifiers)].sort(),nonDemo,siteId:index.site.siteId,siteUrl:index.site.siteUrl,mode:index.site.mode,locales:index.site.locales,defaultLocale:index.site.defaultLocale,names:Object.values(index.dictionaries).map(dictionary=>dictionary.siteName),theme:{preset:theme.preset,common:theme.common,day:theme.day,night:theme.night,fonts:theme.fonts},officialLinks:index.site.officialLinks,categories:categories.map(({id,slug,order})=>({id,slug,order})),pages:Object.values(index.pagesByKey).map(page=>page.title).sort(),records:Object.keys(index.records).sort(),templates:[...new Set(Object.values(index.routes).flatMap(route=>route.kind==='home'&&index.homes[route.locale].status==='published'?['site-home']:route.kind==='page'&&index.pagesByKey[route.bodyKey].status==='published'?[index.pagesByKey[route.bodyKey].template]:[]))].sort()};
}
export async function verifyReuse(root:string){
 const runId=randomUUID();const startedAt=new Date().toISOString();const reportPath=join(root,'docs/verification/reuse-report.json');
 await mkdir(join(root,'docs/verification'),{recursive:true});
 await writeFile(reportPath,JSON.stringify({runId,startedAt,status:'running'})+'\n');
 const artifact=join(root,'.artifacts/reuse',runId);
 const errors:string[]=[];const instances:{sample:string;copy:Awaited<ReturnType<typeof createSite>>;summary:SampleSummary;framework:Awaited<ReturnType<typeof frameworkHash>>;verification:Awaited<ReturnType<typeof verifySite>>}[]=[];
 let temporary:string|undefined;let source:Awaited<ReturnType<typeof frameworkHash>>|undefined;let leaks:{path:string;marker:string}[]=[];let stage='inputs';
 const controller=new AbortController();const abort=()=>controller.abort();process.once('SIGINT',abort);process.once('SIGTERM',abort);
 try{
  await mkdir(artifact,{recursive:true});
  // Require both samples before installing or building either copy.
  for(const sample of ['a','b'])for(const path of ['config','content','public/media'])await listSiteFiles(root,join('examples',`site-${sample}`,path));
  source=await frameworkHash(root);temporary=await mkdtemp(join(tmpdir(),'game-wiki-reuse-'));
  for(const sample of ['a','b']){
   controller.signal.throwIfAborted();stage=`${sample}: copy`;const target=join(temporary,`site-${sample}`);
   const copy=await createSite({source:root,target,sample,commit:false});
   const before=await frameworkHash(target);const copiedDifferences=frameworkDifferences(source,before);if(copiedDifferences.length)throw new Error(`Copied framework differs:\n${copiedDifferences.join('\n')}`);
   for(const args of [['ci'],['run','check:content'],['run','typecheck'],['run','build']]){
    stage=`${sample}: npm ${args.join(' ')}`;console.log(stage);await runCommand('npm',args,target,{signal:controller.signal});
   }
   stage=`${sample}: verify site`;controller.signal.throwIfAborted();const verification=await verifySite(target,{build:false,signal:controller.signal});controller.signal.throwIfAborted();
   const index=JSON.parse(await readFile(join(target,'.generated/content-index.json'),'utf8')) as ContentIndex;
   const summary=await summarizeSample(target,index);const framework=await frameworkHash(target);
   const builtDifferences=frameworkDifferences(source,framework);if(builtDifferences.length)throw new Error(`Built framework differs:\n${builtDifferences.join('\n')}`);
   instances.push({sample,copy,summary,framework,verification});
   await mkdir(join(artifact,`site-${sample}`),{recursive:true});await cp(join(target,'.generated/content-index.json'),join(artifact,`site-${sample}/content-index.json`));await cp(join(target,'.artifacts/site'),join(artifact,`site-${sample}/site`),{recursive:true});
  }
  stage='sample differences';const [a,b]=instances;assertDistinctSamples(a.summary,b.summary);
  const bStrings=new Set([...templateNames,b.summary.siteId,b.summary.siteUrl,...b.summary.names,...b.summary.pages,...b.summary.entityNames,...b.summary.identifiers]);
  const markers=[...new Set([a.summary.siteId,a.summary.siteUrl,...a.summary.names,...a.summary.pages,...a.summary.entityNames])].filter(marker=>!bStrings.has(marker));
  const identifiers=a.summary.identifiers.filter(identifier=>!bStrings.has(identifier));
  stage='runtime leak scan';leaks=await findRuntimeLeaks(join(temporary,'site-b'),markers,identifiers);
  if(leaks.length)throw new Error(`Sample A identifiers remain in B runtime:\n${leaks.map(leak=>`${leak.path}: ${leak.marker}`).join('\n')}`);
  stage='source integrity';const after=await frameworkHash(root);const sourceDifferences=frameworkDifferences(source,after);if(sourceDifferences.length)throw new Error(`Source changed during verification:\n${sourceDifferences.join('\n')}`);controller.signal.throwIfAborted();
 }catch(error){errors.push(`${stage}: ${error instanceof Error?error.message:String(error)}`);}
 finally{
  process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);
  if(temporary)try{await rm(temporary,{recursive:true,force:true});}catch(error){errors.push(`cleanup: ${String(error)}`);}
 }
 const report={runId,startedAt,finishedAt:new Date().toISOString(),status:errors.length||instances.length!==2?'failed':'passed',source,instances,leakScan:{scope:['.generated/content-index.json','.next/server/app/*.{html,rsc,txt,json,meta,js}','.next/static/chunks/*.js'],leaks},errors,deployed:false};
 try{await writeFile(join(artifact,'summary.json'),JSON.stringify(report,null,2)+'\n');}catch(error){report.errors.push(`artifact report: ${String(error)}`);report.status='failed';}
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
 if(report.status!=='passed')throw new Error(`Reuse verification failed: ${errors.join('; ')}; report: ${reportPath}`);
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await verifyReuse(process.cwd());
