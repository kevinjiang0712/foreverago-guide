import {it,expect,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runCommand} from '../../scripts/test-server';
it('resolves a successful owned command',async()=>{await expect(runCommand(process.execPath,['-e','process.exit(0)'],process.cwd())).resolves.toBeUndefined();});
it('rejects the actual nonzero exit code',async()=>{await expect(runCommand(process.execPath,['-e','process.exit(7)'],process.cwd())).rejects.toThrow('code=7');});
it('does not start a command after cancellation',()=>{const controller=new AbortController();controller.abort();expect(()=>runCommand('command-that-must-not-run',[],process.cwd(),{signal:controller.signal})).toThrow();});
it('stops an in-progress owned command when cancelled',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-command-'));const controller=new AbortController();
 const running=runCommand(process.execPath,['-e',"require('node:fs').writeFileSync('pid',String(process.pid));setInterval(()=>{},1000)"],root,{signal:controller.signal});
 const outcome=running.then(()=>({error:null}),error=>({error}));
 try{
  let pid:number|undefined;const deadline=Date.now()+5000;
  while(!pid){try{pid=Number(await readFile(join(root,'pid'),'utf8'));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}if(Date.now()>deadline)throw new Error('Child did not start');if(!pid)await new Promise(accept=>setTimeout(accept,20));}
  controller.abort();expect((await outcome).error?.message).toContain('Command aborted');
  expect(()=>process.kill(pid,0)).toThrow();
 }finally{controller.abort();await outcome;await rm(root,{recursive:true,force:true});}
});
it('cancellation also stops descendants in the owned build group',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-command-tree-'));const controller=new AbortController();
 const script="const child=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});require('node:fs').writeFileSync('descendant',String(child.pid));setInterval(()=>{},1000)";
 const outcome=runCommand(process.execPath,['-e',script],root,{signal:controller.signal}).then(()=>null,error=>error as Error);
 try{
  let pid=0;const deadline=Date.now()+5000;
  while(!pid){try{pid=Number(await readFile(join(root,'descendant'),'utf8'));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}if(Date.now()>deadline)throw new Error('Descendant did not start');if(!pid)await new Promise(accept=>setTimeout(accept,20));}
  controller.abort();expect((await outcome)?.message).toContain('Command aborted');
  await expect.poll(()=>{try{process.kill(pid,0);return true;}catch(error){if(error instanceof Error&&'code' in error&&error.code==='ESRCH')return false;throw error;}},{timeout:2000}).toBe(false);
 }finally{controller.abort();await outcome;await rm(root,{recursive:true,force:true});}
});
it('retains forced termination after the parent exits while a descendant ignores SIGTERM',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-command-stubborn-'));const controller=new AbortController();let pid=0;let probeDenied=false;let forcedDenied=false;const kill=process.kill.bind(process);
 const probe=vi.spyOn(process,'kill').mockImplementation((pid,signal)=>{if(controller.signal.aborted&&pid<0&&signal===0&&!probeDenied){probeDenied=true;throw Object.assign(new Error('transient group probe denied'),{code:'EPERM'});}if(pid<0&&signal==='SIGKILL'&&!forcedDenied){forcedDenied=true;kill(pid,signal);throw Object.assign(new Error('group exited during forced signal'),{code:'EPERM'});}return kill(pid,signal);});
 const descendant="process.on('SIGTERM',()=>{});require('node:fs').writeFileSync('descendant',String(process.pid));setInterval(()=>{},1000)";
 const script=`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'ignore'});setInterval(()=>{},1000)`;
 const outcome=runCommand(process.execPath,['-e',script],root,{signal:controller.signal}).then(()=>null,error=>error as Error);
 try{
  const deadline=Date.now()+5000;
  while(!pid){try{pid=Number(await readFile(join(root,'descendant'),'utf8'));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}if(Date.now()>deadline)throw new Error('Stubborn descendant did not start');if(!pid)await new Promise(accept=>setTimeout(accept,20));}
  controller.abort();const error=await outcome;expect(probeDenied).toBe(true);expect(forcedDenied).toBe(true);expect(error?.message,error?.stack).toContain('Command aborted');expect(()=>process.kill(pid,0)).toThrow();
 }finally{controller.abort();await outcome;probe.mockRestore();if(pid)try{process.kill(pid,'SIGKILL');}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ESRCH'))throw error;}await rm(root,{recursive:true,force:true});}
},12000);
