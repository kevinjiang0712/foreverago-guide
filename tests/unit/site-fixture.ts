import {readSite,type SiteInput} from '../../src/content/read-site';
import {pageSchema} from '../../src/content/schemas/page';
export async function siteFixture():Promise<SiteInput>{
 const input=await readSite('tests/fixtures/input/site');
 input.pages=['en','ja'].map(locale=>({...pageSchema.parse({id:'first-steps',locale,slug:locale==='ja'?'hajime':'first-steps',category:'guides',template:'wiki-page',guide:{eyebrow:'Chapter',title:'Start',stats:[{label:'Time',value:null}],table:null,route:null},title:'Guide',description:'Demonstration guide.',status:'published',demo:true}),body:'## Start\nText.',bodyLineOffset:0,mdxSource:'## Start\nText.',sourcePath:`content/${locale}/pages/first-steps.mdx`}));
 return input;
}
