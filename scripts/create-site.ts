import {copyFile,lstat,mkdir,readdir,realpath,open,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,join,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {requiredSitePaths,optionalSitePaths,listSiteFiles,isMissing,isWithin,type SiteFile} from './site-files';
const execFileAsync=promisify(execFile);
async function canonicalDestination(path:string):Promise<string>{
 try{return await realpath(path);}catch(error){if(!isMissing(error))throw error;const parent=dirname(path);if(parent===path)throw error;return join(await canonicalDestination(parent),basename(path));}
}
export async function createSite(options:{source:string;target:string;sample:string;commit?:boolean}){
 if(options.sample!=='a'&&options.sample!=='b')throw new Error(`Invalid sample: ${options.sample}; expected a or b`);
 const source=await realpath(options.source);const target=await canonicalDestination(resolve(options.target));
 if(isWithin(source,target))throw new Error(`Target is inside source: ${target}`);
 if(isWithin(target,source))throw new Error(`Target contains source: ${target}`);
 try{const status=await lstat(target);if(!status.isDirectory())throw new Error(`Target is not a directory: ${target}`);if((await readdir(target)).length)throw new Error(`Target is not empty: ${target}`);}catch(error){if(!isMissing(error))throw error;}
 const sampleRoot=join(source,'examples',`site-${options.sample}`);const files:SiteFile[]=[];
 // Validate the complete input before creating or writing anything in the destination.
 for(const path of requiredSitePaths){await lstat(join(source,path));if(path==='config'||path==='content')continue;files.push(...await listSiteFiles(source,path));}
 for(const path of optionalSitePaths){try{files.push(...await listSiteFiles(source,path));}catch(error){if(!isMissing(error))throw error;}}
 const standaloneReadme=files.find(file=>file.path==='docs/usage/site-readme.md');
 const runtimeFiles=files.filter(file=>!isWithin('public/media',file.path)&&!(standaloneReadme&&file.path==='README.md'));
 // The mother repository retains its original design-system readme unchanged.
 if(standaloneReadme)runtimeFiles.push({...standaloneReadme,path:'README.md'});
 for(const path of ['config','content','public/media'])runtimeFiles.push(...await listSiteFiles(sampleRoot,path));
 const paths=new Set<string>();for(const file of runtimeFiles){if(paths.has(file.path))throw new Error(`Duplicate copy destination: ${file.path}`);paths.add(file.path);}
 await mkdir(target,{recursive:true});
 if((await lstat(target)).isSymbolicLink())throw new Error(`Target became a symbolic link: ${target}`);
 const lockPath=join(target,'.site-copy.lock');const lock=await open(lockPath,'wx');
 try{
 for(const file of runtimeFiles){const output=join(target,file.path);await mkdir(dirname(output),{recursive:true});await copyFile(file.source,output,constants.COPYFILE_EXCL);}
 // Empty media directories are meaningful even when a sample has no real assets yet.
 await mkdir(join(target,'public/media'),{recursive:true});
 await execFileAsync('git',['init','-b','main'],{cwd:target});
 let gitStatus='initialized; initial commit not requested';
 if(options.commit!==false){
  const {stdout}=await execFileAsync('git',['config','--list'],{cwd:target});
  const hasName=/^user\.name=.+$/m.test(stdout);const hasEmail=/^user\.email=.+$/m.test(stdout);
  if(hasName&&hasEmail){await execFileAsync('git',['add','--',...new Set(runtimeFiles.map(file=>file.path.split('/')[0]))],{cwd:target});await execFileAsync('git',['commit','-m','chore: initialize standalone game wiki'],{cwd:target});gitStatus='initialized and committed';}
  else gitStatus='initialized; initial commit skipped because Git name/email is not configured';
 }
 return {target,files:runtimeFiles.length,sample:options.sample,gitStatus};
 }finally{await lock.close();await unlink(lockPath);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const values:Record<string,string>={};
 for(let i=0;i<args.length;i+=2){if(!['--target','--sample'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--')||values[args[i]])throw new Error(`Invalid or repeated argument: ${args[i]}`);values[args[i]]=args[i+1];}
 if(!values['--target']||!values['--sample'])throw new Error('Usage: npm run create:site -- --target /absolute/path/to/new-game-site --sample a');
 const result=await createSite({source:process.cwd(),target:values['--target'],sample:values['--sample']});
 console.log(JSON.stringify(result,null,2));console.log(`Next: cd ${JSON.stringify(result.target)}, then npm ci and npm run dev. This site has not been deployed.`);
}
