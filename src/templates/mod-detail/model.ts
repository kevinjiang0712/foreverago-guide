import type {ContentIndex,IndexedPage} from '@/content/types';
export function modDetailModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='mod-detail');if(!record||record.type!=='mod-detail')throw new Error(`${page.sourcePath}: missing mod-detail record`);
 const mod=index.records[`${page.locale}:${record.modId}`];if(!mod||mod.type!=='mod')throw new Error(`${record.id}: missing mod ${record.modId}`);
 const gallery=record.gallery.map(id=>index.assets[id]);const headings=Object.entries(record.sections).map(([id,copy])=>({id,text:copy.eyebrow,depth:2 as const}));return {record,mod,gallery,headings};
}
