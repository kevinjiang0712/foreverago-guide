import type {ContentIndex,IndexedPage} from '@/content/types';
export function modIndexModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='mod-index');if(!record||record.type!=='mod-index')throw new Error(`${page.sourcePath}: missing mod-index record`);
 const mods=record.modIds.map(id=>{const mod=index.records[`${page.locale}:${id}`];if(!mod||mod.type!=='mod')throw new Error(`${record.id}: missing mod ${id}`);return mod;});
 const headings=Object.entries(record.sections).map(([id,copy])=>({id,text:copy.eyebrow,depth:2 as const}));return {record,mods,headings};
}
