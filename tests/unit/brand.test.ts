import {expect,it} from 'vitest';
import {readFile} from 'node:fs/promises';
import {gameSchema} from '../../src/content/schemas/game';
import {dictionarySchema} from '../../src/content/schemas/dictionary';
import {siteSchema} from '../../src/content/schemas/site';
import {homeSchema} from '../../src/content/schemas/home';
import {parseContent} from '../../src/content/issues';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {buildBrand,buildFooter} from '../../src/content/navigation';

it.each([0,1,40,41])('validates game name length %s',length=>{
 expect(gameSchema.safeParse({name:'W'.repeat(length)}).success).toBe(length>=1&&length<=40);
});
it.each([undefined,null,'   ','Game\n','\rGame','Game\u2028Name','Game\u2029Name'])('rejects missing, blank or multiline name %j',name=>{
 expect(gameSchema.safeParse({name}).success).toBe(false);
});
it('counts Unicode code points, spaces and punctuation after trimming',()=>{
 expect(gameSchema.parse({name:'  Game: Part II  '}).name).toBe('Game: Part II');
 expect(gameSchema.safeParse({name:'𠮷'.repeat(40)}).success).toBe(true);
 expect(gameSchema.safeParse({name:'A'.repeat(39)+' !'}).success).toBe(false);
});
it('reports the source, field, rejected value and length constraint',async()=>{
 const dictionary=JSON.parse(await readFile('tests/fixtures/input/site/content/locales/en.json','utf8'));dictionary.game.name='W'.repeat(41);
 expect(()=>parseContent(dictionarySchema,dictionary,'content/locales/en.json')).toThrow(/content\/locales\/en.json.*game.name.*W{41}.*1–40.*41/);
});
it('derives the same complete name for every brand location and homepage H1',async()=>{
 const input=await siteFixture();
 const dictionary=JSON.parse(await readFile('tests/fixtures/input/site/content/locales/en.json','utf8'));
 dictionary.game.name='W'.repeat(40);input.dictionaries[0]=dictionarySchema.parse(dictionary);
 const index=buildIndex(input,{preview:false});const name='W'.repeat(40)+' Wiki';
 expect(index.dictionaries.en.siteName).toBe(name);
 expect(buildBrand(index,'en').name).toBe(name);
 expect(buildFooter(index,'en').brand.name).toBe(name);
 expect(index.homes.en.hero.title).toBe(name);
 expect(Array.from(name)).toHaveLength(45);
 expect(buildBrand(index,'ja').name).toBe(`${input.dictionaries[1].game.name} Wiki`);
});
it('rejects obsolete independently authored brand and H1 fields',async()=>{
 const dictionary=JSON.parse(await readFile('tests/fixtures/input/site/content/locales/en.json','utf8'));
 for(const key of ['siteName','siteSuffix'])expect(dictionarySchema.safeParse({...dictionary,[key]:'Custom'}).success).toBe(false);
 const input=await siteFixture();
 expect(siteSchema.safeParse({...input.site,brand:{...input.site.brand,separator:'·'}}).success).toBe(false);
 expect(siteSchema.safeParse({...input.site,policies:{gameName:'Another game',contactEmail:null,effectiveDate:'2026-09-22'}}).success).toBe(false);
 const {sourcePath,...home}=input.homes[0];void sourcePath;
 expect(homeSchema.safeParse({...home,hero:{...home.hero,title:'Custom'}}).success).toBe(false);
});
