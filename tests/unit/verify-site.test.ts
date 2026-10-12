import {it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {verifySite} from '../../scripts/verify-site';
it.each([null,'{"routes":{}}','{}','null','not JSON'])('replaces old passing site evidence when generated input fails: %s',async input=>{
 const root=await mkdtemp(join(tmpdir(),'verify-site-failure-'));
 try{
  await mkdir(join(root,'.artifacts/site'),{recursive:true});await writeFile(join(root,'.artifacts/site/summary.json'),'{"status":"passed","runId":"old"}');
  if(input!==null){await mkdir(join(root,'.generated'));await writeFile(join(root,'.generated/content-index.json'),input);}
  await expect(verifySite(root,{build:false})).rejects.toThrow('Site verification failed');
  const summary=JSON.parse(await readFile(join(root,'.artifacts/site/summary.json'),'utf8'));expect(summary.status).toBe('failed');expect(summary.runId).not.toBe('old');expect(summary.runErrors[0]).toContain('index:');expect(summary.checked).toBe(0);
 }finally{await rm(root,{recursive:true,force:true});}
});
