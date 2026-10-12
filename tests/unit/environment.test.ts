import {it,expect} from 'vitest';
import {mkdtemp,cp,writeFile,readFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
it.each([
 {script:'prepare-content',files:{'.env.local':'SITE_ENV=preview'},external:undefined,preview:true},
 {script:'check-content',files:{'.env.local':'SITE_ENV=preview'},external:undefined,preview:true},
 {script:'prepare-content',files:{'.env.local':'SITE_ENV=production','.env.production.local':'SITE_ENV=preview'},external:undefined,preview:true},
 {script:'prepare-content',files:{'.env.local':'SITE_ENV=preview'},external:'production',preview:false},
])('loads Next environment before $script ($external, $preview)',async({script,files,external,preview})=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-env-'));
 try{
  await cp('tests/fixtures/production-site',root,{recursive:true});
  for(const [name,value] of Object.entries(files))await writeFile(join(root,name),value!);
  const env:NodeJS.ProcessEnv={...process.env,NODE_ENV:'production'};delete env.SITE_ENV;delete env.__NEXT_PROCESSED_ENV;
  if(external)env.SITE_ENV=external;
  await exec(process.execPath,['--import',resolve('node_modules/tsx/dist/loader.mjs'),resolve(`scripts/${script}.ts`)],{cwd:root,env});
  const index=JSON.parse(await readFile(join(root,'.generated/content-index.json'),'utf8'));
  expect(index.preview).toBe(preview);
  expect(Object.values(index.routes).every(route=>!(route as {indexable:boolean}).indexable)).toBe(preview);
 }finally{await rm(root,{recursive:true,force:true});}
});
