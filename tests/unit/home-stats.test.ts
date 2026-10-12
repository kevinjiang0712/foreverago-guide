import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {homeSchema} from '../../src/content/schemas/home';
import {parseContent} from '../../src/content/issues';

const home=JSON.parse(readFileSync('content/en/home.json','utf8'));
function withValue(value:unknown){
 return {...home,hero:{...home.hero,stats:[{label:'Example',value}]}};
}

it.each(['0','24','98%','1–4 players','2026-09-22','  PC / Console  ',null])('preserves the supplied stat text or null: %j',value=>{
 expect(homeSchema.parse(withValue(value)).hero.stats?.[0].value).toBe(value);
});

it.each([0,2,1.5,true,{},[],undefined,'',' \t\n '])('rejects non-text or blank stat values: %j',value=>{
 expect(homeSchema.safeParse(withValue(value)).success).toBe(false);
});

it('rejects a missing value instead of supplying a default',()=>{
 const input={...home,hero:{...home.hero,stats:[{label:'Example'}]}};
 expect(homeSchema.safeParse(input).success).toBe(false);
});

it('reports the file, field and rejected numeric value',()=>{
 expect(()=>parseContent(homeSchema,withValue(24),'content/en/home.json')).toThrow(/content\/en\/home.json :: hero.stats.0.value = 24/);
});
