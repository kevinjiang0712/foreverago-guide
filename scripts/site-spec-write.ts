import {copyFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {join,dirname,extname} from 'node:path';
import sharp from 'sharp';
import {dump} from 'js-yaml';
import {contentError} from '../src/content/issues';
import {convertSiteMarkdown} from './site-spec-markdown';
import {safePackageFile,type SitePackage} from './site-spec-load';

async function writeJson(root:string,path:string,value:unknown){
 const output=join(root,path);await mkdir(dirname(output),{recursive:true});await writeFile(output,`${JSON.stringify(value,null,2)}\n`);
}
function relatedIds(pack:SitePackage,current:string):string[]{
 const pages=pack.articles.map((entry,i)=>({...entry.meta,inputOrder:i}));
 const item=pages.find(page=>page.id===current)!;
 const own=pages.filter(page=>page.category===item.category&&page.id!==current);
 const after=own.filter(page=>page.inputOrder>item.inputOrder),before=own.filter(page=>page.inputOrder<item.inputOrder);
 const categoryOrder=new Map(pack.categories.map(category=>[category.id,category.order]));
 const other=pages.filter(page=>page.category!==item.category).sort((a,b)=>(categoryOrder.get(a.category)??Infinity)-(categoryOrder.get(b.category)??Infinity)||a.inputOrder-b.inputOrder||a.id.localeCompare(b.id));
 const selected=[...after,...before,...other].slice(0,3).map(page=>page.id);
 if(selected.length!==3)contentError('en/pages.json',`${current}.related`,selected,'each article requires exactly three other articles');
 return selected;
}
async function writeMedia(root:string,pack:SitePackage){
 const entries=[];
 for(const asset of pack.assets){
  const input=await safePackageFile(pack.root,`media/${asset.file}`);
  const extension=extname(asset.file).toLowerCase();
  if(extension==='.svg'&&asset.id!==pack.site.logoAssetId)contentError('assets.json',`${asset.id}.file`,asset.file,'SVG is supported only for the logo');
  let width:number,height:number;
  try{const metadata=await sharp(input).metadata();if(!metadata.width||!metadata.height)throw new Error('missing dimensions');width=metadata.width;height=metadata.height;}
  catch(error){contentError('assets.json',`${asset.id}.file`,asset.file,`image cannot be decoded: ${error instanceof Error?error.message:String(error)}`);}
  const logo=asset.id===pack.site.logoAssetId;
  const outputName=logo?`logo${extension}`:`${asset.id}.webp`;
  const output=join(root,'public/media',outputName);await mkdir(dirname(output),{recursive:true});
  if(logo||extension==='.webp')await copyFile(input,output);
  else await sharp(input).webp({quality:82,effort:6}).toFile(output);
  const avifSources:{src:string;width:number}[]=[];
  if(pack.site.siteId==='forever-ago'&&['road-trip-art','campfire-art'].includes(asset.id)){
   for(const responsiveWidth of [640,960,1600]){
    const sourceWidth=Math.min(responsiveWidth,width!);if(avifSources.some(source=>source.width===sourceWidth))continue;
    const sourceName=`${asset.id}-${sourceWidth}.avif`;
    await sharp(input).resize({width:sourceWidth,withoutEnlargement:true}).avif({quality:55,effort:6}).toFile(join(root,'public/media',sourceName));
    avifSources.push({src:`/media/${sourceName}`,width:sourceWidth});
   }
  }
  entries.push({id:asset.id,src:`/media/${outputName}`,width:width!,height:height!,purpose:asset.id,alt:{en:asset.alt??pack.site.gameName},position:asset.position??'50% 50%',demo:false,...(avifSources.length?{avifSources}:{})});
 }
 for(const font of pack.theme.fonts){
  const input=await safePackageFile(pack.root,`media/${font.src.slice('/media/'.length)}`);
  const output=join(root,'public',font.src.slice(1));await mkdir(dirname(output),{recursive:true});await copyFile(input,output);
 }
 if(pack.home.weaponShowcase){
  const cells=[];
  for(const [i,id] of pack.home.weaponShowcase.imageIds.entries()){
   const asset=pack.assets.find(entry=>entry.id===id)!;
   const input=await safePackageFile(pack.root,`media/${asset.file}`);
   const buffer=await sharp(input).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
   cells.push({input:buffer,left:(i%4)*256,top:Math.floor(i/4)*256});
  }
  const output=join(root,'public/media/generated-weapon-showcase.webp');
  await sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells).webp({quality:82,effort:6}).toFile(output);
  entries.push({id:'generated-weapon-showcase',src:'/media/generated-weapon-showcase.webp',width:1024,height:1024,purpose:'4 × 4 weapon showcase',alt:{en:pack.home.weaponShowcase.ariaLabel},position:'50% 50%',demo:false});
 }
 await writeJson(root,'content/assets.json',entries);
}
function frontmatter(metadata:Record<string,unknown>,body:string){
 return `---\n${dump(metadata,{lineWidth:-1,noRefs:true,sortKeys:false}).trimEnd()}\n---\n\n${body.trim()}\n`;
}
export async function writeSitePackage(root:string,pack:SitePackage){
 for(const path of ['config','content','public/media'])await rm(join(root,path),{recursive:true,force:true});
 await mkdir(join(root,'public/media'),{recursive:true});
 await writeMedia(root,pack);
 const navigation=pack.site.navigation;
 await writeJson(root,'config/site.json',{
  siteId:pack.site.siteId,siteUrl:pack.site.siteUrl,defaultLocale:'en',locales:['en'],mode:'production',
  brand:{logo:pack.site.logoAssetId},officialLinks:pack.site.officialLinks,
  seo:{titleTemplate:'{title} | {siteName}',image:null,noindex:false},navigation,
  homepage:{featuredLimit:6,categoryFloorMinItems:4,categoryFloorLimit:8,layoutOverrides:{}},
  policies:{contactEmail:pack.site.contactEmail,effectiveDate:pack.site.effectiveDate},footer:{columns:[]},redirects:[],
 });
 const categoryCharacters=new Map(pack.categories.map(category=>[category.id,pack.characters.filter(character=>character.categoryId===category.id).map(character=>character.id)]));
 await writeJson(root,'config/categories.json',pack.categories.map(category=>({id:category.id,slug:category.slug,order:category.order,navigation:Object.values(navigation).some(entries=>entries.some(entry=>entry.target.type==='category'&&entry.target.id===category.id)),landing:category.landing??null,showWhenEmpty:false,...(categoryCharacters.get(category.id)?.length?{characterIds:categoryCharacters.get(category.id)}:{})})));
 const sampleDictionary=JSON.parse(await readFile(join(root,'examples/site-a/content/locales/en.json'),'utf8')) as Record<string,unknown>;
 const dictionary={...sampleDictionary,locale:'en',game:{name:pack.site.gameName},defaultDescription:pack.site.defaultDescription,
  categories:Object.fromEntries(Object.entries(pack.categoryCopy).map(([id,copy])=>[id,{title:copy.title,description:copy.description,seo:{...copy.seo,final:true}}])),
  footer:{description:pack.site.footerDescription,disclaimer:'Independent fan-made guide. Not affiliated with or endorsed by the game publisher.',copyright:'Game names and assets belong to their respective owners.',columns:{navigation:'Navigation',featured:'Featured','about-policies':'About & Policies',community:'Community'}},
  listGroups:{},
 };
 await writeJson(root,'content/locales/en.json',dictionary);
 await writeJson(root,'config/theme.json',{preset:'onimusha',defaultMode:pack.theme.defaultMode,common:{...pack.theme.common,'--font-num':pack.theme.common['--font-ui']},day:pack.theme.day,night:pack.theme.night,fonts:pack.theme.fonts});
 await writeJson(root,'config/ads.json',pack.ads);
 const home=pack.home;
 await writeJson(root,'content/en/home.json',{
  id:'home',template:'site-home',locale:'en',title:`${pack.site.gameName} Wiki`,description:home.description,status:'published',verification:'confirmed',demo:false,seo:{...home.seo,final:true},
  hero:{eyebrow:home.hero.eyebrow,description:home.hero.description,asset:home.hero.assetId,video:home.hero.video,stats:home.hero.stats},
  featured:{eyebrow:home.featured.eyebrow,title:home.featured.title,description:home.featured.description,pinnedIds:home.featured.articleIds},
  about:{eyebrow:home.about.eyebrow,title:home.about.title,paragraphs:[home.about.paragraph],facts:home.about.facts,link:{label:'About',target:{type:'content',id:'about'}}},
  articleFloors:home.articleFloors.map(floor=>({id:floor.id,eyebrow:floor.eyebrow,title:floor.title,description:floor.description,articleIds:floor.articleIds})),
  characterSpotlight:home.characterSpotlight,
  weaponShowcase:home.weaponShowcase?{asset:'generated-weapon-showcase',ariaLabel:home.weaponShowcase.ariaLabel,eyebrow:home.weaponShowcase.eyebrow,title:home.weaponShowcase.title,description:home.weaponShowcase.description,categoryId:home.weaponShowcase.categoryId}:null,
  faq:{eyebrow:home.faq.eyebrow,title:home.faq.title,description:home.faq.description,items:home.faq.items},
  cta:{links:home.hero.cta},
 });
 const contentPaths=Object.fromEntries([...pack.articles.map(({meta})=>[meta.id,`/${pack.categories.find(category=>category.id===meta.category)!.slug}${pack.categories.find(category=>category.id===meta.category)!.landing===meta.id?'':`/${meta.slug}`}`]),...pack.structuredPages.map(({meta})=>[meta.id,`/${pack.categories.find(category=>category.id===meta.category)!.slug}${pack.categories.find(category=>category.id===meta.category)!.landing===meta.id?'':`/${meta.slug}`}`]),...pack.policies.map(policy=>[policy.id,`/${policy.id}`])]);
 const categoryPaths=Object.fromEntries(pack.categories.map(category=>[category.id,`/${category.slug}`]));
 const paths={content:contentPaths,category:categoryPaths,assets:new Set(pack.assets.map(asset=>asset.id))};
 for(const [i,{meta,body,file}] of pack.articles.entries()){
  const converted=convertSiteMarkdown(body,file,paths);
  const metadata:Record<string,unknown>={id:meta.id,locale:'en',slug:meta.slug,category:meta.category,template:'wiki-page',title:meta.h1,description:meta.description,quickAnswer:meta.quickAnswer,status:'published',verification:'confirmed',demo:false,order:i+1,records:[],assets:{hero:meta.heroImage,thumbnail:meta.card.image},card:meta.card,related:relatedIds(pack,meta.id),seo:{...meta.seo,final:true}};
  if(meta.authorName)metadata.author={name:meta.authorName};
  if(meta.publishedAt)metadata.publishedAt=meta.publishedAt;
  if(meta.updatedAt)metadata.updatedAt=meta.updatedAt;
  if(meta.gameVersion)metadata.gameVersion=meta.gameVersion;
  const output=join(root,'content/en/pages',`${meta.id}.mdx`);await mkdir(dirname(output),{recursive:true});await writeFile(output,frontmatter(metadata,converted));
 }
 for(const {meta,body,file} of pack.structuredPages){
  const output=join(root,'content/en/pages',`${meta.id}.mdx`);await mkdir(dirname(output),{recursive:true});await writeFile(output,frontmatter(meta,convertSiteMarkdown(body,file,paths)));
 }
 for(const record of pack.records)await writeJson(root,`content/en/records/${record.id}.json`,record);
 for(const policy of pack.policies){
  const converted=convertSiteMarkdown(policy.body,policy.file,paths);
  const metadata={id:policy.id,locale:'en',slug:policy.id,category:'_pages',template:'wiki-page',title:policy.meta.h1,description:policy.meta.description,status:'published',verification:'confirmed',demo:false,records:[],assets:policy.meta.heroImage?{hero:policy.meta.heroImage}:{},related:[],seo:{...policy.meta.seo,final:true}};
  const output=join(root,'content/en/pages',`${policy.id}.mdx`);await mkdir(dirname(output),{recursive:true});await writeFile(output,frontmatter(metadata,converted));
 }
 for(const character of pack.characters)await writeJson(root,`content/en/records/${character.id}.json`,{id:character.id,locale:'en',type:'character',verification:'confirmed',demo:false,name:character.name,role:character.role,summary:character.summary,contentId:character.articleId,assetId:character.avatarId,attributes:[]});
}
