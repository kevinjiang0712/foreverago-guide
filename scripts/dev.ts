import {watch} from 'chokidar';
import {spawn} from 'node:child_process';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareContent} from './prepare-content';
import {prepareTheme} from '../src/content/theme';
import {writeGenerated} from '../src/content/write-generated';
export async function createContentWatcher(root:string,callbacks:{ready:()=>void;error:(error:Error)=>void}){
  let closed=false;let timer:ReturnType<typeof setTimeout>|undefined;let pending=Promise.resolve();
  const regenerate=async()=>{
    try{
      await prepareTheme(root);await prepareContent(root,{preview:true});
      await writeGenerated(join(root,'.generated/preparation-error.ts'),'export const preparationError: string | null = null;\n');
      callbacks.ready();
    }catch(error){
      const failure=error instanceof Error?error:new Error(String(error));
      await writeGenerated(join(root,'.generated/preparation-error.ts'),`export const preparationError: string | null = ${JSON.stringify(failure.message)};\n`);
      callbacks.error(failure);
    }
  };
  const watcher=watch(['config','content','public/media'].map(path=>join(root,path)),{ignoreInitial:true,awaitWriteFinish:{stabilityThreshold:80,pollInterval:20}});
  watcher.on('all',()=>{
    if(closed)return;
    clearTimeout(timer);
    timer=setTimeout(()=>{pending=pending.then(regenerate);},50);
  });
  await new Promise<void>((accept,reject)=>{watcher.once('ready',accept);watcher.once('error',reject);});
  watcher.on('error',error=>callbacks.error(error instanceof Error?error:new Error(String(error))));
  pending=pending.then(regenerate);
  await pending;
  return {close:async()=>{closed=true;clearTimeout(timer);await watcher.close();await pending;}};
}
async function startDevelopment(){
  const root=process.cwd();
  // A first invalid site cannot boot against yesterday's generated index.
  await prepareTheme(root);await prepareContent(root,{preview:true});
  const watcher=await createContentWatcher(root,{ready:()=>console.log('Configuration and content updated.'),error:error=>console.error(`Content preparation failed:\n${error.message}`)});
  const server=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'dev','--webpack',...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:process.env});
  let closing=false;
  const stop=async()=>{if(closing)return;closing=true;await watcher.close();server.kill('SIGTERM');};
  process.once('SIGINT',()=>{void stop();});process.once('SIGTERM',()=>{void stop();});
  server.once('error',error=>{console.error(error);process.exitCode=1;void stop();});
  server.once('exit',code=>{process.exitCode=code??0;void watcher.close();});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await startDevelopment();
