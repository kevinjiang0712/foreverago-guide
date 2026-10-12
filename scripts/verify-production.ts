import {cp,mkdtemp,mkdir,symlink,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {spawn,type ChildProcess} from 'node:child_process';
const root=process.cwd();const fixture=await mkdtemp(join(tmpdir(),'game-wiki-production-'));
const artifact=join(root,'.artifacts','production');await mkdir(artifact,{recursive:true});
function run(command:string,args:string[],cwd:string,env=process.env){return new Promise<void>((accept,reject)=>{const child=spawn(command,args,{cwd,env,stdio:'inherit'});child.once('error',reject);child.once('exit',(code,signal)=>code===0?accept():reject(new Error(`${command} ${args.join(' ')} failed: code=${code}, signal=${signal}`)));});}
const port=await new Promise<number>((accept,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{const address=probe.address();if(!address||typeof address==='string'){probe.close();reject(new Error('Could not allocate production fixture port'));return;}probe.close(error=>error?reject(error):accept(address.port));});});
let server:ChildProcess|undefined;
try{
 for(const file of ['src','scripts','public/ui','package.json','package-lock.json','tsconfig.json','next.config.mjs'])await cp(join(root,file),join(fixture,file),{recursive:true});
 for(const directory of ['config','content'])await cp(join(root,'tests/fixtures/production-site',directory),join(fixture,directory),{recursive:true});
 await mkdir(join(fixture,'public/media'),{recursive:true});await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
 await run('npm',['run','build'],fixture);
 server=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:fixture,stdio:'inherit'});
 let spawnError:Error|undefined;server.once('error',error=>{spawnError=error;});const url=`http://127.0.0.1:${port}`;const deadline=Date.now()+30000;
 while(true){
  if(spawnError)throw spawnError;if(server.exitCode!==null)throw new Error(`Production fixture server exited: ${server.exitCode}`);
  let response:Response|undefined;try{response=await fetch(url);}catch(error){if(!(error instanceof TypeError))throw error;}
  if(response?.ok)break;if(response)throw new Error(`Production fixture returned ${response.status}`);if(Date.now()>deadline)throw new Error('Production fixture startup timed out');await new Promise(accept=>setTimeout(accept,100));
 }
 await run(process.execPath,[join(root,'node_modules/@playwright/test/cli.js'),'test','--config=tests/production/playwright.config.ts'],root,{...process.env,PRODUCTION_TEST_URL:url,PRODUCTION_TEST_OUTPUT:join(artifact,'browser'),PRODUCTION_TEST_REPORT:join(artifact,'results.json')});
 await writeFile(join(artifact,'summary.json'),JSON.stringify({status:'passed',testedAt:new Date().toISOString(),mode:'production',fixture:'tests/fixtures/production-site',deployed:false},null,2)+'\n');
}finally{
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise<void>(accept=>server!.once('exit',()=>accept()));}
 await rm(fixture,{recursive:true,force:true});
}
