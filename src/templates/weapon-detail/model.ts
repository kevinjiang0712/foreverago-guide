import type {ContentIndex,IndexedPage} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';
export function weaponDetailModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='weapon-detail');
 if(!record||record.type!=='weapon-detail')throw new Error(`${page.sourcePath}: missing weapon-detail record`);
 const weapon=index.records[`${page.locale}:${record.weaponId}`];if(!weapon||weapon.type!=='weapon')throw new Error(`${record.id}: missing weapon ${record.weaponId}`);
 const ui=index.dictionaries[page.locale].ui;const icon:Asset=weapon.iconAssetId?index.assets[weapon.iconAssetId]:{id:'weapon-icon-placeholder',src:null,width:64,height:64,purpose:ui.weaponIcon,alt:{[page.locale]:ui.weaponIcon},position:'50% 50%',demo:false};
 const gallery=record.gallery.map(id=>index.assets[id]);
 const builds=record.buildRefs.map(ref=>{const href=index.translationGroups[ref.contentId][page.locale];return {...ref,href,title:index.routes[href].title};});
 const pairings=record.pairings.map(pair=>{const item=index.records[`${page.locale}:${pair.recordId}`];if(!item||(item.type!=='weapon'&&item.type!=='item'))throw new Error(`${record.id}: missing pairing ${pair.recordId}`);return {...pair,name:item.name,kind:item.kind,href:item.contentId?index.translationGroups[item.contentId][page.locale]:undefined};});
 const headings=[['overview',record.overview.eyebrow],['unlock',record.unlock.eyebrow],['tabs',record.detail.eyebrow],['matchups',record.matchupSection.eyebrow],['pairs',record.pairingSection.eyebrow],['faq',record.faqSection.eyebrow]].map(([id,text])=>({id,text,depth:2 as const}));
 return {record,weapon,icon,gallery,builds,pairings,headings};
}
