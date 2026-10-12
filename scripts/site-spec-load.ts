import {adsSchema} from '../src/content/schemas/ads';
import {pageSchema} from '../src/content/schemas/page';
import {recordSchema} from '../src/content/schemas/record';
import {isListType} from '../src/content/template-layouts';
import {lstat,readFile,realpath} from 'node:fs/promises';
import {join,relative,isAbsolute,sep} from 'node:path';
import {z} from 'zod';
import {themeSchema} from '../src/content/schemas/theme';
import {readPreset} from '../src/content/theme';
import {contentError} from '../src/content/issues';
import {youtubeVideoId} from '../src/content/youtube';
import {assetSpecSchema,articleSpecSchema,categoryCopySchema,categorySpecSchema,characterSpecSchema,homeSpecSchema,policySpecSchema,siteSpecSchema,specFiles,specJson,type ArticleSpec,type PolicySpec} from './site-spec';

export const themeColorTokens=[
 '--surface-page','--surface-alt','--surface-card','--surface-card-hover','--surface-well','--surface-input','--surface-disabled',
 '--text-primary','--text-secondary','--text-caption','--text-on-accent','--text-disabled',
 '--border-default','--border-soft','--border-hover','--border-on-media','--placeholder-border',
 '--accent','--accent-hover','--accent-press','--accent-text','--marker','--marker-soft',
 '--ok','--warn','--danger','--focus-ring','--shadow-card','--state-ghost-hover','--state-row-hover',
 '--veil-hero','--veil-vignette','--scrim-nav','--scrim-drawer','--rule-marker','--sweep-highlight',
] as const;
const themeInputSchema=themeSchema.omit({preset:true});
export type SitePackage=Awaited<ReturnType<typeof loadSitePackage>>;

