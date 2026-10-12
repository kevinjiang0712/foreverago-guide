import {spawn,type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {join} from 'node:path';
export function runCommand(command:string,args:string[],cwd:string,options:{env?:NodeJS.ProcessEnv;signal?:AbortSignal}={}){
 options.signal?.throwIfAborted();
 return new Promise<void>((accept,reject)=>{
  const grouped=process.platform!=='win32';
  // The isolated build owns this process group, including npm's descendants.
  const child=spawn(command,args,{cwd,env:options.env??process.env,stdio:'inherit',detached:grouped});
  let aborted=false;
  const cleanup=()=>options.signal?.removeEventListener('abort',abort);
  const terminate=async()=>{
   if(!child.pid)return;
   const pid=grouped?-child.pid:child.pid;let lastDenial:Error|undefined;
   const signal=(value:NodeJS.Signals|0)=>{
    try{process.kill(pid,value);return true;}catch(error){
     if(error instanceof Error&&'code' in error&&error.code==='ESRCH')return false;
     // On macOS a zombie-only group can briefly return EPERM. Never treat it as gone.
     if(error instanceof Error&&'code' in error&&error.code==='EPERM'){lastDenial=error;return true;}
     throw error;
    }
   };
   if(!signal('SIGTERM'))return;
   const began=Date.now();let forced=false;
   while(signal(0)){
    const elapsed=Date.now()-began;
    if(elapsed>=7000)throw new Error(`Owned command group did not terminate: ${child.pid}${lastDenial?`; ${lastDenial.message}`:''}`);
    if(elapsed>=5000&&!forced){forced=true;if(!signal('SIGKILL'))return;}
    await new Promise(accept=>setTimeout(accept,25));
   }
  };
  const abort=()=>{
   if(aborted)return;aborted=true;
   void terminate().then(()=>{cleanup();reject(new Error(`Command aborted: ${command} ${args.join(' ')}`));},error=>{cleanup();reject(error);});
  };
  child.once('error',error=>{cleanup();reject(error);});
  child.once('close',(code,signal)=>{
   // The group may outlive its parent; cancellation settles only after group cleanup.
   if(aborted)return;cleanup();if(code===0)accept();else reject(new Error(`${command} ${args.join(' ')} failed: code=${code}, signal=${signal}`));
  });
  options.signal?.addEventListener('abort',abort,{once:true});
  if(options.signal?.aborted)abort();
 });
}
export function availablePort(){return new Promise<number>((accept,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{const address=probe.address();if(!address||typeof address==='string'){probe.close();reject(new Error('Could not allocate a local test port'));return;}probe.close(error=>error?reject(error):accept(address.port));});});}
export async function stopServer(server:ChildProcess){
 if(!server.pid||server.exitCode!==null||server.signalCode!==null)return;
 const exited=new Promise<void>(accept=>server.once('exit',()=>accept()));
 const timer=setTimeout(()=>server.kill('SIGKILL'),5000);server.kill('SIGTERM');
 try{await exited;}finally{clearTimeout(timer);}
}
export async function startProductionServer(root:string,port=0){
 if(!port)port=await availablePort();
 const server=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
 let output='';let ready=false;server.stdout.on('data',chunk=>{process.stdout.write(chunk);output=(output+String(chunk)).slice(-4000);ready||=/Ready in/.test(output);});server.stderr.on('data',chunk=>process.stderr.write(chunk));
 let spawnError:Error|undefined;server.once('error',error=>{spawnError=error;});
 const url=`http://127.0.0.1:${port}`;const deadline=Date.now()+30000;
 try{while(true){
  if(spawnError)throw spawnError;if(server.exitCode!==null||server.signalCode!==null)throw new Error(`Test server exited before ready: code=${server.exitCode}, signal=${server.signalCode}`);
  let response:Response|undefined;if(ready)try{response=await fetch(url,{signal:AbortSignal.timeout(1500)});}catch(error){if(!(error instanceof TypeError)&&!(error instanceof DOMException&&error.name==='TimeoutError'))throw error;}
  if(response?.ok&&server.exitCode===null&&server.signalCode===null)break;if(response)throw new Error(`Test server returned HTTP ${response.status}`);
  if(Date.now()>deadline)throw new Error(`Test server startup timed out: ${url}`);await new Promise(accept=>setTimeout(accept,100));
 }}catch(error){await stopServer(server);throw error;}
 return {url,server,stop:()=>stopServer(server)};
}
