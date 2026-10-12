import {it,expect} from 'vitest';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {layeredContrast} from '../../scripts/matrix-page';
import {verifyMatrix} from '../../scripts/verify-matrix';
it('composites group opacity into both ink and background',()=>{
 const ratio=layeredContrast('rgb(255,255,255)',[{background:'rgb(0,0,0)',opacity:.5},{background:'rgb(255,255,255)',opacity:1}]);
 expect(ratio).toBeGreaterThan(3.9);expect(ratio).toBeLessThan(4.0);
 expect(layeredContrast('rgb(0,0,0)',[{background:'rgb(255,255,255)',opacity:1}])).toBe(21);
});
it.each([{templates:[]},{widths:[390,390]},{themes:[]}])('persists a new failed report for invalid matrix selection %j',async options=>{
 const root=await mkdtemp(join(tmpdir(),'matrix-report-'));
 try{
  const artifact=join(root,'.artifacts/matrix-scoped');await mkdir(artifact,{recursive:true});await writeFile(join(artifact,'summary.json'),'{"status":"passed","runId":"old"}');
  await expect(verifyMatrix(root,options)).rejects.toThrow('Matrix incomplete');
  const report=JSON.parse(await readFile(join(artifact,'summary.json'),'utf8'));expect(report.status).toBe('failed');expect(report.runId).not.toBe('old');expect(report.runErrors[0]).toContain('Invalid matrix');
 }finally{await rm(root,{recursive:true,force:true});}
});
it('records all 112 unexecuted combinations when startup input is missing',async()=>{
 const root=await mkdtemp(join(tmpdir(),'matrix-full-failure-'));
 try{
  await expect(verifyMatrix(root)).rejects.toThrow('Matrix incomplete');
  const report=JSON.parse(await readFile(join(root,'.artifacts/matrix/summary.json'),'utf8'));expect(report.status).toBe('failed');expect(report.expected).toBe(112);expect(report.blocked).toBe(112);expect(report.missing).toHaveLength(112);
 }finally{await rm(root,{recursive:true,force:true});}
});
