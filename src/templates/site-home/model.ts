import type {ContentIndex} from '@/content/types';
import {buildHomeDiscovery} from '../../content/home-discovery';
import {listPageModel} from '../list-page/model';
import type {ListEntry} from '../list-page/model';
export function homeModel(index:ContentIndex,locale:string){
 const home=index.homes[locale];if(!home)throw new Error(`Missing homepage: ${locale}`);
 const discovery=buildHomeDiscovery(index,locale);
 if(home.characterSpotlight!==undefined){
  const spotlight=home.characterSpotlight;
  const category=spotlight?Object.values(index.categories).find(category=>category.locale===locale&&spotlight.characterIds.every(id=>category.characterIds?.includes(id))):undefined;
  const entries:ListEntry[]=spotlight?spotlight.characterIds.map(id=>{
   const record=index.records[`${locale}:${id}`];if(record?.type!=='character')throw new Error(`Missing spotlight character ${locale}:${id}`);
   return {id,path:record.contentId?index.translationGroups[record.contentId]?.[locale]:undefined,title:record.name,description:record.summary,verification:index.dictionaries[locale].ui[record.verification],thumbnail:record.assetId?index.assets[record.assetId]:undefined,label:record.role,facets:{}};
  }):[];
  return {home,dictionary:index.dictionaries[locale],...discovery,characterSpotlight:spotlight&&category?{entries,copy:spotlight,order:Number.MAX_SAFE_INTEGER,path:category.path}:undefined};
 }
 const characterCategory=discovery.categories.find(category=>{
  if(!category.landing)return false;
  return index.pagesByKey[`${locale}:${category.landing}`]?.template==='character-database';
 });
 const characterPage=characterCategory?.landing?index.pagesByKey[`${locale}:${characterCategory.landing}`]:undefined;
 const characterModel=characterPage?listPageModel(index,characterPage):undefined;
 const characterSpotlight=characterCategory&&characterModel?.showcase&&characterModel.entries.length>=index.site.homepage.categoryFloorMinItems
  ?{entries:characterModel.entries,copy:characterModel.showcase,order:characterCategory.order,path:characterCategory.path}
  :undefined;
 return {home,dictionary:index.dictionaries[locale],...discovery,characterSpotlight};
}
