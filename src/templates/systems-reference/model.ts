import type {ContentIndex,IndexedPage} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';
export function systemsReferenceModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='systems-reference');
 if(!record||record.type!=='systems-reference')throw new Error(`${page.sourcePath}: missing systems-reference record`);
 const ui=index.dictionaries[page.locale].ui;
 const placeholder:Asset={id:'item-placeholder',src:null,width:800,height:800,purpose:ui.weaponArtwork,alt:{[page.locale]:ui.weaponArtwork},position:'50% 50%',demo:false};
 const items=record.itemIds.map(id=>{const item=index.records[`${page.locale}:${id}`];if(!item||(item.type!=='weapon'&&item.type!=='item'))throw new Error(`${record.id}: missing item ${id}`);return {...item,asset:item.assetId?index.assets[item.assetId]:placeholder,href:item.contentId?index.translationGroups[item.contentId][page.locale]:undefined};});
 const diagram:Asset=record.diagramAssetId?index.assets[record.diagramAssetId]:{id:'diagram-placeholder',src:null,width:1600,height:900,purpose:ui.mechanismDiagram,alt:{[page.locale]:ui.mechanismDiagram},position:'50% 50%',demo:false};
 return {record,items,diagram};
}
