import {runtimeLayouts,templateLayouts} from '../../src/content/template-layouts';
import {expect,test} from 'vitest';
import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {templateNames} from '../../src/content/template-names';
import {templateName} from '../../src/content/schemas/page';
import {matrixFloors} from '../../scripts/matrix-page';

test('the page schema and visual catalogue cover the complete registered template set',()=>{
 expect(templateNames).toHaveLength(14);expect(new Set(templateNames).size).toBe(14);
 expect(runtimeLayouts).toEqual(['site-home','list-page','article-page','weapon-explorer','interactive-map','catalog-page','database-detail','mod-detail','build-detail']);
 expect(new Set(Object.keys(templateLayouts))).toEqual(new Set(templateNames));
 expect(new Set([...Object.values(templateLayouts),'build-detail'])).toEqual(new Set(runtimeLayouts));
 expect(templateName.options).toEqual(templateNames.filter(name=>name!=='site-home'));
 expect(Object.keys(matrixFloors).sort()).toEqual([...templateNames].sort());
});
test('every catalogue entry has a real component, stylesheet and model, with no prototype runtime dependency',async()=>{
 for(const name of runtimeLayouts){
  const component=name.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join('');
  const directory=join(process.cwd(),'src/templates',name);
  const source=await readFile(join(directory,`${component}.tsx`),'utf8');
  expect(source,`${name} must render its own template`).toContain(`data-template="${name}"`);
  expect(source).not.toMatch(/(?:support\.js|_ds_bundle|page-interactions\.js|nav-controls\.js)/);
  if(!['article-page','build-detail'].includes(name))await access(join(directory,'model.ts'));await access(join(directory,`${name}.css`));
 }
});