export async function safePackageFile(root:string,file:string):Promise<string>{
 const base=await realpath(root);let cursor=base;
 for(const segment of file.split('/')){
  cursor=join(cursor,segment);
  const status=await lstat(cursor).catch(error=>{if((error as NodeJS.ErrnoException).code==='ENOENT')contentError(file,'file',undefined,'required file is missing');throw error;});
  if(status.isSymbolicLink())contentError(file,'file',cursor,'symbolic links are not allowed inside site-spec');
 }
 const path=await realpath(join(base,file));
 const within=relative(base,path);
 if(within==='..'||within.startsWith(`..${sep}`)||isAbsolute(within))contentError(file,'file',path,'file escapes site-spec');
 const status=await lstat(join(base,file));
 if(status.isSymbolicLink()||!(await lstat(path)).isFile())contentError(file,'file',file,'expected a regular file, not a symbolic link');
 return path;
}
function unique(values:string[],file:string,field:string){
 const seen=new Set<string>();values.forEach((value,i)=>{if(seen.has(value))contentError(file,`${field}.${i}`,value,'duplicate ID');seen.add(value);});
}
export async function loadSitePackage(root:string,templateRoot:string){
 const site=await specJson(root,'site.json',siteSpecSchema);
 const adsFile=await lstat(join(root,'ads.json')).catch((error:NodeJS.ErrnoException)=>{if(error.code==='ENOENT')return null;throw error;});
 if(adsFile)await safePackageFile(root,'ads.json');
 const ads=adsFile?await specJson(root,'ads.json',adsSchema):adsSchema.parse({mode:'disabled'});
 if(ads.adsterra){const host=new URL(site.siteUrl).hostname;if(!ads.adsterra.allowedHosts.includes(host))contentError('ads.json','adsterra.allowedHosts',ads.adsterra.allowedHosts,`must include the site host ${host}`);}
 const categories=await specJson(root,'categories.json',categorySpecSchema);
 const categoryCopy=await specJson(root,'en/categories.json',categoryCopySchema);
 const assets=await specJson(root,'assets.json',assetSpecSchema);
 const theme=await specJson(root,'theme.json',themeInputSchema);
 const home=await specJson(root,'en/home.json',homeSpecSchema);
 const characters=await specJson(root,'en/characters.json',characterSpecSchema);
 unique(categories.map(entry=>entry.id),'categories.json','id');unique(categories.map(entry=>entry.slug),'categories.json','slug');
 unique(assets.map(entry=>entry.id),'assets.json','id');unique(characters.map(entry=>entry.id),'en/characters.json','id');
 unique(home.articleFloors.map(entry=>entry.id),'en/home.json','articleFloors.id');
 const categoryIds=new Set(categories.map(entry=>entry.id));
 for(const category of categories)if(!categoryCopy[category.id])contentError('en/categories.json',category.id,undefined,'missing category copy and SEO');
 for(const id of Object.keys(categoryCopy))if(!categoryIds.has(id))contentError('en/categories.json',id,id,'unknown category');
 const assetIds=new Set(assets.map(entry=>entry.id));
 if(assetIds.has('generated-weapon-showcase'))contentError('assets.json','id','generated-weapon-showcase','reserved generated asset ID');
 if(!assetIds.has(site.logoAssetId))contentError('site.json','logoAssetId',site.logoAssetId,'unknown logo asset');
 for(const [id,copy] of Object.entries(categoryCopy))if(copy.seo.image&&!assetIds.has(copy.seo.image))contentError('en/categories.json',`${id}.seo.image`,copy.seo.image,'unknown asset');
 for(const asset of assets){
  if(asset.id!==site.logoAssetId&&asset.alt===null)contentError('assets.json',`${asset.id}.alt`,null,'content image requires alt text');
  await safePackageFile(root,`media/${asset.file}`);
 }
 for(const font of theme.fonts){
  if(!font.src.endsWith('.woff2'))contentError('theme.json','fonts.src',font.src,'site package fonts must be WOFF2');
  await safePackageFile(root,`media/${font.src.slice('/media/'.length)}`);
 }
 const colorKeys=new Set<string>(themeColorTokens);
 const baseDay=await readPreset(templateRoot,'onimusha','day');const baseNight=await readPreset(templateRoot,'onimusha','night');
 for(const mode of ['day','night'] as const){
  const values=theme[mode],base=mode==='day'?baseDay:baseNight;
  for(const key of themeColorTokens){
   if(!Object.hasOwn(values,key))contentError('theme.json',`${mode}.${key}`,undefined,'required explicit color; inheritance is forbidden');
   if(values[key]===base[key])contentError('theme.json',`${mode}.${key}`,values[key],'must differ from the template color');
  }
  for(const key of Object.keys(values))if(!colorKeys.has(key))contentError('theme.json',`${mode}.${key}`,values[key],'only the 36 approved color tokens are configurable');
 }
 const commonKeys=new Set(['--font-display','--font-ui','--display-weight','--radius','--radius-lg','--radius-chip']);
 for(const key of commonKeys)if(!Object.hasOwn(theme.common,key))contentError('theme.json',`common.${key}`,undefined,'required shared font or radius');
 for(const key of Object.keys(theme.common))if(!commonKeys.has(key))contentError('theme.json',`common.${key}`,theme.common[key],'only fonts and three radii are configurable');
 const fontFamilies=new Set(theme.fonts.map(font=>font.family));
 for(const key of ['--font-display','--font-ui']){
  const family=theme.common[key].split(',')[0].trim().replace(/^['"]|['"]$/g,'');
  if(!fontFamilies.has(family))contentError('theme.json',`common.${key}`,theme.common[key],'first font family needs a local WOFF2 file');
 }
 if(home.hero.video&&!youtubeVideoId(home.hero.video.url))contentError('en/home.json','hero.video.url',home.hero.video.url,'expected a supported YouTube URL without timestamp or playlist');
 const articleMetadata=await specJson(root,'en/pages.json',z.array(articleSpecSchema).min(8));
 const expectedBodies=new Set(articleMetadata.map(meta=>`en/pages/${meta.id}.md`));
 for(const file of await specFiles(root,'en/pages','.md'))if(!expectedBodies.has(file))contentError(file,'file',file,'no matching article metadata');
 const articles:{meta:ArticleSpec;body:string;file:string}[]=[];
 for(const meta of articleMetadata){
  const bodyFile=`en/pages/${meta.id}.md`;
  const body=await readFile(await safePackageFile(root,bodyFile),'utf8');
  if(!body.trim())contentError(bodyFile,'body',body,'article Markdown cannot be empty');
  articles.push({meta,body,file:bodyFile});
 }
 const structuredMetadataFile='en/structured-pages.json';
 const hasStructured=await lstat(join(root,structuredMetadataFile)).catch((error:NodeJS.ErrnoException)=>{if(error.code==='ENOENT')return null;throw error;});
 const structuredMetadata=hasStructured?await specJson(root,structuredMetadataFile,z.array(pageSchema)):[];
 if(hasStructured)await safePackageFile(root,structuredMetadataFile);
 const structuredPages=[];
 const structuredBodies=new Set(structuredMetadata.map(meta=>`en/structured-pages/${meta.id}.md`));
 for(const file of await specFiles(root,'en/structured-pages','.md'))if(!structuredBodies.has(file))contentError(file,'file',file,'no matching structured page metadata');
 for(const meta of structuredMetadata){
  if(!['build-library','mod-index','mod-detail','database-index','database-detail'].includes(meta.template)&&!(meta.template==='wiki-page'&&meta.articleRecord))contentError(structuredMetadataFile,`${meta.id}.template`,meta.template,'expected a structured catalogue, detail, or record-backed article');
  if(meta.locale!=='en')contentError(structuredMetadataFile,`${meta.id}.locale`,meta.locale,'this package supports en');
  if(!categoryIds.has(meta.category))contentError(structuredMetadataFile,`${meta.id}.category`,meta.category,'unknown category');
  const file=`en/structured-pages/${meta.id}.md`,body=await readFile(await safePackageFile(root,file),'utf8');
  if(isListType(meta.template)&&body.trim())contentError(file,'body',body,'catalogue body must be empty; use listGuide');
  if(!isListType(meta.template)&&!body.trim())contentError(file,'body',body,'detail Markdown cannot be empty');
  structuredPages.push({meta,body,file});
 }
 const records=[];
 for(const file of await specFiles(root,'en/records','.json')){
  await safePackageFile(root,file);const record=await specJson(root,file,recordSchema);
  if(record.locale!=='en')contentError(file,'locale',record.locale,'this package supports en');
  records.push(record);
 }
 unique([...characters.map(record=>record.id),...records.map(record=>record.id)],'en/records','id');
 unique([...articles.map(entry=>entry.meta.id),...structuredPages.map(entry=>entry.meta.id),'about','contact','privacy','terms'],'en/structured-pages.json','id');
 for(const category of categories)if(category.landing&&!structuredPages.some(page=>page.meta.id===category.landing&&page.meta.category===category.id)&&!articles.some(page=>page.meta.id===category.landing&&page.meta.category===category.id))contentError('categories.json',`${category.id}.landing`,category.landing,'landing must identify a page in this category');
 unique(articles.map(entry=>entry.meta.id),'en/pages','id');
 const articleIds=new Set(articles.map(entry=>entry.meta.id));
 for(const {meta} of articles){
  if(!categoryIds.has(meta.category))contentError('en/pages',`${meta.id}.category`,meta.category,'unknown category');
  for(const id of [meta.card.image,meta.heroImage,meta.seo.image].filter((value):value is string=>value!==null))if(!assetIds.has(id))contentError('en/pages',`${meta.id}.asset`,id,'unknown asset');
 }
 const policies:{id:'about'|'contact'|'privacy'|'terms';meta:PolicySpec;body:string;file:string}[]=[];
 for(const id of ['about','contact','privacy','terms'] as const){
  const file=`en/policies/${id}.json`;const meta=await specJson(root,file,policySpecSchema);
  const bodyFile=`en/policies/${id}.md`;const body=await readFile(await safePackageFile(root,bodyFile),'utf8');
  if(!body.trim())contentError(bodyFile,'body',body,'policy Markdown cannot be empty');
  for(const asset of [meta.heroImage,meta.seo.image])if(asset&&!assetIds.has(asset))contentError(file,'asset',asset,'unknown asset');
  policies.push({id,meta,body,file:bodyFile});
 }
 const referencedArticles=[...home.featured.articleIds,...home.articleFloors.flatMap(floor=>floor.articleIds)];
 referencedArticles.forEach((id,i)=>{if(!articleIds.has(id))contentError('en/home.json',`articleReferences.${i}`,id,'requires an existing game article');});
 for(const character of characters){
  if(!categoryIds.has(character.categoryId))contentError('en/characters.json',`${character.id}.categoryId`,character.categoryId,'unknown category');
  if(!assetIds.has(character.avatarId))contentError('en/characters.json',`${character.id}.avatarId`,character.avatarId,'unknown avatar asset');
  if(character.articleId&&!articleIds.has(character.articleId))contentError('en/characters.json',`${character.id}.articleId`,character.articleId,'unknown article');
 }
 if(home.characterSpotlight)for(const id of home.characterSpotlight.characterIds)if(!characters.some(entry=>entry.id===id))contentError('en/home.json','characterSpotlight.characterIds',id,'unknown character');
 if(home.weaponShowcase){
  for(const id of home.weaponShowcase.imageIds)if(!assetIds.has(id))contentError('en/home.json','weaponShowcase.imageIds',id,'unknown image');
  const imageFiles=home.weaponShowcase.imageIds.map(id=>assets.find(asset=>asset.id===id)!.file);
  unique(imageFiles,'en/home.json','weaponShowcase.imageIds.file');
  if(!categoryIds.has(home.weaponShowcase.categoryId))contentError('en/home.json','weaponShowcase.categoryId',home.weaponShowcase.categoryId,'unknown category');
 }
 for(const [index,entry] of site.navigation.en.entries())if(entry.target.type==='category'){
  const categoryId=entry.target.id;
  const count=articles.filter(article=>article.meta.category===categoryId).length+characters.filter(character=>character.categoryId===categoryId).length+structuredPages.filter(page=>page.meta.category===categoryId).length;
  if(count<3&&entry.children.length===0)contentError('site.json',`navigation.en.${index}.children`,entry.children,'category with fewer than three entries needs a submenu because its primary link is not clickable');
 }
 for(const id of [home.hero.assetId,home.seo.image].filter((value):value is string=>value!==null))if(!assetIds.has(id))contentError('en/home.json','asset',id,'unknown asset');
 if(articles.length<4)contentError('en/pages','count',articles.length,'related articles require at least four game articles');
 return {root:await realpath(root),site,ads,categories,categoryCopy,assets,theme,home,characters,articles,policies,structuredPages,records};
}
