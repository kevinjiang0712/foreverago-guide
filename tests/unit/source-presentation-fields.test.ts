import {readFile} from 'node:fs/promises';
import {expect,it} from 'vitest';
import {recordSchema} from '../../src/content/schemas/record';

const records=['build-library','weapon-explorer','practice-blade-detail','demo-guide-detail','interactive-map'];
const copy={eyebrow:'Sources',title:'Sources',description:'Old presentation copy'};
async function withoutSourcePresentation(id:string){
 const record=JSON.parse(await readFile(`content/en/records/${id}.json`,'utf8'));
 delete record.sourceGroups;
 delete record.sourceNote;
 delete record.sourceSection;
 if(record.sections)delete record.sections.sources;
 return record;
}

it.each(records)('%s accepts confirmed content without source fields',async id=>{
 const record=await withoutSourcePresentation(id);
 const parsed=recordSchema.parse({...record,verification:'confirmed'});
 expect(parsed).not.toHaveProperty('sources');
 for(const sources of [[],[{label:'Evidence',url:'https://wiki.garden/evidence'}]]){
  const result=recordSchema.safeParse({...record,sources});
  expect(result.success).toBe(false);
  if(!result.success)expect(result.error.issues).toContainEqual(expect.objectContaining({code:'unrecognized_keys',keys:['sources']}));
 }
});

it.each(records)('%s rejects removed presentation fields instead of silently dropping them',async id=>{
 const record=await withoutSourcePresentation(id);
 for(const legacy of [{sourceGroups:[]},{sourceNote:'Unused'},{sourceSection:copy}]){
  const result=recordSchema.safeParse({...record,...legacy});
  expect(result.success).toBe(false);
  if(!result.success)expect(result.error.issues).toContainEqual(expect.objectContaining({code:'unrecognized_keys',keys:[Object.keys(legacy)[0]]}));
 }
 if(record.sections)expect(recordSchema.safeParse({...record,sections:{...record.sections,sources:copy}}).success).toBe(false);
});

it.each(['weapon-explorer','practice-blade-detail'])('%s rejects removed patch sourceUrl',async id=>{
 const record=await withoutSourcePresentation(id);
 const patch={id:'update',version:null,change:'An update',verification:'unverified',...(id==='weapon-explorer'?{weaponId:null,subject:null}:{})};
 expect(recordSchema.safeParse({...record,patchHistory:[patch]}).success).toBe(true);
 expect(recordSchema.safeParse({...record,patchHistory:[{...patch,sourceUrl:'https://wiki.garden/evidence'}]}).success).toBe(false);
});
