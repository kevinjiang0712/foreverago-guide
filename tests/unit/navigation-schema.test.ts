import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {siteSchema} from '../../src/content/schemas/site';
import {categorySchema} from '../../src/content/schemas/category';
import {parseContent} from '../../src/content/issues';
import {buildIndex} from '../../src/content/build-index';

const entry=(i:number)=>({label:`Menu ${i}`,target:{type:'external' as const,url:`https://fixture-game.com/menu-${i}`},children:[]});
it.each([3,4,8,9])('checks primary menu count %s',async count=>{
 const {site}=await siteFixture();site.navigation.en=Array.from({length:count},(_,i)=>entry(i));
 expect(siteSchema.safeParse(site).success).toBe(count>=4&&count<=8);
});
it.each([0,1,10,11])('checks submenu count %s',async count=>{
 const {site}=await siteFixture();site.navigation.en[0].children=Array.from({length:count},(_,i)=>({label:`Child ${i}`,target:entry(i).target}));
 expect(siteSchema.safeParse(site).success).toBe(count<=10);
});
it.each([1,2,14,15])('checks English primary label length %s',async length=>{
 const {site}=await siteFixture();site.navigation.en[0].label='W'.repeat(length);
 expect(siteSchema.safeParse(site).success).toBe(length>=2&&length<=14);
});
it.each([1,2,28,29])('checks English child label length %s',async length=>{
 const {site}=await siteFixture();site.navigation.en[0].children=[{label:'W'.repeat(length),target:{type:'home'}}];
 expect(siteSchema.safeParse(site).success).toBe(length>=2&&length<=28);
});
it('trims edges but counts internal spaces and punctuation',async()=>{
 const {site}=await siteFixture();site.navigation.en[0].label='  PC  ';
 expect(siteSchema.parse(site).navigation.en[0].label).toBe('PC');
 site.navigation.en[0].label='Combat Systems';expect(siteSchema.safeParse(site).success).toBe(true);
 site.navigation.en[0].label='Combat Systems!';expect(siteSchema.safeParse(site).success).toBe(false);
});
it.each(['','   ','Guides\n','Combat\rSystems'])('rejects empty or multiline label %j',async label=>{
 const {site}=await siteFixture();site.navigation.en[0].label=label;expect(siteSchema.safeParse(site).success).toBe(false);
});
it('reports the rejected field, value and required length',async()=>{
 const {site}=await siteFixture();site.navigation.en[0].label='This label is too long';
 expect(()=>parseContent(siteSchema,site,'config/site.json')).toThrow(/config\/site.json.*navigation.en.0.label.*This label is too long.*2–14.*received 22/);
});
it('requires enabled locales and does not apply English budgets to Japanese',async()=>{
 const {site}=await siteFixture();site.navigation.ja[0].label='資料の読み方と未確認情報を整理するためのテンプレート見本';expect(siteSchema.safeParse(site).success).toBe(true);
 delete site.navigation.ja;expect(siteSchema.safeParse(site).success).toBe(false);
 site.navigation.ja=site.navigation.en;site.navigation.fr=site.navigation.en;expect(siteSchema.safeParse(site).success).toBe(false);
});
it('rejects duplicate targets within each menu even under different labels',async()=>{
 const {site}=await siteFixture();site.navigation.en[1].target=site.navigation.en[0].target;expect(siteSchema.safeParse(site).success).toBe(false);
 site.navigation.en[1].target={type:'category',id:'guides'};site.navigation.en[0].children=[{label:'First',target:{type:'home'}},{label:'Second',target:{type:'home'}}];expect(siteSchema.safeParse(site).success).toBe(false);
});
it('requires children and rejects nested submenus or legacy category submenu',async()=>{
 const {site,categories}=await siteFixture();
 const missing=structuredClone(site);delete (missing.navigation.en[0] as {children?:unknown}).children;expect(siteSchema.safeParse(missing).success).toBe(false);
 site.navigation.en[0].children=[{...entry(0)}];expect(siteSchema.safeParse(site).success).toBe(false);
 expect(categorySchema.safeParse({...categories[0],submenu:[]}).success).toBe(false);
});
it('rejects a missing content target instead of replacing or dropping it',async()=>{
 const input=await siteFixture();input.site.navigation.en[1].children=[{label:'Missing',target:{type:'content',id:'missing'}}];
 expect(()=>buildIndex(input,{preview:false})).toThrow(/navigation.en.1.children.0.target.*missing.*published/);
});
