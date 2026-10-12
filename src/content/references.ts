import {contentError} from './issues';
import {lookup} from './lookup';
import type {ContentIndex} from './types';
import type {z} from 'zod';
import type {target} from './schemas/common';
export type LinkTarget=z.infer<typeof target>;
export function resolveTarget(index:ContentIndex,locale:string,target:LinkTarget,file='content',field='target'):string|null{
  switch(target.type){
    case 'home':return index.translationGroups.home[locale];
    case 'content':{
      const path=lookup(index.translationGroups,target.id)?.[locale];
      if(!path)contentError(file,field,target.id,`no reachable content in ${locale}`);return path;
    }
    case 'category':{
      const category=index.categories[`${locale}:${target.id}`];
      if(!category)contentError(file,field,target.id,'unknown category');return category.path;
    }
    case 'official':{
      if(!Object.hasOwn(index.site.officialLinks,target.id))contentError(file,field,target.id,'unknown official link');
      return index.site.officialLinks[target.id];
    }
    case 'external':return target.url;
  }
}
export function validateAssetReference(index:ContentIndex,id:string,file:string,field:string,production:boolean){
  const asset=lookup(index.assets,id);if(!asset)contentError(file,field,id,'unknown asset');
  // A dimensioned empty image slot is permitted. Actual demonstration media is not.
  if(production&&asset.src&&asset.demo)contentError(file,field,id,'reachable demo asset is not production content');
}
export function validateTarget(index:ContentIndex,locale:string,target:LinkTarget,file:string,field:string,production:boolean){
  const href=resolveTarget(index,locale,target,file,field);
  if(production&&!href)contentError(file,field,target,'production link has not been configured');
  if(production&&href&&/^https?:/i.test(href)&&/(^|\.)(example|invalid|test)$|(^|\.)example\.(com|org|net)$/.test(new URL(href).hostname.toLowerCase().replace(/\.$/,'')))
    contentError(file,field,href,'production links cannot point to demonstration domains');
}
export function validateHomeReferences(index:ContentIndex,locale:string,production:boolean){
  const home=index.homes[locale];
  home.featured.pinnedIds.forEach((id,i)=>validateTarget(index,locale,{type:'content',id},home.sourcePath,`featured.pinnedIds.${i}`,production));
  const article=(id:string,field:string)=>{
    const page=index.pagesByKey[`${locale}:${id}`];
    if(!page||page.status!=='published'||page.template!=='wiki-page'||page.category==='_pages')contentError(home.sourcePath,field,id,'requires a published generic article in the same language');
    return page;
  };
  home.articleFloors?.forEach((floor,i)=>floor.articleIds.forEach((id,j)=>article(id,`articleFloors.${i}.articleIds.${j}`)));
  if(home.characterSpotlight){
    const ids=home.characterSpotlight.characterIds;
    const category=Object.values(index.categories).find(category=>category.locale===locale&&ids.every(id=>category.characterIds?.includes(id)));
    if(!category)contentError(home.sourcePath,'characterSpotlight.characterIds',ids,'all spotlight characters must belong to one category list');
    ids.forEach((id,i)=>{
      const record=index.records[`${locale}:${id}`];
      if(!record||record.type!=='character')contentError(home.sourcePath,`characterSpotlight.characterIds.${i}`,id,'requires a character record in the same language');
      if(!record.assetId||!index.assets[record.assetId]?.src)contentError(home.sourcePath,`characterSpotlight.characterIds.${i}`,id,'character requires a real avatar image');
    });
  }
  if(home.weaponShowcase&&'categoryId' in home.weaponShowcase&&!index.categories[`${locale}:${home.weaponShowcase.categoryId}`])contentError(home.sourcePath,'weaponShowcase.categoryId',home.weaponShowcase.categoryId,'unknown weapon showcase category');
  const visit=(value:unknown,field:string)=>{
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((item,i)=>visit(item,`${field}.${i}`));return;}
    const object=value as Record<string,unknown>;
    if('type' in object&&['home','content','category','official','external'].includes(String(object.type)))validateTarget(index,locale,object as LinkTarget,home.sourcePath,field,production);
    for(const [key,item] of Object.entries(object)){
      if(key==='asset'&&typeof item==='string')validateAssetReference(index,item,home.sourcePath,`${field}.${key}`,production);
      else visit(item,`${field}.${key}`);
    }
  };
  visit(home,'home');
  if(home.seo?.image)validateAssetReference(index,home.seo.image,home.sourcePath,'seo.image',production);
}
