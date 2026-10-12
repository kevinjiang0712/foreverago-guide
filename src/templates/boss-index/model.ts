import type {ContentIndex,IndexedPage} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';
export function bossIndexModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='boss-index');
 if(!record||record.type!=='boss-index')throw new Error(`${page.sourcePath}: missing boss-index record`);
 const ui=index.dictionaries[page.locale].ui;
 const placeholder:Asset={id:'boss-placeholder',src:null,width:1400,height:1000,purpose:ui.bossArtwork,alt:{[page.locale]:ui.bossArtwork},position:'50% 50%',demo:false};
 const entries=record.entities.map(entry=>({...entry,asset:entry.assetId?index.assets[entry.assetId]:placeholder,href:entry.contentId?index.translationGroups[entry.contentId]?.[page.locale]:undefined,difficultyLabel:record.filterOptions.find(option=>option.id===entry.difficultyId)?.label??ui.unknown}));
 return {record,entries,placeholder};
}
export type BossCardEntry=ReturnType<typeof bossIndexModel>['entries'][number];
