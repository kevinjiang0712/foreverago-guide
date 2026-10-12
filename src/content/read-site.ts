import { readFile, readdir, stat, lstat, realpath } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import matter from 'gray-matter';
import { load, JSON_SCHEMA } from 'js-yaml';
import { z } from 'zod';
import { siteSchema, type SiteConfig } from './schemas/site';
import {adsSchema,disabledAds,type AdsConfig} from './schemas/ads';
import { categorySchema, type CategoryConfig } from './schemas/category';
import { themeSchema, type ThemeConfig } from './schemas/theme';
import { assetSchema, type Asset } from './schemas/asset';
import { dictionarySchema, type Dictionary } from './schemas/dictionary';
import { homeSchema, type HomeContent } from './schemas/home';
import { pageSchema, type PageMetadata } from './schemas/page';
import { recordSchema, type ContentRecord } from './schemas/record';
import { contentError, parseContent } from './issues';
export type Sourced<T> = T & {sourcePath:string};
export type SourcePage=Sourced<PageMetadata>&{body:string;bodyLineOffset:number;mdxSource:string};
export type SiteInput={root:string;site:SiteConfig;ads:AdsConfig;theme:ThemeConfig;categories:CategoryConfig[];assets:Asset[];dictionaries:Dictionary[];homes:Sourced<HomeContent>[];pages:SourcePage[];records:Sourced<ContentRecord>[]};
export async function readJson(file:string):Promise<unknown>{
  const source=await readFile(file,'utf8');
  try{return JSON.parse(source) as unknown;}catch(error){
    if(error instanceof SyntaxError)throw new Error(`${file}: invalid JSON: ${error.message}`,{cause:error});
    throw error;
  }
}
async function directoryFiles(root:string,folder:string,extension:string):Promise<string[]>{
  const directory=join(root,folder);
  // A missing optional pages/records directory means there are no entries yet.
  const exists=await lstat(directory).catch((error:NodeJS.ErrnoException)=>{if(error.code==='ENOENT')return null;throw error;});
  if(!exists)return [];
  if(exists.isSymbolicLink())contentError(folder,'file',folder,'symlinks are not content directories');
  const files:string[]=[];
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const file=join(folder,entry.name);
    if(entry.isSymbolicLink())contentError(file,'file',entry.name,'symlinks are not content files');
    if(entry.isDirectory())files.push(...await directoryFiles(root,file,extension));
    else if(entry.name.endsWith(extension))files.push(file);
    else if(!entry.name.startsWith('.'))contentError(file,'extension',entry.name,`expected ${extension}`);
  }
  return files;
}
function uniqueIds(entries:{id:string;sourcePath?:string}[],fallback:string){
  const known=new Set<string>();
  for(const entry of entries){if(known.has(entry.id))contentError(entry.sourcePath??fallback,'id',entry.id,'duplicate ID');known.add(entry.id);}
}
export async function readSite(root:string):Promise<SiteInput>{
  const absoluteRoot=await realpath(root);
  const json=async<T>(file:string,schema:z.ZodType<T>)=>{
    let value:unknown;
    try{value=await readJson(join(root,file));}catch(error){
      if((error as NodeJS.ErrnoException).code==='ENOENT')contentError(file,'file',null,'required file is missing');
      throw error;
    }
    return parseContent(schema,value,file);
  };
  const site=await json('config/site.json',siteSchema);
  const ads=await readJson(join(root,'config/ads.json')).then(value=>parseContent(adsSchema,value,'config/ads.json')).catch((error:NodeJS.ErrnoException)=>{
    if(error.code==='ENOENT')return disabledAds;
    throw error;
  });
  for(const entry of await readdir(join(root,'content'),{withFileTypes:true})) {
    if(entry.isSymbolicLink())contentError(`content/${entry.name}`,'file',entry.name,'symlinks are not content directories');
    if(entry.isDirectory() && entry.name!=='locales' && !site.locales.includes(entry.name))
      contentError(`content/${entry.name}`,'locale',entry.name,'locale is not enabled in config/site.json');
  }
  const theme=await json('config/theme.json',themeSchema);
  const categories=await json('config/categories.json',z.array(categorySchema));uniqueIds(categories,'config/categories.json');
  const assets=await json('content/assets.json',z.array(assetSchema));uniqueIds(assets,'content/assets.json');
  const dictionaries:Dictionary[]=[];const homes:Sourced<HomeContent>[]=[];const pages:SourcePage[]=[];const records:Sourced<ContentRecord>[]=[];
  const sameLocale=(file:string,value:string,expected:string)=>{if(value!==expected)contentError(file,'locale',value,`expected ${expected}`);};
  for(const locale of site.locales){
    for(const entry of await readdir(join(root,'content',locale),{withFileTypes:true})){
      if(entry.isSymbolicLink())contentError(`content/${locale}/${entry.name}`,'file',entry.name,'symlinks are not content files');
      if(!entry.name.startsWith('.')&&!['home.json','pages','records'].includes(entry.name))
        contentError(`content/${locale}/${entry.name}`,'entry',entry.name,'expected home.json, pages, or records');
    }
    const dictionaryFile=`content/locales/${locale}.json`;const dictionary=await json(dictionaryFile,dictionarySchema);sameLocale(dictionaryFile,dictionary.locale,locale);
    for(const category of categories)if(!Object.hasOwn(dictionary.categories,category.id))contentError(dictionaryFile,`categories.${category.id}`,undefined,'missing category translation');
    for(const id of Object.keys(site.officialLinks))if(!Object.hasOwn(dictionary.officialLinks,id))contentError(dictionaryFile,`officialLinks.${id}`,undefined,'missing link label');
    for(const column of site.footer.columns)if(!Object.hasOwn(dictionary.footer.columns,column.id))contentError(dictionaryFile,`footer.columns.${column.id}`,undefined,'missing footer label');
    dictionaries.push(dictionary);
    const homeFile=`content/${locale}/home.json`;const home=await json(homeFile,homeSchema);sameLocale(homeFile,home.locale,locale);
    if(home.status!=='published')contentError(homeFile,'status',home.status,'enabled locale requires a published homepage');
    homes.push({...home,sourcePath:homeFile});
    for(const file of await directoryFiles(root,`content/${locale}/pages`,'.mdx')){
      const source=await readFile(join(root,file),'utf8');
      if(!/^---\r?\n/.test(source))contentError(file,'frontmatter',source.slice(0,40),'required YAML frontmatter');
      let parsed:ReturnType<typeof matter>;
      try{parsed=matter(source,{engines:{yaml:source=>load(source,{schema:JSON_SCHEMA}) as object}});}catch(error){throw new Error(`${file} :: frontmatter :: ${error instanceof Error?error.message:String(error)}`,{cause:error});}
      const metadata=parseContent(pageSchema,parsed.data,file);sameLocale(file,metadata.locale,locale);
      if(metadata.category!=='_pages'&&!categories.some(category=>category.id===metadata.category))contentError(file,'category',metadata.category,'unknown category');
      pages.push({...metadata,body:parsed.content,mdxSource:source,bodyLineOffset:source.slice(0,source.length-parsed.content.length).split('\n').length-1,sourcePath:file});
    }
    uniqueIds(pages.filter(page=>page.locale===locale),`content/${locale}/pages`);
    for(const file of await directoryFiles(root,`content/${locale}/records`,'.json')){
      const record=await json(file,recordSchema);sameLocale(file,record.locale,locale);records.push({...record,sourcePath:file});
    }
    uniqueIds(records.filter(record=>record.locale===locale),`content/${locale}/records`);
  }
  for(const asset of assets){
    for(const locale of site.locales)if(!asset.alt[locale])contentError('content/assets.json',`${asset.id}.alt.${locale}`,undefined,'missing alt translation');
    if(asset.src){
      const path=await realpath(join(root,'public',asset.src.slice(1))).catch((error:NodeJS.ErrnoException)=>{
        if(error.code==='ENOENT')contentError('content/assets.json',`${asset.id}.src`,asset.src,'media file does not exist');
        throw error;
      });
      const within=relative(join(absoluteRoot,'public','media'),path);
      if(within.startsWith(`..${sep}`)||within==='..')contentError('content/assets.json',`${asset.id}.src`,asset.src,'asset must stay inside public/media');
      if(!(await stat(path)).isFile())contentError('content/assets.json',`${asset.id}.src`,asset.src,'expected an existing file');
    }
  }
  return {root:absoluteRoot,site,ads,theme,categories,assets,dictionaries,homes,pages,records};
}
