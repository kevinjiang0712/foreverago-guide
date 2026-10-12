import {expect,it} from 'vitest';
import {mkdtemp,cp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createContentWatcher} from '../../scripts/dev';
it('watches real additions/deletions and exposes errors until corrected',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-watch-'));let watcher:Awaited<ReturnType<typeof createContentWatcher>>|undefined;
 try{
  for(const dir of ['config','content','public','src/styles'])await cp(dir==='src/styles'?dir:join('tests/fixtures/input/site',dir),join(root,dir),{recursive:true});
  await mkdir(join(root,'content/en/pages'),{recursive:true});
  let updates=0;const failures:string[]=[];
  watcher=await createContentWatcher(root,{ready:()=>{updates++;},error:error=>{failures.push(error.message);}});
  const page=join(root,'content/en/pages/watched.mdx');const source='---\nid: watched\nlocale: en\nslug: watched\ncategory: guides\ntemplate: wiki-page\nguide: {eyebrow: Chapter, title: Start, stats: [{label: Time, value: null}], table: null, route: null}\ntitle: Watched\ndescription: Watch fixture.\nstatus: published\ndemo: true\n---\n## Watch\nVisible.';
  await writeFile(page,source);
  await expect.poll(async()=>await readFile(join(root,'.generated/mdx-imports.ts'),'utf8'),{timeout:6000}).toContain('watched');
  await writeFile(page,source+'\n<Media id="missing" />');
  await expect.poll(()=>failures.join('\n'),{timeout:6000}).toContain('missing');
  expect(await readFile(join(root,'.generated/preparation-error.ts'),'utf8')).toContain('missing');
  await rm(page);
  await expect.poll(async()=>await readFile(join(root,'.generated/preparation-error.ts'),'utf8'),{timeout:6000}).toBe('export const preparationError: string | null = null;\n');
  expect(await readFile(join(root,'.generated/mdx-imports.ts'),'utf8')).not.toContain('watched');expect(updates).toBeGreaterThanOrEqual(2);
 }finally{await watcher?.close();await rm(root,{recursive:true,force:true});}
},15000);
