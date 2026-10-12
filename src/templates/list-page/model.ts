import type {ContentIndex,IndexedCategory,IndexedPage} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';
import {buildArticle} from '../../content/build-articles';
import {buildLibraryModel} from '../build-library/model';
import {bossIndexModel} from '../boss-index/model';
import {characterDatabaseModel} from '../character-database/model';
import {modIndexModel} from '../mod-index/model';

export type ListEntry={id:string;path?:string;title:string;description:string;verification:string;thumbnail?:Asset;label?:string;facets:Record<string,string[]>;facts?:{label:string;value:string|number}[];downloads?:number|null;updatedAt?:string|null};
export type ListFacet={id:string;label:string;options:{id:string;label:string}[];multiple?:boolean;disabledReason?:string};
export type ListModel={entries:ListEntry[];facets:ListFacet[];perPage:number;sortOptions?:{id:'listed'|'downloads'|'updated';label:string}[];notice?:{label:string;description:string};showcase?:{eyebrow:string;title:string;description:string};knownTotal?:number|null};
export const standardPageSize=30;
export function listPageModel(index:ContentIndex,source:IndexedCategory|IndexedPage):ListModel{
 const dictionary=index.dictionaries[source.locale],ui=dictionary.ui;
 if('pages' in source){
  if(source.characterIds){
   const entries=source.characterIds.map(id=>{
    const record=index.records[`${source.locale}:${id}`];if(record?.type!=='character')throw new Error(`Missing character record ${source.locale}:${id}`);
    return {id,title:record.name,description:record.summary,path:record.contentId?index.translationGroups[record.contentId]?.[source.locale]:undefined,verification:ui[record.verification],thumbnail:record.assetId?index.assets[record.assetId]:undefined,label:record.role,facets:{role:[record.role]}};
   });
   const roles=[...new Set(entries.map(entry=>entry.label))];
   return {entries,facets:roles.length>1?[{id:'role',label:ui.section,options:roles.map(role=>({id:role,label:role}))}]:[],perPage:standardPageSize};
  }
  const entries=source.pages.map(key=>{const page=index.pagesByKey[key];const thumbnailId=page.card?.image??page.assets.thumbnail;return {id:page.id,path:page.path,title:page.card?.title??page.title,description:page.card?.description??page.description,verification:ui[page.verification],thumbnail:thumbnailId?index.assets[thumbnailId]:undefined,label:page.listGroup?dictionary.listGroups[page.listGroup]:undefined,facets:{group:page.listGroup?[page.listGroup]:[]}};});
  const groups=[...new Set(entries.flatMap(entry=>entry.facets.group))];
  return {entries,facets:groups.length>1?[{id:'group',label:ui.section,options:groups.map(id=>({id,label:dictionary.listGroups[id]}))}]:[],perPage:standardPageSize};
 }
 if(source.template==='build-library'){
  const {record,builds}=buildLibraryModel(index,source);
  return {entries:builds.map(build=>({id:build.id,path:buildArticle(index,source.locale,record.id,build.id).path,title:build.name,description:build.summary,verification:ui[build.verification],thumbnail:build.assetId?index.assets[build.assetId]:undefined,label:build.playstyleIds.map(id=>record.filterOptions.playstyles.find(option=>option.id===id)!.label).join(' · '),facets:{playstyle:build.playstyleIds,weapon:build.weaponIds},facts:build.facts.map(fact=>({label:fact.label,value:fact.value??ui.unknown}))})),facets:[{id:'playstyle',label:ui.playstyle,options:record.filterOptions.playstyles},{id:'weapon',label:ui.weapon,options:record.filterOptions.weapons}],perPage:standardPageSize};
 }
 if(source.template==='boss-index'){
  const {record,entries}=bossIndexModel(index,source);
  return {entries:entries.map(entry=>({id:entry.id,path:entry.href,title:entry.name,description:entry.tags.join(' · '),verification:ui[entry.verification],thumbnail:entry.asset,label:entry.difficultyLabel,facets:{difficulty:entry.difficultyId?[entry.difficultyId]:[],phase:entry.phaseCount!==null&&entry.phaseCount>1?['multiple']:[]},facts:[{label:ui.phases,value:entry.phaseCount??ui.unknown}]})),facets:[{id:'difficulty',label:ui.difficulty,options:record.filterOptions},{id:'phase',label:ui.phases,options:[{id:'multiple',label:ui.multiPhase}]}],perPage:standardPageSize,notice:record.unrevealed??undefined,knownTotal:record.knownTotal};
 }
 if(source.template==='character-database'){
  const {record,characters}=characterDatabaseModel(index,source);
  const roles=[...new Set(characters.map(character=>character.role))];
  return {entries:characters.map(character=>({id:character.id,path:character.href,title:character.name,description:character.summary,verification:ui[character.verification],thumbnail:character.asset,label:character.role,facets:{role:[character.role]}})),facets:roles.length>1?[{id:'role',label:ui.section,options:roles.map(role=>({id:role,label:role}))}]:[],perPage:standardPageSize,notice:record.unrevealed??undefined,showcase:record.cast};
 }
 if(source.template==='mod-index'){
  const {record,mods}=modIndexModel(index,source);
  return {entries:mods.map(mod=>({id:mod.id,path:mod.contentId?index.translationGroups[mod.contentId]?.[source.locale]:undefined,title:mod.title,description:mod.description,verification:ui[mod.verification],thumbnail:mod.assetId?index.assets[mod.assetId]:undefined,label:record.categories.find(category=>category.id===mod.categoryId)?.label,facets:{category:[mod.categoryId],tags:mod.tagIds,version:record.currentVersion&&mod.testedVersions.includes(record.currentVersion)?['current']:[]},downloads:mod.downloads,updatedAt:mod.updatedAt,facts:[{label:ui.author,value:mod.authorName??ui.unknown},{label:ui.version,value:mod.releaseVersion??ui.unknown},{label:ui.testedVersions,value:mod.testedVersions.join(', ')||ui.unknown},{label:ui.modTags,value:mod.tagIds.map(id=>record.tags.find(tag=>tag.id===id)!.label).join(', ')||ui.unknown},{label:ui.downloads,value:mod.downloads??ui.unknown},{label:ui.endorsements,value:mod.endorsements??ui.unknown},{label:ui.fileSize,value:mod.fileSize??ui.unknown},{label:ui.updated,value:mod.updatedAt??ui.unknown}]})),facets:[{id:'category',label:ui.modCategory,options:record.categories},{id:'tags',label:ui.modTags,options:record.tags,multiple:true},{id:'version',label:ui.testedVersions,options:[{id:'current',label:ui.currentVersionOnly}],disabledReason:record.currentVersion===null?ui.currentVersionUnknown:undefined}],perPage:record.perPage,sortOptions:record.sortOptions,knownTotal:record.knownTotal};
 }
 throw new Error(`${source.sourcePath}: unsupported list type ${source.template}`);
}
