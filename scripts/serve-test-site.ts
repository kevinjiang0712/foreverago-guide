import {mkdtemp,symlink,rm,mkdir,cp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSite} from './create-site';
import {runCommand,startProductionServer} from './test-server';
import {isMissing} from './site-files';
const args=process.argv.slice(2);const port=Number(args[1]);
if(args.length!==2||args[0]!=='--port'||!Number.isInteger(port)||port<1||port>65535)throw new Error(`Expected --port 1..65535; received ${args.join(' ')}`);
const source=process.cwd();const target=await mkdtemp(join(tmpdir(),'game-wiki-browser-'));
let started:Awaited<ReturnType<typeof startProductionServer>>|undefined;
const controller=new AbortController();
let signalExit:()=>void=()=>{};const stopped=new Promise<void>(accept=>{signalExit=accept;});
const stop=()=>{controller.abort();signalExit();};
process.once('SIGTERM',stop);process.once('SIGINT',stop);
try{
 await createSite({source,target,sample:'a',commit:false});
 // Browser layout tests intentionally enable placeholders; copied sites remain disabled by default.
 await writeFile(join(target,'config/ads.json'),'{\n  "mode": "placeholder"\n}\n');
 // Test-only dependency reuse; create:site itself never copies or links node_modules.
 await symlink(join(source,'node_modules'),join(target,'node_modules'),'dir');
 controller.signal.throwIfAborted();
 await runCommand('npm',['run','build'],target,{signal:controller.signal});
 controller.signal.throwIfAborted();
 started=await startProductionServer(target,port);
 console.log(`Isolated framework fixture ready: ${started.url}`);
 let serverFailure:Error|undefined;
 started.server.once('exit',(code,signal)=>{if(!controller.signal.aborted)serverFailure=new Error(`Fixture server exited unexpectedly: code=${code}, signal=${signal}`);signalExit();});
 await stopped;if(serverFailure)throw serverFailure;
}finally{
 process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);
 try{await started?.stop();}finally{
  try{
   try{await mkdir(join(source,'.artifacts/framework-fixture'),{recursive:true});await cp(join(target,'.artifacts'),join(source,'.artifacts/framework-fixture'),{recursive:true});}catch(error){if(!isMissing(error))throw error;}
  }finally{await rm(target,{recursive:true,force:true});}
 }
}
