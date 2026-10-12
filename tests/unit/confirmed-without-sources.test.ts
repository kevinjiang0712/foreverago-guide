import {expect,it} from 'vitest';
import {homeSchema} from '../../src/content/schemas/home';
import {pageSchema} from '../../src/content/schemas/page';
import {siteFixture} from './site-fixture';

it('accepts confirmed home and article without a sources field',async()=>{
 const input=await siteFixture();
 const {sourcePath:homePath,...home}=input.homes[0];void homePath;
 const {sourcePath:pagePath,body,bodyLineOffset,mdxSource,...page}=input.pages[0];
 void pagePath;void body;void bodyLineOffset;void mdxSource;
 for(const [schema,value] of [[homeSchema,home],[pageSchema,page]] as const){
  const result=schema.safeParse({...value,verification:'confirmed'});
  expect(result.success).toBe(true);
  if(result.success)expect(result.data).not.toHaveProperty('sources');
  expect(schema.safeParse({...value,sources:[]}).success).toBe(false);
 }
});
