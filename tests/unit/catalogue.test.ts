import {expect,it} from 'vitest';
import {readSite} from '../../src/content/read-site';
import {buildIndex} from '../../src/content/build-index';
import {validateTemplateRecord} from '../../src/content/template-references';
import {catalogModel,catalogResults,comparableColumns} from '../../src/templates/catalog-page/model';
import {recordSchema} from '../../src/content/schemas/record';
async function fixture(){const input=await readSite('examples/site-a');return {input,index:buildIndex(input,{preview:false})};}
it('sorts numeric values numerically and keeps unknowns last in both directions',async()=>{
 const {index}=await fixture(),model=catalogModel(index,index.pagesByKey['en:database-index']);
 const originalEntries={...model,entries:model.entries.slice(0,5)};
 expect(catalogResults(originalEntries,'',{},'attack',false,'en').map(row=>row.values.attack)).toEqual([0,8,10,24,null]);
 expect(catalogResults(originalEntries,'',{},'attack',true,'en').map(row=>row.values.attack)).toEqual([24,10,8,0,null]);
 expect(catalogResults(model,'practice',{category:['weapons']},'listed',false,'en').map(row=>row.id)).toEqual(['sample-blade','sample-sabre','sample-greatsword']);
});
it('does not invent comparable values for undocumented entries',async()=>{
 const {index}=await fixture(),model=catalogModel(index,index.pagesByKey['en:database-index']);
 expect(comparableColumns(model,[model.entries[0],model.entries[4]])).toEqual([]);
 expect(comparableColumns(model,model.entries.slice(0,2)).map(column=>column.id)).toEqual(['attack','weight','acquisition']);
});
it.each(['missing','wrong-type','unknown-field','wrong-category','wrong-detail','duplicate-entry'])('rejects database contract violation %s',async violation=>{
 const {input}=await fixture();const entry=input.records.find(record=>record.locale==='en'&&record.id==='sample-blade')!;
 const database=input.records.find(record=>record.locale==='en'&&record.type==='database-index')!;
 if(entry.type!=='database-entry'||database.type!=='database-index')throw new Error('missing fixtures');
 if(violation==='missing')delete entry.values.attack;
 if(violation==='wrong-type')entry.values.attack='10';
 if(violation==='unknown-field')entry.values.unregistered=10;
 if(violation==='wrong-category')entry.categoryId='unknown';
 if(violation==='wrong-detail')entry.contentId='first-steps';
 if(violation==='duplicate-entry'){database.entryIds.push(database.entryIds[0]);const {sourcePath,...record}=database;void sourcePath;expect(recordSchema.safeParse(record).success).toBe(false);return;}
 expect(()=>buildIndex(input,{preview:false})).toThrow();
});
it('rejects production entry references to demo database definitions',async()=>{
 const {index}=await fixture();index.records['en:sample-blade'].demo=false;
 expect(()=>validateTemplateRecord(index,'en:sample-blade',true)).toThrow(/demo database/);
});
it('resolves all catalogue detail links through the content index',async()=>{
 const {index}=await fixture();
 for(const type of ['build-library','mod-index','database-index']){
  const page=Object.values(index.pagesByKey).find(page=>page.locale==='en'&&page.template===type)!;
  for(const entry of catalogModel(index,page).entries)if(entry.path)expect(index.routes[entry.path]).toBeDefined();
 }
});
