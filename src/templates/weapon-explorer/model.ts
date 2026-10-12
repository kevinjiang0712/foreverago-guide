import type {ContentIndex,IndexedPage} from '@/content/types';
export function weaponExplorerModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='weapon-explorer');if(!record||record.type!=='weapon-explorer')throw new Error(`${page.sourcePath}: missing weapon-explorer record`);
 const weapon=(id:string)=>{const entry=index.records[`${page.locale}:${id}`];if(!entry||entry.type!=='weapon')throw new Error(`${record.id}: missing weapon ${id}`);return {...entry,href:entry.contentId?index.translationGroups[entry.contentId][page.locale]:undefined};};
 const headings=[['comparison','comparison'],['explorer','explorer'],['playstyles','playstyles'],['details','details'],['tier-list','tier'],['unlocks','unlocks'],['upgrades','upgrades'],['changes','changes'],['faq','faq']].map(([id,key])=>({id,text:record.sections[key as keyof typeof record.sections].eyebrow,depth:2 as const}));
 const upgradeAsset=record.upgradeMedia.assetId?index.assets[record.upgradeMedia.assetId]:{id:'upgrade-inventory',src:null,width:1200,height:900,purpose:record.upgradeMedia.fallbackLabel,alt:{[page.locale]:record.upgradeMedia.fallbackLabel},position:'50% 50%',demo:false};
 return {record,weapon,headings,upgradeAsset};
}
