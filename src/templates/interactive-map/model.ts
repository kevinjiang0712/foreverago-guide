import type {ContentIndex,IndexedPage} from '@/content/types';
export function interactiveMapModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='interactive-map');
 if(!record||record.type!=='interactive-map')throw new Error(`${page.sourcePath}: missing interactive-map record`);
 const headings=Object.entries(record.sections).map(([id,copy])=>({id,text:copy.eyebrow,depth:2 as const}));
 const pinLinks=Object.fromEntries(record.pins.filter(pin=>pin.contentId).map(pin=>[pin.id,index.translationGroups[pin.contentId!][page.locale]]));
 return {record,headings,pinLinks};
}
