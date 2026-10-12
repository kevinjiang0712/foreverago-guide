import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {buildNavigation,buildLocaleChoices,buildFooter} from '../../src/content/navigation';
it('uses explicit labels and marks the section by target even when labels match',async()=>{
 const input=await siteFixture();input.site.navigation.en[0].label=input.site.navigation.en[1].label='Menu';
 input.dictionaries[0].categories.guides.title='Long page title that must not become the navigation label';
 const index=buildIndex(input,{preview:false});const nav=buildNavigation(index,'en',index.routes['/guides/first-steps']);
 expect(nav).toHaveLength(4);expect(nav[1]).toMatchObject({id:'category:guides',label:'Menu',current:true});
 expect(nav.filter(item=>item.current)).toHaveLength(1);
});
it('prefers exact configured content over its category',async()=>{
 const input=await siteFixture();input.site.navigation.en.push({label:'Start',target:{type:'content',id:'first-steps'},children:[]});
 const index=buildIndex(input,{preview:false});const nav=buildNavigation(index,'en',index.routes['/guides/first-steps']);
 expect(nav.filter(item=>item.id==='category:guides')).toHaveLength(1);
 expect(nav.filter(item=>item.current).map(item=>item.id)).toEqual(['content:first-steps']);
 expect(buildNavigation(index,'en').some(item=>item.current)).toBe(false);
});
it('does not fabricate translation paths and supplies an explicit language home',async()=>{
 const input=await siteFixture();input.pages=input.pages.filter(p=>p.locale==='en');const index=buildIndex(input,{preview:false});
 expect(buildLocaleChoices(index,'en',index.routes['/guides/first-steps'])[1]).toMatchObject({locale:'ja',href:null,homeHref:'/ja',current:false});
});
it('keeps footer navigation synchronized and hides missing community URLs',async()=>{
 const input=await siteFixture();const index=buildIndex(input,{preview:false});const footer=buildFooter(index,'en');
 expect(footer.columns.map(column=>column.id)).toEqual(['navigation','featured']);
 expect(footer.columns[0].links).toEqual(buildNavigation(index,'en').map(({id,label,href})=>({id,label,href})));
 expect(footer.columns[1].links).toEqual([{id:'content:first-steps',label:'Guide',href:'/guides/first-steps'}]);
 input.site.officialLinks.official='https://official.example';
 expect(buildFooter(buildIndex(input,{preview:false}),'en').columns[2].links).toEqual([{id:'official:official',href:'https://official.example',label:'Official site'}]);
});
it('does not append visible categories and preserves explicit order for eight entries',async()=>{
 const input=await siteFixture();for(let number=1;number<=4;number++){
  const id='section-'+number;input.categories.push({id,slug:id,order:10-number,navigation:true,landing:null,showWhenEmpty:true});
  for(const dictionary of input.dictionaries)dictionary.categories[id]={title:id,description:id};
 }
 expect(buildNavigation(buildIndex(input,{preview:false}),'en')).toHaveLength(4);
 for(let number=1;number<=4;number++)input.site.navigation.en.push({label:'Section '+number,target:{type:'category',id:'section-'+number},children:[]});
 const nav=buildNavigation(buildIndex(input,{preview:false}),'en');
 expect(nav).toHaveLength(8);expect(nav.slice(4).map(item=>item.id)).toEqual(['category:section-1','category:section-2','category:section-3','category:section-4']);
});
it('uses explicit translated child labels and actual localized paths',async()=>{
 const input=await siteFixture();input.site.navigation.ja[1].children=[{label:'始める',target:{type:'content',id:'first-steps'}}];
 const index=buildIndex(input,{preview:false});
 expect(buildNavigation(index,'ja')[1].children).toEqual([{id:'content:first-steps',label:'始める',href:'/ja/guides/hajime'}]);
 expect(buildNavigation(index,'en')[1].children).toEqual([]);
});
it.each([false,true])('uses submenu parent only when no primary category target exists (present=%s)',async(present)=>{
 const input=await siteFixture();
 if(!present)input.site.navigation.en[1]={label:'Reference',target:{type:'external',url:'https://fixture-game.com/reference'},children:[]};
 input.site.navigation.en[2].children=[{label:'Start',target:{type:'content',id:'first-steps'}}];
 const index=buildIndex(input,{preview:false});const nav=buildNavigation(index,'en',index.routes['/guides/first-steps']);
 expect(nav.filter(item=>item.current).map(item=>item.id)).toEqual([present?'category:guides':'external:https://fixture-game.com/help']);
});
it('resolves explicit category and external child targets',async()=>{
 const input=await siteFixture();input.site.navigation.en[0].children=[{label:'Browse',target:{type:'category',id:'guides'}},{label:'Help',target:{type:'external',url:'https://fixture-game.com/help'}}];
 const index=buildIndex(input,{preview:false});expect(buildNavigation(index,'en')[0].children.map(({label,href})=>({label,href}))).toEqual([{label:'Browse',href:'/guides'},{label:'Help',href:'https://fixture-game.com/help'}]);
});
it('keeps a small category route while making only its primary menu entry dropdown-only',async()=>{
 const input=await siteFixture();input.site.navigation.en[1].children=[{label:'Start here',target:{type:'content',id:'first-steps'}}];
 const index=buildIndex(input,{preview:false});const category=buildNavigation(index,'en')[1];
 expect(index.routes['/guides']).toBeDefined();
 expect(category.href).toBeNull();
 expect(category.children[0].href).toBe('/guides/first-steps');
});
