import type {ContentIndex} from './types';
import {contentError} from './issues';
import {validateAssetReference,validateTarget} from './references';
export function validateTemplateRecord(index:ContentIndex,key:string,production:boolean){
 const record=index.records[key];if(!record)throw new Error(`Missing record ${key}`);
 const character=(id:string,field:string)=>{const entry=index.records[`${record.locale}:${id}`];if(!entry||entry.type!=='character')contentError(record.sourcePath,field,id,'requires an existing character record in the same language');return entry;};
 const entity=(entry:{assetId:string|null;contentId:string|null},field:string)=>{
  if(entry.assetId)validateAssetReference(index,entry.assetId,record.sourcePath,`${field}.assetId`,production);
  if(entry.contentId&&!index.translationGroups[entry.contentId]?.[record.locale])contentError(record.sourcePath,`${field}.contentId`,entry.contentId,'no reachable content in the same language');
 };
 if(production&&record.demo)contentError(record.sourcePath,'demo',record.id,'reachable demo record is not production content');
 if(record.type==='database-index'){
  for(const [i,id] of record.entryIds.entries()){
   const entry=index.records[`${record.locale}:${id}`];
   if(!entry||entry.type!=='database-entry'||entry.databaseId!==record.id)contentError(record.sourcePath,`entryIds.${i}`,id,'requires a database-entry belonging to this database');
   if(production)validateTemplateRecord(index,`${record.locale}:${id}`,true);
  }
 }
 if(record.type==='database-entry'){
  const database=index.records[`${record.locale}:${record.databaseId}`];
  if(!database||database.type!=='database-index'||!database.entryIds.includes(record.id))contentError(record.sourcePath,'databaseId',record.databaseId,'requires a database-index listing this entry');
  if(production&&database.demo)contentError(record.sourcePath,'databaseId',record.databaseId,'production entry cannot use demo database definitions');
  if(!database.categories.some(category=>category.id===record.categoryId))contentError(record.sourcePath,'categoryId',record.categoryId,'unknown database category');
  const fields=new Map(database.fields.map(field=>[field.id,field]));
  for(const id of Object.keys(record.values))if(!fields.has(id))contentError(record.sourcePath,`values.${id}`,record.values[id],'unregistered database field');
  for(const field of database.fields){const value=record.values[field.id];if(value===undefined||value!==null&&typeof value!==(field.kind==='number'?'number':'string'))contentError(record.sourcePath,`values.${field.id}`,value,`expected ${field.kind}; unknown values must explicitly use null`);}
  if(record.contentId){
   const page=index.pagesByKey[`${record.locale}:${record.contentId}`];
   if(!page||page.template!=='database-detail'||!page.records.includes(record.id))contentError(record.sourcePath,'contentId',record.contentId,'requires a database-detail referencing this entry');
  }
  record.sources.forEach((source,i)=>validateTarget(index,record.locale,{type:'external',url:source.url},record.sourcePath,`sources.${i}.url`,production));
 }
 if(record.type==='boss-index'){
  record.entities.forEach((entry,i)=>entity(entry,`entities.${i}`));
  if(record.detail?.videoAssetId)validateAssetReference(index,record.detail.videoAssetId,record.sourcePath,'detail.videoAssetId',production);
  if(record.footer.link)validateTarget(index,record.locale,record.footer.link.target,record.sourcePath,'footer.link',production);
 }
 if(record.type==='character')entity(record,'character');
 if(record.type==='character-detail'){
  character(record.characterId,'characterId');
  if(production)validateTemplateRecord(index,`${record.locale}:${record.characterId}`,true);
  record.skills.forEach((skill,i)=>{if(skill.iconAssetId)validateAssetReference(index,skill.iconAssetId,record.sourcePath,`skills.${i}.iconAssetId`,production);});
 }
 if(record.type==='character-database'){
  character(record.leadCharacterId,'leadCharacterId');
  record.characterIds.forEach((id,i)=>{character(id,`characterIds.${i}`);if(production)validateTemplateRecord(index,`${record.locale}:${id}`,true);});
  record.relations.forEach((relation,i)=>{for(const field of ['fromId','toId'] as const){character(relation[field],`relations.${i}.${field}`);if(!record.characterIds.includes(relation[field]))contentError(record.sourcePath,`relations.${i}.${field}`,relation[field],'relation target must be in characterIds');}});
 }
 const item=(id:string,field:string,weaponOnly=false)=>{const entry=index.records[`${record.locale}:${id}`];if(!entry||(entry.type!=='weapon'&&(weaponOnly||entry.type!=='item')))contentError(record.sourcePath,field,id,`requires an existing ${weaponOnly?'weapon':'weapon or item'} record in the same language`);if(production)validateTemplateRecord(index,`${record.locale}:${id}`,true);return entry;};
 if(record.type==='weapon'||record.type==='item'){entity(record,record.type);if(record.iconAssetId)validateAssetReference(index,record.iconAssetId,record.sourcePath,'iconAssetId',production);}
 if(record.type==='systems-reference'){
  if(record.diagramAssetId)validateAssetReference(index,record.diagramAssetId,record.sourcePath,'diagramAssetId',production);
  record.itemIds.forEach((id,i)=>item(id,`itemIds.${i}`));
 }
 if(record.type==='weapon-detail'){
  item(record.weaponId,'weaponId',true);
  record.gallery.forEach((id,i)=>validateAssetReference(index,id,record.sourcePath,`gallery.${i}`,production));
  record.buildRefs.forEach((entry,i)=>validateTarget(index,record.locale,{type:'content',id:entry.contentId},record.sourcePath,`buildRefs.${i}.contentId`,production));
  record.matchups.forEach((entry,i)=>{if(entry.contentId)validateTarget(index,record.locale,{type:'content',id:entry.contentId},record.sourcePath,`matchups.${i}.contentId`,production);});
  record.pairings.forEach((entry,i)=>item(entry.recordId,`pairings.${i}.recordId`));
 }
 if(record.type==='build'){
  if(record.assetId)validateAssetReference(index,record.assetId,record.sourcePath,'assetId',production);
  record.weaponIds.forEach((id,i)=>item(id,`weaponIds.${i}`,true));
  const equipment=(rows:typeof record.equipment,field:string)=>rows.forEach((row,i)=>{if(row.recordId)item(row.recordId,`${field}.${i}.recordId`);});
  equipment(record.equipment,'equipment');record.variants.forEach((variant,i)=>equipment(variant.equipment,`variants.${i}.equipment`));
 }
 if(record.type==='build-library'){
  record.filterOptions.weapons.forEach((option,i)=>item(option.id,`filterOptions.weapons.${i}.id`,true));
  record.buildIds.forEach((id,i)=>{const build=index.records[`${record.locale}:${id}`];if(!build||build.type!=='build')contentError(record.sourcePath,`buildIds.${i}`,id,'requires an existing build record in the same language');
   build.classIds.forEach((id,j)=>{if(!record.filterOptions.classes.some(option=>option.id===id))contentError(build.sourcePath,`classIds.${j}`,id,'unregistered build class');});
   build.playstyleIds.forEach((style,j)=>{if(!record.filterOptions.playstyles.some(option=>option.id===style))contentError(build.sourcePath,`playstyleIds.${j}`,style,`not registered in ${record.sourcePath} filterOptions.playstyles`);});
   build.weaponIds.forEach((weapon,j)=>{if(!record.filterOptions.weapons.some(option=>option.id===weapon))contentError(build.sourcePath,`weaponIds.${j}`,weapon,`not registered in ${record.sourcePath} filterOptions.weapons`);});
   if(production)validateTemplateRecord(index,`${record.locale}:${id}`,true);
  });
  record.rescueRows.forEach((row,i)=>{if(!record.buildIds.includes(row.buildId))contentError(record.sourcePath,`rescueRows.${i}.buildId`,row.buildId,'rescue row must reference a listed build');});
  record.presets.forEach((preset,i)=>{if(!record.buildIds.includes(preset.buildId))contentError(record.sourcePath,`presets.${i}.buildId`,preset.buildId,'preset must reference a listed build');});
 }
 if(record.type==='weapon-explorer'){
  if(record.upgradeMedia.assetId)validateAssetReference(index,record.upgradeMedia.assetId,record.sourcePath,'upgradeMedia.assetId',production);
  record.patchHistory.forEach((row,i)=>{if(row.weaponId)item(row.weaponId,`patchHistory.${i}.weaponId`,true);});
  for(const field of ['comparison','playstylePicks','detailSections','unlockRows'] as const)record[field].forEach((row,i)=>item(row.weaponId,`${field}.${i}.weaponId`,true));
  record.tierRows.forEach((row,i)=>row.weaponIds.forEach((id,j)=>item(id,`tierRows.${i}.weaponIds.${j}`,true)));
  record.treeNodes.forEach((node,i)=>{if(node.iconAssetId)validateAssetReference(index,node.iconAssetId,record.sourcePath,`treeNodes.${i}.iconAssetId`,production);});
 }
 const mod=(id:string,field:string)=>{const entry=index.records[`${record.locale}:${id}`];if(!entry||entry.type!=='mod')contentError(record.sourcePath,field,id,'requires an existing mod record in the same language');if(production)validateTemplateRecord(index,`${record.locale}:${id}`,true);return entry;};
 if(record.type==='mod'){
  entity(record,'mod');
  if(record.contentId){const detailPage=index.pagesByKey[`${record.locale}:${record.contentId}`];if(!detailPage||detailPage.template!=='mod-detail')contentError(record.sourcePath,'contentId',record.contentId,'requires a mod-detail page');const details=detailPage.records.map(id=>index.records[`${record.locale}:${id}`]).find(row=>row?.type==='mod-detail');if(!details||details.type!=='mod-detail'||details.modId!==record.id)contentError(record.sourcePath,'contentId',record.contentId,'detail page must reference this mod');}
 }
 if(record.type==='mod-index'){
  if(record.safetyAssetId)validateAssetReference(index,record.safetyAssetId,record.sourcePath,'safetyAssetId',production);
  record.modIds.forEach((id,i)=>{const entry=mod(id,`modIds.${i}`);if(!record.categories.some(category=>category.id===entry.categoryId))contentError(entry.sourcePath,'categoryId',entry.categoryId,`not registered in ${record.sourcePath} categories`);entry.tagIds.forEach((id,j)=>{if(!record.tags.some(tag=>tag.id===id))contentError(entry.sourcePath,`tagIds.${j}`,id,`not registered in ${record.sourcePath} tags`);});});
 }
 if(record.type==='interactive-map'){
  record.regions.forEach((region,i)=>{if(region.imageAssetId)validateAssetReference(index,region.imageAssetId,record.sourcePath,`regions.${i}.imageAssetId`,production);});
  if(record.progressImageAssetId)validateAssetReference(index,record.progressImageAssetId,record.sourcePath,'progressImageAssetId',production);
  record.pins.forEach((pin,i)=>{if(pin.contentId)validateTarget(index,record.locale,{type:'content',id:pin.contentId},record.sourcePath,`pins.${i}.contentId`,production);});
 }
 if(record.type==='mod-detail'){
  mod(record.modId,'modId');record.requirements.forEach((row,i)=>{if(row.modId)mod(row.modId,`requirements.${i}.modId`);});record.conflicts.forEach((row,i)=>{if(row.modId)mod(row.modId,`conflicts.${i}.modId`);});
  record.gallery.forEach((id,i)=>validateAssetReference(index,id,record.sourcePath,`gallery.${i}`,production));
  for(const field of ['authorUrl','feedbackTarget'] as const)if(record[field])validateTarget(index,record.locale,{type:'external',url:record[field]},record.sourcePath,field,production);
  record.files.forEach((file,i)=>{if(file.url)validateTarget(index,record.locale,{type:'external',url:file.url},record.sourcePath,`files.${i}.url`,production);});
 }

}
