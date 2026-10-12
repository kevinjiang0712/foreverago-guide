import type {ContentIndex,IndexedPage} from '@/content/types';
import {listPageModel,type ListFacet} from '../list-page/model';
export type CatalogValue=string|number|null;
export type CatalogColumn={id:string;label:string;kind:'text'|'number';unit?:string|null;compare:boolean};
export type CatalogEntry={id:string;title:string;description:string;path?:string;label?:string;verification:string;group:string;facets:Record<string,string[]>;values:Record<string,CatalogValue>;evidence?:string};
export type CatalogModel={kind:'builds'|'mods'|'database';entries:CatalogEntry[];facets:ListFacet[];columns:CatalogColumn[];perPage:number;evidence?:string};
export function catalogModel(index:ContentIndex,page:IndexedPage):CatalogModel{
 const ui=index.dictionaries[page.locale].ui,copy=index.dictionaries[page.locale].catalog;
 if(page.template==='database-index'){
  const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='database-index');
  if(!record||record.type!=='database-index')throw new Error(`${page.id}: missing database-index`);
  return {kind:'database',columns:record.fields,perPage:30,evidence:record.evidenceNote,facets:[{id:'category',label:ui.section,options:record.categories}],entries:record.entryIds.map(id=>{
   const entry=index.records[`${page.locale}:${id}`];if(entry?.type!=='database-entry')throw new Error(`${record.id}: missing database-entry ${id}`);
   return {id:entry.id,title:entry.name,description:entry.summary,path:entry.contentId?index.translationGroups[entry.contentId][page.locale]:undefined,label:record.categories.find(category=>category.id===entry.categoryId)!.label,verification:ui[entry.verification],group:entry.categoryId,facets:{category:[entry.categoryId]},values:entry.values,evidence:entry.evidenceNote};
  })};
 }
 const list=listPageModel(index,page);
 if(page.template==='mod-index'){
  const columns:CatalogColumn[]=[{id:'author',label:ui.author,kind:'text',compare:false},{id:'version',label:ui.version,kind:'text',compare:true},{id:'tested',label:ui.testedVersions,kind:'text',compare:true},{id:'size',label:ui.fileSize,kind:'text',compare:true},{id:'downloads',label:ui.downloads,kind:'number',compare:false},{id:'updated',label:ui.updated,kind:'text',compare:false}];
  return {kind:'mods',columns,facets:list.facets.map(facet=>facet.id==='version'?{...facet,label:ui.version}:facet),perPage:30,entries:list.entries.map(entry=>{
   const mod=index.records[`${page.locale}:${entry.id}`];if(mod.type!=='mod')throw new Error(`Missing mod ${entry.id}`);
   return {...entry,group:mod.categoryId,values:{author:mod.authorName,version:mod.releaseVersion,tested:mod.testedVersions.join(', ')||null,size:mod.fileSize,downloads:mod.downloads,updated:mod.updatedAt}};
  })};
 }
 if(page.template!=='build-library')throw new Error(`${page.id}: not a catalogue template`);
 const library=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library');
 if(!library||library.type!=='build-library')throw new Error(`${page.id}: missing build-library`);
 const columns:CatalogColumn[]=[{id:'fit',label:ui.bestFor,kind:'text',compare:true},{id:'avoid',label:ui.avoidIf,kind:'text',compare:true},{id:'equipment',label:ui.equipment,kind:'text',compare:true},{id:'skills',label:copy.skills,kind:'text',compare:true}];
 return {kind:'builds',columns,perPage:30,facets:[...(library.filterOptions.classes.length?[{id:'class',label:copy.class,options:library.filterOptions.classes}]:[]),...list.facets],entries:list.entries.map(entry=>{
  const build=index.records[`${page.locale}:${entry.id}`];if(build.type!=='build')throw new Error(`Missing build ${entry.id}`);
  return {...entry,group:'builds',facets:{...entry.facets,class:build.classIds},values:{fit:build.bestFor,avoid:build.avoidIf,equipment:build.equipment.filter(row=>row.value!==null).map(row=>`${row.label}: ${row.value}`).join(' · ')||null,skills:build.skills.filter(row=>row.value!==null).map(row=>`${row.name}: ${row.value}`).join(' · ')||null},evidence:build.evidenceNote};
 })};
}
export function catalogResults(model:CatalogModel,query:string,filters:Record<string,string[]>,sort:string,descending:boolean,locale:string){
 const search=query.trim().normalize('NFKC').toLocaleLowerCase(locale);
 const matches=model.entries.filter(entry=>Object.entries(filters).every(([id,values])=>values.every(value=>entry.facets[id]?.includes(value)))&&[entry.title,entry.description,...Object.values(entry.values)].join(' ').normalize('NFKC').toLocaleLowerCase(locale).includes(search));
 if(sort==='listed')return matches;
 return matches.sort((a,b)=>{const left=sort==='name'?a.title:a.values[sort]??null,right=sort==='name'?b.title:b.values[sort]??null;if(left===null)return right===null?0:1;if(right===null)return -1;const order=typeof left==='number'&&typeof right==='number'?left-right:String(left).localeCompare(String(right),locale,{numeric:true});return (descending?-order:order)||a.id.localeCompare(b.id);});
}
export function comparableColumns(model:CatalogModel,entries:CatalogEntry[]){return model.columns.filter(column=>column.compare&&entries.filter(entry=>entry.values[column.id]!==null&&entry.values[column.id]!==undefined).length>=2);}
export function catalogValue(value:CatalogValue|undefined,column:CatalogColumn,unknown:string){return value===null||value===undefined?unknown:`${value}${column.unit?` ${column.unit}`:''}`;}
