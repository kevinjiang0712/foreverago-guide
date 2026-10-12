import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {copyFile,lstat,mkdir,mkdtemp,readFile,realpath,rename,rm,writeFile} from 'node:fs/promises';
import {basename,dirname,isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSite} from './create-site';
import {isMissing,isWithin,listSiteFiles,requiredSitePaths,optionalSitePaths} from './site-files';
import {loadSitePackage} from './site-spec-load';
import {writeSitePackage} from './site-spec-write';
import {prepareContent} from './prepare-content';
import {prepareTheme} from '../src/content/theme';

const execFileAsync=promisify(execFile);
const ownedDirectories=['config','content','public/media'] as const;
const manifestName='.site-build.json';
type Manifest={version:1;templateCommit:string;files:Record<string,string>};

async function exists(path:string){try{await lstat(path);return true;}catch(error){if(isMissing(error))return false;throw error;}}
async function canonicalDestination(path:string):Promise<string>{
 try{return await realpath(path);}catch(error){if(!isMissing(error))throw error;const parent=dirname(path);if(parent===path)throw error;return join(await canonicalDestination(parent),basename(path));}
}
async function fileHashes(root:string):Promise<Record<string,string>>{
 const hashes:Record<string,string>={};
 for(const directory of ownedDirectories){
  for(const file of await listSiteFiles(root,directory))hashes[file.path]=createHash('sha256').update(await readFile(file.source)).digest('hex');
 }
 return hashes;
}
async function frameworkFiles(root:string){
 const paths=[...requiredSitePaths,...optionalSitePaths];const files=[];
 for(const path of paths){if(ownedDirectories.some(directory=>path===directory))continue;
  if(!(await exists(join(root,path))))continue;
  files.push(...await listSiteFiles(root,path));
 }
 return files.filter(file=>!ownedDirectories.some(directory=>isWithin(directory,file.path)));
}
async function committedSnapshot(templateRoot:string,snapshot:string){
 const {stdout:commit}=await execFileAsync('git',['rev-parse','HEAD'],{cwd:templateRoot});
 const archive=join(dirname(snapshot),'template.tar');
 await execFileAsync('git',['archive','--format=tar',`--output=${archive}`,'HEAD'],{cwd:templateRoot});
 await mkdir(snapshot,{recursive:true});
 await execFileAsync('tar',['-xf',archive,'-C',snapshot]);
 if(!(await exists(join(snapshot,'scripts/site-spec-write.ts'))))throw new Error('The committed template does not contain the site-package generator. Commit the implementation before creating a new site.');
 return commit.trim();
}
async function readManifest(target:string):Promise<Manifest|null>{
 const path=join(target,manifestName);if(!(await exists(path)))return null;
 const value=JSON.parse(await readFile(path,'utf8')) as Manifest;
 if(value.version!==1||typeof value.templateCommit!=='string'||!value.files||typeof value.files!=='object')throw new Error(`${manifestName}: invalid or unsupported manifest`);
 return value;
}
async function validateOwnedFiles(target:string,manifest:Manifest){
 const actual=await fileHashes(target);
 const expected=manifest.files;
 const paths=new Set([...Object.keys(actual),...Object.keys(expected)]);
 for(const path of paths)if(actual[path]!==expected[path])throw new Error(`${path}: generated file changed since the last successful assembly; refusing to overwrite it`);
}
async function installFirstSite(stage:string,target:string,manifest:Manifest){
 const files=await frameworkFiles(stage);
 const generated=[];
 for(const directory of ownedDirectories)generated.push(...await listSiteFiles(stage,directory));
 const toCopy=[...files,...generated];
 for(const directory of ownedDirectories)if(await exists(join(target,directory)))throw new Error(`${directory}: target path already exists; first assembly requires generated directories to be absent`);
 for(const file of toCopy)if(await exists(join(target,file.path)))throw new Error(`${file.path}: target file already exists; refusing to overwrite research or project files`);
 if(await exists(join(target,manifestName)))throw new Error(`${manifestName}: target already has a build manifest`);
 const installed:string[]=[];
 const hadGit=await exists(join(target,'.git'));
 try{
  await mkdir(target,{recursive:true});
  for(const file of toCopy){const output=join(target,file.path);await mkdir(dirname(output),{recursive:true});await copyFile(file.source,output);installed.push(output);}
  if(!hadGit)await execFileAsync('git',['init','-b','main'],{cwd:target});
  await writeFile(join(target,manifestName),`${JSON.stringify(manifest,null,2)}\n`);
 }catch(error){for(const path of installed.reverse())await rm(path,{force:true});if(!hadGit&&await exists(join(target,'.git')))await rm(join(target,'.git'),{recursive:true,force:true});throw error;}
}
async function replaceGenerated(stage:string,target:string,manifest:Manifest,workRoot:string){
 const backup=join(workRoot,'previous');await mkdir(backup);
 const movedOld:string[]=[];const movedNew:string[]=[];
 try{
  for(const directory of ownedDirectories){
   const old=join(target,directory),saved=join(backup,directory),fresh=join(stage,directory);
   await mkdir(dirname(saved),{recursive:true});await mkdir(dirname(old),{recursive:true});
   await rename(old,saved);movedOld.push(directory);
   await rename(fresh,old);movedNew.push(directory);
  }
  const manifestPath=join(target,manifestName),pending=join(workRoot,manifestName);
  await writeFile(pending,`${JSON.stringify(manifest,null,2)}\n`);
  await rename(pending,manifestPath);
 }catch(error){
  for(const directory of movedNew.reverse())await rm(join(target,directory),{recursive:true,force:true});
  for(const directory of movedOld.reverse()){const old=join(target,directory);await mkdir(dirname(old),{recursive:true});await rename(join(backup,directory),old);}
  throw error;
 }
}
export async function assembleSite(targetInput:string,options:{templateSnapshotRoot?:string}={}){
 if(!isAbsolute(targetInput))throw new Error(`--target must be an absolute path: ${targetInput}`);
 const target=await canonicalDestination(resolve(targetInput)),templateRoot=await realpath(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
 if(isWithin(templateRoot,target)||isWithin(target,templateRoot))throw new Error(`Target must be outside the template repository: ${target}`);
 const status=await lstat(target).catch(error=>{if(isMissing(error))return null;throw error;});
 if(status&&(!status.isDirectory()||status.isSymbolicLink()))throw new Error(`Target must be a real directory: ${target}`);
 const manifest=status?await readManifest(target):null;
 if(manifest)await validateOwnedFiles(target,manifest);
 const packageRoot=join(target,'site-spec');
 if(!(await exists(packageRoot)))throw new Error(`Missing site package: ${packageRoot}`);
 const workRoot=await mkdtemp(join(dirname(target),'.site-assemble-'));
 try{
  const source=manifest?target:options.templateSnapshotRoot??join(workRoot,'snapshot');
  const templateCommit=manifest?manifest.templateCommit:options.templateSnapshotRoot?'test-working-tree':await committedSnapshot(templateRoot,source);
  const pack=await loadSitePackage(packageRoot,source);
  const stage=join(workRoot,'stage');
  await createSite({source,target:stage,sample:'a',commit:false});
  await writeSitePackage(stage,pack);
  const index=await prepareContent(stage,{preview:false});
  await prepareTheme(stage);
  const nextManifest:Manifest={version:1,templateCommit,files:await fileHashes(stage)};
  if(manifest)await replaceGenerated(stage,target,nextManifest,workRoot);
  else await installFirstSite(stage,target,nextManifest);
  return {target,mode:manifest?'regenerated':'created',routes:Object.keys(index.routes).length,templateCommit};
 }finally{await rm(workRoot,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--target')throw new Error('Usage: npm run assemble:site -- --target /absolute/path/to/new-game-site');
 const result=await assembleSite(args[1]);console.log(JSON.stringify(result,null,2));
 console.log('Site generated locally. No Git commit, dependency installation, build, deployment, or publishing was performed.');
}
